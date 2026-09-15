//needs improvement
import clientPromise from "./mongodb";

export async function createLeadLenderRelationship(
  data: {
    leadId: any;
    lenderId: string;
    eligibilityStatus: string;
    assignedAgentId?: string | null;
  }
) {
  const client = await clientPromise;

  const db = client.db(process.env.MONGODB_DB);   //select db

  return db
    .collection("lead_lenders")
    .updateOne(
      {
        leadId: data.leadId,
        lenderId: data.lenderId,  //composite key
      },
      {
        $set: {
          eligibilityStatus: data.eligibilityStatus,
          assignmentStatus:data.assignedAgentId ? "assigned" : "unassigned",
          assignedAgentId: data.assignedAgentId ?? null,
          updatedAt: new Date(),
        },
        $setOnInsert: {    //Set these fields ONLY if MongoDB creates a new document works with upsert
          leadId: data.leadId,
          lenderId: data.lenderId,
          status: "new",
          followUpDate: null,
          createdAt: new Date(),
        },
      },
      {
        upsert: true,   //update + insert
      }
    );
}

//junction table