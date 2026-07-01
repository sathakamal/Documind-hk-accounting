import { Decimal } from "decimal.js";

export interface MPFCalculation {
  employee: Decimal;
  employer: Decimal;
}

export function calculateMPF(
  relevantIncome: number | Decimal,
  exempt: boolean = false
): MPFCalculation {
  if (exempt) {
    return { employee: new Decimal(0), employer: new Decimal(0) };
  }

  const income = new Decimal(relevantIncome);
  
  // HK MPF rules - relevant income includes basic salary + housing allowance + other cash allowances:
  // - Employee earning < $7,100: 0% employee, 5% employer
  // - $7,100 - $30,000: 5% each
  // - > $30,000: capped at $1,500 each
  
  let employeeContribution = new Decimal(0);
  let employerContribution = Decimal.min(income.times(0.05), 1500);
  
  if (income.greaterThanOrEqualTo(7100)) {
    employeeContribution = Decimal.min(income.times(0.05), 1500);
  }
  
  return {
    employee: employeeContribution,
    employer: employerContribution,
  };
}

export function generatePayrollRunNumber(runDate: Date): string {
  const year = runDate.getFullYear();
  const month = String(runDate.getMonth() + 1).padStart(2, '0');
  return `PR-${year}-${month}`;
}

export function generateEmployeeCode(employeeNumber: number): string {
  return `EMP-${String(employeeNumber).padStart(4, '0')}`;
}
