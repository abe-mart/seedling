import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession, signIn as authSignIn, signUp as authSignUp, signOut as authSignOut } from '../lib/auth-client';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Update user from session
    if (session.data?.user) {
      setUser(session.data.user as User);
      
      // Create profile if it doesn't exist
      api.profile.get().catch(() => {
        console.log('Profile will be created on first access');
      });
    } else {
      setUser(null);
    }
  }, [session.data]);

  const handleSignUp = async (email: string, password: string, displayName?: string) => {
    try {
      await authSignUp.email({
        email,
        password,
        name: displayName || email.split('@')[0]
      });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    try {
      await authSignIn.email({
        email,
        password
      });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const handleSignOut = async () => {
    await authSignOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading: session.isPending, 
      signUp: handleSignUp, 
      signIn: handleSignIn, 
      signOut: handleSignOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
