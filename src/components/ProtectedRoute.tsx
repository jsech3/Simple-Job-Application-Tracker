import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { AuthPage } from './AuthPage';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, isGuestMode } = useAuth();

  // Guest mode (no Supabase config) — skip auth entirely
  if (isGuestMode) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return <>{children}</>;
}
