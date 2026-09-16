import { NextRequest } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth/session";
import { createInvite } from "@/lib/db/invites";
import clientPromise from "@/lib/db/mongodb";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["lender_admin", "lender_agent"]),
  lenderId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only ops_admin and lender_admin can create invitations.
    if (
      session.role !== "lender_admin" &&
      session.role !== "ops_admin"
    ) {
      return Response.json(
        { error: "Only admins can invite users" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const result = inviteSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error: "Invalid invite data",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, role } = result.data;

    /*
     * Permission rule:
     *
     * ops_admin:
     *   can invite lender_admin
     *   can invite lender_agent
     *
     * lender_admin:
     *   can only invite lender_agent
     *
     * This prevents a lender_admin from creating another
     * lender_admin through the API.
     */
    if (
      session.role === "lender_admin" &&
      role !== "lender_agent"
    ) {
      return Response.json(
        {
          error:
            "Lender admins can only invite lender agents",
        },
        { status: 403 }
      );
    }

    let lenderId: string | null = null;

    /*
     * If a lender_admin creates an invitation,
     * the lenderId MUST come from the session.
     *
     * We never trust lenderId sent by the frontend.
     */
    if (session.role === "lender_admin") {
      if (!session.lenderId) {
        return Response.json(
          { error: "Lender ID missing from session" },
          { status: 400 }
        );
      }

      lenderId = session.lenderId;
    }

    /*
     * If ops_admin creates an invitation,
     * they can choose which lender the invitation belongs to.
     */
    if (session.role === "ops_admin") {
      if (!result.data.lenderId) {
        return Response.json(
          {
            error: "lenderId is required for ops admin",
          },
          { status: 400 }
        );
      }

      lenderId = result.data.lenderId;
    }

    if (!lenderId) {
      return Response.json(
        { error: "Unable to determine lender" },
        { status: 400 }
      );
    }

    /*
     * Verify that the lender actually exists.
     *
     * This prevents creating an invitation for
     * a non-existent lender.
     */
    const client = await clientPromise;

    const db = client.db(process.env.MONGODB_DB);

    const lender = await db.collection("lenders").findOne({
      lender_id: lenderId,
    });

    if (!lender) {
      return Response.json(
        { error: "Lender not found" },
        { status: 404 }
      );
    }

    /*
     * Create the invitation.
     *
     * The invite stores:
     * - lenderId
     * - email
     * - role
     * - creator
     */
    const token = await createInvite(
      lenderId,
      email,
      role,
      session.userId
    );

    /*
     * Use environment variable in production.
     *
     * For local development, it falls back to localhost.
     */
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const inviteLink =
      `${baseUrl}/invite/${token}`;

    return Response.json(
      {
        message: "Invitation created successfully",
        inviteLink,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Invite error:", error);

    return Response.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}