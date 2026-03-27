import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, ArrowRight, Lock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { calculateTax, formatCurrency } from '@/lib/taxCalculator';

export function QuickCalculator() {
  const [income, setIncome] = useState('');
  const [result, setResult] = useState<ReturnType<typeof calculateTax> | null>(null);

  const handleCalculate = () => {
    const val = parseFloat(income.replace(/,/g, ''));
    if (!val || val <= 0) return;
    setResult(calculateTax(val, val));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCalculate();
  };

  return (
    <section className="py-20 lg:py-28" id="try-calculator">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            <Calculator className="w-3.5 h-3.5" /> Try It Free
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            Quick Tax Calculator
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Enter your annual income to get an instant estimate. No sign-up required.
          </p>
        </motion.div>

        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-0 shadow-float overflow-hidden">
            <CardContent className="p-0">
              {/* Input area */}
              <div className="p-6 lg:p-8">
                <Label htmlFor="quick-income" className="text-base font-display font-semibold text-foreground">
                  Annual Gross Income (LKR)
                </Label>
                <div className="flex gap-3 mt-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">Rs.</span>
                    <Input
                      id="quick-income"
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 3,600,000"
                      value={income}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setIncome(raw ? Number(raw).toLocaleString() : '');
                      }}
                      onKeyDown={handleKeyDown}
                      className="pl-10 h-12 text-lg"
                    />
                  </div>
                  <Button
                    onClick={handleCalculate}
                    className="gradient-primary border-0 text-primary-foreground h-12 px-6"
                  >
                    Calculate
                  </Button>
                </div>
              </div>

              {/* Results */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="border-t bg-secondary/30 p-6 lg:p-8">
                      {/* Summary row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                        {[
                          { label: 'Taxable Income', value: formatCurrency(result.taxableIncome) },
                          { label: 'Annual Tax', value: formatCurrency(result.totalTax), highlight: true },
                          { label: 'Monthly APIT', value: formatCurrency(result.monthlyAPIT) },
                          { label: 'Effective Rate', value: `${result.effectiveRate.toFixed(1)}%` },
                        ].map((item) => (
                          <div key={item.label} className="text-center space-y-1.5">
                            <p className="text-xs text-muted-foreground tracking-wide uppercase">{item.label}</p>
                            <p className={`font-display font-bold text-xl ${item.highlight ? 'text-destructive' : 'text-foreground'}`}>
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Zero tax message or breakdown */}
                      {result.taxableIncome === 0 ? (
                        <div className="text-center py-4 px-6 rounded-xl bg-accent/10 border border-accent/20">
                          <p className="text-sm font-medium text-accent mb-1">🎉 No tax payable!</p>
                          <p className="text-xs text-muted-foreground">
                            Your income is below the Rs. 1,800,000 annual tax-free threshold.
                          </p>
                        </div>
                      ) : (
                        <div className="relative min-h-[140px]">
                          <div className="space-y-3 select-none" aria-hidden>
                            {result.breakdown.slice(0, 3).map((slab, i) => (
                              <div key={i} className={`flex justify-between text-sm py-2 ${i > 0 ? 'blur-[3px]' : ''}`}>
                                <span className="text-muted-foreground">{slab.label} @ {(slab.rate * 100).toFixed(0)}%</span>
                                <span className="font-medium text-foreground">{formatCurrency(slab.tax)}</span>
                              </div>
                            ))}
                            {result.breakdown.length > 3 && (
                              <div className="flex justify-between text-sm py-2 blur-[5px]">
                                <span className="text-muted-foreground">More slabs...</span>
                                <span className="font-medium text-foreground">Rs. ---</span>
                              </div>
                            )}
                          </div>

                          {/* Overlay CTA */}
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-card via-card/80 to-transparent">
                            <div className="text-center space-y-4 mt-4">
                              <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                                <Lock className="w-3.5 h-3.5" />
                                <span>Full slab breakdown available after sign up</span>
                              </div>
                              <Button asChild size="sm" className="gradient-primary border-0 text-primary-foreground">
                                <Link to="/register">
                                  Unlock Full Breakdown <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Trust note */}
          {!result && (
            <motion.p
              className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <TrendingUp className="w-3 h-3" />
              Based on current Sri Lankan tax slabs · No data stored
            </motion.p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
