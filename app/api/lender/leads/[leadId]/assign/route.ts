import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { createLeadEvent } from "@/lib/db/leadEvents";

import { getSession } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/users";
import clientPromise from "@/lib/db/mongodb";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ leadId: string }> }
) {
  try {
    // 1. Get logged-in user
    const session = await getSession();

    if (!session) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Only lender admins can manually assign agents
    if (session.role !== "lender_admin") {
      return Response.json(
        {
          error:
            "Only lender admins can assign leads to agents",
        },
        { status: 403 }
      );
    }

    // 3. Lender admin must belong to a lender
    if (!session.lenderId) {
      return Response.json(
        {
          error: "Lender information is missing from session",
        },
        { status: 403 }
      );
    }

    // 4. Get leadId from URL
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

    // 5. Read request body
    const body = await request.json();

    const { agentId } = body;

    if (!agentId || typeof agentId !== "string") {
      return Response.json(
        { error: "Agent ID is required" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(agentId)) {
      return Response.json(
        { error: "Invalid Agent ID" },
        { status: 400 }
      );
    }

    // 6. Connect to database
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const leadObjectId = new ObjectId(leadId);

    // 7. Check that this lead is actually matched
    //    to the logged-in lender
    const relationship = await db
      .collection("lead_lenders")
      .findOne({
        leadId: leadObjectId,
        lenderId: session.lenderId,
      });

    if (!relationship) {
      return Response.json(
        {
          error:
            "This lead is not assigned to your lender",
        },
        { status: 404 }
      );
    }

    // 8. Find the selected agent
    const agent = await getUserById(agentId);

    if (!agent) {
      return Response.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    // 9. Verify that the selected user is actually
    //    an active lender agent of the SAME lender
    if (
      agent.role !== "lender_agent" ||
      agent.lenderId !== session.lenderId ||
      agent.isActive === false
    ) {
      return Response.json(
        {
          error:
            "Invalid agent for this lender",
        },
        { status: 403 }
      );
    }

    // 10. Assign the agent
    await db.collection("lead_lenders").updateOne(
      {
        leadId: leadObjectId,
        lenderId: session.lenderId,
      },
      {
        $set: {
          assignedAgentId: agent._id.toString(),
          assignmentStatus: "assigned",
          updatedAt: new Date(),
        },
      }
    );

    await createLeadEvent(session, {
      leadId: leadObjectId,
      eventType: "ASSIGNED",
      data: {
          assignedAgentId: agent._id.toString(),
          assignedAgentName: agent.name,
          assignedBy: session.userId,
        },
    });

    // 11. Return success
    return Response.json(
      {
        message: "Lead assigned successfully",
        assignment: {
          leadId,
          lenderId: session.lenderId,
          agentId: agent._id.toString(),
          assignmentStatus: "assigned",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "POST /api/lender/leads/[leadId]/assign error:",
      error
    );

    return Response.json(
      {
        error: "Failed to assign lead",
      },
      { status: 500 }
    );
  }
}