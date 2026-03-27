import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const testimonials = [
  {
    name: 'Kasun Perera',
    role: 'Software Engineer',
    text: 'TaxLK saved me hours of spreadsheet work. The APIT breakdown is exactly what I needed for my monthly salary deductions.',
    rating: 5,
  },
  {
    name: 'Dilini Fernando',
    role: 'Freelance Consultant',
    text: 'Finally a tool that handles multiple income sources properly. Business + employment income calculations are spot on.',
    rating: 5,
  },
  {
    name: 'Ruwan Jayasuriya',
    role: 'Small Business Owner',
    text: 'The visual tax slab breakdown makes it so easy to understand where my money goes. Highly recommended!',
    rating: 5,
  },
];

export function Testimonials() {
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
            Trusted by Thousands
          </h2>
          <p className="text-muted-foreground mt-3">See what Sri Lankan professionals say about TaxLK.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-0 shadow-elevated h-full">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-foreground text-sm leading-relaxed mb-5">"{t.text}"</p>
                  <div>
                    <p className="font-display font-semibold text-foreground text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
