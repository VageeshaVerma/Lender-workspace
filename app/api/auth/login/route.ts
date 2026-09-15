import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

import { getUserByEmail } from "@/lib/db/users";
import { loginSchema } from "@/lib/validation/auth";
import { createSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validate request at backend
    // Anyone can bypass the frontend and call this API directly.
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error: "Invalid email or password format",
          details: result.error.flatten().fieldErrors,
        },
        {
          status: 400,
        }
      );
    }

    const { email, password } = result.data;

    // --------------------------------------------------
    // 2. Super Admin login
    // --------------------------------------------------
    //
    // Super Admin is stored in environment variables rather
    // than MongoDB so the account can still access the system
    // even if the database is wiped.
    //
    // IMPORTANT:
    // SUPER_ADMIN_PASSWORD_HASH must contain a bcrypt hash,
    // never the plaintext password.

    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;

const encodedHash =
  process.env.SUPER_ADMIN_PASSWORD_HASH_B64;

const superAdminPasswordHash = encodedHash
  ? Buffer.from(encodedHash, "base64").toString("utf8")
  : undefined;

if (
  superAdminEmail &&
  superAdminPasswordHash &&
  email === superAdminEmail
) {
  const passwordValid = await bcrypt.compare(
    password,
    superAdminPasswordHash
  );

  if (!passwordValid) {
    return Response.json(
      {
        error: "Invalid email or password",
      },
      {
        status: 401,
      }
    );
  }

  await createSession({
    userId: "super-admin",
    email: superAdminEmail,
    role: "super_admin",
    lenderId: null,
  });

  return Response.json(
    {
      message: "Login successful",
      user: {
        id: "super-admin",
        name: "Super Admin",
        email: superAdminEmail,
        role: "super_admin",
        lenderId: null,
      },
    },
    {
      status: 200,
    }
  );
}

    // --------------------------------------------------
    // 3. Normal MongoDB user login
    // --------------------------------------------------

    const user = await getUserByEmail(email);

    if (!user) {
      return Response.json(
        {
          error: "Invalid email or password",
        },
        {
          status: 401,
        }
      );
    }

    // Check whether normal user account is active
    if (user.isActive === false) {
      return Response.json(
        {
          error: "Your account has been disabled",
        },
        {
          status: 403,
        }
      );
    }

    // Compare plaintext password against stored bcrypt hash
    const passwordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordValid) {
      return Response.json(
        {
          error: "Invalid email or password",
        },
        {
          status: 401,
        }
      );
    }

    // Create session for normal MongoDB user
    await createSession({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      lenderId: user.lenderId ?? null,
    });

    // Return safe user information
    return Response.json(
      {
        message: "Login successful",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          lenderId: user.lenderId ?? null,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Login error:", error);

    return Response.json(
      {
        error: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}