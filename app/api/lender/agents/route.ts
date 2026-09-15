import { getSession } from "@/lib/auth/session";
import clientPromise from "@/lib/db/mongodb";

export async function GET() {
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

    // 2. Only lender admins can access this endpoint
    if (session.role !== "lender_admin") {
      return Response.json(
        {
          error: "Only lender admins can view agents",
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

    // 4. Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // 5. Fetch agents belonging ONLY to this lender
    const agents = await db
      .collection("users")
      .find(
        {
          lenderId: session.lenderId,
          role: "lender_agent",
        },
        {
          projection: {
            passwordHash: 0,
          },
        }
      )
      .sort({
        name: 1,
      })
      .toArray();

    // 6. Return agents
    return Response.json(
      {
        agents,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("GET /api/lender/agents error:", error);

    return Response.json(
      {
        error: "Failed to fetch agents",
      },
      {
        status: 500,
      }
    );
  }
}