import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { IncomeSource, UserProfile, TaxHistoryRecord } from '@/types/income';

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

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'LOAD_STATE', payload: { ...initialState, ...parsed } });
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
