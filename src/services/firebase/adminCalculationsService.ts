/**
 * Aggregates tax calculation history from all user workspace docs for the admin panel.
 * Requires Firestore rules that allow admins to read `user_data` / `user_tax_workspace`.
 */
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { TaxHistoryRecord, UserProfile } from '@/types/income';
import { TAX_ASSESSMENT_YEAR } from '@/lib/taxCalculator';

const USER_DATA = 'user_data';
const LEGACY_WORKSPACE = 'user_tax_workspace';

export interface AdminCalculationRow {
  id: string;
  userId: string;
  userName: string;
  totalIncome: number;
  taxableIncome: number;
  totalTax: number;
  effectiveRate: number;
  /** YYYY-MM-DD */
  date: string;
  /** Year of assessment label from workspace (e.g. 2024/2025) */
  assessmentYear: string;
  breakdown: TaxHistoryRecord['breakdown'];
}

function formatRowDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function displayName(profile: UserProfile | null, uid: string): string {
  const n = profile?.name?.trim();
  if (n) return n;
  const e = profile?.email?.trim();
  if (e) return e;
  return `User ${uid.slice(0, 8)}`;
}

function rowsFromWorkspaceDoc(
  uid: string,
  raw: Record<string, unknown>,
): AdminCalculationRow[] {
  const history = Array.isArray(raw.history) ? (raw.history as TaxHistoryRecord[]) : [];
  const profile =
    raw.profile && typeof raw.profile === 'object' ? (raw.profile as UserProfile) : null;
  const assessmentYear =
    typeof raw.assessmentYear === 'string' && raw.assessmentYear.trim()
      ? raw.assessmentYear.trim()
      : TAX_ASSESSMENT_YEAR;
  const userName = displayName(profile, uid);

  return history.map((h) => ({
    id: `${uid}_${h.id}`,
    userId: uid,
    userName,
    totalIncome: Number(h.totalIncome) || 0,
    taxableIncome: Number(h.taxableIncome) || 0,
    totalTax: Number(h.totalTax) || 0,
    effectiveRate: Number(h.effectiveRate) || 0,
    date: formatRowDate(h.date),
    assessmentYear,
    breakdown: Array.isArray(h.breakdown) ? h.breakdown : [],
  }));
}

/**
 * Loads history rows from `user_data`, then adds legacy `user_tax_workspace` docs
 * only for UIDs that have no `user_data` doc (avoids duplicate history after migration).
 */
export async function fetchAdminCalculationRows(): Promise<AdminCalculationRow[]> {
  const [primarySnap, legacySnap] = await Promise.all([
    getDocs(collection(db, USER_DATA)),
    getDocs(collection(db, LEGACY_WORKSPACE)),
  ]);

  const primaryUids = new Set(primarySnap.docs.map((d) => d.id));
  const rows: AdminCalculationRow[] = [];

  for (const docSnap of primarySnap.docs) {
    const data = docSnap.data();
    if (data && typeof data === 'object') {
      rows.push(...rowsFromWorkspaceDoc(docSnap.id, data as Record<string, unknown>));
    }
  }

  for (const docSnap of legacySnap.docs) {
    if (primaryUids.has(docSnap.id)) continue;
    const data = docSnap.data();
    if (data && typeof data === 'object') {
      rows.push(...rowsFromWorkspaceDoc(docSnap.id, data as Record<string, unknown>));
    }
  }

  rows.sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    if (byDate !== 0) return byDate;
    return b.id.localeCompare(a.id);
  });

  return rows;
}
