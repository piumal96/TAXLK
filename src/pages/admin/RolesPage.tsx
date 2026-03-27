import { useState } from 'react';
import {
  Shield,
  Users,
  Eye,
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockUsers } from '@/data/mockAdminData';
import { toast } from 'sonner';

const modules = [
  'Dashboard',
  'Tax Configuration',
  'Users',
  'Calculations',
  'Analytics',
  'Reports',
  'Income Settings',
  'System Settings',
  'Audit Logs',
  'Notifications',
  'Sandbox',
] as const;

type Permission = 'view' | 'edit' | 'delete';

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  userCount: number;
  permissions: Record<string, Permission[]>;
  isSystem: boolean;
}

const initialRoles: Role[] = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    userCount: 1,
    isSystem: true,
    permissions: Object.fromEntries(modules.map((m) => [m, ['view', 'edit', 'delete'] as Permission[]])),
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Manage users, tax config, and view reports',
    color: 'bg-primary/10 text-primary border-primary/20',
    userCount: 1,
    isSystem: true,
    permissions: Object.fromEntries(
      modules.map((m) => [
        m,
        ['System Settings', 'Audit Logs'].includes(m)
          ? ['view'] as Permission[]
          : ['view', 'edit'] as Permission[],
      ])
    ),
  },
  {
    id: 'analyst',
    name: 'Analyst',
    description: 'Read-only access to analytics and reports',
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    userCount: 1,
    isSystem: false,
    permissions: Object.fromEntries(
      modules.map((m) => [
        m,
        ['Dashboard', 'Analytics', 'Reports', 'Calculations'].includes(m)
          ? ['view'] as Permission[]
          : [],
      ])
    ),
  },
];

const permLabels: { key: Permission; label: string; icon: React.ElementType }[] = [
  { key: 'view', label: 'View', icon: Eye },
  { key: 'edit', label: 'Edit', icon: Pencil },
  { key: 'delete', label: 'Delete', icon: Trash2 },
];

export default function RolesPage() {
  const [roles, setRoles] = useState(initialRoles);
  const [selectedRole, setSelectedRole] = useState<string>(roles[0].id);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignRoleId, setAssignRoleId] = useState('');

  const activeRole = roles.find((r) => r.id === selectedRole)!;

  const togglePermission = (module: string, perm: Permission) => {
    if (activeRole.isSystem && activeRole.id === 'super_admin') {
      toast.error('Super Admin permissions cannot be modified');
      return;
    }
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== selectedRole) return r;
        const current = r.permissions[module] || [];
        const next = current.includes(perm)
          ? current.filter((p) => p !== perm)
          : [...current, perm];
        return { ...r, permissions: { ...r.permissions, [module]: next } };
      })
    );
  };

  const handleAssign = () => {
    if (!assignUserId || !assignRoleId) return;
    const user = mockUsers.find((u) => u.id === assignUserId);
    const role = roles.find((r) => r.id === assignRoleId);
    if (user && role) {
      toast.success(`${user.name} assigned to ${role.name}`);
    }
    setAssignDialogOpen(false);
    setAssignUserId('');
    setAssignRoleId('');
  };

  const handleSave = () => {
    toast.success('Role permissions saved successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
            Roles & Permissions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage roles and control module-level access for administrators
          </p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => setAssignDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          Assign Role
        </Button>
      </div>

      <Tabs value={selectedRole} onValueChange={setSelectedRole}>
        {/* Role Tabs */}
        <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-transparent p-0">
          {roles.map((role) => (
            <TabsTrigger
              key={role.id}
              value={role.id}
              className="data-[state=active]:bg-secondary gap-2 border data-[state=active]:border-primary/30"
            >
              <Shield className="w-3.5 h-3.5" />
              {role.name}
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                {role.userCount}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {roles.map((role) => (
          <TabsContent key={role.id} value={role.id} className="mt-5 space-y-5">
            {/* Role Info */}
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl shrink-0 ${role.color}`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{role.name}</h3>
                      {role.isSystem && (
                        <Badge variant="outline" className="text-[10px]">System Role</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-foreground">{role.userCount}</p>
                    <p className="text-xs text-muted-foreground">users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Permissions Matrix */}
            <Card className="border-border/50">
              <CardHeader className="pb-0">
                <CardTitle className="text-base">Module Permissions</CardTitle>
                <CardDescription>
                  {role.id === 'super_admin'
                    ? 'Super Admin has full access to all modules (non-editable)'
                    : 'Toggle permissions for each module'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 mt-4">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[40%]">Module</TableHead>
                      {permLabels.map((p) => (
                        <TableHead key={p.key} className="text-center w-[20%]">
                          <div className="flex items-center justify-center gap-1.5">
                            <p.icon className="w-3.5 h-3.5" />
                            {p.label}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modules.map((mod) => {
                      const perms = role.permissions[mod] || [];
                      return (
                        <TableRow key={mod}>
                          <TableCell className="font-medium text-sm text-foreground">
                            {mod}
                          </TableCell>
                          {permLabels.map((p) => (
                            <TableCell key={p.key} className="text-center">
                              <div className="flex justify-center">
                                <Checkbox
                                  checked={perms.includes(p.key)}
                                  onCheckedChange={() => togglePermission(mod, p.key)}
                                  disabled={role.id === 'super_admin'}
                                />
                              </div>
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Save */}
            {role.id !== 'super_admin' && (
              <div className="flex justify-end">
                <Button className="gap-2" onClick={handleSave}>
                  <Check className="w-4 h-4" />
                  Save Permissions
                </Button>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Users with Roles */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Users & Assigned Roles</CardTitle>
          <CardDescription>Quick overview of role assignments</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((user) => {
                const role = roles.find((r) => r.id === user.role || r.name.toLowerCase() === user.role);
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                          {user.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <span className="text-sm font-medium text-foreground">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs capitalize ${role?.color ?? ''}`}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize ${user.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-border/50 border-dashed">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-secondary text-muted-foreground">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Role-Based Access</p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-0.5 list-disc list-inside">
                <li>Super Admin permissions are locked and cannot be modified</li>
                <li>System roles cannot be deleted but their permissions can be adjusted</li>
                <li>Permission changes take effect immediately on save</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assign Role Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
            <DialogDescription>Select a user and assign them a role</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>User</Label>
              <Select value={assignUserId} onValueChange={setAssignUserId}>
                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>
                  {mockUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={assignRoleId} onValueChange={setAssignRoleId}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!assignUserId || !assignRoleId}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
