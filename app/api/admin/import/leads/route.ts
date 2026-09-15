import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import {
  parseLeadCSV,
  validateLeads,
} from "@/lib/import/parseLeads";
import { importLeads } from "@/lib/import/importLeads";

export async function POST(request: Request) {
  try {
    /*
     * 1. Authenticate the request.
     */
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /*
     * 2. Only ops_admin can import leads.
     */
    if (session.role !== "ops_admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    /*
     * 3. Read multipart/form-data.
     */
    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "CSV file is required" },
        { status: 400 }
      );
    }

    /*
     * 4. Basic file validation.
     */
    if (file.size === 0) {
      return NextResponse.json(
        { error: "Uploaded file is empty" },
        { status: 400 }
      );
    }

    /*
     * 5. Read CSV contents.
     */
    const csvContent = await file.text();

    /*
     * 6. Parse CSV.
     */
    const leads = parseLeadCSV(csvContent);

    /*
     * 7. Validate parsed leads.
     */
    const validationErrors = validateLeads(leads);

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    /*
     * 8. Import only new leads.
     */
    const result = await importLeads(leads);

    /*
     * 9. Return import summary.
     */
    return NextResponse.json({
      message: "Lead import completed",
      result,
    });
  } catch (error) {
    console.error("Lead CSV import error:", error);

    return NextResponse.json(
      {
        error: "Failed to import leads",
      },
      { status: 500 }
    );
  }
}