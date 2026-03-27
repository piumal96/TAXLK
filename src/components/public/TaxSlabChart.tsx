import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';

const slabData = [
  { slab: '6%', range: 'First 1M', rate: 6, maxTax: 60000, fill: 'hsl(230, 65%, 72%)' },
  { slab: '18%', range: 'Next 500K', rate: 18, maxTax: 90000, fill: 'hsl(230, 65%, 60%)' },
  { slab: '24%', range: 'Next 500K', rate: 24, maxTax: 120000, fill: 'hsl(230, 65%, 52%)' },
  { slab: '30%', range: 'Next 500K', rate: 30, maxTax: 150000, fill: 'hsl(250, 70%, 52%)' },
  { slab: '36%', range: 'Balance', rate: 36, maxTax: 180000, fill: 'hsl(270, 60%, 50%)' },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-elevated text-sm">
      <p className="font-display font-semibold text-foreground">{d.range}</p>
      <p className="text-muted-foreground">Rate: <span className="text-primary font-semibold">{d.rate}%</span></p>
      <p className="text-muted-foreground">Max tax: <span className="text-foreground font-medium">Rs. {d.maxTax.toLocaleString()}</span></p>
    </div>
  );
};

export function TaxSlabChart() {
  return (
    <section className="py-20 lg:py-28 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
              Progressive Tax System
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Understand Your Tax Slabs
            </h2>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              Sri Lanka uses a progressive tax system. After the <span className="text-accent font-semibold">Rs. 1,800,000</span> tax-free threshold, your income is taxed in slabs at increasing rates from 6% to 36%.
            </p>
            <div className="mt-6 space-y-3">
              {slabData.map((s, i) => (
                <motion.div
                  key={s.slab}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-primary-foreground" style={{ background: s.fill }}>
                    {s.slab}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{s.range}</span>
                      <span className="text-xs text-muted-foreground">Max Rs. {s.maxTax.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full mt-1 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: s.fill }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(s.rate / 36) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-0 shadow-float">
              <CardContent className="p-6">
                <p className="text-sm font-display font-semibold text-foreground mb-4">Maximum Tax Per Slab (LKR)</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={slabData} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        tickFormatter={(v) => `${v / 1000}K`}
                      />
                      <YAxis
                        dataKey="range"
                        type="category"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        width={70}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="maxTax" radius={[0, 6, 6, 0]} barSize={28}>
                        {slabData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
