import clientPromise from "./mongodb";

export async function getLenders() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const lenders = await db
    .collection("lenders")
    .aggregate([
      {
        $lookup: {
          from: "users",
          let: { lenderId: "$lender_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$lenderId", "$$lenderId"] },
                    { $eq: ["$role", "lender_agent"] },
                  ],
                },
              },
            },
            {
              $count: "count",
            },
          ],
          as: "agentStats",
        },
      },

      {
        $lookup: {
          from: "lead_lenders",
          let: { lenderId: "$lender_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$lenderId", "$$lenderId"],
                },
              },
            },
            {
              $count: "count",
            },
          ],
          as: "leadStats",
        },
      },

      {
        $project: {
          _id: 0,
          lender_id: 1,
          name: 1,
          isActive: 1,
          priority: 1,

          agentCount: {
            $ifNull: [
              { $arrayElemAt: ["$agentStats.count", 0] },
              0,
            ],
          },

          leadCount: {
            $ifNull: [
              { $arrayElemAt: ["$leadStats.count", 0] },
              0,
            ],
          },
        },
      },

      {
        $sort: {
          name: 1,
        },
      },
    ])
    .toArray();

  return lenders;
}

export async function getLenderById(lenderId: string) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const lenders = await db
    .collection("lenders")
    .aggregate([
      {
        $match: {
          lender_id: lenderId,
        },
      },

      // Get lender agents
      {
        $lookup: {
          from: "users",
          let: { lenderId: "$lender_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$lenderId", "$$lenderId"] },
                    { $eq: ["$role", "lender_agent"] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                email: 1,
                isActive: 1,
                createdAt: 1,
              },
            },
            {
              $sort: {
                name: 1,
              },
            },
          ],
          as: "agents",
        },
      },

      // Get lead count
      {
        $lookup: {
          from: "lead_lenders",
          let: { lenderId: "$lender_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$lenderId", "$$lenderId"],
                },
              },
            },
            {
              $count: "count",
            },
          ],
          as: "leadStats",
        },
      },

      // Return useful lender information
      {
        $project: {
          _id: 0,

          lender_id: 1,
          name: 1,
          isActive: 1,
          priority: 1,

          flow: 1,
          minAge: 1,
          maxAge: 1,
          minIncome: 1,
          minCreditScore_exclusive: 1,
          maxCreditScore_inclusive: 1,

          employmentTypes: 1,
          supportedPincodes: 1,
          maxLeadsPerDay: 1,

          preflight: 1,
          leadOnly: 1,
          minAppVersion: 1,
          offerApproval: 1,
          canShowProvisionalOffer: 1,

          agents: 1,

          leadCount: {
            $ifNull: [
              {
                $arrayElemAt: ["$leadStats.count", 0],
              },
              0,
            ],
          },
        },
      },
    ])
    .toArray();

  return lenders[0] ?? null;
}

export type CreateLenderInput = {
  lender_id: string;
  name: string;
  isActive?: boolean;
  priority?: number;
  flow?: string;
  minAge?: number;
  maxAge?: number;
  minIncome?: number;
  minCreditScore_exclusive?: number;
  maxCreditScore_inclusive?: number;
  employmentTypes?: string[];
  supportedPincodes?: string[];
  maxLeadsPerDay?: number;
  preflight?: boolean;
  leadOnly?: boolean;
  minAppVersion?: string;
  offerApproval?: boolean;
  canShowProvisionalOffer?: boolean;
};

export async function createLender(
  input: CreateLenderInput
) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const lendersCollection = db.collection("lenders");

  // ----------------------------------------
  // Normalize basic fields
  // ----------------------------------------

  const lenderId = input.lender_id
    .trim()
    .toLowerCase();

  const name = input.name.trim();

  // ----------------------------------------
  // Required fields
  // ----------------------------------------

  if (!lenderId) {
    throw new Error("Lender ID is required");
  }

  if (!name) {
    throw new Error("Lender name is required");
  }

  // ----------------------------------------
  // Validate lender ID format
  // ----------------------------------------

  if (!/^[a-z0-9-]+$/.test(lenderId)) {
    throw new Error(
      "Lender ID can contain only lowercase letters, numbers, and hyphens"
    );
  }

  // ----------------------------------------
  // Check duplicate lender
  // ----------------------------------------

  const existingLender =
    await lendersCollection.findOne({
      lender_id: lenderId,
    });

  if (existingLender) {
    throw new Error(
      `Lender "${lenderId}" already exists`
    );
  }

  // ----------------------------------------
  // Validate age range
  // ----------------------------------------

  if (
    input.minAge !== undefined &&
    input.maxAge !== undefined &&
    input.minAge > input.maxAge
  ) {
    throw new Error(
      "Minimum age cannot be greater than maximum age"
    );
  }

  // ----------------------------------------
  // Validate credit score range
  // ----------------------------------------

  if (
    input.minCreditScore_exclusive !== undefined &&
    input.maxCreditScore_inclusive !== undefined &&
    input.minCreditScore_exclusive >=
      input.maxCreditScore_inclusive
  ) {
    throw new Error(
      "Minimum credit score must be less than maximum credit score"
    );
  }

  // ----------------------------------------
  // Create lender document
  // ----------------------------------------

  const now = new Date();

  const lender = {
    lender_id: lenderId,
    name,

    isActive: input.isActive ?? true,

    priority: input.priority ?? 1,
    flow: input.flow ?? null,

    minAge: input.minAge ?? null,
    maxAge: input.maxAge ?? null,

    minIncome: input.minIncome ?? null,

    minCreditScore_exclusive:
      input.minCreditScore_exclusive ?? null,

    maxCreditScore_inclusive:
      input.maxCreditScore_inclusive ?? null,

    employmentTypes:
      input.employmentTypes ?? [],

    supportedPincodes:
      input.supportedPincodes ?? [],

    maxLeadsPerDay:
      input.maxLeadsPerDay ?? null,

    preflight:
      input.preflight ?? false,

    leadOnly:
      input.leadOnly ?? false,

    minAppVersion:
      input.minAppVersion ?? null,

    offerApproval:
      input.offerApproval ?? false,

    canShowProvisionalOffer:
      input.canShowProvisionalOffer ?? false,

    createdAt: now,
    updatedAt: now,
  };

  // ----------------------------------------
  // Insert lender
  // ----------------------------------------

  const result =
    await lendersCollection.insertOne(lender);

  return {
    ...lender,
    id: result.insertedId.toString(),
  };
}