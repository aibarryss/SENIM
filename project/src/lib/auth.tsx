import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/lib/types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, role: UserRole, displayName?: string, phone?: string) => Promise<{ error: string | null; user: User | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Loads the profile for the given user id. Returns the loaded profile
  // or null if not found / on error. Used by both getSession and
  // onAuthStateChange so profile loading is awaited before clearing
  // `loading`, eliminating the race where `loading=false` but
  // `profile` is still null.
  const loadProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) return null;
    return data as Profile | null;
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        const p = await loadProfile(data.session.user.id);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      (async () => {
        if (newSession?.user) {
          const p = await loadProfile(newSession.user.id);
          setProfile(p);
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, role: UserRole, displayName?: string, phone?: string) => {
    // Profile creation is handled atomically by the `handle_new_user`
    // trigger on auth.users (migration 20260801141200). We pass the
    // profile fields through user_metadata so the trigger can read them.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          display_name: displayName || null,
          phone: phone || null,
        },
      },
    });
    if (error) return { error: error.message, user: null };
    // Supabase returns a user object with an empty `identities` array
    // when the email is already registered (and email confirmation is
    // enabled). Detect this so the UI can prompt the user to sign in
    // instead of falsely showing "account created".
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { error: 'EMAIL_ALREADY_EXISTS', user: null };
    }
    return { error: null, user: data.user ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    // Even if the server-side signOut fails (network error, expired
    // token), clear local state so the UI is consistent. The stale
    // session will be rejected on the next API call anyway.
    if (error) {
      console.error('signOut error:', error.message);
    }
    setProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
