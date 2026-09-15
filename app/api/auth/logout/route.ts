import { destroySession } from "@/lib/auth/session";

export async function POST() {
  try {
    await destroySession();

    return Response.json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return Response.json(
      {
        error: "Failed to logout",
      },
      {
        status: 500,
      }
    );
  }
}