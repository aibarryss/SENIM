import { QRCodeSVG } from 'qrcode.react';
import { getVoucher } from '@/lib/voucher-demo';
import { useI18n } from '@/lib/i18n';

interface VoucherQRProps {
  /** The voucher code inside the QR. Only the code is encoded — no amount/campaign. */
  code: string;
}

export default function VoucherQR({ code }: VoucherQRProps) {
  const { t } = useI18n();
  const voucher = getVoucher(code);

  if (!voucher) {
    return (
      <div className="text-center text-[14px] text-on-surface-variant">
        {t('voucher.notFound')}
      </div>
    );
  }

  const formatKzt = (n: number) => `₸${n.toLocaleString()}`;

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="bg-white p-4 rounded-2xl">
        <QRCodeSVG value={voucher.code} size={180} level="M" />
      </div>
      <div className="text-center">
        <p className="text-[12px] uppercase tracking-wide text-on-surface-variant mb-1">
          {t('voucher.codeLabel')}
        </p>
        <p className="text-[20px] font-bold text-primary tracking-wider">{voucher.code}</p>
      </div>
      <div className="w-full space-y-2 text-[14px]">
        <div className="flex justify-between gap-2">
          <span className="text-on-surface-variant">{t('voucher.amount')}</span>
          <span className="font-semibold">{formatKzt(voucher.amount)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-on-surface-variant">{t('voucher.campaign')}</span>
          <span className="font-semibold text-right">{voucher.campaignTitle}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-on-surface-variant">{t('voucher.status')}</span>
          <span className={voucher.status === 'active' ? 'font-semibold text-secondary' : 'font-semibold text-error'}>
            {voucher.status === 'active' ? t('voucher.active') : t('voucher.redeemed')}
          </span>
        </div>
      </div>
    </div>
  );
}