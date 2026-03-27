import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from 'react';
import { IncomeSource, UserProfile, TaxHistoryRecord } from '@/types/income';
import { useAuth } from '@/context/AuthContext';
import { saveAppData, subscribeToAppData } from '@/services/firebase/appDataService';

interface AppState {
  profile: UserProfile;
  incomeSources: IncomeSource[];
  history: TaxHistoryRecord[];
}

type Action =
  | { type: 'SET_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'ADD_INCOME'; payload: IncomeSource }
  | { type: 'UPDATE_INCOME'; payload: IncomeSource }
  | { type: 'REMOVE_INCOME'; payload: string }
  | { type: 'ADD_HISTORY'; payload: TaxHistoryRecord }
  | { type: 'REMOVE_HISTORY'; payload: string }
  | { type: 'LOAD_STATE'; payload: AppState };

const defaultProfile: UserProfile = {
  name: '',
  email: '',
  occupation: '',
  defaultIncome: 0,
  inputPreference: 'annual',
};

const initialState: AppState = {
  profile: defaultProfile,
  incomeSources: [],
  history: [],
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };
    case 'ADD_INCOME':
      return { ...state, incomeSources: [...state.incomeSources, action.payload] };
    case 'UPDATE_INCOME':
      return {
        ...state,
        incomeSources: state.incomeSources.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      };
    case 'REMOVE_INCOME':
      return {
        ...state,
        incomeSources: state.incomeSources.filter((s) => s.id !== action.payload),
      };
    case 'ADD_HISTORY':
      return { ...state, history: [action.payload, ...state.history] };
    case 'REMOVE_HISTORY':
      return { ...state, history: state.history.filter((h) => h.id !== action.payload) };
    case 'LOAD_STATE':
      return action.payload;
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => {} });

const STORAGE_KEY = 'sl-tax-calculator-state';
const FIRESTORE_SAVE_DEBOUNCE_MS = 500;

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user } = useAuth();

  // Refs to avoid stale closures and race conditions
  const isFromFirestore = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedInitial = useRef(false);
  const userUidRef = useRef<string | null>(null);

  // Keep uid ref in sync
  useEffect(() => {
    userUidRef.current = user?.uid ?? null;
  }, [user?.uid]);

  // Helper: cancel any pending debounced save
  function cancelPendingSave() {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
  }

  // Load from localStorage on mount (immediate fallback)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'LOAD_STATE', payload: { ...initialState, ...parsed } });
      }
    } catch {
      // localStorage unavailable or corrupted — start fresh
    }
  }, []);

  // Subscribe to Firestore real-time updates when user is authenticated
  useEffect(() => {
    if (!user?.uid) {
      hasLoadedInitial.current = false;
      cancelPendingSave();
      return;
    }

    const uid = user.uid;

    const unsubscribe = subscribeToAppData(
      uid,
      (firestoreData) => {
        if (firestoreData) {
          const loadedState: AppState = {
            profile: firestoreData.profile ?? defaultProfile,
            incomeSources: firestoreData.incomeSources ?? [],
            history: firestoreData.history ?? [],
          };

          // Cancel any pending save to prevent stale data overwriting Firestore
          cancelPendingSave();

          isFromFirestore.current = true;
          dispatch({ type: 'LOAD_STATE', payload: loadedState });
          hasLoadedInitial.current = true;

          // Keep localStorage in sync
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedState));
          } catch {
            // ignore
          }
        } else if (!hasLoadedInitial.current) {
          // No Firestore data yet — push current localStorage state to Firestore
          hasLoadedInitial.current = true;
          const currentLocal = localStorage.getItem(STORAGE_KEY);
          if (currentLocal) {
            try {
              const parsed = JSON.parse(currentLocal);
              const localState: AppState = { ...initialState, ...parsed };
              saveAppData(uid, localState).catch(console.error);
            } catch {
              // ignore
            }
          }
        }
      },
      (error) => {
        // Mark as loaded so user actions still save to Firestore
        hasLoadedInitial.current = true;
        console.warn('[AppContext] Firestore sync error — using localStorage fallback:', error.message);
      }
    );

    return () => {
      unsubscribe();
      cancelPendingSave();
    };
  }, [user?.uid]);

  // Persist state changes to localStorage + Firestore
  useEffect(() => {
    // Always save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }

    // Skip Firestore save if:
    // 1. This change came FROM Firestore (loop prevention)
    // 2. No authenticated user
    // 3. Initial Firestore snapshot hasn't arrived yet (prevents stale overwrites)
    if (isFromFirestore.current) {
      isFromFirestore.current = false;
      return;
    }

    const uid = userUidRef.current;
    if (!uid || !hasLoadedInitial.current) return;

    // Debounced save to Firestore
    cancelPendingSave();
    saveTimer.current = setTimeout(() => {
      saveAppData(uid, state).catch((err) => {
        console.warn('[AppContext] Failed to save to Firestore:', err);
      });
      saveTimer.current = null;
    }, FIRESTORE_SAVE_DEBOUNCE_MS);
  }, [state]); // Only trigger on state changes, not on callback recreation

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
