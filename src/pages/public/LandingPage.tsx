import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calculator,
  Wallet,
  BarChart3,
  Clock,
  Shield,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Zap,
  PieChart,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QuickCalculator } from '@/components/QuickCalculator';
import { SEO } from '@/components/SEO';
import { StatsCounter } from '@/components/public/StatsCounter';
import { TaxSlabChart } from '@/components/public/TaxSlabChart';
import { Testimonials } from '@/components/public/Testimonials';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const features = [
  {
    icon: Wallet,
    title: 'Multi-Income Support',
    description: 'Handle employment, business, and investment income sources with ease.',
  },
  {
    icon: Calculator,
    title: 'APIT Calculation',
    description: 'Automatic Advanced Personal Income Tax calculations based on latest tax tables.',
  },
  {
    icon: BarChart3,
    title: 'Tax Breakdown',
    description: 'Visual slab-by-slab breakdown showing exactly where your money goes.',
  },
  {
    icon: PieChart,
    title: 'Income Analysis',
    description: 'Charts and insights to understand your income distribution and tax efficiency.',
  },
  {
    icon: FileText,
    title: 'Calculation History',
    description: 'Save and compare tax calculations over time to track changes.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your financial data stays private and protected at all times.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Add Your Income',
    description: 'Enter employment salary, business revenue, or investment returns.',
    icon: Wallet,
  },
  {
    step: '02',
    title: 'Calculate Tax',
    description: 'Get instant APIT calculations based on current Sri Lankan tax slabs.',
    icon: Calculator,
  },
  {
    step: '03',
    title: 'View Results',
    description: 'See detailed breakdowns, effective rates, and monthly deductions.',
    icon: BarChart3,
  },
];

const benefits = [
  { icon: Clock, text: 'Save hours on manual tax calculations' },
  { icon: CheckCircle2, text: 'Accurate results based on latest tax tables' },
  { icon: TrendingUp, text: 'Track your tax history over time' },
  { icon: Zap, text: 'Instant results with zero waiting' },
];

export default function LandingPage() {
  return (
    <div>
      <SEO
        title="TaxLK — Sri Lanka Income Tax Calculator"
        description="Free Sri Lankan income tax calculator. Calculate APIT, view tax slab breakdowns, and manage multiple income sources instantly."
        path="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'TaxLK',
          url: 'https://taxlk.com',
          description: 'Free Sri Lankan income tax calculator with APIT breakdowns and multi-income support.',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'LKR' },
        }}
      />
      {/* Hero */}
      <section className="relative overflow-hidden bg-background pt-20 pb-16 lg:pt-32 lg:pb-24">
        <div className="absolute inset-0 gradient-hero opacity-[0.03]" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-teal/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-navy/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4" />
        
        <div className="relative max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center border-b border-border/50 pb-20">
            {/* Left Content */}
            <div className="max-w-2xl text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal/10 text-teal-700 dark:text-teal-400 text-sm font-medium mb-6 ring-1 ring-teal/20">
                  <Zap className="w-3.5 h-3.5" /> Free to use &middot; Updated for 2024/25
                </span>
              </motion.div>
              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-foreground tracking-tight leading-tight lg:leading-[1.1]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Sri Lanka Income <br className="hidden lg:block"/>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-navy via-navy-400 to-teal">
                  Tax Calculator
                </span>
              </motion.h1>
              <motion.p
                className="text-lg md:text-xl text-muted-foreground mt-6 max-w-xl mx-auto lg:mx-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Simple, accurate, and fast tax calculations. Handle multiple income sources, get APIT breakdowns, and track your tax history &#8212; securely.
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mt-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Button asChild size="lg" className="bg-navy hover:bg-navy-600 border-0 text-white px-8 h-14 text-base shadow-float rounded-xl w-full sm:w-auto">
                  <Link to="/register">
                    Get Started Free <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="px-8 h-14 text-base rounded-xl w-full sm:w-auto bg-background/50 backdrop-blur-sm border-2">
                  <Link to="/app/calculator">
                    Calculate Now <Calculator className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </motion.div>
              
              <motion.div 
                className="mt-10 flex items-center justify-center lg:justify-start gap-4 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div className="flex -space-x-2">
                  {[21, 32, 45, 61].map((imgId) => (
                    <div key={imgId} className="w-8 h-8 rounded-full border-2 border-background overflow-hidden bg-secondary flex-shrink-0">
                      <img src={`https://i.pravatar.cc/150?img=${imgId}`} alt="User avatar" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div>Join thousands of Sri Lankans</div>
              </motion.div>
            </div>

            {/* Right Image Container */}
            <motion.div
              className="relative w-full aspect-[4/3] lg:aspect-square flex justify-center items-center mt-10 lg:mt-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-teal/20 via-transparent to-navy/10 rounded-[3rem] blur-3xl transform rotate-3 scale-105" />
              <div className="relative w-full h-[85%] lg:h-full max-w-[90%] lg:max-w-none rounded-[2.5rem] overflow-hidden shadow-float border border-white/20 bg-card/50 backdrop-blur-xl ml-auto">
                 <img 
                    src="/assets/srilankan-professionals-hero.png" 
                    alt="Sri Lankan professionals using TaxLK" 
                    className="w-full h-full object-cover rounded-[2.5rem]"
                 />
                 {/* Overlay Gradient for depth */}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent blend-multiply" />
              </div>

              {/* Floating Profile Card */}
              <motion.div 
                className="absolute bottom-24 -left-4 lg:-left-12 bg-card rounded-2xl p-3 shadow-float border border-border/50 backdrop-blur-md flex items-center gap-4 w-[280px]"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border border-border/50 flex flex-shrink-0 bg-secondary">
                  <img src="https://i.pravatar.cc/150?img=47" alt="User avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-foreground font-display">Ashan Silva</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Financial Analyst</div>
                </div>
                <div className="bg-navy text-white text-[10px] font-medium px-3 py-1.5 rounded-full uppercase tracking-wider">
                  Active
                </div>
              </motion.div>

              {/* Floating Analytics Card */}
              <motion.div 
                className="absolute bottom-4 left-4 lg:left-0 bg-card rounded-2xl p-4 shadow-elevated border border-border/50 backdrop-blur-md w-[240px]"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <div className="text-xs font-bold text-foreground font-display mb-1 flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-navy" /> Finance Analytics
                </div>
                <div className="text-[10px] text-muted-foreground leading-tight">
                  Calculate and track personal income tax with accuracy and ease.
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-28 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <motion.div className="text-center mb-14" {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Everything You Need
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Comprehensive tools to manage your Sri Lankan income tax calculations with confidence.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="border-0 shadow-elevated bg-card h-full hover:shadow-float transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-11 h-11 rounded-xl bg-navy/10 flex items-center justify-center mb-4">
                      <f.icon className="w-5 h-5 text-navy" />
                    </div>
                    <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <motion.div className="text-center mb-14" {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              How It Works
            </h2>
            <p className="text-muted-foreground mt-3">Three simple steps to calculate your tax.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                className="relative text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-navy flex items-center justify-center mx-auto mb-5 shadow-float">
                  <s.icon className="w-7 h-7 text-gold" />
                </div>
                <span className="text-xs font-bold text-navy uppercase tracking-widest">
                  Step {s.step}
                </span>
                <h3 className="font-display font-bold text-foreground text-lg mt-2 mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 -right-4 w-8">
                    <ArrowRight className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Calculator Widget */}
      <QuickCalculator />

      {/* Tax Slab Chart */}
      <TaxSlabChart />

      {/* Testimonials */}
      <Testimonials />

      {/* Benefits */}
      <section className="py-20 lg:py-28 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeUp}>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                Why Choose TaxLK?
              </h2>
              <p className="text-muted-foreground mt-4 mb-8">
                Built specifically for Sri Lankan tax payers, by people who understand the local tax system inside and out.
              </p>
              <div className="space-y-4">
                {benefits.map((b) => (
                  <div key={b.text} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center flex-shrink-0">
                      <b.icon className="w-4 h-4 text-teal" />
                    </div>
                    <span className="text-foreground font-medium">{b.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-0 shadow-float bg-card">
                <CardContent className="p-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Annual Income</span>
                      <span className="font-display font-bold text-foreground">Rs. 3,600,000</span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Tax-Free Threshold</span>
                      <span className="font-display font-semibold text-teal">Rs. 1,200,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Taxable Income</span>
                      <span className="font-display font-semibold text-foreground">Rs. 2,400,000</span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Tax</span>
                      <span className="font-display font-bold text-destructive text-lg">Rs. 270,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Effective Rate</span>
                      <span className="font-display font-semibold text-navy">7.5%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden mt-2">
                      <motion.div
                        className="h-full gradient-primary rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: '75%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.3 }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 text-center">
          <motion.div {...fadeUp}>
            <div className="bg-navy rounded-2xl p-10 lg:p-16 shadow-float relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
              <div className="relative">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
                  Ready to Calculate Your Tax?
                </h2>
                <p className="text-white/75 mt-4 text-lg max-w-xl mx-auto">
                  Create a free account and get instant, accurate tax calculations tailored for Sri Lanka.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                  <Button asChild size="lg" className="bg-gold hover:bg-gold-500 text-navy-800 font-semibold px-8 h-12 text-base shadow-gold">
                    <Link to="/register">Create Free Account</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-2 border-white/30 text-white bg-white/10 hover:bg-white/20 px-8 h-12 text-base font-semibold">
                    <Link to="/features">Learn More</Link>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
