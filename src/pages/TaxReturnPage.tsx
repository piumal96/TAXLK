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
import { AssessmentYearSelector } from '@/components/AssessmentYearSelector';
import {
  calculateTax,
  defaultFilingDeadlineLabel,
  formatAssessmentPeriodLabel,
  formatCurrency,
  parseAssessmentYearLabel,
  TAX_ASSESSMENT_YEAR,
  TAX_FREE_THRESHOLD,
} from '@/lib/taxCalculator';
import type { EmploymentIncome, InvestmentIncome, BusinessIncome, IncomeSource } from '@/types/income';
import { cn } from '@/lib/utils';
import { getTaxProfile } from '@/services/firebase/profileService';
import type { TaxProfile } from '@/types/taxProfile';
import { defaultTaxProfile } from '@/types/taxProfile';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmploymentEntry {
  sourceId: string;
  label: string;
  remuneration: number;    // auto-filled from app
  /** Mirrors Income Sources; non-APIT jobs excluded from estimated APIT allocation in summary tax math */
  apitApplicable: boolean;
  employerName: string;    // manual
  employerTIN: string;     // manual
  terminalBenefits: number; // manual — gratuity / EPF lump sum
  apitFromT10: number;     // manual — total APIT on T.10 certificate
}

interface PropertyEntry { description: string; cost: number; marketValue: number; }
interface VehicleEntry  { description: string; regNo: string; value: number; }
interface BankEntry     { bank: string; balance: number; interest: number; }
interface LoanEntry     { description: string; originalAmount: number; balance: number; }
// Capital flow — Section 126(2) of IR Act No.24/2017 — mandatory
interface AssetAcquisition { description: string; method: 'purchase' | 'gift' | 'inheritance'; date: string; value: number; }
interface AssetDisposal    { description: string; method: 'sale' | 'transfer' | 'gift'; date: string; proceeds: number; }

interface TaxReturnDraft {
  // Step 1 — Identity
  tin: string;
  nic: string;
  fullName: string;
  address: string;
  phone: string;
  isResident: boolean;
  isSeniorCitizen: boolean;
  // Step 2 — Employment
  employmentEntries: EmploymentEntry[];
  // Step 3 — Other Income
  interestIncome: number;
  aitOnInterest: number;
  dividendIncome: number;
  rentIncome: number;
  businessNetIncome: number;
  capitalGainsIncome: number;   // Schedule 3 — taxed at 10% separately
  lotteryOtherIncome: number;   // Schedule 4 — final WHT / other income
  foreignCurrencyRemitted: number; // Cage 210A — remittances from abroad
  // Step 4 — Deductions & Qualifying Payments
  solarPanelExpenditure: number;
  housingLoanInterest: number;
  medicalExpenses: number;
  educationExpenses: number;
  pensionContributions: number;
  cseInvestments: number;
  lifeInsurancePremiums: number; // Schedule 5A qualifying payment
  charitableDonations: number;
  govtDonations: number;
  // Step 5 — Credits
  installmentsPaid: number;
  // Step 6 Part 1 — Assets & Liabilities
  properties: PropertyEntry[];
  vehicles: VehicleEntry[];
  bankBalances: BankEntry[];
  sharesValue: number;
  cashInHand: number;
  jewelry: number;
  loans: LoanEntry[];
  // Step 6 Part 2 — Capital Flow (mandatory S.126(2))
  assetAcquisitions: AssetAcquisition[];
  assetDisposals: AssetDisposal[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SOLAR_RELIEF_MAX        = 600_000;
const AGGREGATE_RELIEF_MAX    = 900_000;
const LIFE_INSURANCE_MAX      = 100_000;  // Qualifying payment cap — Schedule 5A
const AIT_RATE                = 0.10;
const CAPITAL_GAINS_RATE      = 0.10;     // Schedule 8C — gain on realization of investment assets
const CHARITABLE_MAX_FLAT     = 75_000;
const DRAFT_KEY               = 'taxreturn-draft-2024-2025';

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
    isResident: true, isSeniorCitizen: false,
    employmentEntries: employmentSources.map(s => ({
      sourceId: s.id,
      label: s.label,
      remuneration: s.salary + s.bonus + s.allowances + s.benefits,
      apitApplicable: s.apitApplicable !== false,
      employerName: '', employerTIN: '', terminalBenefits: 0, apitFromT10: 0,
    })),
    interestIncome,
    aitOnInterest: interestIncome * AIT_RATE,
    dividendIncome,
    rentIncome,
    businessNetIncome,
    capitalGainsIncome: 0,
    lotteryOtherIncome: 0,
    foreignCurrencyRemitted: 0,
    solarPanelExpenditure: 0,
    housingLoanInterest: 0, medicalExpenses: 0, educationExpenses: 0,
    pensionContributions: 0, cseInvestments: 0,
    lifeInsurancePremiums: 0,
    charitableDonations: 0, govtDonations: 0,
    installmentsPaid: 0,
    properties: [], vehicles: [], bankBalances: [],
    sharesValue: 0, cashInHand: 0, jewelry: 0,
    loans: [],
    assetAcquisitions: [], assetDisposals: [],
  };
}

// Merge saved manual fields onto a fresh auto-filled draft
function mergeSaved(fresh: TaxReturnDraft, saved: Partial<TaxReturnDraft>): TaxReturnDraft {
  return {
    ...fresh,
    tin:            saved.tin      ?? '',
    nic:            saved.nic      ?? '',
    fullName:       saved.fullName ?? fresh.fullName,
    address:        saved.address  ?? '',
    phone:          saved.phone    ?? '',
    isResident:     saved.isResident      ?? true,
    isSeniorCitizen:saved.isSeniorCitizen ?? false,
    employmentEntries: fresh.employmentEntries.map((e, i) => ({
      ...e,
      employerName:     saved.employmentEntries?.[i]?.employerName     ?? '',
      employerTIN:      saved.employmentEntries?.[i]?.employerTIN      ?? '',
      terminalBenefits: saved.employmentEntries?.[i]?.terminalBenefits ?? 0,
      apitFromT10:      saved.employmentEntries?.[i]?.apitFromT10      ?? 0,
    })),
    capitalGainsIncome:      saved.capitalGainsIncome      ?? 0,
    lotteryOtherIncome:      saved.lotteryOtherIncome      ?? 0,
    foreignCurrencyRemitted: saved.foreignCurrencyRemitted ?? 0,
    solarPanelExpenditure:   saved.solarPanelExpenditure   ?? 0,
    housingLoanInterest:     saved.housingLoanInterest     ?? 0,
    medicalExpenses:         saved.medicalExpenses         ?? 0,
    educationExpenses:       saved.educationExpenses       ?? 0,
    pensionContributions:    saved.pensionContributions    ?? 0,
    cseInvestments:          saved.cseInvestments          ?? 0,
    lifeInsurancePremiums:   saved.lifeInsurancePremiums   ?? 0,
    charitableDonations:     saved.charitableDonations     ?? 0,
    govtDonations:           saved.govtDonations           ?? 0,
    installmentsPaid:        saved.installmentsPaid        ?? 0,
    properties:         saved.properties         ?? [],
    vehicles:           saved.vehicles           ?? [],
    bankBalances:       saved.bankBalances        ?? [],
    sharesValue:        saved.sharesValue         ?? 0,
    cashInHand:         saved.cashInHand          ?? 0,
    jewelry:            saved.jewelry             ?? 0,
    loans:              saved.loans               ?? [],
    assetAcquisitions:  saved.assetAcquisitions   ?? [],
    assetDisposals:     saved.assetDisposals      ?? [],
  };
}

/** Keep employment schedule aligned with Income Sources; preserve manual fields by `sourceId`. */
function syncEmploymentFromSources(draft: TaxReturnDraft, sources: IncomeSource[]): TaxReturnDraft {
  const freshEmploy = buildDraft(sources, draft.fullName || '').employmentEntries;
  const prevById = new Map(draft.employmentEntries.map((e) => [e.sourceId, e]));
  const employmentEntries = freshEmploy.map((f) => {
    const p = prevById.get(f.sourceId);
    if (!p) return f;
    return {
      ...f,
      employerName: p.employerName,
      employerTIN: p.employerTIN,
      terminalBenefits: p.terminalBenefits,
      apitFromT10: p.apitFromT10,
    };
  });
  return { ...draft, employmentEntries };
}

// Apply saved TaxProfile data to any fields that are still empty in the draft
// Uses || so manual user edits (already in localStorage) are never overwritten
function applyTaxProfile(draft: TaxReturnDraft, profile: TaxProfile): TaxReturnDraft {
  return {
    ...draft,
    tin:             draft.tin      || profile.tin,
    nic:             draft.nic      || profile.nic,
    fullName:        draft.fullName || profile.name,
    address:         draft.address  || profile.address,
    phone:           draft.phone    || profile.mobile || profile.phone,
    // Only override booleans if not yet touched (draft still at buildDraft defaults)
    isResident:      profile.is_resident      ?? draft.isResident,
    isSeniorCitizen: profile.is_senior_citizen ?? draft.isSeniorCitizen,
    employmentEntries: draft.employmentEntries.map((entry, i) => ({
      ...entry,
      employerName: entry.employerName || (i === 0 ? profile.employer_name : ''),
      employerTIN:  entry.employerTIN  || (i === 0 ? profile.employer_tin  : ''),
    })),
  };
}

// ─── Reusable small components ────────────────────────────────────────────────

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900">
      <div className="shrink-0 mt-0.5">
        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
          <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">{children}</p>
    </div>
  );
}

function AutoFilled({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-emerald-600 font-semibold pointer-events-none bg-white dark:bg-card pl-1">
        <Sparkles className="w-3 h-3" /> Auto-filled
      </span>
    </div>
  );
}

function FromProfile({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-blue-600 font-semibold pointer-events-none bg-white dark:bg-card pl-1">
        <User className="w-3 h-3" /> From Profile
      </span>
    </div>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground/80 mt-1.5 leading-relaxed">{children}</p>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-1 h-4 rounded-full bg-primary" />
      <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">{children}</h3>
    </div>
  );
}

function NumInput({
  value, onChange, placeholder = '0',
}: { value: number; onChange: (v: number) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none select-none">Rs.</span>
      <Input
        type="number"
        min={0}
        value={value === 0 ? '' : value}
        placeholder={placeholder}
        onChange={e => onChange(Number(e.target.value) || 0)}
        className="pl-8 text-right font-mono"
      />
    </div>
  );
}

function SummaryRow({
  label, value, sub, bold, highlight,
}: { label: string; value: string; sub?: boolean; bold?: boolean; highlight?: 'green' | 'red' | 'blue' }) {
  return (
    <div className={cn(
      'flex justify-between items-center py-2',
      sub ? 'pl-5 border-l-2 border-muted ml-1' : '',
      bold ? 'font-semibold' : '',
    )}>
      <span className={cn('text-sm', sub ? 'text-muted-foreground' : 'text-foreground')}>{label}</span>
      <span className={cn(
        'text-sm font-mono tabular-nums',
        highlight === 'green' && 'text-emerald-600 font-bold',
        highlight === 'red'   && 'text-destructive font-bold',
        highlight === 'blue'  && 'text-primary font-bold',
        bold && 'font-bold',
      )}>{value}</span>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function TaxReturnPage() {
  const { state } = useAppContext();
  const { user }  = useAuth();
  const assessmentYear = parseAssessmentYearLabel(state.assessmentYear) ?? TAX_ASSESSMENT_YEAR;
  const filingDeadlineText = defaultFilingDeadlineLabel(assessmentYear);

  const [step, setStep] = useState(1);
  const [taxProfile, setTaxProfile] = useState<TaxProfile>(defaultTaxProfile);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [draft, setDraft] = useState<TaxReturnDraft>(() =>
    buildDraft(state.incomeSources, state.profile.name || user?.name || '')
  );

  // Step 1: Load saved manual fields from localStorage
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

  // Reconcile employment rows when Income Sources change (labels, remuneration, APIT flag), keeping T.10 / employer data.
  useEffect(() => {
    setDraft((prev) => syncEmploymentFromSources(prev, state.incomeSources));
  }, [state.incomeSources]);

  // Step 2: Load TaxProfile from Firestore and apply to any still-empty fields
  useEffect(() => {
    if (!user) return;
    getTaxProfile(user.uid)
      .then((profile) => {
        setTaxProfile(profile);
        setDraft(prev => applyTaxProfile(prev, profile));
        // Only show "loaded" banner if profile has meaningful data
        if (profile.tin || profile.nic || profile.employer_name) {
          setProfileLoaded(true);
        }
      })
      .catch(() => { /* Firestore offline — drafts still work from localStorage */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

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
  const apitEligibleEmployment =
    draft.employmentEntries
      .filter(e => e.apitApplicable !== false)
      .reduce((s, e) => s + e.remuneration + e.terminalBenefits, 0);
  // Progressive income (excl. capital gains — taxed separately)
  const progressiveIncome           = totalEmployment + draft.interestIncome + draft.dividendIncome + draft.rentIncome + draft.businessNetIncome + draft.lotteryOtherIncome;
  const totalIncome                 = progressiveIncome + draft.capitalGainsIncome;

  const solarRelief       = Math.min(draft.solarPanelExpenditure, SOLAR_RELIEF_MAX);
  const aggregateRaw      = draft.housingLoanInterest + draft.medicalExpenses + draft.educationExpenses + draft.pensionContributions + draft.cseInvestments;
  const aggregateRelief   = Math.min(aggregateRaw, AGGREGATE_RELIEF_MAX);
  const lifeInsRelief     = Math.min(draft.lifeInsurancePremiums, LIFE_INSURANCE_MAX);

  // Charitable donation cap: lower of actual, LKR 75,000, or 1/3 of taxable income
  const grossTaxableIncome  = Math.max(0, progressiveIncome - TAX_FREE_THRESHOLD);
  const charityMax          = Math.min(draft.charitableDonations, CHARITABLE_MAX_FLAT, grossTaxableIncome / 3);
  const totalExtraRelief    = solarRelief + aggregateRelief + lifeInsRelief + charityMax + draft.govtDonations;

  // Progressive tax on employment/ordinary income (after reliefs)
  const adjustedIncome      = Math.max(0, progressiveIncome - totalExtraRelief);
  const adjEmployment       = progressiveIncome > 0 ? totalEmployment * (adjustedIncome / progressiveIncome) : 0;
  const adjAPITEligible =
    progressiveIncome > 0 ? apitEligibleEmployment * (adjustedIncome / progressiveIncome) : 0;
  const taxResult           = calculateTax(adjustedIncome, adjEmployment, adjAPITEligible);

  // Capital gains tax — Schedule 8C — flat 10% (not in progressive bands)
  const capitalGainsTax     = Math.round(draft.capitalGainsIncome * CAPITAL_GAINS_RATE);

  const apitTotal           = draft.employmentEntries.reduce((s, e) => s + e.apitFromT10, 0);
  const totalCredits        = apitTotal + draft.aitOnInterest + draft.installmentsPaid;
  const taxBalance          = taxResult.totalTax + capitalGainsTax - totalCredits;

  // ── Asset totals ──────────────────────────────────────────────────────────
  const totalAssets = draft.properties.reduce((s, p) => s + p.marketValue, 0)
    + draft.vehicles.reduce((s, v) => s + v.value, 0)
    + draft.bankBalances.reduce((s, b) => s + b.balance, 0)
    + draft.sharesValue + draft.cashInHand + draft.jewelry;
  const totalLiabilities = draft.loans.reduce((s, l) => s + l.balance, 0);
  const netWorth         = totalAssets - totalLiabilities;

  // ── Professional print / PDF ───────────────────────────────────────────────
  function printReturn() {
    const w = window.open('', '_blank');
    if (!w) { alert('Please allow pop-ups for this site, then try again.'); return; }

    const fc = formatCurrency;
    // Two-column data row: description left, amount right
    const row = (label: string, value: string, indent = false, bold = false, credit = false) =>
      `<tr class="${bold ? 'r-bold' : ''}${credit ? ' r-credit' : ''}">
        <td class="r-label${indent ? ' r-indent' : ''}">${label}</td>
        <td class="r-amt">${value}</td>
      </tr>`;

    const employSched = draft.employmentEntries.map((e, i) => `
      <tr><td colspan="2" class="subsec">Source ${i + 1}${e.label ? ': ' + e.label : ''}</td></tr>
      ${row('Employer Name', e.employerName || '—', true)}
      ${row('Employer TIN', e.employerTIN || '—', true)}
      ${row('Remuneration (from T.10)', fc(e.remuneration), true)}
      ${e.terminalBenefits > 0 ? row('Terminal Benefits / Gratuity', fc(e.terminalBenefits), true) : ''}
      ${row('APIT Deducted (T.10 certificate)', fc(e.apitFromT10), true)}
    `).join('');

    const propSched = draft.properties.length
      ? draft.properties.map(p => `<tr><td class="indent">${p.description || '—'}</td><td class="num">${fc(p.marketValue)}</td></tr>`).join('')
      : '<tr><td class="indent muted">None declared</td><td></td></tr>';

    const vehSched = draft.vehicles.length
      ? draft.vehicles.map(v => `<tr><td class="indent">${v.description || '—'} ${v.regNo ? '(' + v.regNo + ')' : ''}</td><td class="num">${fc(v.value)}</td></tr>`).join('')
      : '<tr><td class="indent muted">None declared</td><td></td></tr>';

    const bankSched = draft.bankBalances.length
      ? draft.bankBalances.map(b => `<tr><td class="indent">${b.bank || '—'}</td><td class="num">${fc(b.balance)}</td></tr>`).join('')
      : '<tr><td class="indent muted">None declared</td><td></td></tr>';

    const loanSched = draft.loans.length
      ? draft.loans.map(l => `<tr><td class="indent">${l.description || '—'} (Original: ${fc(l.originalAmount)})</td><td class="num">${fc(l.balance)}</td></tr>`).join('')
      : '<tr><td class="indent muted">None declared</td><td></td></tr>';

    const acqSched = draft.assetAcquisitions.length
      ? draft.assetAcquisitions.map(a => `<tr><td class="indent">${a.description || '—'} (${a.method}, ${a.date || 'date not specified'})</td><td class="num">${fc(a.value)}</td></tr>`).join('')
      : '<tr><td class="indent muted">None declared</td><td></td></tr>';

    const disSched = draft.assetDisposals.length
      ? draft.assetDisposals.map(d => `<tr><td class="indent">${d.description || '—'} (${d.method}, ${d.date || 'date not specified'})</td><td class="num">${fc(d.proceeds)}</td></tr>`).join('')
      : '<tr><td class="indent muted">None declared</td><td></td></tr>';

    const today = new Date().toLocaleDateString('en-LK', { day: '2-digit', month: 'long', year: 'numeric' });
    const yr0 = assessmentYear.split('/')[0];
    const yr1 = assessmentYear.split('/')[1];
    const grossTax = taxResult.totalTax + capitalGainsTax;

    // ── inline helpers ────────────────────────────────────────────────────────
    // Section header
    const sh = (num: string, title: string) =>
      `<div class="sh"><span class="sh-num">${num}</span><span class="sh-title">${title}</span></div>`;

    // Sub-section label (e.g. "Employer 1")
    const ssh = (title: string) =>
      `<div class="ssh">${title}</div>`;

    // Identity field cell
    const idCell = (label: string, value: string, wide = false) =>
      `<div class="id-cell${wide ? ' id-wide' : ''}">
        <div class="id-lbl">${label}</div>
        <div class="id-val">${value || '<span class="empty">—</span>'}</div>
      </div>`;

    // Amount line (label + amount, optional indent, bold, credit)
    const al = (label: string, amt: string, indent = false, bold = false, credit = false, strike = false) =>
      `<div class="al${indent?' al-i':''}${bold?' al-b':''}${credit?' al-c':''}${strike?' al-s':''}">
        <span class="al-label">${label}</span>
        <span class="al-amt">${amt}</span>
      </div>`;

    // Total line (navy bar)
    const tl = (label: string, amt: string) =>
      `<div class="tl"><span>${label}</span><span class="tl-amt">${amt}</span></div>`;

    // Sub-total line (light grey bar)
    const stl = (label: string, amt: string) =>
      `<div class="stl"><span>${label}</span><span class="stl-amt">${amt}</span></div>`;

    // Result line (balance / refund)
    const rl = (label: string, amt: string, type: 'pay' | 'refund') =>
      `<div class="rl rl-${type}">
        <div class="rl-label">${label}</div>
        <div class="rl-amt">${amt}</div>
      </div>`;

    // Slab table
    const slabTable = taxResult.breakdown && taxResult.breakdown.length > 0
      ? `<div class="slab-wrap">
          <div class="slab-title">Progressive Tax — Slab Calculation</div>
          <div class="slab-head"><span>Income Band</span><span class="slab-r">Rate</span><span class="slab-amt">Tax (Rs.)</span></div>
          ${taxResult.breakdown.map((s: {label: string; rate: number; tax: number}) =>
            `<div class="slab-row"><span>${s.label}</span><span class="slab-r">${(s.rate * 100).toFixed(0)}%</span><span class="slab-amt">${fc(s.tax)}</span></div>`
          ).join('')}
        </div>`
      : '';

    // Asset / disposal table rows
    const assetRow = (label: string, value: string) =>
      `<div class="al al-i"><span class="al-label">${label}</span><span class="al-amt">${value}</span></div>`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Individual Income Tax Return ${assessmentYear} — ${draft.fullName || 'Unnamed'}</title>
<style>
/* ════════════════════════════════════════════════════
   LANKA TAX HUB — Professional Print Stylesheet
   Designed for A4 print / browser Save-as-PDF
   ════════════════════════════════════════════════════ */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@page { size: A4 portrait; margin: 16mm 18mm 20mm 18mm; }

*, *::before, *::after { box-sizing: border-box; }
body {
  margin: 0;
  font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
  font-size: 9.5pt;
  line-height: 1.45;
  color: #111;
  background: #fff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ── Running page header (repeat on every page after first) ── */
.page-running-header {
  display: none;
  font-size: 8pt;
  color: #666;
  border-bottom: 0.75pt solid #ddd;
  padding-bottom: 4px;
  margin-bottom: 12px;
  justify-content: space-between;
}

/* ── Document master header (page 1 only) ── */
.doc-header {
  display: flex;
  align-items: stretch;
  border: 1.5pt solid #003057;
  margin-bottom: 14px;
}
.doc-header-brand {
  background: #003057;
  color: #fff;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 210px;
}
.doc-header-brand .country {
  font-size: 7pt;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.6);
  margin-bottom: 3px;
}
.doc-header-brand .org {
  font-size: 11pt;
  font-weight: 700;
  line-height: 1.2;
}
.doc-header-brand .org-sub {
  font-size: 7.5pt;
  color: rgba(255,255,255,0.7);
  margin-top: 2px;
}
.doc-header-right {
  flex: 1;
  padding: 10px 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-left: 1.5pt solid #003057;
}
.doc-header-right .form-type {
  font-size: 7pt;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #888;
  margin-bottom: 3px;
}
.doc-header-right .form-title {
  font-size: 14pt;
  font-weight: 700;
  color: #003057;
  line-height: 1.1;
}
.doc-header-right .form-ya {
  font-size: 9pt;
  color: #444;
  margin-top: 3px;
}
.doc-header-right .form-ya strong { color: #003057; }
.doc-header-tin {
  padding: 10px 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  border-left: 1pt solid #e0e0e0;
  min-width: 130px;
}
.doc-header-tin .tin-lbl {
  font-size: 7pt;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #888;
}
.doc-header-tin .tin-val {
  font-size: 11pt;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  color: #003057;
  margin-top: 2px;
}

/* ── Section header ── */
.sh {
  display: flex;
  align-items: center;
  gap: 0;
  margin-top: 14px;
  margin-bottom: 0;
  border-bottom: 2pt solid #003057;
  padding-bottom: 4px;
}
.sh-num {
  background: #003057;
  color: #fff;
  font-size: 7pt;
  font-weight: 700;
  padding: 2px 7px;
  letter-spacing: 0.5px;
  margin-right: 8px;
  white-space: nowrap;
}
.sh-title {
  font-size: 9pt;
  font-weight: 700;
  color: #003057;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

/* ── Sub-section ── */
.ssh {
  font-size: 8pt;
  font-weight: 600;
  color: #003057;
  background: #f0f3f7;
  padding: 3px 8px;
  border-left: 3pt solid #003057;
  margin-top: 6px;
}

/* ── Identity grid ── */
.id-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 0.75pt solid #ccc;
  margin-top: 6px;
}
.id-cell {
  padding: 5px 10px;
  border-right: 0.75pt solid #ccc;
  border-bottom: 0.75pt solid #ccc;
}
.id-wide { grid-column: 1 / -1; border-right: none; }
.id-cell:nth-child(even):not(.id-wide) { border-right: none; }
.id-lbl {
  font-size: 7pt;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #888;
  margin-bottom: 2px;
}
.id-val {
  font-size: 10pt;
  font-weight: 600;
  color: #111;
}
.empty { color: #bbb; font-weight: 400; }

/* ── Amount lines ── */
.al {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 3px 0;
  border-bottom: 0.5pt solid #f0f0f0;
  gap: 8px;
}
.al-label { flex: 1; color: #333; }
.al-amt {
  font-family: 'Courier New', monospace;
  font-size: 9.5pt;
  white-space: nowrap;
  min-width: 110px;
  text-align: right;
  color: #111;
}
.al-i .al-label { padding-left: 14px; font-size: 9pt; color: #555; }
.al-b .al-label { font-weight: 600; color: #111; }
.al-b .al-amt   { font-weight: 700; }
.al-c .al-label { color: #1a6b1a; }
.al-c .al-amt   { color: #1a6b1a; font-weight: 600; }
.al-s .al-label { text-decoration: line-through; color: #999; }

/* ── Total line (dark navy) ── */
.tl {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 5px 10px;
  background: #003057;
  color: #fff;
  font-weight: 700;
  font-size: 9.5pt;
  margin-top: 3px;
}
.tl-amt { font-family: 'Courier New', monospace; white-space: nowrap; min-width: 110px; text-align: right; }

/* ── Sub-total line (light) ── */
.stl {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 4px 10px;
  background: #eef1f6;
  font-weight: 600;
  font-size: 9pt;
  border-top: 1pt solid #c8d0dc;
  margin-top: 2px;
}
.stl-amt { font-family: 'Courier New', monospace; white-space: nowrap; min-width: 110px; text-align: right; color: #003057; }

/* ── Result line ── */
.rl {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  margin-top: 10px;
  border: 1.5pt solid;
  page-break-inside: avoid;
}
.rl-pay   { border-color: #c62828; background: #fff5f5; }
.rl-refund{ border-color: #2e7d32; background: #f1fff2; }
.rl-label { font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.rl-pay .rl-label   { color: #c62828; }
.rl-refund .rl-label{ color: #2e7d32; }
.rl-amt {
  font-family: 'Courier New', monospace;
  font-size: 16pt;
  font-weight: 700;
  letter-spacing: -0.5px;
}
.rl-pay .rl-amt   { color: #c62828; }
.rl-refund .rl-amt{ color: #2e7d32; }

/* ── Slab breakdown ── */
.slab-wrap {
  border: 0.75pt solid #d0d8e4;
  margin: 8px 0 4px 0;
  font-size: 8.5pt;
}
.slab-title {
  background: #f0f3f7;
  border-bottom: 0.75pt solid #d0d8e4;
  padding: 3px 8px;
  font-weight: 600;
  font-size: 8pt;
  color: #003057;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.slab-head, .slab-row {
  display: flex;
  padding: 2.5px 8px;
  border-bottom: 0.4pt solid #eee;
}
.slab-head { font-weight: 600; background: #f8f9fc; font-size: 7.5pt; }
.slab-head span, .slab-row span { flex: 1; }
.slab-r   { text-align: center; max-width: 50px; }
.slab-amt { text-align: right; font-family: 'Courier New', monospace; max-width: 120px; }

/* ── Section divider ── */
.divider { height: 0; border: none; border-top: 0.5pt solid #ddd; margin: 10px 0; }

/* ── Continuity header (pages 2+) ── */
.cont-hdr {
  display: flex;
  justify-content: space-between;
  font-size: 8pt;
  color: #666;
  padding-bottom: 4px;
  border-bottom: 0.75pt solid #ccc;
  margin-bottom: 12px;
}
.cont-hdr strong { color: #003057; }

/* ── Warning box ── */
.wbox {
  border-left: 3pt solid #d97706;
  background: #fffbeb;
  padding: 5px 10px;
  font-size: 8.5pt;
  margin: 6px 0;
  color: #78350f;
}

/* ── Declaration ── */
.decl-box {
  border: 0.75pt solid #aaa;
  padding: 10px 14px;
  margin-top: 18px;
  font-size: 8.5pt;
  line-height: 1.6;
  color: #333;
  page-break-inside: avoid;
}
.decl-title { font-weight: 700; font-size: 9pt; margin-bottom: 4px; color: #111; }
.sig-row { display: flex; gap: 40px; margin-top: 22px; }
.sig-block { flex: 1; border-top: 0.75pt solid #333; padding-top: 4px; font-size: 8pt; color: #555; }
.sig-name { font-weight: 600; color: #111; margin-top: 2px; }

/* ── Footer ── */
.doc-footer {
  position: running(footer);
  font-size: 7.5pt;
  color: #999;
  display: flex;
  justify-content: space-between;
  border-top: 0.5pt solid #ddd;
  padding-top: 3px;
}

/* ── Page break ── */
.pb { page-break-after: always; }
.no-break { page-break-inside: avoid; }

/* ── Notice box ── */
.notice {
  font-size: 8pt;
  color: #777;
  text-align: center;
  margin-top: 10px;
  font-style: italic;
}

@media print {
  .page-running-header { display: flex; }
}
</style>
</head>
<body>

<!-- ═══════════════════════════ PAGE 1 ═══════════════════════════ -->

<!-- Document Header -->
<div class="doc-header">
  <div class="doc-header-brand">
    <div class="country">Democratic Socialist Republic of Sri Lanka</div>
    <div class="org">Inland Revenue<br/>Department</div>
    <div class="org-sub">ආදායම් බදු දෙපාර්තමේන්තුව</div>
  </div>
  <div class="doc-header-right">
    <div class="form-type">Form IITRIT — Individual</div>
    <div class="form-title">Individual Income Tax Return</div>
    <div class="form-ya">Year of Assessment: <strong>${assessmentYear}</strong> &nbsp;|&nbsp; Period: 1 April ${yr0} – 31 March ${yr1}</div>
  </div>
  <div class="doc-header-tin">
    <div class="tin-lbl">TIN</div>
    <div class="tin-val">${draft.tin || '—'}</div>
  </div>
</div>

<!-- SECTION A: Taxpayer Information -->
${sh('A', 'Taxpayer Information')}
<div class="id-grid">
  ${idCell('Full Name (as per NIC)', draft.fullName, true)}
  ${idCell('Tax Identification Number (TIN)', draft.tin)}
  ${idCell('National Identity Card No. (NIC)', draft.nic)}
  ${idCell('Permanent Address (as at 31 March ' + yr1 + ')', draft.address, true)}
  ${idCell('Telephone / Mobile', draft.phone)}
  ${idCell('Residential Status', draft.isResident ? 'Resident' : 'Non-Resident')}
  ${idCell('Senior Citizen (age ≥ 60)', draft.isSeniorCitizen ? 'Yes' : 'No')}
  ${idCell('Date of Filing', today)}
</div>

<!-- SECTION B: Employment Income -->
${sh('B', 'Schedule 1 — Employment Income  (1 Apr ' + yr0 + ' – 31 Mar ' + yr1 + ')')}
${draft.employmentEntries.map((e, i) => `
  ${ssh('Employer ' + (i + 1) + (e.label ? ':  ' + e.label : ''))}
  ${al('Employer Name', e.employerName || '—', true)}
  ${al('Employer TIN', e.employerTIN || '—', true)}
  ${al('Gross Remuneration (per T.10)', fc(e.remuneration), true, true)}
  ${e.terminalBenefits > 0 ? al('Terminal Benefits / Gratuity', fc(e.terminalBenefits), true) : ''}
  ${al('APIT Deducted at Source (T.10)', '(' + fc(e.apitFromT10) + ')', true, false, true)}
`).join('')}
${tl('Total Employment Remuneration', fc(totalEmploymentRemuneration + totalTerminalBenefits))}

<!-- SECTION C: Investment & Other Income -->
${sh('C', 'Schedule 3 — Investment &amp; Other Income')}
${draft.interestIncome > 0   ? al('Interest Income (gross before AIT)', fc(draft.interestIncome), true) : ''}
${draft.dividendIncome > 0   ? al('Dividend Income', fc(draft.dividendIncome), true) : ''}
${draft.rentIncome > 0       ? al('Rent / Lease Income', fc(draft.rentIncome), true) : ''}
${draft.businessNetIncome > 0? al('Business / Profession Net Income', fc(draft.businessNetIncome), true) : ''}
${draft.lotteryOtherIncome > 0? al('Lottery Winnings / Other Income  (Schedule 4)', fc(draft.lotteryOtherIncome), true) : ''}
${draft.foreignCurrencyRemitted > 0 ? al('Foreign Currency Remitted to Sri Lanka  (Cage 210A)', fc(draft.foreignCurrencyRemitted), true) : ''}
${draft.capitalGainsIncome > 0 ? al('Capital Gains on Realization of Assets  (Schedule 8C — taxed @ flat 10%)', fc(draft.capitalGainsIncome), true) : ''}
${tl('Total Other Income (Schedules 3 + 4 + 8C)', fc(draft.interestIncome + draft.dividendIncome + draft.rentIncome + draft.businessNetIncome + draft.lotteryOtherIncome + draft.capitalGainsIncome))}

<div style="margin-top:6px;">
${tl('GROSS TOTAL INCOME', fc(totalIncome))}
</div>

<!-- ═════════════════════════ PAGE BREAK ═════════════════════════ -->
<div class="pb"></div>

<!-- Page 2 continuity header -->
<div class="cont-hdr">
  <span><strong>Individual Income Tax Return</strong> — Year of Assessment ${assessmentYear}</span>
  <span>${draft.fullName || ''}${draft.tin ? '  |  TIN: ' + draft.tin : ''}</span>
</div>

<!-- SECTION D: Reliefs & Qualifying Payments -->
${sh('D', 'Part B — Reliefs &amp; Qualifying Payments')}
${al('Personal Relief  (statutory — first Rs.1,800,000 of income is tax-free)', fc(TAX_FREE_THRESHOLD), false, true)}
${solarRelief > 0         ? al('Solar Panel Expenditure Relief  (max Rs.600,000)', fc(solarRelief), true) : ''}
${draft.housingLoanInterest > 0 ? al('Housing Loan Interest Paid', fc(draft.housingLoanInterest), true) : ''}
${draft.medicalExpenses > 0     ? al('Medical Expenses', fc(draft.medicalExpenses), true) : ''}
${draft.educationExpenses > 0   ? al('Educational Expenses', fc(draft.educationExpenses), true) : ''}
${draft.pensionContributions > 0? al('Pension / Provident Fund Contributions', fc(draft.pensionContributions), true) : ''}
${draft.cseInvestments > 0      ? al('Investments in CSE-Listed Companies', fc(draft.cseInvestments), true) : ''}
${aggregateRelief > 0           ? al('Aggregate Expenditure Relief  (max Rs.900,000)', fc(aggregateRelief), false, true) : ''}
${lifeInsRelief > 0             ? al('Life Insurance Premiums — Schedule 5A  (max Rs.100,000)', fc(lifeInsRelief), true) : ''}
${charityMax > 0                ? al('Charitable Donations to Approved Entities', fc(charityMax), true) : ''}
${draft.govtDonations > 0       ? al('Donations to Government / Approved Funds', fc(draft.govtDonations), true) : ''}
${stl('Total Reliefs &amp; Qualifying Payments', fc(totalExtraRelief))}

<!-- SECTION E: Tax Computation -->
${sh('E', 'Tax Computation')}
${al('Total Progressive Income', fc(progressiveIncome))}
${al('Less: Total Reliefs &amp; Qualifying Payments', '(' + fc(totalExtraRelief) + ')')}
${stl('Adjusted Taxable Income (Progressive)', fc(taxResult.taxableIncome))}

${slabTable}

${al('Tax on Progressive Income', fc(taxResult.totalTax), false, true)}
${capitalGainsTax > 0 ? al('Capital Gains Tax  (Schedule 8C — 10% flat rate × ' + fc(draft.capitalGainsIncome) + ')', fc(capitalGainsTax), true) : ''}
${stl('Gross Tax Liability', fc(grossTax))}

<!-- SECTION F: Tax Credits -->
${sh('F', 'Tax Credits')}
${apitTotal > 0           ? al('APIT Deducted at Source (T.10 certificates from employers)', '(' + fc(apitTotal) + ')', true, false, true) : ''}
${draft.aitOnInterest > 0 ? al('AIT Deducted at Source (bank certificates)', '(' + fc(draft.aitOnInterest) + ')', true, false, true) : ''}
${draft.installmentsPaid > 0 ? al('Self-Employment Tax (SET) Installments Paid', '(' + fc(draft.installmentsPaid) + ')', true, false, true) : ''}
${stl('Total Credits', '(' + fc(totalCredits) + ')')}

${rl(
  taxBalance > 0 ? 'Balance of Tax Payable' : 'Tax Refund Due',
  fc(Math.abs(taxBalance)),
  taxBalance > 0 ? 'pay' : 'refund'
)}

<!-- ═════════════════════════ PAGE BREAK ═════════════════════════ -->
<div class="pb"></div>

<!-- Page 3 continuity header -->
<div class="cont-hdr">
  <span><strong>Individual Income Tax Return</strong> — Year of Assessment ${assessmentYear}</span>
  <span>${draft.fullName || ''}${draft.tin ? '  |  TIN: ' + draft.tin : ''}</span>
</div>

<!-- SECTION G: Assets & Liabilities -->
${sh('G', 'Part C — Statement of Assets &amp; Liabilities  (as at 31 March ' + yr1 + ')')}

${ssh('Immovable Properties')}
${draft.properties.length
  ? draft.properties.map(p => assetRow(p.description || '—', fc(p.marketValue))).join('')
  : al('None declared', '', true)}

${ssh('Motor Vehicles')}
${draft.vehicles.length
  ? draft.vehicles.map(v => assetRow((v.description || '—') + (v.regNo ? '  (' + v.regNo + ')' : ''), fc(v.value))).join('')
  : al('None declared', '', true)}

${ssh('Bank &amp; Financial Accounts')}
${draft.bankBalances.length
  ? draft.bankBalances.map(b => assetRow(b.bank || '—', fc(b.balance))).join('')
  : al('None declared', '', true)}

${draft.sharesValue > 0  ? al('Shares / Unit Trust / Securities', fc(draft.sharesValue)) : ''}
${draft.cashInHand > 0   ? al('Cash in Hand', fc(draft.cashInHand)) : ''}
${draft.jewelry > 0      ? al('Jewellery / Gems / Collectibles', fc(draft.jewelry)) : ''}
${tl('TOTAL ASSETS', fc(totalAssets))}

<div style="margin-top:10px;">
${ssh('Loans &amp; Borrowings')}
${draft.loans.length
  ? draft.loans.map(l => assetRow((l.description || '—') + ' (original: ' + fc(l.originalAmount) + ')', fc(l.balance))).join('')
  : al('None declared', '', true)}
${tl('TOTAL LIABILITIES', fc(totalLiabilities))}
</div>

<div style="margin-top:6px;">
${rl('Net Worth (Assets − Liabilities)', fc(netWorth), netWorth >= 0 ? 'refund' : 'pay')}
</div>

<!-- SECTION H: Capital Flow -->
${sh('H', 'Part D — Capital Flow During the Year  (Section 126(2) IR Act No.24/2017)')}
<div class="wbox">
  <strong>Mandatory Disclosure:</strong> You must declare all assets acquired or disposed of during the year of assessment ${assessmentYear}, regardless of whether tax is payable on those transactions. Failure to disclose is an offence under the Inland Revenue Act.
</div>

${ssh('Assets Acquired  (purchased, gifted to you, or inherited)')}
${draft.assetAcquisitions.length
  ? draft.assetAcquisitions.map(a => assetRow(
      (a.description || '—') + '  <span style="color:#888;font-size:8pt;">[' + a.method + (a.date ? ', ' + a.date : '') + ']</span>',
      fc(a.value)
    )).join('')
  : al('None declared', '', true)}

${ssh('Assets Disposed  (sold, transferred, or gifted away)')}
${draft.assetDisposals.length
  ? draft.assetDisposals.map(d => assetRow(
      (d.description || '—') + '  <span style="color:#888;font-size:8pt;">[' + d.method + (d.date ? ', ' + d.date : '') + ']</span>',
      fc(d.proceeds)
    )).join('')
  : al('None declared', '', true)}

<!-- Declaration -->
<div class="decl-box">
  <div class="decl-title">Declaration</div>
  I hereby declare that the information furnished in this return is true, correct, and complete to the best of my knowledge and belief,
  and that no income chargeable to tax has been omitted. I understand that making a false declaration is an offence under
  the Inland Revenue Act No. 24 of 2017 and its amendments.
  <div class="sig-row">
    <div class="sig-block">
      Signature of Declarant
      <div class="sig-name" style="margin-top:18px;">${draft.fullName || ''}</div>
    </div>
    <div class="sig-block">
      Date
      <div class="sig-name" style="margin-top:18px;">${today}</div>
    </div>
    <div class="sig-block">
      For Official Use Only
      <div style="height:22px;"></div>
    </div>
  </div>
</div>

<div class="notice">
  Prepared using Lanka Tax Hub (lankataXhub.web.app) · This is a working copy — file your return officially at ramis.ird.gov.lk
</div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 500); }</script>
</body>
</html>`;

    w.document.write(html);
    w.document.close();
  }

  // ── Step content ──────────────────────────────────────────────────────────

  function renderStep() {
    switch (step) {

      // ── Step 1: Profile & TIN ──────────────────────────────────────────────
      case 1: return (
        <div className="space-y-5">

          {/* Profile loaded banner */}
          {profileLoaded && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">Profile data loaded automatically</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Your name, TIN, NIC and employer details were filled from your saved profile. You can edit any field.
                </p>
              </div>
            </div>
          )}

          {/* Missing profile nudge */}
          {!draft.tin && !draft.nic && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <AlertDescription className="text-amber-700 text-sm">
                <strong>Save time next year:</strong> Add your TIN and NIC to your{' '}
                <a href="/app/profile" className="underline font-medium">Profile</a>{' '}
                and these fields will auto-fill every year.
              </AlertDescription>
            </Alert>
          )}

          <InfoBox>
            <strong>What is a TIN?</strong> Your Tax Identification Number is a unique number the Inland Revenue
            Department (IRD) gives you. You need it to file your return on RAMIS. If you don't have one yet,
            register at <strong>ramis.ird.gov.lk</strong> or call the IRD helpline at <strong>1944</strong>.
          </InfoBox>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Full Name (as per NIC)</Label>
              {taxProfile.name && draft.fullName === taxProfile.name ? (
                <FromProfile>
                  <Input value={draft.fullName} onChange={e => update('fullName', e.target.value)} placeholder="e.g. Kasun Perera" className="pr-28" />
                </FromProfile>
              ) : (
                <Input value={draft.fullName} onChange={e => update('fullName', e.target.value)} placeholder="e.g. Kasun Perera" />
              )}
              <FieldHint>Enter your name exactly as printed on your National Identity Card.</FieldHint>
            </div>

            <div className="space-y-1.5">
              <Label>NIC Number</Label>
              {taxProfile.nic && draft.nic === taxProfile.nic ? (
                <FromProfile>
                  <Input value={draft.nic} onChange={e => update('nic', e.target.value)} placeholder="e.g. 199012345678 or 901234567V" className="pr-28" />
                </FromProfile>
              ) : (
                <Input value={draft.nic} onChange={e => update('nic', e.target.value)} placeholder="e.g. 199012345678 or 901234567V" />
              )}
              <FieldHint>Your 12-digit new NIC or old 9+V/X format.</FieldHint>
            </div>

            <div className="space-y-1.5">
              <Label>TIN (Tax Identification Number)</Label>
              {taxProfile.tin && draft.tin === taxProfile.tin ? (
                <FromProfile>
                  <Input value={draft.tin} onChange={e => update('tin', e.target.value)} placeholder="e.g. 123456789" className="pr-28" />
                </FromProfile>
              ) : (
                <Input value={draft.tin} onChange={e => update('tin', e.target.value)} placeholder="e.g. 123456789" />
              )}
              <FieldHint>
                Find your TIN on any letter from the IRD, or on your previous tax return. It's usually 9 digits.
              </FieldHint>
            </div>

            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              {(taxProfile.mobile || taxProfile.phone) && draft.phone === (taxProfile.mobile || taxProfile.phone) ? (
                <FromProfile>
                  <Input value={draft.phone} onChange={e => update('phone', e.target.value)} placeholder="e.g. 0771234567" className="pr-28" />
                </FromProfile>
              ) : (
                <Input value={draft.phone} onChange={e => update('phone', e.target.value)} placeholder="e.g. 0771234567" />
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Permanent Address</Label>
              {taxProfile.address && draft.address === taxProfile.address ? (
                <FromProfile>
                  <Input value={draft.address} onChange={e => update('address', e.target.value)} placeholder="Your permanent address as of 31 March 2025" className="pr-28" />
                </FromProfile>
              ) : (
                <Input value={draft.address} onChange={e => update('address', e.target.value)} placeholder="Your permanent address as of 31 March 2025" />
              )}
              <FieldHint>Your residential address as of 31 March 2025 (end of assessment year).</FieldHint>
            </div>
          </div>

          {/* Resident / Senior Citizen — from profile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <p className="text-sm font-medium flex items-center gap-1">
                  Resident Status
                  {taxProfile.tin && <Badge className="bg-blue-100 text-blue-700 text-xs ml-1 font-normal">From Profile</Badge>}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {draft.isResident ? 'Resident in Sri Lanka' : 'Non-resident'}
                </p>
              </div>
              <Switch checked={draft.isResident} onCheckedChange={v => update('isResident', v)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <p className="text-sm font-medium flex items-center gap-1">
                  Senior Citizen
                  {taxProfile.date_of_birth && <Badge className="bg-blue-100 text-blue-700 text-xs ml-1 font-normal">From Profile</Badge>}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {draft.isSeniorCitizen ? 'Yes — age 60+' : 'No'}
                </p>
              </div>
              <Switch checked={draft.isSeniorCitizen} onCheckedChange={v => update('isSeniorCitizen', v)} />
            </div>
          </div>

          <div className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-amber-200/70 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800/30">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">Year of Assessment: {assessmentYear}</p>
              <p className="text-xs text-amber-700/70 dark:text-amber-500 mt-0.5">
                Covers {formatAssessmentPeriodLabel(assessmentYear)} · Typical filing deadline:{' '}
                <strong>{filingDeadlineText}</strong> (confirm on IRD)
              </p>
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
                <Card key={entry.sourceId} className="rounded-xl overflow-hidden border border-border/60 shadow-sm bg-white dark:bg-card">
                  <div className="h-1 bg-gradient-to-r from-[#003057] to-[#0066aa]" />
                  <CardHeader className="pb-2 px-5 pt-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#003057]/10 flex items-center justify-center">
                        <Building2 className="w-3.5 h-3.5 text-[#003057]" />
                      </div>
                      {entry.label}
                      <Badge variant="outline" className="text-xs ml-auto font-normal">Employer {i + 1}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-5 pb-5">
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
                      <Label className="flex items-center gap-1">
                        Employer Name
                        {i === 0 && taxProfile.employer_name && entry.employerName === taxProfile.employer_name && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs ml-1 font-normal">From Profile</Badge>
                        )}
                      </Label>
                      {i === 0 && taxProfile.employer_name && entry.employerName === taxProfile.employer_name ? (
                        <FromProfile>
                          <Input
                            value={entry.employerName}
                            onChange={e => updateEntry(i, { employerName: e.target.value })}
                            placeholder="e.g. ABC Company (Pvt) Ltd"
                            className="pr-28"
                          />
                        </FromProfile>
                      ) : (
                        <Input
                          value={entry.employerName}
                          onChange={e => updateEntry(i, { employerName: e.target.value })}
                          placeholder="e.g. ABC Company (Pvt) Ltd"
                        />
                      )}
                      <FieldHint>Full registered name of your employer.</FieldHint>
                    </div>

                    {/* Employer TIN */}
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1">
                        Employer TIN
                        {i === 0 && taxProfile.employer_tin && entry.employerTIN === taxProfile.employer_tin && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs ml-1 font-normal">From Profile</Badge>
                        )}
                      </Label>
                      {i === 0 && taxProfile.employer_tin && entry.employerTIN === taxProfile.employer_tin ? (
                        <FromProfile>
                          <Input
                            value={entry.employerTIN}
                            onChange={e => updateEntry(i, { employerTIN: e.target.value })}
                            placeholder="e.g. 123456789"
                            className="pr-28"
                          />
                        </FromProfile>
                      ) : (
                        <Input
                          value={entry.employerTIN}
                          onChange={e => updateEntry(i, { employerTIN: e.target.value })}
                          placeholder="e.g. 123456789"
                        />
                      )}
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
          <Card className="rounded-xl border border-border/60 shadow-sm bg-white dark:bg-card">
            <CardHeader className="pb-2 px-5 pt-5">
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
          <Card className="rounded-xl border border-border/60 shadow-sm bg-white dark:bg-card">
            <CardHeader className="pb-2 px-5 pt-5">
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

          {/* Capital Gains — Schedule 3 / Schedule 8C */}
          <Card className="rounded-xl border border-border/60 shadow-sm bg-white dark:bg-card">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-base flex items-center justify-between">
                Capital Gains
                <Badge variant="outline" className="text-xs">Schedule 3 — taxed at flat 10%</Badge>
              </CardTitle>
              <CardDescription>Profit from selling land, shares, or other investment assets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-5 pb-5">
              <div className="space-y-1.5">
                <Label>Net Gain on Realization of Investment Assets (Rs.)</Label>
                <NumInput value={draft.capitalGainsIncome} onChange={v => update('capitalGainsIncome', v)} />
                <FieldHint>
                  Did you sell land, a house, shares, or any other investment asset this year? Enter the <em>profit</em> (sale price minus original cost).
                  Capital gains are taxed at a flat <strong>10%</strong> — separately from your income tax.
                  Leave at 0 if you did not sell any assets.
                </FieldHint>
              </div>
              {draft.capitalGainsIncome > 0 && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-orange-50 border border-orange-200 dark:bg-orange-950/30 dark:border-orange-800/40">
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-300">Capital Gains Tax (10% flat)</span>
                  <span className="font-mono font-bold text-orange-700 dark:text-orange-400 text-sm">{formatCurrency(draft.capitalGainsIncome * CAPITAL_GAINS_RATE)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lottery / Other Income — Schedule 4 */}
          <Card className="rounded-xl border border-border/60 shadow-sm bg-white dark:bg-card">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-base">Lottery Winnings / Other Income</CardTitle>
              <CardDescription>Schedule 4 — Any income not covered above</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-5 pb-5">
              <div className="space-y-1.5">
                <Label>Total Other Income (Rs.)</Label>
                <NumInput value={draft.lotteryOtherIncome} onChange={v => update('lotteryOtherIncome', v)} />
                <FieldHint>
                  Includes lottery winnings, prizes, annuity payments, gifts received (if taxable), or any income
                  not listed above. Most lottery prizes already have WHT deducted. Leave at 0 if none.
                </FieldHint>
              </div>
            </CardContent>
          </Card>

          {/* Foreign Currency Remitted — Cage 210A */}
          <Card className="rounded-xl border border-border/60 shadow-sm bg-white dark:bg-card">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-base">Foreign Currency Remitted to Sri Lanka</CardTitle>
              <CardDescription>Cage 210A — Summary of foreign income brought into Sri Lanka</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-5 pb-5">
              <div className="space-y-1.5">
                <Label>Total Foreign Currency Remitted (Rs. equivalent)</Label>
                <NumInput value={draft.foreignCurrencyRemitted} onChange={v => update('foreignCurrencyRemitted', v)} />
                <FieldHint>
                  If you received money from abroad (salary, freelance, business, investments), enter the
                  total Sri Lankan Rupee equivalent remitted into a local bank account during the year.
                  Leave at 0 if you did not receive any foreign income.
                </FieldHint>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between px-5 py-3.5 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/15">
            <span className="text-sm font-semibold text-foreground">Total Other Income (excl. Capital Gains)</span>
            <span className="text-sm font-bold font-mono text-primary">
              {formatCurrency(draft.interestIncome + draft.dividendIncome + draft.rentIncome + draft.businessNetIncome + draft.lotteryOtherIncome)}
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
          <Card className="rounded-xl border border-border/60 shadow-sm bg-white dark:bg-card">
            <CardContent className="px-5 pb-5 pt-0">
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
          <Card className="rounded-xl border border-border/60 shadow-sm bg-white dark:bg-card">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-base">Solar Panel Relief</CardTitle>
              <CardDescription>Max relief: {formatCurrency(SOLAR_RELIEF_MAX)} per year</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-5 pb-5">
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
          <Card className="rounded-xl border border-border/60 shadow-sm bg-white dark:bg-card">
            <CardHeader className="pb-2 px-5 pt-5">
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

          {/* Life Insurance — Schedule 5A qualifying payment */}
          <Card className="rounded-xl border border-border/60 shadow-sm bg-white dark:bg-card">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-base">Life Insurance Premiums</CardTitle>
              <CardDescription>
                Schedule 5A qualifying payment — max relief: {formatCurrency(LIFE_INSURANCE_MAX)} per year
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-5 pb-5">
              <div className="space-y-1.5">
                <Label>Total Life Insurance Premiums Paid This Year</Label>
                <NumInput value={draft.lifeInsurancePremiums} onChange={v => update('lifeInsurancePremiums', v)} />
                <FieldHint>
                  Premiums paid to a life insurance policy in your name. You can claim up to LKR 100,000.
                  Keep your insurance policy receipt or annual premium statement as proof.
                  Leave at 0 if you don't have a life insurance policy.
                </FieldHint>
              </div>
              {draft.lifeInsurancePremiums > 0 && (
                <p className="text-xs text-green-600 font-medium">
                  Relief applied: {formatCurrency(lifeInsRelief)}
                  {draft.lifeInsurancePremiums > LIFE_INSURANCE_MAX ? ` (capped at ${formatCurrency(LIFE_INSURANCE_MAX)})` : ''}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Qualifying Payments */}
          <Card className="rounded-xl border border-border/60 shadow-sm bg-white dark:bg-card">
            <CardHeader className="pb-2 px-5 pt-5">
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

          <Card className="rounded-xl border border-border/60 shadow-sm bg-white dark:bg-card">
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

          <Card className="rounded-xl border border-border/60 shadow-sm bg-white dark:bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Reliefs & Deductions</CardTitle>
            </CardHeader>
            <CardContent>
              <SummaryRow label="Personal Relief (tax-free threshold)" value={`(${formatCurrency(TAX_FREE_THRESHOLD)})`} />
              {solarRelief > 0          && <SummaryRow label="Solar Panel Relief" value={`(${formatCurrency(solarRelief)})`} sub />}
              {aggregateRelief > 0      && <SummaryRow label="Aggregate Expenditure Relief" value={`(${formatCurrency(aggregateRelief)})`} sub />}
              {lifeInsRelief > 0        && <SummaryRow label="Life Insurance Premiums" value={`(${formatCurrency(lifeInsRelief)})`} sub />}
              {charityMax > 0           && <SummaryRow label="Charitable Donations" value={`(${formatCurrency(charityMax)})`} sub />}
              {draft.govtDonations > 0  && <SummaryRow label="Government Fund Donations" value={`(${formatCurrency(draft.govtDonations)})`} sub />}
              <Separator className="my-2" />
              <SummaryRow label="Taxable Income" value={formatCurrency(taxResult.taxableIncome)} bold highlight="blue" />
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-border/60 shadow-sm bg-white dark:bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tax Calculation</CardTitle>
            </CardHeader>
            <CardContent>
              {taxResult.breakdown.map((b, i) => (
                <SummaryRow key={i} label={`${b.label} @ ${(b.rate * 100).toFixed(0)}%`} value={formatCurrency(b.tax)} sub />
              ))}
              <Separator className="my-2" />
              <SummaryRow label="Tax on Ordinary Income (progressive)" value={formatCurrency(taxResult.totalTax)} bold />
              {capitalGainsTax > 0 && <SummaryRow label="Capital Gains Tax (10% flat — Sch.8C)" value={formatCurrency(capitalGainsTax)} sub />}
              <SummaryRow label="Gross Tax Liability" value={formatCurrency(taxResult.totalTax + capitalGainsTax)} bold highlight="blue" />
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-border/60 shadow-sm bg-white dark:bg-card">
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
          <div className={cn(
            'rounded-2xl px-6 py-5 flex items-center justify-between gap-4 border shadow-lg',
            taxBalance > 0
              ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200 dark:from-red-950/40 dark:to-red-950/20 dark:border-red-800/40'
              : 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 dark:from-emerald-950/40 dark:to-emerald-950/20 dark:border-emerald-800/40',
          )}>
            <div>
              <p className={cn('text-xs font-bold uppercase tracking-widest mb-1', taxBalance > 0 ? 'text-red-500' : 'text-emerald-600')}>
                {taxBalance > 0 ? '⚠ Balance Payable' : '✓ Estimated Refund'}
              </p>
              <p className={cn('text-3xl font-display font-black tabular-nums', taxBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')}>
                {formatCurrency(Math.abs(taxBalance))}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-xs">
                {taxBalance > 0
                  ? 'Pay this when you file on RAMIS. Use your DIN and internet banking.'
                  : 'IRD will refund this after your return is processed. Provide your bank account details.'}
              </p>
            </div>
            <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-2xl',
              taxBalance > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'
            )}>
              {taxBalance > 0 ? '📤' : '📥'}
            </div>
          </div>

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
          <Card className="rounded-xl border border-border/60 shadow-sm bg-white dark:bg-card">
            <CardHeader className="px-5 pt-5 pb-3 flex flex-row items-center justify-between">
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
              <CardContent className="space-y-4 px-5 pb-5">
                {draft.properties.map((p, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto] gap-3 p-4 rounded-xl bg-gray-50/70 dark:bg-secondary/60 border border-border/40">
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
          <Card className="rounded-xl border border-border/60 shadow-sm bg-white dark:bg-card">
            <CardHeader className="px-5 pt-5 pb-3 flex flex-row items-center justify-between">
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
              <CardContent className="space-y-4 px-5 pb-5">
                {draft.vehicles.map((v, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto] gap-3 p-4 rounded-xl bg-gray-50/70 dark:bg-secondary/60 border border-border/40">
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
          <Card className="rounded-xl border border-border/60 shadow-sm bg-white dark:bg-card">
            <CardHeader className="px-5 pt-5 pb-3 flex flex-row items-center justify-between">
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
              <CardContent className="space-y-4 px-5 pb-5">
                {draft.bankBalances.map((b, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto] gap-3 p-4 rounded-xl bg-gray-50/70 dark:bg-secondary/60 border border-border/40">
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
          <Card className="rounded-xl border border-border/60 shadow-sm bg-white dark:bg-card">
            <CardHeader className="pb-2 px-5 pt-5">
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
          <Card className="rounded-xl border border-border/60 shadow-sm bg-white dark:bg-card">
            <CardHeader className="px-5 pt-5 pb-3 flex flex-row items-center justify-between">
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
              <CardContent className="space-y-4 px-5 pb-5">
                {draft.loans.map((l, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto] gap-3 p-4 rounded-xl bg-gray-50/70 dark:bg-secondary/60 border border-border/40">
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
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Assets', value: formatCurrency(totalAssets), color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Total Liabilities', value: formatCurrency(totalLiabilities), color: 'text-red-500' },
              { label: 'Net Worth', value: formatCurrency(netWorth), color: netWorth >= 0 ? 'text-primary' : 'text-red-600' },
            ].map(item => (
              <div key={item.label} className="rounded-xl border border-border/50 bg-gray-50/60 dark:bg-secondary/40 px-4 py-3 text-center">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">{item.label}</p>
                <p className={cn('text-sm font-mono font-bold', item.color)}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* ── Part 2: Capital Flow — Section 126(2) IR Act ── */}
          <div className="pt-2">
            <p className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">Part 2 — Capital Flow During the Year</p>
            <Alert className="bg-amber-50 border-amber-200 mb-4">
              <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <AlertDescription className="text-amber-700 text-sm">
                <strong>Mandatory under Section 126(2) of the Inland Revenue Act.</strong> You must declare any assets you
                acquired (bought, received as gift, inherited) or disposed of (sold, transferred, gifted) during
                1 April 2024 – 31 March 2025. The IRD uses this to verify your income matches your lifestyle.
              </AlertDescription>
            </Alert>
          </div>

          {/* Assets Acquired */}
          <Card className="rounded-xl border border-border/60 shadow-sm bg-white dark:bg-card">
            <CardHeader className="px-5 pt-5 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Assets Acquired During the Year</CardTitle>
                <CardDescription>Any asset you bought, received as a gift, or inherited</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() =>
                update('assetAcquisitions', [...draft.assetAcquisitions, { description: '', method: 'purchase', date: '', value: 0 }])
              }>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </CardHeader>
            {draft.assetAcquisitions.length > 0 && (
              <CardContent className="space-y-4 px-5 pb-5">
                {draft.assetAcquisitions.map((a, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto] gap-3 p-4 rounded-xl bg-gray-50/70 dark:bg-secondary/60 border border-border/40">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div className="sm:col-span-2">
                        <Label className="text-xs">Description</Label>
                        <Input value={a.description} onChange={e => {
                          const arr = [...draft.assetAcquisitions]; arr[i] = { ...arr[i], description: e.target.value };
                          update('assetAcquisitions', arr);
                        }} placeholder="e.g. Land in Kandy, Toyota Prius" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">How Acquired</Label>
                        <Select value={a.method} onValueChange={v => {
                          const arr = [...draft.assetAcquisitions]; arr[i] = { ...arr[i], method: v as AssetAcquisition['method'] };
                          update('assetAcquisitions', arr);
                        }}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="purchase">Purchase</SelectItem>
                            <SelectItem value="gift">Gift</SelectItem>
                            <SelectItem value="inheritance">Inheritance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Cost / Market Value (Rs.)</Label>
                        <NumInput value={a.value} onChange={v => {
                          const arr = [...draft.assetAcquisitions]; arr[i] = { ...arr[i], value: v };
                          update('assetAcquisitions', arr);
                        }} />
                      </div>
                    </div>
                    <button onClick={() => update('assetAcquisitions', draft.assetAcquisitions.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-destructive mt-5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </CardContent>
            )}
            {draft.assetAcquisitions.length === 0 && (
              <CardContent>
                <p className="text-xs text-muted-foreground">No acquisitions — click Add if you bought, received, or inherited any asset during the year.</p>
              </CardContent>
            )}
          </Card>

          {/* Assets Disposed */}
          <Card className="rounded-xl border border-border/60 shadow-sm bg-white dark:bg-card">
            <CardHeader className="px-5 pt-5 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Assets Disposed During the Year</CardTitle>
                <CardDescription>Any asset you sold, transferred, or gifted away</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() =>
                update('assetDisposals', [...draft.assetDisposals, { description: '', method: 'sale', date: '', proceeds: 0 }])
              }>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </CardHeader>
            {draft.assetDisposals.length > 0 && (
              <CardContent className="space-y-4 px-5 pb-5">
                {draft.assetDisposals.map((d, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto] gap-3 p-4 rounded-xl bg-gray-50/70 dark:bg-secondary/60 border border-border/40">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Input value={d.description} onChange={e => {
                          const arr = [...draft.assetDisposals]; arr[i] = { ...arr[i], description: e.target.value };
                          update('assetDisposals', arr);
                        }} placeholder="e.g. Shares — John Keells Holdings" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">How Disposed</Label>
                        <Select value={d.method} onValueChange={v => {
                          const arr = [...draft.assetDisposals]; arr[i] = { ...arr[i], method: v as AssetDisposal['method'] };
                          update('assetDisposals', arr);
                        }}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sale">Sale</SelectItem>
                            <SelectItem value="transfer">Transfer</SelectItem>
                            <SelectItem value="gift">Gift</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Sale Proceeds / Value (Rs.)</Label>
                        <NumInput value={d.proceeds} onChange={v => {
                          const arr = [...draft.assetDisposals]; arr[i] = { ...arr[i], proceeds: v };
                          update('assetDisposals', arr);
                        }} />
                      </div>
                    </div>
                    <button onClick={() => update('assetDisposals', draft.assetDisposals.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-destructive mt-5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </CardContent>
            )}
            {draft.assetDisposals.length === 0 && (
              <CardContent>
                <p className="text-xs text-muted-foreground">No disposals — click Add if you sold, transferred, or gave away any asset during the year.</p>
              </CardContent>
            )}
          </Card>
        </div>
      );

      // ── Step 7: RAMIS Filing Guide ──────────────────────────────────────────
      case 7: return (
        <div className="space-y-5 print:text-black">

          {/* Final summary */}
          <div className="rounded-2xl overflow-hidden border border-[#003057]/20 shadow-lg shadow-[#003057]/10">
            <div className="bg-gradient-to-r from-[#002647] to-[#003d6b] px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <ClipboardCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Your Return Summary</p>
                <p className="text-white/55 text-xs">Year of Assessment {assessmentYear} · Take these to RAMIS</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-border/30">
              {[
                { label: 'Total Income',   value: formatCurrency(totalIncome),             accent: false },
                { label: 'Taxable Income', value: formatCurrency(taxResult.taxableIncome), accent: false },
                { label: 'Tax Liability',  value: formatCurrency(taxResult.totalTax),      accent: false },
                { label: 'APIT Paid',      value: formatCurrency(apitTotal),               accent: false },
                { label: 'AIT Paid',       value: formatCurrency(draft.aitOnInterest),     accent: false },
                {
                  label: taxBalance > 0 ? 'Balance Payable' : 'Refund Due',
                  value: formatCurrency(Math.abs(taxBalance)),
                  accent: true,
                },
              ].map(item => (
                <div key={item.label} className={cn('px-4 py-3 bg-white dark:bg-card', item.accent && (taxBalance > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30'))}>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{item.label}</p>
                  <p className={cn('text-sm font-bold font-mono mt-0.5', item.accent && (taxBalance > 0 ? 'text-red-600' : 'text-emerald-600'))}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Documents checklist */}
          <Card className="rounded-xl border border-border/60 shadow-sm bg-white dark:bg-card">
            <CardHeader className="pb-2 px-5 pt-5">
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
          <Card className="rounded-xl border border-border/60 shadow-sm bg-white dark:bg-card">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-base">Step 2 — Log in to RAMIS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-5 pb-5">
              <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-gray-50/70 dark:bg-secondary/50 border border-border/40">
                <span className="w-7 h-7 rounded-full bg-[#003057] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">1</span>
                <div>
                  <p className="text-sm font-medium">Open Chrome or Edge browser</p>
                  <p className="text-xs text-muted-foreground mt-1">RAMIS does not work well in Firefox or Safari. Use Google Chrome or Microsoft Edge only.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-gray-50/70 dark:bg-secondary/50 border border-border/40">
                <span className="w-7 h-7 rounded-full bg-[#003057] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">2</span>
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
              <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-gray-50/70 dark:bg-secondary/50 border border-border/40">
                <span className="w-7 h-7 rounded-full bg-[#003057] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">3</span>
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

          <Card className="rounded-xl border border-border/60 shadow-sm bg-white dark:bg-card">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-base">Step 3 — Start Your Tax Return</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-5 pb-5">
              {[
                {
                  n: 4, title: 'Go to "Returns" in the menu',
                  desc: 'After logging in, look for the "Returns" or "File a Return" option in the main menu.',
                },
                {
                  n: 5, title: 'Select "Individual Income Tax Return"',
                  desc: `Choose this option. Then select the Year of Assessment (e.g. ${assessmentYear}) in RAMIS to match this return.`,
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
                <div key={item.n} className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-gray-50/70 dark:bg-secondary/50 border border-border/40">
                  <span className="w-7 h-7 rounded-full bg-[#003057] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">{item.n}</span>
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
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-base text-destructive">Step 4 — Pay Your Balance</CardTitle>
                <CardDescription>You have a balance of {formatCurrency(taxBalance)} to pay</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-5 pb-5">
                {[
                  { n: 11, title: 'Note your DIN', desc: 'After submitting, RAMIS gives you a Document Identification Number (DIN). You need this to pay.' },
                  { n: 12, title: 'Go to your bank\'s internet banking', desc: 'Log in to your bank account online (Commercial Bank, Sampath, BOC, NSB, or any other bank).' },
                  { n: 13, title: 'Select "Tax Payment" or "IRD Payment"', desc: 'Look for a bill payment or government payment option. Select "Inland Revenue" or "IRD".' },
                  { n: 14, title: 'Enter DIN and pay', desc: `Enter your DIN, the amount (${formatCurrency(taxBalance)}), and confirm the payment. Keep the payment receipt.` },
                ].map(item => (
                  <div key={item.n} className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-50/70 dark:bg-destructive/10 border border-red-100 dark:border-red-900/30">
                    <span className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">{item.n}</span>
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
              <CardHeader className="pb-2 px-5 pt-5">
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
          <Card className="rounded-xl border border-border/60 shadow-sm bg-white dark:bg-card">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-base">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: '📞', label: 'IRD Help Line', value: '1944', hint: 'Free call, Mon–Fri 8:30am–4:30pm' },
                { icon: '🌐', label: 'RAMIS Website',  value: 'ramis.ird.gov.lk', hint: 'Use Chrome or Edge' },
                { icon: '📍', label: 'IRD Offices',    value: 'Colombo & regional', hint: 'Bring NIC and TIN' },
              ].map(item => (
                <div key={item.label} className="flex flex-col items-center gap-2 px-3 py-4 rounded-xl border border-border/50 bg-gray-50/60 dark:bg-secondary/40 text-center">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-card border border-border/50 shadow-sm flex items-center justify-center text-xl">{item.icon}</div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{item.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.hint}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <button
            onClick={printReturn}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-[#003057] to-[#005080] hover:from-[#002040] hover:to-[#003d6b] text-white font-semibold text-sm shadow-lg shadow-[#003057]/25 transition-all duration-200 hover:shadow-xl hover:shadow-[#003057]/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="font-bold">Download / Print Professional Tax Return</p>
              <p className="text-white/60 text-xs font-normal">Opens a clean A4 document ready to print or save as PDF</p>
            </div>
          </button>
        </div>
      );

      default: return null;
    }
  }

  // ── Main render ────────────────────────────────────────────────────────────

  const currentStepInfo = STEPS[step - 1];
  const StepIcon = currentStepInfo.icon;
  const progressPct = Math.round(((step - 1) / (STEPS.length - 1)) * 100);

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-5">

      {/* ── Hero header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#002647] via-[#003057] to-[#00426e] px-6 py-6 text-white shadow-xl shadow-[#003057]/20">
        {/* subtle dot-grid texture */}
        <div className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        {/* gold accent stripe */}
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#F7B718] via-[#F7B718]/60 to-transparent rounded-l-2xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F7B718]/20 border border-[#F7B718]/30 text-xs font-semibold text-amber-200">
                Typical deadline: {filingDeadlineText}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight leading-tight">
              Individual Income Tax Return
            </h1>
            <p className="text-white/55 text-sm mt-1">Sri Lanka Inland Revenue Department · RAMIS Filing Assistant</p>
            <div className="mt-4 max-w-md rounded-xl bg-black/20 border border-white/10 p-4 backdrop-blur-sm">
              <AssessmentYearSelector variant="onDark" />
            </div>
          </div>

          {/* Live balance pill */}
          <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Estimated Balance</p>
            <div className={cn(
              'inline-flex items-center px-4 py-2 rounded-xl font-mono font-bold text-base border backdrop-blur-sm',
              taxBalance > 0  ? 'bg-red-500/15 border-red-400/30 text-red-200' :
              taxBalance < 0  ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300' :
                                'bg-white/10 border-white/15 text-white/80'
            )}>
              {taxBalance > 0  ? `Pay ${formatCurrency(taxBalance)}` :
               taxBalance < 0  ? `Refund ${formatCurrency(Math.abs(taxBalance))}` :
                                 'Rs. 0'}
            </div>
            {/* mini progress */}
            <div className="flex items-center gap-2 mt-1">
              <div className="w-24 h-1 rounded-full bg-white/15 overflow-hidden">
                <div className="h-full bg-[#F7B718] rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="text-[11px] text-white/40">{progressPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Step indicator — desktop ── */}
      <div className="hidden md:block bg-white dark:bg-card rounded-2xl border border-border/60 shadow-sm px-6 pt-5 pb-4">
        <div className="flex items-start">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const done    = step > s.number;
            const current = step === s.number;
            return (
              <div key={s.number} className={cn('flex items-start', idx < STEPS.length - 1 ? 'flex-1' : '')}>
                <div className="flex flex-col items-center gap-2 min-w-0">
                  <button
                    onClick={() => done ? setStep(s.number) : undefined}
                    className={cn('w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-200 shrink-0',
                      current ? 'bg-[#003057] border-[#003057] text-white shadow-lg shadow-[#003057]/30 scale-110' :
                      done    ? 'bg-emerald-500 border-emerald-500 text-white cursor-pointer hover:scale-105' :
                                'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 cursor-default',
                    )}
                  >
                    {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                  </button>
                  <span className={cn('text-[11px] font-semibold text-center leading-tight px-1 max-w-[64px]',
                    current ? 'text-[#003057] dark:text-primary' :
                    done    ? 'text-emerald-600' :
                              'text-gray-400',
                  )}>{s.short}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn('flex-1 h-0.5 mt-[18px] mx-2 rounded-full transition-all duration-500',
                    done    ? 'bg-emerald-400' :
                    current ? 'bg-gradient-to-r from-[#003057] to-gray-200 dark:to-gray-700' :
                              'bg-gray-200 dark:bg-gray-700',
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Mobile step indicator ── */}
      <div className="md:hidden bg-white dark:bg-card rounded-2xl border border-border/60 shadow-sm px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#003057] flex items-center justify-center shadow-md shadow-[#003057]/25">
              <StepIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Step {step} of {STEPS.length}</p>
              <p className="text-sm font-bold text-foreground leading-tight">{currentStepInfo.title}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#003057]">{progressPct}%</span>
        </div>
        {/* pill progress track */}
        <div className="flex gap-1.5">
          {STEPS.map(s => (
            <div key={s.number} className={cn('h-1.5 rounded-full transition-all duration-300 flex-1',
              s.number < step  ? 'bg-emerald-400' :
              s.number === step ? 'bg-[#003057]' :
                                  'bg-gray-200 dark:bg-gray-700',
            )} />
          ))}
        </div>
      </div>

      {/* ── Step content card ── */}
      <div className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {/* Step title bar */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50 bg-gray-50/80 dark:bg-secondary/20">
          <div className="w-8 h-8 rounded-lg bg-[#003057]/10 dark:bg-[#003057]/30 flex items-center justify-center">
            <StepIcon className="w-4 h-4 text-[#003057] dark:text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-display font-bold text-foreground">{currentStepInfo.title}</h2>
            <p className="text-xs text-muted-foreground">Step {step} of {STEPS.length}</p>
          </div>
          {/* mini income badge */}
          <div className="hidden sm:flex flex-col items-end shrink-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Income</p>
            <p className="text-sm font-mono font-bold text-foreground">{formatCurrency(totalIncome)}</p>
          </div>
        </div>

        {/* Step body */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-border/50 bg-gray-50/60 dark:bg-secondary/10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className="gap-1.5 px-4 rounded-xl font-medium"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>

          <span className="text-[11px] text-muted-foreground hidden sm:flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Saved automatically
          </span>

          {step < STEPS.length ? (
            <Button
              size="sm"
              onClick={() => setStep(s => s + 1)}
              className="gap-1.5 px-5 rounded-xl font-semibold bg-[#003057] hover:bg-[#004070] text-white border-0 shadow-md shadow-[#003057]/20"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={printReturn}
              className="gap-1.5 px-5 rounded-xl font-semibold bg-[#003057] hover:bg-[#004070] text-white border-0 shadow-md shadow-[#003057]/20"
            >
              <Printer className="w-4 h-4" /> Print / PDF
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
