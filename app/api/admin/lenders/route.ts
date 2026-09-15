import { getSession } from "@/lib/auth/session";
import { getLenders } from "@/lib/db/lenders";

export async function GET() {
  try {
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

    if (session.role !== "ops_admin") {
      return Response.json(
        {
          error: "Only ops admins can access lender management",
        },
        {
          status: 403,
        }
      );
    }

    const lenders = await getLenders();

    return Response.json(
      {
        lenders,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("GET /api/admin/lenders error:", error);

    return Response.json(
      {
        error: "Failed to fetch lenders",
      },
      {
        status: 500,
      }
    );
  }
}