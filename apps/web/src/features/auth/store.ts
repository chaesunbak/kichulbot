import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string | null;
  nickname: string | null;
  authType: 'EMAIL' | 'OAUTH';
  linkedProviders: 'KAKAO'[];
  role: 'USER' | 'ADMIN';
}

interface AuthStore {
  user: AuthUser | null;
  setAuth: (user: AuthUser) => void;
  clearAuth: () => void;
}

interface PersistedAuthState {
  user?: AuthUser | null;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      setAuth: (user) => set({ user }),
      clearAuth: () => set({ user: null }),
    }),
    {
      name: 'kichulbot-auth',
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as PersistedAuthState | undefined;
        return { user: state?.user ?? null };
      },
      merge: (persistedState, currentState) => {
        const state = persistedState as PersistedAuthState | undefined;
        return { ...currentState, user: state?.user ?? null };
      },
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state?.user) {
          state.setAuth(state.user);
        } else {
          state?.clearAuth();
        }
      },
    },
  ),
);
