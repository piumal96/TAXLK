import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Users, Calculator, TrendingUp, Globe } from 'lucide-react';

function AnimatedNumber({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [display, setDisplay] = useState('0');
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const val = { v: 0 };
          const controls = animate(val.v, target, {
            duration: 2,
            ease: 'easeOut',
            onUpdate: (latest) => {
              if (target >= 1000) {
                setDisplay(Math.round(latest).toLocaleString());
              } else {
                setDisplay(latest.toFixed(1));
              }
            },
          });
          return () => controls.stop();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, hasAnimated]);

  return (
    <span ref={ref} className="font-display font-extrabold text-4xl lg:text-5xl text-foreground">
      {prefix}{display}{suffix}
    </span>
  );
}

const stats = [
  { icon: Users, label: 'Active Users', value: 12500, suffix: '+', prefix: '' },
  { icon: Calculator, label: 'Tax Calculations', value: 85000, suffix: '+', prefix: '' },
  { icon: TrendingUp, label: 'Avg. Savings Found', value: 15.2, suffix: '%', prefix: '' },
  { icon: Globe, label: 'Sri Lankan Districts', value: 25, suffix: '', prefix: '' },
];

export function StatsCounter() {
  return (
    <section className="py-16 lg:py-20 border-y bg-card">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <AnimatedNumber target={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
              <p className="text-sm text-muted-foreground mt-2 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
