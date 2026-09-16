import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {parseLeadCSV,validateLeads,} from "@/lib/import/parseLeads";
import { importLeads } from "@/lib/import/importLeads";

export async function POST(request: Request) {
  try {
    
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    if (session.role !== "ops_admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "CSV file is required" },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "Uploaded file is empty" },
        { status: 400 }
      );
    }

    const csvContent = await file.text();

   
    const leads = parseLeadCSV(csvContent);

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

    const result = await importLeads(leads);

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