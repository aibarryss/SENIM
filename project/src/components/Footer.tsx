import { Globe, Mail, Share2, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';

interface FooterProps {
  onOpenIntro?: () => void;
}

export default function Footer({ onOpenIntro }: FooterProps) {
  const { t } = useI18n();

  return (
    <footer className="w-full py-stack-xl bg-surface-container-highest border-t border-outline-variant/30">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="space-y-stack-md">
          <span className="text-2xl font-bold text-primary">SENIM</span>
          <p className="text-[14px] leading-relaxed text-on-surface-variant">
            {t('footer.tagline')}
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-primary hover:text-white transition-all">
              <Globe size={20} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-primary hover:text-white transition-all">
              <Mail size={20} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-primary hover:text-white transition-all">
              <Share2 size={20} />
            </a>
          </div>
        </div>
        <div>
          <h4 className="text-[14px] font-semibold text-primary mb-6">{t('footer.resources')}</h4>
          <ul className="space-y-4">
            <li>
              <button onClick={onOpenIntro} className="text-[14px] text-on-surface-variant hover:text-primary underline transition-colors flex items-center gap-1.5">
                <Info size={14} /> {t('footer.aboutPlatform')}
              </button>
            </li>
            <li><Link to="/impact" className="text-[14px] text-on-surface-variant hover:text-primary underline transition-colors">{t('footer.howItWorks')}</Link></li>
            <li><Link to="/impact" className="text-[14px] text-on-surface-variant hover:text-primary underline transition-colors">{t('footer.impactMap')}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[14px] font-semibold text-primary mb-6">{t('footer.legal')}</h4>
          <ul className="space-y-4">
            <li><Link to="/terms" className="text-[14px] text-on-surface-variant hover:text-primary underline transition-colors">{t('footer.terms')}</Link></li>
            <li><Link to="/privacy" className="text-[14px] text-on-surface-variant hover:text-primary underline transition-colors">{t('footer.privacy')}</Link></li>
            <li><a href="mailto:support@senim.kz" className="text-[14px] text-on-surface-variant hover:text-primary underline transition-colors">{t('footer.contactSupport')}</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mt-stack-xl pt-stack-lg border-t border-outline-variant/30">
        <p className="text-[14px] text-on-surface-variant">{t('footer.copyright')}</p>
      </div>
    </footer>
  );
}
