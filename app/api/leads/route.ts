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

    // --------------------------------------------------
    // Location filters
    // --------------------------------------------------

    const pincode =
      searchParams.get("pincode") || undefined;

    const city =
      searchParams.get("city") || undefined;

    // --------------------------------------------------
    // Loan amount filters
    // --------------------------------------------------

    const minAmount = parseNumber(
      searchParams.get("minAmount")
    );

    const maxAmount = parseNumber(
      searchParams.get("maxAmount")
    );

    // --------------------------------------------------
    // Age filters
    // --------------------------------------------------

    const minAge = parseNumber(
      searchParams.get("minAge")
    );

    const maxAge = parseNumber(
      searchParams.get("maxAge")
    );

    // --------------------------------------------------
    // Income filters
    // --------------------------------------------------

    const minIncome = parseNumber(
      searchParams.get("minIncome")
    );

    const maxIncome = parseNumber(
      searchParams.get("maxIncome")
    );

    const followUpDue =
      searchParams.get("followUpDue") === "true";

    // --------------------------------------------------
    // Assignment filter:
    //
    // all        -> assigned + unassigned
    // assigned   -> only leads already assigned
    // unassigned -> only leads not yet assigned
    //
    // The actual assignment information comes from
    // the lead_lenders collection.
    // --------------------------------------------------

    const assignmentStatus =
      searchParams.get("assignmentStatus") || undefined;

    // --------------------------------------------------
    // Only ops_admin should be able to select
    // a lender from the UI.
    //
    // getLeadsForUser still enforces this on the server.
    // --------------------------------------------------

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

    const result = await getLeadsForUser(
      session,
      {
        status,
        search,
        fromDate,
        toDate,

        // Location filters
        pincode,
        city,

        // Existing numerical filter
        minAmount,
        maxAmount,

        // Age filters
        minAge,
        maxAge,

        // Income filters
        minIncome,
        maxIncome,

        followUpDue,
        assignmentStatus,
        lenderId,

        page,
        limit,
      }
    );

    return Response.json(result);
  } catch (error) {
    console.error(
      "GET /api/leads error:",
      error
    );

    return Response.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}
