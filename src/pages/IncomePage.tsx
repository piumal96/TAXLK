import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Briefcase, Building2, TrendingUp, Trash2, Edit2, Calculator, LayoutList } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AssessmentYearSelector } from '@/components/AssessmentYearSelector';
import { useAppContext } from '@/context/AppContext';
import {
  IncomeSource,
  IncomeCategory,
  EmploymentIncome,
  BusinessIncome,
  InvestmentIncome,
  getIncomeTotal,
} from '@/types/income';
import { formatCurrency } from '@/lib/taxCalculator';
import { cn } from '@/lib/utils';

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

type EmploymentComponent = 'salary' | 'bonus' | 'allowances' | 'benefits';

const EMPLOYMENT_COMPONENT_LABEL: Record<EmploymentComponent, string> = {
  salary: 'Salary',
  bonus: 'Bonus',
  allowances: 'Allowances',
  benefits: 'Benefits',
};

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/**
 * When showing the 12-month grid: keep the user's existing breakdown if it already sums to the
 * annual total; otherwise put the full annual in January and leave other months at 0 so they can
 * distribute manually (no equal split across 12).
 */
function allocateMonthlyFromAnnual(annual: number, previousMonths: number[]): number[] {
  const target = Math.max(0, Math.round(annual));
  const prevSum = previousMonths.reduce((s, x) => s + x, 0);
  if (Math.round(prevSum) === target) {
    return [...previousMonths];
  }
  if (target === 0) {
    return Array(12).fill(0);
  }
  return [target, ...Array(11).fill(0)];
}

function pickDefaultEmploymentComponent(emp: EmploymentIncome | null): EmploymentComponent {
  if (!emp) return 'salary';
  const order: EmploymentComponent[] = ['salary', 'bonus', 'allowances', 'benefits'];
  for (const k of order) {
    if (emp[k] > 0) return k;
  }
  return 'salary';
}

function EmploymentForm({ onSave, initial }: { onSave: (s: IncomeSource) => void; initial?: IncomeSource }) {
  const emp = initial?.category === 'employment' ? initial : null;
  const initialAnnuals = {
    salary: emp?.salary ?? 0,
    bonus: emp?.bonus ?? 0,
    allowances: emp?.allowances ?? 0,
    benefits: emp?.benefits ?? 0,
  };
  const initialComponent = pickDefaultEmploymentComponent(emp);

  const [label, setLabel] = useState(emp?.label ?? '');
  const [isMonthly, setIsMonthly] = useState(false);
  const [incomeComponent, setIncomeComponent] = useState<EmploymentComponent>(initialComponent);
  const [annuals, setAnnuals] = useState(initialAnnuals);
  const [monthlyAmounts, setMonthlyAmounts] = useState(() =>
    allocateMonthlyFromAnnual(initialAnnuals[initialComponent], Array(12).fill(0)),
  );
  const [sameEveryMonth, setSameEveryMonth] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const grandAnnualTotal =
    annuals.salary + annuals.bonus + annuals.allowances + annuals.benefits;
  const nameOk = label.trim().length > 0;
  const amountsOk = grandAnnualTotal > 0;

  const setAnnualForComponent = (v: number) => {
    setAnnuals((a) => ({ ...a, [incomeComponent]: Math.max(0, v) }));
  };

  const applyUniformEmploymentMonths = (raw: number) => {
    const v = Math.max(0, raw);
    setMonthlyAmounts(Array(12).fill(v));
    setAnnuals((a) => ({ ...a, [incomeComponent]: v * 12 }));
  };

  const setMonthAt = (idx: number, raw: number) => {
    const v = Math.max(0, raw);
    setMonthlyAmounts((prev) => {
      const next = [...prev];
      next[idx] = v;
      const sum = next.reduce((s, x) => s + x, 0);
      setAnnuals((a) => ({ ...a, [incomeComponent]: sum }));
      return next;
    });
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="space-y-2">
        <Label>Source Name</Label>
        <Input
          value={label}
          onChange={(e) => {
            setLabel(e.target.value);
            setShowErrors(false);
          }}
          placeholder="e.g. Primary Job"
          aria-invalid={showErrors && !nameOk}
          className={cn(showErrors && !nameOk && 'border-destructive focus-visible:ring-destructive')}
        />
        {showErrors && !nameOk ? (
          <p className="text-sm text-destructive" role="alert">
            Enter a source name.
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label>Income type</Label>
        <Select
          value={incomeComponent}
          onValueChange={(v) => {
            const next = v as EmploymentComponent;
            setIncomeComponent(next);
            setSameEveryMonth(false);
            if (isMonthly) {
              setMonthlyAmounts(allocateMonthlyFromAnnual(annuals[next], Array(12).fill(0)));
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(EMPLOYMENT_COMPONENT_LABEL) as EmploymentComponent[]).map((key) => (
              <SelectItem key={key} value={key}>
                {EMPLOYMENT_COMPONENT_LABEL[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between gap-4 p-4 sm:p-5 bg-secondary rounded-xl">
        <Label className="text-sm font-medium">Input Mode</Label>
        <div className="flex items-center gap-3 text-sm shrink-0">
          <span className={isMonthly ? 'font-semibold text-foreground' : 'text-muted-foreground'}>Monthly</span>
          <Switch
            checked={!isMonthly}
            onCheckedChange={(checked) => {
              setIsMonthly(!checked);
              if (!checked) {
                setSameEveryMonth(false);
                setMonthlyAmounts((prev) =>
                  allocateMonthlyFromAnnual(annuals[incomeComponent], prev),
                );
              }
            }}
          />
          <span className={!isMonthly ? 'font-semibold text-foreground' : 'text-muted-foreground'}>Annually</span>
        </div>
      </div>
      {!isMonthly ? (
        <div
          className={cn(
            'space-y-2 rounded-xl',
            showErrors && !amountsOk && 'ring-2 ring-destructive ring-offset-2 ring-offset-background p-3 -m-1',
          )}
        >
          <Label>Annual amount ({EMPLOYMENT_COMPONENT_LABEL[incomeComponent]})</Label>
          <Input
            type="number"
            min={0}
            value={annuals[incomeComponent] || ''}
            onChange={(e) => {
              setAnnualForComponent(Number(e.target.value) || 0);
              setShowErrors(false);
            }}
            aria-invalid={showErrors && !amountsOk}
            className={cn(showErrors && !amountsOk && 'border-destructive')}
          />
        </div>
      ) : (
        <div
          className={cn(
            'space-y-3 rounded-xl',
            showErrors && !amountsOk && 'ring-2 ring-destructive ring-offset-2 ring-offset-background p-3 -m-1',
          )}
        >
          <Label>Monthly amounts ({EMPLOYMENT_COMPONENT_LABEL[incomeComponent]})</Label>
          <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
            <Checkbox
              id="emp-same-all-months"
              checked={sameEveryMonth}
              onCheckedChange={(c) => {
                const on = c === true;
                setSameEveryMonth(on);
                if (on) applyUniformEmploymentMonths(monthlyAmounts[0] ?? 0);
                setShowErrors(false);
              }}
              className="mt-0.5"
            />
            <div className="min-w-0 space-y-1">
              <Label htmlFor="emp-same-all-months" className="cursor-pointer text-sm font-medium leading-none">
                Same amount every month
              </Label>
              <p className="text-xs text-muted-foreground">One value applies to all 12 months.</p>
            </div>
          </div>
          {sameEveryMonth ? (
            <div className="space-y-2">
              <Label>Amount per month</Label>
              <Input
                type="number"
                min={0}
                value={monthlyAmounts[0] || ''}
                onChange={(e) => {
                  applyUniformEmploymentMonths(Number(e.target.value) || 0);
                  setShowErrors(false);
                }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
              {MONTH_SHORT.map((m, i) => (
                <div key={m} className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{m}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={monthlyAmounts[i] || ''}
                    onChange={(e) => {
                      setMonthAt(i, Number(e.target.value) || 0);
                      setShowErrors(false);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="p-4 sm:p-5 bg-secondary rounded-xl text-sm space-y-1">
        <div>
          <span className="text-muted-foreground">Annual total (all components): </span>
          <span className="font-semibold text-foreground">{formatCurrency(grandAnnualTotal)}</span>
        </div>
        {showErrors && !amountsOk ? (
          <p className="text-destructive font-medium" role="alert">
            Enter at least one amount greater than zero (salary, bonus, allowances, or benefits).
          </p>
        ) : null}
      </div>
      <Button
        className="w-full h-11 sm:h-12 gradient-primary border-0 text-primary-foreground hover:opacity-90"
        onClick={() => {
          if (!nameOk || !amountsOk) {
            setShowErrors(true);
            return;
          }
          onSave({
            id: emp?.id ?? generateId(),
            category: 'employment',
            label: label.trim(),
            salary: annuals.salary,
            bonus: annuals.bonus,
            allowances: annuals.allowances,
            benefits: annuals.benefits,
            apitApplicable: emp?.apitApplicable ?? true,
            createdAt: emp?.createdAt ?? new Date().toISOString(),
          });
        }}
      >
        {emp ? 'Update' : 'Add'} Employment Income
      </Button>
    </div>
  );
}

type BusinessComponent = 'revenue' | 'expenses';

const BUSINESS_COMPONENT_LABEL: Record<BusinessComponent, string> = {
  revenue: 'Revenue',
  expenses: 'Expenses',
};

function pickDefaultBusinessComponent(biz: BusinessIncome | null): BusinessComponent {
  if (!biz) return 'revenue';
  if (biz.revenue > 0) return 'revenue';
  if (biz.expenses > 0) return 'expenses';
  return 'revenue';
}

function BusinessForm({ onSave, initial }: { onSave: (s: IncomeSource) => void; initial?: IncomeSource }) {
  const biz = initial?.category === 'business' ? initial : null;
  const initialAnnuals = {
    revenue: biz?.revenue ?? 0,
    expenses: biz?.expenses ?? 0,
  };
  const initialComponent = pickDefaultBusinessComponent(biz);

  const [label, setLabel] = useState(biz?.label ?? '');
  const [isMonthly, setIsMonthly] = useState(false);
  const [incomeComponent, setIncomeComponent] = useState<BusinessComponent>(initialComponent);
  const [annuals, setAnnuals] = useState(initialAnnuals);
  const [monthlyAmounts, setMonthlyAmounts] = useState(() =>
    allocateMonthlyFromAnnual(initialAnnuals[initialComponent], Array(12).fill(0)),
  );
  const [sameEveryMonth, setSameEveryMonth] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const netAnnualProfit = Math.max(0, annuals.revenue - annuals.expenses);
  const nameOk = label.trim().length > 0;
  const amountsOk = annuals.revenue > 0 || annuals.expenses > 0;

  const setAnnualRevenue = (raw: number) => {
    setAnnuals((a) => ({ ...a, revenue: Math.max(0, raw) }));
  };

  const setAnnualExpenses = (raw: number) => {
    setAnnuals((a) => ({ ...a, expenses: Math.max(0, raw) }));
  };

  const setMonthAt = (idx: number, raw: number) => {
    const v = Math.max(0, raw);
    setMonthlyAmounts((prev) => {
      const next = [...prev];
      next[idx] = v;
      const sum = next.reduce((s, x) => s + x, 0);
      setAnnuals((a) => ({ ...a, [incomeComponent]: sum }));
      return next;
    });
  };

  const applyUniformBusinessMonths = (raw: number) => {
    const v = Math.max(0, raw);
    setMonthlyAmounts(Array(12).fill(v));
    setAnnuals((a) => ({ ...a, [incomeComponent]: v * 12 }));
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="space-y-2">
        <Label>Source Name</Label>
        <Input
          value={label}
          onChange={(e) => {
            setLabel(e.target.value);
            setShowErrors(false);
          }}
          placeholder="e.g. Freelancing"
          aria-invalid={showErrors && !nameOk}
          className={cn(showErrors && !nameOk && 'border-destructive focus-visible:ring-destructive')}
        />
        {showErrors && !nameOk ? (
          <p className="text-sm text-destructive" role="alert">
            Enter a source name.
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-4 p-4 sm:p-5 bg-secondary rounded-xl">
        <Label className="text-sm font-medium">Input Mode</Label>
        <div className="flex items-center gap-3 text-sm shrink-0">
          <span className={isMonthly ? 'font-semibold text-foreground' : 'text-muted-foreground'}>Monthly</span>
          <Switch
            checked={!isMonthly}
            onCheckedChange={(checked) => {
              setIsMonthly(!checked);
              if (!checked) {
                setSameEveryMonth(false);
                setMonthlyAmounts((prev) =>
                  allocateMonthlyFromAnnual(annuals[incomeComponent], prev),
                );
              }
            }}
          />
          <span className={!isMonthly ? 'font-semibold text-foreground' : 'text-muted-foreground'}>Annually</span>
        </div>
      </div>
      {!isMonthly ? (
        <div
          className={cn(
            'space-y-4 rounded-xl',
            showErrors && !amountsOk && 'ring-2 ring-destructive ring-offset-2 ring-offset-background p-3 -m-1',
          )}
        >
          <p className="text-xs text-muted-foreground">
            Enter revenue and expenses for this business in one place. They apply together toward net profit for tax
            totals.
          </p>
          <div className="space-y-2">
            <Label>Annual revenue</Label>
            <Input
              type="number"
              min={0}
              value={annuals.revenue || ''}
              onChange={(e) => {
                setAnnualRevenue(Number(e.target.value) || 0);
                setShowErrors(false);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Annual expenses</Label>
            <Input
              type="number"
              min={0}
              value={annuals.expenses || ''}
              onChange={(e) => {
                setAnnualExpenses(Number(e.target.value) || 0);
                setShowErrors(false);
              }}
            />
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'space-y-4 rounded-xl',
            showErrors && !amountsOk && 'ring-2 ring-destructive ring-offset-2 ring-offset-background p-3 -m-1',
          )}
        >
          <div className="space-y-2">
            <Label>Monthly amounts for</Label>
            <Select
              value={incomeComponent}
              onValueChange={(v) => {
                const next = v as BusinessComponent;
                setIncomeComponent(next);
                setSameEveryMonth(false);
                setMonthlyAmounts(allocateMonthlyFromAnnual(annuals[next], Array(12).fill(0)));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(BUSINESS_COMPONENT_LABEL) as BusinessComponent[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {BUSINESS_COMPONENT_LABEL[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label>Monthly amounts ({BUSINESS_COMPONENT_LABEL[incomeComponent]})</Label>
            <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
              <Checkbox
                id="biz-same-all-months"
                checked={sameEveryMonth}
                onCheckedChange={(c) => {
                  const on = c === true;
                  setSameEveryMonth(on);
                  if (on) applyUniformBusinessMonths(monthlyAmounts[0] ?? 0);
                  setShowErrors(false);
                }}
                className="mt-0.5"
              />
              <div className="min-w-0 space-y-1">
                <Label htmlFor="biz-same-all-months" className="cursor-pointer text-sm font-medium leading-none">
                  Same amount every month
                </Label>
                <p className="text-xs text-muted-foreground">One value applies to all 12 months.</p>
              </div>
            </div>
            {sameEveryMonth ? (
              <div className="space-y-2">
                <Label>Amount per month</Label>
                <Input
                  type="number"
                  min={0}
                  value={monthlyAmounts[0] || ''}
                  onChange={(e) => {
                    applyUniformBusinessMonths(Number(e.target.value) || 0);
                    setShowErrors(false);
                  }}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
                {MONTH_SHORT.map((m, i) => (
                  <div key={m} className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{m}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={monthlyAmounts[i] || ''}
                      onChange={(e) => {
                        setMonthAt(i, Number(e.target.value) || 0);
                        setShowErrors(false);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="p-4 sm:p-5 bg-secondary rounded-xl text-sm space-y-1">
        <div>
          <span className="text-muted-foreground">Annual net profit (revenue − expenses): </span>
          <span className="font-semibold text-foreground">{formatCurrency(netAnnualProfit)}</span>
        </div>
        {showErrors && !amountsOk ? (
          <p className="text-destructive font-medium" role="alert">
            Enter annual revenue and/or expenses (at least one amount greater than zero).
          </p>
        ) : null}
      </div>
      <Button
        className="w-full h-11 sm:h-12 gradient-primary border-0 text-primary-foreground hover:opacity-90"
        onClick={() => {
          if (!nameOk || !amountsOk) {
            setShowErrors(true);
            return;
          }
          onSave({
            id: biz?.id ?? generateId(),
            category: 'business',
            label: label.trim(),
            revenue: annuals.revenue,
            expenses: annuals.expenses,
            createdAt: biz?.createdAt ?? new Date().toISOString(),
          });
        }}
      >
        {biz ? 'Update' : 'Add'} Business Income
      </Button>
    </div>
  );
}

type InvestmentComponent = 'interest' | 'dividends' | 'rent';

const INVESTMENT_COMPONENT_LABEL: Record<InvestmentComponent, string> = {
  interest: 'Interest',
  dividends: 'Dividends',
  rent: 'Rent',
};

function pickDefaultInvestmentComponent(inv: InvestmentIncome | null): InvestmentComponent {
  if (!inv) return 'interest';
  const order: InvestmentComponent[] = ['interest', 'dividends', 'rent'];
  for (const k of order) {
    if (inv[k] > 0) return k;
  }
  return 'interest';
}

function InvestmentForm({ onSave, initial }: { onSave: (s: IncomeSource) => void; initial?: IncomeSource }) {
  const inv = initial?.category === 'investment' ? initial : null;
  const initialAnnuals = {
    interest: inv?.interest ?? 0,
    dividends: inv?.dividends ?? 0,
    rent: inv?.rent ?? 0,
  };
  const initialComponent = pickDefaultInvestmentComponent(inv);

  const [label, setLabel] = useState(inv?.label ?? '');
  const [isMonthly, setIsMonthly] = useState(false);
  const [incomeComponent, setIncomeComponent] = useState<InvestmentComponent>(initialComponent);
  const [annuals, setAnnuals] = useState(initialAnnuals);
  const [monthlyAmounts, setMonthlyAmounts] = useState(() =>
    allocateMonthlyFromAnnual(initialAnnuals[initialComponent], Array(12).fill(0)),
  );
  const [sameEveryMonth, setSameEveryMonth] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const grandAnnualTaxTotal =
    annuals.interest + annuals.dividends + annuals.rent * 0.75;
  const nameOk = label.trim().length > 0;
  const grossInvestmentOk = annuals.interest + annuals.dividends + annuals.rent > 0;
  const repairAllowanceAnnual = annuals.rent * 0.25;

  const setAnnualForComponent = (v: number) => {
    setAnnuals((a) => ({ ...a, [incomeComponent]: Math.max(0, v) }));
  };

  const setMonthAt = (idx: number, raw: number) => {
    const v = Math.max(0, raw);
    setMonthlyAmounts((prev) => {
      const next = [...prev];
      next[idx] = v;
      const sum = next.reduce((s, x) => s + x, 0);
      setAnnuals((a) => ({ ...a, [incomeComponent]: sum }));
      return next;
    });
  };

  const applyUniformInvestmentMonths = (raw: number) => {
    const v = Math.max(0, raw);
    setMonthlyAmounts(Array(12).fill(v));
    setAnnuals((a) => ({ ...a, [incomeComponent]: v * 12 }));
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="space-y-2">
        <Label>Source Name</Label>
        <Input
          value={label}
          onChange={(e) => {
            setLabel(e.target.value);
            setShowErrors(false);
          }}
          placeholder="e.g. FD Interest"
          aria-invalid={showErrors && !nameOk}
          className={cn(showErrors && !nameOk && 'border-destructive focus-visible:ring-destructive')}
        />
        {showErrors && !nameOk ? (
          <p className="text-sm text-destructive" role="alert">
            Enter a source name.
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label>Income type</Label>
        <Select
          value={incomeComponent}
          onValueChange={(v) => {
            const next = v as InvestmentComponent;
            setIncomeComponent(next);
            setSameEveryMonth(false);
            if (isMonthly) {
              setMonthlyAmounts(allocateMonthlyFromAnnual(annuals[next], Array(12).fill(0)));
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(INVESTMENT_COMPONENT_LABEL) as InvestmentComponent[]).map((key) => (
              <SelectItem key={key} value={key}>
                {INVESTMENT_COMPONENT_LABEL[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between gap-4 p-4 sm:p-5 bg-secondary rounded-xl">
        <Label className="text-sm font-medium">Input Mode</Label>
        <div className="flex items-center gap-3 text-sm shrink-0">
          <span className={isMonthly ? 'font-semibold text-foreground' : 'text-muted-foreground'}>Monthly</span>
          <Switch
            checked={!isMonthly}
            onCheckedChange={(checked) => {
              setIsMonthly(!checked);
              if (!checked) {
                setSameEveryMonth(false);
                setMonthlyAmounts((prev) =>
                  allocateMonthlyFromAnnual(annuals[incomeComponent], prev),
                );
              }
            }}
          />
          <span className={!isMonthly ? 'font-semibold text-foreground' : 'text-muted-foreground'}>Annually</span>
        </div>
      </div>
      {!isMonthly ? (
        <div
          className={cn(
            'space-y-2 rounded-xl',
            showErrors && !grossInvestmentOk && 'ring-2 ring-destructive ring-offset-2 ring-offset-background p-3 -m-1',
          )}
        >
          <Label>Annual amount ({INVESTMENT_COMPONENT_LABEL[incomeComponent]})</Label>
          <Input
            type="number"
            min={0}
            value={annuals[incomeComponent] || ''}
            onChange={(e) => {
              setAnnualForComponent(Number(e.target.value) || 0);
              setShowErrors(false);
            }}
            aria-invalid={showErrors && !grossInvestmentOk}
            className={cn(showErrors && !grossInvestmentOk && 'border-destructive')}
          />
        </div>
      ) : (
        <div
          className={cn(
            'space-y-3 rounded-xl',
            showErrors && !grossInvestmentOk && 'ring-2 ring-destructive ring-offset-2 ring-offset-background p-3 -m-1',
          )}
        >
          <Label>Monthly amounts ({INVESTMENT_COMPONENT_LABEL[incomeComponent]})</Label>
          <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
            <Checkbox
              id="inv-same-all-months"
              checked={sameEveryMonth}
              onCheckedChange={(c) => {
                const on = c === true;
                setSameEveryMonth(on);
                if (on) applyUniformInvestmentMonths(monthlyAmounts[0] ?? 0);
                setShowErrors(false);
              }}
              className="mt-0.5"
            />
            <div className="min-w-0 space-y-1">
              <Label htmlFor="inv-same-all-months" className="cursor-pointer text-sm font-medium leading-none">
                Same amount every month
              </Label>
              <p className="text-xs text-muted-foreground">One value applies to all 12 months.</p>
            </div>
          </div>
          {sameEveryMonth ? (
            <div className="space-y-2">
              <Label>Amount per month</Label>
              <Input
                type="number"
                min={0}
                value={monthlyAmounts[0] || ''}
                onChange={(e) => {
                  applyUniformInvestmentMonths(Number(e.target.value) || 0);
                  setShowErrors(false);
                }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
              {MONTH_SHORT.map((m, i) => (
                <div key={m} className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{m}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={monthlyAmounts[i] || ''}
                    onChange={(e) => {
                      setMonthAt(i, Number(e.target.value) || 0);
                      setShowErrors(false);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="p-4 sm:p-5 bg-secondary rounded-xl text-sm space-y-2">
        <div>
          <span className="text-muted-foreground">Annual total (all components): </span>
          <span className="font-semibold text-foreground">{formatCurrency(grandAnnualTaxTotal)}</span>
        </div>
        {showErrors && !grossInvestmentOk ? (
          <p className="text-destructive font-medium" role="alert">
            Enter at least one amount greater than zero (interest, dividends, or rent).
          </p>
        ) : null}
        {annuals.rent > 0 ? (
          <p className="text-xs text-muted-foreground">
            Includes 25% repair allowance on gross rent (not counted twice in tax). Repair allowance:{' '}
            {formatCurrency(repairAllowanceAnnual)} / yr (informational).
          </p>
        ) : null}
      </div>
      <Button
        className="w-full h-11 sm:h-12 gradient-primary border-0 text-primary-foreground hover:opacity-90"
        onClick={() => {
          if (!nameOk || !grossInvestmentOk) {
            setShowErrors(true);
            return;
          }
          onSave({
            id: inv?.id ?? generateId(),
            category: 'investment',
            label: label.trim(),
            interest: annuals.interest,
            dividends: annuals.dividends,
            rent: annuals.rent,
            createdAt: inv?.createdAt ?? new Date().toISOString(),
          });
        }}
      >
        {inv ? 'Update' : 'Add'} Investment Income
      </Button>
    </div>
  );
}

const categoryIcons = {
  employment: Briefcase,
  business: Building2,
  investment: TrendingUp,
};

const categoryColors = {
  employment: 'text-primary',
  business: 'text-success',
  investment: 'text-warning',
};

const categoryLabels: Record<IncomeCategory, string> = {
  employment: 'Employment',
  business: 'Business',
  investment: 'Investment',
};

const CATEGORY_ORDER: IncomeCategory[] = ['employment', 'business', 'investment'];

type IncomeListTab = 'all' | IncomeCategory;

export default function IncomePage() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const [listTab, setListTab] = useState<IncomeListTab>('all');
  const [dialogCategory, setDialogCategory] = useState<IncomeCategory>('employment');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeSource | undefined>();
  /** Bumps on each "Add Income" open so form state remounts (Radix may keep dialog content mounted while closed). */
  const [incomeDialogNonce, setIncomeDialogNonce] = useState(0);
  const [addAnotherOpen, setAddAnotherOpen] = useState(false);
  const [incomePendingDeleteId, setIncomePendingDeleteId] = useState<string | null>(null);

  const openAddDialog = () => {
    setEditing(undefined);
    setDialogCategory(listTab === 'all' ? 'employment' : listTab);
    setIncomeDialogNonce((n) => n + 1);
    setDialogOpen(true);
  };

  const handleSave = (source: IncomeSource) => {
    if (editing) {
      dispatch({ type: 'UPDATE_INCOME', payload: source });
      setDialogOpen(false);
      setEditing(undefined);
      return;
    }
    dispatch({ type: 'ADD_INCOME', payload: source });
    setDialogOpen(false);
    setEditing(undefined);
    setAddAnotherOpen(true);
  };

  const handleAddAnotherYes = () => {
    setAddAnotherOpen(false);
    setEditing(undefined);
    setIncomeDialogNonce((n) => n + 1);
    queueMicrotask(() => setDialogOpen(true));
  };

  const handleEdit = (source: IncomeSource) => {
    setEditing(source);
    setDialogCategory(source.category);
    setDialogOpen(true);
  };

  const filtered =
    listTab === 'all'
      ? [...state.incomeSources].sort((a, b) => {
          const od = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
          if (od !== 0) return od;
          return a.label.localeCompare(b.label);
        })
      : state.incomeSources.filter((s) => s.category === listTab);

  const incomePendingDelete = incomePendingDeleteId
    ? state.incomeSources.find((s) => s.id === incomePendingDeleteId)
    : undefined;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Income Sources</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all your income sources in one place.</p>
        </div>
        <AssessmentYearSelector className="rounded-xl border border-border/60 bg-card/50 p-4 max-w-xl" />
      </div>

      {/* Category tabs + actions */}
      <Tabs value={listTab} onValueChange={(v) => setListTab(v as IncomeListTab)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <TabsList className="flex w-full min-w-0 flex-wrap h-auto gap-1 p-1 justify-start sm:w-auto">
            <TabsTrigger value="all" className="gap-2">
              <LayoutList className="w-4 h-4" /> All Income
            </TabsTrigger>
            <TabsTrigger value="employment" className="gap-2">
              <Briefcase className="w-4 h-4" /> Employment
            </TabsTrigger>
            <TabsTrigger value="business" className="gap-2">
              <Building2 className="w-4 h-4" /> Business
            </TabsTrigger>
            <TabsTrigger value="investment" className="gap-2">
              <TrendingUp className="w-4 h-4" /> Investment
            </TabsTrigger>
          </TabsList>
          <div className="flex flex-wrap items-center gap-2 shrink-0 sm:justify-end">
            <Button variant="outline" className="gap-2" onClick={() => navigate('/app/calculator')}>
              <Calculator className="w-4 h-4" /> Calculate Tax
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(undefined); }}>
              <Button
                className="gradient-primary border-0 text-primary-foreground hover:opacity-90"
                onClick={openAddDialog}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Income
              </Button>
              <DialogContent className="flex max-h-[calc(100dvh-2rem)] max-w-[95vw] flex-col gap-4 overflow-y-auto overscroll-contain p-6 sm:max-w-4xl sm:p-8">
                <DialogHeader>
                  <DialogTitle className="font-display">{editing ? 'Edit' : 'Add'} Income Source</DialogTitle>
                </DialogHeader>
                <Tabs value={dialogCategory} onValueChange={(v) => setDialogCategory(v as IncomeCategory)}>
                  <TabsList className="w-full h-11 p-1.5">
                    <TabsTrigger value="employment" className="flex-1">
                      Employment
                    </TabsTrigger>
                    <TabsTrigger value="business" className="flex-1">
                      Business
                    </TabsTrigger>
                    <TabsTrigger value="investment" className="flex-1">
                      Investment
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="employment" className="mt-4 sm:mt-6">
                    <EmploymentForm
                      key={
                        dialogOpen
                          ? `emp-${editing?.id ?? `n-${incomeDialogNonce}`}`
                          : 'emp-closed'
                      }
                      onSave={handleSave}
                      initial={editing}
                    />
                  </TabsContent>
                  <TabsContent value="business" className="mt-4 sm:mt-6">
                    <BusinessForm
                      key={
                        dialogOpen
                          ? `biz-${editing?.id ?? `n-${incomeDialogNonce}`}`
                          : 'biz-closed'
                      }
                      onSave={handleSave}
                      initial={editing}
                    />
                  </TabsContent>
                  <TabsContent value="investment" className="mt-4 sm:mt-6">
                    <InvestmentForm
                      key={
                        dialogOpen
                          ? `inv-${editing?.id ?? `n-${incomeDialogNonce}`}`
                          : 'inv-closed'
                      }
                      onSave={handleSave}
                      initial={editing}
                    />
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Tabs>

      {/* List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={listTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-3"
        >
          {filtered.length === 0 ? (
            <Card className="border-dashed border-2 shadow-none">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {listTab === 'all'
                    ? 'No income sources yet. Add employment, business, or investment income to get started.'
                    : `No ${categoryLabels[listTab]} income sources yet.`}
                </p>
                <Button variant="link" className="text-primary mt-2" onClick={openAddDialog}>
                  Add your first one →
                </Button>
              </CardContent>
            </Card>
          ) : (
            filtered.map((source) => {
              const Icon = categoryIcons[source.category];
              const total = getIncomeTotal(source);
              const sublabel =
                source.category === 'business'
                  ? `Revenue: ${formatCurrency((source as { revenue: number }).revenue)} | Expenses: ${formatCurrency((source as { expenses: number }).expenses)}`
                  : source.category === 'employment'
                    ? `Remuneration: ${formatCurrency(total)} · APIT: ${(source as EmploymentIncome).apitApplicable !== false ? 'Yes' : 'No'}`
                    : source.category === 'investment'
                      ? `Interest: ${formatCurrency((source as { interest: number }).interest)}`
                      : '';
              return (
                <motion.div
                  key={source.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="shadow-card border-0 hover:shadow-elevated transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0`}>
                          <Icon className={`w-5 h-5 ${categoryColors[source.category]}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 gap-y-1">
                            <p className="font-medium text-foreground">{source.label}</p>
                            {listTab === 'all' && (
                              <Badge variant="secondary" className="text-xs font-normal shrink-0">
                                {categoryLabels[source.category]}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{sublabel}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-display font-bold text-foreground">{formatCurrency(total)}</span>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(source)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setIncomePendingDeleteId(source.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </AnimatePresence>

      <AlertDialog open={addAnotherOpen} onOpenChange={setAddAnotherOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add another income source?</AlertDialogTitle>
            <AlertDialogDescription>
              Your income was saved. Do you want to add another employment, business, or investment source now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="sm:mt-0">No</AlertDialogCancel>
            <AlertDialogAction className="gradient-primary border-0" onClick={handleAddAnotherYes}>
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={incomePendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setIncomePendingDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete income source?</AlertDialogTitle>
            <AlertDialogDescription>
              {incomePendingDelete
                ? `This will remove “${incomePendingDelete.label}” (${categoryLabels[incomePendingDelete.category]}). This cannot be undone.`
                : 'This income source will be removed. This cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (incomePendingDeleteId) {
                  dispatch({ type: 'REMOVE_INCOME', payload: incomePendingDeleteId });
                  setIncomePendingDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
