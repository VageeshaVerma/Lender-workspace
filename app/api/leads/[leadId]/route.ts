import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { getLeadDetailForUser } from "@/lib/db/leadDetails";

export async function GET(request: NextRequest, context: { params: Promise<{ leadId: string }>;}) {
  try {
    const session = await getSession();

    if (!session) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { leadId } = await context.params;

    if (!leadId) {
      return Response.json(
        { error: "Lead ID is required" },
        { status: 400 }
      );
    }

    // Validate MongoDB ObjectId
    if (!ObjectId.isValid(leadId)) {
      return Response.json(
        { error: "Invalid Lead ID" },
        { status: 400 }
      );
    }

    // Convert URL string → MongoDB ObjectId
    const leadObjectId = new ObjectId(leadId);

    const lead = await getLeadDetailForUser(
      session,
      leadObjectId
    );

    if (!lead) {
      return Response.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    return Response.json({ lead });

  } catch (error) {
    console.error(
      "GET /api/leads/[leadId] error:",
      error
    );

    return Response.json(
      { error: "Failed to fetch lead" },
      { status: 500 }
    );
  }
}