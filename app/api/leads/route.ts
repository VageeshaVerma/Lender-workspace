import { NextRequest } from "next/server";

import { getSession } from "@/lib/auth/session";
import { getLeadsForUser } from "@/lib/db/leads";

function parseNumber(value: string | null) {
  if (!value) return undefined;

  const number = Number(value);

  return Number.isFinite(number) ? number : undefined;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const status =
      searchParams.get("status") || undefined;

    const search =
      searchParams.get("search") || undefined;

    const fromDate =
      searchParams.get("fromDate") || undefined;

    const toDate =
      searchParams.get("toDate") || undefined;

    const minAmount = parseNumber(
      searchParams.get("minAmount")
    );

    const maxAmount = parseNumber(
      searchParams.get("maxAmount")
    );

    const followUpDue =
      searchParams.get("followUpDue") === "true";

    /*
     * Only ops_admin should be able to select
     * a lender from the UI.
     *
     * getLeadsForUser still enforces this on the server.
     */
    const lenderId =
      searchParams.get("lenderId") || undefined;

    const page = Math.max(
      Number(searchParams.get("page")) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number(searchParams.get("limit")) || 20,
        1
      ),
      100
    );

    const result = await getLeadsForUser(session, {
      status,
      search,
      fromDate,
      toDate,
      minAmount,
      maxAmount,
      followUpDue,
      lenderId,
      page,
      limit,
    });

    return Response.json(result);
  } catch (error) {
    console.error("GET /api/leads error:", error);

    return Response.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}