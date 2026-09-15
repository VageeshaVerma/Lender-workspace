import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getSession } from "@/lib/auth/session";
import { authorizeLeadAccess } from "@/lib/auth/authorizeLeadAccess";
import { createLeadEvent } from "@/lib/db/leadEvents";
import { createDisbursement } from "@/lib/db/loanDisbursements";
import clientPromise from "@/lib/db/mongodb";

type RouteContext = {
  params: Promise<{
    leadId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // 1. Authenticate user
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Only admins can disburse
    if (
      session.role !== "lender_admin" &&
      session.role !== "ops_admin"
    ) {
      return NextResponse.json(
        {
          error: "Forbidden: only admins can disburse loans",
        },
        { status: 403 }
      );
    }

    // 3. Get lead ID
    const { leadId } = await context.params;

    if (!ObjectId.isValid(leadId)) {
      return NextResponse.json(
        { error: "Invalid lead ID" },
        { status: 400 }
      );
    }

    // 4. Verify lender-specific access
    const relationship = await authorizeLeadAccess(
      leadId,
      session
    );

    if (!relationship) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // 5. Parse request body
    const body = await request.json();

    const amount = Number(body.amount);

    const date =
      typeof body.date === "string"
        ? body.date.trim()
        : "";

    const referenceNumber =
      typeof body.referenceNumber === "string"
        ? body.referenceNumber.trim()
        : "";

    // 6. Validate fields
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Valid disbursement amount is required" },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: "Disbursement date is required" },
        { status: 400 }
      );
    }

    if (!referenceNumber) {
      return NextResponse.json(
        { error: "Reference number is required" },
        { status: 400 }
      );
    }

    const disbursementDate = new Date(date);

    if (Number.isNaN(disbursementDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid disbursement date" },
        { status: 400 }
      );
    }

    // 7. Get database
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // 8. Lead must already be approved
    if (relationship.status !== "approved") {
      return NextResponse.json(
        {
          error:
            "Lead must be approved before disbursement",
        },
        { status: 400 }
      );
    }

    // 9. Find approved offer for THIS lender relationship
    const approvedOffer = await db
      .collection("loan_offers")
      .findOne(
        {
          leadLenderId: relationship._id,
          lenderId: relationship.lenderId,
          status: "approved",
        },
        {
          sort: {
            createdAt: -1,
          },
        }
      );

    if (!approvedOffer) {
      return NextResponse.json(
        {
          error: "No approved loan offer found",
        },
        { status: 400 }
      );
    }

    // 10. Prevent disbursing more than sanctioned amount
    if (amount > approvedOffer.amount) {
      return NextResponse.json(
        {
          error:
            "Disbursement amount cannot exceed sanctioned amount",
        },
        { status: 400 }
      );
    }

    // 11. Create disbursement record
    const disbursement = await createDisbursement({
      leadId: relationship.leadId,
      lenderId: relationship.lenderId,
      leadLenderId: relationship._id,
      loanOfferId: approvedOffer._id,
      amount,
      date: disbursementDate,
      referenceNumber,
    });

    // 12. Update ONLY this lender's relationship
    const updateResult = await db
      .collection("lead_lenders")
      .updateOne(
        {
          _id: relationship._id,
        },
        {
          $set: {
            status: "disbursed",
            updatedAt: new Date(),
          },
        }
      );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        {
          error: "Lead relationship not found",
        },
        { status: 404 }
      );
    }

    // 13. Create immutable audit event
    const eventSession = {
      ...session,
      lenderId: relationship.lenderId,
    };

    const event = await createLeadEvent(
      eventSession,
      {
        leadId: relationship.leadId,
        eventType: "DISBURSED",
        data: {
          amount,
          date: disbursementDate,
          referenceNumber,
          loanOfferId: approvedOffer._id.toString(),
          previousStatus: relationship.status,
          newStatus: "disbursed",
        },
      }
    );

    // 14. Return response
    return NextResponse.json(
      {
        message: "Loan disbursed successfully",
        disbursement,
        relationship: {
          _id: relationship._id,
          leadId: relationship.leadId,
          lenderId: relationship.lenderId,
          status: "disbursed",
        },
        event,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Disbursement error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}