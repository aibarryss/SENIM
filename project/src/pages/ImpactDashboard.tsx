import { useEffect, useState } from 'react';
import {
  Download, Share, ShoppingCart, Stethoscope, ReceiptText,
  Users, Store, BadgeCheck, FileText, Landmark, Gavel, Info,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import type { Transaction, PlatformStats } from '@/lib/types';

export default function ImpactDashboard() {
  const { t, tp } = useI18n();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(8),
      supabase.from('platform_stats').select('*').eq('id', 1).maybeSingle(),
    ]).then(([txResult, statsResult]) => {
      setTransactions((txResult.data as Transaction[]) || []);
      setStats(statsResult.data as PlatformStats | null);
      setLoading(false);
    });
  }, []);

  const formatKzt = (n: number) => `₸${n.toLocaleString()}`;
  const formatAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('impact.time.justNow');
    if (mins < 60) return tp('impact.time.minute', mins);
    return tp('impact.time.hour', Math.floor(mins / 60));
  };

  const txIconMap: Record<string, { icon: typeof ShoppingCart; bg: string; color: string }> = {
    voucher_redemption: { icon: ShoppingCart, bg: 'bg-secondary-container', color: 'text-on-secondary-container' },
    medicine_purchase: { icon: Stethoscope, bg: 'bg-tertiary-fixed', color: 'text-on-tertiary-fixed-variant' },
    utility_payment: { icon: ReceiptText, bg: 'bg-secondary-container', color: 'text-on-secondary-container' },
  };

  const allocations = [
    { label: t('impact.allocations.groceries'), pct: 60, color: 'bg-secondary' },
    { label: t('impact.allocations.medicine'), pct: 30, color: 'bg-secondary' },
    { label: t('impact.allocations.utilities'), pct: 8, color: 'bg-secondary' },
    { label: t('impact.allocations.ops'), pct: 2, color: 'bg-on-surface-variant opacity-20' },
  ];

  const auditDocs = [
    { icon: FileText, label: t('impact.audit.q3') },
    { icon: Landmark, label: t('impact.audit.ledger') },
    { icon: Gavel, label: t('impact.audit.tax') },
  ];

  const statCards = [
    { icon: Users, value: stats ? `${stats.families_helped.toLocaleString()}+` : '12,450+', label: t('impact.stats.families') },
    { icon: Store, value: stats ? stats.partner_retailers.toString() : '84', label: t('impact.stats.retailers') },
    { icon: BadgeCheck, value: '100%', label: t('impact.stats.transparency') },
  ];

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-xl">
      {/* Header */}
      <section className="mb-stack-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-[32px] leading-10 font-bold text-primary mb-1">{t('impact.title')}</h1>
            <p className="text-[18px] leading-7 text-on-surface-variant max-w-2xl">
              {t('impact.subtitle')}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-lg text-[14px] font-semibold hover:bg-surface-container-highest transition-colors">
              <Download size={20} /> {t('impact.fullAudit')}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-lg text-[14px] font-semibold hover:bg-surface-container-highest transition-colors">
              <Share size={20} /> {t('impact.shareReport')}
            </button>
          </div>
        </div>
      </section>

      {/* Bento Grid */}
      <div className="bento-grid">
        {/* Map Section */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] overflow-hidden h-[500px] relative">
          <div className="absolute top-6 left-6 z-10">
            <div className="glass-card p-4 rounded-lg shadow-sm border border-outline-variant">
              <h3 className="text-[20px] font-semibold mb-1">{t('impact.hotspots')}</h3>
              <div className="flex items-center gap-2 text-[12px] font-medium text-secondary">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                {t('impact.liveUpdates')}
              </div>
            </div>
          </div>
          <div className="w-full h-full bg-[#f1f5f9] relative">
            <div className="absolute inset-0 bg-gradient-to-br from-surface-container-low to-surface-container-high" />
            {/* Stylized map with pulsing nodes */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl font-bold text-outline-variant/20 mb-2">{t('impact.mapTitle')}</div>
                <p className="text-[14px] text-on-surface-variant">{t('impact.mapSub')}</p>
              </div>
            </div>
            <div className="absolute top-1/4 left-1/3 animate-pulse-node w-4 h-4 bg-secondary rounded-full border-2 border-white shadow-lg" />
            <div className="absolute bottom-1/3 right-1/4 animate-pulse-node w-6 h-6 bg-secondary rounded-full border-2 border-white shadow-lg" />
            <div className="absolute top-1/2 left-1/2 animate-pulse-node w-3 h-3 bg-secondary rounded-full border-2 border-white shadow-lg" />
          </div>
          <div className="absolute bottom-6 right-6 flex flex-col gap-2">
            <div className="glass-card px-4 py-2 rounded-full text-[12px] font-medium flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-secondary" /> {t('impact.redeemedVouchers')}
            </div>
            <div className="glass-card px-4 py-2 rounded-full text-[12px] font-medium flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-tertiary-fixed-dim" /> {t('impact.partnerHubs')}
            </div>
          </div>
        </div>

        {/* Fund Allocation */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] p-stack-lg flex flex-col">
          <h3 className="text-[20px] font-semibold mb-stack-lg">{t('impact.allocationsTitle')}</h3>
          <div className="flex-grow flex flex-col justify-center gap-stack-lg">
            {allocations.map((a, i) => (
              <div key={i}>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[14px] font-semibold">{a.label}</span>
                  <span className={`text-[14px] font-semibold ${a.pct === 2 ? 'text-on-surface-variant' : 'text-secondary'}`}>{a.pct}%</span>
                </div>
                <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div className={`h-full ${a.color} rounded-full transition-all duration-700`} style={{ width: `${a.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-stack-xl pt-stack-lg border-t border-outline-variant">
            <p className="text-[14px] leading-5 text-on-surface-variant italic">
              {t('impact.mealsNote')}
            </p>
          </div>
        </div>

        {/* Transaction Feed */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] p-stack-lg overflow-hidden">
          <div className="flex justify-between items-center mb-stack-lg">
            <h3 className="text-[20px] font-semibold">{t('impact.feedTitle')}</h3>
            <span className="text-[12px] font-medium bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full flex items-center gap-1">
              <BadgeCheck size={14} /> {t('impact.blockchainVerified')}
            </span>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high" />
                    <div className="space-y-2">
                      <div className="h-4 bg-surface-container-high rounded w-40" />
                      <div className="h-3 bg-surface-container-high rounded w-32" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-surface-container-high rounded w-20" />
                    <div className="h-3 bg-surface-container-high rounded w-16" />
                  </div>
                </div>
              ))
            ) : (
              transactions.map((tx) => {
                const config = txIconMap[tx.type] || txIconMap.voucher_redemption;
                const Icon = config.icon;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg hover:bg-surface-container border border-transparent hover:border-outline-variant transition-all hover:translate-x-1"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center ${config.color}`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold">
                          {tx.type === 'voucher_redemption' && t('impact.tx.voucher', { n: tx.voucher_number ?? '' })}
                          {tx.type === 'medicine_purchase' && t('impact.tx.medicine', { n: tx.voucher_number ?? '' })}
                          {tx.type === 'utility_payment' && t('impact.tx.utility', { n: tx.voucher_number ?? '' })}
                        </p>
                        <p className="text-[14px] text-on-surface-variant">{tx.store_name}, {tx.city}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] font-semibold text-primary">{formatKzt(tx.amount)}</p>
                      <p className="text-[12px] text-on-surface-variant">{formatAgo(tx.created_at)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Audit Panel */}
        <div className="col-span-12 lg:col-span-5 bg-primary-container rounded-xl p-stack-lg flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-[20px] font-semibold text-white mb-4">{t('impact.auditTitle')}</h3>
            <p className="text-[16px] leading-6 text-on-primary-container mb-stack-lg">
              {t('impact.auditBody')}
            </p>
            <div className="space-y-3">
              {auditDocs.map((doc, i) => {
                const Icon = doc.icon;
                return (
                  <a
                    key={i}
                    href="#"
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10 group"
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} className="text-secondary-fixed" />
                      <span className="text-[14px] font-semibold text-white">{doc.label}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
          <div className="relative z-10 mt-stack-xl">
            <div className="bg-secondary/20 border border-secondary/30 p-4 rounded-xl">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-secondary-fixed shrink-0 mt-0.5" />
                <p className="text-[12px] font-medium text-white/80 leading-relaxed">
                  {t('impact.charityNote')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <section className="mt-stack-xl grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-surface-container-low p-stack-lg rounded-xl flex items-center gap-stack-md">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-secondary">
                <Icon size={24} />
              </div>
              <div>
                <h4 className="text-[20px] font-semibold">{card.value}</h4>
                <p className="text-[12px] font-medium text-on-surface-variant uppercase tracking-wider">{card.label}</p>
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
