/**
 * TaxProfile — extended personal details for Sri Lankan tax filing.
 * Stored in Firestore: user_profiles/{uid}
 * Separate from users/{uid} (auth) and income types (tax logic).
 *
 * Fields map directly to RAMIS Individual Income Tax Return fields.
 * Updated per Inland Revenue Act No.24 of 2017 & Amendment Act No.02 of 2025.
 */

export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | '';

export interface TaxProfile {
  // ── Basic info ──
  name: string;
  email: string;
  occupation: string;
  default_income: number;
  input_preference: 'monthly' | 'annual';

  // ── Personal Details (RAMIS Part B — Declarant) ──
  /** Permanent residential address as of 31 March — RAMIS Part B */
  address: string;
  /** Date of birth — used to auto-compute senior_citizen (age ≥ 60) */
  date_of_birth: string;                // ISO date: YYYY-MM-DD
  /** Marital status — affects spouse relief declarations */
  marital_status: MaritalStatus;

  // ── Tax Identity (RAMIS header fields) ──
  /** Taxpayer Identification Number — RAMIS field: TIN */
  tin: string;
  /** National Identity Card number — RAMIS Part B */
  nic: string;
  /** Resident or Non-resident — RAMIS header radio */
  is_resident: boolean;
  /** Senior citizen (age ≥ 60) — RAMIS Part C. Auto-set from date_of_birth if provided. */
  is_senior_citizen: boolean;

  // ── Contact (RAMIS Part B) ──
  phone: string;
  mobile: string;

  // ── Primary Employment (RAMIS Schedule 1 Part I) ──
  /** Employer / company name */
  employer_name: string;
  /** TIN of the employer */
  employer_tin: string;
  /** Primary or Secondary employment */
  employment_type: 'primary' | 'secondary';

  // ── Metadata ──
  updated_at?: Date;
}

export const defaultTaxProfile: TaxProfile = {
  name: '',
  email: '',
  occupation: '',
  default_income: 0,
  input_preference: 'annual',
  address: '',
  date_of_birth: '',
  marital_status: '',
  tin: '',
  nic: '',
  is_resident: true,
  is_senior_citizen: false,
  phone: '',
  mobile: '',
  employer_name: '',
  employer_tin: '',
  employment_type: 'primary',
};

/** Compute age from ISO date string */
export function computeAge(dob: string): number {
  if (!dob) return 0;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

/** Returns true if date_of_birth indicates age ≥ 60 */
export function isSeniorCitizenFromDOB(dob: string): boolean {
  return computeAge(dob) >= 60;
}
