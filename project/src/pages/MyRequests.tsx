import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HandHeart, Loader2, QrCode, Bell, PackageCheck, Clock, Wifi, Plus, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { localizedText } from '@/lib/i18n-text';
import VoucherQR from '@/components/VoucherQR';
import { createUserVoucher, listUserVouchers } from '@/lib/voucher-demo';
import {
  seedDemoNotifications,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/demo-notifications';
import type { Voucher } from '@/lib/voucher-demo';
import type { Campaign } from '@/lib/types';

const MAX_DEMO_VOUCHERS = 3;

export default function MyRequests() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [notifications, setNotifications] = useState<ReturnType<typeof listNotifications>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoVoucherBusy, setDemoVoucherBusy] = useState(false);
  const [voucherLimitReached, setVoucherLimitReached] = useState(false);

  const refreshVouchers = useCallback(() => {
    if (!user) return;
    const list = listUserVouchers(user.id);
    setVouchers(list);
    setVoucherLimitReached(list.filter((v) => v.status === 'active').length >= MAX_DEMO_VOUCHERS);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    // Seed demo notifications once (idempotent by type).
    seedDemoNotifications(user.id);
    setNotifications(listNotifications(user.id));

    // Load user's own campaigns (requests created by this SUSN user).
    supabase
      .from('campaigns')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error: queryError }) => {
        if (queryError) {
          setError(queryError.message);
        } else {
          setCampaigns((data as Campaign[]) || []);
        }
        setLoading(false);
      });

    refreshVouchers();
  }, [user, refreshVouchers]);

  const handleGenerateDemoVoucher = () => {
    if (!user) return;
    if (voucherLimitReached) return;
    setDemoVoucherBusy(true);
    // Create a demo voucher against the first active campaign, or a default.
    const target = campaigns.find((c) => c.status === 'active') ?? campaigns[0];
    const title = target
      ? localizedText(target.title, target.title_i18n, locale)
      : t('myRequests.defaultVoucherTitle');
    const amount = target ? Math.min(target.goal_amount - target.raised_amount, 5000) || 5000 : 5000;
    createUserVoucher(user.id, amount, title);
    refreshVouchers();
    setTimeout(() => setDemoVoucherBusy(false), 400);
  };

  const formatKzt = (n: number) => `₸${n.toLocaleString()}`;
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

  const notifText = (type: string) => ({
    title: t(`myRequests.notif.${type}.title` as never),
    body: t(`myRequests.notif.${type}.body` as never),
  });

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-xl">
      <div className="mb-stack-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center text-secondary">
            <HandHeart size={24} />
          </div>
          <div>
            <h1 className="text-[32px] leading-10 font-bold">{t('myRequests.title')}</h1>
            <p className="text-[16px] text-on-surface-variant">{t('myRequests.subtitle')}</p>
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
      ) : (
        <div className="space-y-stack-xl">
          {/* ---------- Notifications ---------- */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[20px] font-semibold text-primary flex items-center gap-2">
                <Bell size={20} /> {t('myRequests.notificationsTitle')}
              </h2>
              {notifications.some((n) => !n.read) && (
                <button
                  onClick={() => {
                    if (!user) return;
                    markAllNotificationsRead(user.id);
                    setNotifications(listNotifications(user.id));
                  }}
                  className="text-[13px] font-semibold text-secondary hover:opacity-80 transition-all"
                >
                  {t('myRequests.markAllRead')}
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="text-[14px] text-on-surface-variant">{t('myRequests.notificationsEmpty')}</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => {
                  const { title, body } = notifText(n.type);
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        if (!user || n.read) return;
                        markNotificationRead(user.id, n.id);
                        setNotifications(listNotifications(user.id));
                      }}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        n.read
                          ? 'bg-surface-container-lowest border-outline-variant opacity-70'
                          : 'bg-secondary-container/10 border-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {!n.read && <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />}
                        <p className="text-[15px] font-semibold text-primary">{title}</p>
                      </div>
                      <p className="text-[14px] text-on-surface-variant">{body}</p>
                      <p className="text-[12px] text-on-surface-variant mt-1">{formatDate(n.createdAt)}</p>
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-[12px] text-on-surface-variant mt-2 italic">
              {t('myRequests.demoNotificationsNote')}
            </p>
          </section>

          {/* ---------- My Requests (My Offers) ---------- */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[20px] font-semibold text-primary">{t('myRequests.requestsTitle')}</h2>
              <button
                onClick={() => navigate('/create-request')}
                className="px-5 py-2 bg-primary text-on-primary rounded-xl text-[13px] font-semibold hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
              >
                <Plus size={16} /> {t('myRequests.requestHelpButton')}
              </button>
            </div>
            {campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-surface-container-low rounded-2xl">
                <PackageCheck size={40} className="text-outline-variant mb-3" />
                <p className="text-[16px] text-on-surface-variant">{t('myRequests.requestsEmpty')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                {campaigns.map((c) => {
                  const pct = Math.min(100, Math.max(0, Math.round((c.raised_amount / c.goal_amount) * 100)));
                  const title = localizedText(c.title, c.title_i18n, locale);
                  return (
                    <div key={c.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-[18px] font-semibold text-primary">{title}</h3>
                        {c.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-emerald-100 text-emerald-800">
                            <Wifi size={12} /> {t('myRequests.statusActive')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-emerald-100 text-emerald-800">
                            {t('myRequests.statusFunded')}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-end mb-2 text-[14px]">
                        <span className="font-semibold">
                          <span className="text-primary font-bold">{formatKzt(c.raised_amount)}</span>{' '}
                          <span className="text-on-surface-variant font-normal">/ {formatKzt(c.goal_amount)}</span>
                        </span>
                        <span className="font-semibold text-secondary">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${c.status === 'funded' ? 'bg-emerald-500' : 'bg-secondary'}`} style={{ width: `${pct}%` }} />
                      </div>
                      {c.status === 'funded' && (
                        <p className="text-[13px] font-semibold text-emerald-700 mt-2">{t('myRequests.fullyFunded')}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ---------- My Vouchers ---------- */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[20px] font-semibold text-primary flex items-center gap-2">
                <QrCode size={20} /> {t('myRequests.vouchersTitle')}
              </h2>
              <button
                onClick={handleGenerateDemoVoucher}
                disabled={demoVoucherBusy || voucherLimitReached}
                className="px-5 py-2 bg-primary text-on-primary rounded-xl text-[13px] font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Plus size={16} /> {demoVoucherBusy ? t('myRequests.generating') : t('myRequests.generateDemoVoucher')}
              </button>
            </div>

            {voucherLimitReached && (
              <div className="mb-4 p-3 rounded-lg bg-error-container/10 border border-error text-error text-[13px] flex items-center gap-2">
                <AlertCircle size={16} /> {t('myRequests.maxVouchersReached')}
              </div>
            )}

            {vouchers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-surface-container-low rounded-2xl">
                <QrCode size={40} className="text-outline-variant mb-3" />
                <p className="text-[16px] text-on-surface-variant">{t('myRequests.vouchersEmpty')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                {vouchers.map((v) => (
                  <div key={v.code} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 flex flex-col sm:flex-row gap-4 items-start">
                    <div className="shrink-0">
                      <VoucherQR code={v.code} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-[15px] font-semibold text-primary break-all">{v.campaignTitle}</p>
                        {v.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-emerald-100 text-emerald-800 shrink-0">
                            {t('voucher.active')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-surface-container-high text-on-surface-variant shrink-0">
                            {t('voucher.redeemed')}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[13px]">
                        <div className="p-2 rounded-lg bg-surface-container-low">
                          <p className="text-[11px] text-on-surface-variant">{t('voucher.amount')}</p>
                          <p className="font-semibold">{formatKzt(v.amount)}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-surface-container-low">
                          <p className="text-[11px] text-on-surface-variant">{t('voucher.codeLabel')}</p>
                          <p className="font-mono font-semibold break-all">{v.code}</p>
                        </div>
                      </div>
                      <p className="text-[12px] text-on-surface-variant mt-2 flex items-center gap-1">
                        <Clock size={12} /> {formatDate(v.createdAt)}
                        {v.redeemedAt && (
                          <span className="text-primary font-semibold"> · {t('myRequests.redeemedAt', { date: formatDate(v.redeemedAt) })}</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[12px] text-on-surface-variant mt-2 italic">{t('voucher.demoNote')}</p>
          </section>
        </div>
      )}
    </main>
  );
}