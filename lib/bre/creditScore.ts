export type CreditScoreInput = {
  income: number;
  employmentType: string;
  workExperience: number;
  loanAmount: number;
};

export function calculateDevelopmentCreditScore(
  data: CreditScoreInput
): number {
  let score = 300;

  // 1. Income
  if (data.income >= 600000) {
    score += 150;
  } else if (data.income >= 400000) {
    score += 120;
  } else if (data.income >= 250000) {
    score += 90;
  } else if (data.income >= 150000) {
    score += 60;
  } else {
    score += 30;
  }

  // 2. Employment stability
  const employmentType =
    data.employmentType.trim().toLowerCase();

  if (employmentType === "salaried") {
    score += 120;
  } else if (employmentType === "self-employed") {
    score += 100;
  } else if (employmentType === "business") {
    score += 90;
  } else {
    score += 50;
  }

  // 3. Work experience
  if (data.workExperience >= 5) {
    score += 100;
  } else if (data.workExperience >= 3) {
    score += 80;
  } else if (data.workExperience >= 1) {
    score += 60;
  } else {
    score += 30;
  }

  // 4. Loan amount compared with annual income
  const loanToIncomeRatio =
    data.loanAmount / data.income;

  if (loanToIncomeRatio <= 0.2) {
    score += 100;
  } else if (loanToIncomeRatio <= 0.4) {
    score += 70;
  } else if (loanToIncomeRatio <= 0.6) {
    score += 40;
  } else {
    score += 20;
  }

  // Keep score within standard credit-score range
  return Math.min(850, Math.max(300, score));
}