import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useRef,
  useState,
} from 'react';
import { IncomeSource, UserProfile, TaxHistoryRecord } from '@/types/income';
import type { CalculatorSession } from '@/types/workspace';
import { TAX_ASSESSMENT_YEAR } from '@/lib/taxCalculator';
import { useAuth } from '@/context/AuthContext';
import {
  fetchUserTaxWorkspace,
  saveUserTaxWorkspace,
  workspaceHasMeaningfulData,
  type UserTaxWorkspacePayload,
} from '@/services/firebase/userTaxWorkspaceService';

export type { CalculatorSession } from '@/types/workspace';

export interface AppState {
  profile: UserProfile;
  incomeSources: IncomeSource[];
  history: TaxHistoryRecord[];
  assessmentYear: string;
  calculatorSession: CalculatorSession | null;
}

type Action =
  | { type: 'SET_ASSESSMENT_YEAR'; payload: string }
  | { type: 'SET_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'ADD_INCOME'; payload: IncomeSource }
  | { type: 'UPDATE_INCOME'; payload: IncomeSource }
  | { type: 'REMOVE_INCOME'; payload: string }
  | { type: 'ADD_HISTORY'; payload: TaxHistoryRecord }
  | { type: 'UPDATE_LAST_HISTORY'; payload: Partial<TaxHistoryRecord> }
  | { type: 'REMOVE_HISTORY'; payload: string }
  | { type: 'SET_CALCULATOR_SESSION'; payload: CalculatorSession }
  | { type: 'CLEAR_CALCULATOR_SESSION' }
  | { type: 'LOAD_STATE'; payload: AppState };

const defaultProfile: UserProfile = {
  name: '',
  email: '',
  occupation: '',
  defaultIncome: 0,
  inputPreference: 'annual',
};

export const appInitialState: AppState = {
  profile: defaultProfile,
  incomeSources: [],
  history: [],
  assessmentYear: TAX_ASSESSMENT_YEAR,
  calculatorSession: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ASSESSMENT_YEAR':
      return { ...state, assessmentYear: action.payload };
    case 'SET_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };
    case 'ADD_INCOME':
      return { ...state, incomeSources: [...state.incomeSources, action.payload] };
    case 'UPDATE_INCOME':
      return {
        ...state,
        incomeSources: state.incomeSources.map((s) =>
          s.id === action.payload.id ? action.payload : s,
        ),
      };
    case 'REMOVE_INCOME':
      return {
        ...state,
        incomeSources: state.incomeSources.filter((s) => s.id !== action.payload),
      };
    case 'ADD_HISTORY':
      return { ...state, history: [action.payload, ...state.history] };
    case 'UPDATE_LAST_HISTORY': {
      if (state.history.length === 0) return state;
      const [head, ...rest] = state.history;
      return { ...state, history: [{ ...head, ...action.payload }, ...rest] };
    }
    case 'SET_CALCULATOR_SESSION':
      return { ...state, calculatorSession: action.payload };
    case 'CLEAR_CALCULATOR_SESSION':
      return { ...state, calculatorSession: null };
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
}>({ state: appInitialState, dispatch: () => {} });

/** Legacy pre-auth key (one-time migration into per-user storage + Firestore). */
const LEGACY_STORAGE_KEY = 'sl-tax-calculator-state';
const userStorageKey = (uid: string) => `sl-tax-calculator-state:${uid}`;

function payloadFromState(state: AppState): UserTaxWorkspacePayload {
  return {
    incomeSources: state.incomeSources,
    history: state.history,
    assessmentYear: state.assessmentYear,
    calculatorSession: state.calculatorSession,
    profile: state.profile,
  };
}

function appStateFromPayload(data: UserTaxWorkspacePayload): AppState {
  return {
    profile: { ...defaultProfile, ...data.profile },
    incomeSources: data.incomeSources,
    history: data.history,
    assessmentYear: data.assessmentYear || TAX_ASSESSMENT_YEAR,
    calculatorSession: data.calculatorSession,
  };
}

function parseStoredState(raw: string): Partial<AppState> | null {
  try {
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/** Never write this to Firestore — it would overwrite another browser's real data with empty arrays. */
function isPristineWorkspace(state: AppState): boolean {
  if (workspaceHasMeaningfulData(payloadFromState(state))) return false;
  const p = state.profile;
  if (p.name?.trim() || p.email?.trim() || p.occupation?.trim()) return false;
  if (p.defaultIncome !== 0) return false;
  if (p.inputPreference !== defaultProfile.inputPreference) return false;
  if (state.assessmentYear !== TAX_ASSESSMENT_YEAR) return false;
  return true;
}

const REMOTE_PULL_QUIET_MS = 2800;
const AFTER_SAVE_COOLDOWN_MS = 1600;

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, appInitialState);
  const [hydratedUid, setHydratedUid] = useState<string | null>(null);
  const prevUidRef = useRef<string | undefined>(undefined);
  const stateRef = useRef(state);
  stateRef.current = state;
  /** Firestore `updated_at` (or client clock after local save) — used to pull newer workspace from other tabs/browsers. */
  const lastAppliedServerMsRef = useRef(0);
  const lastStateChangeAtRef = useRef(Date.now());
  const lastSaveFinishedAtRef = useRef(0);

  useEffect(() => {
    lastStateChangeAtRef.current = Date.now();
  }, [state]);

  useEffect(() => {
    const uid = user?.uid;
    if (prevUidRef.current && !uid) {
      dispatch({ type: 'LOAD_STATE', payload: appInitialState });
    }
    prevUidRef.current = uid;

    if (!uid) {
      setHydratedUid('__guest__');
      lastAppliedServerMsRef.current = 0;
      return;
    }

    setHydratedUid(null);
    lastAppliedServerMsRef.current = 0;
    let cancelled = false;

    (async () => {
      try {
        const remote = await fetchUserTaxWorkspace(uid);
        if (cancelled) return;

        if (remote.ok && remote.docExists) {
          const next = appStateFromPayload(remote.data);
          lastAppliedServerMsRef.current = remote.updatedAtMs || Date.now();
          dispatch({ type: 'LOAD_STATE', payload: next });
          try {
            localStorage.setItem(userStorageKey(uid), JSON.stringify(next));
          } catch {
            /* ignore */
          }
        } else {
          let loaded: AppState | null = null;

          try {
            const uRaw = localStorage.getItem(userStorageKey(uid));
            const uParsed = uRaw ? parseStoredState(uRaw) : null;
            if (uParsed && workspaceHasMeaningfulData(uParsed as UserTaxWorkspacePayload)) {
              loaded = { ...appInitialState, ...uParsed } as AppState;
            }
          } catch {
            /* ignore */
          }

          if (!loaded) {
            try {
              const legRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
              const legParsed = legRaw ? parseStoredState(legRaw) : null;
              if (legParsed && workspaceHasMeaningfulData(legParsed as UserTaxWorkspacePayload)) {
                loaded = { ...appInitialState, ...legParsed } as AppState;
              }
            } catch {
              /* ignore */
            }
          }

          if (loaded) {
            dispatch({ type: 'LOAD_STATE', payload: loaded });
            try {
              localStorage.setItem(userStorageKey(uid), JSON.stringify(loaded));
            } catch {
              /* ignore */
            }
            try {
              await saveUserTaxWorkspace(uid, payloadFromState(loaded));
              lastSaveFinishedAtRef.current = Date.now();
              lastAppliedServerMsRef.current = Math.max(
                lastAppliedServerMsRef.current,
                Date.now(),
              );
            } catch {
              /* offline / rules — local cache still works */
            }
          }
        }
      } finally {
        if (!cancelled) setHydratedUid(uid);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  useEffect(() => {
    const uid = user?.uid;
    const canPersist = uid ? hydratedUid === uid : false;
    if (!canPersist || !uid) return;

    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(userStorageKey(uid), JSON.stringify(state));
      } catch {
        /* ignore */
      }
      if (isPristineWorkspace(state)) return;
      saveUserTaxWorkspace(uid, payloadFromState(state))
        .then(() => {
          lastSaveFinishedAtRef.current = Date.now();
          lastAppliedServerMsRef.current = Math.max(
            lastAppliedServerMsRef.current,
            Date.now(),
          );
        })
        .catch((err) => {
          if (import.meta.env.DEV) {
            console.warn('[TaxWorkspace] Cloud save failed — check Firestore rules and network.', err);
          }
        });
    }, 800);

    return () => window.clearTimeout(t);
  }, [state, user?.uid, hydratedUid]);

  useEffect(() => {
    const uid = user?.uid;
    if (!uid || hydratedUid !== uid) return;
    const flush = () => {
      const s = stateRef.current;
      if (isPristineWorkspace(s)) return;
      try {
        localStorage.setItem(userStorageKey(uid), JSON.stringify(s));
      } catch {
        /* ignore */
      }
      void saveUserTaxWorkspace(uid, payloadFromState(s)).then(() => {
        lastSaveFinishedAtRef.current = Date.now();
        lastAppliedServerMsRef.current = Math.max(lastAppliedServerMsRef.current, Date.now());
      });
    };
    const onVis = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [user?.uid, hydratedUid]);

  useEffect(() => {
    const uid = user?.uid;
    if (!uid || hydratedUid !== uid) return;

    const tryPullNewerRemote = async () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastStateChangeAtRef.current < REMOTE_PULL_QUIET_MS) return;
      if (Date.now() - lastSaveFinishedAtRef.current < AFTER_SAVE_COOLDOWN_MS) return;

      try {
        const r = await fetchUserTaxWorkspace(uid);
        if (!r.ok || !r.docExists) return;
        const serverMs = r.updatedAtMs || 0;
        if (serverMs <= lastAppliedServerMsRef.current) return;

        const next = appStateFromPayload(r.data);
        dispatch({ type: 'LOAD_STATE', payload: next });
        lastAppliedServerMsRef.current = serverMs;
        try {
          localStorage.setItem(userStorageKey(uid), JSON.stringify(next));
        } catch {
          /* ignore */
        }
      } catch {
        /* ignore */
      }
    };

    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') void tryPullNewerRemote();
    };

    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);
    const delayedPull = window.setTimeout(() => void tryPullNewerRemote(), 4000);

    return () => {
      window.clearTimeout(delayedPull);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [user?.uid, hydratedUid]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}
