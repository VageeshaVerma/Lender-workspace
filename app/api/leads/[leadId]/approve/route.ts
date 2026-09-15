import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getSession } from "@/lib/auth/session";
import { authorizeLeadAccess } from "@/lib/auth/authorizeLeadAccess";
import { createLeadEvent } from "@/lib/db/leadEvents";
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
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (
      session.role !== "lender_admin" &&
      session.role !== "ops_admin"
    ) {
      return NextResponse.json(
        { error: "Forbidden: only admins can approve leads" },
        { status: 403 }
      );
    }

    const { leadId } = await context.params;

    if (!ObjectId.isValid(leadId)) {
      return NextResponse.json(
        { error: "Invalid lead ID" },
        { status: 400 }
      );
    }

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

    const body = await request.json();

    const sanctionedAmount = Number(body.sanctionedAmount);
    const tenure = Number(body.tenure);
    const interestRate = Number(body.interestRate);

    const offerValidity =
      typeof body.offerValidity === "string"
        ? body.offerValidity.trim()
        : "";

    if (
      !Number.isFinite(sanctionedAmount) ||
      sanctionedAmount <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid sanctioned amount" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(tenure) || tenure <= 0) {
      return NextResponse.json(
        { error: "Invalid tenure" },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(interestRate) ||
      interestRate <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid interest rate" },
        { status: 400 }
      );
    }

    if (!offerValidity) {
      return NextResponse.json(
        { error: "Offer validity is required" },
        { status: 400 }
      );
    }

    const validityDate = new Date(offerValidity);

    if (Number.isNaN(validityDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid offer validity date" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const offer = {
      leadId: relationship.leadId,
      lenderId: relationship.lenderId,
      leadLenderId: relationship._id,
      amount: sanctionedAmount,
      tenure,
      interestRate,
      status: "approved",
      offerValidity: validityDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const offerResult = await db
      .collection("loan_offers")
      .insertOne(offer);

    await db
      .collection("lead_lenders")
      .updateOne(
        {
          _id: relationship._id,
        },
        {
          $set: {
            status: "approved",
            updatedAt: new Date(),
          },
        }
      );

    const eventSession = {
      ...session,
      lenderId: relationship.lenderId,
    };

    const event = await createLeadEvent(
      eventSession,
      {
        leadId: relationship.leadId,
        eventType: "APPROVED",
        data: {
          sanctionedAmount,
          tenure,
          interestRate,
          offerValidity: validityDate,
          offerId: offerResult.insertedId,
        },
      }
    );

    return NextResponse.json(
      {
        message: "Lead approved successfully",
        offer: {
          _id: offerResult.insertedId,
          ...offer,
        },
        relationship: {
          _id: relationship._id,
          leadId: relationship.leadId,
          lenderId: relationship.lenderId,
          status: "approved",
        },
        event,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Approve lead error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}