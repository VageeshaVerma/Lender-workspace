import { getSession } from "@/lib/auth/session";
import clientPromise from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

type RouteContext = {
  params: Promise<{
    lenderId: string;
    agentId: string;
  }>;
};

export async function DELETE(
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
        { error: "Only ops admins can remove agents" },
        { status: 403 }
      );
    }

    const { lenderId, agentId } = await context.params;

    if (!lenderId || !agentId) {
      return Response.json(
        { error: "Lender ID and agent ID are required" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(agentId)) {
      return Response.json(
        { error: "Invalid agent ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const result = await db.collection("users").updateOne(
      {
        _id: new ObjectId(agentId),
        lenderId,
        role: "lender_agent",
        isActive: true,
      },
      {
        $set: {
          isActive: false,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return Response.json(
        { error: "Active agent not found for this lender" },
        { status: 404 }
      );
    }

    return Response.json(
      {
        message: "Agent removed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "DELETE /api/super-admin/lenders/[lenderId]/agents/[agentId] error:",
      error
    );

    return Response.json(
      { error: "Failed to remove agent" },
      { status: 500 }
    );
  }
}