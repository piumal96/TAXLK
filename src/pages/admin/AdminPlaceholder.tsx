import { useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

const titles: Record<string, string> = {
  '/admin/users': 'User Management',
  '/admin/calculations': 'Tax Calculations',
  '/admin/analytics': 'Analytics',
  '/admin/reports': 'Reports & Export',
  '/admin/income-settings': 'Income Settings',
  '/admin/settings': 'System Settings',
  '/admin/roles': 'Roles & Permissions',
  '/admin/audit-logs': 'Audit Logs',
  '/admin/notifications': 'Notifications',
  '/admin/sandbox': 'Sandbox / Testing',
};

export default function AdminPlaceholder() {
  const location = useLocation();
  const title = titles[location.pathname] || 'Module';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground mt-1">This module will be built in a future phase</p>
      </div>
      <Card className="shadow-card">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Construction className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            This module is part of the admin panel roadmap and will be implemented in the next phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
