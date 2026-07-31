import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface NavbarProps {
  onLoginClick: () => void;
  onDonateClick: () => void;
}

export default function Navbar({ onLoginClick, onDonateClick }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-[14px] font-semibold leading-5 tracking-[0.01em] transition-all duration-200 pb-1 ${
      isActive
        ? 'text-primary border-b-2 border-primary'
        : 'text-on-surface-variant hover:text-primary'
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
            <NavLink to="/impact" className={navLinkClass}>Impact</NavLink>
            <NavLink to="/browse" className={navLinkClass}>Browse Requests</NavLink>
            <NavLink to="/browse" className={navLinkClass}>Partner Stores</NavLink>
            <NavLink to="/" className={navLinkClass}>How it Works</NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleLogin}
            className="text-[14px] font-semibold text-on-surface hover:opacity-80 active:scale-95 transition-all"
          >
            {user ? 'Sign Out' : 'Login'}
          </button>
          <button
            onClick={handleDonate}
            className="bg-primary text-on-primary text-[14px] font-semibold px-6 py-2.5 rounded-full hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/10"
          >
            Donate
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
          <NavLink to="/impact" className={navLinkClass} onClick={handleNavClick}>Impact</NavLink>
          <NavLink to="/browse" className={navLinkClass} onClick={handleNavClick}>Browse Requests</NavLink>
          <NavLink to="/browse" className={navLinkClass} onClick={handleNavClick}>Partner Stores</NavLink>
          <NavLink to="/" className={navLinkClass} onClick={handleNavClick}>How it Works</NavLink>
        </nav>
      )}
    </header>
  );
}
