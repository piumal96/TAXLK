import { useState } from 'react';
import {
  Wallet,
  Briefcase,
  Building2,
  TrendingUp,
  Globe,
  Bitcoin,
  Plus,
  GripVertical,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface IncomeCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  status: 'active' | 'coming_soon' | 'beta';
  usageCount: number;
}

const initialCategories: IncomeCategory[] = [
  {
    id: 'employment',
    name: 'Employment Income',
    description: 'Salary, wages, bonuses, and other employment-related income',
    icon: Briefcase,
    enabled: true,
    status: 'active',
    usageCount: 2840,
  },
  {
    id: 'business',
    name: 'Business Income',
    description: 'Income from sole proprietorship, partnerships, and freelance work',
    icon: Building2,
    enabled: true,
    status: 'active',
    usageCount: 1120,
  },
  {
    id: 'investment',
    name: 'Investment Income',
    description: 'Dividends, interest, capital gains, and rental income',
    icon: TrendingUp,
    enabled: true,
    status: 'active',
    usageCount: 680,
  },
  {
    id: 'foreign',
    name: 'Foreign Income',
    description: 'Income earned from overseas employment or foreign sources',
    icon: Globe,
    enabled: false,
    status: 'coming_soon',
    usageCount: 0,
  },
  {
    id: 'crypto',
    name: 'Cryptocurrency Income',
    description: 'Income from cryptocurrency trading, mining, and staking',
    icon: Bitcoin,
    enabled: false,
    status: 'coming_soon',
    usageCount: 0,
  },
];

const statusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">Active</Badge>;
    case 'beta':
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">Beta</Badge>;
    case 'coming_soon':
      return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">Coming Soon</Badge>;
    default:
      return null;
  }
};

export default function IncomeSettingsPage() {
  const [categories, setCategories] = useState(initialCategories);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleToggle = (id: string) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (c.status === 'coming_soon') {
          toast.info(`${c.name} is not yet available`);
          return c;
        }
        const next = !c.enabled;
        toast.success(`${c.name} ${next ? 'enabled' : 'disabled'}`);
        return { ...c, enabled: next };
      })
    );
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    const id = newName.toLowerCase().replace(/\s+/g, '_');
    setCategories((prev) => [
      ...prev,
      {
        id,
        name: newName.trim(),
        description: newDesc.trim() || 'Custom income category',
        icon: Wallet,
        enabled: false,
        status: 'beta' as const,
        usageCount: 0,
      },
    ]);
    toast.success(`"${newName.trim()}" category added`);
    setNewName('');
    setNewDesc('');
    setAddDialogOpen(false);
  };

  const enabledCount = categories.filter((c) => c.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
            Income Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enable or disable income categories available to users
          </p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-2.5 rounded-xl bg-secondary text-primary">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{categories.length}</p>
              <p className="text-xs text-muted-foreground">Total Categories</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{enabledCount}</p>
              <p className="text-xs text-muted-foreground">Enabled</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-2.5 rounded-xl bg-secondary text-muted-foreground">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {categories.filter((c) => c.status === 'coming_soon').length}
              </p>
              <p className="text-xs text-muted-foreground">Coming Soon</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories List */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Income Categories</CardTitle>
          <CardDescription>
            Toggle categories on or off. Disabled categories won't appear in the user calculator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 p-4 pt-0">
          {categories.map((cat, idx) => (
            <div key={cat.id}>
              <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="text-muted-foreground cursor-grab">
                  <GripVertical className="w-4 h-4" />
                </div>
                <div className={`p-2.5 rounded-xl shrink-0 ${cat.enabled ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                  <cat.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm text-foreground">{cat.name}</span>
                    {statusBadge(cat.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </div>
                {cat.status === 'active' && (
                  <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                    {cat.usageCount.toLocaleString()} uses
                  </span>
                )}
                <Switch
                  checked={cat.enabled}
                  onCheckedChange={() => handleToggle(cat.id)}
                  disabled={cat.status === 'coming_soon'}
                />
              </div>
              {idx < categories.length - 1 && <Separator className="ml-14" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Add Category Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Income Category</DialogTitle>
            <DialogDescription>
              Create a new income category. It will be added as a beta category and disabled by default.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                placeholder="e.g. Rental Income"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Brief description of this income type"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!newName.trim()}>Add Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
