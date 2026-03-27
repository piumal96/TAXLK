import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save, Check, Archive, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockTaxVersions, type TaxVersion, type TaxSlab } from '@/data/mockAdminData';
import { formatCurrency } from '@/lib/taxCalculator';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function TaxConfigPage() {
  const { toast } = useToast();
  const [versions, setVersions] = useState<TaxVersion[]>(mockTaxVersions);
  const [selectedVersionId, setSelectedVersionId] = useState<string>(versions[0].id);

  const selectedVersion = versions.find((v) => v.id === selectedVersionId)!;
  const [editSlabs, setEditSlabs] = useState<TaxSlab[]>(selectedVersion.slabs);
  const [editThreshold, setEditThreshold] = useState(selectedVersion.taxFreeThreshold);

  const handleVersionChange = (id: string) => {
    setSelectedVersionId(id);
    const ver = versions.find((v) => v.id === id)!;
    setEditSlabs([...ver.slabs]);
    setEditThreshold(ver.taxFreeThreshold);
  };

  const updateSlab = (index: number, field: keyof TaxSlab, value: string | number | null) => {
    setEditSlabs((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const addSlab = () => {
    const maxOrder = editSlabs.length > 0 ? Math.max(...editSlabs.map((s) => s.order)) : 0;
    // Insert before the last "Remaining" slab if it exists
    const lastSlab = editSlabs[editSlabs.length - 1];
    if (lastSlab && lastSlab.limit === null) {
      const newSlab: TaxSlab = {
        id: `s${Date.now()}`,
        order: maxOrder,
        limit: 500_000,
        rate: 0.24,
        label: `Next Rs. 500,000`,
      };
      const updated = [...editSlabs];
      updated.splice(editSlabs.length - 1, 0, newSlab);
      // Reorder
      setEditSlabs(updated.map((s, i) => ({ ...s, order: i + 1 })));
    } else {
      setEditSlabs([
        ...editSlabs,
        {
          id: `s${Date.now()}`,
          order: maxOrder + 1,
          limit: 500_000,
          rate: 0.06,
          label: 'New Slab',
        },
      ]);
    }
  };

  const removeSlab = (index: number) => {
    if (editSlabs.length <= 1) return;
    setEditSlabs((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  };

  const handleSave = () => {
    setVersions((prev) =>
      prev.map((v) =>
        v.id === selectedVersionId ? { ...v, slabs: editSlabs, taxFreeThreshold: editThreshold } : v
      )
    );
    toast({ title: 'Configuration saved', description: `Version ${selectedVersion.version} updated as draft.` });
  };

  const handleActivate = () => {
    setVersions((prev) =>
      prev.map((v) => ({
        ...v,
        isActive: v.id === selectedVersionId,
        status: v.id === selectedVersionId ? 'active' as const : v.status === 'active' ? 'archived' as const : v.status,
      }))
    );
    toast({ title: 'Version activated', description: `Version ${selectedVersion.version} is now the active tax configuration.` });
  };

  const handleDuplicate = () => {
    const newVer: TaxVersion = {
      ...selectedVersion,
      id: `v${Date.now()}`,
      version: `${parseFloat(selectedVersion.version) + 0.1}`.slice(0, 3),
      name: `${selectedVersion.name} (Copy)`,
      isActive: false,
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0],
      slabs: editSlabs.map((s) => ({ ...s, id: `s${Date.now()}${s.order}` })),
    };
    setVersions((prev) => [newVer, ...prev]);
    setSelectedVersionId(newVer.id);
    toast({ title: 'Version duplicated', description: `New draft version ${newVer.version} created.` });
  };

  const statusBadge = (status: TaxVersion['status']) => {
    const styles = {
      active: 'bg-accent/15 text-accent border-accent/30',
      draft: 'bg-warning/15 text-warning border-warning/30',
      archived: 'bg-muted text-muted-foreground border-border',
    };
    return <Badge variant="outline" className={styles[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Tax Configuration</h1>
          <p className="text-muted-foreground mt-1">Manage progressive tax slabs and thresholds</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedVersionId} onValueChange={handleVersionChange}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {versions.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  v{v.version} — {v.name} {v.isActive && '✓'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {statusBadge(selectedVersion.status)}
        </div>
      </div>

      {/* Version Info */}
      <Card className="shadow-card">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Version</p>
              <p className="font-semibold">{selectedVersion.version}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-semibold">{selectedVersion.createdAt}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created By</p>
              <p className="font-semibold">{selectedVersion.createdBy}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <div className="mt-0.5">{statusBadge(selectedVersion.status)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax-Free Threshold */}
      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Tax-Free Threshold</CardTitle>
          <CardDescription>Annual income below this amount is not taxed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 max-w-sm">
            <span className="text-sm font-medium text-muted-foreground">Rs.</span>
            <Input
              type="number"
              value={editThreshold}
              onChange={(e) => setEditThreshold(Number(e.target.value))}
              className="font-mono"
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">per year</span>
          </div>
        </CardContent>
      </Card>

      {/* Tax Slabs Editor */}
      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Progressive Tax Slabs</CardTitle>
              <CardDescription>Define income brackets and their tax rates</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={addSlab}>
              <Plus className="w-4 h-4 mr-1" /> Add Slab
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead className="w-44">Limit (Rs.)</TableHead>
                  <TableHead className="w-32">Rate (%)</TableHead>
                  <TableHead className="w-28">Tax Amount</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editSlabs.map((slab, i) => {
                  const limit = slab.limit ?? 0;
                  const taxAmount = limit ? limit * slab.rate : 0;
                  return (
                    <motion.tr
                      key={slab.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b transition-colors hover:bg-muted/30"
                    >
                      <TableCell className="font-mono text-muted-foreground">{slab.order}</TableCell>
                      <TableCell>
                        <Input
                          value={slab.label}
                          onChange={(e) => updateSlab(i, 'label', e.target.value)}
                          className="h-9"
                        />
                      </TableCell>
                      <TableCell>
                        {slab.limit === null ? (
                          <span className="text-sm text-muted-foreground italic">∞ (Remaining)</span>
                        ) : (
                          <Input
                            type="number"
                            value={slab.limit}
                            onChange={(e) => updateSlab(i, 'limit', Number(e.target.value))}
                            className="h-9 font-mono"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={(slab.rate * 100).toFixed(0)}
                          onChange={(e) => updateSlab(i, 'rate', Number(e.target.value) / 100)}
                          className="h-9 font-mono"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {slab.limit !== null ? formatCurrency(taxAmount) : '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeSlab(i)}
                          disabled={editSlabs.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="mt-4 p-4 rounded-lg bg-muted/50 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total defined slabs</span>
              <span className="font-semibold">{editSlabs.length}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">Max defined rate</span>
              <span className="font-semibold">{(Math.max(...editSlabs.map((s) => s.rate)) * 100).toFixed(0)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSave} className="gap-2">
          <Save className="w-4 h-4" /> Save Draft
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="gap-2 border-accent text-accent hover:bg-accent/10">
              <Check className="w-4 h-4" /> Activate Version
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Activate Tax Configuration v{selectedVersion.version}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will make version {selectedVersion.version} the active tax configuration.
                All new calculations will use this version. Existing records will not be affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleActivate}>Confirm Activation</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button variant="outline" onClick={handleDuplicate} className="gap-2">
          <Copy className="w-4 h-4" /> Duplicate Version
        </Button>
      </div>
    </div>
  );
}
