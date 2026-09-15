export type LenderImportRow = {
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

export type LeadImportRow = Record<string, string>;