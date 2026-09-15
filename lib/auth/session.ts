import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
/*How do I create a logged-in session?
How do I verify/read the current session?
How do I log the user out?*/

const secret = process.env.SESSION_SECRET;  //Payload + SESSION_SECRET = Signed JWT

if (!secret) {
  throw new Error("SESSION_SECRET is not defined");
}

const secretKey = new TextEncoder().encode(secret); //jose expects the cryptographic key in a suitable byte representation.

export type UserRole =
  | "ops_admin"
  | "lender_admin"
  | "lender_agent"
  | "super_admin";

export type SessionPayload = {
  userId: string;
  email: string;
  role: UserRole;
  lenderId: string | null;  //establishes which lender tenant the user belongs to null for ops_admin
};

export async function createSession(payload: SessionPayload) {   //authentication
  const token = await new SignJWT(payload)   //userId email role lenderId
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);

  const cookieStore = await cookies();

  cookieStore.set("session", token, {
    httpOnly: true,   //normal browser JavaScript can't directly read the cookie.
    secure: process.env.NODE_ENV === "production",   //Development → secure = false Production  → secure = true
    sameSite: "lax",  //protection against certain cross-site request attacks
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession(): Promise<SessionPayload | null> {  //Is there a valid logged-in session, and if so, who is it?
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("session")?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, secretKey);  //verifies its cryptographic signature

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as UserRole,
      lenderId: (payload.lenderId as string) ?? null,
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();

  cookieStore.delete("session");
}