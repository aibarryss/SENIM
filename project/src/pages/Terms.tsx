import { ShieldCheck, FileText, AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function Terms() {
  const { t } = useI18n();

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-xl">
      <div className="flex items-center gap-3 mb-stack-xl">
        <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center text-secondary">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h1 className="text-[32px] leading-10 font-bold">{t('legal.terms.title')}</h1>
          <p className="text-[16px] text-on-surface-variant">{t('legal.terms.subtitle')}</p>
        </div>
      </div>

      <div className="space-y-stack-lg max-w-2xl">
        <section className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant">
          <h2 className="text-[20px] font-bold text-primary mb-3">{t('legal.terms.acceptance.title')}</h2>
          <p className="text-[15px] text-on-surface-variant leading-relaxed">
            {t('legal.terms.acceptance.body')}
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant">
          <h2 className="text-[20px] font-bold text-primary mb-3">{t('legal.terms.roles.title')}</h2>
          <p className="text-[15px] text-on-surface-variant leading-relaxed">
            {t('legal.terms.roles.body')}
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant">
          <h2 className="text-[20px] font-bold text-primary mb-3">{t('legal.terms.verification.title')}</h2>
          <p className="text-[15px] text-on-surface-variant leading-relaxed">
            {t('legal.terms.verification.body')}
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant">
          <h2 className="text-[20px] font-bold text-primary mb-3">{t('legal.terms.payments.title')}</h2>
          <p className="text-[15px] text-on-surface-variant leading-relaxed">
            {t('legal.terms.payments.body')}
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-amber-50 border-2 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-[16px] font-bold text-amber-800 mb-2">{t('legal.terms.disclaimer.title')}</h2>
              <p className="text-[14px] text-amber-700 leading-relaxed">
                {t('legal.terms.disclaimer.body')}
              </p>
            </div>
          </div>
        </section>

        <div className="flex items-center gap-2 text-[13px] text-on-surface-variant">
          <FileText size={14} />
          {t('legal.terms.lastUpdated')}: 2026-08-02
        </div>
      </div>
    </main>
  );
}