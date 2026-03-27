import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { calculateTax } from '@/lib/taxCalculator';

// Generate effective tax rate curve
const incomeLevels = [1_800_000, 2_000_000, 2_500_000, 3_000_000, 3_500_000, 4_000_000, 4_500_000, 5_000_000, 6_000_000, 7_000_000, 8_000_000, 10_000_000];
const taxCurveData = incomeLevels.map((income) => {
  const result = calculateTax(income, income);
  return {
    income: `${(income / 1_000_000).toFixed(1)}M`,
    incomeVal: income,
    tax: Math.round(result.totalTax),
    rate: parseFloat(result.effectiveRate.toFixed(1)),
  };
});

// Sample breakdown for Rs. 4M income
const sampleResult = calculateTax(4_000_000, 4_000_000);
const pieData = sampleResult.breakdown.map((slab) => ({
  name: `${(slab.rate * 100).toFixed(0)}% slab`,
  value: Math.round(slab.tax),
}));
const pieColors = ['hsl(230,65%,72%)', 'hsl(230,65%,60%)', 'hsl(250,70%,55%)', 'hsl(270,60%,50%)', 'hsl(280,55%,45%)'];

const RateTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-elevated text-sm">
      <p className="font-display font-semibold text-foreground">Rs. {d.income}</p>
      <p className="text-muted-foreground">Tax: <span className="text-destructive font-semibold">Rs. {d.tax.toLocaleString()}</span></p>
      <p className="text-muted-foreground">Effective rate: <span className="text-primary font-semibold">{d.rate}%</span></p>
    </div>
  );
};

export function EffectiveRateChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 shadow-elevated">
        <CardContent className="p-8">
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">Effective Tax Rate by Income</h2>
          <p className="text-sm text-muted-foreground mb-6">See how your effective rate increases with income under the progressive system.</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={taxCurveData}>
                <defs>
                  <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(230,65%,52%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(230,65%,52%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="income" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<RateTooltip />} />
                <Area type="monotone" dataKey="rate" stroke="hsl(230,65%,52%)" fill="url(#rateGrad)" strokeWidth={2.5} dot={{ r: 3, fill: 'hsl(230,65%,52%)' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function TaxBreakdownPie() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="border-0 shadow-elevated">
        <CardContent className="p-8">
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">Tax Distribution Example</h2>
          <p className="text-sm text-muted-foreground mb-6">How tax on Rs. 4,000,000 income is split across slabs.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`Rs. ${value.toLocaleString()}`]}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: pieColors[i] }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium font-display text-foreground">Rs. {item.value.toLocaleString()}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-border flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">Total Tax</span>
                <span className="font-bold font-display text-destructive">Rs. {sampleResult.totalTax.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
