import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Wallet,
  Calculator,
  History,
  User,
  Menu,
  X,
  Shield,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/income', label: 'Income', icon: Wallet },
  { to: '/app/calculator', label: 'Calculator', icon: Calculator },
  { to: '/app/history', label: 'History', icon: History },
  { to: '/app/profile', label: 'Profile', icon: User },
  { to: '/admin', label: 'Admin', icon: Shield },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-xl shadow-card">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
          <Link to="/app" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Calculator className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-foreground">
              TaxLK
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.to || (item.to !== '/app' && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  {active && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 bg-primary/10 rounded-lg -z-10"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link to="/"><LogOut className="w-4 h-4 mr-1" /> Logout</Link>
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

        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t bg-card px-4 pb-4"
          >
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            <div className="border-t mt-2 pt-2">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Link>
            </div>
          </motion.nav>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
