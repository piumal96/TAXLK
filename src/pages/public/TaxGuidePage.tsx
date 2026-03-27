import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SEO } from '@/components/SEO';
import { EffectiveRateChart, TaxBreakdownPie } from '@/components/public/TaxGuideCharts';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const taxSlabs = [
  { range: 'First Rs. 500,000', rate: '6%', tax: 'Rs. 30,000' },
  { range: 'Next Rs. 500,000', rate: '12%', tax: 'Rs. 60,000' },
  { range: 'Next Rs. 500,000', rate: '18%', tax: 'Rs. 90,000' },
  { range: 'Next Rs. 500,000', rate: '24%', tax: 'Rs. 120,000' },
  { range: 'Next Rs. 500,000', rate: '30%', tax: 'Rs. 150,000' },
  { range: 'Balance', rate: '36%', tax: 'Varies' },
];

export default function TaxGuidePage() {
  return (
    <div>
      <SEO
        title="Sri Lanka Tax Guide"
        description="Complete guide to Sri Lankan income tax: tax-free threshold, progressive tax slabs, APIT explanation, and example calculations."
        path="/tax-guide"
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'Sri Lanka Income Tax Guide 2024/25',
          description: 'Complete guide to Sri Lankan income tax including tax slabs, APIT, and example calculations.',
          author: { '@type': 'Organization', name: 'TaxLK' },
          publisher: { '@type': 'Organization', name: 'TaxLK' },
        }}
      />
      {/* Header */}
      <section className="relative py-16 lg:py-24">
        <div className="absolute inset-0 gradient-hero opacity-[0.04]" />
        <div className="relative max-w-7xl mx-auto px-4 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <BookOpen className="w-3.5 h-3.5" /> Tax Education
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground">
              Sri Lanka Income Tax Guide
            </h1>
            <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
              Everything you need to know about income tax in Sri Lanka — thresholds, slabs, APIT, and more.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 lg:px-8 pb-20 space-y-12">
        {/* What is Income Tax */}
        <motion.section {...fadeUp}>
          <Card className="border-0 shadow-elevated">
            <CardContent className="p-8">
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">What is Income Tax in Sri Lanka?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Income tax in Sri Lanka is a direct tax levied on individuals and businesses by the Inland Revenue Department (IRD).
                Under the Inland Revenue Act No. 24 of 2017 (as amended), all resident individuals earning above the tax-free
                threshold are required to pay income tax on their assessable income.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Income is categorized into employment income, business income, investment income, and other sources. Each
                category has specific rules for calculating taxable income.
              </p>
            </CardContent>
          </Card>
        </motion.section>

        {/* Tax-Free Threshold */}
        <motion.section {...fadeUp}>
          <Card className="border-0 shadow-elevated">
            <CardContent className="p-8">
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">Tax-Free Threshold</h2>
              <div className="bg-accent/10 rounded-xl p-6 mb-4">
                <p className="text-accent font-display font-bold text-3xl">Rs. 1,200,000</p>
                <p className="text-sm text-muted-foreground mt-1">Annual tax-free allowance (Rs. 100,000/month)</p>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Every resident individual is entitled to a personal relief of Rs. 1,200,000 per year. This means the first
                Rs. 1,200,000 of your total assessable income is not subject to tax. Only income exceeding this threshold
                is taxable under the progressive tax slab system.
              </p>
            </CardContent>
          </Card>
        </motion.section>

        {/* Tax Slabs */}
        <motion.section {...fadeUp}>
          <Card className="border-0 shadow-elevated">
            <CardContent className="p-8">
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">Tax Slabs (Progressive Rates)</h2>
              <p className="text-muted-foreground mb-6">
                Sri Lanka uses a progressive tax system where income is taxed at increasing rates as it moves through each slab:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 font-display font-semibold text-foreground">Taxable Income Range</th>
                      <th className="text-center py-3 font-display font-semibold text-foreground">Rate</th>
                      <th className="text-right py-3 font-display font-semibold text-foreground">Max Tax per Slab</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxSlabs.map((slab, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-3 text-foreground">{slab.range}</td>
                        <td className="py-3 text-center">
                          <span className="inline-flex px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                            {slab.rate}
                          </span>
                        </td>
                        <td className="py-3 text-right text-muted-foreground">{slab.tax}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* APIT */}
        <motion.section {...fadeUp}>
          <Card className="border-0 shadow-elevated">
            <CardContent className="p-8">
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">APIT (Advanced Personal Income Tax)</h2>
              <p className="text-muted-foreground leading-relaxed">
                APIT is the Pay-As-You-Earn (PAYE) system in Sri Lanka. Employers deduct income tax from employees' monthly
                salaries and remit it directly to the Inland Revenue Department. This ensures tax is collected throughout the
                year rather than as a lump sum.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                The monthly APIT deduction is calculated based on the employee's projected annual income, applying the
                progressive tax rates proportionally. Employees receiving APIT deductions may not need to file a separate
                return if their only income is from employment.
              </p>
            </CardContent>
          </Card>
        </motion.section>

        {/* Example */}
        <motion.section {...fadeUp}>
          <Card className="border-0 shadow-elevated">
            <CardContent className="p-8">
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">Example Calculation</h2>
              <p className="text-muted-foreground mb-6">
                Let's calculate tax for an employee earning Rs. 200,000 per month (Rs. 2,400,000 annually):
              </p>
              <div className="space-y-3 bg-secondary/50 rounded-xl p-6">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Annual Income</span>
                  <span className="font-display font-semibold text-foreground">Rs. 2,400,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Less: Personal Relief</span>
                  <span className="font-display font-semibold text-accent">- Rs. 1,200,000</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Taxable Income</span>
                  <span className="font-display font-bold text-foreground">Rs. 1,200,000</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">First Rs. 500,000 @ 6%</span>
                  <span className="text-foreground">Rs. 30,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Next Rs. 500,000 @ 12%</span>
                  <span className="text-foreground">Rs. 60,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining Rs. 200,000 @ 18%</span>
                  <span className="text-foreground">Rs. 36,000</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between">
                  <span className="font-display font-semibold text-foreground">Total Annual Tax</span>
                  <span className="font-display font-bold text-destructive text-lg">Rs. 126,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Monthly APIT</span>
                  <span className="font-display font-semibold text-primary">Rs. 10,500</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Effective Tax Rate</span>
                  <span className="font-display font-semibold text-primary">5.25%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Charts */}
        <EffectiveRateChart />
        <TaxBreakdownPie />

        {/* CTA */}
        <motion.div className="text-center pt-8" {...fadeUp}>
          <h3 className="text-2xl font-display font-bold text-foreground mb-3">Calculate Your Own Tax</h3>
          <p className="text-muted-foreground mb-6">Use our free calculator to get your personalized tax breakdown.</p>
          <Button asChild size="lg" className="gradient-primary border-0 text-primary-foreground px-8 h-12">
            <Link to="/register">Get Started Free <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
