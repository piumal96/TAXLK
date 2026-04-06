import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Sparkles, Bot, User, Loader2, ChevronDown,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { streamChatMessage, type ChatMessage } from '@/services/openRouterService';
import {
  calculateTax,
  formatCurrency,
  formatAssessmentPeriodLabel,
  defaultFilingDeadlineLabel,
  TAX_FREE_THRESHOLD,
  TAX_SLABS,
} from '@/lib/taxCalculator';
import {
  getAllIncomeTotal,
  getEmploymentTotal,
  getAPITEligibleEmploymentTotal,
  getInvestmentRentRepairAllowanceAnnual,
  type IncomeSource,
  type EmploymentIncome,
  type BusinessIncome,
  type InvestmentIncome,
} from '@/types/income';

// ─── income source description ────────────────────────────────────────────────

function describeSource(s: IncomeSource): string {
  if (s.category === 'employment') {
    const e = s as EmploymentIncome;
    const total = e.salary + e.bonus + e.allowances + e.benefits;
    return (
      `  • [Employment] "${e.label}" — Salary: ${formatCurrency(e.salary)}, ` +
      `Bonus: ${formatCurrency(e.bonus)}, Allowances: ${formatCurrency(e.allowances)}, ` +
      `Benefits: ${formatCurrency(e.benefits)}, APIT applicable: ${e.apitApplicable ? 'Yes' : 'No'}, ` +
      `Total: ${formatCurrency(total)}`
    );
  }
  if (s.category === 'business') {
    const b = s as BusinessIncome;
    return (
      `  • [Business] "${b.label}" — Revenue: ${formatCurrency(b.revenue)}, ` +
      `Expenses: ${formatCurrency(b.expenses)}, Net: ${formatCurrency(Math.max(0, b.revenue - b.expenses))}`
    );
  }
  const i = s as InvestmentIncome;
  return (
    `  • [Investment] "${i.label}" — Interest: ${formatCurrency(i.interest)}, ` +
    `Dividends: ${formatCurrency(i.dividends)}, Gross rent: ${formatCurrency(i.rent)}, ` +
    `Repair allowance (25%): ${formatCurrency(i.rent * 0.25)}, Net rent: ${formatCurrency(i.rent * 0.75)}`
  );
}

// ─── instalment schedule ──────────────────────────────────────────────────────

function instalmentSchedule(taxPayable: number, assessmentYear: string): string {
  if (taxPayable <= 0) return '  No instalments due (no tax payable).';
  const parts = (assessmentYear ?? '').split('/');
  const y0 = parts[0] ?? '----';
  const y1 = parts[1] ?? '----';
  const each = taxPayable / 3;
  return [
    `  1st instalment: ${formatCurrency(each)} — due 15 August ${y0}`,
    `  2nd instalment: ${formatCurrency(each)} — due 15 November ${y0}`,
    `  3rd instalment: ${formatCurrency(each)} — due 15 February ${y1}`,
    `  Final balance:  Any remaining after credits — due 30 November ${y1}`,
  ].join('\n');
}

// ─── system prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(
  name: string,
  occupation: string,
  email: string,
  assessmentYear: string,
  incomeSources: IncomeSource[],
  apitCredit: number,
  whtCredit: number,
  historyCount: number,
): string {
  const totalIncome = getAllIncomeTotal(incomeSources);
  const employmentTotal = getEmploymentTotal(incomeSources);
  const apitEligible = getAPITEligibleEmploymentTotal(incomeSources);
  const rentAllowance = getInvestmentRentRepairAllowanceAnnual(incomeSources);
  const businessInvestmentTotal = totalIncome - employmentTotal;

  const tax = totalIncome > 0
    ? calculateTax(totalIncome, employmentTotal, apitEligible, rentAllowance)
    : null;

  const balancePayable = tax ? Math.max(0, tax.totalTax - apitCredit - whtCredit) : 0;
  const periodLabel = formatAssessmentPeriodLabel(assessmentYear);
  const filingDeadline = defaultFilingDeadlineLabel(assessmentYear);

  const hasEmp  = incomeSources.some((s) => s.category === 'employment');
  const hasBiz  = incomeSources.some((s) => s.category === 'business');
  const hasInv  = incomeSources.some((s) => s.category === 'investment');
  const hasRent = (incomeSources as InvestmentIncome[])
    .filter((s) => s.category === 'investment').some((s) => s.rent > 0);

  const breakdownLines = tax?.breakdown
    .map((b) => `    ${b.label}: ${formatCurrency(b.amount)} @ ${(b.rate * 100).toFixed(0)}% = ${formatCurrency(b.tax)}`)
    .join('\n') ?? '  (run Calculator first)';

  return `You are TaxBot — an expert, deeply personalised Sri Lankan income tax assistant built into TaxLK.
You know this taxpayer's EXACT financial situation. Always use their real numbers. Never be generic.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAXPAYER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name        : ${name || '(not set)'}
Email       : ${email || '(not set)'}
Occupation  : ${occupation || '(not set)'}
Assessment  : ${assessmentYear}  (${periodLabel})
Filing by   : ${filingDeadline}
History     : ${historyCount} saved calculation${historyCount !== 1 ? 's' : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INCOME SOURCES  (${incomeSources.length})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${incomeSources.length > 0 ? incomeSources.map(describeSource).join('\n') : '  (none entered yet)'}

Employment          : ${formatCurrency(employmentTotal)}  (${totalIncome > 0 ? ((employmentTotal / totalIncome) * 100).toFixed(0) : 0}%)
Business/Investment : ${formatCurrency(businessInvestmentTotal)}  (${totalIncome > 0 ? ((businessInvestmentTotal / totalIncome) * 100).toFixed(0) : 0}%)
TOTAL               : ${formatCurrency(totalIncome)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAX CALCULATION  —  ${assessmentYear}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${tax ? `Gross assessable income     : ${formatCurrency(tax.assessableIncome)}
Less personal relief         : −${formatCurrency(TAX_FREE_THRESHOLD)}
Less rent repair allowance   : −${formatCurrency(tax.rentRelief)}
Taxable income               : ${formatCurrency(tax.taxableIncome)}

Progressive slabs:
${breakdownLines}

Gross tax liability          : ${formatCurrency(tax.totalTax)}
Less APIT deducted (T.10)    : −${formatCurrency(apitCredit)}
Less WHT on interest         : −${formatCurrency(whtCredit)}
─────────────────────────────────────────
BALANCE TAX PAYABLE          : ${formatCurrency(balancePayable)}

Effective rate               : ${tax.effectiveRate.toFixed(2)}%
Monthly APIT estimate        : ${formatCurrency(tax.monthlyAPIT)}` : '  (no income entered yet — run Calculator)'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTALMENT SCHEDULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${instalmentSchedule(balancePayable, assessmentYear)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAX RETURN FILING GUIDE  (RAMIS / IRD)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Portal      : ramis.ird.gov.lk  (log in with TIN)
Deadline    : ${filingDeadline}
Form        : Individual Income Tax Return (ITR)

Steps to file:
  1. Log in to RAMIS at ramis.ird.gov.lk with your TIN
  2. Select "File a Return" → Year of Assessment ${assessmentYear}
  3. Personal details: Full name, NIC/Passport, address, phone, residency status
  4. Employment income section:
     - Enter each employer's name + TIN separately
     - Key in gross remuneration from each T.10 certificate
     - Enter terminal benefits (gratuity, EPF lump sum) if any
     - Enter APIT withheld as per T.10 (this is your main credit)
  5. Business income section: net profit (revenue − allowable expenses)
  6. Investment income: interest (from AIT certificate), dividends (exempt), rent (declare gross then system applies 25%)
  7. Qualifying payments (deductions):
     - Life insurance premiums (up to Rs. 100,000 per year)
     - Approved retirement fund contributions
     - IRD-approved donations
  8. Capital assets declaration (Section 126): list properties, vehicles, bank balances, loans
  9. Review computed tax, enter credits, confirm balance payable
  10. Submit and pay via online banking or bank counter with generated payment slip

Documents to collect BEFORE filing:
${hasEmp  ? '  ✓ T.10 certificate from each employer (shows APIT deducted)' : ''}
${hasInv  ? '  ✓ AIT/WHT certificate from bank (interest withholding tax)' : ''}
${hasBiz  ? '  ✓ Business income/expense records (receipts, invoices)' : ''}
${hasRent ? '  ✓ Rental agreements and rent receipts' : ''}
  ✓ NIC / Passport
  ✓ TIN (Tax Identification Number from IRD)
  ✓ Previous year return (if applicable)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SRI LANKA TAX RULES  (IRA 2017)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tax-free threshold : Rs. ${(TAX_FREE_THRESHOLD / 1_000_000).toFixed(1)}M / year
Slabs after threshold:
${TAX_SLABS.map((s) =>
    s.limit === Infinity
      ? `  • Balance → ${(s.rate * 100).toFixed(0)}%`
      : `  • Next Rs. ${(s.limit / 1000).toFixed(0)}K → ${(s.rate * 100).toFixed(0)}%`
  ).join('\n')}

Deductions available:
  - 25% repair allowance on gross rent (automatic)
  - APIT and WHT reduce balance payable (not the gross liability)
  - Life insurance premiums — up to Rs. 100,000/yr
  - Approved retirement fund contributions
  - Approved donations / charitable contributions
  - Terminal benefits may be exempt or reduced-rate

Exemptions:
  - Dividends from Sri Lankan companies — exempt
  - Capital gains on disposal of assets — generally not a separate CGT (included in assessable income in certain cases)
  - EPF/ETF distributions — partially exempt depending on conditions

Income-specific notes:
${hasEmp  ? `  - Employment: APIT is withheld monthly by employer. Correct rate = Rs. ${formatCurrency(tax?.monthlyAPIT ?? 0)}/month. Verify T.10 matches.` : ''}
${hasBiz  ? '  - Business: Only genuine expenses directly related to earning income are deductible. Keep all receipts.' : ''}
${hasRent ? '  - Rental: 25% repair allowance auto-applied. Net 75% declared. Formal lease agreements strengthen your position.' : ''}
${hasInv  ? '  - Investment: Dividends are exempt. Interest AIT (withholding) is a credit against your liability.' : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ALWAYS use this taxpayer's exact numbers. Never say "your income" — say "your Rs. X,XXX,XXX income".
2. Suggest only LEGAL deductions under Sri Lankan law.
3. Keep replies ≤ 200 words unless the user asks for details.
4. Format money as "Rs. X,XXX,XXX" or "LKR X,XXX,XXX".
5. When helping with return filing, walk through RAMIS steps relevant to their income types.
6. When predicting next year, project forward from current figures.
7. Never invent numbers — use only what is in this context.
8. If occupation is set, tailor advice to that profession.`;
}

// ─── quick actions ────────────────────────────────────────────────────────────

function buildQuickActions(incomeSources: IncomeSource[], hasHistory: boolean): string[] {
  const hasEmp  = incomeSources.some((s) => s.category === 'employment');
  const hasBiz  = incomeSources.some((s) => s.category === 'business');
  const hasRent = (incomeSources as InvestmentIncome[])
    .filter((s) => s.category === 'investment').some((s) => s.rent > 0);
  const hasInv  = incomeSources.some((s) => s.category === 'investment');

  if (incomeSources.length === 0) {
    return [
      'What income should I add?',
      'Explain Sri Lankan tax slabs',
      'What is the tax-free threshold?',
      'How does APIT work?',
    ];
  }

  const actions: string[] = ['How can I reduce my tax?', 'Help me file my return'];
  if (hasEmp)  actions.push('Am I paying correct APIT?');
  if (hasBiz)  actions.push('What expenses can I deduct?');
  if (hasRent) actions.push('Explain my rental deduction');
  if (hasInv && !hasRent) actions.push('Are my dividends taxable?');
  actions.push(hasHistory ? 'Predict my tax next year' : 'What instalments do I owe?');

  return actions.slice(0, 5);
}

// ─── greeting ─────────────────────────────────────────────────────────────────

function buildGreeting(
  name: string,
  totalIncome: number,
  taxTotal: number,
  balancePayable: number,
  effectiveRate: number,
  assessmentYear: string,
  incomeSources: IncomeSource[],
  apitCredit: number,
  whtCredit: number,
  occupation: string,
): string {
  const firstName = name ? name.split(' ')[0] : null;
  const hi = firstName ? `Hi **${firstName}**!` : 'Hi there!';
  const jobNote = occupation ? ` (${occupation})` : '';

  if (incomeSources.length === 0) {
    return (
      `${hi}${jobNote} I'm your personalised Sri Lankan tax advisor.\n\n` +
      `No income sources found yet. Add them on the **Income** page and I'll instantly know your tax position for **${assessmentYear}**, suggest deductions, and guide you through the IRD return.\n\n` +
      `What would you like to know?`
    );
  }

  const hasCredits = apitCredit > 0 || whtCredit > 0;
  const creditLine = hasCredits
    ? `After APIT & WHT credits of **${formatCurrency(apitCredit + whtCredit)}**, balance payable: **${formatCurrency(balancePayable)}**`
    : `No APIT/WHT credits entered yet — visit the **Calculator** page to add them and reduce your payable`;

  const filingDeadline = defaultFilingDeadlineLabel(assessmentYear);

  return (
    `${hi}${jobNote} Your **${assessmentYear}** tax snapshot:\n\n` +
    `💰 Total income: **${formatCurrency(totalIncome)}** (${incomeSources.length} source${incomeSources.length !== 1 ? 's' : ''})\n` +
    `📊 Tax liability: **${formatCurrency(taxTotal)}** at **${effectiveRate.toFixed(1)}%** effective rate\n` +
    `🧾 ${creditLine}\n` +
    `📅 Filing deadline: **${filingDeadline}** via RAMIS\n\n` +
    `Ask me anything — deductions, instalments, how to file, or next year's forecast!`
  );
}

// ─── bold text renderer ───────────────────────────────────────────────────────

function renderBold(text: string): React.ReactNode[] {
  return text.split('**').map((part, idx) =>
    idx % 2 === 1 ? <strong key={idx}>{part}</strong> : <span key={idx}>{part}</span>,
  );
}

// ─── component ────────────────────────────────────────────────────────────────

export function AIAssistant() {
  const { state } = useAppContext();
  const { user } = useAuth();
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { incomeSources, profile, history, assessmentYear, calculatorSession } = state;

  // ── derived tax data ───────────────────────────────────────────────────────
  const totalIncome    = useMemo(() => getAllIncomeTotal(incomeSources), [incomeSources]);
  const empTotal       = useMemo(() => getEmploymentTotal(incomeSources), [incomeSources]);
  const apitEligible   = useMemo(() => getAPITEligibleEmploymentTotal(incomeSources), [incomeSources]);
  const rentAllowance  = useMemo(() => getInvestmentRentRepairAllowanceAnnual(incomeSources), [incomeSources]);

  const taxResult = useMemo(
    () => totalIncome > 0 ? calculateTax(totalIncome, empTotal, apitEligible, rentAllowance) : null,
    [totalIncome, empTotal, apitEligible, rentAllowance],
  );

  const apitCredit = useMemo(
    () => calculatorSession?.apitDeductedAnnual || history[0]?.apitDeductedAnnual || 0,
    [calculatorSession, history],
  );
  const whtCredit = useMemo(
    () => calculatorSession?.whtOnInterestAnnual || history[0]?.whtOnInterestAnnual || 0,
    [calculatorSession, history],
  );
  const balancePayable = useMemo(
    () => taxResult ? Math.max(0, taxResult.totalTax - apitCredit - whtCredit) : 0,
    [taxResult, apitCredit, whtCredit],
  );

  const trendIcon = useMemo(() => {
    if (history.length < 2) return null;
    const diff = history[0].totalIncome - history[1].totalIncome;
    if (diff > 10_000)  return <TrendingUp   className="w-3 h-3 text-saffron-200" />;
    if (diff < -10_000) return <TrendingDown  className="w-3 h-3 text-teal-200" />;
    return <Minus className="w-3 h-3 text-white/50" />;
  }, [history]);

  const systemPrompt = useMemo(() => buildSystemPrompt(
    user?.name || profile.name,
    profile.occupation,
    user?.email || profile.email,
    assessmentYear,
    incomeSources,
    apitCredit,
    whtCredit,
    history.length,
  ), [user, profile, assessmentYear, incomeSources, apitCredit, whtCredit, history.length]);

  const quickActions = useMemo(
    () => buildQuickActions(incomeSources, history.length > 0),
    [incomeSources, history.length],
  );

  const makeGreeting = useCallback(() => buildGreeting(
    user?.name || profile.name,
    totalIncome,
    taxResult?.totalTax ?? 0,
    balancePayable,
    taxResult?.effectiveRate ?? 0,
    assessmentYear,
    incomeSources,
    apitCredit,
    whtCredit,
    profile.occupation,
  ), [user, profile, totalIncome, taxResult, balancePayable, assessmentYear, incomeSources, apitCredit, whtCredit]);

  // ── auto scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, open]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 80);
  }, []);

  // ── reset everything when user logs out or a different user logs in ────────
  useEffect(() => {
    abortRef.current?.abort();
    setOpen(false);
    setMessages([]);
    setInput('');
    setError(null);
    setLoading(false);
  }, [user?.uid]);

  // ── refresh greeting if Firestore data loads AFTER the panel opened ────────
  useEffect(() => {
    if (!open) return;
    if (messages.some((m) => m.role === 'user')) return; // user already chatting
    setMessages([{ role: 'assistant', content: makeGreeting() }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomeSources, apitCredit, whtCredit, open]);

  // ── open ────────────────────────────────────────────────────────────────────
  const handleOpen = () => {
    setOpen(true);
    setMessages([{ role: 'assistant', content: makeGreeting() }]);
    setTimeout(() => inputRef.current?.focus(), 350);
  };

  // ── send ────────────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError(null);
    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      // Add empty assistant bubble immediately so the cursor appears at once
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      const stream = streamChatMessage(
        [{ role: 'system', content: systemPrompt }, ...next],
        { apiKey: apiKey ?? '' },
        ctrl.signal,
      );

      for await (const token of stream) {
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === 'assistant') {
            copy[copy.length - 1] = { ...last, content: last.content + token };
          }
          return copy;
        });
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      // Remove the empty assistant bubble on error
      setMessages((prev) =>
        prev[prev.length - 1]?.content === '' ? prev.slice(0, -1) : prev,
      );
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, systemPrompt, apiKey]);

  const handleSubmit   = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input); };
  const handleKeyDown  = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const noKey        = !apiKey;
  const userMsgCount = messages.filter((m) => m.role === 'user').length;

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Floating bubble ─────────────────────────────────── */}
      <AnimatePresence>
        {!open && (
          <motion.div
            className="fixed bottom-6 right-6 z-50"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          >
            {/* Tooltip label */}
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4 }}
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-card border border-border text-foreground text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-md whitespace-nowrap pointer-events-none"
            >
              AI Tax Advisor
              <span className="absolute right-[-5px] top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-border w-0 h-0" />
            </motion.div>

            <motion.button
              onClick={handleOpen}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              className="relative w-14 h-14 rounded-full gradient-primary shadow-float flex items-center justify-center text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Open AI tax assistant"
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, repeatDelay: 6 }}
              >
                <Sparkles className="w-6 h-6 text-gold-300 drop-shadow-sm" />
              </motion.div>
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-accent/45"
                animate={{ scale: [1, 1.65], opacity: [0.6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
              />
              <motion.span
                className="absolute inset-0 rounded-full border border-primary-foreground/25"
                animate={{ scale: [1, 2.0], opacity: [0.4, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
              />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat panel ──────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-navy-900/25 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            <motion.div
              className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] max-w-[360px] flex flex-col rounded-2xl shadow-float border border-border bg-card"
              style={{ height: 570 }}
              initial={{ opacity: 0, y: 60, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 gradient-primary text-primary-foreground shrink-0">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, repeatDelay: 7 }}
                  className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0"
                >
                  <Bot className="w-4 h-4 text-gold-200" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">TaxBot AI</p>
                    {trendIcon && (
                      <span className="bg-primary-foreground/15 rounded-full px-1.5 py-0.5 flex items-center gap-0.5 border border-primary-foreground/10">
                        {trendIcon}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-primary-foreground/75 ml-auto">
                      <motion.span
                        className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_6px_hsl(172_100%_45%_/_0.7)]"
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      Online
                    </span>
                  </div>
                  <p className="text-xs text-primary-foreground/65 truncate mt-0.5">
                    {incomeSources.length > 0
                      ? `${incomeSources.length} source${incomeSources.length !== 1 ? 's' : ''} · ${assessmentYear}`
                      : `Sri Lankan tax advisor · ${assessmentYear}`}
                  </p>
                </div>
                <Button
                  variant="ghost" size="icon"
                  className="text-primary-foreground/85 hover:text-primary-foreground hover:bg-primary-foreground/15 h-7 w-7 shrink-0"
                  onClick={() => setOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* No-key notice */}
              {noKey && (
                <div className="px-4 py-2 bg-accent/12 border-b border-accent/25 text-foreground text-xs">
                  Add <code className="font-mono bg-navy-900/8 dark:bg-accent/20 px-1 rounded">VITE_OPENROUTER_API_KEY</code> to <code className="font-mono bg-navy-900/8 dark:bg-accent/20 px-1 rounded">.env</code> to enable AI.
                </div>
              )}

              {/* Live tax mini-bar */}
              {taxResult && incomeSources.length > 0 && (
                <div className="shrink-0 mx-3 mt-2 bg-muted/70 border border-border rounded-xl px-3 py-2 grid grid-cols-4 gap-1 text-center text-xs">
                  {[
                    { label: 'Income',  value: formatCurrency(totalIncome) },
                    { label: 'Tax',     value: formatCurrency(taxResult.totalTax) },
                    { label: 'Payable', value: formatCurrency(balancePayable), red: true },
                    { label: 'Rate',    value: `${taxResult.effectiveRate.toFixed(1)}%` },
                  ].map((item, i, arr) => (
                    <div key={item.label} className={`flex flex-col ${i < arr.length - 1 ? 'border-r border-border' : ''}`}>
                      <span className="text-muted-foreground text-[10px]">{item.label}</span>
                      <span className={`font-semibold mt-0.5 truncate text-[11px] ${item.red ? 'text-red-600' : 'text-foreground'}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Messages */}
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-3 pt-3 pb-1 space-y-3"
              >
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`flex gap-2 items-end ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center ${
                        msg.role === 'user'
                          ? 'bg-primary'
                          : 'gradient-primary'
                      }`}>
                        {msg.role === 'user'
                          ? <User className="w-3 h-3 text-primary-foreground" />
                          : <Sparkles className="w-3 h-3 text-gold-200" />
                        }
                      </div>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted text-foreground rounded-bl-sm border border-border/60'
                      }`}>
                        {/* Bouncing dots while waiting for first token */}
                        {loading && i === messages.length - 1 && msg.role === 'assistant' && msg.content === '' ? (
                          <span className="flex gap-1 items-center h-4">
                            {[0, 1, 2].map((d) => (
                              <motion.span
                                key={d}
                                className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 inline-block"
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 0.55, repeat: Infinity, delay: d * 0.15 }}
                              />
                            ))}
                          </span>
                        ) : (
                          renderBold(msg.content)
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>


                {error && (
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2"
                  >
                    {error}
                  </motion.p>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Scroll button */}
              <AnimatePresence>
                {showScrollDown && (
                  <motion.button
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    className="absolute bottom-[80px] right-4 bg-card border border-border rounded-full p-1.5 shadow-md text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Quick chips */}
              {userMsgCount === 0 && (
                <div className="px-3 pt-2 pb-1 flex flex-wrap gap-1.5 shrink-0">
                  {quickActions.map((action, i) => (
                    <motion.button
                      key={action}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => sendMessage(action)}
                      disabled={noKey}
                      className="text-xs px-2.5 py-1 rounded-full border border-border bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                    >
                      {action}
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form
                onSubmit={handleSubmit}
                className="flex items-end gap-2 px-3 pb-3 pt-2 border-t border-border shrink-0"
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={noKey ? 'API key required…' : 'Ask about your taxes…'}
                  rows={1}
                  disabled={loading || noKey}
                  className="flex-1 resize-none bg-muted/60 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-card placeholder:text-muted-foreground max-h-20 overflow-y-auto disabled:opacity-50"
                  style={{ lineHeight: '1.5' }}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || loading || noKey}
                  className="h-9 w-9 shrink-0 gradient-primary text-primary-foreground border-0 shadow-sm hover:brightness-110 active:brightness-95 disabled:opacity-40"
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />
                  }
                </Button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
