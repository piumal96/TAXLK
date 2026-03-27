import { useState, useMemo } from 'react';
import {
  FlaskConical,
  Calculator,
  ArrowRightLeft,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mockTaxVersions, type TaxVersion } from '@/data/mockAdminData';

interface SlabResult {
  label: string;
  amount: number;
  rate: number;
  tax: number;
}

interface CalcResult {
  version: TaxVersion;
  taxableIncome: number;
  slabs: SlabResult[];
  totalTax: number;
  effectiveRate: number;
}

function calculateTax(income: number, version: TaxVersion): CalcResult {
  const taxableIncome = Math.max(0, income - version.taxFreeThreshold);
  let remaining = taxableIncome;
  const slabs: SlabResult[] = [];

  for (const slab of version.slabs) {
    if (remaining <= 0) break;
    const limit = slab.limit ?? remaining;
    const amount = Math.min(remaining, limit);
    slabs.push({
      label: slab.label,
      amount,
      rate: slab.rate,
      tax: amount * slab.rate,
    });
    remaining -= amount;
  }

  const totalTax = slabs.reduce((sum, s) => sum + s.tax, 0);
  const effectiveRate = income > 0 ? (totalTax / income) * 100 : 0;

  return { version, taxableIncome, slabs, totalTax, effectiveRate };
}

const fmt = (n: number) => `Rs. ${n.toLocaleString()}`;

export default function SandboxPage() {
  const [income, setIncome] = useState<string>('4200000');
  const [versionA, setVersionA] = useState(mockTaxVersions[0].id);
  const [versionB, setVersionB] = useState(mockTaxVersions[1]?.id ?? mockTaxVersions[0].id);
  const [results, setResults] = useState<[CalcResult, CalcResult] | null>(null);

  const vA = mockTaxVersions.find((v) => v.id === versionA)!;
  const vB = mockTaxVersions.find((v) => v.id === versionB)!;

  const handleCalculate = () => {
    const amount = parseFloat(income) || 0;
    setResults([calculateTax(amount, vA), calculateTax(amount, vB)]);
  };

  const handleReset = () => {
    setIncome('4200000');
    setResults(null);
  };

  const diff = results ? results[0].totalTax - results[1].totalTax : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
          Tax Sandbox
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Simulate tax calculations and compare results across different tax versions
        </p>
      </div>

      {/* Input Panel */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Annual Income (LKR)</Label>
              <Input
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="Enter income"
              />
            </div>
            <div className="space-y-2">
              <Label>Version A</Label>
              <Select value={versionA} onValueChange={setVersionA}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockTaxVersions.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      v{v.version} — {v.name}
                      {v.isActive ? ' (Active)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Version B</Label>
              <Select value={versionB} onValueChange={setVersionB}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockTaxVersions.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      v{v.version} — {v.name}
                      {v.isActive ? ' (Active)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 gap-2" onClick={handleCalculate}>
                <Calculator className="w-4 h-4" />
                Calculate
              </Button>
              <Button variant="outline" size="icon" onClick={handleReset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Comparison Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Version A */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Version A — v{results[0].version.version}
                  </CardTitle>
                  {results[0].version.isActive && (
                    <Badge variant="default" className="text-xs">Active</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{fmt(results[0].totalTax)}</p>
                <p className="text-xs text-muted-foreground">
                  Effective rate: {results[0].effectiveRate.toFixed(2)}%
                </p>
              </CardContent>
            </Card>

            {/* Difference */}
            <Card className="border-border/50 flex items-center justify-center">
              <CardContent className="text-center py-6">
                <div className="flex items-center justify-center gap-2 mb-1">
                  {diff > 0 ? (
                    <TrendingUp className="w-5 h-5 text-destructive" />
                  ) : diff < 0 ? (
                    <TrendingDown className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Minus className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="text-xl font-bold text-foreground">
                    {diff === 0 ? 'No Difference' : fmt(Math.abs(diff))}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {diff > 0
                    ? 'Version A charges more tax'
                    : diff < 0
                    ? 'Version B charges more tax'
                    : 'Both versions produce the same tax'}
                </p>
              </CardContent>
            </Card>

            {/* Version B */}
            <Card className="border-secondary bg-secondary/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Version B — v{results[1].version.version}
                  </CardTitle>
                  {results[1].version.isActive && (
                    <Badge variant="default" className="text-xs">Active</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{fmt(results[1].totalTax)}</p>
                <p className="text-xs text-muted-foreground">
                  Effective rate: {results[1].effectiveRate.toFixed(2)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Side-by-side Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {results.map((res, idx) => (
              <Card key={idx} className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    v{res.version.version} Slab Breakdown
                  </CardTitle>
                  <CardDescription>
                    Tax-free threshold: {fmt(res.version.taxFreeThreshold)} · Taxable: {fmt(res.taxableIncome)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
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
                      {res.slabs.map((s, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm text-foreground">{s.label}</TableCell>
                          <TableCell className="text-right text-sm">{fmt(s.amount)}</TableCell>
                          <TableCell className="text-right text-sm">{(s.rate * 100).toFixed(0)}%</TableCell>
                          <TableCell className="text-right text-sm font-medium text-foreground">{fmt(s.tax)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-secondary/30 font-semibold hover:bg-secondary/30">
                        <TableCell colSpan={3} className="text-foreground">Total Tax</TableCell>
                        <TableCell className="text-right text-foreground">{fmt(res.totalTax)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!results && (
        <Card className="border-border/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <FlaskConical className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Run a Simulation</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Enter an income amount and select two tax versions to compare their calculations side by side.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
