import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/features', label: 'Features' },
  { to: '/tax-guide', label: 'Tax Guide' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/contact', label: 'Contact' },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-xl shadow-card">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Calculator className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-foreground">
              TaxLK
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {item.label}
                  {active && (
                    <motion.div
                      layoutId="public-nav-active"
                      className="absolute inset-0 bg-primary/10 rounded-lg -z-10"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild size="sm" className="gradient-primary border-0 text-primary-foreground">
              <Link to="/register">Get Started</Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t bg-card px-4 pb-4 overflow-hidden"
            >
              {navLinks.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      active ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="flex flex-col gap-2 mt-3 pt-3 border-t">
                <Button asChild variant="outline" className="w-full">
                  <Link to="/login" onClick={() => setMobileOpen(false)}>Log in</Link>
                </Button>
                <Button asChild className="w-full gradient-primary border-0 text-primary-foreground">
                  <Link to="/register" onClick={() => setMobileOpen(false)}>Get Started</Link>
                </Button>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <Calculator className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-display font-bold text-foreground">TaxLK</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Simple, accurate, and fast Sri Lankan income tax calculations for everyone.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground mb-3">Product</h4>
              <div className="space-y-2">
                <Link to="/features" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
                <Link to="/pricing" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
                <Link to="/tax-guide" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Tax Guide</Link>
              </div>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground mb-3">Support</h4>
              <div className="space-y-2">
                <Link to="/contact" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
                <Link to="/tax-guide" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</Link>
              </div>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground mb-3">Legal</h4>
              <div className="space-y-2">
                <span className="block text-sm text-muted-foreground">Privacy Policy</span>
                <span className="block text-sm text-muted-foreground">Terms of Service</span>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} TaxLK. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
