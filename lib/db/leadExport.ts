import clientPromise from "./mongodb";
import { SessionPayload } from "../auth/session";
import { LeadFilters } from "./leads";

export async function getLeadsForExport(
  session: SessionPayload,
  filters: LeadFilters = {}
) {
  const client = await clientPromise;

  const db = client.db(process.env.MONGODB_DB);

  /*
   * Tenant authorization starts from lead_lenders.
   */
  const relationshipMatch: Record<string, any> = {};

  /*
   * OPS ADMIN
   * Can intentionally export any lender.
   */
  if (session.role === "ops_admin") {
    if (filters.lenderId) {
      relationshipMatch.lenderId = filters.lenderId;
    }
  }

  /*
   * LENDER ADMIN
   * Can only export their own lender.
   */
  else if (session.role === "lender_admin") {
    if (!session.lenderId) {
      throw new Error("Lender admin has no lenderId");
    }

    relationshipMatch.lenderId = session.lenderId;
  }

  /*
   * LENDER AGENT
   * Can only export their own assigned leads.
   */
  else if (session.role === "lender_agent") {
    if (!session.lenderId) {
      throw new Error("Lender agent has no lenderId");
    }

    relationshipMatch.lenderId = session.lenderId;
    relationshipMatch.assignedAgentId = session.userId;
  }

  /*
   * Status filter
   */
  if (filters.status) {
    relationshipMatch.status = filters.status;
  }

  /*
   * Follow-up due
   */
  if (filters.followUpDue) {
    relationshipMatch.followUpDate = {
      $ne: null,
      $lte: new Date(),
    };
  }

  /*
   * Date range
   */
  if (filters.fromDate || filters.toDate) {
    relationshipMatch.createdAt = {};

    if (filters.fromDate) {
      relationshipMatch.createdAt.$gte =
        new Date(filters.fromDate);
    }

    if (filters.toDate) {
      const endDate = new Date(filters.toDate);

      endDate.setHours(
        23,
        59,
        59,
        999
      );

      relationshipMatch.createdAt.$lte =
        endDate;
    }
  }

  /*
   * Start from lender relationship.
   */
  const pipeline: any[] = [
    {
      $match: relationshipMatch,
    },

    /*
     * Join master lead.
     */
    {
      $lookup: {
        from: "leads",
        localField: "leadId",
        foreignField: "_id",
        as: "lead",
      },
    },

    {
      $unwind: "$lead",
    },
  ];

  /*
   * Search borrower name / phone.
   */
  if (filters.search) {
    const search = filters.search.trim();

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

  /*
   * Loan amount filter.
   */
  if (
    filters.minAmount !== undefined ||
    filters.maxAmount !== undefined
  ) {
    const amountFilter: Record<
      string,
      number
    > = {};

    if (filters.minAmount !== undefined) {
      amountFilter.$gte =
        filters.minAmount;
    }

    if (filters.maxAmount !== undefined) {
      amountFilter.$lte =
        filters.maxAmount;
    }

    pipeline.push({
      $match: {
        "lead.loanAmount": amountFilter,
      },
    });
  }

  /*
   * Export fields.
   *
   * No pagination here.
   */
  pipeline.push({
    $sort: {
      "lead.createdAt": -1,
    },
  });

  pipeline.push({
    $project: {
      _id: 1,
      leadId: 1,
      lenderId: 1,
      eligibilityStatus: 1,
      assignmentStatus: 1,
      assignedAgentId: 1,
      status: 1,
      followUpDate: 1,
      createdAt: 1,
      updatedAt: 1,

      borrower: {
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
  });

  const leads = await db
    .collection("lead_lenders")
    .aggregate(pipeline)
    .toArray();

  return leads;
}