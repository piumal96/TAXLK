import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calculator, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: 'Welcome back!', description: 'Redirecting to your dashboard...' });
      navigate('/app');
    }, 1200);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-foreground/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl" />
        </div>
        <div className="relative text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-8">
            <Calculator className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-display font-bold text-primary-foreground mb-4">
            Welcome to TaxLK
          </h2>
          <p className="text-primary-foreground/70">
            Calculate your Sri Lankan income tax in seconds. Track history, manage multiple income sources, and stay compliant.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Calculator className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">TaxLK</span>
          </div>

          <h1 className="text-2xl font-display font-bold text-foreground mb-1">Log in to your account</h1>
          <p className="text-muted-foreground mb-8">Enter your credentials to continue</p>

          <Card className="border-0 shadow-elevated">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@example.com" className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground h-11" disabled={loading}>
                  {loading ? 'Signing in...' : <>Log In <ArrowRight className="w-4 h-4 ml-1" /></>}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">Create one</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
