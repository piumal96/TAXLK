/**
 * Tax Record Service
 * Stores and retrieves tax calculation RESULTS only.
 * Tax calculation LOGIC lives in /src/lib/taxCalculator.ts (untouched).
 */
import {
  collection,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const TAX_RECORDS_COLLECTION = 'tax_records';

export interface TaxRecordData {
  user_id: string;
  year: number;
  inputs: Record<string, unknown>;
  result: Record<string, unknown>;
}

/**
 * Save a tax calculation result to Firestore
 */
export async function saveTaxRecord(data: TaxRecordData): Promise<string> {
  const docRef = await addDoc(collection(db, TAX_RECORDS_COLLECTION), {
    ...data,
    created_at: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Get all tax records for a user
 */
export async function getUserTaxRecords(
  userId: string,
  maxRecords = 50
): Promise<(TaxRecordData & { id: string; created_at: Date })[]> {
  const q = query(
    collection(db, TAX_RECORDS_COLLECTION),
    where('user_id', '==', userId),
    orderBy('created_at', 'desc'),
    limit(maxRecords)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      created_at: data.created_at?.toDate?.() ? data.created_at.toDate() : new Date(),
    } as TaxRecordData & { id: string; created_at: Date };
  });
}

/**
 * Delete a tax record
 */
export async function deleteTaxRecord(recordId: string): Promise<void> {
  await deleteDoc(doc(db, TAX_RECORDS_COLLECTION, recordId));
}
