/**
 * App Data Sync Service
 * Syncs app state (income sources, history, profile) to Firestore
 * so data persists across browsers and devices.
 *
 * Uses the `user_data/{userId}` collection (rules already in firestore.rules).
 * Real-time listener via onSnapshot enables cross-browser sync.
 */
import {
  doc,
  setDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { IncomeSource, UserProfile, TaxHistoryRecord } from '@/types/income';

const USER_DATA_COLLECTION = 'user_data';

export interface AppData {
  profile: UserProfile;
  incomeSources: IncomeSource[];
  history: TaxHistoryRecord[];
  updatedAt: number; // timestamp for conflict resolution
}

/**
 * Save app state to Firestore.
 * Uses merge to avoid overwriting fields we don't control.
 */
export async function saveAppData(
  userId: string,
  data: { profile: UserProfile; incomeSources: IncomeSource[]; history: TaxHistoryRecord[] }
): Promise<void> {
  const docRef = doc(db, USER_DATA_COLLECTION, userId);
  await setDoc(docRef, {
    profile: data.profile,
    incomeSources: data.incomeSources,
    history: data.history,
    updatedAt: Date.now(),
  });
}

/**
 * Subscribe to real-time updates for a user's app data.
 * Calls `onData` whenever the Firestore document changes (including from other browsers).
 * Returns an unsubscribe function.
 */
export function subscribeToAppData(
  userId: string,
  onData: (data: AppData | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const docRef = doc(db, USER_DATA_COLLECTION, userId);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as AppData;
        onData(data);
      } else {
        onData(null);
      }
    },
    (error) => {
      console.error('[AppDataService] Snapshot listener error:', error);
      onError?.(error);
    }
  );
}
