import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";

export type CreateDisbursementData = {
  leadId: ObjectId;
  lenderId: string;
  leadLenderId: ObjectId;
  loanOfferId: ObjectId;
  amount: number;
  date: Date;
  referenceNumber: string;
};

export async function createDisbursement(
  data: CreateDisbursementData
) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const disbursement = {
    leadId: data.leadId,
    lenderId: data.lenderId,
    leadLenderId: data.leadLenderId,
    loanOfferId: data.loanOfferId,
    amount: data.amount,
    date: data.date,
    referenceNumber: data.referenceNumber,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db
    .collection("loan_disbursements")
    .insertOne(disbursement);

  return {
    _id: result.insertedId,
    ...disbursement,
  };
}