import { Globe, Mail, Share2, Download, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full py-stack-xl bg-surface-container-highest border-t border-outline-variant/30">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="space-y-stack-md">
          <span className="text-2xl font-bold text-primary">SENIM</span>
          <p className="text-[14px] leading-relaxed text-on-surface-variant">
            Revolutionizing civic transparency through digital verification. Empowering every Kazakhstani to make a difference safely.
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
          <h4 className="text-[14px] font-semibold text-primary mb-6">Resources</h4>
          <ul className="space-y-4">
            <li><Link to="/impact" className="text-[14px] text-on-surface-variant hover:text-primary underline transition-colors">Transparency Reports</Link></li>
            <li><Link to="/impact" className="text-[14px] text-on-surface-variant hover:text-primary underline transition-colors">Audit Documents</Link></li>
            <li><Link to="/impact" className="text-[14px] text-on-surface-variant hover:text-primary underline transition-colors">Impact Map</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[14px] font-semibold text-primary mb-6">Legal</h4>
          <ul className="space-y-4">
            <li><a href="#" className="text-[14px] text-on-surface-variant hover:text-primary underline transition-colors">Terms of Service</a></li>
            <li><a href="#" className="text-[14px] text-on-surface-variant hover:text-primary underline transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="text-[14px] text-on-surface-variant hover:text-primary underline transition-colors">Contact Support</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[14px] font-semibold text-primary mb-6">Download App</h4>
          <div className="space-y-3">
            <button className="w-full py-3 px-4 bg-primary text-on-primary rounded-lg flex items-center justify-center gap-2 text-[14px] font-semibold active:scale-95 transition-transform">
              <Download size={18} /> App Store
            </button>
            <button className="w-full py-3 px-4 border border-primary text-primary rounded-lg flex items-center justify-center gap-2 text-[14px] font-semibold active:scale-95 transition-transform">
              <Play size={18} /> Google Play
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mt-stack-xl pt-stack-lg border-t border-outline-variant/30">
        <p className="text-[14px] text-on-surface-variant">© 2024 SENIM Kazakhstan. All rights reserved. Registered Charity No. 0012345</p>
      </div>
    </footer>
  );
}
