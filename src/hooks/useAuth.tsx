import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const checkNewDevice = async () => {
    try {
      // Get IP address from a public API
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const ipAddress = ipData.ip || '0.0.0.0';
      
      await supabase.functions.invoke('detect-new-device', {
        body: {
          ip_address: ipAddress,
          user_agent: navigator.userAgent
        }
      });
    } catch {
      // Silent fail - device detection is non-critical
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Check for new device on sign in
        if (event === 'SIGNED_IN' && session?.user) {
          // Use setTimeout to avoid blocking the auth flow
          setTimeout(() => {
            checkNewDevice();
          }, 100);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const recordAudit = async (userId: string, action: string, metadata?: Record<string, unknown>) => {
    try {
      await supabase.rpc('create_audit_log', {
        p_user_id: userId,
        p_action: action,
        p_resource_type: 'auth',
        p_resource_id: null,
        p_old_values: null,
        p_new_values: null,
        p_metadata: metadata ? (metadata as never) : null,
      });
    } catch {
      // Silent fail - audit log must never block auth flow
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error && data.user) {
      void recordAudit(data.user.id, 'login', { email, user_agent: navigator.userAgent });
    }
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    if (!error && data.user) {
      void recordAudit(data.user.id, 'signup', { email });
    }
    return { error: error as Error | null };
  };

  const signOut = async () => {
    const currentUserId = user?.id;
    if (currentUserId) {
      await recordAudit(currentUserId, 'logout');
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Nao lanca quando nao existe AuthProvider: usado por componentes que tambem aparecem fora da area autenticada.
export const useOptionalAuth = () => useContext(AuthContext) ?? null;
