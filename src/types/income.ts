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
  /** Gross progressive tax before APIT / WHT credits. */
  totalTax: number;
  /** After credits; omitted on legacy saves — use {@link getHistoryBalancePayable}. */
  balancePayable?: number;
  apitDeductedAnnual?: number;
  whtOnInterestAnnual?: number;
  monthlyAPIT: number;
  effectiveRate: number;
  breakdown: { label: string; amount: number; rate: number; tax: number }[];
  incomeSnapshot: IncomeSource[];
}

/** Amount owed after T.10 APIT and WHT on interest; never negative (credits in excess of liability → 0). */
export function getHistoryBalancePayable(record: TaxHistoryRecord): number {
  let raw: number;
  if (record.balancePayable != null) {
    raw = record.balancePayable;
  } else {
    const apit = record.apitDeductedAnnual ?? 0;
    const wht = record.whtOnInterestAnnual ?? 0;
    raw = record.totalTax - apit - wht;
  }
  return Math.max(0, raw);
}

/**
 * Compare saved tax totals to a fresh calculation — uses rounded rupees so strict `===` is not broken by
 * float slab math or JSON round-trip after reload / login.
 */
export function taxTotalsCloseEnough(
  a: { totalIncome: number; taxableIncome: number; totalTax: number },
  b: { totalIncome: number; taxableIncome: number; totalTax: number },
): boolean {
  return (
    Math.round(a.totalIncome) === Math.round(b.totalIncome) &&
    Math.round(a.taxableIncome) === Math.round(b.taxableIncome) &&
    Math.round(a.totalTax) === Math.round(b.totalTax)
  );
}

/** True when the newest history row was saved for the same income picture as current sources. */
export function historyIncomeSnapshotMatchesCurrent(
  head: TaxHistoryRecord | undefined,
  sources: IncomeSource[],
): boolean {
  if (!head?.incomeSnapshot || !Array.isArray(head.incomeSnapshot)) return false;
  return incomeSourcesTaxSignature(head.incomeSnapshot) === incomeSourcesTaxSignature(sources);
}

/** Stable signature of income sources for tax — invalidates a persisted calculator when data that affects tax changes. */
export function incomeSourcesTaxSignature(sources: IncomeSource[]): string {
  const parts = [...sources]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((s) => {
      if (s.category === 'employment') {
        return {
          id: s.id,
          c: 'employment' as const,
          salary: s.salary,
          bonus: s.bonus,
          allowances: s.allowances,
          benefits: s.benefits,
          apit: s.apitApplicable,
        };
      }
      if (s.category === 'business') {
        return { id: s.id, c: 'business' as const, revenue: s.revenue, expenses: s.expenses };
      }
      return {
        id: s.id,
        c: 'investment' as const,
        interest: s.interest,
        dividends: s.dividends,
        rent: s.rent,
      };
    });
  return JSON.stringify(parts);
}

export function getIncomeTotal(source: IncomeSource): number {
  switch (source.category) {
    case 'employment':
      return source.salary + source.bonus + source.allowances + source.benefits;
    case 'business':
      return Math.max(0, source.revenue - source.expenses);
    case 'investment':
      return source.interest + source.dividends + (source.rent * 0.75);
  }
}

export function getEmploymentTotal(sources: IncomeSource[]): number {
  return sources
    .filter((s): s is EmploymentIncome => s.category === 'employment')
    .reduce((sum, s) => sum + getIncomeTotal(s), 0);
}

/** Employment amounts that count toward estimated monthly APIT (excludes sources marked not APIT-applicable). */
export function getAPITEligibleEmploymentTotal(sources: IncomeSource[]): number {
  return sources
    .filter((s): s is EmploymentIncome => s.category === 'employment')
    .filter((s) => s.apitApplicable !== false)
    .reduce((sum, s) => sum + getIncomeTotal(s), 0);
}

export function getAllIncomeTotal(sources: IncomeSource[]): number {
  return sources.reduce((sum, s) => sum + getIncomeTotal(s), 0);
}

/** Annual 25% repair allowance on gross rent — same rule as Investment income on the Income page (`rent` is stored annual). */
export function getInvestmentRentRepairAllowanceAnnual(sources: IncomeSource[]): number {
  return sources
    .filter((s): s is InvestmentIncome => s.category === 'investment')
    .reduce((sum, s) => sum + (s.rent > 0 ? s.rent * 0.25 : 0), 0);
}
