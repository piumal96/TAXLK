import { useState } from 'react';
import {
  Bell,
  Plus,
  Send,
  Megaphone,
  AlertTriangle,
  Info,
  CheckCircle2,
  Trash2,
  Eye,
  Clock,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
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
import { toast } from 'sonner';

type NotificationType = 'info' | 'warning' | 'success' | 'announcement';
type NotificationStatus = 'active' | 'scheduled' | 'expired' | 'draft';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  showBanner: boolean;
  createdAt: string;
  expiresAt: string | null;
  createdBy: string;
}

const initialNotifications: Notification[] = [
  {
    id: 'n1',
    title: 'New Tax Circular Effective April 2026',
    message: 'The Inland Revenue Department has issued updated tax slabs for the 2026/2027 tax year. Please recalculate your tax using the latest configuration.',
    type: 'announcement',
    status: 'active',
    showBanner: true,
    createdAt: '2026-03-20',
    expiresAt: '2026-04-30',
    createdBy: 'Super Admin',
  },
  {
    id: 'n2',
    title: 'System Maintenance Scheduled',
    message: 'The system will undergo scheduled maintenance on March 28, 2026 from 2:00 AM to 4:00 AM IST. Services may be temporarily unavailable.',
    type: 'warning',
    status: 'scheduled',
    showBanner: false,
    createdAt: '2026-03-25',
    expiresAt: '2026-03-28',
    createdBy: 'Ruwan Silva',
  },
  {
    id: 'n3',
    title: 'APIT Calculator Now Available',
    message: 'You can now calculate monthly APIT deductions directly from the tax calculator. Try the new feature today!',
    type: 'success',
    status: 'expired',
    showBanner: false,
    createdAt: '2026-01-15',
    expiresAt: '2026-02-15',
    createdBy: 'Super Admin',
  },
  {
    id: 'n4',
    title: 'Data Export Improvements',
    message: 'We have improved the data export functionality. You can now export reports in Excel and PDF formats.',
    type: 'info',
    status: 'active',
    showBanner: false,
    createdAt: '2026-03-10',
    expiresAt: null,
    createdBy: 'Ruwan Silva',
  },
];

const typeConfig: Record<NotificationType, { icon: React.ElementType; color: string; label: string }> = {
  info: { icon: Info, color: 'bg-primary/10 text-primary border-primary/20', label: 'Info' },
  warning: { icon: AlertTriangle, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Warning' },
  success: { icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Success' },
  announcement: { icon: Megaphone, color: 'bg-violet-500/10 text-violet-600 border-violet-500/20', label: 'Announcement' },
};

const statusBadge = (status: NotificationStatus) => {
  const map: Record<NotificationStatus, string> = {
    active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    scheduled: 'bg-primary/10 text-primary border-primary/20',
    expired: 'bg-secondary text-muted-foreground',
    draft: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  };
  return map[status];
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [createOpen, setCreateOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formType, setFormType] = useState<NotificationType>('info');
  const [formBanner, setFormBanner] = useState(false);
  const [formExpiry, setFormExpiry] = useState('');

  const resetForm = () => {
    setFormTitle('');
    setFormMessage('');
    setFormType('info');
    setFormBanner(false);
    setFormExpiry('');
  };

  const handleCreate = () => {
    if (!formTitle.trim() || !formMessage.trim()) return;
    const newNotif: Notification = {
      id: `n${Date.now()}`,
      title: formTitle.trim(),
      message: formMessage.trim(),
      type: formType,
      status: 'active',
      showBanner: formBanner,
      createdAt: new Date().toISOString().split('T')[0],
      expiresAt: formExpiry || null,
      createdBy: 'Admin',
    };
    setNotifications((prev) => [newNotif, ...prev]);
    toast.success('Notification published');
    resetForm();
    setCreateOpen(false);
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success('Notification deleted');
  };

  const previewNotif = notifications.find((n) => n.id === previewId);
  const activeCount = notifications.filter((n) => n.status === 'active').length;
  const bannerCount = notifications.filter((n) => n.showBanner && n.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Send system-wide announcements and banner alerts to users
          </p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          New Notification
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total', value: notifications.length, icon: Bell, color: 'text-primary' },
          { label: 'Active', value: activeCount, icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Banner Alerts', value: bannerCount, icon: Megaphone, color: 'text-violet-500' },
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

      {/* Banner Preview */}
      {notifications.some((n) => n.showBanner && n.status === 'active') && (
        <Card className="border-violet-500/30 bg-violet-500/5">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Active Banner Preview
            </p>
            {notifications
              .filter((n) => n.showBanner && n.status === 'active')
              .map((n) => {
                const cfg = typeConfig[n.type];
                return (
                  <div key={n.id} className="flex items-center gap-3 p-3 rounded-lg bg-background border">
                    <cfg.icon className="w-4 h-4 text-violet-500 shrink-0" />
                    <p className="text-sm text-foreground flex-1">{n.title}</p>
                    <Badge variant="outline" className="text-[10px]">Banner</Badge>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((notif) => {
          const cfg = typeConfig[notif.type];
          return (
            <Card key={notif.id} className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl shrink-0 ${cfg.color}`}>
                    <cfg.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-sm text-foreground">{notif.title}</h3>
                      <Badge variant="outline" className={`text-[10px] capitalize ${statusBadge(notif.status)}`}>
                        {notif.status}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>
                        {cfg.label}
                      </Badge>
                      {notif.showBanner && (
                        <Badge variant="outline" className="text-[10px] bg-violet-500/10 text-violet-600 border-violet-500/20">
                          Banner
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {notif.createdAt}
                      </span>
                      <span>by {notif.createdBy}</span>
                      {notif.expiresAt && <span>Expires: {notif.expiresAt}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewId(notif.id)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(notif.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Notification</DialogTitle>
            <DialogDescription>
              Send a system-wide notification or banner alert to all users
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input placeholder="e.g. New tax circular effective April 2026" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea placeholder="Write your notification message..." rows={3} value={formMessage} onChange={(e) => setFormMessage(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as NotificationType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input type="date" value={formExpiry} onChange={(e) => setFormExpiry(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div>
                <p className="text-sm font-medium text-foreground">Show as Banner</p>
                <p className="text-xs text-muted-foreground">Display prominently at the top of the user dashboard</p>
              </div>
              <Switch checked={formBanner} onCheckedChange={setFormBanner} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setCreateOpen(false); }}>Cancel</Button>
            <Button className="gap-2" onClick={handleCreate} disabled={!formTitle.trim() || !formMessage.trim()}>
              <Send className="w-4 h-4" />
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewId} onOpenChange={(open) => !open && setPreviewId(null)}>
        <DialogContent>
          {previewNotif && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  {(() => { const C = typeConfig[previewNotif.type].icon; return <C className="w-5 h-5 text-primary" />; })()}
                  <DialogTitle>{previewNotif.title}</DialogTitle>
                </div>
                <DialogDescription>
                  Preview of how this notification appears to users
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-foreground leading-relaxed">{previewNotif.message}</p>
                <Separator className="my-4" />
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>Type: <strong className="text-foreground capitalize">{previewNotif.type}</strong></span>
                  <span>Created: <strong className="text-foreground">{previewNotif.createdAt}</strong></span>
                  {previewNotif.expiresAt && <span>Expires: <strong className="text-foreground">{previewNotif.expiresAt}</strong></span>}
                  <span>Banner: <strong className="text-foreground">{previewNotif.showBanner ? 'Yes' : 'No'}</strong></span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
