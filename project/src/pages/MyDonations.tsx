import { useEffect, useState, useCallback } from 'react';
import { Heart, Loader2, PackageCheck, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { localizedText } from '@/lib/i18n-text';
import type { DonationIntent, Campaign } from '@/lib/types';

interface DonationWithCampaign extends DonationIntent {
  campaign?: Campaign | null;
}

export default function MyDonations() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [donations, setDonations] = useState<DonationWithCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDonations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const { data, error: intentError } = await supabase
      .from('donation_intents')
      .select('*')
      .eq('donor_id', user.id)
      .order('created_at', { ascending: false });

    if (intentError) {
      setError(intentError.message);
      setDonations([]);
      setLoading(false);
      return;
    }

    const intents = (data as DonationIntent[]) || [];

    // Load campaigns for the referenced campaign ids (public read).
    const campaignIds = [...new Set(intents.map((i) => i.campaign_id).filter(Boolean))] as string[];
    let campaigns: Campaign[] = [];
    if (campaignIds.length > 0) {
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .in('id', campaignIds);
      if (!campaignError) {
        campaigns = (campaignData as Campaign[]) || [];
      }
    }
    const campaignById = new Map(campaigns.map((c) => [c.id, c]));

    setDonations(
      intents.map((intent) => ({
        ...intent,
        campaign: intent.campaign_id ? (campaignById.get(intent.campaign_id) ?? null) : null,
      })),
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadDonations();
  }, [loadDonations]);

  const formatKzt = (n: number) => `₸${n.toLocaleString()}`;
  const formatFullDate = (iso: string) => new Date(iso).toLocaleString();

  const statusBadge = (status: DonationIntent['status']) => {
    if (status === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 size={12} /> {t('myDonations.statusConfirmed')}
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-red-100 text-red-800 border border-red-200">
          {t('myDonations.statusRejected')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
        <Clock size={12} /> {t('myDonations.statusPending')}
      </span>
    );
  };

  const campaignState = (c: Campaign | null | undefined) => {
    if (!c) return null;
    const pct = Math.min(100, Math.max(0, Math.round((c.raised_amount / c.goal_amount) * 100)));
    return { pct, funded: c.status === 'funded' };
  };

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-xl">
      <div className="mb-stack-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center text-secondary">
            <Heart size={24} />
          </div>
          <div>
            <h1 className="text-[32px] leading-10 font-bold">{t('myDonations.title')}</h1>
            <p className="text-[16px] text-on-surface-variant">{t('myDonations.subtitle')}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-error bg-error-container/10 text-error text-[14px]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-secondary" />
        </div>
      ) : donations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <PackageCheck size={48} className="text-outline-variant mb-4" />
          <p className="text-[18px] text-on-surface-variant">{t('myDonations.empty')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {donations.map((donation) => {
            const state = campaignState(donation.campaign);
            const title = donation.campaign
              ? localizedText(donation.campaign.title, donation.campaign.title_i18n, locale)
              : t('myDonations.generalFund');
            return (
              <div
                key={donation.id}
                className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <p className="text-[16px] font-semibold text-primary">{title}</p>
                      <p className="text-[13px] text-on-surface-variant">{formatFullDate(donation.created_at)}</p>
                    </div>
                  </div>
                  {statusBadge(donation.status)}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[14px] mb-4">
                  <div className="p-3 rounded-lg bg-surface-container-low">
                    <p className="text-[12px] text-on-surface-variant mb-1">{t('myDonations.amount')}</p>
                    <p className="font-semibold">{formatKzt(donation.amount)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-container-low">
                    <p className="text-[12px] text-on-surface-variant mb-1">{t('myDonations.paymentId')}</p>
                    <p className="font-semibold font-mono break-all">
                      {donation.provider_reference || '—'}
                    </p>
                  </div>
                </div>

                {state && (
                  <div className="p-4 rounded-xl bg-surface-container-low mb-2">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[14px] font-semibold">
                        <span className="text-primary font-bold">{formatKzt(donation.campaign!.raised_amount)}</span>{' '}
                        <span className="text-on-surface-variant font-normal">
                          {t('myDonations.of', { goal: formatKzt(donation.campaign!.goal_amount) })}
                        </span>
                      </span>
                      <span className="text-[14px] font-semibold text-secondary">{state.pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${state.funded ? 'bg-emerald-500' : 'bg-secondary'}`}
                        style={{ width: `${state.pct}%` }}
                      />
                    </div>
                    <p className="text-[13px] text-on-surface-variant mt-2">
                      {state.funded
                        ? t('myDonations.fullyFunded')
                        : t('myDonations.fundedProgress', {
                            raised: formatKzt(donation.campaign!.raised_amount),
                            goal: formatKzt(donation.campaign!.goal_amount),
                          })}
                      {state.funded && t('myDonations.helpDelivered')}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}