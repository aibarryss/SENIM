import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

type BadgeStatus = 'pending' | 'verified' | 'rejected' | null;

const badgeStyles: Record<Exclude<BadgeStatus, null>, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  verified: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

const badgeKeys: Record<Exclude<BadgeStatus, null>, 'auth.statusPending' | 'auth.statusVerified' | 'auth.statusRejected'> = {
  pending: 'auth.statusPending',
  verified: 'auth.statusVerified',
  rejected: 'auth.statusRejected',
};

/**
 * Shows a small badge with the current verification/application
 * status for SUSN and partner users. Reads from the user's own
 * `susn_verification_requests` / `partner_applications` rows.
 * RLS ensures only the owner can read their own row.
 */
export default function VerificationBadge() {
  const { user, profile, loading } = useAuth();
  const { t } = useI18n();
  const [status, setStatus] = useState<BadgeStatus>(null);

  useEffect(() => {
    let cancelled = false;

    const loadStatus = async () => {
      if (!user || !profile) return;

      // Already verified — no need to query the request tables.
      if (profile.verified) {
        setStatus('verified');
        return;
      }

      const table = profile.role === 'partner' ? 'partner_applications' : 'susn_verification_requests';
      const { data, error } = await supabase
        .from(table)
        .select('status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled || error) return;
      const s = data?.status as string | undefined;
      if (s === 'approved') setStatus('verified');
      else if (s === 'pending') setStatus('pending');
      else if (s === 'rejected') setStatus('rejected');
    };

    loadStatus();

    return () => {
      cancelled = true;
    };
  }, [user, profile]);

  if (loading || !user || !profile || status === null) return null;
  if (profile.role !== 'susn' && profile.role !== 'partner') return null;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold border ${badgeStyles[status]}`}
    >
      {t(badgeKeys[status])}
    </span>
  );
}