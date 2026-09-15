import clientPromise from "../db/mongodb";
import { ParsedLead } from "./parseLeads";

export type LeadImportResult = {
  rowsProcessed: number;
  inserted: number;
  skippedExisting: number;
  skippedDuplicateInFile: number;
};

export async function importLeads(
  leads: ParsedLead[]
): Promise<LeadImportResult> {
  const client = await clientPromise;
  const db = client.db("lender_workspace");

  const leadsCollection = db.collection("leads");

  if (leads.length === 0) {
    return {
      rowsProcessed: 0,
      inserted: 0,
      skippedExisting: 0,
      skippedDuplicateInFile: 0,
    };
  }

  /*
   * Step 1:
   * Remove duplicate sourceLeadId values
   * from the same CSV file.
   */
  const uniqueLeads = new Map<string, ParsedLead>();

  let skippedDuplicateInFile = 0;

  for (const lead of leads) {
    if (uniqueLeads.has(lead.sourceLeadId)) {
      skippedDuplicateInFile++;
      continue;
    }

    uniqueLeads.set(lead.sourceLeadId, lead);
  }

  const uniqueLeadList = Array.from(uniqueLeads.values());

  /*
   * Step 2:
   * Find which sourceLeadIds already exist
   * in MongoDB.
   */
  const sourceLeadIds = uniqueLeadList.map(
    (lead) => lead.sourceLeadId
  );

  const existingLeads = await leadsCollection
    .find(
      {
        sourceLeadId: {
          $in: sourceLeadIds,
        },
      },
      {
        projection: {
          sourceLeadId: 1,
        },
      }
    )
    .toArray();

  const existingIds = new Set(
    existingLeads.map((lead) => lead.sourceLeadId)
  );

  /*
   * Step 3:
   * Keep only genuinely new leads.
   */
  const newLeads = uniqueLeadList.filter(
    (lead) => !existingIds.has(lead.sourceLeadId)
  );

  /*
   * Step 4:
   * Insert only new leads.
   */
  if (newLeads.length > 0) {
    await leadsCollection.insertMany(newLeads, {
      ordered: false,
    });
  }

  return {
    rowsProcessed: leads.length,
    inserted: newLeads.length,
    skippedExisting: existingIds.size,
    skippedDuplicateInFile,
  };
}