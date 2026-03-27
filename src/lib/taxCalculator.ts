// Sri Lankan Income Tax Calculator
// Based on progressive tax slabs after Rs. 1,800,000 tax-free threshold

export const TAX_FREE_THRESHOLD = 1_800_000;

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
  taxableIncome: number;
  totalTax: number;
  monthlyAPIT: number;
  effectiveRate: number;
  breakdown: TaxBreakdownItem[];
}

export function calculateTax(totalIncome: number, employmentIncome: number): TaxResult {
  const taxableIncome = Math.max(0, totalIncome - TAX_FREE_THRESHOLD);
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

  // APIT is proportional to employment income share
  const employmentShare = totalIncome > 0 ? employmentIncome / totalIncome : 0;
  const employmentTax = totalTax * employmentShare;
  const monthlyAPIT = employmentTax / 12;

  const effectiveRate = totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0;

  return {
    totalIncome,
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

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}
