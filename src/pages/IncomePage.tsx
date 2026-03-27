import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Briefcase, Building2, TrendingUp, Trash2, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAppContext } from '@/context/AppContext';
import { IncomeSource, IncomeCategory, getIncomeTotal } from '@/types/income';
import { formatCurrency } from '@/lib/taxCalculator';

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function EmploymentForm({ onSave, initial }: { onSave: (s: IncomeSource) => void; initial?: IncomeSource }) {
  const emp = initial?.category === 'employment' ? initial : null;
  const [isMonthly, setIsMonthly] = useState(true);
  const [salary, setSalary] = useState(emp ? (emp.salary / (isMonthly ? 12 : 1)) : 0);
  const [bonus, setBonus] = useState(emp ? (emp.bonus / (isMonthly ? 12 : 1)) : 0);
  const [allowances, setAllowances] = useState(emp ? (emp.allowances / (isMonthly ? 12 : 1)) : 0);
  const [benefits, setBenefits] = useState(emp ? (emp.benefits / (isMonthly ? 12 : 1)) : 0);
  const [label, setLabel] = useState(emp?.label ?? '');
  const [apit, setApit] = useState(emp?.apitApplicable ?? true);

  const multiplier = isMonthly ? 12 : 1;
  const periodLabel = isMonthly ? 'Monthly' : 'Annual';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
        <Label className="text-sm font-medium">Input Mode</Label>
        <div className="flex items-center gap-2 text-sm">
          <span className={isMonthly ? 'font-semibold text-foreground' : 'text-muted-foreground'}>Monthly</span>
          <Switch checked={!isMonthly} onCheckedChange={(checked) => setIsMonthly(!checked)} />
          <span className={!isMonthly ? 'font-semibold text-foreground' : 'text-muted-foreground'}>Annually</span>
        </div>
      </div>
      <div>
        <Label>Source Name</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Primary Job" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>{periodLabel} Salary</Label><Input type="number" value={salary || ''} onChange={(e) => setSalary(Number(e.target.value))} /></div>
        <div><Label>{periodLabel} Bonus</Label><Input type="number" value={bonus || ''} onChange={(e) => setBonus(Number(e.target.value))} /></div>
        <div><Label>{periodLabel} Allowances</Label><Input type="number" value={allowances || ''} onChange={(e) => setAllowances(Number(e.target.value))} /></div>
        <div><Label>{periodLabel} Benefits</Label><Input type="number" value={benefits || ''} onChange={(e) => setBenefits(Number(e.target.value))} /></div>
      </div>
      {isMonthly && (
        <div className="p-3 bg-secondary rounded-lg text-sm">
          <span className="text-muted-foreground">Annual Total: </span>
          <span className="font-semibold text-foreground">{formatCurrency((salary + bonus + allowances + benefits) * 12)}</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Switch checked={apit} onCheckedChange={setApit} />
        <Label>APIT Applicable</Label>
      </div>
      <Button
        className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90"
        onClick={() =>
          onSave({
            id: emp?.id ?? generateId(),
            category: 'employment',
            label: label || 'Employment Income',
            salary: salary * multiplier,
            bonus: bonus * multiplier,
            allowances: allowances * multiplier,
            benefits: benefits * multiplier,
            apitApplicable: apit,
            createdAt: emp?.createdAt ?? new Date().toISOString(),
          })
        }
      >
        {emp ? 'Update' : 'Add'} Employment Income
      </Button>
    </div>
  );
}

function BusinessForm({ onSave, initial }: { onSave: (s: IncomeSource) => void; initial?: IncomeSource }) {
  const biz = initial?.category === 'business' ? initial : null;
  const [isMonthly, setIsMonthly] = useState(true);
  const [label, setLabel] = useState(biz?.label ?? '');
  const [revenue, setRevenue] = useState(biz ? (biz.revenue / (isMonthly ? 12 : 1)) : 0);
  const [expenses, setExpenses] = useState(biz ? (biz.expenses / (isMonthly ? 12 : 1)) : 0);

  const multiplier = isMonthly ? 12 : 1;
  const periodLabel = isMonthly ? 'Monthly' : 'Annual';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
        <Label className="text-sm font-medium">Input Mode</Label>
        <div className="flex items-center gap-2 text-sm">
          <span className={isMonthly ? 'font-semibold text-foreground' : 'text-muted-foreground'}>Monthly</span>
          <Switch checked={!isMonthly} onCheckedChange={(checked) => setIsMonthly(!checked)} />
          <span className={!isMonthly ? 'font-semibold text-foreground' : 'text-muted-foreground'}>Annually</span>
        </div>
      </div>
      <div><Label>Business Name</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Freelancing" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>{periodLabel} Revenue</Label><Input type="number" value={revenue || ''} onChange={(e) => setRevenue(Number(e.target.value))} /></div>
        <div><Label>{periodLabel} Expenses</Label><Input type="number" value={expenses || ''} onChange={(e) => setExpenses(Number(e.target.value))} /></div>
      </div>
      <div className="p-3 bg-secondary rounded-lg text-sm">
        <span className="text-muted-foreground">Net Profit ({isMonthly ? 'Annual' : ''}): </span>
        <span className="font-semibold text-foreground">{formatCurrency(Math.max(0, (revenue - expenses) * multiplier))}</span>
      </div>
      <Button
        className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90"
        onClick={() =>
          onSave({
            id: biz?.id ?? generateId(),
            category: 'business',
            label: label || 'Business Income',
            revenue: revenue * multiplier,
            expenses: expenses * multiplier,
            createdAt: biz?.createdAt ?? new Date().toISOString(),
          })
        }
      >
        {biz ? 'Update' : 'Add'} Business Income
      </Button>
    </div>
  );
}

function InvestmentForm({ onSave, initial }: { onSave: (s: IncomeSource) => void; initial?: IncomeSource }) {
  const inv = initial?.category === 'investment' ? initial : null;
  const [isMonthly, setIsMonthly] = useState(true);
  const [label, setLabel] = useState(inv?.label ?? '');
  const [interest, setInterest] = useState(inv ? (inv.interest / (isMonthly ? 12 : 1)) : 0);
  const [dividends, setDividends] = useState(inv ? (inv.dividends / (isMonthly ? 12 : 1)) : 0);
  const [rent, setRent] = useState(inv ? (inv.rent / (isMonthly ? 12 : 1)) : 0);

  const multiplier = isMonthly ? 12 : 1;
  const periodLabel = isMonthly ? 'Monthly' : 'Annual';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
        <Label className="text-sm font-medium">Input Mode</Label>
        <div className="flex items-center gap-2 text-sm">
          <span className={isMonthly ? 'font-semibold text-foreground' : 'text-muted-foreground'}>Monthly</span>
          <Switch checked={!isMonthly} onCheckedChange={(checked) => setIsMonthly(!checked)} />
          <span className={!isMonthly ? 'font-semibold text-foreground' : 'text-muted-foreground'}>Annually</span>
        </div>
      </div>
      <div><Label>Source Name</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. FD Interest" /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>{periodLabel} Interest</Label><Input type="number" value={interest || ''} onChange={(e) => setInterest(Number(e.target.value))} /></div>
        <div><Label>{periodLabel} Dividends</Label><Input type="number" value={dividends || ''} onChange={(e) => setDividends(Number(e.target.value))} /></div>
        <div><Label>{periodLabel} Rent</Label><Input type="number" value={rent || ''} onChange={(e) => setRent(Number(e.target.value))} /></div>
      </div>
      {isMonthly && (
        <div className="p-3 bg-secondary rounded-lg text-sm space-y-1">
          {rent > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Repair Allowance (25% of rent)</span>
              <span>- {formatCurrency(rent * 0.25 * 12)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Annual Total: </span>
            <span className="font-semibold text-foreground">{formatCurrency((interest + dividends + rent * 0.75) * 12)}</span>
          </div>
        </div>
      )}
      <Button
        className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90"
        onClick={() =>
          onSave({
            id: inv?.id ?? generateId(),
            category: 'investment',
            label: label || 'Investment Income',
            interest: interest * multiplier,
            dividends: dividends * multiplier,
            rent: rent * multiplier,
            createdAt: inv?.createdAt ?? new Date().toISOString(),
          })
        }
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

export default function IncomePage() {
  const { state, dispatch } = useAppContext();
  const [activeTab, setActiveTab] = useState<IncomeCategory>('employment');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeSource | undefined>();

  const handleSave = (source: IncomeSource) => {
    if (editing) {
      dispatch({ type: 'UPDATE_INCOME', payload: source });
    } else {
      dispatch({ type: 'ADD_INCOME', payload: source });
    }
    setDialogOpen(false);
    setEditing(undefined);
  };

  const handleEdit = (source: IncomeSource) => {
    setEditing(source);
    setActiveTab(source.category);
    setDialogOpen(true);
  };

  const filtered = state.incomeSources.filter((s) => s.category === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Income Sources</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all your income sources in one place.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(undefined); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary border-0 text-primary-foreground hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> Add Income
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">{editing ? 'Edit' : 'Add'} Income Source</DialogTitle>
            </DialogHeader>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as IncomeCategory)}>
              <TabsList className="w-full">
                <TabsTrigger value="employment" className="flex-1">Employment</TabsTrigger>
                <TabsTrigger value="business" className="flex-1">Business</TabsTrigger>
                <TabsTrigger value="investment" className="flex-1">Investment</TabsTrigger>
              </TabsList>
              <TabsContent value="employment"><EmploymentForm onSave={handleSave} initial={editing} /></TabsContent>
              <TabsContent value="business"><BusinessForm onSave={handleSave} initial={editing} /></TabsContent>
              <TabsContent value="investment"><InvestmentForm onSave={handleSave} initial={editing} /></TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as IncomeCategory)}>
        <TabsList>
          <TabsTrigger value="employment" className="gap-2"><Briefcase className="w-4 h-4" /> Employment</TabsTrigger>
          <TabsTrigger value="business" className="gap-2"><Building2 className="w-4 h-4" /> Business</TabsTrigger>
          <TabsTrigger value="investment" className="gap-2"><TrendingUp className="w-4 h-4" /> Investment</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-3"
        >
          {filtered.length === 0 ? (
            <Card className="border-dashed border-2 shadow-none">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No {activeTab} income sources yet.</p>
                <Button
                  variant="link"
                  className="text-primary mt-2"
                  onClick={() => setDialogOpen(true)}
                >
                  Add your first one →
                </Button>
              </CardContent>
            </Card>
          ) : (
            filtered.map((source) => {
              const Icon = categoryIcons[source.category];
              const total = getIncomeTotal(source);
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
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${categoryColors[source.category]}`} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{source.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {source.category === 'business' && `Revenue: ${formatCurrency((source as any).revenue)} | Expenses: ${formatCurrency((source as any).expenses)}`}
                            {source.category === 'employment' && `Salary: ${formatCurrency((source as any).salary)}`}
                            {source.category === 'investment' && `Interest: ${formatCurrency((source as any).interest)}`}
                          </p>
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
                          onClick={() => dispatch({ type: 'REMOVE_INCOME', payload: source.id })}
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
    </div>
  );
}
