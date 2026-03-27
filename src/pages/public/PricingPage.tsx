import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/SEO';

const plans = [
  {
    name: 'Free',
    price: 'Rs. 0',
    period: 'forever',
    description: 'Perfect for individual tax payers',
    features: [
      'Unlimited tax calculations',
      'Multi-income support',
      'APIT breakdown',
      'Calculation history',
      'Tax slab visualization',
    ],
    cta: 'Get Started Free',
    popular: false,
    gradient: false,
  },
  {
    name: 'Pro',
    price: 'Rs. 499',
    period: '/month',
    description: 'For professionals and freelancers',
    features: [
      'Everything in Free',
      'PDF tax reports',
      'Year-over-year comparison',
      'Tax optimization tips',
      'Priority support',
      'Advanced analytics',
    ],
    cta: 'Coming Soon',
    popular: true,
    gradient: true,
  },
  {
    name: 'Business',
    price: 'Rs. 1,999',
    period: '/month',
    description: 'For companies and accountants',
    features: [
      'Everything in Pro',
      'Multi-employee calculations',
      'Bulk APIT processing',
      'API access',
      'Custom integrations',
      'Dedicated account manager',
    ],
    cta: 'Contact Sales',
    popular: false,
    gradient: false,
  },
];

export default function PricingPage() {
  return (
    <div>
      <SEO
        title="Pricing"
        description="TaxLK pricing plans. Start free with unlimited tax calculations, or upgrade for advanced features like PDF reports and analytics."
        path="/pricing"
      />
      <section className="relative py-16 lg:py-24">
        <div className="absolute inset-0 gradient-hero opacity-[0.04]" />
        <div className="relative max-w-7xl mx-auto px-4 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Simple Pricing
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground">
              Plans for Every Need
            </h1>
            <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
              Start free and upgrade as you grow. No hidden fees, no surprises.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`border-0 h-full relative ${
                  plan.popular ? 'shadow-float ring-2 ring-primary' : 'shadow-elevated'
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="gradient-primary text-primary-foreground border-0 px-4">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-4 pt-8">
                    <CardTitle className="font-display text-lg">{plan.name}</CardTitle>
                    <div className="mt-3">
                      <span className="text-4xl font-display font-extrabold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground ml-1">{plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3 mb-8">
                      {plan.features.map((f) => (
                        <div key={f} className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                          <span className="text-sm text-foreground">{f}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      asChild={plan.name === 'Free'}
                      className={`w-full ${plan.gradient ? 'gradient-primary border-0 text-primary-foreground' : ''}`}
                      variant={plan.gradient ? 'default' : 'outline'}
                      disabled={plan.name !== 'Free'}
                    >
                      {plan.name === 'Free' ? (
                        <Link to="/register">{plan.cta} <ArrowRight className="w-4 h-4 ml-1" /></Link>
                      ) : (
                        <span>{plan.cta}</span>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
