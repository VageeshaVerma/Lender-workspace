type LeadLenderRelationship = {
  status?: string;
  assignmentStatus?: string;
  eligibilityStatus?: string;
};

export type CustomerApplicationStage =
  | "Submitted"
  | "Under Review"
  | "Agent Assigned"
  | "Approved"
  | "Rejected"
  | "Disbursed";

export function getCustomerApplicationStage(
  relationships: LeadLenderRelationship[],
  leadEligibilityStatus?: string
): CustomerApplicationStage {

  // 1. If any lender has disbursed the loan
  if (
    relationships.some(
      (relationship) =>
        relationship.status === "disbursed"
    )
  ) {
    return "Disbursed";
  }

  // 2. If any lender has approved the application
  if (
    relationships.some(
      (relationship) =>
        relationship.status === "approved"
    )
  ) {
    return "Approved";
  }

  // 3. If an agent has been assigned
  if (
    relationships.some(
      (relationship) =>
        relationship.assignmentStatus === "assigned"
    )
  ) {
    return "Agent Assigned";
  }

  // 4. If at least one lender is eligible,
  // the application is under review
  if (
    relationships.some(
      (relationship) =>
        relationship.eligibilityStatus === "eligible"
    )
  ) {
    return "Under Review";
  }

  // 5. If the master lead is ineligible,
  // no lender relationship may exist.
  if (leadEligibilityStatus === "ineligible") {
    return "Rejected";
  }

  // 6. If relationships exist and all are ineligible
  if (
    relationships.length > 0 &&
    relationships.every(
      (relationship) =>
        relationship.eligibilityStatus === "ineligible"
    )
  ) {
    return "Rejected";
  }

  // 7. No lender relationships and no final eligibility decision
  return "Submitted";
}