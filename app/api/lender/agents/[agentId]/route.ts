import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";

import { getSession } from "@/lib/auth/session";
import clientPromise from "@/lib/db/mongodb";

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{ agentId: string }>;
  }
) {
  try {
    // 1. Get logged-in user
    const session = await getSession();

    if (!session) {
      return Response.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    // 2. Only lender admin can remove agents
    if (session.role !== "lender_admin") {
      return Response.json(
        {
          error: "Only lender admins can remove agents",
        },
        {
          status: 403,
        }
      );
    }

    // 3. Lender admin must belong to a lender
    if (!session.lenderId) {
      return Response.json(
        {
          error: "Lender ID missing from session",
        },
        {
          status: 400,
        }
      );
    }

    // 4. Get agent ID from URL
    const { agentId } = await context.params;

    if (!agentId) {
      return Response.json(
        {
          error: "Agent ID is required",
        },
        {
          status: 400,
        }
      );
    }

    // 5. Validate MongoDB ObjectId
    if (!ObjectId.isValid(agentId)) {
      return Response.json(
        {
          error: "Invalid agent ID",
        },
        {
          status: 400,
        }
      );
    }

    // 6. Connect to database
    const client = await clientPromise;

    const db = client.db(process.env.MONGODB_DB);

    // 7. Find the agent
    const agent = await db.collection("users").findOne({
      _id: new ObjectId(agentId),
      role: "lender_agent",
      lenderId: session.lenderId,
      isActive: true,
    });

    // 8. Agent must belong to the current lender
    if (!agent) {
      return Response.json(
        {
          error: "Agent not found",
        },
        {
          status: 404,
        }
      );
    }

    // 9. Soft delete / deactivate the agent
    await db.collection("users").updateOne(
      {
        _id: agent._id,
        role: "lender_agent",
        lenderId: session.lenderId,
      },
      {
        $set: {
          isActive: false,
          deactivatedAt: new Date(),
          deactivatedBy: session.userId,
        },
      }
    );

    return Response.json(
      {
        message: "Agent removed successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Remove agent error:", error);

    return Response.json(
      {
        error: "Failed to remove agent",
      },
      {
        status: 500,
      }
    );
  }
}