import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { getLeadsForExport } from "@/lib/db/leadExport";

export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    // 2. Read filters from URL
    const { searchParams } = new URL(request.url);

    const status =
      searchParams.get("status") || undefined;

    const search =
      searchParams.get("search") || undefined;

    const lenderId =
      searchParams.get("lenderId") || undefined;

    const followUpDue =
      searchParams.get("followUpDue") === "true";

    const fromDate =
      searchParams.get("fromDate") || undefined;

    const toDate =
      searchParams.get("toDate") || undefined;

    const minAmountParam =
      searchParams.get("minAmount");

    const maxAmountParam =
      searchParams.get("maxAmount");

    const minAmount =
      minAmountParam
        ? Number(minAmountParam)
        : undefined;

    const maxAmount =
      maxAmountParam
        ? Number(maxAmountParam)
        : undefined;

    // 3. Get authorized filtered leads
    const leads = await getLeadsForExport(
      session,
      {
        status,
        search,
        lenderId,
        followUpDue,
        fromDate,
        toDate,
        minAmount,
        maxAmount,
      }
    );

    // 4. Convert records to CSV
    const headers = [
      "Lead ID",
      "Lender ID",
      "Borrower Name",
      "Phone",
      "Loan Amount",
      "Loan Purpose",
      "Employment Type",
      "Income",
      "Credit Score",
      "City",
      "State",
      "Pincode",
      "Status",
      "Assignment Status",
      "Assigned Agent ID",
      "Follow Up Date",
      "Created At",
    ];

    const escapeCsv = (value: unknown) => {
      if (value === null || value === undefined) {
        return "";
      }

      const stringValue = String(value);

      return `"${stringValue.replace(/"/g, '""')}"`;
    };

    const rows = leads.map((item: any) => [
      item.leadId,
      item.lenderId,
      item.borrower?.borrowerName,
      item.borrower?.phone,
      item.borrower?.loanAmount,
      item.borrower?.loanPurpose,
      item.borrower?.employmentType,
      item.borrower?.income,
      item.borrower?.creditScore,
      item.borrower?.city,
      item.borrower?.state,
      item.borrower?.pincode,
      item.status,
      item.assignmentStatus,
      item.assignedAgentId,
      item.followUpDate,
      item.createdAt,
    ]);

    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) =>
        row.map(escapeCsv).join(",")
      ),
    ].join("\n");

    // 5. Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="leads-export.csv"',
      },
    });
  } catch (error) {
    console.error("Lead export error:", error);

    return NextResponse.json(
      {
        error: "Failed to export leads",
      },
      {
        status: 500,
      }
    );
  }
}