import { createContext, useContext, ReactNode } from 'react';

// Simple context for single-user app (no authentication needed)
interface AuthContextType {
  user: { id: string; name: string };
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Single user - always "logged in"
  const user = { id: 'single-user', name: 'Writer' };
  const loading = false;

  return (
    <AuthContext.Provider value={{ user, loading }}>
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
