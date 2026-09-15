import clientPromise from "@/lib/db/mongodb";
import {
  evaluateLenderEligibility,
  EligibilityResult,
  Lender,
} from "./lenderEligibility";

export async function runBREForLead(
  lead: any
): Promise<EligibilityResult[]> {
  const client = await clientPromise;

  const db = client.db(
    process.env.MONGODB_DB
  );

  const lenders = await db
    .collection<Lender>("lenders")
    .find({
      isActive: true,
    })
    .toArray();

  const results: EligibilityResult[] = [];

  for (const lender of lenders) {
    const result = evaluateLenderEligibility(
      lead,
      lender
    );

    results.push(result);
  }

  return results.sort(
    (a, b) =>
      a.priority - b.priority
  );
}