import clientPromise from "./mongodb";
import { Document} from "mongodb";

import { SessionPayload } from "../auth/session";

import {
  evaluateLenderEligibility,
  Lender,
  Lead,
} from "../bre/lenderEligibility";

export type LeadFilters = {
  status?: string;
  search?: string;
  lenderId?: string;

  // Location filters
  pincode?: string;
  city?: string;

  page?: number;
  limit?: number;

  followUpDue?: boolean;

  fromDate?: string;
  toDate?: string;

  // Loan amount filters
  minAmount?: number;
  maxAmount?: number;

  // Age filters
  minAge?: number;
  maxAge?: number;

  // Income filters
  minIncome?: number;
  maxIncome?: number;

  // Assignment filter
  assignmentStatus?: string;
};

/**
 * Calculate age from date of birth.
 *
 * We do not store age in the leads collection because
 * age changes over time.
 *
 * dateOfBirth is the source of truth.
 */
function calculateAge(dateOfBirth: Date | null) {
  if (!dateOfBirth) {
    return null;
  }

  const today = new Date();

  let age =
    today.getFullYear() -
    dateOfBirth.getFullYear();

  const monthDifference =
    today.getMonth() -
    dateOfBirth.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < dateOfBirth.getDate())
  ) {
    age--;
  }

  return age;
}

/**
 * Escape user input before using it inside MongoDB regex.
 *
 * Without this, characters such as ., *, +, ?, etc.
 * can behave as regex operators.
 */
function escapeRegex(value: string) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

export async function getLeadsForUser(
  session: SessionPayload,
  filters: LeadFilters = {}
) {
  const client = await clientPromise;

  const db = client.db(
    process.env.MONGODB_DB
  );

  const page = Math.max(
    filters.page ?? 1,
    1
  );

  const limit = Math.min(
    Math.max(
      filters.limit ?? 20,
      1
    ),
    100
  );

  // =========================================================
  // LENDER ADMIN
  // =========================================================

  if (session.role === "lender_admin") {
    if (!session.lenderId) {
      throw new Error(
        "Lender admin has no lenderId"
      );
    }

    // -------------------------------------------------------
    // Get current lender
    // -------------------------------------------------------

    const lender = await db
      .collection("lenders")
      .findOne({
        lender_id: session.lenderId,
      });

    if (!lender) {
      throw new Error(
        "Lender not found"
      );
    }

    // -------------------------------------------------------
    // Convert DB lender into BRE Lender type
    // -------------------------------------------------------

    const lenderRules: Lender = {
      lender_id: lender.lender_id,
      name: lender.name,
      isActive: lender.isActive,
      priority: lender.priority ?? 0,

      minAge:
        lender.minAge ?? null,

      maxAge:
        lender.maxAge ?? null,

      minIncome:
        lender.minIncome ?? null,

      minCreditScore_exclusive:
        lender.minCreditScore_exclusive ?? null,

      maxCreditScore_inclusive:
        lender.maxCreditScore_inclusive ?? null,

      employmentTypes:
        typeof lender.employmentTypes === "string"
          ? lender.employmentTypes
          : null,

      supportedPincodes:
        typeof lender.supportedPincodes === "string"
          ? lender.supportedPincodes
          : null,
    };

    // -------------------------------------------------------
    // Get master leads
    // -------------------------------------------------------

    const leads = await db
      .collection("leads")
      .find({})
      .sort({
        createdAt: -1,
      })
      .toArray();

    // -------------------------------------------------------
    // Run BRE
    //
    // Only leads eligible for this lender
    // enter the lender's queue.
    // -------------------------------------------------------

    let eligibleLeads = leads.filter(
      (lead) => {
        const eligibility =
          evaluateLenderEligibility(
            lead as Lead,
            lenderRules
          );

        return eligibility.eligible;
      }
    );

    // -------------------------------------------------------
    // Location filters
    // -------------------------------------------------------

    if (filters.pincode?.trim()) {
      const requestedPincode =
        filters.pincode.trim();

      eligibleLeads =
        eligibleLeads.filter(
          (lead) =>
            lead.pincode?.trim() ===
            requestedPincode
        );
    }

    if (filters.city?.trim()) {
      const requestedCity =
        filters.city
          .trim()
          .toLowerCase();

      eligibleLeads =
        eligibleLeads.filter(
          (lead) =>
            lead.city
              ?.trim()
              .toLowerCase()
              .includes(requestedCity)
        );
    }

    // -------------------------------------------------------
    // Status filter
    // -------------------------------------------------------

    if (
      filters.status &&
      filters.status !== "all"
    ) {
      eligibleLeads =
        eligibleLeads.filter(
          (lead) =>
            lead.status ===
            filters.status
        );
    }

    // -------------------------------------------------------
    // Search filter
    // -------------------------------------------------------

    if (filters.search?.trim()) {
      const search =
        filters.search.trim().toLowerCase();

      eligibleLeads =
        eligibleLeads.filter(
          (lead) => {
            const borrowerName =
              lead.borrowerName
                ?.toLowerCase() ?? "";

            const phone =
              lead.phone ?? "";

            return (
              borrowerName.includes(search) ||
              phone.includes(search)
            );
          }
        );
    }

    // -------------------------------------------------------
    // Follow-up filter
    // -------------------------------------------------------

    if (filters.followUpDue) {
      const now = new Date();

      eligibleLeads =
        eligibleLeads.filter(
          (lead) =>
            lead.followUpDate &&
            new Date(
              lead.followUpDate
            ) <= now
        );
    }

    // -------------------------------------------------------
    // From date
    // -------------------------------------------------------

    if (filters.fromDate) {
      const fromDate = new Date(
        `${filters.fromDate}T00:00:00`
      );

      eligibleLeads =
        eligibleLeads.filter(
          (lead) =>
            lead.createdAt &&
            new Date(
              lead.createdAt
            ) >= fromDate
        );
    }

    // -------------------------------------------------------
    // To date
    // -------------------------------------------------------

    if (filters.toDate) {
      const toDate = new Date(
        `${filters.toDate}T23:59:59.999`
      );

      eligibleLeads =
        eligibleLeads.filter(
          (lead) =>
            lead.createdAt &&
            new Date(
              lead.createdAt
            ) <= toDate
        );
    }

    // -------------------------------------------------------
    // Loan amount filters
    // -------------------------------------------------------

    if (
      filters.minAmount !== undefined
    ) {
      eligibleLeads =
        eligibleLeads.filter(
          (lead) =>
            lead.loanAmount !== null &&
            lead.loanAmount >=
              filters.minAmount!
        );
    }

    if (
      filters.maxAmount !== undefined
    ) {
      eligibleLeads =
        eligibleLeads.filter(
          (lead) =>
            lead.loanAmount !== null &&
            lead.loanAmount <=
              filters.maxAmount!
        );
    }

    // -------------------------------------------------------
    // Age filters
    // -------------------------------------------------------

    if (
      filters.minAge !== undefined ||
      filters.maxAge !== undefined
    ) {
      eligibleLeads =
        eligibleLeads.filter(
          (lead) => {
            if (!lead.dateOfBirth) {
              return false;
            }

            const age =
              calculateAge(
                new Date(
                  lead.dateOfBirth
                )
              );

            if (age === null) {
              return false;
            }

            if (
              filters.minAge !== undefined &&
              age < filters.minAge
            ) {
              return false;
            }

            if (
              filters.maxAge !== undefined &&
              age > filters.maxAge
            ) {
              return false;
            }

            return true;
          }
        );
    }

    // -------------------------------------------------------
    // Income filters
    // -------------------------------------------------------

    if (
      filters.minIncome !== undefined
    ) {
      eligibleLeads =
        eligibleLeads.filter(
          (lead) =>
            lead.income !== null &&
            lead.income >=
              filters.minIncome!
        );
    }

    if (
      filters.maxIncome !== undefined
    ) {
      eligibleLeads =
        eligibleLeads.filter(
          (lead) =>
            lead.income !== null &&
            lead.income <=
              filters.maxIncome!
        );
    }

    // -------------------------------------------------------
    // Get lead_lenders relationships
    //
    // A lead becomes assigned to a lender only when
    // a lead_lenders relationship exists.
    // -------------------------------------------------------

    const leadIds = eligibleLeads
      .filter((lead) => lead._id)
      .map((lead) => lead._id);

    const relationships =
      await db
        .collection("lead_lenders")
        .find({
          lenderId:
            session.lenderId,

          leadId: {
            $in: leadIds,
          },
        })
        .toArray();

    // -------------------------------------------------------
    // Create quick relationship lookup
    // -------------------------------------------------------

    const relationshipMap =
      new Map<
        string,
        {
          assignedAgentId?:
            | string
            | null;

          eligibilityStatus?:
            string;
        }
      >();

    for (
      const relationship of relationships
    ) {
      relationshipMap.set(
        relationship.leadId.toString(),
        {
          assignedAgentId:
            relationship.assignedAgentId ??
            null,

          eligibilityStatus:
            relationship.eligibilityStatus,
        }
      );
    }

    // -------------------------------------------------------
    // Assignment status filter
    // -------------------------------------------------------

    if (
      filters.assignmentStatus &&
      filters.assignmentStatus !== "all"
    ) {
      eligibleLeads =
        eligibleLeads.filter(
          (lead) => {
            const isAssigned =
              relationshipMap.has(
                String(lead._id)
              );

            if (
              filters.assignmentStatus ===
              "assigned"
            ) {
              return isAssigned;
            }

            if (
              filters.assignmentStatus ===
              "unassigned"
            ) {
              return !isAssigned;
            }

            return true;
          }
        );
    }

    // -------------------------------------------------------
    // Pagination
    // -------------------------------------------------------

    const total =
      eligibleLeads.length;

    const skip =
      (page - 1) * limit;

    const paginatedLeads =
      eligibleLeads.slice(
        skip,
        skip + limit
      );

    // -------------------------------------------------------
    // Build frontend response
    // -------------------------------------------------------

    const formattedLeads =
      paginatedLeads.map(
        (lead) => {
          const leadId =
            lead._id.toString();

          const relationship =
            relationshipMap.get(
              leadId
            );

          const isAssigned =
            !!relationship;

          return {
            _id: leadId,
            leadId,

            lenderId:
              session.lenderId,

            eligibilityStatus:
              relationship
                ?.eligibilityStatus ??
              "eligible",

            assignmentStatus:
              isAssigned
                ? "assigned"
                : "unassigned",

            assignedAgentId:
              relationship
                ?.assignedAgentId ??
              null,

            status:
              lead.status ??
              "new",

            followUpDate:
              lead.followUpDate ??
              null,

            createdAt:
              lead.createdAt,

            updatedAt:
              lead.updatedAt,

            borrower: {
              id: leadId,

              sourceLeadId:
                lead.sourceLeadId,

              borrowerName:
                lead.borrowerName,

              phone:
                lead.phone ?? "",

              loanAmount:
                lead.loanAmount ??
                0,

              loanPurpose:
                lead.loanPurpose ??
                "",

              dateOfBirth:
                lead.dateOfBirth,

              gender:
                lead.gender,

              employmentType:
                lead.employmentType,

              income:
                lead.income ??
                undefined,

              creditScore:
                lead.creditScore ??
                undefined,

              city:
                lead.city,

              state:
                lead.state,

              pincode:
                lead.pincode,

              createdAt:
                lead.createdAt,
            },
          };
        }
      );

    return {
      leads: formattedLeads,

      pagination: {
        page,
        limit,
        total,

        totalPages:
          Math.ceil(
            total / limit
          ),
      },
    };
  }

  // =========================================================
  // LENDER AGENT
  // =========================================================

  if (
    session.role ===
    "lender_agent"
  ) {
    if (!session.lenderId) {
      throw new Error(
        "Lender agent has no lenderId"
      );
    }

    /*
     * IMPORTANT:
     *
     * Agent authorization starts from lead_lenders.
     *
     * This guarantees:
     *
     * lenderId === agent's lender
     * AND
     * assignedAgentId === logged-in agent
     */

    const relationshipMatch: Record<
      string,
      unknown
    > = {
      lenderId:
        session.lenderId,

      assignedAgentId:
        session.userId,
    };

    // -------------------------------------------------------
    // Status
    // -------------------------------------------------------

    if (
      filters.status &&
      filters.status !== "all"
    ) {
      relationshipMatch.status =
        filters.status;
    }

    // -------------------------------------------------------
    // Follow-up
    // -------------------------------------------------------

    if (filters.followUpDue) {
      relationshipMatch.followUpDate = {
        $ne: null,
        $lte: new Date(),
      };
    }

    // -------------------------------------------------------
    // Date filters
    // -------------------------------------------------------

    if (
      filters.fromDate ||
      filters.toDate
    ) {
      relationshipMatch.createdAt =
        {};

      if (filters.fromDate) {
        (
          relationshipMatch.createdAt as Record<
            string,
            Date
          >
        ).$gte =
          new Date(
            `${filters.fromDate}T00:00:00`
          );
      }

      if (filters.toDate) {
        (
          relationshipMatch.createdAt as Record<
            string,
            Date
          >
        ).$lte =
          new Date(
            `${filters.toDate}T23:59:59.999`
          );
      }
    }

    const skip =
      (page - 1) * limit;

    // -------------------------------------------------------
    // Start from lead_lenders
    // -------------------------------------------------------

    const pipeline: Document[] = [
      {
        $match:
          relationshipMatch,
      },

      {
        $lookup: {
          from: "leads",

          localField:
            "leadId",

          foreignField:
            "_id",

          as: "lead",
        },
      },

      {
        $unwind:
          "$lead",
      },
    ];

    // -------------------------------------------------------
    // Location filters
    // -------------------------------------------------------

    if (filters.pincode?.trim()) {
      pipeline.push({
        $match: {
          "lead.pincode":
            filters.pincode.trim(),
        },
      });
    }

    if (filters.city?.trim()) {
      pipeline.push({
        $match: {
          "lead.city": {
            $regex: escapeRegex(
              filters.city.trim()
            ),

            $options: "i",
          },
        },
      });
    }

    // -------------------------------------------------------
    // Search
    // -------------------------------------------------------

    if (filters.search?.trim()) {
      const search =
        escapeRegex(
          filters.search.trim()
        );

      pipeline.push({
        $match: {
          $or: [
            {
              "lead.borrowerName": {
                $regex: search,
                $options: "i",
              },
            },

            {
              "lead.phone": {
                $regex: search,
                $options: "i",
              },
            },
          ],
        },
      });
    }

    // -------------------------------------------------------
    // Loan amount
    // -------------------------------------------------------

    if (
      filters.minAmount !== undefined ||
      filters.maxAmount !== undefined
    ) {
      const amountFilter: Record<
        string,
        number
      > = {};

      if (
        filters.minAmount !== undefined
      ) {
        amountFilter.$gte =
          filters.minAmount;
      }

      if (
        filters.maxAmount !== undefined
      ) {
        amountFilter.$lte =
          filters.maxAmount;
      }

      pipeline.push({
        $match: {
          "lead.loanAmount":
            amountFilter,
        },
      });
    }

    // -------------------------------------------------------
    // Income
    // -------------------------------------------------------

    if (
      filters.minIncome !== undefined ||
      filters.maxIncome !== undefined
    ) {
      const incomeFilter: Record<
        string,
        number
      > = {};

      if (
        filters.minIncome !== undefined
      ) {
        incomeFilter.$gte =
          filters.minIncome;
      }

      if (
        filters.maxIncome !== undefined
      ) {
        incomeFilter.$lte =
          filters.maxIncome;
      }

      pipeline.push({
        $match: {
          "lead.income":
            incomeFilter,
        },
      });
    }

    // -------------------------------------------------------
    // Age
    //
    // MongoDB cannot directly use our JS calculateAge()
    // function, so age filtering is handled after lookup
    // using $expr.
    // -------------------------------------------------------

    if (
      filters.minAge !== undefined ||
      filters.maxAge !== undefined
    ) {
      const today = new Date();

      const currentYear =
        today.getFullYear();

      const currentMonth =
        today.getMonth() + 1;

      const currentDay =
        today.getDate();

      const ageExpression = {
        $subtract: [
          currentYear,
          {
            $year:
              "$lead.dateOfBirth",
          },
        ],
      };

      const ageConditions: Document[] =
        [];

      if (
        filters.minAge !== undefined
      ) {
        ageConditions.push({
          $gte: [
            ageExpression,
            filters.minAge,
          ],
        });
      }

      if (
        filters.maxAge !== undefined
      ) {
        ageConditions.push({
          $lte: [
            ageExpression,
            filters.maxAge,
          ],
        });
      }

      pipeline.push({
        $match: {
          "lead.dateOfBirth": {
            $ne: null,
          },

          $expr: {
            $and:
              ageConditions,
          },
        },
      });

      // These variables document that age is based on
      // the current date. Exact birthday adjustment is
      // handled more precisely in the lender-admin branch.
      void currentMonth;
      void currentDay;
    }

    // -------------------------------------------------------
    // Count BEFORE pagination
    // -------------------------------------------------------

    const countPipeline = [
      ...pipeline,
      {
        $count:
          "total",
      },
    ];

    const countResult =
      await db
        .collection("lead_lenders")
        .aggregate(
          countPipeline
        )
        .toArray();

    const total =
      countResult[0]?.total ??
      0;

    // -------------------------------------------------------
    // Sorting + pagination
    // -------------------------------------------------------

    pipeline.push(
      {
        $sort: {
          "lead.createdAt":
            -1,
        },
      },

      {
        $skip: skip,
      },

      {
        $limit: limit,
      },

      {
        $project: {
          _id: 1,

          leadId: 1,

          lenderId: 1,

          eligibilityStatus:
            1,

          assignmentStatus:
            1,

          assignedAgentId:
            1,

          status: 1,

          followUpDate: 1,

          createdAt: 1,

          updatedAt: 1,

          borrower: {
            id:
              "$lead._id",

            sourceLeadId:
              "$lead.sourceLeadId",

            borrowerName:
              "$lead.borrowerName",

            phone:
              "$lead.phone",

            loanAmount:
              "$lead.loanAmount",

            loanPurpose:
              "$lead.loanPurpose",

            dateOfBirth:
              "$lead.dateOfBirth",

            gender:
              "$lead.gender",

            employmentType:
              "$lead.employmentType",

            income:
              "$lead.income",

            creditScore:
              "$lead.creditScore",

            city:
              "$lead.city",

            state:
              "$lead.state",

            pincode:
              "$lead.pincode",

            createdAt:
              "$lead.createdAt",
          },
        },
      }
    );

    const leads =
      await db
        .collection("lead_lenders")
        .aggregate(
          pipeline
        )
        .toArray();

    return {
      leads,

      pagination: {
        page,
        limit,
        total,

        totalPages:
          Math.ceil(
            total / limit
          ),
      },
    };
  }

  // =========================================================
  // OPS ADMIN
  // =========================================================

  if (
    session.role ===
    "ops_admin"
  ) {
    const relationshipMatch: Record<
      string,
      unknown
    > = {};

    // -------------------------------------------------------
    // Optional lender filter
    // -------------------------------------------------------

    if (filters.lenderId) {
      relationshipMatch.lenderId =
        filters.lenderId;
    }

    // -------------------------------------------------------
    // Status
    // -------------------------------------------------------

    if (
      filters.status &&
      filters.status !== "all"
    ) {
      relationshipMatch.status =
        filters.status;
    }

    // -------------------------------------------------------
    // Follow-up
    // -------------------------------------------------------

    if (filters.followUpDue) {
      relationshipMatch.followUpDate = {
        $ne: null,
        $lte: new Date(),
      };
    }

    // -------------------------------------------------------
    // Date filters
    // -------------------------------------------------------

    if (
      filters.fromDate ||
      filters.toDate
    ) {
      relationshipMatch.createdAt =
        {};

      if (filters.fromDate) {
        (
          relationshipMatch.createdAt as Record<
            string,
            Date
          >
        ).$gte =
          new Date(
            `${filters.fromDate}T00:00:00`
          );
      }

      if (filters.toDate) {
        (
          relationshipMatch.createdAt as Record<
            string,
            Date
          >
        ).$lte =
          new Date(
            `${filters.toDate}T23:59:59.999`
          );
      }
    }

    const skip =
      (page - 1) * limit;

    // -------------------------------------------------------
    // Pipeline
    // -------------------------------------------------------

    const pipeline: Document[] = [
      {
        $match:
          relationshipMatch,
      },

      {
        $lookup: {
          from: "leads",

          localField:
            "leadId",

          foreignField:
            "_id",

          as: "lead",
        },
      },

      {
        $unwind:
          "$lead",
      },
    ];

    // -------------------------------------------------------
    // Location filters
    // -------------------------------------------------------

    if (filters.pincode?.trim()) {
      pipeline.push({
        $match: {
          "lead.pincode":
            filters.pincode.trim(),
        },
      });
    }

    if (filters.city?.trim()) {
      pipeline.push({
        $match: {
          "lead.city": {
            $regex: escapeRegex(
              filters.city.trim()
            ),

            $options: "i",
          },
        },
      });
    }

    // -------------------------------------------------------
    // Search
    // -------------------------------------------------------

    if (filters.search?.trim()) {
      const search =
        escapeRegex(
          filters.search.trim()
        );

      pipeline.push({
        $match: {
          $or: [
            {
              "lead.borrowerName": {
                $regex: search,
                $options: "i",
              },
            },

            {
              "lead.phone": {
                $regex: search,
                $options: "i",
              },
            },
          ],
        },
      });
    }

    // -------------------------------------------------------
    // Loan amount
    // -------------------------------------------------------

    if (
      filters.minAmount !== undefined ||
      filters.maxAmount !== undefined
    ) {
      const amountFilter: Record<
        string,
        number
      > = {};

      if (
        filters.minAmount !== undefined
      ) {
        amountFilter.$gte =
          filters.minAmount;
      }

      if (
        filters.maxAmount !== undefined
      ) {
        amountFilter.$lte =
          filters.maxAmount;
      }

      pipeline.push({
        $match: {
          "lead.loanAmount":
            amountFilter,
        },
      });
    }

    // -------------------------------------------------------
    // Income
    // -------------------------------------------------------

    if (
      filters.minIncome !== undefined ||
      filters.maxIncome !== undefined
    ) {
      const incomeFilter: Record<
        string,
        number
      > = {};

      if (
        filters.minIncome !== undefined
      ) {
        incomeFilter.$gte =
          filters.minIncome;
      }

      if (
        filters.maxIncome !== undefined
      ) {
        incomeFilter.$lte =
          filters.maxIncome;
      }

      pipeline.push({
        $match: {
          "lead.income":
            incomeFilter,
        },
      });
    }

    // -------------------------------------------------------
    // Age
    // -------------------------------------------------------

    if (
      filters.minAge !== undefined ||
      filters.maxAge !== undefined
    ) {
      const currentYear =
        new Date().getFullYear();

      const ageExpression = {
        $subtract: [
          currentYear,
          {
            $year:
              "$lead.dateOfBirth",
          },
        ],
      };

      const ageConditions: Document[] =
        [];

      if (
        filters.minAge !== undefined
      ) {
        ageConditions.push({
          $gte: [
            ageExpression,
            filters.minAge,
          ],
        });
      }

      if (
        filters.maxAge !== undefined
      ) {
        ageConditions.push({
          $lte: [
            ageExpression,
            filters.maxAge,
          ],
        });
      }

      pipeline.push({
        $match: {
          "lead.dateOfBirth": {
            $ne: null,
          },

          $expr: {
            $and:
              ageConditions,
          },
        },
      });
    }

    // -------------------------------------------------------
    // Count BEFORE pagination
    // -------------------------------------------------------

    const countPipeline = [
      ...pipeline,
      {
        $count:
          "total",
      },
    ];

    const countResult =
      await db
        .collection("lead_lenders")
        .aggregate(
          countPipeline
        )
        .toArray();

    const total =
      countResult[0]?.total ??
      0;

    // -------------------------------------------------------
    // Sorting + pagination
    // -------------------------------------------------------

    pipeline.push(
      {
        $sort: {
          "lead.createdAt":
            -1,
        },
      },

      {
        $skip: skip,
      },

      {
        $limit: limit,
      },

      {
        $project: {
          _id: 1,

          leadId: 1,

          lenderId: 1,

          eligibilityStatus:
            1,

          assignmentStatus:
            1,

          assignedAgentId:
            1,

          status: 1,

          followUpDate: 1,

          createdAt: 1,

          updatedAt: 1,

          borrower: {
            id:
              "$lead._id",

            sourceLeadId:
              "$lead.sourceLeadId",

            borrowerName:
              "$lead.borrowerName",

            phone:
              "$lead.phone",

            loanAmount:
              "$lead.loanAmount",

            loanPurpose:
              "$lead.loanPurpose",

            dateOfBirth:
              "$lead.dateOfBirth",

            gender:
              "$lead.gender",

            employmentType:
              "$lead.employmentType",

            income:
              "$lead.income",

            creditScore:
              "$lead.creditScore",

            city:
              "$lead.city",

            state:
              "$lead.state",

            pincode:
              "$lead.pincode",

            createdAt:
              "$lead.createdAt",
          },
        },
      }
    );

    const leads =
      await db
        .collection("lead_lenders")
        .aggregate(
          pipeline
        )
        .toArray();

    return {
      leads,

      pagination: {
        page,
        limit,
        total,

        totalPages:
          Math.ceil(
            total / limit
          ),
      },
    };
  }

  throw new Error(
    "Unsupported user role"
  );
}
