import { z } from "zod";

export const customerLeadSchema = z.object({
  loanAmount: z.coerce
    .number()
    .positive("Loan amount must be greater than 0"),

  loanPurpose: z
    .string()
    .min(2, "Loan purpose is required"),

  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required"),

  gender: z
    .string()
    .min(1, "Gender is required"),

  maritalStatus: z
    .string()
    .min(1, "Marital status is required"),

  employmentType: z
    .string()
    .min(1, "Employment type is required"),

  income: z.coerce
    .number()
    .nonnegative("Income cannot be negative"),

  workExperience: z.coerce
    .number()
    .nonnegative("Work experience cannot be negative"),

  addressLine1: z
    .string()
    .min(1, "Address is required"),

  addressLine2: z
    .string()
    .optional(),

  city: z
    .string()
    .min(1, "City is required"),

  state: z
    .string()
    .min(1, "State is required"),

  pincode: z
    .string()
    .regex(/^\d{6}$/, "Invalid pincode"),
});