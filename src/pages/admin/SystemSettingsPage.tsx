import { useState } from 'react';
import {
  Settings2,
  DollarSign,
  ToggleRight,
  Calculator,
  Ruler,
  Save,
  RotateCcw,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

const initialFlags: FeatureFlag[] = [
  { id: 'calculator', name: 'Tax Calculator', description: 'Allow users to calculate their income tax', enabled: true },
  { id: 'history', name: 'Calculation History', description: 'Store and display past calculations for users', enabled: true },
  { id: 'export', name: 'PDF Export', description: 'Allow users to export tax reports as PDF', enabled: true },
  { id: 'multi_income', name: 'Multiple Income Sources', description: 'Allow users to add multiple income sources', enabled: true },
  { id: 'comparison', name: 'Year-on-Year Comparison', description: 'Enable comparison of tax across different years', enabled: false },
  { id: 'ai_insights', name: 'AI Tax Insights', description: 'AI-powered tax saving suggestions', enabled: false },
];

export default function SystemSettingsPage() {
  const [currency, setCurrency] = useState('LKR');
  const [rounding, setRounding] = useState('round');
  const [apitMethod, setApitMethod] = useState('cumulative');
  const [apitEnabled, setApitEnabled] = useState(true);
  const [flags, setFlags] = useState(initialFlags);
  const [hasChanges, setHasChanges] = useState(false);

  const markChanged = () => setHasChanges(true);

  const toggleFlag = (id: string) => {
    setFlags((prev) => prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)));
    markChanged();
  };

  const handleSave = () => {
    setHasChanges(false);
    toast.success('System settings saved successfully');
  };

  const handleReset = () => {
    setCurrency('LKR');
    setRounding('round');
    setApitMethod('cumulative');
    setApitEnabled(true);
    setFlags(initialFlags);
    setHasChanges(false);
    toast.info('Settings reset to defaults');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
            System Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure global system behavior, calculation rules, and feature availability
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" className="gap-2" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button className="gap-2" onClick={handleSave} disabled={!hasChanges}>
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Currency & Rounding */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base">Currency & Formatting</CardTitle>
                <CardDescription>Configure currency and number formatting rules</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Select value={currency} onValueChange={(v) => { setCurrency(v); markChanged(); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LKR">LKR — Sri Lankan Rupee</SelectItem>
                  <SelectItem value="USD">USD — US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR — Euro</SelectItem>
                  <SelectItem value="GBP">GBP — British Pound</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Rounding Rule</Label>
              <RadioGroup value={rounding} onValueChange={(v) => { setRounding(v); markChanged(); }} className="space-y-2">
                {[
                  { value: 'round', label: 'Round', desc: 'Standard rounding (≥0.5 rounds up)' },
                  { value: 'floor', label: 'Floor', desc: 'Always round down to nearest integer' },
                  { value: 'ceil', label: 'Ceiling', desc: 'Always round up to nearest integer' },
                  { value: 'none', label: 'No Rounding', desc: 'Keep exact decimal values' },
                ].map((opt) => (
                  <div key={opt.value} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-secondary/30 transition-colors">
                    <RadioGroupItem value={opt.value} id={`rounding-${opt.value}`} className="mt-0.5" />
                    <Label htmlFor={`rounding-${opt.value}`} className="cursor-pointer flex-1">
                      <span className="text-sm font-medium text-foreground">{opt.label}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* APIT Settings */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base">APIT Calculation</CardTitle>
                <CardDescription>Advanced Personal Income Tax settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
              <div>
                <p className="text-sm font-medium text-foreground">Enable APIT Calculation</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  When enabled, monthly APIT deductions are calculated automatically
                </p>
              </div>
              <Switch
                checked={apitEnabled}
                onCheckedChange={(v) => { setApitEnabled(v); markChanged(); }}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>APIT Method</Label>
              <RadioGroup
                value={apitMethod}
                onValueChange={(v) => { setApitMethod(v); markChanged(); }}
                className="space-y-2"
                disabled={!apitEnabled}
              >
                {[
                  { value: 'cumulative', label: 'Cumulative', desc: 'Recalculate tax each month based on year-to-date income' },
                  { value: 'non_cumulative', label: 'Non-Cumulative', desc: 'Calculate tax based on each month\'s income independently' },
                ].map((opt) => (
                  <div
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${apitEnabled ? 'hover:bg-secondary/30' : 'opacity-50'}`}
                  >
                    <RadioGroupItem value={opt.value} id={`apit-${opt.value}`} className="mt-0.5" />
                    <Label htmlFor={`apit-${opt.value}`} className="cursor-pointer flex-1">
                      <span className="text-sm font-medium text-foreground">{opt.label}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                APIT settings affect how employers calculate monthly tax deductions. Changes apply to new calculations only.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Flags */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ToggleRight className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base">Feature Flags</CardTitle>
              <CardDescription>Enable or disable system features for all users</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {flags.map((flag, idx) => (
            <div key={flag.id}>
              <div className="flex items-center justify-between px-6 py-4 hover:bg-secondary/30 transition-colors">
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-foreground">{flag.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${flag.enabled ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-secondary text-muted-foreground'}`}
                    >
                      {flag.enabled ? 'ON' : 'OFF'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{flag.description}</p>
                </div>
                <Switch checked={flag.enabled} onCheckedChange={() => toggleFlag(flag.id)} />
              </div>
              {idx < flags.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
