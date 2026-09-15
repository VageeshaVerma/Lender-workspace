import clientPromise from "../db/mongodb";
import { ObjectId } from "mongodb";
import { SessionPayload } from "./session";

export async function authorizeLeadAccess(
  leadId: string,
  session: SessionPayload
) {
  // Validate MongoDB ObjectId
  if (!ObjectId.isValid(leadId)) {
    return null;
  }

  const client = await clientPromise;  //connected MongoDB client.
  const db = client.db(process.env.MONGODB_DB);

  const leadLenders = db.collection("lead_lenders");

  const leadObjectId = new ObjectId(leadId);

  // 1. Operations admin
  // Can access relationships across all lenders.
  if (session.role === "ops_admin") {
    return leadLenders.findOne({
      leadId: leadObjectId,
    });
  }

  // Lender users must belong to a lender.
  if (!session.lenderId) {
    return null;
  }

  // 2. Lender admin
  // Can access any lead relationship belonging
  // to their own lender.
  if (session.role === "lender_admin") {
    return leadLenders.findOne({
      leadId: leadObjectId,
      lenderId: session.lenderId,
    });
  }

  // 3. Lender agent
  // Can access only their own lender's relationship
  // AND only leads assigned to them.
  if (session.role === "lender_agent") {
    return leadLenders.findOne({    //return promise
      leadId: leadObjectId,
      lenderId: session.lenderId,
      assignedAgentId: session.userId,
    });
  }

  return null;
}