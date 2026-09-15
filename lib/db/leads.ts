import clientPromise from "./mongodb";
import { SessionPayload } from "../auth/session";

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
};

export async function getLeadsForUser(
  session: SessionPayload, //who is asking 
  filters: LeadFilters = {}  //what do they want
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
    Math.max(filters.limit ?? 20, 1),
    100
  );

  const skip = (page - 1) * limit;

  /*
   * Tenant authorization starts from
   * lead_lenders, NOT the master leads collection.
   */

  const relationshipMatch: Record<
    string,
    any                      //key string value any type
  > = {};

  if (session.role === "ops_admin") {
    if (filters.lenderId) {
      relationshipMatch.lenderId =
        filters.lenderId;
    }
  }

  else if (session.role === "lender_admin") {
    if (!session.lenderId) {
      throw new Error("Lender admin has no lenderId");
    }

    relationshipMatch.lenderId =session.lenderId;
  }

  else if (session.role === "lender_agent") {
    if (!session.lenderId) {
      throw new Error("Lender agent has no lenderId");
    }

    relationshipMatch.lenderId = session.lenderId;

    relationshipMatch.assignedAgentId = session.userId;

  /*{
  lenderId: "ram-fincorp",
  assignedAgentId: "agent123"
  }*/
  }

  if (filters.status) {
    relationshipMatch.status =
      filters.status;
  }

  if (filters.followUpDue) {
    relationshipMatch.followUpDate = {
      $ne: null,  //not null
      $lte: new Date(),   //<= current date
    };
  }

  if (filters.fromDate || filters.toDate) {
    relationshipMatch.createdAt = {};

    if (filters.fromDate) {
      relationshipMatch.createdAt.$gte = new Date(filters.fromDate);
    }

    if (filters.toDate) {
      const endDate = new Date(filters.toDate);

      endDate.setHours(23, 59, 59, 999);

      relationshipMatch.createdAt.$lte = endDate;
    }
  }

  const pipeline: any[] = [
    {
      $match: relationshipMatch,
    },
     //lead_lenders = authorization boundary
    {
      $lookup: {   //sql join gives array join lead and lead lenders
        from: "leads",
        localField: "leadId",
        foreignField: "_id",
        as: "lead",
      },
    },
    /*{
    leadId: ObjectId("AAA111"),
    lenderId: "ram-fincorp",
    assignedAgentId: "agent123",

    lead: [
    {
      _id: ObjectId("AAA111"),
      name: "Rahul",
      phone: "9876543210",
      loanAmount: 500000
    }
    ]
    }*/
    {
      $unwind: "$lead",   //array to object
    },
  ];

  if (filters.search) {
    const search =filters.search.trim();

    pipeline.push({
      $match: {   //where
        $or: [
          {
            "lead.borrowerName": {
              $regex: search,    //pattern-based
              $options: "i",  //case sensitive
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

  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) { //for considering zeroes
    const amountFilter: Record<
      string,
      number
    > = {};

    if (filters.minAmount !== undefined) {
      amountFilter.$gte = filters.minAmount;
    }

    if (filters.maxAmount !== undefined) {
      amountFilter.$lte = filters.maxAmount;
    }

    pipeline.push({
      $match: {
        "lead.loanAmount": amountFilter,
      },
    });
  }

  const countPipeline = [
    ...pipeline,
    {
      $count: "total",
    },
  ];

  const countResult =await db.collection("lead_lenders").aggregate(countPipeline).toArray();

  const total =countResult[0]?.total ?? 0;

  pipeline.push(
    {
      $sort: {
        "lead.createdAt": -1,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    }
  );

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
        id: "$lead._id",
        sourceLeadId:"$lead.sourceLeadId",
        borrowerName:"$lead.borrowerName",
        phone: "$lead.phone",
        loanAmount: "$lead.loanAmount",
        loanPurpose: "$lead.loanPurpose",
        dateOfBirth: "$lead.dateOfBirth",
        gender: "$lead.gender",
        employmentType: "$lead.employmentType",
        income: "$lead.income",
        creditScore: "$lead.creditScore",
        city: "$lead.city",
        state: "$lead.state",
        pincode: "$lead.pincode",
        createdAt: "$lead.createdAt",
      },
    },
  });

  const leads = await db.collection("lead_lenders").aggregate(pipeline).toArray();

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
