import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { SEO } from '@/components/SEO';

export default function ContactPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: 'Message sent!', description: 'We\'ll get back to you within 24 hours.' });
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <div>
      <SEO
        title="Contact"
        description="Get in touch with TaxLK. Questions about Sri Lankan income tax calculations? Our support team is here to help."
        path="/contact"
      />
      <section className="relative py-16 lg:py-24">
        <div className="absolute inset-0 gradient-hero opacity-[0.04]" />
        <div className="relative max-w-7xl mx-auto px-4 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground">
              Get in Touch
            </h1>
            <p className="text-lg text-muted-foreground mt-4 max-w-xl mx-auto">
              Have questions about TaxLK? We're here to help.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-20 lg:pb-28">
        <div className="max-w-5xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Info */}
            <motion.div
              className="lg:col-span-2 space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {[
                { icon: Mail, title: 'Email', text: 'support@taxlk.com' },
                { icon: MessageSquare, title: 'Live Chat', text: 'Available Mon–Fri, 9am–5pm' },
                { icon: MapPin, title: 'Location', text: 'Colombo, Sri Lanka' },
              ].map((item) => (
                <Card key={item.title} className="border-0 shadow-card">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{item.text}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>

            {/* Form */}
            <motion.div
              className="lg:col-span-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-0 shadow-elevated">
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" placeholder="Your name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="you@example.com" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input id="subject" placeholder="How can we help?" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea id="message" placeholder="Tell us more..." rows={5} required />
                    </div>
                    <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground" disabled={loading}>
                      {loading ? 'Sending...' : <><Send className="w-4 h-4 mr-2" /> Send Message</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
