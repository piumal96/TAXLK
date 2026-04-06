import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Calculator,
  TrendingUp,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { motion } from 'framer-motion';
import {
  fetchAdminCalculationRows,
  type AdminCalculationRow,
} from '@/services/firebase/adminCalculationsService';

const ITEMS_PER_PAGE = 6;
const fmt = (n: number) => `Rs. ${n.toLocaleString()}`;

const incomeRanges = [
  { label: 'All Ranges', value: 'all' },
  { label: 'Under 3M', value: '0-3000000' },
  { label: '3M – 5M', value: '3000000-5000000' },
  { label: '5M – 8M', value: '5000000-8000000' },
  { label: 'Over 8M', value: '8000000-999999999' },
];

export default function CalculationsPage() {
  const [calculations, setCalculations] = useState<AdminCalculationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [incomeRange, setIncomeRange] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const rows = await fetchAdminCalculationRows();
      setCalculations(rows);
    } catch (e) {
      console.error(e);
      setLoadError(e instanceof Error ? e.message : 'Failed to load calculations');
      setCalculations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    return calculations.filter((c) => {
      const matchSearch =
        !search || c.userName.toLowerCase().includes(search.toLowerCase());
      const matchYear = yearFilter === 'all' || c.assessmentYear === yearFilter;
      let matchRange = true;
      if (incomeRange !== 'all') {
        const [min, max] = incomeRange.split('-').map(Number);
        matchRange = c.totalIncome >= min && c.totalIncome < max;
      }
      return matchSearch && matchYear && matchRange;
    });
  }, [calculations, search, incomeRange, yearFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = useMemo(() => {
    const total = calculations.length;
    if (total === 0) {
      return { total: 0, avgIncome: 0, avgTax: 0, avgRate: 0 };
    }
    const avgIncome = calculations.reduce((s, c) => s + c.totalIncome, 0) / total;
    const avgTax = calculations.reduce((s, c) => s + c.totalTax, 0) / total;
    const avgRate = calculations.reduce((s, c) => s + c.effectiveRate, 0) / total;
    return { total, avgIncome, avgTax, avgRate };
  }, [calculations]);

  const assessmentYears = useMemo(
    () => [...new Set(calculations.map((c) => c.assessmentYear))].sort(),
    [calculations],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
          Tax Calculations
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Saved calculation history from every user workspace, newest first. If nothing loads, deploy
          the latest Firestore rules (admin read access on workspace collections).
        </p>
      </div>

      {loadError ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-col gap-3 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <p className="text-sm text-destructive font-medium">{loadError}</p>
              <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => void load()}>
                Retry
              </Button>
            </div>
            {/permission|insufficient/i.test(loadError) ? (
              <div className="text-sm text-muted-foreground space-y-2 border-t border-destructive/20 pt-3">
                <p>
                  This page reads all <code className="rounded bg-muted px-1 py-0.5 text-xs">user_data</code> and{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">user_tax_workspace</code> documents. Your
                  project must deploy rules that grant admins read access (see{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">firestore.rules</code> in this repo).
                </p>
                <p className="font-mono text-xs bg-muted/80 rounded-md px-3 py-2">
                  firebase deploy --only firestore:rules
                </p>
                <p>
                  Also confirm your account has <code className="rounded bg-muted px-1 py-0.5 text-xs">role: admin</code>{' '}
                  on your <code className="rounded bg-muted px-1 py-0.5 text-xs">users/{'{uid}'}</code> document in
                  Firestore — that is what security rules use, not only the in-app UI.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Calculations', value: stats.total, icon: Calculator, fmt: String },
          { label: 'Avg. Income', value: stats.avgIncome, icon: DollarSign, fmt: (n: number) => fmt(Math.round(n)) },
          { label: 'Avg. Tax', value: stats.avgTax, icon: TrendingUp, fmt: (n: number) => fmt(Math.round(n)) },
          { label: 'Avg. Effective Rate', value: stats.avgRate, icon: TrendingUp, fmt: (n: number) => `${n.toFixed(2)}%` },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="p-2.5 rounded-xl bg-secondary text-primary">
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">
                  {loading ? (
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </span>
                  ) : (
                    s.fmt(s.value)
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by user name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
                disabled={loading}
              />
            </div>
            <Select
              value={incomeRange}
              onValueChange={(v) => {
                setIncomeRange(v);
                setPage(1);
              }}
              disabled={loading}
            >
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Income Range" />
              </SelectTrigger>
              <SelectContent>
                {incomeRanges.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={yearFilter}
              onValueChange={(v) => {
                setYearFilter(v);
                setPage(1);
              }}
              disabled={loading}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Year of assessment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {assessmentYears.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/50">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10" />
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="text-right">Total Income</TableHead>
              <TableHead className="text-right">Taxable Income</TableHead>
              <TableHead className="text-right">Total Tax</TableHead>
              <TableHead className="text-right">Eff. Rate</TableHead>
              <TableHead>YoA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && calculations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading calculations…
                  </span>
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  No calculations found. Users build history when they run the tax calculator with
                  results saved to their workspace.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((calc) => {
                const isExpanded = expandedId === calc.id;
                const slabs = calc.breakdown;
                return (
                  <Fragment key={calc.id}>
                    <TableRow
                      className="cursor-pointer group"
                      onClick={() => setExpandedId(isExpanded ? null : calc.id)}
                    >
                      <TableCell>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          {calc.date}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                            {calc.userName
                              .split(/\s+/)
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase() || '?'}
                          </div>
                          <span className="text-sm font-medium text-foreground">{calc.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-foreground">
                        {fmt(calc.totalIncome)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {fmt(calc.taxableIncome)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold text-foreground">
                        {fmt(calc.totalTax)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {calc.effectiveRate.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {calc.assessmentYear}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="hover:bg-transparent bg-secondary/20">
                        <TableCell colSpan={8} className="p-0">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="px-6 py-4"
                          >
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                              Slab breakdown
                            </p>
                            {slabs.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                No slab breakdown stored for this entry.
                              </p>
                            ) : (
                              <div className="rounded-lg border overflow-hidden bg-card">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                      <TableHead>Slab</TableHead>
                                      <TableHead className="text-right">Amount</TableHead>
                                      <TableHead className="text-right">Rate</TableHead>
                                      <TableHead className="text-right">Tax</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {slabs.map((s, i) => (
                                      <TableRow key={i}>
                                        <TableCell className="text-sm">{s.label}</TableCell>
                                        <TableCell className="text-right text-sm">{fmt(s.amount)}</TableCell>
                                        <TableCell className="text-right text-sm">
                                          {(s.rate * 100).toFixed(0)}%
                                        </TableCell>
                                        <TableCell className="text-right text-sm font-medium">
                                          {fmt(s.tax)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                    <TableRow className="bg-secondary/30 hover:bg-secondary/30 font-semibold">
                                      <TableCell colSpan={3} className="text-foreground">
                                        Total
                                      </TableCell>
                                      <TableCell className="text-right text-foreground">
                                        {fmt(calc.totalTax)}
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </motion.div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between px-4 py-3 border-t">
          <p className="text-sm text-muted-foreground">
            Showing{' '}
            {filtered.length === 0
              ? '0'
              : `${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(page * ITEMS_PER_PAGE, filtered.length)}`}{' '}
            of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1 || loading}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="icon"
                className="h-8 w-8"
                disabled={loading}
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
