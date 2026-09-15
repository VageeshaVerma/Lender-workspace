import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

import clientPromise from "../lib/db/mongodb";
import { runBREForLead } from "../lib/bre/runBRE";
import { assignAgentRoundRobin } from "../lib/db/assignment";
import {
  createLeadLenderRelationship,
} from "../lib/db/leadLenders";

async function processLeads() {
  const client = await clientPromise;

  const db = client.db(
    process.env.MONGODB_DB
  );

  console.log("\n================================");
  console.log("   BRE → LEAD LENDER PROCESSING");
  console.log("================================\n");

  // Get all imported leads
  const leads = await db
    .collection("leads")
    .find({})
    .toArray();

  console.log(
    `Total leads found: ${leads.length}\n`
  );

  if (leads.length === 0) {
    console.log(
      "No leads found. Run the importer first."
    );

    await client.close();
    return;
  }

  // Counters for final summary
  let processedLeads = 0;
  let eligibleRelationships = 0;
  let assignedRelationships = 0;
  let unassignedRelationships = 0;
  let noEligibleLenderLeads = 0;
  let errors = 0;

  // Keep track of lender-level counts
  const lenderStats: Record<
    string,
    {
      eligible: number;
      assigned: number;
      unassigned: number;
    }
  > = {};

  for (const lead of leads) {
    processedLeads++;

    try {
      console.log(
        `\n[${processedLeads}/${leads.length}] Processing: ${
          lead.borrowerName ?? "Unknown"
        }`
      );

      // ---------------------------------------
      // 1. Run Business Rule Engine
      // ---------------------------------------

      const breResults =
        await runBREForLead(lead);

      // Only eligible lenders
      const eligibleLenders =
        breResults.filter(
          (result) => result.eligible
        );

      console.log(
        `Eligible lenders: ${eligibleLenders.length}`
      );

      // ---------------------------------------
      // 2. No eligible lender
      // ---------------------------------------

      if (
        eligibleLenders.length === 0
      ) {
        noEligibleLenderLeads++;

        console.log(
          "No eligible lenders found."
        );

        continue;
      }

      // ---------------------------------------
      // 3. Process every eligible lender
      // ---------------------------------------

      for (const result of eligibleLenders) {
        const lenderId =
          result.lenderId;

        console.log(
          `  → ${result.lenderName} (${lenderId})`
        );

        // Initialize lender statistics
        if (!lenderStats[lenderId]) {
          lenderStats[lenderId] = {
            eligible: 0,
            assigned: 0,
            unassigned: 0,
          };
        }

        lenderStats[lenderId].eligible++;
        eligibleRelationships++;

        // ---------------------------------------
        // 4. Find agent using round-robin
        // ---------------------------------------

        const agentId =
          await assignAgentRoundRobin(
            lenderId
          );

        // ---------------------------------------
        // 5. Create/update relationship
        // ---------------------------------------

        await createLeadLenderRelationship({
          leadId: lead._id,
          lenderId,
          eligibilityStatus:
            "eligible",
          assignedAgentId:
            agentId,
        });

        // ---------------------------------------
        // 6. Log assignment result
        // ---------------------------------------

        if (agentId) {
          assignedRelationships++;
          lenderStats[lenderId].assigned++;

          console.log(
            `     ✓ Assigned to agent: ${agentId}`
          );
        } else {
          unassignedRelationships++;
          lenderStats[lenderId].unassigned++;

          console.log(
            `     ⚠ No active agent. Relationship left unassigned.`
          );
        }
      }
    } catch (error) {
      errors++;

      console.error(
        `  ✗ Error processing lead ${lead._id}:`,
        error
      );
    }
  }

  // ---------------------------------------
  // Final summary
  // ---------------------------------------

  console.log(
    "\n\n================================"
  );
  console.log(
    "       PROCESSING COMPLETE"
  );
  console.log(
    "================================\n"
  );

  console.log(
    `Total leads:              ${leads.length}`
  );

  console.log(
    `Processed leads:          ${processedLeads}`
  );

  console.log(
    `Eligible relationships:   ${eligibleRelationships}`
  );

  console.log(
    `Assigned relationships:   ${assignedRelationships}`
  );

  console.log(
    `Unassigned relationships: ${unassignedRelationships}`
  );

  console.log(
    `No eligible lender:       ${noEligibleLenderLeads}`
  );

  console.log(
    `Errors:                   ${errors}`
  );

  // ---------------------------------------
  // Lender statistics
  // ---------------------------------------

  console.log(
    "\n================================"
  );
  console.log(
    "       LENDER STATISTICS"
  );
  console.log(
    "================================\n"
  );

  for (const [
    lenderId,
    stats,
  ] of Object.entries(lenderStats)) {
    console.log(
      `${lenderId}:`
    );

    console.log(
      `  Eligible:   ${stats.eligible}`
    );

    console.log(
      `  Assigned:   ${stats.assigned}`
    );

    console.log(
      `  Unassigned: ${stats.unassigned}`
    );

    console.log("");
  }

  // ---------------------------------------
  // Verify database count
  // ---------------------------------------

  const relationshipCount =
    await db
      .collection("lead_lenders")
      .countDocuments();

  console.log(
    "================================"
  );

  console.log(
    `Total lead_lenders documents: ${relationshipCount}`
  );

  console.log(
    "================================\n"
  );

  await client.close();

  console.log(
    "Database connection closed."
  );

  console.log(
    "Done."
  );
}

processLeads()
  .catch((error) => {
    console.error(
      "\nFatal error:",
      error
    );

    process.exit(1);
  });