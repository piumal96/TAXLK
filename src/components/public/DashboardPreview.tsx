import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const miniSlabData = [
  { slab: '6%', amount: 60000, fill: 'hsl(230,65%,72%)' },
  { slab: '18%', amount: 90000, fill: 'hsl(230,65%,60%)' },
  { slab: '24%', amount: 120000, fill: 'hsl(250,70%,55%)' },
  { slab: '30%', amount: 90000, fill: 'hsl(270,60%,50%)' },
];

export function DashboardPreview() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            Powerful Dashboard Experience
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            See exactly where your money goes with interactive charts, detailed breakdowns, and historical tracking.
          </p>
        </motion.div>

        <motion.div
          className="relative max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Mock dashboard frame */}
          <div className="rounded-2xl border bg-card shadow-float overflow-hidden">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-5 py-3 border-b bg-secondary/30">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-accent/60" />
              </div>
              <span className="text-xs text-muted-foreground font-medium ml-3">TaxLK Dashboard</span>
            </div>

            <div className="p-6 lg:p-8">
              {/* KPI Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Annual Income', value: 'Rs. 4,800,000', change: null },
                  { label: 'Total Tax', value: 'Rs. 540,000', change: '-8.2%' },
                  { label: 'Monthly APIT', value: 'Rs. 45,000', change: null },
                  { label: 'Effective Rate', value: '11.25%', change: '+0.3%' },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-secondary/50 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                    <p className="font-display font-bold text-lg text-foreground">{kpi.value}</p>
                    {kpi.change && (
                      <Badge variant="outline" className="text-[10px] mt-1 bg-accent/10 text-accent border-accent/20">
                        {kpi.change}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              {/* Chart row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-secondary/30 rounded-xl p-5">
                  <p className="text-sm font-display font-semibold text-foreground mb-3">Tax by Slab</p>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={miniSlabData}>
                        <XAxis dataKey="slab" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={32}>
                          {miniSlabData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-secondary/30 rounded-xl p-5">
                  <p className="text-sm font-display font-semibold text-foreground mb-3">Income Breakdown</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Employment', pct: 65, color: 'hsl(230,65%,52%)' },
                      { label: 'Business', pct: 25, color: 'hsl(152,55%,42%)' },
                      { label: 'Investment', pct: 10, color: 'hsl(38,92%,50%)' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-medium text-foreground">{item.pct}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: item.color }}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${item.pct}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating glow */}
          <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-2xl -z-10" />
        </motion.div>

        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Button asChild size="lg" className="gradient-primary border-0 text-primary-foreground px-8 h-12 text-base">
            <Link to="/register">Try It Yourself <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
