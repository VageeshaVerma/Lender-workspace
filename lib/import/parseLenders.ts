import { parse } from "csv-parse/sync";
import { LenderImportRow } from "./types";

export type ParsedLender = {
  lender_id: string;
  name: string;
  isActive: boolean | null;
  priority: number | null;
  flow: string | null;
  minAge: number | null;
  maxAge: number | null;
  minIncome: number | null;
  minCreditScore_exclusive: number | null;
  maxCreditScore_inclusive: number | null;
  employmentTypes: string | null;
  supportedPincodes: string | null;
  maxLeadsPerDay: number | null;
  preflight: string | null;
  leadOnly: string | null;
  minAppVersion: string | null;
  offerApproval: string | null;
  canShowProvisionalOffer: boolean | null;
};

function parseNumber(value: string | undefined): number | null {
  if (!value || value.trim() === "") {
    return null;
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return null;
  }

  return number;
}

function parseBoolean(value: string | undefined): boolean | null {
  if (!value || value.trim() === "") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return null;
}

function parseString(value: string | undefined): string | null {
  if (!value || value.trim() === "") {
    return null;
  }

  return value.trim();
}

export function parseLenderCSV(csvContent: string): ParsedLender[] {
  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as LenderImportRow[];

  return rows
    .map((row) => ({
      lender_id: row.lender_id?.trim() ?? "",
      name: row.name?.trim() ?? "",
      isActive: parseBoolean(row.isActive),
      priority: parseNumber(row.priority),
      flow: parseString(row.flow),
      minAge: parseNumber(row.minAge),
      maxAge: parseNumber(row.maxAge),
      minIncome: parseNumber(row.minIncome),
      minCreditScore_exclusive: parseNumber(
        row.minCreditScore_exclusive
      ),
      maxCreditScore_inclusive: parseNumber(
        row.maxCreditScore_inclusive
      ),
      employmentTypes: parseString(row.employmentTypes),
      supportedPincodes: parseString(row.supportedPincodes),
      maxLeadsPerDay: parseNumber(row.maxLeadsPerDay),
      preflight: parseString(row.preflight),
      leadOnly: parseString(row.leadOnly),
      minAppVersion: parseString(row.minAppVersion),
      offerApproval: parseString(row.offerApproval),
      canShowProvisionalOffer: parseBoolean(
        row.canShowProvisionalOffer
      ),
    }));
}

export function validateLenders(
  lenders: ParsedLender[]
): string[] {
  const errors: string[] = [];

  lenders.forEach((lender, index) => {
    const rowNumber = index + 2;

    if (!lender.lender_id) {
      errors.push(
        `Row ${rowNumber}: lender_id is required`
      );
    }

    if (!lender.name) {
      errors.push(
        `Row ${rowNumber}: name is required`
      );
    }

    if (
      lender.minAge !== null &&
      lender.maxAge !== null &&
      lender.minAge > lender.maxAge
    ) {
      errors.push(
        `Row ${rowNumber}: minAge cannot be greater than maxAge`
      );
    }

    if (
      lender.minCreditScore_exclusive !== null &&
      lender.maxCreditScore_inclusive !== null &&
      lender.minCreditScore_exclusive >=
        lender.maxCreditScore_inclusive
    ) {
      errors.push(
        `Row ${rowNumber}: minimum credit score must be less than maximum credit score`
      );
    }
  });

  return errors;
}