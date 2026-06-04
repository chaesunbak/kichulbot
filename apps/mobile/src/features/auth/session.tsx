import type { UserResponse } from '@kichulbot/api-contract/auth';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getMe,
  login,
  parseOAuthCallbackUrl,
  register,
} from '@/features/auth/api';
import { setUnauthorizedHandler } from '@/shared/api/client';
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '@/shared/storage/auth-token-storage';

type SignInInput = {
  email: string;
  password: string;
};

type SignUpInput = SignInInput & {
  nickname?: string;
  emailVerificationToken: string;
};

type AuthSessionContextValue = {
  accessToken: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  user: UserResponse | null;
  signIn: (input: SignInInput) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  completeOAuthCallback: (url: string) => Promise<boolean>;
  refreshMe: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [accessToken, setSessionAccessToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<UserResponse | null>(null);

  const clearSession = useCallback(async () => {
    await clearAccessToken();
    setSessionAccessToken(null);
    setUser(null);
  }, []);

  const saveSession = useCallback(async (token: string) => {
    await setAccessToken(token);
    setSessionAccessToken(token);
    const response = await getMe(token);
    setUser(response.user);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!accessToken) return;
    const response = await getMe(accessToken);
    setUser(response.user);
  }, [accessToken]);

  const signIn = useCallback(
    async (input: SignInInput) => {
      const response = await login(input);
      await saveSession(response.accessToken);
    },
    [saveSession],
  );

  const signUp = useCallback(
    async (input: SignUpInput) => {
      const response = await register(input);
      await saveSession(response.accessToken);
    },
    [saveSession],
  );

  const signOut = useCallback(async () => {
    await clearSession();
    router.replace('/sign-in');
  }, [clearSession]);

  const completeOAuthCallback = useCallback(
    async (url: string) => {
      const { accessToken: oauthAccessToken, oauthStatus } =
        parseOAuthCallbackUrl(url);

      if (!oauthAccessToken || oauthStatus !== 'login') {
        return false;
      }

      await saveSession(oauthAccessToken);
      router.replace('/');
      return true;
    },
    [saveSession],
  );

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await clearSession();
      router.replace('/sign-in');
    });

    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const storedAccessToken = await getAccessToken();
      if (!storedAccessToken) {
        if (mounted) setIsReady(true);
        return;
      }

      try {
        const response = await getMe(storedAccessToken);
        if (!mounted) return;
        setSessionAccessToken(storedAccessToken);
        setUser(response.user);
      } catch {
        await clearAccessToken();
      } finally {
        if (mounted) setIsReady(true);
      }
    }

    void restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void completeOAuthCallback(url);
    });

    void Linking.getInitialURL().then((url) => {
      if (url) {
        void completeOAuthCallback(url);
      }
    });

    return () => subscription.remove();
  }, [completeOAuthCallback]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      accessToken,
      completeOAuthCallback,
      isAuthenticated: Boolean(accessToken && user),
      isReady,
      refreshMe,
      signIn,
      signOut,
      signUp,
      user,
    }),
    [
      accessToken,
      completeOAuthCallback,
      isReady,
      refreshMe,
      signIn,
      signOut,
      signUp,
      user,
    ],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error(
      'AuthSessionProvider 안에서 useAuthSession을 사용해야 합니다.',
    );
  }
  return context;
}
