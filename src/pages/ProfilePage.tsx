import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Save, Shield, Briefcase, Phone, Info, CheckCircle2, Loader2, MapPin, Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { getTaxProfile, saveTaxProfile } from '@/services/firebase/profileService';
import { toast } from 'sonner';
import type { TaxProfile, MaritalStatus } from '@/types/taxProfile';
import { defaultTaxProfile, isSeniorCitizenFromDOB, computeAge } from '@/types/taxProfile';

/** Teal badge shown next to fields that auto-fill the tax return */
function AutoFillBadge() {
  return (
    <Badge variant="outline" className="ml-2 text-[10px] font-normal border-teal-600 text-teal-700 bg-teal-50 py-0">
      Auto-fills tax return
    </Badge>
  );
}

function Hint({ text }: { text: string }) {
  return (
    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
      <Info className="w-3 h-3 shrink-0" /> {text}
    </p>
  );
}

export default function ProfilePage() {
  const { state, dispatch } = useAppContext();
  const { user } = useAuth();

  const [profile, setProfile] = useState<TaxProfile>({ ...defaultTaxProfile });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load from Firestore on mount
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getTaxProfile(user.uid)
      .then((saved) => {
        const merged: TaxProfile = {
          ...saved,
          name:  saved.name  || user.name  || '',
          email: saved.email || user.email || '',
        };
        setProfile(merged);
        dispatch({
          type: 'SET_PROFILE',
          payload: {
            name: merged.name,
            email: merged.email,
            occupation: merged.occupation,
            defaultIncome: merged.default_income,
            inputPreference: merged.input_preference,
          },
        });
      })
      .catch(() => {
        setProfile((p) => ({
          ...p,
          name:  user.name  || '',
          email: user.email || '',
        }));
      })
      .finally(() => setLoading(false));
  }, [user]);

  const update = <K extends keyof TaxProfile>(field: K, value: TaxProfile[K]) => {
    setProfile((p) => ({ ...p, [field]: value }));
  };

  /** When DOB changes, auto-update the Senior Citizen toggle */
  const handleDOBChange = (dob: string) => {
    update('date_of_birth', dob);
    if (dob) update('is_senior_citizen', isSeniorCitizenFromDOB(dob));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { updated_at, ...toSave } = profile;
      await saveTaxProfile(user.uid, toSave);
      dispatch({
        type: 'SET_PROFILE',
        payload: {
          name: profile.name,
          email: profile.email,
          occupation: profile.occupation,
          defaultIncome: profile.default_income,
          inputPreference: profile.input_preference,
        },
      });
      toast.success('Profile saved!', {
        description: 'Your details will auto-fill your tax return every year.',
      });
    } catch {
      toast.error('Save failed', { description: 'Check your connection and try again.' });
    } finally {
      setSaving(false);
    }
  };

  const age = computeAge(profile.date_of_birth);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Fill in your details once — they auto-fill your tax return every year.
        </p>
      </div>

      {/* ── Section 1: Basic Information ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
        <Card className="shadow-elevated border-0">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>
                  Full Name <AutoFillBadge />
                </Label>
                <Input
                  value={profile.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="e.g. Kamal Perera"
                />
                <Hint text="Your name exactly as on your NIC." />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="kamal@example.com"
                />
              </div>
              <div>
                <Label>Occupation</Label>
                <Input
                  value={profile.occupation}
                  onChange={(e) => update('occupation', e.target.value)}
                  placeholder="e.g. Software Engineer"
                />
              </div>
              <div>
                <Label>Default Annual Income (Rs.)</Label>
                <Input
                  type="number"
                  value={profile.default_income || ''}
                  onChange={(e) => update('default_income', Number(e.target.value))}
                  placeholder="0"
                />
                <Hint text="Pre-fills the tax calculator." />
              </div>
            </div>
            <div>
              <Label>Input Preference</Label>
              <Select
                value={profile.input_preference}
                onValueChange={(v) => update('input_preference', v as 'annual' | 'monthly')}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section 2: Personal Details ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
        <Card className="shadow-elevated border-0">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Personal Details
              <span className="text-xs font-normal text-muted-foreground ml-1">RAMIS Part B — Declarant</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>
                  Date of Birth <AutoFillBadge />
                </Label>
                <Input
                  type="date"
                  value={profile.date_of_birth}
                  onChange={(e) => handleDOBChange(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
                {profile.date_of_birth && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Info className="w-3 h-3 shrink-0" />
                    Age: <strong>{age}</strong>
                    {age >= 60 && <span className="ml-1 text-teal-600 font-medium">— Senior Citizen (auto-detected)</span>}
                  </p>
                )}
                {!profile.date_of_birth && (
                  <Hint text="Used to automatically set Senior Citizen status (age ≥ 60)." />
                )}
              </div>
              <div>
                <Label>
                  Marital Status <AutoFillBadge />
                </Label>
                <Select
                  value={profile.marital_status || ''}
                  onValueChange={(v) => update('marital_status', v as MaritalStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
                <Hint text="Relevant for spouse-related relief declarations." />
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Permanent Address <AutoFillBadge />
              </Label>
              <Textarea
                value={profile.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder="Your permanent residential address as of 31 March"
                rows={2}
                className="resize-none"
              />
              <Hint text="Your address as of the last day of the assessment year (31 March)." />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section 3: Tax Identity ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Card className="shadow-elevated border-0">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Tax Identity
              <span className="text-xs font-normal text-muted-foreground ml-1">Required for IRD e-Filing</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>
                  TIN (Taxpayer Identification Number) <AutoFillBadge />
                </Label>
                <Input
                  value={profile.tin}
                  onChange={(e) => update('tin', e.target.value)}
                  placeholder="e.g. 101752321"
                  maxLength={12}
                />
                <Hint text="Find it on any letter from the IRD or a previous tax return." />
              </div>
              <div>
                <Label>
                  NIC (National Identity Card) <AutoFillBadge />
                </Label>
                <Input
                  value={profile.nic}
                  onChange={(e) => update('nic', e.target.value)}
                  placeholder="e.g. 630132860V or 196301328600"
                  maxLength={12}
                />
                <Hint text="Old: 9 digits + V/X. New: 12 digits." />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">
                    Resident Status <AutoFillBadge />
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {profile.is_resident ? '✔ Resident in Sri Lanka' : 'Non-resident'}
                  </p>
                </div>
                <Switch
                  checked={profile.is_resident}
                  onCheckedChange={(v) => update('is_resident', v)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">
                    Senior Citizen <AutoFillBadge />
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {profile.is_senior_citizen
                      ? age >= 60
                        ? `✔ Yes — age ${age} (auto-detected)`
                        : '✔ Yes — age 60+'
                      : 'No'}
                  </p>
                </div>
                <Switch
                  checked={profile.is_senior_citizen}
                  onCheckedChange={(v) => update('is_senior_citizen', v)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section 4: Employment Details ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <Card className="shadow-elevated border-0">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" /> Primary Employment
              <span className="text-xs font-normal text-muted-foreground ml-1">RAMIS Schedule 1</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>
                  Employer / Company Name <AutoFillBadge />
                </Label>
                <Input
                  value={profile.employer_name}
                  onChange={(e) => update('employer_name', e.target.value)}
                  placeholder="e.g. ABC Company (Pvt) Ltd"
                />
                <Hint text="Full name of your main employer — on your payslip or T.10 certificate." />
              </div>
              <div>
                <Label>
                  Employer TIN <AutoFillBadge />
                </Label>
                <Input
                  value={profile.employer_tin}
                  onChange={(e) => update('employer_tin', e.target.value)}
                  placeholder="e.g. 409084400"
                  maxLength={12}
                />
                <Hint text="Your employer's tax number — on the APIT-T(New) 10 certificate they issue you." />
              </div>
            </div>
            <div>
              <Label>Employment Type <AutoFillBadge /></Label>
              <Select
                value={profile.employment_type}
                onValueChange={(v) => update('employment_type', v as 'primary' | 'secondary')}
              >
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary Employment</SelectItem>
                  <SelectItem value="secondary">Secondary Employment</SelectItem>
                </SelectContent>
              </Select>
              <Hint text="Most people have Primary. Secondary is an additional job." />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section 5: Contact Details ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
        <Card className="shadow-elevated border-0">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" /> Contact Details
              <span className="text-xs font-normal text-muted-foreground ml-1">RAMIS Part B</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>
                  Mobile <AutoFillBadge />
                </Label>
                <Input
                  value={profile.mobile}
                  onChange={(e) => update('mobile', e.target.value)}
                  placeholder="e.g. 077-1234567"
                />
              </div>
              <div>
                <Label>Telephone (optional)</Label>
                <Input
                  value={profile.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="e.g. 011-2345678"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── What auto-fills info box ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-teal-800">What gets auto-filled on your tax return</p>
              <ul className="mt-2 text-xs text-teal-700 space-y-1 list-disc list-inside">
                <li>Name, TIN, NIC — RAMIS return header</li>
                <li>Address — RAMIS Part B declarant section</li>
                <li>Date of Birth → auto-sets Senior Citizen status</li>
                <li>Resident / Non-resident and Senior Citizen toggles</li>
                <li>Employer name and Employer TIN — Schedule 1 employment income</li>
                <li>Mobile and Email — Part B contact details</li>
              </ul>
              <p className="mt-2 text-xs text-teal-600">
                You still enter each year: income amounts, T.10 APIT total, assets &amp; liabilities, deductions.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Save Button ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
        <Button
          className="gradient-primary border-0 text-primary-foreground hover:opacity-90 w-full sm:w-auto"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </motion.div>
    </div>
  );
}
