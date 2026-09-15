import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { parse } from "csv-parse/sync";
import clientPromise from "../lib/db/mongodb";

dotenv.config({ path: ".env.local" });

type LenderCSVRow = {
  lender_id: string;
  name: string;
  isActive: string;
  priority: string;
  flow: string;
  minAge: string;
  maxAge: string;
  minIncome: string;
  minCreditScore_exclusive: string;
  maxCreditScore_inclusive: string;
  employmentTypes: string;
  supportedPincodes: string;
  maxLeadsPerDay: string;
  preflight: string;
  leadOnly: string;
  minAppVersion: string;
  offerApproval: string;
  canShowProvisionalOffer: string;
};

function parseNumber(value: string) {
  if (!value || value.trim() === "") {
    return null;
  }

  return Number(value);
}

function parseBoolean(value: string) {
  if (!value || value.trim() === "") {
    return null;
  }

  return value.trim().toLowerCase() === "true";
}

function parseString(value: string) {
  if (!value || value.trim() === "") {
    return null;
  }

  return value.trim();
}

async function seedLenders() {
  try {
    console.log("Starting lender seed...");

    const csvPath = path.join(
      process.cwd(),
      "data",
      "lenders.csv"
    );

    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");

    const rows: LenderCSVRow[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`Found ${rows.length} lenders in CSV.`);

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const lendersCollection = db.collection("lenders");

    for (const row of rows) {
      const lender = {
        lender_id: row.lender_id,
        name: row.name,
        isActive: parseBoolean(row.isActive),
        priority: parseNumber(row.priority),
        flow: parseString(row.flow),
        minAge: parseNumber(row.minAge),
        maxAge: parseNumber(row.maxAge),
        minIncome: parseNumber(row.minIncome),
        minCreditScore_exclusive: parseNumber(
          row.minCreditScore_exclusive
        ),
        maxCreditScore_inclusive: parseNumber(
          row.maxCreditScore_inclusive
        ),
        employmentTypes: parseString(row.employmentTypes),
        supportedPincodes: parseString(row.supportedPincodes),
        maxLeadsPerDay: parseNumber(row.maxLeadsPerDay),
        preflight: parseString(row.preflight),
        leadOnly: parseString(row.leadOnly),
        minAppVersion: parseString(row.minAppVersion),
        offerApproval: parseString(row.offerApproval),
        canShowProvisionalOffer: parseBoolean(
          row.canShowProvisionalOffer
        ),
      };


      //updation
      await lendersCollection.updateOne(
        {
          lender_id: lender.lender_id,
        },
        {
          $set: lender,
        },
        {
          upsert: true,
        }
      );

      console.log(`Seeded: ${lender.lender_id}`);
    }

    console.log("Lender seeding completed successfully.");

    await client.close();
  } catch (error) {
    console.error("Lender seeding failed:", error);
    process.exit(1);
  }
}

seedLenders();