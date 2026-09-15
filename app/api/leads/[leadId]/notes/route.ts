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

    // 3. Check whether this user can access this lead
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

    // 4. Read request body
    const body = await request.json();

    const note =
      typeof body.note === "string"
        ? body.note.trim()
        : "";

    // 5. Validate note
    if (!note) {
      return NextResponse.json(
        { error: "Note is required" },
        { status: 400 }
      );
    }

    // 6. Create immutable audit event
    const eventSession = {
      ...session,
      lenderId: relationship.lenderId,
    };

    const event = await createLeadEvent(
      eventSession,
      {
        leadId: relationship.leadId,
        eventType: "NOTE_ADDED",
        data: {
          note,
        },
      }
    );

    // 7. Return created event
    return NextResponse.json(
      {
        message: "Note added successfully",
        event,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add note error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}