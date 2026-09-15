import { parse } from "csv-parse/sync";
import { LeadImportRow } from "./types";

export type ParsedLead = {
  sourceLeadId: string;
  borrowerName: string | null;
  phone: string | null;
  loanAmount: number | null;
  loanPurpose: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  maritalStatus: string | null;
  employmentType: string | null;
  income: number | null;
  workExperience: number | null;
  creditScore: number | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  pinCode: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

function toNumber(value: string | undefined): number | null {
  if (!value || value.trim() === "") {
    return null;
  }

  const number = Number(value);

  return Number.isNaN(number) ? null : number;
}

function parseDate(value: string | undefined): Date | null {
  if (!value || value.trim() === "") {
    return null;
  }

  const trimmed = value.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = new Date(`${trimmed}T00:00:00Z`);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  // DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("-");

    const date = new Date(
      `${year}-${month}-${day}T00:00:00Z`
    );

    return Number.isNaN(date.getTime()) ? null : date;
  }

  // ISO timestamp / other formats supported by JS Date
  const date = new Date(trimmed);

  return Number.isNaN(date.getTime()) ? null : date;
}

function cleanString(value: string | undefined): string | null {
  if (!value || value.trim() === "") {
    return null;
  }

  return value.trim();
}

export function parseLeadCSV(csvContent: string): ParsedLead[] {
  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    bom: true,
    trim: true,
  }) as LeadImportRow[];

  return rows.map((row) => {
    const firstName = cleanString(row.first_name);
    const lastName = cleanString(row.last_name);

    const borrowerName = [firstName, lastName]
      .filter(Boolean)
      .join(" ");

    return {
      sourceLeadId: cleanString(row._doc_id) ?? "",

      borrowerName: borrowerName || null,

      phone: cleanString(row.contact_number),

      loanAmount: toNumber(row.loan_amount),

      loanPurpose: cleanString(row.loan_purpose),

      dateOfBirth: parseDate(row.dob),

      gender: cleanString(row.gender),

      maritalStatus: cleanString(row.marital_status),

      employmentType: cleanString(row.employment_type),

      income: toNumber(row.income),

      workExperience: toNumber(row.work_experience),

      creditScore: toNumber(row.credit_score),

      addressLine1: cleanString(row.address_line_1),

      addressLine2: cleanString(row.address_line_2),

      city: cleanString(row.city),

      state: cleanString(row.state),

      pinCode: cleanString(row.pin_code),

      createdAt: parseDate(row.created_at),

      updatedAt: parseDate(row.updated_at),
    };
  });
}

export function validateLeads(leads: ParsedLead[]): string[] {
  const errors: string[] = [];

  leads.forEach((lead, index) => {
    const rowNumber = index + 2;

    if (!lead.sourceLeadId) {
      errors.push(
        `Row ${rowNumber}: _doc_id is required`
      );
    }

    if (
      lead.loanAmount !== null &&
      lead.loanAmount < 0
    ) {
      errors.push(
        `Row ${rowNumber}: loan_amount cannot be negative`
      );
    }

    if (
      lead.income !== null &&
      lead.income < 0
    ) {
      errors.push(
        `Row ${rowNumber}: income cannot be negative`
      );
    }

    if (
      lead.creditScore !== null &&
      (lead.creditScore < 0 ||
        lead.creditScore > 1000)
    ) {
      errors.push(
        `Row ${rowNumber}: credit_score must be between 0 and 1000`
      );
    }
  });

  return errors;
}