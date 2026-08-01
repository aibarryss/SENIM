import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import type { UserRole } from '@/lib/types';

interface ProtectedRouteProps {
  children: ReactNode;
  /** If set, the user must have this role to access the page. */
  requireRole?: UserRole;
  /** If true, the user's profile must be verified to access the page. */
  requireVerified?: boolean;
  /** Called when the user clicks "Sign In" on the not-authorized screen. */
  onLoginClick: () => void;
}

/**
 * Wraps a page element to enforce auth/role/verification gates at the
 * routing level. This is a UX convenience — the real security
 * enforcement is RLS on the database (see migrations). But showing a
 * clear "sign in" / "not verified" screen before the page loads is
 * much better UX than letting the page try a Supabase INSERT and fail.
 */
export default function ProtectedRoute({ children, requireRole, requireVerified, onLoginClick }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const { t } = useI18n();

  if (loading) {
    return (
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-xl flex items-center justify-center min-h-[50vh]">
        <Loader2 size={32} className="animate-spin text-secondary" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-xl">
        <div className="max-w-lg mx-auto text-center p-8 rounded-2xl bg-surface-container-low">
          <p className="text-[16px] text-on-surface-variant mb-6">{t('createRequest.notAuthorized')}</p>
          <button
            onClick={onLoginClick}
            className="px-8 py-3 bg-primary text-on-primary rounded-xl font-semibold hover:opacity-90 active:scale-95 transition-all"
          >
            {t('common.signIn')}
          </button>
        </div>
      </main>
    );
  }

  if (requireRole && profile?.role !== requireRole) {
    return (
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-xl">
        <div className="max-w-lg mx-auto text-center p-8 rounded-2xl bg-surface-container-low">
          <p className="text-[16px] text-on-surface-variant">{t('createRequest.notVerified')}</p>
        </div>
      </main>
    );
  }

  if (requireVerified && !profile?.verified) {
    return (
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-xl">
        <div className="max-w-lg mx-auto text-center p-8 rounded-2xl bg-surface-container-low">
          <p className="text-[16px] text-on-surface-variant">{t('createRequest.notVerified')}</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}