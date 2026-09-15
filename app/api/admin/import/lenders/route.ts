import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import {
  parseLenderCSV,
  validateLenders,
} from "@/lib/import/parseLenders";
import { importLenders } from "@/lib/import/importLenders";

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
     * 2. Only ops_admin can import lenders.
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

    console.log("FORM DATA ENTRIES:");

for (const [key, value] of formData.entries()) {
  console.log(
    key,
    typeof value,
    value instanceof File ? "File" : value
  );
}

console.log("FILE VALUE:", file);

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
    const lenders = parseLenderCSV(csvContent);

    /*
     * 7. Validate parsed records.
     */
    const validationErrors = validateLenders(lenders);

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
     * 8. Import only new lenders.
     */
    const result = await importLenders(lenders);

    /*
     * 9. Return import summary.
     */
    return NextResponse.json({
      message: "Lender import completed",
      result,
    });
  } catch (error) {
    console.error("Lender CSV import error:", error);

    return NextResponse.json(
      {
        error: "Failed to import lenders",
      },
      { status: 500 }
    );
  }
}