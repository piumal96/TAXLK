import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  UserPlus,
  MoreHorizontal,
  Mail,
  Calendar,
  Calculator,
  Clock,
  Shield,
  Ban,
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCheck,
  UserX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockUsers, mockCalculations, type AdminUser } from '@/data/mockAdminData';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 6;

const roleBadgeVariant = (role: string) => {
  switch (role) {
    case 'admin': return 'default';
    case 'analyst': return 'secondary';
    default: return 'outline';
  }
};

const statusColor = (status: string) =>
  status === 'active'
    ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
    : 'bg-destructive/15 text-destructive border-destructive/30';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return mockUsers.filter((u) => {
      const matchSearch =
        !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = useMemo(() => ({
    total: mockUsers.length,
    active: mockUsers.filter((u) => u.status === 'active').length,
    disabled: mockUsers.filter((u) => u.status === 'disabled').length,
  }), []);

  const userCalculations = selectedUser
    ? mockCalculations.filter((c) => c.userId === selectedUser.id)
    : [];

  const handleToggleStatus = (user: AdminUser) => {
    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    toast.success(`${user.name} has been ${newStatus === 'active' ? 'enabled' : 'disabled'}`);
  };

  const handleDelete = (user: AdminUser) => {
    toast.success(`${user.name} has been deleted`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
            User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage registered users, roles, and access
          </p>
        </div>
        <Button className="gap-2 shrink-0">
          <UserPlus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Users', value: stats.total, icon: Users, color: 'text-primary' },
          { label: 'Active', value: stats.active, icon: UserCheck, color: 'text-emerald-500' },
          { label: 'Disabled', value: stats.disabled, icon: UserX, color: 'text-destructive' },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`p-2.5 rounded-xl bg-secondary ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="analyst">Analyst</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/50">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Calculations</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No users found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((user) => (
                <TableRow key={user.id} className="group cursor-pointer" onClick={() => setSelectedUser(user)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                        {user.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariant(user.role)} className="capitalize text-xs">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs capitalize ${statusColor(user.status)}`}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground">
                    {user.totalCalculations}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{user.lastActive}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                          <Eye className="w-4 h-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                          <Ban className="w-4 h-4 mr-2" />
                          {user.status === 'active' ? 'Disable' : 'Enable'} User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(user)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* User Detail Sheet */}
      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedUser && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                    {selectedUser.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <SheetTitle className="text-xl">{selectedUser.name}</SheetTitle>
                    <SheetDescription>{selectedUser.email}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Shield, label: 'Role', value: selectedUser.role },
                    { icon: Clock, label: 'Status', value: selectedUser.status },
                    { icon: Calendar, label: 'Joined', value: selectedUser.createdAt },
                    { icon: Calculator, label: 'Calculations', value: selectedUser.totalCalculations },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-lg bg-secondary/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <item.icon className="w-3.5 h-3.5" />
                        {item.label}
                      </div>
                      <p className="text-sm font-semibold text-foreground capitalize">{String(item.value)}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Tabs */}
                <Tabs defaultValue="calculations">
                  <TabsList className="w-full">
                    <TabsTrigger value="calculations" className="flex-1">Calculations</TabsTrigger>
                    <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
                  </TabsList>

                  <TabsContent value="calculations" className="mt-4 space-y-3">
                    {userCalculations.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No calculations found for this user.
                      </p>
                    ) : (
                      userCalculations.map((calc) => (
                        <div key={calc.id} className="p-4 rounded-lg border bg-card space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{calc.date}</span>
                            <Badge variant="outline" className="text-xs">v{calc.taxVersion}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs">Income</p>
                              <p className="font-semibold text-foreground">
                                Rs. {calc.totalIncome.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Tax</p>
                              <p className="font-semibold text-foreground">
                                Rs. {calc.totalTax.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Taxable</p>
                              <p className="text-foreground">Rs. {calc.taxableIncome.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Effective Rate</p>
                              <p className="text-foreground">{calc.effectiveRate}%</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="activity" className="mt-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div>
                          <p className="text-sm text-foreground">Last login</p>
                          <p className="text-xs text-muted-foreground">{selectedUser.lastActive}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                        <div>
                          <p className="text-sm text-foreground">Account created</p>
                          <p className="text-xs text-muted-foreground">{selectedUser.createdAt}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <Separator />

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button variant="outline" className="gap-2 justify-start" onClick={() => handleToggleStatus(selectedUser)}>
                    <Ban className="w-4 h-4" />
                    {selectedUser.status === 'active' ? 'Disable' : 'Enable'} User
                  </Button>
                  <Button variant="outline" className="gap-2 justify-start text-destructive hover:text-destructive" onClick={() => handleDelete(selectedUser)}>
                    <Trash2 className="w-4 h-4" />
                    Delete User
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
