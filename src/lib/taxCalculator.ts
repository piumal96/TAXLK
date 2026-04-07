// Sri Lankan Income Tax Calculator
// Based on progressive tax slabs after Rs. 1,800,000 tax-free threshold

/** Statutory annual personal relief (tax-free slice) for individuals — used in simplified calculator. */
export const TAX_FREE_THRESHOLD = 1_800_000;

/** Default Year of Assessment when none is stored yet. */
export const TAX_ASSESSMENT_YEAR = '2024/2025';

const ASSESSMENT_YEAR_PATTERN = /^\d{4}\/\d{4}$/;

/** Returns trimmed `YYYY/YYYY` or null if invalid. */
export function parseAssessmentYearLabel(raw: string): string | null {
  const s = raw.trim();
  if (!ASSESSMENT_YEAR_PATTERN.test(s)) return null;
  return s;
}

export function formatAssessmentPeriodLabel(yearLabel: string = TAX_ASSESSMENT_YEAR): string {
  const [y0, y1] = yearLabel.split('/');
  if (!y0 || !y1) return '';
  return `1 Apr ${y0} – 31 Mar ${y1}`;
}

/** Filing deadline convention used in UI copy: 30 November of the second calendar year in the YoA label. */
export function defaultFilingDeadlineLabel(yearLabel: string): string {
  const y1 = yearLabel.split('/')[1];
  return y1 ? `30 November ${y1}` : '30 November (confirm on IRD)';
}

export const TAX_SLABS = [
  { limit: 1_000_000, rate: 0.06, label: 'First Rs. 1,000,000' },
  { limit: 500_000, rate: 0.18, label: 'Next Rs. 500,000' },
  { limit: 500_000, rate: 0.24, label: 'Next Rs. 500,000' },
  { limit: 500_000, rate: 0.30, label: 'Next Rs. 500,000' },
  { limit: Infinity, rate: 0.36, label: 'Remaining' },
];

export interface TaxBreakdownItem {
  label: string;
  amount: number;
  rate: number;
  tax: number;
}

export interface TaxResult {
  totalIncome: number;
  /** Display gross assessable (total income plus repair allowance gross-up when rent is netted in total). */
  assessableIncome: number;
  /** Statutory personal relief deducted (annual). */
  personalRelief: number;
  /** Repair allowance on investment rent (25% of gross annual rent); already reflected in total income — shown for transparency only. */
  rentRelief: number;
  taxableIncome: number;
  totalTax: number;
  monthlyAPIT: number;
  effectiveRate: number;
  breakdown: TaxBreakdownItem[];
}

/**
 * @param employmentIncome — total employment remuneration (for display / consistency)
 * @param apitEligibleEmployment — subset subject to employer APIT; defaults to full employment income
 * @param rentRepairAllowanceAnnual — 25% repair allowance on gross investment rent (from Income sources). Total income already uses net rent (75%); this is for display only and must not be subtracted again from taxable income.
 */
export function calculateTax(
  totalIncome: number,
  employmentIncome: number,
  apitEligibleEmployment: number = employmentIncome,
  rentRepairAllowanceAnnual: number = 0
): TaxResult {
  const rentRelief = Math.max(0, rentRepairAllowanceAnnual);
  const assessableIncome = totalIncome + rentRelief;
  const personalRelief = TAX_FREE_THRESHOLD;
  const taxableIncome = Math.max(0, totalIncome - personalRelief);
  const breakdown: TaxBreakdownItem[] = [];
  let remaining = taxableIncome;
  let totalTax = 0;

  for (const slab of TAX_SLABS) {
    if (remaining <= 0) break;
    const taxableAmount = Math.min(remaining, slab.limit);
    const tax = taxableAmount * slab.rate;
    breakdown.push({
      label: slab.label,
      amount: taxableAmount,
      rate: slab.rate,
      tax,
    });
    totalTax += tax;
    remaining -= taxableAmount;
  }

  // Estimated monthly APIT scales with APIT-eligible employment only
  const apitShare = totalIncome > 0 ? apitEligibleEmployment / totalIncome : 0;
  const employmentTax = totalTax * apitShare;
  const monthlyAPIT = employmentTax / 12;

  const effectiveRate = totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0;

  return {
    totalIncome,
    assessableIncome,
    personalRelief,
    rentRelief,
    taxableIncome,
    totalTax,
    monthlyAPIT,
    effectiveRate,
    breakdown,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Strip non-digits for whole-number LKR fields (e.g. APIT / WHT inputs). */
export function integerDigitsFromAmountInput(raw: string): string {
  return raw.replace(/\D/g, '');
}

/** Format a digits-only string with thousands separators (no currency symbol). */
export function formatAmountThousands(digits: string): string {
  let n = digits.replace(/\D/g, '');
  if (n === '') return '';
  n = n.replace(/^0+/, '') || '0';
  return n.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}
