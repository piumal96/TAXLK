export type IncomeCategory = 'employment' | 'business' | 'investment';

export interface EmploymentIncome {
  id: string;
  category: 'employment';
  label: string;
  salary: number;
  bonus: number;
  allowances: number;
  benefits: number;
  apitApplicable: boolean;
  createdAt: string;
}

export interface BusinessIncome {
  id: string;
  category: 'business';
  label: string;
  revenue: number;
  expenses: number;
  createdAt: string;
}

export interface InvestmentIncome {
  id: string;
  category: 'investment';
  label: string;
  interest: number;
  dividends: number;
  rent: number;
  createdAt: string;
}

export type IncomeSource = EmploymentIncome | BusinessIncome | InvestmentIncome;

export interface UserProfile {
  name: string;
  email: string;
  occupation: string;
  defaultIncome: number;
  inputPreference: 'monthly' | 'annual';
}

export interface TaxHistoryRecord {
  id: string;
  date: string;
  totalIncome: number;
  taxableIncome: number;
  totalTax: number;
  monthlyAPIT: number;
  effectiveRate: number;
  breakdown: { label: string; amount: number; rate: number; tax: number }[];
  incomeSnapshot: IncomeSource[];
}

export function getIncomeTotal(source: IncomeSource): number {
  switch (source.category) {
    case 'employment':
      return source.salary + source.bonus + source.allowances + source.benefits;
    case 'business':
      return Math.max(0, source.revenue - source.expenses);
    case 'investment':
      return source.interest + source.dividends + source.rent;
  }
}

export function getEmploymentTotal(sources: IncomeSource[]): number {
  return sources
    .filter((s): s is EmploymentIncome => s.category === 'employment')
    .reduce((sum, s) => sum + getIncomeTotal(s), 0);
}

export function getAllIncomeTotal(sources: IncomeSource[]): number {
  return sources.reduce((sum, s) => sum + getIncomeTotal(s), 0);
}
