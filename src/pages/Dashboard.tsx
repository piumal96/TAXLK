import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Wallet,
  Calculator,
  History,
  TrendingUp,
  ArrowRight,
  Banknote,
  PiggyBank,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { getAllIncomeTotal, getEmploymentTotal } from '@/types/income';
import { calculateTax, formatCurrency } from '@/lib/taxCalculator';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

export default function Dashboard() {
  const { state } = useAppContext();
  const { incomeSources, profile, history } = state;

  const totalIncome = getAllIncomeTotal(incomeSources);
  const employmentIncome = getEmploymentTotal(incomeSources);
  const taxResult = calculateTax(totalIncome, employmentIncome);

  const summaryCards = [
    {
      label: 'Total Income',
      value: formatCurrency(totalIncome),
      icon: Wallet,
      gradient: 'gradient-primary',
      light: false,
    },
    {
      label: 'Total Tax',
      value: formatCurrency(taxResult.totalTax),
      icon: Banknote,
      gradient: '',
      light: true,
    },
    {
      label: 'Monthly APIT',
      value: formatCurrency(taxResult.monthlyAPIT),
      icon: PiggyBank,
      gradient: '',
      light: true,
    },
    {
      label: 'Effective Rate',
      value: `${taxResult.effectiveRate.toFixed(1)}%`,
      icon: TrendingUp,
      gradient: 'gradient-success',
      light: false,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div {...fadeIn}>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
          {profile.name ? `Welcome back, ${profile.name}` : 'Sri Lankan Income Tax Calculator'}
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your income sources and calculate taxes effortlessly.
        </p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card
              className={`border-0 shadow-elevated ${
                card.gradient
                  ? `${card.gradient} text-primary-foreground`
                  : 'bg-card'
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        card.light ? 'text-muted-foreground' : 'text-primary-foreground/80'
                      }`}
                    >
                      {card.label}
                    </p>
                    <p className={`text-2xl font-display font-bold mt-1 ${card.light ? 'text-foreground' : ''}`}>
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      card.light ? 'bg-primary/10' : 'bg-primary-foreground/20'
                    }`}
                  >
                    <card.icon className={`w-5 h-5 ${card.light ? 'text-primary' : 'text-primary-foreground'}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick actions + info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="shadow-elevated border-0">
            <CardHeader>
              <CardTitle className="font-display text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-between gradient-primary border-0 text-primary-foreground hover:opacity-90">
                <Link to="/app/income">
                  <span className="flex items-center gap-2"><Wallet className="w-4 h-4" /> Add Income Source</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link to="/app/calculator">
                  <span className="flex items-center gap-2"><Calculator className="w-4 h-4" /> Calculate Tax</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link to="/app/history">
                  <span className="flex items-center gap-2"><History className="w-4 h-4" /> View History</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Income breakdown */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-elevated border-0 h-full">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> Income Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incomeSources.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">No income sources added yet.</p>
                  <Button asChild variant="link" className="mt-2 text-primary">
                    <Link to="/app/income">Add your first income source →</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {incomeSources.map((source) => {
                    const amount =
                      source.category === 'employment'
                        ? source.salary + source.bonus + source.allowances + source.benefits
                        : source.category === 'business'
                        ? Math.max(0, source.revenue - source.expenses)
                        : source.interest + source.dividends + source.rent;
                    const pct = totalIncome > 0 ? (amount / totalIncome) * 100 : 0;
                    return (
                      <div key={source.id} className="grid grid-cols-[1fr_7rem_6.5rem] items-center gap-3">
                        <div className="min-w-0 overflow-hidden">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium truncate">{source.label}</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${
                                source.category === 'employment'
                                  ? 'gradient-primary'
                                  : source.category === 'business'
                                  ? 'gradient-success'
                                  : 'bg-warning'
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground whitespace-nowrap text-right">{formatCurrency(amount)}</span>
                        <span className="text-xs text-muted-foreground capitalize bg-secondary px-2 py-1 rounded-md w-24 text-center">
                          {source.category}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent history */}
      {history.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="shadow-elevated border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display text-lg">Recent Calculations</CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-primary">
                <Link to="/app/history">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {history.slice(0, 3).map((h) => (
                  <div key={h.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{formatCurrency(h.totalIncome)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(h.date).toLocaleDateString('en-LK', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-destructive">{formatCurrency(h.totalTax)}</p>
                      <p className="text-xs text-muted-foreground">{h.effectiveRate.toFixed(1)}% eff.</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
