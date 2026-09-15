import { NextRequest } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import clientPromise from "@/lib/db/mongodb";

const acceptInviteSchema = z.object({
  name: z.string().min(2),
  password: z.string().min(6),
});

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{ token: string }>;
  }
) {
  try {
    const { token } = await context.params;

    const body = await request.json();

    const result = acceptInviteSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error: "Invalid data",
          details: result.error.flatten().fieldErrors,
        },
        {
          status: 400,
        }
      );
    }

    const { name, password } = result.data;

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Find invitation
    const invite = await db.collection("invites").findOne({
      tokenHash,
      used: false,
      expiresAt: {
        $gt: new Date(),
      },
    });

    if (!invite) {
      return Response.json(
        {
          error: "Invalid or expired invitation",
        },
        {
          status: 400,
        }
      );
    }

    // Check whether user already exists
    const existingUser = await db.collection("users").findOne({
      email: invite.email,
    });

    if (existingUser) {
      return Response.json(
        {
          error: "User already exists",
        },
        {
          status: 409,
        }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    await db.collection("users").insertOne({
      name,
      email: invite.email,
      passwordHash,
      role: invite.role,
      lenderId: invite.lenderId,
      isActive: true,
      createdAt: new Date(),
    });

    // Mark invitation as used
    await db.collection("invites").updateOne(
      {
        _id: invite._id,
        used: false,
      },
      {
        $set: {
          used: true,
          usedAt: new Date(),
        },
      }
    );

    return Response.json(
      {
        message: "Account created successfully",
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Accept invite error:", error);

    return Response.json(
      {
        error: "Failed to accept invitation",
      },
      {
        status: 500,
      }
    );
  }
}