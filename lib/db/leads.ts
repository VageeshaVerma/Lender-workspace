import clientPromise from "./mongodb";

import { Document } from "mongodb";

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

  page?: number;
  limit?: number;

  followUpDue?: boolean;

  fromDate?: string;
  toDate?: string;

  minAmount?: number;
  maxAmount?: number;

  assignmentStatus?: string;
};

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

    // --------------------------------------------------
    // Get current lender
    // --------------------------------------------------

    const lender = await db
      .collection("lenders")
      .findOne({
        lender_id: session.lenderId,
      });

    if (!lender) {
      throw new Error("Lender not found");
    }

    // --------------------------------------------------
    // Convert DB lender into BRE Lender type
    // --------------------------------------------------

    const lenderRules: Lender = {
      lender_id: lender.lender_id,

      name: lender.name,

      isActive: lender.isActive,

      priority:
        lender.priority ?? 0,

      minAge:
        lender.minAge ?? null,

      maxAge:
        lender.maxAge ?? null,

      minIncome:
        lender.minIncome ?? null,

      minCreditScore_exclusive:
        lender.minCreditScore_exclusive ??
        null,

      maxCreditScore_inclusive:
        lender.maxCreditScore_inclusive ??
        null,

      employmentTypes:
        typeof lender.employmentTypes ===
        "string"
          ? lender.employmentTypes
          : null,

      supportedPincodes:
        typeof lender.supportedPincodes ===
        "string"
          ? lender.supportedPincodes
          : null,
    };

    // --------------------------------------------------
    // Get master leads
    // --------------------------------------------------

    const leads = await db
      .collection("leads")
      .find({})
      .sort({
        createdAt: -1,
      })
      .toArray();

    // --------------------------------------------------
    // Keep only leads eligible for this lender
    // --------------------------------------------------

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

    // --------------------------------------------------
    // Get lead_lenders relationships
    // for this lender
    // --------------------------------------------------

    const leadIds = eligibleLeads
      .filter((lead) => lead._id)
      .map((lead) => lead._id);

    const relationships = await db
      .collection("lead_lenders")
      .find({
        lenderId:
          session.lenderId,

        leadId: {
          $in: leadIds,
        },
      })
      .toArray();

    // --------------------------------------------------
    // Create quick lookup map
    // --------------------------------------------------

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

    // --------------------------------------------------
    // Assignment status filter
    // --------------------------------------------------
    //
    // all:
    //     Show both assigned and unassigned leads.
    //
    // assigned:
    //     Show only leads that have a
    //     lead_lenders relationship for
    //     this lender.
    //
    // unassigned:
    //     Show only eligible master leads
    //     that do NOT have a relationship
    //     for this lender.
    //
    // We use relationshipMap because assignment
    // belongs to lead_lenders, not leads.
    // --------------------------------------------------

    if (
      filters.assignmentStatus ===
      "assigned"
    ) {
      eligibleLeads =
        eligibleLeads.filter(
          (lead) =>
            relationshipMap.has(
              String(lead._id)
            )
        );
    }

    if (
      filters.assignmentStatus ===
      "unassigned"
    ) {
      eligibleLeads =
        eligibleLeads.filter(
          (lead) =>
            !relationshipMap.has(
              String(lead._id)
            )
        );
    }

    // --------------------------------------------------
    // Status filter
    // --------------------------------------------------

    if (filters.status) {
      eligibleLeads =
        eligibleLeads.filter(
          (lead) =>
            lead.status ===
            filters.status
        );
    }

    // --------------------------------------------------
    // Search filter
    // --------------------------------------------------

    if (filters.search) {
      const searchRegex =
        new RegExp(
          filters.search,
          "i"
        );

      eligibleLeads =
        eligibleLeads.filter(
          (lead) => {
            return (
              searchRegex.test(
                lead.borrowerName ??
                  ""
              ) ||
              searchRegex.test(
                lead.phone ?? ""
              )
            );
          }
        );
    }

    // --------------------------------------------------
    // Follow-up filter
    // --------------------------------------------------

    if (filters.followUpDue) {
      const now = new Date();

      eligibleLeads =
        eligibleLeads.filter(
          (lead) => {
            if (
              !lead.followUpDate
            ) {
              return false;
            }

            return (
              new Date(
                lead.followUpDate
              ) <= now
            );
          }
        );
    }

    // --------------------------------------------------
    // From date filter
    // --------------------------------------------------

    if (filters.fromDate) {
      const fromDate =
        new Date(
          filters.fromDate
        );

      eligibleLeads =
        eligibleLeads.filter(
          (lead) => {
            if (
              !lead.createdAt
            ) {
              return false;
            }

            return (
              new Date(
                lead.createdAt
              ) >= fromDate
            );
          }
        );
    }

    // --------------------------------------------------
    // To date filter
    // --------------------------------------------------

    if (filters.toDate) {
      const toDate =
        new Date(
          filters.toDate
        );

      toDate.setHours(
        23,
        59,
        59,
        999
      );

      eligibleLeads =
        eligibleLeads.filter(
          (lead) => {
            if (
              !lead.createdAt
            ) {
              return false;
            }

            return (
              new Date(
                lead.createdAt
              ) <= toDate
            );
          }
        );
    }

    // --------------------------------------------------
    // Minimum loan amount
    // --------------------------------------------------

    if (
      filters.minAmount !==
      undefined
    ) {
      eligibleLeads =
        eligibleLeads.filter(
          (lead) =>
            lead.loanAmount !==
              null &&
            lead.loanAmount >=
              filters.minAmount!
        );
    }

    // --------------------------------------------------
    // Maximum loan amount
    // --------------------------------------------------

    if (
      filters.maxAmount !==
      undefined
    ) {
      eligibleLeads =
        eligibleLeads.filter(
          (lead) =>
            lead.loanAmount !==
              null &&
            lead.loanAmount <=
              filters.maxAmount!
        );
    }

    // --------------------------------------------------
    // Pagination
    // --------------------------------------------------

    const total =
      eligibleLeads.length;

    const skip =
      (page - 1) * limit;

    const paginatedLeads =
      eligibleLeads.slice(
        skip,
        skip + limit
      );

    // --------------------------------------------------
    // Build frontend response
    // --------------------------------------------------

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
      leads:
        formattedLeads,

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

  /*
   * A lender agent can ONLY see leads:
   *
   * 1. Belonging to their lender
   * 2. Assigned specifically to them
   */

  if (
    session.role ===
    "lender_agent"
  ) {
    if (!session.lenderId) {
      throw new Error(
        "Lender agent has no lenderId"
      );
    }

    // --------------------------------------------------
    // Build relationship filter
    // --------------------------------------------------

    const relationshipMatch: Record<
      string,
      unknown
    > = {
      lenderId:
        session.lenderId,

      assignedAgentId:
        session.userId,
    };

    // --------------------------------------------------
    // Status filter
    // --------------------------------------------------

    if (filters.status) {
      relationshipMatch.status =
        filters.status;
    }

    // --------------------------------------------------
    // Follow-up filter
    // --------------------------------------------------

    if (filters.followUpDue) {
      relationshipMatch.followUpDate =
        {
          $ne: null,
          $lte: new Date(),
        };
    }

    // --------------------------------------------------
    // Date filters
    // --------------------------------------------------

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
            filters.fromDate
          );
      }

      if (filters.toDate) {
        const endDate =
          new Date(
            filters.toDate
          );

        endDate.setHours(
          23,
          59,
          59,
          999
        );

        (
          relationshipMatch.createdAt as Record<
            string,
            Date
          >
        ).$lte =
          endDate;
      }
    }

    const skip =
      (page - 1) * limit;

    // --------------------------------------------------
    // Start from lead_lenders
    // --------------------------------------------------

    const pipeline: Document[] =
      [
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

    // --------------------------------------------------
    // Search
    // --------------------------------------------------

    if (filters.search) {
      const search =
        filters.search.trim();

      pipeline.push({
        $match: {
          $or: [
            {
              "lead.borrowerName":
                {
                  $regex:
                    search,

                  $options:
                    "i",
                },
            },

            {
              "lead.phone":
                {
                  $regex:
                    search,

                  $options:
                    "i",
                },
            },
          ],
        },
      });
    }

    // --------------------------------------------------
    // Loan amount filter
    // --------------------------------------------------

    if (
      filters.minAmount !==
        undefined ||
      filters.maxAmount !==
        undefined
    ) {
      const amountFilter: Record<
        string,
        number
      > = {};

      if (
        filters.minAmount !==
        undefined
      ) {
        amountFilter.$gte =
          filters.minAmount;
      }

      if (
        filters.maxAmount !==
        undefined
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

    // --------------------------------------------------
    // Count before pagination
    // --------------------------------------------------

    const countPipeline = [
      ...pipeline,

      {
        $count:
          "total",
      },
    ];

    const countResult =
      await db
        .collection(
          "lead_lenders"
        )
        .aggregate(
          countPipeline
        )
        .toArray();

    const total =
      countResult[0]?.total ??
      0;

    // --------------------------------------------------
    // Sorting + pagination
    // --------------------------------------------------

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

          followUpDate:
            1,

          createdAt: 1,

          updatedAt: 1,

          borrower: {
            id: "$lead._id",

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
        .collection(
          "lead_lenders"
        )
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

  /*
   * Ops admin sees leads which have a
   * lead_lenders relationship.
   */

  const relationshipMatch: Record<
    string,
    unknown
  > = {};

  if (
    session.role ===
    "ops_admin"
  ) {
    // --------------------------------------------------
    // Ops admin can optionally filter by lender
    // --------------------------------------------------

    if (filters.lenderId) {
      relationshipMatch.lenderId =
        filters.lenderId;
    }
  }

  // --------------------------------------------------
  // Status filter
  // --------------------------------------------------

  if (filters.status) {
    relationshipMatch.status =
      filters.status;
  }

  // --------------------------------------------------
  // Follow-up filter
  // --------------------------------------------------

  if (filters.followUpDue) {
    relationshipMatch.followUpDate =
      {
        $ne: null,
        $lte: new Date(),
      };
  }

  // --------------------------------------------------
  // Date filters
  // --------------------------------------------------

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
          filters.fromDate
        );
    }

    if (filters.toDate) {
      const endDate =
        new Date(
          filters.toDate
        );

      endDate.setHours(
        23,
        59,
        59,
        999
      );

      (
        relationshipMatch.createdAt as Record<
          string,
          Date
        >
      ).$lte =
        endDate;
    }
  }

  const skip =
    (page - 1) * limit;

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

  // --------------------------------------------------
  // Search
  // --------------------------------------------------

  if (filters.search) {
    const search =
      filters.search.trim();

    pipeline.push({
      $match: {
        $or: [
          {
            "lead.borrowerName":
              {
                $regex:
                  search,

                $options:
                  "i",
              },
          },

          {
            "lead.phone":
              {
                $regex:
                  search,

                $options:
                  "i",
              },
          },
        ],
      },
    });
  }

  // --------------------------------------------------
  // Loan amount filter
  // --------------------------------------------------

  if (
    filters.minAmount !==
      undefined ||
    filters.maxAmount !==
      undefined
  ) {
    const amountFilter: Record<
      string,
      number
    > = {};

    if (
      filters.minAmount !==
      undefined
    ) {
      amountFilter.$gte =
        filters.minAmount;
    }

    if (
      filters.maxAmount !==
      undefined
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

  // --------------------------------------------------
  // Count before pagination
  // --------------------------------------------------

  const countPipeline = [
    ...pipeline,

    {
      $count:
        "total",
    },
  ];

  const countResult =
    await db
      .collection(
        "lead_lenders"
      )
      .aggregate(
        countPipeline
      )
      .toArray();

  const total =
    countResult[0]?.total ??
    0;

  // --------------------------------------------------
  // Sorting + pagination
  // --------------------------------------------------

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

        followUpDate:
          1,

        createdAt: 1,

        updatedAt: 1,

        borrower: {
          id: "$lead._id",

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
      .collection(
        "lead_lenders"
      )
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
