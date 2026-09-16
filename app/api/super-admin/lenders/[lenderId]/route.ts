import { getSession } from "@/lib/auth/session";
import { getLenderById } from "@/lib/db/lenders";
import clientPromise from "@/lib/db/mongodb";
type RouteContext = {
  params: Promise<{
    lenderId: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await getSession();

    if (!session) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }


    const { lenderId } = await context.params;

    if (!lenderId) {
      return Response.json(
        { error: "Lender ID is required" },
        { status: 400 }
      );
    }

    const lender = await getLenderById(lenderId);

    if (!lender) {
      return Response.json(
        { error: "Lender not found" },
        { status: 404 }
      );
    }

    return Response.json(
      { lender },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/admin/lenders/[lenderId] error:",
      error
    );

    return Response.json(
      { error: "Failed to fetch lender" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await getSession();

    if (!session) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.role !== "ops_admin") {
      return Response.json(
        { error: "Only ops admins can manage lenders" },
        { status: 403 }
      );
    }

    const { lenderId } = await context.params;

    if (!lenderId) {
      return Response.json(
        { error: "Lender ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const allowedFields = [
      "isActive",
      "priority",
      "flow",
      "minAge",
      "maxAge",
      "minIncome",
      "minCreditScore_exclusive",
      "maxCreditScore_inclusive",
      "employmentTypes",
      "supportedPincodes",
      "maxLeadsPerDay",
      "preflight",
      "leadOnly",
      "minAppVersion",
      "offerApproval",
      "canShowProvisionalOffer",
    ] as const;

    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return Response.json(
        { error: "No valid fields provided" },
        { status: 400 }
      );
    }

    // Boolean validation
    const booleanFields = [
      "isActive",
      "preflight",
      "leadOnly",
      "offerApproval",
      "canShowProvisionalOffer",
    ] as const;

    for (const field of booleanFields) {
      if (field in updateData && typeof updateData[field] !== "boolean") {
        return Response.json(
          { error: `${field} must be a boolean` },
          { status: 400 }
        );
      }
    }

    // Number validation
    const numberFields = [
      "priority",
      "minAge",
      "maxAge",
      "minIncome",
      "minCreditScore_exclusive",
      "maxCreditScore_inclusive",
      "maxLeadsPerDay",
    ] as const;

    for (const field of numberFields) {
      if (field in updateData) {
        const value = updateData[field];

        if (
          typeof value !== "number" ||
          !Number.isFinite(value)
        ) {
          return Response.json(
            { error: `${field} must be a valid number` },
            { status: 400 }
          );
        }
      }
    }

    // String validation
    const stringFields = [
      "flow",
      "minAppVersion",
    ] as const;

    for (const field of stringFields) {
      if (field in updateData && typeof updateData[field] !== "string") {
        return Response.json(
          { error: `${field} must be a string` },
          { status: 400 }
        );
      }
    }

    // Array validation
    const arrayFields = [
      "employmentTypes",
      "supportedPincodes",
    ] as const;

    for (const field of arrayFields) {
      if (
        field in updateData &&
        !Array.isArray(updateData[field])
      ) {
        return Response.json(
          { error: `${field} must be an array` },
          { status: 400 }
        );
      }
    }

    // Logical validation
    if (
      "minAge" in updateData &&
      "maxAge" in updateData &&
      Number(updateData.minAge) > Number(updateData.maxAge)
    ) {
      return Response.json(
        { error: "minAge cannot be greater than maxAge" },
        { status: 400 }
      );
    }

    if (
      "minCreditScore_exclusive" in updateData &&
      "maxCreditScore_inclusive" in updateData &&
      Number(updateData.minCreditScore_exclusive) >=
        Number(updateData.maxCreditScore_inclusive)
    ) {
      return Response.json(
        {
          error:
            "Minimum credit score must be less than maximum credit score",
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const result = await db.collection("lenders").updateOne(
      {
        lender_id: lenderId,
      },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return Response.json(
        { error: "Lender not found" },
        { status: 404 }
      );
    }

    return Response.json(
      {
        message: "Lender updated successfully",
        updatedFields: Object.keys(updateData),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "PATCH /api/admin/lenders/[lenderId] error:",
      error
    );

    return Response.json(
      { error: "Failed to update lender" },
      { status: 500 }
    );
  }
}