import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import clientPromise from "@/lib/db/mongodb";
import { deleteLenderCompletely } from "@/lib/super-admin/deleteLender";
import { createLender } from "@/lib/db/lenders";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.role !== "super_admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const lenders = await db
      .collection("lenders")
      .find({})
      .sort({ priority: 1, name: 1 })
      .toArray();

    const safeLenders = lenders.map((lender) => ({
      id: lender._id.toString(),
      lender_id: lender.lender_id,
      name: lender.name,
      isActive: lender.isActive,
      priority: lender.priority,
      flow: lender.flow,
      minAge: lender.minAge,
      maxAge: lender.maxAge,
      minIncome: lender.minIncome,
      minCreditScore_exclusive:
        lender.minCreditScore_exclusive,
      maxCreditScore_inclusive:
        lender.maxCreditScore_inclusive,
      employmentTypes: lender.employmentTypes,
      supportedPincodes: lender.supportedPincodes,
      maxLeadsPerDay: lender.maxLeadsPerDay,
      preflight: lender.preflight,
      leadOnly: lender.leadOnly,
      minAppVersion: lender.minAppVersion,
      offerApproval: lender.offerApproval,
      canShowProvisionalOffer:
        lender.canShowProvisionalOffer,
    }));

    return NextResponse.json({
      lenders: safeLenders,
      count: safeLenders.length,
    });
  } catch (error) {
    console.error(
      "Super Admin lender list error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to fetch lenders" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.role !== "super_admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const lenderId =
      typeof body.lenderId === "string"
        ? body.lenderId.trim()
        : "";

    const isActive = body.isActive;

    if (!lenderId) {
      return NextResponse.json(
        { error: "lenderId is required" },
        { status: 400 }
      );
    }

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive must be a boolean" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const result = await db
      .collection("lenders")
      .updateOne(
        { lender_id: lenderId },
        {
          $set: {
            isActive,
          },
        }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Lender not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: isActive
        ? "Lender activated successfully"
        : "Lender deactivated successfully",
      lender: {
        lender_id: lenderId,
        isActive,
      },
    });
  } catch (error) {
    console.error(
      "Super Admin lender status update error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to update lender status" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.role !== "super_admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const lenderId =
      typeof body.lenderId === "string"
        ? body.lenderId.trim()
        : "";

    const confirmation =
      typeof body.confirmation === "string"
        ? body.confirmation.trim()
        : "";

    if (!lenderId) {
      return NextResponse.json(
        { error: "lenderId is required" },
        { status: 400 }
      );
    }

    if (confirmation !== lenderId) {
      return NextResponse.json(
        {
          error:
            "Confirmation does not match lender_id",
        },
        { status: 400 }
      );
    }

    const result =
      await deleteLenderCompletely(lenderId);

    return NextResponse.json({
      message:
        "Lender and all lender-owned records deleted successfully",
      result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "LENDER_NOT_FOUND"
    ) {
      return NextResponse.json(
        { error: "Lender not found" },
        { status: 404 }
      );
    }

    console.error(
      "Super Admin lender deletion error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to completely delete lender",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (
      session.role !== "super_admin" &&
      session.role !== "ops_admin"
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const lender = await createLender({
      lender_id: body.lender_id,
      name: body.name,
      isActive: body.isActive,
      priority: body.priority,
      flow: body.flow,
      minAge: body.minAge,
      maxAge: body.maxAge,
      minIncome: body.minIncome,
      minCreditScore_exclusive:
        body.minCreditScore_exclusive,
      maxCreditScore_inclusive:
        body.maxCreditScore_inclusive,
      employmentTypes: body.employmentTypes,
      supportedPincodes: body.supportedPincodes,
      maxLeadsPerDay: body.maxLeadsPerDay,
      preflight: body.preflight,
      leadOnly: body.leadOnly,
      minAppVersion: body.minAppVersion,
      offerApproval: body.offerApproval,
      canShowProvisionalOffer:
        body.canShowProvisionalOffer,
    });

    return NextResponse.json(
      {
        message: "Lender created successfully",
        lender,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create lender error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create lender",
      },
      { status: 400 }
    );
  }
}