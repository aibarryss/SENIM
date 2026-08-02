import { useEffect, useState } from 'react';
import { Store, MapPin, Loader2, QrCode, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { cityLabel } from '@/lib/cities';
import { getVoucher, redeemVoucher } from '@/lib/voucher-demo';
import type { Partner } from '@/lib/types';
import type { Voucher as DemoVoucher } from '@/lib/voucher-demo';

type ScanState =
  | { kind: 'idle' }
  | { kind: 'valid'; voucher: DemoVoucher }
  | { kind: 'invalid' }
  | { kind: 'alreadyRedeemed'; voucher: DemoVoucher }
  | { kind: 'redeemed'; voucher: DemoVoucher };

export default function PartnerStores() {
  const { t } = useI18n();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [codeInput, setCodeInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [scanState, setScanState] = useState<ScanState>({ kind: 'idle' });

  useEffect(() => {
    supabase
      .from('partners')
      .select('*')
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching partners:', error);
        }
        setPartners((data as Partner[]) || []);
        setLoading(false);
      });
  }, []);

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
      const result = redeemVoucher(scanState.voucher.code);
      if (result.found) {
        // Re-read the freshly updated voucher from localStorage.
        setScanState({ kind: 'redeemed', voucher: result.voucher });
      }
      setRedeeming(false);
    }, 600);
  };

  const formatKzt = (n: number) => `₸${n.toLocaleString()}`;

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-xl">
      {/* Page Header */}
      <div className="mb-stack-xl">
        <h1 className="text-[32px] leading-10 font-bold mb-2">{t('partners.title')}</h1>
        <p className="text-[18px] leading-7 text-on-surface-variant max-w-2xl">
          {t('partners.subtitle')}
        </p>
      </div>

      {/* Demo Partner Scan */}
      <section className="mb-stack-xl p-6 rounded-2xl border border-outline-variant bg-surface-container-low">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center text-secondary">
            <QrCode size={20} />
          </div>
          <div>
            <h2 className="text-[20px] font-semibold text-primary">{t('voucher.scanTitle')}</h2>
          </div>
        </div>
        <p className="text-[14px] text-on-surface-variant mb-4">
          {t('voucher.scanHint')}
        </p>

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

        <p className="text-[12px] text-on-surface-variant">
          {t('voucher.demoNote')}
        </p>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-secondary" />
        </div>
      ) : partners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Store size={48} className="text-outline-variant mb-4" />
          <p className="text-[18px] text-on-surface-variant">{t('partners.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {partners.map((partner) => (
            <div
              key={partner.id}
              className="bg-surface-container-lowest rounded-xl overflow-hidden card-shadow flex flex-col group hover:translate-y-[-4px] transition-transform duration-300"
            >
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0"
                    style={{ backgroundColor: partner.logo_color }}
                  >
                    {partner.logo_letter}
                  </div>
                  <div>
                    <h3 className="text-[20px] font-semibold">{partner.name}</h3>
                    <p className="text-[14px] text-on-surface-variant">{partner.type}</p>
                  </div>
                </div>
                <div className="mt-auto flex items-center gap-2 text-[14px] text-on-surface-variant">
                  <MapPin size={16} className="text-secondary shrink-0" />
                  {cityLabel(partner.city, t)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}