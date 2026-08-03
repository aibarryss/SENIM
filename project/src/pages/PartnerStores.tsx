import { Store } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function PartnerStores() {
  const { t } = useI18n();

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-xl">
      {/* Page Header */}
      <div className="mb-stack-xl">
        <h1 className="text-[32px] leading-10 font-bold mb-2">{t('partners.title')}</h1>
        <p className="text-[18px] leading-7 text-on-surface-variant max-w-2xl">
          {t('partners.subtitle')}
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-10 md:p-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary-container flex items-center justify-center text-secondary mx-auto mb-6">
          <Store size={32} />
        </div>
        <h2 className="text-[24px] font-bold text-primary mb-3">
          {t('partners.title')}
        </h2>
        <p className="text-[16px] leading-7 text-on-surface-variant max-w-xl mx-auto mb-6">
          {t('partners.subtitle')}
        </p>
        <span className="inline-flex items-center gap-2 text-[14px] font-medium text-amber-800 bg-amber-100 border border-amber-200 px-4 py-2 rounded-full">
          {t('partners.status')}
        </span>
      </div>
    </main>
  );
}