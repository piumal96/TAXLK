import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  Info,
  CheckCircle2,
  AlertCircle,
  User,
  Building2,
  TrendingUp,
  Receipt,
  Calculator,
  Landmark,
  BookOpen,
  Sparkles,
  Plus,
  Trash2,
  ExternalLink,
  Printer,
  FileText,
  ClipboardCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { calculateTax, formatCurrency, TAX_FREE_THRESHOLD } from '@/lib/taxCalculator';
import type { EmploymentIncome, InvestmentIncome, BusinessIncome, IncomeSource } from '@/types/income';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmploymentEntry {
  sourceId: string;
  label: string;
  remuneration: number;    // auto-filled from app
  employerName: string;    // manual
  employerTIN: string;     // manual
  terminalBenefits: number; // manual — gratuity / EPF lump sum
  apitFromT10: number;     // manual — total APIT on T.10 certificate
}

interface PropertyEntry { description: string; cost: number; marketValue: number; }
interface VehicleEntry  { description: string; regNo: string; value: number; }
interface BankEntry     { bank: string; balance: number; interest: number; }
interface LoanEntry     { description: string; originalAmount: number; balance: number; }

interface TaxReturnDraft {
  // Step 1 — Identity
  tin: string;
  nic: string;
  fullName: string;
  address: string;
  phone: string;
  // Step 2 — Employment
  employmentEntries: EmploymentEntry[];
  // Step 3 — Other Income
  interestIncome: number;
  aitOnInterest: number;
  dividendIncome: number;
  rentIncome: number;
  businessNetIncome: number;
  // Step 4 — Deductions
  solarPanelExpenditure: number;
  housingLoanInterest: number;
  medicalExpenses: number;
  educationExpenses: number;
  pensionContributions: number;
  cseInvestments: number;
  charitableDonations: number;
  govtDonations: number;
  // Step 5 — Credits
  installmentsPaid: number;
  // Step 6 — Assets
  properties: PropertyEntry[];
  vehicles: VehicleEntry[];
  bankBalances: BankEntry[];
  sharesValue: number;
  cashInHand: number;
  jewelry: number;
  loans: LoanEntry[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SOLAR_RELIEF_MAX      = 600_000;
const AGGREGATE_RELIEF_MAX  = 900_000;
const AIT_RATE              = 0.10;
const CHARITABLE_MAX_FLAT   = 75_000;
const DRAFT_KEY             = 'taxreturn-draft-2024-2025';
const ASSESSMENT_YEAR       = '2024/2025';

const STEPS = [
  { number: 1, title: 'Your Profile & TIN',      icon: User,         short: 'Profile' },
  { number: 2, title: 'Employment Income',        icon: Building2,    short: 'Employment' },
  { number: 3, title: 'Other Income',             icon: TrendingUp,   short: 'Other Income' },
  { number: 4, title: 'Deductions & Reliefs',     icon: Receipt,      short: 'Deductions' },
  { number: 5, title: 'Tax Summary',              icon: Calculator,   short: 'Tax Summary' },
  { number: 6, title: 'Assets & Liabilities',     icon: Landmark,     short: 'Assets' },
  { number: 7, title: 'How to File on RAMIS',     icon: BookOpen,     short: 'File Now' },
];

// ─── Helper: build initial draft from AppContext income sources ───────────────

function buildDraft(sources: IncomeSource[], profileName: string): TaxReturnDraft {
  const employmentSources = sources.filter((s): s is EmploymentIncome => s.category === 'employment');
  const investmentSources = sources.filter((s): s is InvestmentIncome => s.category === 'investment');
  const businessSources   = sources.filter((s): s is BusinessIncome   => s.category === 'business');

  const interestIncome    = investmentSources.reduce((sum, s) => sum + s.interest, 0);
  const dividendIncome    = investmentSources.reduce((sum, s) => sum + s.dividends, 0);
  const rentIncome        = investmentSources.reduce((sum, s) => sum + s.rent, 0);
  const businessNetIncome = businessSources.reduce((sum, s) => sum + Math.max(0, s.revenue - s.expenses), 0);

  return {
    tin: '', nic: '', fullName: profileName, address: '', phone: '',
    employmentEntries: employmentSources.map(s => ({
      sourceId: s.id,
      label: s.label,
      remuneration: s.salary + s.bonus + s.allowances + s.benefits,
      employerName: '', employerTIN: '', terminalBenefits: 0, apitFromT10: 0,
    })),
    interestIncome,
    aitOnInterest: interestIncome * AIT_RATE,
    dividendIncome,
    rentIncome,
    businessNetIncome,
    solarPanelExpenditure: 0,
    housingLoanInterest: 0, medicalExpenses: 0, educationExpenses: 0,
    pensionContributions: 0, cseInvestments: 0,
    charitableDonations: 0, govtDonations: 0,
    installmentsPaid: 0,
    properties: [], vehicles: [], bankBalances: [],
    sharesValue: 0, cashInHand: 0, jewelry: 0,
    loans: [],
  };
}

// Merge saved manual fields onto a fresh auto-filled draft
function mergeSaved(fresh: TaxReturnDraft, saved: Partial<TaxReturnDraft>): TaxReturnDraft {
  return {
    ...fresh,
    tin: saved.tin ?? '', nic: saved.nic ?? '',
    fullName: saved.fullName ?? fresh.fullName,
    address: saved.address ?? '', phone: saved.phone ?? '',
    employmentEntries: fresh.employmentEntries.map((e, i) => ({
      ...e,
      employerName:    saved.employmentEntries?.[i]?.employerName    ?? '',
      employerTIN:     saved.employmentEntries?.[i]?.employerTIN     ?? '',
      terminalBenefits:saved.employmentEntries?.[i]?.terminalBenefits ?? 0,
      apitFromT10:     saved.employmentEntries?.[i]?.apitFromT10     ?? 0,
    })),
    solarPanelExpenditure: saved.solarPanelExpenditure ?? 0,
    housingLoanInterest:   saved.housingLoanInterest   ?? 0,
    medicalExpenses:       saved.medicalExpenses       ?? 0,
    educationExpenses:     saved.educationExpenses     ?? 0,
    pensionContributions:  saved.pensionContributions  ?? 0,
    cseInvestments:        saved.cseInvestments        ?? 0,
    charitableDonations:   saved.charitableDonations   ?? 0,
    govtDonations:         saved.govtDonations         ?? 0,
    installmentsPaid:      saved.installmentsPaid      ?? 0,
    properties:    saved.properties    ?? [],
    vehicles:      saved.vehicles      ?? [],
    bankBalances:  saved.bankBalances  ?? [],
    sharesValue:   saved.sharesValue   ?? 0,
    cashInHand:    saved.cashInHand    ?? 0,
    jewelry:       saved.jewelry       ?? 0,
    loans:         saved.loans         ?? [],
  };
}

// ─── Reusable small components ────────────────────────────────────────────────

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
      <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
      <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
        {children}
      </AlertDescription>
    </Alert>
  );
}

function AutoFilled({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-green-600 font-medium pointer-events-none">
        <Sparkles className="w-3 h-3" /> Auto-filled
      </span>
    </div>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground mt-1">{children}</p>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">{children}</h3>;
}

function NumInput({
  value, onChange, placeholder = '0',
}: { value: number; onChange: (v: number) => void; placeholder?: string }) {
  return (
    <Input
      type="number"
      min={0}
      value={value === 0 ? '' : value}
      placeholder={placeholder}
      onChange={e => onChange(Number(e.target.value) || 0)}
      className="text-right"
    />
  );
}

function SummaryRow({
  label, value, sub, bold, highlight,
}: { label: string; value: string; sub?: boolean; bold?: boolean; highlight?: 'green' | 'red' | 'blue' }) {
  return (
    <div className={cn('flex justify-between items-center py-1.5', sub && 'pl-4', bold && 'font-semibold')}>
      <span className={cn('text-sm', sub ? 'text-muted-foreground' : 'text-foreground')}>{label}</span>
      <span className={cn(
        'text-sm font-mono',
        highlight === 'green' && 'text-green-600 font-semibold',
        highlight === 'red'   && 'text-destructive font-semibold',
        highlight === 'blue'  && 'text-primary font-semibold',
        bold && 'font-bold',
      )}>{value}</span>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function TaxReturnPage() {
  const { state } = useAppContext();
  const { user }  = useAuth();

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<TaxReturnDraft>(() =>
    buildDraft(state.incomeSources, state.profile.name || user?.name || '')
  );

  // Load saved manual fields from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<TaxReturnDraft>;
        setDraft(prev => mergeSaved(prev, saved));
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist draft to localStorage on every change
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* ignore */ }
  }, [draft]);

  const update = <K extends keyof TaxReturnDraft>(field: K, value: TaxReturnDraft[K]) =>
    setDraft(prev => ({ ...prev, [field]: value }));

  const updateEntry = (i: number, patch: Partial<EmploymentEntry>) =>
    setDraft(prev => {
      const entries = [...prev.employmentEntries];
      entries[i] = { ...entries[i], ...patch };
      return { ...prev, employmentEntries: entries };
    });

  // ── Tax calculations ──────────────────────────────────────────────────────

  const totalEmploymentRemuneration = draft.employmentEntries.reduce((s, e) => s + e.remuneration, 0);
  const totalTerminalBenefits       = draft.employmentEntries.reduce((s, e) => s + e.terminalBenefits, 0);
  const totalEmployment             = totalEmploymentRemuneration + totalTerminalBenefits;
  const totalIncome                 = totalEmployment + draft.interestIncome + draft.dividendIncome + draft.rentIncome + draft.businessNetIncome;

  const solarRelief       = Math.min(draft.solarPanelExpenditure, SOLAR_RELIEF_MAX);
  const aggregateRaw      = draft.housingLoanInterest + draft.medicalExpenses + draft.educationExpenses + draft.pensionContributions + draft.cseInvestments;
  const aggregateRelief   = Math.min(aggregateRaw, AGGREGATE_RELIEF_MAX);

  // Charitable donation cap: lower of actual, LKR 75,000, or 1/3 of taxable income
  const grossTaxableIncome  = Math.max(0, totalIncome - TAX_FREE_THRESHOLD);
  const charityMax          = Math.min(draft.charitableDonations, CHARITABLE_MAX_FLAT, grossTaxableIncome / 3);
  const totalExtraRelief    = solarRelief + aggregateRelief + charityMax + draft.govtDonations;

  // Re-run tax calc with adjusted income
  const adjustedIncome      = Math.max(0, totalIncome - totalExtraRelief);
  const adjEmployment       = totalIncome > 0 ? totalEmployment * (adjustedIncome / totalIncome) : 0;
  const taxResult           = calculateTax(adjustedIncome, adjEmployment);

  const apitTotal           = draft.employmentEntries.reduce((s, e) => s + e.apitFromT10, 0);
  const totalCredits        = apitTotal + draft.aitOnInterest + draft.installmentsPaid;
  const taxBalance          = taxResult.totalTax - totalCredits;

  // ── Asset totals ──────────────────────────────────────────────────────────
  const totalAssets = draft.properties.reduce((s, p) => s + p.marketValue, 0)
    + draft.vehicles.reduce((s, v) => s + v.value, 0)
    + draft.bankBalances.reduce((s, b) => s + b.balance, 0)
    + draft.sharesValue + draft.cashInHand + draft.jewelry;
  const totalLiabilities = draft.loans.reduce((s, l) => s + l.balance, 0);
  const netWorth         = totalAssets - totalLiabilities;

  // ── Step content ──────────────────────────────────────────────────────────

  function renderStep() {
    switch (step) {

      // ── Step 1: Profile & TIN ──────────────────────────────────────────────
      case 1: return (
        <div className="space-y-5">
          <InfoBox>
            <strong>What is a TIN?</strong> Your Tax Identification Number is a unique number the Inland Revenue
            Department (IRD) gives you. You need it to file your return on RAMIS. If you don't have one yet,
            register at <strong>ramis.ird.gov.lk</strong> or call the IRD helpline at <strong>1944</strong>.
          </InfoBox>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Full Name (as per NIC)</Label>
              <Input value={draft.fullName} onChange={e => update('fullName', e.target.value)} placeholder="e.g. Kasun Perera" />
              <FieldHint>Enter your name exactly as printed on your National Identity Card.</FieldHint>
            </div>
            <div className="space-y-1.5">
              <Label>NIC Number</Label>
              <Input value={draft.nic} onChange={e => update('nic', e.target.value)} placeholder="e.g. 199012345678 or 901234567V" />
              <FieldHint>Your 12-digit new NIC or old 9+V/X format.</FieldHint>
            </div>
            <div className="space-y-1.5">
              <Label>TIN (Tax Identification Number)</Label>
              <Input value={draft.tin} onChange={e => update('tin', e.target.value)} placeholder="e.g. 123456789" />
              <FieldHint>
                Find your TIN on any letter from the IRD, or on your previous tax return. It's usually 9 digits.
              </FieldHint>
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input value={draft.phone} onChange={e => update('phone', e.target.value)} placeholder="e.g. 0771234567" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Address</Label>
              <Input value={draft.address} onChange={e => update('address', e.target.value)} placeholder="Your home address" />
              <FieldHint>Your permanent residential address as of March 31, 2025.</FieldHint>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
            <FileText className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium">Year of Assessment: {ASSESSMENT_YEAR}</p>
              <p className="text-xs text-muted-foreground">This covers income earned April 1, 2024 – March 31, 2025. Filing deadline: 30 November 2025.</p>
            </div>
          </div>

          <InfoBox>
            <strong>Don't have a TIN yet?</strong><br />
            1. Go to <strong>ramis.ird.gov.lk</strong> in Chrome or Edge<br />
            2. Click <strong>"Register"</strong> → Choose <strong>"Individual"</strong><br />
            3. Enter your NIC number and follow the steps<br />
            4. Your TIN will appear on screen — write it down!
          </InfoBox>
        </div>
      );

      // ── Step 2: Employment Income ──────────────────────────────────────────
      case 2: return (
        <div className="space-y-5">
          <InfoBox>
            <strong>What is a T.10 Certificate?</strong> Every year, your employer must give you a form called
            a <strong>T.10</strong> by April 30. It shows your total salary and the total APIT (tax) they deducted
            from your pay. You need these numbers to fill your return. Ask HR if you haven't received yours.
          </InfoBox>

          {draft.employmentEntries.length === 0 ? (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                You haven't added any employment income on the Income page yet. Go to{' '}
                <strong>Income</strong> in the navigation and add your employment sources first, then come back here.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {draft.employmentEntries.map((entry, i) => (
                <Card key={entry.sourceId} className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      {entry.label}
                      <Badge variant="outline" className="text-xs ml-auto">Employer {i + 1}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Auto-filled */}
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1">
                        Total Remuneration
                        <Badge className="bg-green-100 text-green-700 text-xs ml-1 font-normal">Auto-filled</Badge>
                      </Label>
                      <AutoFilled>
                        <Input value={formatCurrency(entry.remuneration)} readOnly className="bg-green-50 text-right pr-24" />
                      </AutoFilled>
                      <FieldHint>
                        Salary + bonus + allowances + benefits from your Income page. Verify this matches your payslips.
                      </FieldHint>
                    </div>

                    {/* Employer Name */}
                    <div className="space-y-1.5">
                      <Label>Employer Name</Label>
                      <Input
                        value={entry.employerName}
                        onChange={e => updateEntry(i, { employerName: e.target.value })}
                        placeholder="e.g. ABC Company (Pvt) Ltd"
                      />
                      <FieldHint>Full registered name of your employer.</FieldHint>
                    </div>

                    {/* Employer TIN */}
                    <div className="space-y-1.5">
                      <Label>Employer TIN</Label>
                      <Input
                        value={entry.employerTIN}
                        onChange={e => updateEntry(i, { employerTIN: e.target.value })}
                        placeholder="e.g. 123456789"
                      />
                      <FieldHint>
                        Found on your payslip or T.10 certificate. It's your employer's tax number — not yours.
                      </FieldHint>
                    </div>

                    {/* Terminal Benefits */}
                    <div className="space-y-1.5">
                      <Label>Terminal Benefits (Gratuity / Lump Sum)</Label>
                      <NumInput value={entry.terminalBenefits} onChange={v => updateEntry(i, { terminalBenefits: v })} />
                      <FieldHint>
                        Only fill this if you left this job and received a gratuity or EPF/ETF lump sum payout this year. Otherwise leave at 0.
                      </FieldHint>
                    </div>

                    {/* APIT from T.10 */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>
                        Total APIT Deducted — from T.10 Certificate{' '}
                        <span className="text-destructive font-medium">*important*</span>
                      </Label>
                      <NumInput value={entry.apitFromT10} onChange={v => updateEntry(i, { apitFromT10: v })} placeholder="Amount from your T.10" />
                      <FieldHint>
                        Look at your T.10 form from this employer. Find the box that says "Total Tax Deducted" or "APIT".
                        Enter that exact amount here. This is the tax already paid on your behalf — it reduces what you owe.
                      </FieldHint>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <InfoBox>
            <strong>Worked for multiple employers?</strong> Each employer should give you a separate T.10 certificate.
            Fill in the details for each one above. If you worked for an employer only part of the year, you still need their T.10.
          </InfoBox>
        </div>
      );

      // ── Step 3: Other Income ───────────────────────────────────────────────
      case 3: return (
        <div className="space-y-5">
          <InfoBox>
            Income from interest (bank savings/FDs), dividends (shares), rent, and business profits
            must also be declared. The good news: we've pre-filled these from your Income page.
            Verify against your bank statements and records.
          </InfoBox>

          {/* Investment Income */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Investment Income</CardTitle>
              <CardDescription>Income from savings, shares, and property rental</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  Interest Income
                  <Badge className="bg-green-100 text-green-700 text-xs ml-1 font-normal">Auto-filled</Badge>
                </Label>
                <AutoFilled>
                  <NumInput value={draft.interestIncome} onChange={v => {
                    update('interestIncome', v);
                    update('aitOnInterest', v * AIT_RATE);
                  }} />
                </AutoFilled>
                <FieldHint>
                  Total interest earned from savings accounts, fixed deposits, and other savings during the year.
                  Get this from your bank statements.
                </FieldHint>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  AIT Deducted on Interest (10%)
                  <Badge className="bg-green-100 text-green-700 text-xs ml-1 font-normal">Calculated</Badge>
                </Label>
                <AutoFilled>
                  <Input value={formatCurrency(draft.aitOnInterest)} readOnly className="bg-green-50 text-right pr-24" />
                </AutoFilled>
                <FieldHint>
                  Banks automatically deduct 10% AIT on your interest. This is a tax credit for you — it's already been
                  paid to the IRD. Your bank statement or AIT certificate shows this amount.
                </FieldHint>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  Dividend Income
                  <Badge className="bg-green-100 text-green-700 text-xs ml-1 font-normal">Auto-filled</Badge>
                </Label>
                <AutoFilled>
                  <NumInput value={draft.dividendIncome} onChange={v => update('dividendIncome', v)} />
                </AutoFilled>
                <FieldHint>
                  Dividends received from shares or unit trusts. Usually shown on your dividend warrants or broker statement.
                  Note: most dividends are final withholding — not taxed again in the return.
                </FieldHint>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  Rent Income
                  <Badge className="bg-green-100 text-green-700 text-xs ml-1 font-normal">Auto-filled</Badge>
                </Label>
                <AutoFilled>
                  <NumInput value={draft.rentIncome} onChange={v => update('rentIncome', v)} />
                </AutoFilled>
                <FieldHint>
                  Total rent received from any property you own and lease out during the year.
                </FieldHint>
              </div>
            </CardContent>
          </Card>

          {/* Business Income */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Business / Self-Employment Income</CardTitle>
              <CardDescription>Net profit from your own business</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  Net Business Profit (Revenue minus Expenses)
                  <Badge className="bg-green-100 text-green-700 text-xs ml-1 font-normal">Auto-filled</Badge>
                </Label>
                <AutoFilled>
                  <NumInput value={draft.businessNetIncome} onChange={v => update('businessNetIncome', v)} />
                </AutoFilled>
                <FieldHint>
                  Your business income after deducting business expenses. If you have multiple businesses, this is the total net profit.
                  Keep your accounts/receipts as the IRD may ask for them.
                </FieldHint>
              </div>
              {draft.businessNetIncome === 0 && (
                <p className="text-xs text-muted-foreground mt-2">No business income recorded. If you have a business, add it on the Income page or enter it directly above.</p>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
            <span className="text-sm font-medium">Total Other Income</span>
            <span className="text-sm font-bold font-mono">
              {formatCurrency(draft.interestIncome + draft.dividendIncome + draft.rentIncome + draft.businessNetIncome)}
            </span>
          </div>
        </div>
      );

      // ── Step 4: Deductions & Reliefs ───────────────────────────────────────
      case 4: return (
        <div className="space-y-5">
          <InfoBox>
            Reliefs reduce your taxable income — so you pay less tax. <strong>Only claim what you actually
            spent</strong> and keep your receipts. The IRD can ask for proof at any time.
          </InfoBox>

          {/* Personal Relief — fixed */}
          <Card className="border shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Personal Relief</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Everyone gets this automatically. The first LKR 1,800,000 of your income is tax-free.
                    No action needed.
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-700 shrink-0">
                  {formatCurrency(TAX_FREE_THRESHOLD)} — Automatic
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Solar Panels */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Solar Panel Relief</CardTitle>
              <CardDescription>Max relief: {formatCurrency(SOLAR_RELIEF_MAX)} per year</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Total amount you paid to buy/install solar panels this year</Label>
                <NumInput value={draft.solarPanelExpenditure} onChange={v => update('solarPanelExpenditure', v)} />
                <FieldHint>
                  You can claim up to LKR 600,000. Keep your invoice from the solar installer as proof.
                  If you didn't buy solar panels, leave this at 0.
                </FieldHint>
              </div>
              {draft.solarPanelExpenditure > 0 && (
                <p className="text-xs text-green-600 font-medium">
                  Relief applied: {formatCurrency(solarRelief)}
                  {draft.solarPanelExpenditure > SOLAR_RELIEF_MAX ? ` (capped at ${formatCurrency(SOLAR_RELIEF_MAX)})` : ''}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Aggregate Expenditure Relief */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Aggregate Expenditure Relief</CardTitle>
              <CardDescription>
                Total of all items below is capped at {formatCurrency(AGGREGATE_RELIEF_MAX)} per year.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Housing Loan Interest</Label>
                <NumInput value={draft.housingLoanInterest} onChange={v => update('housingLoanInterest', v)} />
                <FieldHint>
                  Interest you paid on a home loan this year. Get this from your bank's annual loan statement.
                  Only the <em>interest</em> portion — not the capital repayment.
                </FieldHint>
              </div>
              <div className="space-y-1.5">
                <Label>Medical Expenses</Label>
                <NumInput value={draft.medicalExpenses} onChange={v => update('medicalExpenses', v)} />
                <FieldHint>
                  Doctor fees, hospital bills, and medicine costs for you and your family. Keep all receipts.
                </FieldHint>
              </div>
              <div className="space-y-1.5">
                <Label>Education Expenses</Label>
                <NumInput value={draft.educationExpenses} onChange={v => update('educationExpenses', v)} />
                <FieldHint>
                  School or university fees for your children. Must be for a registered educational institution.
                </FieldHint>
              </div>
              <div className="space-y-1.5">
                <Label>Pension / EPF Contributions</Label>
                <NumInput value={draft.pensionContributions} onChange={v => update('pensionContributions', v)} />
                <FieldHint>
                  Voluntary pension contributions or your own EPF contributions (not employer's). Check your EPF statement.
                </FieldHint>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Colombo Stock Exchange (CSE) Investments</Label>
                <NumInput value={draft.cseInvestments} onChange={v => update('cseInvestments', v)} />
                <FieldHint>
                  Amount you invested in shares on the Colombo Stock Exchange this year. Your broker can provide a statement.
                </FieldHint>
              </div>

              {aggregateRaw > 0 && (
                <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-lg bg-secondary text-sm">
                  <span>Total aggregate expenditure: {formatCurrency(aggregateRaw)}</span>
                  <span className="font-semibold text-green-600">
                    Relief: {formatCurrency(aggregateRelief)}
                    {aggregateRaw > AGGREGATE_RELIEF_MAX ? ` (capped at ${formatCurrency(AGGREGATE_RELIEF_MAX)})` : ''}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Qualifying Payments */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Qualifying Payments (Donations)</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Donations to Approved Charities</Label>
                <NumInput value={draft.charitableDonations} onChange={v => update('charitableDonations', v)} />
                <FieldHint>
                  Donations to approved charities are deductible — but capped at either LKR 75,000 or 1/3 of your
                  taxable income (whichever is less). Get a receipt from the charity.
                </FieldHint>
              </div>
              <div className="space-y-1.5">
                <Label>Donations to Government Funds</Label>
                <NumInput value={draft.govtDonations} onChange={v => update('govtDonations', v)} />
                <FieldHint>
                  Donations to gazetted government funds (e.g. disaster relief funds) have no cap — the full amount is deductible.
                  Keep your bank payment receipt.
                </FieldHint>
              </div>
            </CardContent>
          </Card>
        </div>
      );

      // ── Step 5: Tax Summary ────────────────────────────────────────────────
      case 5: return (
        <div className="space-y-5">
          <InfoBox>
            This is your estimated tax position. These numbers are calculated from everything you entered in the
            previous steps. If the final number shows a <strong>refund</strong>, the IRD will pay you back. If
            it shows a <strong>balance payable</strong>, you need to pay that amount when you file.
          </InfoBox>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Income</CardTitle>
            </CardHeader>
            <CardContent>
              <SummaryRow label="Employment Remuneration" value={formatCurrency(totalEmploymentRemuneration)} />
              {totalTerminalBenefits > 0 && <SummaryRow label="Terminal Benefits" value={formatCurrency(totalTerminalBenefits)} sub />}
              {draft.interestIncome > 0  && <SummaryRow label="Interest Income" value={formatCurrency(draft.interestIncome)} />}
              {draft.dividendIncome > 0  && <SummaryRow label="Dividend Income" value={formatCurrency(draft.dividendIncome)} />}
              {draft.rentIncome > 0      && <SummaryRow label="Rent Income" value={formatCurrency(draft.rentIncome)} />}
              {draft.businessNetIncome > 0 && <SummaryRow label="Business Net Income" value={formatCurrency(draft.businessNetIncome)} />}
              <Separator className="my-2" />
              <SummaryRow label="Total Income" value={formatCurrency(totalIncome)} bold highlight="blue" />
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Reliefs & Deductions</CardTitle>
            </CardHeader>
            <CardContent>
              <SummaryRow label="Personal Relief (tax-free threshold)" value={`(${formatCurrency(TAX_FREE_THRESHOLD)})`} />
              {solarRelief > 0       && <SummaryRow label="Solar Panel Relief" value={`(${formatCurrency(solarRelief)})`} sub />}
              {aggregateRelief > 0   && <SummaryRow label="Aggregate Expenditure Relief" value={`(${formatCurrency(aggregateRelief)})`} sub />}
              {charityMax > 0        && <SummaryRow label="Charitable Donations" value={`(${formatCurrency(charityMax)})`} sub />}
              {draft.govtDonations > 0 && <SummaryRow label="Government Fund Donations" value={`(${formatCurrency(draft.govtDonations)})`} sub />}
              <Separator className="my-2" />
              <SummaryRow label="Taxable Income" value={formatCurrency(taxResult.taxableIncome)} bold highlight="blue" />
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tax Calculation</CardTitle>
            </CardHeader>
            <CardContent>
              {taxResult.breakdown.map((b, i) => (
                <SummaryRow key={i} label={`${b.label} @ ${(b.rate * 100).toFixed(0)}%`} value={formatCurrency(b.tax)} sub />
              ))}
              <Separator className="my-2" />
              <SummaryRow label="Gross Tax Liability" value={formatCurrency(taxResult.totalTax)} bold />
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tax Credits (Already Paid)</CardTitle>
            </CardHeader>
            <CardContent>
              <SummaryRow label="APIT deducted by employer(s)" value={`(${formatCurrency(apitTotal)})`} />
              {draft.aitOnInterest > 0     && <SummaryRow label="AIT deducted on interest (10%)" value={`(${formatCurrency(draft.aitOnInterest)})`} />}
              {draft.installmentsPaid > 0  && <SummaryRow label="SET Installment payments" value={`(${formatCurrency(draft.installmentsPaid)})`} />}

              {/* SET installments input */}
              <div className="mt-3 space-y-1.5 border-t pt-3">
                <Label className="text-sm">Did you pay any SET (quarterly tax installments) during the year?</Label>
                <NumInput value={draft.installmentsPaid} onChange={v => update('installmentsPaid', v)} placeholder="Enter total SET payments, or 0" />
                <FieldHint>
                  SET installments are quarterly advance tax payments some people make. Most salaried employees
                  don't need to pay these — your employer's APIT covers you. If you're unsure, leave it at 0.
                </FieldHint>
              </div>

              <Separator className="my-2" />
              <SummaryRow label="Total Credits" value={`(${formatCurrency(totalCredits)})`} bold />
            </CardContent>
          </Card>

          {/* Final result */}
          <Card className={cn(
            'border-2',
            taxBalance > 0 ? 'border-destructive/40 bg-destructive/5' : 'border-green-400/40 bg-green-50',
          )}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn('text-lg font-display font-bold', taxBalance > 0 ? 'text-destructive' : 'text-green-600')}>
                    {taxBalance > 0 ? 'Balance Payable' : 'Estimated Refund'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {taxBalance > 0
                      ? 'You will need to pay this when you file your return on RAMIS.'
                      : 'The IRD will refund this to your bank account after processing.'}
                  </p>
                </div>
                <span className={cn('text-2xl font-display font-bold', taxBalance > 0 ? 'text-destructive' : 'text-green-600')}>
                  {formatCurrency(Math.abs(taxBalance))}
                </span>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center">
            This is an estimate only. The IRD's system may calculate minor differences based on exact rules and rounding.
          </p>
        </div>
      );

      // ── Step 6: Assets & Liabilities ──────────────────────────────────────
      case 6: return (
        <div className="space-y-5">
          <InfoBox>
            <strong>Why does the IRD need this?</strong> The Statement of Assets &amp; Liabilities shows what you
            own and owe as of <strong>31 March 2025</strong>. The IRD uses it to make sure your lifestyle matches
            your declared income. Be honest — and keep your property deeds, vehicle papers, and bank statements
            handy to check the values.
          </InfoBox>

          {/* Properties */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Immovable Properties</CardTitle>
                <CardDescription>Houses, land, apartments you own</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() =>
                update('properties', [...draft.properties, { description: '', cost: 0, marketValue: 0 }])
              }>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </CardHeader>
            {draft.properties.length > 0 && (
              <CardContent className="space-y-3">
                {draft.properties.map((p, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto] gap-2 p-3 rounded-lg bg-secondary">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Input value={p.description} onChange={e => {
                          const arr = [...draft.properties]; arr[i] = { ...arr[i], description: e.target.value };
                          update('properties', arr);
                        }} placeholder="e.g. House in Colombo 5" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Original Cost (LKR)</Label>
                        <NumInput value={p.cost} onChange={v => {
                          const arr = [...draft.properties]; arr[i] = { ...arr[i], cost: v };
                          update('properties', arr);
                        }} />
                      </div>
                      <div>
                        <Label className="text-xs">Market Value (LKR)</Label>
                        <NumInput value={p.marketValue} onChange={v => {
                          const arr = [...draft.properties]; arr[i] = { ...arr[i], marketValue: v };
                          update('properties', arr);
                        }} />
                      </div>
                    </div>
                    <button
                      onClick={() => update('properties', draft.properties.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-destructive mt-5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>

          {/* Vehicles */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Motor Vehicles</CardTitle>
                <CardDescription>Cars, motorbikes, vans you own</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() =>
                update('vehicles', [...draft.vehicles, { description: '', regNo: '', value: 0 }])
              }>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </CardHeader>
            {draft.vehicles.length > 0 && (
              <CardContent className="space-y-3">
                {draft.vehicles.map((v, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto] gap-2 p-3 rounded-lg bg-secondary">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Input value={v.description} onChange={e => {
                          const arr = [...draft.vehicles]; arr[i] = { ...arr[i], description: e.target.value };
                          update('vehicles', arr);
                        }} placeholder="e.g. Toyota Prius 2019" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Registration No.</Label>
                        <Input value={v.regNo} onChange={e => {
                          const arr = [...draft.vehicles]; arr[i] = { ...arr[i], regNo: e.target.value };
                          update('vehicles', arr);
                        }} placeholder="e.g. WP CAB-1234" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Current Value (LKR)</Label>
                        <NumInput value={v.value} onChange={val => {
                          const arr = [...draft.vehicles]; arr[i] = { ...arr[i], value: val };
                          update('vehicles', arr);
                        }} />
                      </div>
                    </div>
                    <button
                      onClick={() => update('vehicles', draft.vehicles.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-destructive mt-5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>

          {/* Bank Accounts */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Bank Accounts</CardTitle>
                <CardDescription>All savings, current, and fixed deposit accounts</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() =>
                update('bankBalances', [...draft.bankBalances, { bank: '', balance: 0, interest: 0 }])
              }>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </CardHeader>
            {draft.bankBalances.length > 0 && (
              <CardContent className="space-y-3">
                {draft.bankBalances.map((b, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto] gap-2 p-3 rounded-lg bg-secondary">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Bank Name</Label>
                        <Input value={b.bank} onChange={e => {
                          const arr = [...draft.bankBalances]; arr[i] = { ...arr[i], bank: e.target.value };
                          update('bankBalances', arr);
                        }} placeholder="e.g. Commercial Bank" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Balance as at 31 Mar (LKR)</Label>
                        <NumInput value={b.balance} onChange={v => {
                          const arr = [...draft.bankBalances]; arr[i] = { ...arr[i], balance: v };
                          update('bankBalances', arr);
                        }} />
                      </div>
                      <div>
                        <Label className="text-xs">Interest Earned (LKR)</Label>
                        <NumInput value={b.interest} onChange={v => {
                          const arr = [...draft.bankBalances]; arr[i] = { ...arr[i], interest: v };
                          update('bankBalances', arr);
                        }} />
                      </div>
                    </div>
                    <button
                      onClick={() => update('bankBalances', draft.bankBalances.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-destructive mt-5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>

          {/* Other Assets */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Other Assets</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Shares / Stocks Value (LKR)</Label>
                <NumInput value={draft.sharesValue} onChange={v => update('sharesValue', v)} />
                <FieldHint>Total market value of all shares as at 31 March 2025.</FieldHint>
              </div>
              <div className="space-y-1.5">
                <Label>Cash in Hand (LKR)</Label>
                <NumInput value={draft.cashInHand} onChange={v => update('cashInHand', v)} />
                <FieldHint>Physical cash you hold at home or in your wallet.</FieldHint>
              </div>
              <div className="space-y-1.5">
                <Label>Jewelry / Gold Value (LKR)</Label>
                <NumInput value={draft.jewelry} onChange={v => update('jewelry', v)} />
                <FieldHint>Estimate of gold, jewelry, and precious items you own.</FieldHint>
              </div>
            </CardContent>
          </Card>

          {/* Liabilities */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Liabilities (Money You Owe)</CardTitle>
                <CardDescription>Housing loans, vehicle loans, personal loans</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() =>
                update('loans', [...draft.loans, { description: '', originalAmount: 0, balance: 0 }])
              }>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </CardHeader>
            {draft.loans.length > 0 && (
              <CardContent className="space-y-3">
                {draft.loans.map((l, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto] gap-2 p-3 rounded-lg bg-secondary">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Input value={l.description} onChange={e => {
                          const arr = [...draft.loans]; arr[i] = { ...arr[i], description: e.target.value };
                          update('loans', arr);
                        }} placeholder="e.g. Housing Loan — Sampath Bank" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Original Loan Amount (LKR)</Label>
                        <NumInput value={l.originalAmount} onChange={v => {
                          const arr = [...draft.loans]; arr[i] = { ...arr[i], originalAmount: v };
                          update('loans', arr);
                        }} />
                      </div>
                      <div>
                        <Label className="text-xs">Outstanding Balance (LKR)</Label>
                        <NumInput value={l.balance} onChange={v => {
                          const arr = [...draft.loans]; arr[i] = { ...arr[i], balance: v };
                          update('loans', arr);
                        }} />
                      </div>
                    </div>
                    <button
                      onClick={() => update('loans', draft.loans.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-destructive mt-5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>

          {/* Net Worth Summary */}
          <Card className="border shadow-sm bg-secondary/50">
            <CardContent className="pt-4 space-y-1">
              <SummaryRow label="Total Assets" value={formatCurrency(totalAssets)} />
              <SummaryRow label="Total Liabilities" value={`(${formatCurrency(totalLiabilities)})`} />
              <Separator className="my-2" />
              <SummaryRow label="Net Worth" value={formatCurrency(netWorth)} bold highlight={netWorth >= 0 ? 'blue' : 'red'} />
            </CardContent>
          </Card>
        </div>
      );

      // ── Step 7: RAMIS Filing Guide ──────────────────────────────────────────
      case 7: return (
        <div className="space-y-5 print:text-black">

          {/* Final summary for printing */}
          <Card className="border-2 border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-primary">
                <ClipboardCheck className="w-5 h-5" />
                Your Return Summary — Year of Assessment {ASSESSMENT_YEAR}
              </CardTitle>
              <CardDescription>Take these numbers with you when you file on RAMIS</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Total Income',      value: formatCurrency(totalIncome) },
                { label: 'Taxable Income',    value: formatCurrency(taxResult.taxableIncome) },
                { label: 'Tax Liability',     value: formatCurrency(taxResult.totalTax) },
                { label: 'APIT Paid',         value: formatCurrency(apitTotal) },
                { label: 'AIT Paid',          value: formatCurrency(draft.aitOnInterest) },
                {
                  label: taxBalance > 0 ? 'Balance Payable' : 'Refund Due',
                  value: formatCurrency(Math.abs(taxBalance)),
                },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-lg bg-background border">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-bold font-mono mt-0.5">{item.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Documents checklist */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Step 1 — Gather These Documents First</CardTitle>
              <CardDescription>Have all of these ready before you open RAMIS</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {[
                  { label: 'National Identity Card (NIC)',                done: !!draft.nic },
                  { label: 'Your TIN (Tax Identification Number)',         done: !!draft.tin },
                  { label: 'T.10 certificate(s) from employer(s)',         done: draft.employmentEntries.some(e => e.apitFromT10 > 0) },
                  { label: 'Bank statements for the year (April 2024 – March 2025)', done: draft.bankBalances.length > 0 },
                  { label: 'AIT certificates from banks (if interest received)', done: draft.aitOnInterest > 0 },
                  { label: 'Receipts for any deductions you are claiming', done: draft.solarPanelExpenditure > 0 || draft.medicalExpenses > 0 || draft.housingLoanInterest > 0 },
                ].map(item => (
                  <li key={item.label} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className={cn('w-4 h-4 mt-0.5 shrink-0', item.done ? 'text-green-500' : 'text-muted-foreground/40')} />
                    <span className={item.done ? '' : 'text-muted-foreground'}>{item.label}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Step-by-step RAMIS guide */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Step 2 — Log in to RAMIS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary">
                <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <div>
                  <p className="text-sm font-medium">Open Chrome or Edge browser</p>
                  <p className="text-xs text-muted-foreground mt-1">RAMIS does not work well in Firefox or Safari. Use Google Chrome or Microsoft Edge only.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary">
                <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <div>
                  <p className="text-sm font-medium">Go to the RAMIS website</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs bg-muted px-2 py-0.5 rounded">ramis.ird.gov.lk</code>
                    <a href="https://ramis.ird.gov.lk" target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary flex items-center gap-1 hover:underline">
                      Open <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary">
                <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <div>
                  <p className="text-sm font-medium">Click "Taxpayer Login"</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter your <strong>TIN</strong> ({draft.tin || 'your TIN number'}) and your RAMIS password.
                    <br />
                    <strong>First time?</strong> Click "Register" → Choose "Individual" → Enter your NIC and TIN to create an account.
                    Your temporary password will be sent by SMS or email.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Step 3 — Start Your Tax Return</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  n: 4, title: 'Go to "Returns" in the menu',
                  desc: 'After logging in, look for the "Returns" or "File a Return" option in the main menu.',
                },
                {
                  n: 5, title: 'Select "Individual Income Tax Return"',
                  desc: 'Choose this option. Then select the Year of Assessment: 2024/2025.',
                },
                {
                  n: 6, title: 'Fill Schedule 1 — Employment Income',
                  desc: `Enter each employer's TIN, name, and remuneration. For APIT paid, enter the amount from your T.10 certificate (${formatCurrency(apitTotal)} total).`,
                },
                {
                  n: 7, title: 'Fill Schedule 3 — Investment Income',
                  desc: `Enter interest income (${formatCurrency(draft.interestIncome)}), AIT deducted (${formatCurrency(draft.aitOnInterest)}), dividends, and rent.`,
                },
                {
                  n: 8, title: 'Fill Part B — Reliefs & Deductions',
                  desc: `Enter solar panel relief (${formatCurrency(solarRelief)}), aggregate expenditure (${formatCurrency(aggregateRelief)}), and any donations. These reduce your tax.`,
                },
                {
                  n: 9, title: 'Fill Statement of Assets & Liabilities',
                  desc: `Enter the properties, vehicles, bank accounts, and loans from Step 6. Total assets: ${formatCurrency(totalAssets)}, Total liabilities: ${formatCurrency(totalLiabilities)}.`,
                },
                {
                  n: 10, title: 'Review and Submit',
                  desc: 'Check all figures carefully. RAMIS will show the tax calculated. If it matches your summary above, click "Submit". You will receive a Document Identification Number (DIN) — save this!',
                },
              ].map(item => (
                <div key={item.n} className="flex items-start gap-3 p-3 rounded-lg bg-secondary">
                  <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">{item.n}</span>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Payment instructions */}
          {taxBalance > 0 && (
            <Card className="border-destructive/30 border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-destructive">Step 4 — Pay Your Balance</CardTitle>
                <CardDescription>You have a balance of {formatCurrency(taxBalance)} to pay</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { n: 11, title: 'Note your DIN', desc: 'After submitting, RAMIS gives you a Document Identification Number (DIN). You need this to pay.' },
                  { n: 12, title: 'Go to your bank\'s internet banking', desc: 'Log in to your bank account online (Commercial Bank, Sampath, BOC, NSB, or any other bank).' },
                  { n: 13, title: 'Select "Tax Payment" or "IRD Payment"', desc: 'Look for a bill payment or government payment option. Select "Inland Revenue" or "IRD".' },
                  { n: 14, title: 'Enter DIN and pay', desc: `Enter your DIN, the amount (${formatCurrency(taxBalance)}), and confirm the payment. Keep the payment receipt.` },
                ].map(item => (
                  <div key={item.n} className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5">
                    <span className="w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs font-bold shrink-0">{item.n}</span>
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {taxBalance < 0 && (
            <Card className="border-green-400/30 border shadow-sm bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-green-600">You Have a Refund Coming!</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-700">
                  Your estimated refund is <strong>{formatCurrency(Math.abs(taxBalance))}</strong>.
                  After you submit your return on RAMIS, provide your bank account details for the refund.
                  The IRD typically processes refunds within a few weeks after the filing deadline.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Help */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: '📞', label: 'IRD Help Line', value: '1944', hint: 'Free call, Mon–Fri 8:30am–4:30pm' },
                { icon: '🌐', label: 'RAMIS Website',  value: 'ramis.ird.gov.lk', hint: 'Use Chrome or Edge' },
                { icon: '📍', label: 'IRD Offices',    value: 'Colombo & regional', hint: 'Bring NIC and TIN' },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-lg bg-secondary text-center">
                  <div className="text-2xl">{item.icon}</div>
                  <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                  <p className="text-sm font-medium">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.hint}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button
            className="w-full bg-navy text-white hover:bg-navy-600 border-0 print:hidden"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4 mr-2" /> Print This Summary
          </Button>
        </div>
      );

      default: return null;
    }
  }

  // ── Main render ────────────────────────────────────────────────────────────

  const currentStepInfo = STEPS[step - 1];
  const StepIcon = currentStepInfo.icon;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Page header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
          Tax Return Preparation
        </h1>
        <p className="text-muted-foreground mt-1">
          Year of Assessment {ASSESSMENT_YEAR} · Filing deadline: 30 November 2025
        </p>
      </div>

      {/* Progress bar — desktop */}
      <div className="hidden md:flex items-center gap-0">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const done    = step > s.number;
          const current = step === s.number;
          return (
            <div key={s.number} className="flex items-center flex-1 min-w-0">
              <button
                onClick={() => setStep(s.number)}
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors w-full',
                  current ? 'text-primary' : done ? 'text-green-600 cursor-pointer' : 'text-muted-foreground/50 cursor-default',
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center border-2',
                  current ? 'border-primary bg-primary/10' : done ? 'border-green-500 bg-green-50' : 'border-muted',
                )}>
                  {done
                    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                    : <Icon className="w-4 h-4" />
                  }
                </div>
                <span className="text-xs font-medium truncate w-full text-center leading-tight">{s.short}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <div className={cn('h-0.5 w-4 shrink-0', done ? 'bg-green-400' : 'bg-muted')} />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress — mobile */}
      <div className="md:hidden flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
            <StepIcon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Step {step} of {STEPS.length}</p>
            <p className="text-sm font-medium">{currentStepInfo.title}</p>
          </div>
        </div>
        <div className="flex gap-1">
          {STEPS.map(s => (
            <div key={s.number} className={cn(
              'w-2 h-2 rounded-full',
              s.number < step ? 'bg-green-500' : s.number === step ? 'bg-primary' : 'bg-muted',
            )} />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-display font-semibold flex items-center gap-2">
            <StepIcon className="w-5 h-5 text-primary" />
            {currentStepInfo.title}
          </h2>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-2 border-t print:hidden">
        <Button
          variant="outline"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        <span className="text-xs text-muted-foreground hidden sm:block">
          Progress saved automatically
        </span>

        {step < STEPS.length ? (
          <Button onClick={() => setStep(s => s + 1)} className="bg-navy text-white hover:bg-navy-600 border-0">
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={() => window.print()} variant="outline">
            <Printer className="w-4 h-4 mr-1" /> Print
          </Button>
        )}
      </div>
    </div>
  );
}
