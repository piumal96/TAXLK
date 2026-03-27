import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppContext } from '@/context/AppContext';
import { getAllIncomeTotal, getEmploymentTotal } from '@/types/income';
import { calculateTax, formatCurrency, formatPercent, TAX_FREE_THRESHOLD, type TaxResult } from '@/lib/taxCalculator';

export default function CalculatorPage() {
  const { state, dispatch } = useAppContext();
  const { incomeSources } = state;
  const [result, setResult] = useState<TaxResult | null>(null);

  const totalIncome = getAllIncomeTotal(incomeSources);
  const employmentIncome = getEmploymentTotal(incomeSources);

  const handleCalculate = () => {
    const r = calculateTax(totalIncome, employmentIncome);
    setResult(r);

    // Save to history
    dispatch({
      type: 'ADD_HISTORY',
      payload: {
        id: Math.random().toString(36).substring(2, 10),
        date: new Date().toISOString(),
        totalIncome: r.totalIncome,
        taxableIncome: r.taxableIncome,
        totalTax: r.totalTax,
        monthlyAPIT: r.monthlyAPIT,
        effectiveRate: r.effectiveRate,
        breakdown: r.breakdown,
        incomeSnapshot: [...incomeSources],
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Tax Calculator</h1>
        <p className="text-muted-foreground text-sm mt-1">Calculate your income tax based on Sri Lankan tax slabs.</p>
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
          <div className="text-sm text-muted-foreground">
            Tax-free threshold: {formatCurrency(TAX_FREE_THRESHOLD)}
          </div>
          <Button
            onClick={handleCalculate}
            disabled={totalIncome <= 0}
            className="w-full sm:w-auto gradient-primary border-0 text-primary-foreground hover:opacity-90"
            size="lg"
          >
            <Calculator className="w-4 h-4 mr-2" /> Calculate Tax <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Income', value: formatCurrency(result.totalIncome) },
              { label: 'Taxable Income', value: formatCurrency(result.taxableIncome) },
              { label: 'Total Tax', value: formatCurrency(result.totalTax) },
              { label: 'Monthly APIT', value: formatCurrency(result.monthlyAPIT) },
            ].map((item) => (
              <Card key={item.label} className="shadow-card border-0">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</p>
                  <p className="text-xl font-display font-bold text-foreground mt-1">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Breakdown table */}
          <Card className="shadow-elevated border-0">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" /> Tax Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">{formatCurrency(result.taxableIncome)}</TableCell>
                      <TableCell className="text-right">{result.effectiveRate.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{formatCurrency(result.totalTax)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
