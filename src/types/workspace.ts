import type { IncomeSource } from '@/types/income';
import type { TaxResult } from '@/lib/taxCalculator';

/** Persisted tax calculator report (Firestore + per-user local cache). */
export interface CalculatorSession {
  taxResult: TaxResult;
  apitDeductedAnnual: number;
  whtOnInterestAnnual: number;
  incomeSnapshot: IncomeSource[];
}
