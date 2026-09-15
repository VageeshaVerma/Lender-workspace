import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";
import { SessionPayload } from "../auth/session";

export type LeadEventType =
  | "CALL_OUTCOME"
  | "NOTE_ADDED"
  | "FOLLOW_UP_SET"
  | "ASSIGNED"
  | "APPROVED"
  | "REJECTED"
  | "DISBURSED";

type CreateLeadEventData = {
  leadId: ObjectId;
  eventType: LeadEventType;
  data?: Record<string, any>;
};

export async function createLeadEvent(
  session: SessionPayload,
  event: CreateLeadEventData
) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  if (!session.userId) {
    throw new Error("Invalid session");
  }

  if (session.role !== "ops_admin" && !session.lenderId) {
    throw new Error("User has no lenderId");
  }

  const eventDocument = {
    leadId: event.leadId,
    lenderId: session.lenderId ?? null,
    agentId: session.userId,
    eventType: event.eventType,
    data: event.data ?? {},
    createdAt: new Date(),
  };

  const result = await db.collection("lead_events").insertOne(eventDocument);

  return {
    _id: result.insertedId,
    ...eventDocument,
  };
}