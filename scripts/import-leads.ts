
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { parse } from "csv-parse/sync";
import clientPromise from "../lib/db/mongodb";

dotenv.config({ path: ".env.local" });

type CsvRow = Record<string, string>;

function toNumber(value: string | undefined): number | null {
  if (!value || value.trim() === "") {
    return null;
  }

  const number = Number(value);

  return Number.isNaN(number) ? null : number;
}

function parseDate(value: string | undefined): Date | null {
  if (!value || value.trim() === "") {
    return null;
  }

  const text = value.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const date = new Date(`${text}T00:00:00.000Z`);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  // DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(text)) {
    const [day, month, year] = text.split("-");

    const date = new Date(
      `${year}-${month}-${day}T00:00:00.000Z`
    );

    return Number.isNaN(date.getTime()) ? null : date;
  }

  // ISO timestamp
  const date = new Date(text);

  return Number.isNaN(date.getTime()) ? null : date;
}

function cleanString(
  value: string | undefined
): string | null {
  if (!value) {
    return null;
  }

  const cleaned = value.trim();

  return cleaned === "" ? null : cleaned;
}

async function importLeads() {
  const filePath = path.join(
    process.cwd(),
    "data",
    "leads.csv"
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `CSV file not found: ${filePath}`
    );
  }

  console.log(
    `Reading CSV: ${filePath}`
  );

  const csvContent = fs.readFileSync(
    filePath,
    "utf-8"
  );

  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    bom: true,
  }) as CsvRow[];

  console.log(
    `CSV rows found: ${rows.length}`
  );

  // Debug the first CSV row
  console.log("\nFirst CSV row:");

  console.log({
    id: rows[0]?._doc_id,
    firstName: rows[0]?.first_name,
    lastName: rows[0]?.last_name,
    phone: rows[0]?.contact_number,
    income: rows[0]?.income,
    creditScore: rows[0]?.credit_score,
    dob: rows[0]?.dob,
    employmentType: rows[0]?.employment_type,
    pincode: rows[0]?.pin_code,
  });

  // Check how many rows contain each important field
  console.log("\nField availability:");

  console.log(
    "first_name:",
    rows.filter(
      (r) => r["first_name"]?.trim()
    ).length
  );

  console.log(
    "last_name:",
    rows.filter(
      (r) => r["last_name"]?.trim()
    ).length
  );

  console.log(
    "credit_score:",
    rows.filter(
      (r) => r["credit_score"]?.trim()
    ).length
  );

  console.log(
    "dob:",
    rows.filter(
      (r) => r["dob"]?.trim()
    ).length
  );

  console.log(
    "employment_type:",
    rows.filter(
      (r) => r["employment_type"]?.trim()
    ).length
  );

  console.log(
    "pin_code:",
    rows.filter(
      (r) => r["pin_code"]?.trim()
    ).length
  );

  const client = await clientPromise;

  const db = client.db(
    process.env.MONGODB_DB
  );

  const leadsCollection =
    db.collection("leads");

  await leadsCollection.createIndex(
    { sourceLeadId: 1 },
    { unique: true }
  );

  const operations = [];

  let skipped = 0;

  for (const row of rows) {
    const sourceLeadId =
      cleanString(row["_doc_id"]);

    if (!sourceLeadId) {
      skipped++;
      continue;
    }

    const firstName =
      cleanString(row["first_name"]);

    const lastName =
      cleanString(row["last_name"]);

    const borrowerName = [
      firstName,
      lastName,
    ]
      .filter(Boolean)
      .join(" ");

    const lead = {
      sourceLeadId,

      borrowerName:
        borrowerName || "Unknown",

      phone:
        cleanString(
          row["contact_number"]
        ),

      loanAmount:
        toNumber(
          row["loan_amount"]
        ),

      loanPurpose:
        cleanString(
          row["loan_purpose"]
        ),

      dateOfBirth:
        parseDate(
          row["dob"]
        ),

      gender:
        cleanString(
          row["gender"]
        ),

      maritalStatus:
        cleanString(
          row["marital_status"]
        ),

      employmentType:
        cleanString(
          row["employment_type"]
        ),

      income:
        toNumber(
          row["income"]
        ),

      workExperience:
        toNumber(
          row["work_experience"]
        ),

      creditScore:
        toNumber(
          row["credit_score"]
        ),

      addressLine1:
        cleanString(
          row["address_line_1"]
        ),

      addressLine2:
        cleanString(
          row["address_line_2"]
        ),

      city:
        cleanString(
          row["city"]
        ),

      state:
        cleanString(
          row["state"]
        ),

      pincode:
        cleanString(
          row["pin_code"]
        ),

      createdAt:
        parseDate(
          row["created_at"]
        ) ?? new Date(),

      updatedAt:
        parseDate(
          row["updated_at"]
        ) ?? new Date(),
    };

    operations.push({
      updateOne: {
        filter: {
          sourceLeadId,
        },

        update: {
          $set: lead,
        },

        upsert: true,
      },
    });
  }

  if (operations.length > 0) {
    const result =
      await leadsCollection.bulkWrite(
        operations,
        {
          ordered: false,
        }
      );

    console.log(
      "\nImport completed."
    );

    console.log(
      `Inserted: ${result.upsertedCount}`
    );

    console.log(
      `Updated: ${result.modifiedCount}`
    );
  }

  console.log(
    `Skipped rows: ${skipped}`
  );

  const total =
    await leadsCollection.countDocuments();

  console.log(
    `Total leads in MongoDB: ${total}`
  );

  await client.close();
}

importLeads()
  .then(() => {
    console.log("\nDone.");
    process.exit(0);
  })
  .catch((error) => {
    console.error(
      "\nImport failed:",
      error
    );

    process.exit(1);
  });
