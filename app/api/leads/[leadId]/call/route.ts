import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";

import { getSession } from "@/lib/auth/session";
import { authorizeLeadAccess } from "@/lib/auth/authorizeLeadAccess";
import { createLeadEvent } from "@/lib/db/leadEvents";
import clientPromise from "@/lib/db/mongodb";

const allowedOutcomes = [
  "connected",
  "not_connected",
  "busy",
  "wrong_number",
  "interested",
  "not_interested",
  "callback_requested",
] as const;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ leadId: string }> }
) {
  try {
    // 1. Authenticate
    const session = await getSession();

    if (!session) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Get leadId from URL
    const { leadId } = await context.params;

    if (!leadId) {
      return Response.json(
        { error: "Lead ID is required" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(leadId)) {
      return Response.json(
        { error: "Invalid Lead ID" },
        { status: 400 }
      );
    }

    // 3. Read request body
    const body = await request.json();

    const { outcome, notes } = body;

    // 4. Validate outcome
    if (!outcome) {
      return Response.json(
        { error: "Outcome is required" },
        { status: 400 }
      );
    }

    if (!allowedOutcomes.includes(outcome)) {
      return Response.json(
        {
          error: "Invalid call outcome",
          allowedOutcomes,
        },
        { status: 400 }
      );
    }

    // 5. Validate notes
    if (
      notes !== undefined &&
      typeof notes !== "string"
    ) {
      return Response.json(
        { error: "Notes must be a string" },
        { status: 400 }
      );
    }

    // 6. AUTHORIZE ACCESS
    const relationship = await authorizeLeadAccess(
      leadId,
      session
    );

    if (!relationship) {
      return Response.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // 7. Connect to database
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // 8. Determine new status
    let newStatus = relationship.status;

    if (
      outcome === "connected" ||
      outcome === "interested" ||
      outcome === "not_interested"
    ) {
      newStatus = "contacted";
    }

    if (outcome === "callback_requested") {
      newStatus = "follow_up";
    }

    // 9. Update ONLY this lender relationship
    await db.collection("lead_lenders").updateOne(
      {
        _id: relationship._id,
      },
      {
        $set: {
          status: newStatus,
          updatedAt: new Date(),
        },
      }
    );

    // 10. Create immutable audit event
    const eventSession = {
      ...session,
      lenderId: relationship.lenderId,
    };

    const event = await createLeadEvent(
      eventSession,
      {
        leadId: relationship.leadId,
        eventType: "CALL_OUTCOME",
        data: {
          outcome,
          notes: notes?.trim() || null,
          previousStatus: relationship.status,
          newStatus,
        },
      }
    );

    // 11. Return response
    return Response.json({
      message: "Call outcome recorded successfully",

      relationship: {
        _id: relationship._id,
        leadId: relationship.leadId,
        lenderId: relationship.lenderId,
        status: newStatus,
        assignedAgentId:
          relationship.assignedAgentId,
      },

      event,
    });

  } catch (error) {
    console.error(
      "POST /api/leads/[leadId]/call error:",
      error
    );

    return Response.json(
      { error: "Failed to record call outcome" },
      { status: 500 }
    );
  }
}