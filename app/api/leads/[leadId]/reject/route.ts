import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { authorizeLeadAccess } from "@/lib/auth/authorizeLeadAccess";
import { createLeadEvent } from "@/lib/db/leadEvents";

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

    // 2. Only admins can reject
    if (
      session.role !== "lender_admin" &&
      session.role !== "ops_admin"
    ) {
      return NextResponse.json(
        {
          error: "Forbidden: only admins can reject leads",
        },
        { status: 403 }
      );
    }

    // 3. Get leadId
    const { leadId } = await context.params;

    // 4. Authorize lender-specific relationship
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

    // 5. Read request body
    const body = await request.json();

    const reason =
      typeof body.reason === "string"
        ? body.reason.trim()
        : "";

    // 6. Validate rejection reason
    if (!reason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    // 7. Update only this lender's relationship
    const client = await import("@/lib/db/mongodb");

    const mongoClient = await client.default;
    const db = mongoClient.db(process.env.MONGODB_DB);

    const result = await db
      .collection("lead_lenders")
      .updateOne(
        {
          _id: relationship._id,
        },
        {
          $set: {
            status: "rejected",
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

    // 8. Create immutable rejection event
    const eventSession = {
      ...session,
      lenderId: relationship.lenderId,
    };

    const event = await createLeadEvent(
      eventSession,
      {
        leadId: relationship.leadId,
        eventType: "REJECTED",
        data: {
          reason,
          previousStatus: relationship.status,
          newStatus: "rejected",
        },
      }
    );

    // 9. Return response
    return NextResponse.json(
      {
        message: "Lead rejected successfully",
        relationship: {
          _id: relationship._id,
          leadId: relationship.leadId,
          lenderId: relationship.lenderId,
          status: "rejected",
        },
        event,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reject lead error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}