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
    // 1. Get authenticated session
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Get leadId from URL
    const { leadId } = await context.params;

    // 3. Authorize access to the lender relationship
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

    // 4. Validate leadId
    if (!ObjectId.isValid(leadId)) {
      return NextResponse.json(
        { error: "Invalid lead ID" },
        { status: 400 }
      );
    }

    // 5. Read request body
    const body = await request.json();

    const followUpDate =
      typeof body.followUpDate === "string"
        ? body.followUpDate.trim()
        : "";

    // 6. Validate follow-up date
    if (!followUpDate) {
      return NextResponse.json(
        { error: "Follow-up date is required" },
        { status: 400 }
      );
    }

    const parsedDate = new Date(followUpDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid follow-up date" },
        { status: 400 }
      );
    }

    // 7. Update ONLY this lender's relationship
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const result = await db
      .collection("lead_lenders")
      .updateOne(
        {
          _id: relationship._id,
        },
        {
          $set: {
            followUpDate: parsedDate,
            status: "follow_up",
            updatedAt: new Date(),
          },
        }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Lead relationship not found" },
        { status: 404 }
      );
    }

    // 8. Create immutable audit event
    const eventSession = {
      ...session,
      lenderId: relationship.lenderId,
    };

    const event = await createLeadEvent(
      eventSession,
      {
        leadId: relationship.leadId,
        eventType: "FOLLOW_UP_SET",
        data: {
          followUpDate: parsedDate,
        },
      }
    );

    // 9. Return success
    return NextResponse.json(
      {
        message: "Follow-up scheduled successfully",
        followUpDate: parsedDate,
        event,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Follow-up error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
