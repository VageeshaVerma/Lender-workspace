import clientPromise from "../db/mongodb";
import { ParsedLender } from "./parseLenders";

export type LenderImportResult = {
  rowsProcessed: number;
  inserted: number;
  skippedExisting: number;
  skippedDuplicateInFile: number;
};

export async function importLenders(
  lenders: ParsedLender[]
): Promise<LenderImportResult> {
  const client = await clientPromise;
  const db = client.db("lender_workspace");

  const lendersCollection = db.collection("lenders");

  if (lenders.length === 0) {
    return {
      rowsProcessed: 0,
      inserted: 0,
      skippedExisting: 0,
      skippedDuplicateInFile: 0,
    };
  }

  /*
   * Step 1:
   * Remove duplicate lender_id values from the same CSV file.
   */
  const uniqueLenders = new Map<string, ParsedLender>();

  let skippedDuplicateInFile = 0;

  for (const lender of lenders) {
    if (uniqueLenders.has(lender.lender_id)) {
      skippedDuplicateInFile++;
      continue;
    }

    uniqueLenders.set(lender.lender_id, lender);
  }

  const uniqueLenderList = Array.from(uniqueLenders.values());

  /*
   * Step 2:
   * Find which lender IDs already exist in MongoDB.
   */
  const lenderIds = uniqueLenderList.map(
    (lender) => lender.lender_id
  );

  const existingLenders = await lendersCollection
    .find(
      {
        lender_id: {
          $in: lenderIds,
        },
      },
      {
        projection: {
          lender_id: 1,
        },
      }
    )
    .toArray();

  const existingIds = new Set(
    existingLenders.map((lender) => lender.lender_id)
  );

  /*
   * Step 3:
   * Only keep genuinely new lenders.
   */
  const newLenders = uniqueLenderList.filter(
    (lender) => !existingIds.has(lender.lender_id)
  );

  /*
   * Step 4:
   * Insert only new lenders.
   */
  if (newLenders.length > 0) {
    await lendersCollection.insertMany(newLenders, {
      ordered: false,
    });
  }

  return {
    rowsProcessed: lenders.length,
    inserted: newLenders.length,
    skippedExisting: existingIds.size,
    skippedDuplicateInFile,
  };
}