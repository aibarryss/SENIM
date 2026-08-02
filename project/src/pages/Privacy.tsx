import { Lock, FileText, AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function Privacy() {
  const { t } = useI18n();

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-xl">
      <div className="flex items-center gap-3 mb-stack-xl">
        <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center text-secondary">
          <Lock size={24} />
        </div>
        <div>
          <h1 className="text-[32px] leading-10 font-bold">{t('legal.privacy.title')}</h1>
          <p className="text-[16px] text-on-surface-variant">{t('legal.privacy.subtitle')}</p>
        </div>
      </div>

      <div className="space-y-stack-lg max-w-2xl">
        <section className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant">
          <h2 className="text-[20px] font-bold text-primary mb-3">{t('legal.privacy.dataCollected.title')}</h2>
          <p className="text-[15px] text-on-surface-variant leading-relaxed mb-3">
            {t('legal.privacy.dataCollected.body')}
          </p>
          <ul className="space-y-2 text-[15px] text-on-surface-variant">
            <li className="flex items-start gap-2">
              <span className="text-secondary mt-0.5">•</span>
              {t('legal.privacy.dataCollected.email')}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-secondary mt-0.5">•</span>
              {t('legal.privacy.dataCollected.phone')}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-secondary mt-0.5">•</span>
              {t('legal.privacy.dataCollected.documents')}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-secondary mt-0.5">•</span>
              {t('legal.privacy.dataCollected.donations')}
            </li>
          </ul>
        </section>

        <section className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant">
          <h2 className="text-[20px] font-bold text-primary mb-3">{t('legal.privacy.documentStorage.title')}</h2>
          <p className="text-[15px] text-on-surface-variant leading-relaxed">
            {t('legal.privacy.documentStorage.body')}
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant">
          <h2 className="text-[20px] font-bold text-primary mb-3">{t('legal.privacy.aiReview.title')}</h2>
          <p className="text-[15px] text-on-surface-variant leading-relaxed">
            {t('legal.privacy.aiReview.body')}
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant">
          <h2 className="text-[20px] font-bold text-primary mb-3">{t('legal.privacy.dataRetention.title')}</h2>
          <p className="text-[15px] text-on-surface-variant leading-relaxed">
            {t('legal.privacy.dataRetention.body')}
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant">
          <h2 className="text-[20px] font-bold text-primary mb-3">{t('legal.privacy.userRights.title')}</h2>
          <p className="text-[15px] text-on-surface-variant leading-relaxed">
            {t('legal.privacy.userRights.body')}
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-amber-50 border-2 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-[16px] font-bold text-amber-800 mb-2">{t('legal.privacy.disclaimer.title')}</h2>
              <p className="text-[14px] text-amber-700 leading-relaxed">
                {t('legal.privacy.disclaimer.body')}
              </p>
            </div>
          </div>
        </section>

        <div className="flex items-center gap-2 text-[13px] text-on-surface-variant">
          <FileText size={14} />
          {t('legal.privacy.lastUpdated')}: 2026-08-02
        </div>
      </div>
    </main>
  );
}