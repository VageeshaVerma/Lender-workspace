type Lead = {
  _id?: any;
  sourceLeadId?: string;
  borrowerName: string;
  phone: string | null;
  loanAmount: number | null;
  loanPurpose: string | null;
  dateOfBirth: Date | null;
  employmentType: string | null;
  income: number | null;
  creditScore: number | null;
  pincode: string | null;
};

export type Lender = {
  lender_id: string;
  name: string;
  isActive: boolean;
  priority: number;
  minAge: number | null;
  maxAge: number | null;
  minIncome: number | null;
  minCreditScore_exclusive: number | null;
  maxCreditScore_inclusive: number | null;
  employmentTypes: string | null;
  supportedPincodes: string | null;
};

export type EligibilityResult = {
  lenderId: string;
  lenderName: string;
  priority: number;
  eligible: boolean;
  reasons: string[];
};

function calculateAge(dateOfBirth: Date | null) {
  if (!dateOfBirth) {
    return null;
  }
  const today = new Date();

  let age =today.getFullYear() - dateOfBirth.getFullYear();

  const monthDifference =today.getMonth() - dateOfBirth.getMonth();

  if (monthDifference < 0 || ( monthDifference === 0 && today.getDate() < dateOfBirth.getDate())
  ) {
    age--;
  }

  return age;
}

function checkEmploymentType(
  lead: Lead,
  lender: Lender
) {
  if (!lender.employmentTypes) {
    return true;
  }

  if (!lead.employmentType) {
    return false;
  }

  const allowedTypes =
    lender.employmentTypes
      .split("+")
      .map((type) => type.trim().toLowerCase());

  return allowedTypes.includes(
    lead.employmentType.toLowerCase()
  );
}

function checkPincode(
  lead: Lead,
  lender: Lender
) {
  if (!lender.supportedPincodes) {
    return true;
  }

  if (
    lender.supportedPincodes
      .trim()
      .toUpperCase() === "ALL"
  ) {
    return true;
  }

  if (!lead.pincode) {
    return false;
  }

  const allowedPincodes =
    lender.supportedPincodes
      .split("+")
      .map((pincode) => pincode.trim());

  return allowedPincodes.includes(
    lead.pincode
  );
}

export function evaluateLenderEligibility(
  lead: Lead,
  lender: Lender
): EligibilityResult {
  const reasons: string[] = [];

  // Lender must be active
  if (!lender.isActive) {
    reasons.push("Lender is inactive");
  }

  const age = calculateAge(
    lead.dateOfBirth
  );

  if (age === null) {
    reasons.push("Date of birth is missing");
  } else {
    if (
      lender.minAge !== null &&
      age < lender.minAge
    ) {
      reasons.push(
        `Age ${age} is below minimum ${lender.minAge}`
      );
    }

    if (
      lender.maxAge !== null &&
      age > lender.maxAge
    ) {
      reasons.push(
        `Age ${age} is above maximum ${lender.maxAge}`
      );
    }
  }

  // Income
  if (
    lender.minIncome !== null
  ) {
    if (lead.income === null) {
      reasons.push("Income is missing");
    } else if (
      lead.income < lender.minIncome
    ) {
      reasons.push(
        `Income ${lead.income} is below minimum ${lender.minIncome}`
      );
    }
  }

  // Credit score
  if (
    lender.minCreditScore_exclusive !== null
  ) {
    if (lead.creditScore === null) {
      reasons.push(
        "Credit score is missing"
      );
    } else if (
      lead.creditScore <=
      lender.minCreditScore_exclusive
    ) {
      reasons.push(
        `Credit score ${lead.creditScore} must be greater than ${lender.minCreditScore_exclusive}`
      );
    }
  }

  if (
    lender.maxCreditScore_inclusive !== null &&
    lead.creditScore !== null &&
    lead.creditScore >
      lender.maxCreditScore_inclusive
  ) {
    reasons.push(
      `Credit score ${lead.creditScore} exceeds maximum ${lender.maxCreditScore_inclusive}`
    );
  }

  // Employment type
  if (
    !checkEmploymentType(
      lead,
      lender
    )
  ) {
    reasons.push(
      `Employment type ${lead.employmentType ?? "missing"} is not supported`
    );
  }

  // Pincode
  if (
    !checkPincode(
      lead,
      lender
    )
  ) {
    reasons.push(
      `Pincode ${lead.pincode ?? "missing"} is not supported`
    );
  }

  return {
    lenderId: lender.lender_id,
    lenderName: lender.name,
    priority: lender.priority,
    eligible: reasons.length === 0,
    reasons,
  };
}