import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AssessmentYearSelector } from '@/components/AssessmentYearSelector';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppContext, type CalculatorSession } from '@/context/AppContext';
import type { TaxHistoryRecord } from '@/types/income';
import {
  getAllIncomeTotal,
  getAPITEligibleEmploymentTotal,
  getEmploymentTotal,
  getInvestmentRentRepairAllowanceAnnual,
  incomeSourcesTaxSignature,
  taxTotalsCloseEnough,
} from '@/types/income';
import {
  calculateTax,
  formatAmountThousands,
  formatCurrency,
  formatPercent,
  integerDigitsFromAmountInput,
  parseAssessmentYearLabel,
  TAX_ASSESSMENT_YEAR,
  TAX_FREE_THRESHOLD,
  type TaxResult,
} from '@/lib/taxCalculator';
import { cn } from '@/lib/utils';

function creditsPrefillFromState(
  calculatorSession: CalculatorSession | null,
  history: TaxHistoryRecord[],
): { apit: number; wht: number } {
  if (calculatorSession) {
    return {
      apit: calculatorSession.apitDeductedAnnual ?? 0,
      wht: calculatorSession.whtOnInterestAnnual ?? 0,
    };
  }
  const head = history[0];
  if (head) {
    return {
      apit: head.apitDeductedAnnual ?? 0,
      wht: head.whtOnInterestAnnual ?? 0,
    };
  }
  return { apit: 0, wht: 0 };
}

function historyMatchesTaxResult(
  head: { totalIncome: number; taxableIncome: number; totalTax: number } | undefined,
  r: { totalIncome: number; taxableIncome: number; totalTax: number },
): boolean {
  return !!head && taxTotalsCloseEnough(head, r);
}

function countDigitsInPrefix(value: string, endExclusive: number): number {
  const end = Math.max(0, Math.min(endExclusive, value.length));
  let n = 0;
  for (let i = 0; i < end; i++) {
    const c = value[i];
    if (c >= '0' && c <= '9') n++;
  }
  return n;
}

/** Caret index immediately after the `digitCount`‑th digit (0 = before first digit). */
function caretIndexAfterDigitCount(formatted: string, digitCount: number): number {
  if (digitCount <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    const c = formatted[i];
    if (c >= '0' && c <= '9') {
      seen++;
      if (seen === digitCount) return i + 1;
    }
  }
  return formatted.length;
}

export default function CalculatorPage() {
  const { state, dispatch } = useAppContext();
  const { incomeSources, assessmentYear: assessmentYearRaw, history, calculatorSession } = state;
  const assessmentYear = parseAssessmentYearLabel(assessmentYearRaw) ?? TAX_ASSESSMENT_YEAR;
  const result = calculatorSession?.taxResult ?? null;
  const apitDeductedAnnual = calculatorSession?.apitDeductedAnnual ?? 0;
  const whtOnInterestAnnual = calculatorSession?.whtOnInterestAnnual ?? 0;
  const [creditsDialogOpen, setCreditsDialogOpen] = useState(false);
  const [credApitDraft, setCredApitDraft] = useState('');
  const [credWhtDraft, setCredWhtDraft] = useState('');
  const credApitInputRef = useRef<HTMLInputElement>(null);
  const credWhtInputRef = useRef<HTMLInputElement>(null);
  const credApitCaretDigitsRef = useRef<number | null>(null);
  const credWhtCaretDigitsRef = useRef<number | null>(null);

  useEffect(() => {
    if (!calculatorSession) return;
    if (
      incomeSourcesTaxSignature(calculatorSession.incomeSnapshot) !== incomeSourcesTaxSignature(incomeSources)
    ) {
      dispatch({ type: 'CLEAR_CALCULATOR_SESSION' });
    }
  }, [incomeSources, calculatorSession, dispatch]);

  const creditsDialogWasOpen = useRef(false);
  useEffect(() => {
    const opening = creditsDialogOpen && !creditsDialogWasOpen.current;
    if (opening) {
      const { apit, wht } = creditsPrefillFromState(calculatorSession, history);
      setCredApitDraft(apit === 0 ? '' : String(Math.trunc(apit)));
      setCredWhtDraft(wht === 0 ? '' : String(Math.trunc(wht)));
      credApitCaretDigitsRef.current = null;
      credWhtCaretDigitsRef.current = null;
    }
    creditsDialogWasOpen.current = creditsDialogOpen;
  }, [creditsDialogOpen, calculatorSession, history]);

  useLayoutEffect(() => {
    const n = credApitCaretDigitsRef.current;
    if (n == null) return;
    credApitCaretDigitsRef.current = null;
    const el = credApitInputRef.current;
    if (!el || document.activeElement !== el) return;
    const pos = caretIndexAfterDigitCount(formatAmountThousands(credApitDraft), n);
    el.setSelectionRange(pos, pos);
  }, [credApitDraft]);

  useLayoutEffect(() => {
    const n = credWhtCaretDigitsRef.current;
    if (n == null) return;
    credWhtCaretDigitsRef.current = null;
    const el = credWhtInputRef.current;
    if (!el || document.activeElement !== el) return;
    const pos = caretIndexAfterDigitCount(formatAmountThousands(credWhtDraft), n);
    el.setSelectionRange(pos, pos);
  }, [credWhtDraft]);

  const totalIncome = getAllIncomeTotal(incomeSources);
  const employmentIncome = getEmploymentTotal(incomeSources);
  const apitEligibleEmployment = getAPITEligibleEmploymentTotal(incomeSources);
  const rentRepairAllowanceAnnual = getInvestmentRentRepairAllowanceAnnual(incomeSources);

  const apitCredit = Math.max(0, apitDeductedAnnual);
  const whtCredit = Math.max(0, whtOnInterestAnnual);
  const balanceAfterCredits = result ? result.totalTax - apitCredit - whtCredit : 0;
  /** UI / stored balance: credits cannot create a negative payable or “refund” line in this app. */
  const balanceTaxPayable = Math.max(0, balanceAfterCredits);

  const openCreditsStep = () => {
    setCreditsDialogOpen(true);
  };

  const applyCreditsFromDialog = () => {
    const apit = Math.max(0, Number(integerDigitsFromAmountInput(credApitDraft)) || 0);
    const wht = Math.max(0, Number(integerDigitsFromAmountInput(credWhtDraft)) || 0);
    setCreditsDialogOpen(false);

    const persistSession = (taxResult: TaxResult) => {
      dispatch({
        type: 'SET_CALCULATOR_SESSION',
        payload: {
          taxResult,
          apitDeductedAnnual: apit,
          whtOnInterestAnnual: wht,
          incomeSnapshot: [...incomeSources],
        },
      });
    };

    if (result) {
      persistSession(result);
      const balancePayable = Math.max(0, result.totalTax - apit - wht);
      const head = history[0];
      if (historyMatchesTaxResult(head, result)) {
        dispatch({
          type: 'UPDATE_LAST_HISTORY',
          payload: {
            apitDeductedAnnual: apit,
            whtOnInterestAnnual: wht,
            balancePayable,
            date: new Date().toISOString(),
          },
        });
      } else if (!head) {
        dispatch({
          type: 'ADD_HISTORY',
          payload: {
            id: Math.random().toString(36).substring(2, 10),
            date: new Date().toISOString(),
            totalIncome: result.totalIncome,
            taxableIncome: result.taxableIncome,
            totalTax: result.totalTax,
            balancePayable,
            apitDeductedAnnual: apit,
            whtOnInterestAnnual: wht,
            monthlyAPIT: result.monthlyAPIT,
            effectiveRate: result.effectiveRate,
            breakdown: result.breakdown,
            incomeSnapshot: [...incomeSources],
          },
        });
      }
      return;
    }

    const r = calculateTax(totalIncome, employmentIncome, apitEligibleEmployment, rentRepairAllowanceAnnual);
    persistSession(r);
    const balancePayable = Math.max(0, r.totalTax - apit - wht);
    const head = history[0];
    const payloadBase = {
      date: new Date().toISOString(),
      totalIncome: r.totalIncome,
      taxableIncome: r.taxableIncome,
      totalTax: r.totalTax,
      balancePayable,
      apitDeductedAnnual: apit,
      whtOnInterestAnnual: wht,
      monthlyAPIT: r.monthlyAPIT,
      effectiveRate: r.effectiveRate,
      breakdown: r.breakdown,
      incomeSnapshot: [...incomeSources],
    };

    if (historyMatchesTaxResult(head, r)) {
      dispatch({
        type: 'UPDATE_LAST_HISTORY',
        payload: payloadBase,
      });
    } else {
      dispatch({
        type: 'ADD_HISTORY',
        payload: {
          id: Math.random().toString(36).substring(2, 10),
          ...payloadBase,
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Tax Calculator</h1>
          <p className="text-muted-foreground text-sm mt-1">Calculate your income tax based on Sri Lankan tax slabs.</p>
        </div>
        <AssessmentYearSelector readOnly className="rounded-xl border border-border/60 bg-card/50 p-4 max-w-xl" />
      </div>

      {/* Input summary */}
      <Card className="shadow-elevated border-0">
        <CardHeader>
          <CardTitle className="font-display text-lg">Income Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-secondary rounded-xl">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Employment</p>
              <p className="text-xl font-display font-bold text-foreground mt-1">{formatCurrency(employmentIncome)}</p>
            </div>
            <div className="p-4 bg-secondary rounded-xl">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Business & Investment</p>
              <p className="text-xl font-display font-bold text-foreground mt-1">{formatCurrency(totalIncome - employmentIncome)}</p>
            </div>
            <div className="p-4 gradient-primary rounded-xl">
              <p className="text-xs text-primary-foreground/80 uppercase tracking-wider">Total Income</p>
              <p className="text-xl font-display font-bold text-primary-foreground mt-1">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Statutory personal relief: {formatCurrency(TAX_FREE_THRESHOLD)} per year (applied automatically).</p>
            {rentRepairAllowanceAnnual > 0 ? (
              <p>
                Repair allowance (25% of gross investment rent), from your Income sources:{' '}
                <span className="font-mono font-medium text-foreground">{formatCurrency(rentRepairAllowanceAnnual)}</span>{' '}
                — already netted inside total income; shown again in the tax breakdown for clarity.
              </p>
            ) : (
              <p>Add investment rent on the Income page to include the 25% repair allowance in your breakdown.</p>
            )}
          </div>
          <Button
            onClick={openCreditsStep}
            disabled={totalIncome <= 0}
            className="w-full sm:w-auto gradient-primary border-0 text-primary-foreground hover:opacity-90"
            size="lg"
          >
            <Calculator className="w-4 h-4 mr-2" /> Calculate Tax <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      <Dialog open={creditsDialogOpen} onOpenChange={setCreditsDialogOpen}>
        <DialogContent className="gap-4 p-6 sm:p-8 max-w-[95vw] sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-display">Credits available</DialogTitle>
            <DialogDescription>
              Enter totals from your T.10 (APIT) and bank certificates (AIT / WHT on interest). These cannot be derived
              from income entries alone. You can leave them at zero if you only want the tax estimate.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 py-2">
            <div className="space-y-2">
              <Label htmlFor="cred-apit">APIT deducted (annual, from T.10)</Label>
              <Input
                ref={credApitInputRef}
                id="cred-apit"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className="font-mono tabular-nums"
                placeholder="0"
                value={formatAmountThousands(credApitDraft)}
                onChange={(e) => {
                  const el = e.target;
                  credApitCaretDigitsRef.current = countDigitsInPrefix(el.value, el.selectionStart ?? 0);
                  setCredApitDraft(integerDigitsFromAmountInput(el.value));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cred-wht">WHT on interest (annual)</Label>
              <Input
                ref={credWhtInputRef}
                id="cred-wht"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className="font-mono tabular-nums"
                placeholder="0"
                value={formatAmountThousands(credWhtDraft)}
                onChange={(e) => {
                  const el = e.target;
                  credWhtCaretDigitsRef.current = countDigitsInPrefix(el.value, el.selectionStart ?? 0);
                  setCredWhtDraft(integerDigitsFromAmountInput(el.value));
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setCreditsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="gradient-primary border-0 text-primary-foreground hover:opacity-90 gap-2"
              onClick={applyCreditsFromDialog}
            >
              {result ? 'Apply credits' : 'Continue to results'}
              {!result && <ArrowRight className="w-4 h-4" />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Estimates for Year of Assessment {assessmentYear}
          </p>
          <Card className="shadow-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg">Taxable income — how we got here</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border bg-card p-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-foreground">Assessable Income</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(result.assessableIncome)}</span>
                </div>
                <div className="flex justify-between gap-4 text-muted-foreground">
                  <span>(−) Personal Relief</span>
                  <span className="tabular-nums">({formatCurrency(result.personalRelief)})</span>
                </div>
                <div className="flex justify-between gap-4 text-muted-foreground">
                  <span>(−) Repair allowance (25% of gross rent)</span>
                  <span className="tabular-nums">({formatCurrency(result.rentRelief)})</span>
                </div>
                <Separator />
                <div className="flex justify-between gap-4 font-semibold text-foreground">
                  <span>= Taxable Income</span>
                  <span className="tabular-nums">{formatCurrency(result.taxableIncome)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Income', value: formatCurrency(result.totalIncome), accent: false },
              { label: 'Taxable Income', value: formatCurrency(result.taxableIncome), accent: false },
              { label: 'Total tax liability', value: formatCurrency(result.totalTax), accent: false },
              { label: 'Total tax payable', value: formatCurrency(balanceTaxPayable), accent: true },
            ].map((item) => (
              <Card
                key={item.label}
                className={cn(
                  'border-0 shadow-card',
                  item.accent ? 'gradient-primary text-primary-foreground' : 'bg-card',
                )}
              >
                <CardContent className="p-4">
                  <p
                    className={cn(
                      'text-xs uppercase tracking-wider',
                      item.accent ? 'font-medium text-primary-foreground/80' : 'text-muted-foreground',
                    )}
                  >
                    {item.label}
                  </p>
                  <p
                    className={cn(
                      'text-xl font-display font-bold mt-1',
                      item.accent ? 'text-primary-foreground' : 'text-foreground',
                    )}
                  >
                    {item.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Breakdown table + credits + balance */}
          <Card className="shadow-elevated border-0">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" /> Tax Breakdown
              </CardTitle>
              <CardDescription>
                Progressive tax on taxable income · Year of Assessment {assessmentYear}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="rounded-xl overflow-hidden border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary">
                      <TableHead className="font-semibold">Segment</TableHead>
                      <TableHead className="text-right font-semibold">Amount</TableHead>
                      <TableHead className="text-right font-semibold">Rate</TableHead>
                      <TableHead className="text-right font-semibold">Tax</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.breakdown.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{item.label}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                        <TableCell className="text-right">{formatPercent(item.rate)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(item.tax)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-secondary font-bold">
                      <TableCell>Total tax liability</TableCell>
                      <TableCell className="text-right">{formatCurrency(result.taxableIncome)}</TableCell>
                      <TableCell className="text-right">{result.effectiveRate.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{formatCurrency(result.totalTax)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="font-display text-lg font-semibold leading-none tracking-tight text-foreground">
                      Credits &amp; balance
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Values below reflect credits from the step after you clicked Calculate Tax. Use Edit credits to
                      change APIT / WHT without recalculating slabs; click Calculate Tax again if your income changed.
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={openCreditsStep}>
                    Edit credits
                  </Button>
                </div>

                <div className="rounded-xl border bg-card p-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-foreground font-medium">Total tax liability</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(result.totalTax)}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-muted-foreground">
                    <span>(−) APIT</span>
                    <span className="tabular-nums">({formatCurrency(apitCredit)})</span>
                  </div>
                  <div className="flex justify-between gap-4 text-muted-foreground">
                    <span>(−) WHT on interest</span>
                    <span className="tabular-nums">({formatCurrency(whtCredit)})</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between gap-4 font-semibold text-foreground items-start">
                    <span>
                      = Balance tax payable{' '}
                      <span className="text-xs font-normal text-muted-foreground">({assessmentYear})</span>
                    </span>
                    <span className="tabular-nums text-right">{formatCurrency(balanceTaxPayable)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
