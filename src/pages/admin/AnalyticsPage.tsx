import {
  BarChart3,
  TrendingUp,
  Users,
  Calculator,
  DollarSign,
  PieChart,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { mockAnalytics, mockCalculations } from '@/data/mockAdminData';

const fmt = (n: number) => `Rs. ${(n / 1_000_000).toFixed(1)}M`;

const usageTrend = mockAnalytics.monthlyUsage;

const incomeDistribution = mockAnalytics.incomeDistribution;

const bracketUsage = mockAnalytics.bracketUsage;

const pieColors = ['hsl(230,65%,52%)', 'hsl(152,55%,42%)', 'hsl(38,92%,50%)'];

// Derived: income vs tax scatter-like data
const incomeTaxData = mockCalculations.map((c) => ({
  name: c.userName.split(' ')[0],
  income: c.totalIncome / 1_000_000,
  tax: c.totalTax / 1_000_000,
  rate: c.effectiveRate,
}));

// Derived: monthly income averages (simulated)
const monthlyRevenue = [
  { month: 'Oct', avgIncome: 3.8, avgTax: 0.35 },
  { month: 'Nov', avgIncome: 4.1, avgTax: 0.42 },
  { month: 'Dec', avgIncome: 4.5, avgTax: 0.48 },
  { month: 'Jan', avgIncome: 4.2, avgTax: 0.45 },
  { month: 'Feb', avgIncome: 4.6, avgTax: 0.52 },
  { month: 'Mar', avgIncome: 4.9, avgTax: 0.58 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
          Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Insights into system usage, income patterns, and tax distribution
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: mockAnalytics.totalUsers.toLocaleString(), icon: Users, delta: '+12%', color: 'text-primary' },
          { label: 'Calculations', value: mockAnalytics.totalCalculations.toLocaleString(), icon: Calculator, delta: '+18%', color: 'text-emerald-500' },
          { label: 'Avg. Income', value: fmt(mockAnalytics.averageIncome), icon: DollarSign, delta: '+5%', color: 'text-primary' },
          { label: 'Avg. Tax', value: fmt(mockAnalytics.averageTax), icon: TrendingUp, delta: '+8%', color: 'text-amber-500' },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-secondary ${kpi.color}`}>
                  <kpi.icon className="w-4 h-4" />
                </div>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  {kpi.delta}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 1: Usage Trend + Income Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Usage Trend */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Usage Trends</CardTitle>
            <CardDescription>Monthly tax calculations over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usageTrend}>
                  <defs>
                    <linearGradient id="colorCalc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(230,65%,52%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(230,65%,52%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area type="monotone" dataKey="calculations" stroke="hsl(230,65%,52%)" fill="url(#colorCalc)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Income Distribution Pie */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Income Sources</CardTitle>
            <CardDescription>Distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={incomeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {incomeDistribution.map((_, i) => (
                      <Cell key={i} fill={pieColors[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {incomeDistribution.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: pieColors[i] }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium text-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Tax Bracket + Income vs Tax */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Tax Bracket Usage */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Tax Bracket Usage</CardTitle>
            <CardDescription>Number of calculations reaching each tax bracket</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bracketUsage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} className="text-xs" />
                  <YAxis dataKey="bracket" type="category" tick={{ fill: 'hsl(var(--muted-foreground))' }} className="text-xs" width={40} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill="hsl(230,65%,52%)" radius={[0, 6, 6, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Income vs Tax Trends */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Income vs Tax Trends</CardTitle>
            <CardDescription>Average monthly income and tax in millions (LKR)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} className="text-xs" />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} className="text-xs" />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number) => [`Rs. ${value}M`]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="avgIncome" name="Avg Income" stroke="hsl(230,65%,52%)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="avgTax" name="Avg Tax" stroke="hsl(152,55%,42%)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Per-user comparison bar chart */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">User Income & Tax Comparison</CardTitle>
          <CardDescription>Recent calculations — income vs tax paid per user (in millions LKR)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeTaxData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} className="text-xs" />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} className="text-xs" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(value: number) => [`Rs. ${value.toFixed(2)}M`]}
                />
                <Legend />
                <Bar dataKey="income" name="Income" fill="hsl(230,65%,52%)" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="tax" name="Tax" fill="hsl(38,92%,50%)" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
