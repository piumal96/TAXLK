import { motion } from 'framer-motion';
import { Users, Calculator, TrendingUp, Percent, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockAnalytics, mockAuditLogs } from '@/data/mockAdminData';
import { formatCurrency } from '@/lib/taxCalculator';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { Badge } from '@/components/ui/badge';

const usageChartConfig: ChartConfig = {
  calculations: { label: 'Calculations', color: 'hsl(230, 65%, 52%)' },
};

const bracketChartConfig: ChartConfig = {
  count: { label: 'Taxpayers', color: 'hsl(152, 55%, 42%)' },
};

const kpis = [
  {
    title: 'Total Users',
    value: mockAnalytics.totalUsers.toLocaleString(),
    change: '+12%',
    icon: Users,
    gradient: 'gradient-primary',
  },
  {
    title: 'Total Calculations',
    value: mockAnalytics.totalCalculations.toLocaleString(),
    change: '+23%',
    icon: Calculator,
    gradient: 'gradient-success',
  },
  {
    title: 'Avg. Annual Income',
    value: formatCurrency(mockAnalytics.averageIncome),
    change: '+8%',
    icon: TrendingUp,
    gradient: 'gradient-primary',
  },
  {
    title: 'Avg. Tax Paid',
    value: formatCurrency(mockAnalytics.averageTax),
    change: '+5%',
    icon: Percent,
    gradient: 'gradient-success',
  },
];

const COLORS = ['hsl(230, 65%, 52%)', 'hsl(152, 55%, 42%)', 'hsl(38, 92%, 50%)'];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of the TaxLK system</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="shadow-card hover:shadow-elevated transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.title}</p>
                    <p className="text-2xl font-bold font-display mt-1">{kpi.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${kpi.gradient} flex items-center justify-center`}>
                    <kpi.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-3 text-sm text-accent">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span className="font-medium">{kpi.change}</span>
                  <span className="text-muted-foreground">vs last month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage over time */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Calculations Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={usageChartConfig} className="h-[280px] w-full">
              <LineChart data={mockAnalytics.monthlyUsage}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="calculations"
                  stroke="hsl(230, 65%, 52%)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: 'hsl(230, 65%, 52%)' }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Income Distribution Pie */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Income Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="w-full h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockAnalytics.incomeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {mockAnalytics.incomeDistribution.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 mt-2">
              {mockAnalytics.incomeDistribution.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-muted-foreground">{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bracket Usage + Recent Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Tax Bracket Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={bracketChartConfig} className="h-[250px] w-full">
              <BarChart data={mockAnalytics.bracketUsage}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="bracket" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(152, 55%, 42%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAuditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground">{log.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {log.user} · {log.timestamp}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{log.module}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
