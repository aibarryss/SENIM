import { useEffect, useState } from 'react';
import { Store, QrCode, CheckCircle, XCircle, AlertTriangle, History, Activity } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import {
  getVoucher,
  redeemVoucher,
  createUserVoucher,
  listActiveVouchers,
  listRedeemedToday,
  listRedeemedVouchers,
  totalAssistanceDelivered,
} from '@/lib/voucher-demo';
import type { Voucher } from '@/lib/voucher-demo';

type ScanState =
  | { kind: 'idle' }
  | { kind: 'valid'; voucher: Voucher }
  | { kind: 'invalid' }
  | { kind: 'alreadyRedeemed'; voucher: Voucher }
  | { kind: 'redeemed'; voucher: Voucher };

export default function PartnerDashboard() {
  const { t } = useI18n();
  const { user, profile } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [scanState, setScanState] = useState<ScanState>({ kind: 'idle' });
  const [codeInput, setCodeInput] = useState('');
  const [statsVersion, setStatsVersion] = useState(0);

  // Re-render stats whenever a voucher is redeemed. The stats derive from
  // localStorage demo vouchers (explicitly DEMO — see form and note below).
  useEffect(() => {
    // no-op; used to trigger recompute on statsVersion change
  }, [statsVersion]);

  const formatKzt = (n: number) => `₸${n.toLocaleString()}`;
  const formatDate = (iso: string) => new Date(iso).toLocaleString();

  const handleScan = () => {
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    setScanning(true);
    // Simulate a short network round-trip to make the demo feel real.
    setTimeout(() => {
      const voucher = getVoucher(code);
      if (!voucher) {
        setScanState({ kind: 'invalid' });
      } else if (voucher.status === 'redeemed') {
        setScanState({ kind: 'alreadyRedeemed', voucher });
      } else {
        setScanState({ kind: 'valid', voucher });
      }
      setScanning(false);
    }, 600);
  };

  const handleRedeem = () => {
    if (scanState.kind !== 'valid') return;
    setRedeeming(true);
    setTimeout(() => {
      const result = redeemVoucher(scanState.voucher.code, profile?.display_name ?? 'Demo Partner');
      if (result.found) {
        setScanState({ kind: 'redeemed', voucher: result.voucher });
        setStatsVersion((n) => n + 1);
      }
      setRedeeming(false);
    }, 600);
  };

  const handleCreateDemoVoucher = () => {
    if (!user) return;
    createUserVoucher(user.id, 5000, t('partner.demoVoucherTitle'));
    setStatsVersion((n) => n + 1);
  };

  const activeCount = listActiveVouchers().length;
  const redeemedToday = listRedeemedToday().length;
  const totalAssistance = totalAssistanceDelivered();
  const redeemedHistory = listRedeemedVouchers();

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-xl">
      <div className="mb-stack-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center text-secondary">
            <Store size={24} />
          </div>
          <div>
            <h1 className="text-[32px] leading-10 font-bold">{t('partner.title')}</h1>
            <p className="text-[16px] text-on-surface-variant">{t('partner.subtitle')}</p>
          </div>
        </div>
        <p className="text-[12px] text-on-surface-variant italic">
          {t('partner.demoNotice')}
        </p>
      </div>

      {/* ---------- Main statistics ---------- */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-stack-xl">
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6">
          <div className="flex items-center gap-3 mb-2">
            <QrCode size={20} className="text-secondary" />
            <p className="text-[14px] font-semibold text-on-surface-variant">{t('partner.activeVouchers')}</p>
          </div>
          <p className="text-[32px] font-bold text-primary">{activeCount}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity size={20} className="text-secondary" />
            <p className="text-[14px] font-semibold text-on-surface-variant">{t('partner.redeemedToday')}</p>
          </div>
          <p className="text-[32px] font-bold text-primary">{redeemedToday}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle size={20} className="text-secondary" />
            <p className="text-[14px] font-semibold text-on-surface-variant">{t('partner.totalAssistance')}</p>
          </div>
          <p className="text-[32px] font-bold text-primary">{formatKzt(totalAssistance)}</p>
        </div>
      </section>

      {/* ---------- Scan / Verify Voucher ---------- */}
      <section className="mb-stack-xl p-6 rounded-2xl border border-outline-variant bg-surface-container-low">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center text-secondary">
            <QrCode size={20} />
          </div>
          <h2 className="text-[20px] font-semibold text-primary">{t('partner.scanTitle')}</h2>
        </div>
        <p className="text-[14px] text-on-surface-variant mb-4">{t('partner.scanHint')}</p>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button
            onClick={handleCreateDemoVoucher}
            className="px-5 py-3 rounded-xl bg-secondary-container text-on-secondary text-[13px] font-semibold hover:opacity-90 active:scale-95 transition-all shrink-0"
          >
            {t('partner.createDemoVoucher')}
          </button>
        </div>

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder={t('voucher.scanPlaceholder')}
            className="flex-1 p-3 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none bg-surface-container-lowest uppercase"
          />
          <button
            onClick={handleScan}
            disabled={scanning || !codeInput.trim()}
            className="px-6 py-3 rounded-xl bg-primary text-on-primary font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 shrink-0"
          >
            {scanning ? t('voucher.scanning') : t('voucher.scan')}
          </button>
        </div>

        {scanState.kind === 'valid' && (
          <div className="p-4 rounded-xl border border-secondary bg-secondary-container/10 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={20} className="text-secondary" />
              <p className="font-semibold text-secondary">{t('voucher.valid')}</p>
            </div>
            <p className="text-[14px] text-on-surface-variant mb-3">{t('voucher.validBody')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[14px] mb-4">
              <div className="p-3 rounded-lg bg-surface-container-lowest">
                <p className="text-[12px] text-on-surface-variant mb-1">{t('voucher.codeLabel')}</p>
                <p className="font-semibold break-all">{scanState.voucher.code}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-lowest">
                <p className="text-[12px] text-on-surface-variant mb-1">{t('voucher.amount')}</p>
                <p className="font-semibold">{formatKzt(scanState.voucher.amount)}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-lowest">
                <p className="text-[12px] text-on-surface-variant mb-1">{t('voucher.campaign')}</p>
                <p className="font-semibold break-all">{scanState.voucher.campaignTitle}</p>
              </div>
            </div>
            <button
              onClick={handleRedeem}
              disabled={redeeming}
              className="w-full bg-secondary text-on-secondary py-3 rounded-xl font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              {redeeming ? t('voucher.redeeming') : t('voucher.redeem')}
            </button>
          </div>
        )}

        {scanState.kind === 'invalid' && (
          <div className="p-4 rounded-xl border border-error bg-error-container/10 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle size={20} className="text-error" />
              <p className="font-semibold text-error">{t('voucher.invalid')}</p>
            </div>
            <p className="text-[14px] text-on-surface-variant">{t('voucher.invalidBody')}</p>
          </div>
        )}

        {scanState.kind === 'alreadyRedeemed' && (
          <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-lowest mb-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={20} className="text-error" />
              <p className="font-semibold text-error">{t('voucher.alreadyRedeemed')}</p>
            </div>
            <p className="text-[14px] text-on-surface-variant mb-3">{t('voucher.alreadyRedeemedBody')}</p>
            <div className="flex gap-2 text-[14px]">
              <div className="flex-1 p-3 rounded-lg bg-surface-container-low">
                <p className="text-[12px] text-on-surface-variant mb-1">{t('voucher.codeLabel')}</p>
                <p className="font-semibold break-all">{scanState.voucher.code}</p>
              </div>
              <div className="flex-1 p-3 rounded-lg bg-surface-container-low">
                <p className="text-[12px] text-on-surface-variant mb-1">{t('voucher.amount')}</p>
                <p className="font-semibold">{formatKzt(scanState.voucher.amount)}</p>
              </div>
            </div>
            <button
              disabled
              className="w-full mt-3 bg-outline-variant text-on-surface-variant py-3 rounded-xl font-semibold opacity-60"
            >
              {t('voucher.redeem')}
            </button>
          </div>
        )}

        {scanState.kind === 'redeemed' && (
          <div className="p-4 rounded-xl border border-secondary bg-secondary-container/10 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={20} className="text-secondary" />
              <p className="font-semibold text-secondary">{t('voucher.redeemedSuccess')}</p>
            </div>
            <p className="text-[14px] text-on-surface-variant mb-3">{t('voucher.redeemedSuccessBody')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[14px]">
              <div className="p-3 rounded-lg bg-surface-container-lowest">
                <p className="text-[12px] text-on-surface-variant mb-1">{t('voucher.codeLabel')}</p>
                <p className="font-semibold break-all">{scanState.voucher.code}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-lowest">
                <p className="text-[12px] text-on-surface-variant mb-1">{t('voucher.amount')}</p>
                <p className="font-semibold">{formatKzt(scanState.voucher.amount)}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-lowest">
                <p className="text-[12px] text-on-surface-variant mb-1">{t('voucher.status')}</p>
                <p className="font-semibold text-secondary">{t('voucher.redeemed')}</p>
              </div>
            </div>
          </div>
        )}

        <p className="text-[12px] text-on-surface-variant">{t('voucher.demoNote')}</p>
      </section>

      {/* ---------- Redemption history ---------- */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <History size={20} className="text-secondary" />
          <h2 className="text-[20px] font-semibold text-primary">{t('partner.historyTitle')}</h2>
        </div>
        {redeemedHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-surface-container-low rounded-2xl">
            <History size={40} className="text-outline-variant mb-3" />
            <p className="text-[16px] text-on-surface-variant">{t('partner.historyEmpty')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {redeemedHistory.map((v) => (
              <div key={v.code} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-primary break-all">{v.campaignTitle}</p>
                  <p className="text-[12px] text-on-surface-variant font-mono">{v.code}</p>
                </div>
                <div className="text-[14px] font-semibold">{formatKzt(v.amount)}</div>
                <div className="text-[12px] text-on-surface-variant">
                  {v.redeemedAt ? formatDate(v.redeemedAt) : formatDate(v.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}