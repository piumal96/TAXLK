/**
 * Extension Bridge Schema — Lanka Tax Hub
 *
 * Single source of truth for the canonical data contract shared between the website
 * and the Lanka Tax Hub RAMIS AutoFill Chrome Extension.
 *
 * All monetary values are raw numbers (LKR). Formatting for RAMIS input is the
 * extension's responsibility. All cap calculations (solarRelief, aggregateRelief,
 * charityMax) are pre-resolved on the website side — the extension never re-implements
 * Sri Lankan tax law.
 */

// ─── Version ──────────────────────────────────────────────────────────────────

/** Bump this when the payload shape changes between tax years */
export const LTAX_VERSION = 'LTAX_2024-2025-v1';

// ─── Payload ──────────────────────────────────────────────────────────────────

export interface AutoFillIdentity {
  tin: string;
  nic: string;
  fullName: string;
  address: string;
  phone: string;
}

export interface AutoFillEmploymentEntry {
  employerName: string;
  employerTIN: string;
  remuneration: number;
  terminalBenefits: number;
  apitFromT10: number;
}

export interface AutoFillOtherIncome {
  interestIncome: number;
  aitOnInterest: number;
  dividendIncome: number;
  rentIncome: number;
  businessNetIncome: number;
}

export interface AutoFillReliefs {
  /** Pre-capped to SOLAR_RELIEF_MAX (600,000) */
  solarRelief: number;
  /** Pre-capped to AGGREGATE_RELIEF_MAX (900,000) */
  aggregateRelief: number;
  /** Pre-capped per §  (lower of actual, 75,000, or 1/3 taxable) */
  charitableDonations: number;
  govtDonations: number;
}

export interface AutoFillTaxSummary {
  totalIncome: number;
  /** totalIncome minus total extra reliefs */
  adjustedIncome: number;
  taxableIncome: number;
  totalTax: number;
  apitTotal: number;
  aitOnInterest: number;
  installmentsPaid: number;
  totalCredits: number;
  /** Positive = payable, negative = refund due */
  taxBalance: number;
}

export interface AutoFillProperty {
  description: string;
  cost: number;
  marketValue: number;
}

export interface AutoFillVehicle {
  description: string;
  regNo: string;
  value: number;
}

export interface AutoFillBankBalance {
  bank: string;
  balance: number;
  interest: number;
}

export interface AutoFillLoan {
  description: string;
  originalAmount: number;
  balance: number;
}

export interface AutoFillAssets {
  properties: AutoFillProperty[];
  vehicles: AutoFillVehicle[];
  bankBalances: AutoFillBankBalance[];
  sharesValue: number;
  cashInHand: number;
  jewelry: number;
  /** Pre-computed: sum of all asset market values */
  totalAssets: number;
  loans: AutoFillLoan[];
  /** Pre-computed: sum of all loan balances */
  totalLiabilities: number;
}

export interface AutoFillPayload {
  /** Schema version — extension rejects payloads with mismatched version */
  version: string;
  /** ISO 8601 timestamp of when the payload was built */
  generatedAt: string;
  assessmentYear: string;
  identity: AutoFillIdentity;
  employmentSchedule: AutoFillEmploymentEntry[];
  otherIncome: AutoFillOtherIncome;
  reliefs: AutoFillReliefs;
  taxSummary: AutoFillTaxSummary;
  assets: AutoFillAssets;
}

// ─── Message Protocol Constants ───────────────────────────────────────────────

/** Website → Extension: are you there? */
export const MSG_PING = 'LTAX_PING';
/** Extension → Website: yes, I'm here */
export const MSG_PONG = 'LTAX_PONG';
/** Website → Extension: here is the tax return payload */
export const MSG_PAYLOAD = 'LTAX_PAYLOAD';
/** Extension → Website: status update from the autofill session */
export const MSG_STATUS = 'LTAX_STATUS';

/** chrome.storage.local key for the AutoFillPayload */
export const STORAGE_KEY_PAYLOAD = 'ltax_payload';
/** chrome.storage.session key for the FSM state */
export const STORAGE_KEY_FSM = 'ltax_fsm';
/** chrome.storage.local key for the accumulated FieldResult log */
export const STORAGE_KEY_RESULTS = 'ltax_results';
/** chrome.storage.local key for the debug event log */
export const STORAGE_KEY_LOG = 'ltax_debug_log';
