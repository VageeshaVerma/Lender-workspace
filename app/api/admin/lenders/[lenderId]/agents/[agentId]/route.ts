import { getSession } from "@/lib/auth/session";
import clientPromise from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

type RouteContext = {
  params: Promise<{
    lenderId: string;
    agentId: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    // 1. Check authentication
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

    // 2. Only ops_admin can activate/deactivate agents
    if (session.role !== "ops_admin") {
      return Response.json(
        {
          error: "Only ops admins can manage agents",
        },
        {
          status: 403,
        }
      );
    }

    // 3. Get lenderId and agentId from URL
    const { lenderId, agentId } = await context.params;

    if (!lenderId || !agentId) {
      return Response.json(
        {
          error: "Lender ID and agent ID are required",
        },
        {
          status: 400,
        }
      );
    }

    // 4. Validate MongoDB ObjectId
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

    // 5. Read request body
    const body = await request.json();

    // 6. Validate isActive
    if (typeof body.isActive !== "boolean") {
      return Response.json(
        {
          error: "isActive must be a boolean",
        },
        {
          status: 400,
        }
      );
    }

    // 7. Connect to database
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // 8. Find the agent
    const agent = await db.collection("users").findOne({
      _id: new ObjectId(agentId),
      role: "lender_agent",
      lenderId,
    });

    if (!agent) {
      return Response.json(
        {
          error: "Agent not found for this lender",
        },
        {
          status: 404,
        }
      );
    }

    // 9. Update agent status
    await db.collection("users").updateOne(
      {
        _id: new ObjectId(agentId),
        role: "lender_agent",
        lenderId,
      },
      {
        $set: {
          isActive: body.isActive,
          updatedAt: new Date(),
        },
      }
    );

    // 10. Return success
    return Response.json(
      {
        message: body.isActive
          ? "Agent activated successfully"
          : "Agent deactivated successfully",
        isActive: body.isActive,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "PATCH /api/admin/lenders/[lenderId]/agents/[agentId] error:",
      error
    );

    return Response.json(
      {
        error: "Failed to update agent",
      },
      {
        status: 500,
      }
    );
  }
}