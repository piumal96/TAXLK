import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Settings2,
  Users,
  Calculator,
  BarChart3,
  FileText,
  Wallet,
  Shield,
  ScrollText,
  Bell,
  FlaskConical,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ArrowLeft,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/context/AuthContext';

const navSections = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Tax Management',
    items: [
      { to: '/admin/tax-config', label: 'Tax Configuration', icon: Settings2 },
      { to: '/admin/calculations', label: 'Calculations', icon: Calculator },
      { to: '/admin/sandbox', label: 'Sandbox', icon: FlaskConical },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/admin/users', label: 'Users', icon: Users },
      { to: '/admin/income-settings', label: 'Income Settings', icon: Wallet },
      { to: '/admin/roles', label: 'Roles & Permissions', icon: Shield },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/admin/reports', label: 'Reports', icon: FileText },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/settings', label: 'System Settings', icon: Settings2 },
      { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
      { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    ],
  },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'sticky top-0 h-screen flex flex-col border-r bg-card transition-all duration-300 z-40',
          collapsed ? 'w-[4.5rem]' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 h-16 px-4 border-b shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gold flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-navy" />
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-lg tracking-tight text-foreground">
              TaxLK Admin
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.to);
                  const linkContent = (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        active
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      )}
                    >
                      <item.icon className="w-[18px] h-[18px] shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                      {active && (
                        <motion.div
                          layoutId="admin-nav-active"
                          className="absolute inset-0 bg-primary/10 rounded-lg -z-10"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.to} delayDuration={0}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    );
                  }
                  return <div key={item.to}>{linkContent}</div>;
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t p-3 shrink-0 space-y-1">
          {user && !collapsed && (
            <div className="px-3 py-1 mb-1">
              <p className="text-xs text-muted-foreground truncate">{user.name || user.email}</p>
              <p className="text-[10px] text-muted-foreground/60 uppercase">Admin</p>
            </div>
          )}
          <Link
            to="/app"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span>Back to App</span>}
          </Link>
          <button
            onClick={async () => { await signOut(); navigate('/login'); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors w-full"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
