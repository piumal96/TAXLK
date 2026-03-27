import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wallet,
  Calculator,
  BarChart3,
  PieChart,
  FileText,
  Shield,
  Clock,
  TrendingUp,
  Layers,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SEO } from '@/components/SEO';
import { DashboardPreview } from '@/components/public/DashboardPreview';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const mainFeatures = [
  {
    icon: Wallet,
    title: 'Multi-Income Management',
    description: 'Track employment, business, and investment income sources separately with detailed fields for each type.',
    gradient: 'gradient-primary',
  },
  {
    icon: Calculator,
    title: 'APIT Calculator',
    description: 'Accurate Advanced Personal Income Tax calculations based on the latest Inland Revenue tax tables.',
    gradient: 'gradient-success',
  },
  {
    icon: BarChart3,
    title: 'Visual Tax Breakdown',
    description: 'See exactly how your tax is computed across each slab with intuitive charts and percentage breakdowns.',
    gradient: 'gradient-primary',
  },
];

const additionalFeatures = [
  { icon: PieChart, title: 'Income Analysis', desc: 'Visual income distribution across categories' },
  { icon: FileText, title: 'Calculation History', desc: 'Save, compare, and revisit past calculations' },
  { icon: Shield, title: 'Data Privacy', desc: 'Your financial data stays secure and private' },
  { icon: Clock, title: 'Instant Results', desc: 'Get tax calculations in under a second' },
  { icon: TrendingUp, title: 'Effective Rate Tracking', desc: 'Monitor your effective tax rate over time' },
  { icon: Layers, title: 'Multiple Profiles', desc: 'Calculate for different income scenarios' },
];

export default function FeaturesPage() {
  return (
    <div>
      <SEO
        title="Features"
        description="Explore TaxLK features: multi-income support, APIT calculations, visual tax breakdowns, calculation history, and more."
        path="/features"
      />
      {/* Header */}
      <section className="relative py-16 lg:py-24">
        <div className="absolute inset-0 gradient-hero opacity-[0.04]" />
        <div className="relative max-w-7xl mx-auto px-4 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" /> Powerful Features
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground">
              Built for Sri Lankan Tax Payers
            </h1>
            <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
              Every feature designed to simplify your income tax calculations and help you stay compliant.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-16 lg:py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {mainFeatures.map((f, i) => (
              <motion.div key={f.title} {...fadeUp} transition={{ delay: i * 0.1 }}>
                <Card className="border-0 shadow-float bg-card h-full">
                  <CardContent className="p-8">
                    <div className={`w-14 h-14 rounded-2xl ${f.gradient} flex items-center justify-center mb-6 shadow-elevated`}>
                      <f.icon className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-foreground mb-3">{f.title}</h3>
                    <p className="text-muted-foreground">{f.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <DashboardPreview />

      {/* Additional Features Grid */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <motion.div className="text-center mb-12" {...fadeUp}>
            <h2 className="text-3xl font-display font-bold text-foreground">And Much More</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalFeatures.map((f, i) => (
              <motion.div
                key={f.title}
                className="flex items-start gap-4 p-5 rounded-xl bg-card shadow-card border border-border/50"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-foreground">{f.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-secondary/30">
        <div className="max-w-3xl mx-auto px-4 lg:px-8 text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">
              Start Calculating Today
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of Sri Lankans who trust TaxLK for accurate tax calculations.
            </p>
            <Button asChild size="lg" className="gradient-primary border-0 text-primary-foreground px-8 h-12 text-base">
              <Link to="/register">Get Started Free <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
