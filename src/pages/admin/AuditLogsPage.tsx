import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Calendar,
  ArrowRightLeft,
  ScrollText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { mockAuditLogs, type AuditLog } from '@/data/mockAdminData';

const ITEMS_PER_PAGE = 8;

const moduleColor = (mod: string) => {
  switch (mod) {
    case 'Tax Config': return 'bg-primary/10 text-primary border-primary/20';
    case 'Users': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'Settings': return 'bg-violet-500/10 text-violet-600 border-violet-500/20';
    case 'Reports': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    default: return 'bg-secondary text-muted-foreground';
  }
};

const allModules = [...new Set(mockAuditLogs.map((l) => l.module))];

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return mockAuditLogs.filter((log) => {
      const matchSearch =
        !search ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.user.toLowerCase().includes(search.toLowerCase());
      const matchModule = moduleFilter === 'all' || log.module === moduleFilter;
      return matchSearch && matchModule;
    });
  }, [search, moduleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
          Audit Logs
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track all administrative changes across the system
        </p>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by action or user..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={moduleFilter} onValueChange={(v) => { setModuleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {allModules.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
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
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Changes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No audit logs found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      {log.timestamp}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                        {log.user.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <span className="text-sm font-medium text-foreground">{log.user}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${moduleColor(log.module)}`}>
                      {log.module}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-foreground">{log.action}</span>
                  </TableCell>
                  <TableCell>
                    {log.oldValue && log.newValue ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 rounded bg-destructive/10 text-destructive line-through">
                          {log.oldValue}
                        </span>
                        <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-600">
                          {log.newValue}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <p className="text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button key={p} variant={p === page ? 'default' : 'outline'} size="icon" className="h-8 w-8" onClick={() => setPage(p)}>
                {p}
              </Button>
            ))}
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
