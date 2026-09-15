import { NextRequest } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth/session";
import { createInvite } from "@/lib/db/invites";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["lender_admin", "lender_agent"]),
  lenderId: z.string().optional(),
});

export async function POST(request: NextRequest) {
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

    // 2. Only lender_admin and ops_admin can invite
    if (
      session.role !== "lender_admin" &&
      session.role !== "ops_admin"
    ) {
      return Response.json(
        {
          error: "Only admins can invite users",
        },
        {
          status: 403,
        }
      );
    }

    // 3. Validate request body
    const body = await request.json();

    const result = inviteSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error: "Invalid invite data",
          details: result.error.flatten().fieldErrors,
        },
        {
          status: 400,
        }
      );
    }

    const { email, role } = result.data;

    // 4. Determine lender
    let lenderId: string | null = null;

    if (session.role === "lender_admin") {
      // Lender admin must have a lender
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

      // IMPORTANT:
      // Ignore any lenderId sent by the client.
      // Lender admin can only invite into their own lender.
      lenderId = session.lenderId;
    }

    if (session.role === "ops_admin") {
      // Ops admin must explicitly specify target lender
      if (!result.data.lenderId) {
        return Response.json(
          {
            error: "lenderId is required for ops admin",
          },
          {
            status: 400,
          }
        );
      }

      lenderId = result.data.lenderId;
    }

    // 5. Safety check
    if (!lenderId) {
      return Response.json(
        {
          error: "Unable to determine lender",
        },
        {
          status: 400,
        }
      );
    }

    // 6. Create invitation
    const token = await createInvite(
      lenderId,
      email,
      role,
      session.userId
    );

    // 7. Development invite link
    const inviteLink =
      `http://localhost:3000/invite/${token}`;

    return Response.json(
      {
        message: "Invitation created successfully",
        inviteLink,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Invite error:", error);

    return Response.json(
      {
        error: "Failed to create invitation",
      },
      {
        status: 500,
      }
    );
  }
}