import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, setApiToken } from '../api/client';
import type { User } from '../api/types';
import { deleteItem, getItem, setItem } from '../storage/kv';

type AuthContextValue = {
  loading: boolean;
  token: string | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'hp.token';
const USER_KEY = 'hp.user';

export function AuthProvider(props: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function hydrate() {
      const storedToken = await getItem(TOKEN_KEY);
      const storedUser = await getItem(USER_KEY);
      setToken(storedToken);
      setUser(storedUser ? (JSON.parse(storedUser) as User) : null);
      setApiToken(storedToken);
      setLoading(false);
    }
    hydrate();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      token,
      user,
      async signIn(email, password) {
        const { data } = await api.post('/auth/login', { email, password });
        const nextToken = data.token as string;
        const nextUser = data.user as User;
        setToken(nextToken);
        setUser(nextUser);
        setApiToken(nextToken);
        await setItem(TOKEN_KEY, nextToken);
        await setItem(USER_KEY, JSON.stringify(nextUser));
      },
      async signOut() {
        setToken(null);
        setUser(null);
        setApiToken(null);
        await deleteItem(TOKEN_KEY);
        await deleteItem(USER_KEY);
      },
    }),
    [loading, token, user],
  );

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthProvider is missing');
  return ctx;
}
