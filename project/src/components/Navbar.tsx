import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, Globe } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n, type Locale } from '@/lib/i18n';
import VerificationBadge from '@/components/VerificationBadge';

interface NavbarProps {
  onLoginClick: () => void;
  onDonateClick: () => void;
}

const locales: Locale[] = ['kk', 'ru', 'en'];

export default function Navbar({ onLoginClick, onDonateClick }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const canCreateRequest = profile?.role === 'susn' && profile?.verified === true;
  const isAdmin = profile?.role === 'admin';

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-[14px] font-semibold leading-5 tracking-[0.01em] transition-all duration-200 pb-1 ${
      isActive
        ? 'text-primary border-b-2 border-primary'
        : 'text-on-surface-variant hover:text-primary'
    }`;

  const localeBtnClass = (l: Locale) =>
    `px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
      locale === l
        ? 'bg-primary text-on-primary'
        : 'text-on-surface-variant hover:bg-surface-container-high'
    }`;

  const handleDonate = () => {
    setMobileOpen(false);
    onDonateClick();
  };

  const handleLogin = () => {
    setMobileOpen(false);
    if (user) {
      signOut();
    } else {
      onLoginClick();
    }
  };

  const handleNavClick = () => setMobileOpen(false);

  return (
    <header className="w-full sticky top-0 z-50 bg-surface-container-lowest border-b border-outline-variant shadow-sm h-20">
      <div className="flex justify-between items-center h-full px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="flex items-center gap-8">
          <NavLink to="/" className="text-2xl font-bold text-primary tracking-tight" onClick={handleNavClick}>
            SENIM
          </NavLink>
          <nav className="hidden md:flex gap-6 items-center">
            <NavLink to="/impact" className={navLinkClass}>{t('nav.impact')}</NavLink>
            <NavLink to="/browse" className={navLinkClass}>{t('nav.browseRequests')}</NavLink>
            {canCreateRequest && (
              <NavLink to="/create-request" className={navLinkClass}>{t('nav.createRequest')}</NavLink>
            )}
            <NavLink to="/partners" className={navLinkClass}>{t('nav.partnerStores')}</NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={navLinkClass}>{t('nav.admin')}</NavLink>
            )}
            <NavLink to="/" className={navLinkClass}>{t('nav.howItWorks')}</NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1 bg-surface-container-low rounded-lg p-1">
            <Globe size={14} className="text-on-surface-variant ml-1.5" />
            {locales.map((l) => (
              <button key={l} onClick={() => setLocale(l)} className={localeBtnClass(l)}>
                {t(`nav.locale.${l}`)}
              </button>
            ))}
          </div>
          {user && <VerificationBadge />}
          <button
            onClick={handleLogin}
            className="text-[14px] font-semibold text-on-surface hover:opacity-80 active:scale-95 transition-all"
          >
            {user ? t('nav.signOut') : t('nav.login')}
          </button>
          <button
            onClick={handleDonate}
            className="bg-primary text-on-primary text-[14px] font-semibold px-6 py-2.5 rounded-full hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/10"
          >
            {t('nav.donate')}
          </button>
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav className="md:hidden flex flex-col gap-4 px-margin-mobile py-4 bg-surface-container-lowest border-b border-outline-variant">
          <NavLink to="/impact" className={navLinkClass} onClick={handleNavClick}>{t('nav.impact')}</NavLink>
          <NavLink to="/browse" className={navLinkClass} onClick={handleNavClick}>{t('nav.browseRequests')}</NavLink>
          {canCreateRequest && (
            <NavLink to="/create-request" className={navLinkClass} onClick={handleNavClick}>{t('nav.createRequest')}</NavLink>
          )}
          <NavLink to="/partners" className={navLinkClass} onClick={handleNavClick}>{t('nav.partnerStores')}</NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClass} onClick={handleNavClick}>{t('nav.admin')}</NavLink>
          )}
          <NavLink to="/" className={navLinkClass} onClick={handleNavClick}>{t('nav.howItWorks')}</NavLink>
          <div className="flex items-center gap-1 pt-2 border-t border-outline-variant w-fit bg-surface-container-low rounded-lg p-1">
            <Globe size={14} className="text-on-surface-variant ml-1.5" />
            {locales.map((l) => (
              <button key={l} onClick={() => setLocale(l)} className={localeBtnClass(l)}>
                {t(`nav.locale.${l}`)}
              </button>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}