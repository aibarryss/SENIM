import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, QrCode, Store, Brain, HeartHandshake, PlayCircle,
  Download, Share, QrCode as QrIcon,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { PlatformStats } from '@/lib/types';

interface LandingPageProps {
  onLoginClick: () => void;
}

const heroFoodImg = 'https://images.pexels.com/photos/5425794/pexels-photo-5425794.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const heroMedsImg = 'https://images.pexels.com/photos/51929/medications-cure-tablets-pharmacy-51929.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

export default function LandingPage({ onLoginClick }: LandingPageProps) {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    supabase.from('platform_stats').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      if (data) setStats(data as PlatformStats);
    });
  }, []);

  const tickerItems = stats
    ? [
        { value: stats.food_baskets_today.toLocaleString(), label: 'Food Baskets Distributed Today' },
        { value: `₸${(stats.verified_aid_almaty / 1000000).toFixed(1)}M`, label: 'Verified Aid in Almaty' },
        { value: stats.active_qr_vouchers.toLocaleString(), label: 'Active QR Vouchers' },
        { value: '100%', label: 'Delivery Rate' },
      ]
    : [
        { value: '842', label: 'Food Baskets Distributed Today' },
        { value: '₸12.4M', label: 'Verified Aid in Almaty' },
        { value: '4,102', label: 'Active QR Vouchers' },
        { value: '100%', label: 'Delivery Rate' },
      ];

  const steps = [
    { icon: HeartHandshake, title: 'Donor Funds', desc: 'Choose a specific campaign or person. Your funds are locked into the SENIM smart contract immediately.', num: '01' },
    { icon: Brain, title: 'AI Verification', desc: 'Recipients are verified via government databases and face-ID to ensure aid goes to real people in need.', num: '02' },
    { icon: QrCode, title: 'QR Voucher', desc: 'The recipient receives a digital voucher on their phone, restricted to specific product categories only.', num: '03' },
    { icon: Store, title: 'Retail Redemption', desc: 'Vouchers are scanned at Magnum, Small, or Europharma. Retailer gets paid instantly by SENIM.', num: '04' },
  ];

  return (
    <div className="bg-surface">
      {/* Hero Section */}
      <section className="relative min-h-[700px] md:min-h-[921px] flex items-center overflow-hidden bg-surface-container-lowest">
        <div className="relative z-10 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full grid md:grid-cols-2 gap-stack-xl items-center py-stack-xl">
          <div className="space-y-stack-lg">
            <div className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-4 py-2 rounded-full text-[12px] font-medium tracking-[0.04em]">
              <ShieldCheck size={18} /> 100% Direct Verification via AI
            </div>
            <h1 className="text-5xl md:text-7xl leading-tight tracking-tight text-primary font-bold">
              Direct Impact.<br />
              <span className="gradient-text">Zero Scams.</span>
            </h1>
            <p className="text-[18px] leading-7 text-on-surface-variant max-w-lg">
              The first charity platform in Kazakhstan where your donation turns into specific products, not untraceable cash. Real food and medicine for those in need, verified by AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={onLoginClick}
                className="px-10 py-4 bg-primary text-on-primary rounded-xl font-semibold text-lg shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
              >
                Start Donating
              </button>
              <button
                onClick={() => navigate('/impact')}
                className="px-10 py-4 border-2 border-outline-variant text-on-surface rounded-xl font-semibold text-lg hover:bg-surface-container-low active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <PlayCircle size={20} /> View Transparency Report
              </button>
            </div>
          </div>

          {/* Bento Photo Grid */}
          <div className="grid grid-cols-2 gap-4 h-[400px] md:h-[500px]">
            <div className="col-span-1 row-span-2 rounded-3xl overflow-hidden shadow-2xl relative group">
              <img
                src={heroFoodImg}
                alt="Food basket"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute bottom-4 left-4 right-4 glass-card p-4 rounded-xl">
                <p className="text-[12px] font-medium text-primary mb-1">Food Basket #492</p>
                <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-secondary w-3/4" />
                </div>
              </div>
            </div>
            <div className="col-span-1 rounded-3xl overflow-hidden shadow-2xl relative group">
              <img
                src={heroMedsImg}
                alt="Medicine"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute top-4 right-4 bg-secondary text-on-secondary px-3 py-1 rounded-full text-xs font-bold">
                URGENT
              </div>
            </div>
            <div className="col-span-1 rounded-3xl overflow-hidden shadow-2xl relative bg-primary-container p-6 flex flex-col justify-end">
              <QrIcon size={40} className="text-secondary-fixed mb-2" />
              <h3 className="text-white text-[20px] font-semibold">Secure Vouchers</h3>
              <p className="text-primary-fixed-dim text-[14px] mt-1">Direct retail redemption</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Ticker */}
      <div className="bg-primary-container py-6 overflow-hidden border-y border-outline/10">
        <div className="flex w-fit animate-ticker">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <div key={i} className="flex gap-stack-xl items-center px-stack-xl whitespace-nowrap">
              {i % 4 === 0 && (
                <span className="text-white/60 text-[14px] font-semibold uppercase tracking-widest">Live Impact:</span>
              )}
              <div className="flex items-center gap-2 text-white font-bold">
                <span className="text-secondary-fixed">{item.value}</span> {item.label}
              </div>
              <div className="w-2 h-2 rounded-full bg-white/20" />
            </div>
          ))}
        </div>
      </div>

      {/* How it Works */}
      <section className="py-stack-xl bg-surface-container-low">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center mb-stack-xl">
            <h2 className="text-[32px] leading-10 font-bold text-primary mb-4">The Transparency Loop</h2>
            <p className="text-on-surface-variant text-[18px] leading-7 max-w-2xl mx-auto">
              From your wallet to their hands, every Tenge is tracked by our smart ecosystem.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="relative p-stack-lg bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/30 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icon size={24} className="text-primary" />
                  </div>
                  <span className="absolute top-6 right-8 text-4xl font-bold text-outline-variant/20">{step.num}</span>
                  <h3 className="text-[20px] font-semibold mb-2">{step.title}</h3>
                  <p className="text-on-surface-variant text-[14px] leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Partner Logos */}
      <section className="py-20 bg-surface-container-lowest">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
          <p className="text-[14px] font-semibold text-on-surface-variant uppercase tracking-widest mb-10">
            Trusted Redemption Partners
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 grayscale opacity-60 hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#ED1C24] rounded-lg flex items-center justify-center text-white font-bold">M</div>
              <span className="text-2xl font-bold tracking-tighter text-on-surface">MAGNUM</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FFD700] rounded-full flex items-center justify-center text-black font-bold">S</div>
              <span className="text-2xl font-bold tracking-tighter text-on-surface">SMALL</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#004A99] rounded-sm flex items-center justify-center text-white font-bold">E</div>
              <span className="text-2xl font-bold tracking-tighter text-on-surface">EUROPHARMA</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">A</div>
              <span className="text-2xl font-bold tracking-tighter text-on-surface">ASTANA-HUB</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-stack-xl overflow-hidden">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
          <div className="bg-primary-container rounded-[40px] p-12 md:p-20 text-white flex flex-col md:flex-row items-center gap-stack-xl relative overflow-hidden">
            <div className="md:w-3/5 space-y-4">
              <h2 className="text-4xl md:text-5xl leading-tight font-bold">
                Join the most transparent charity network in Central Asia.
              </h2>
              <p className="text-[18px] leading-7 text-primary-fixed-dim max-w-xl">
                Every voucher is recorded on the blockchain, and every retail receipt is available for your audit. No management fees, just pure impact.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  onClick={onLoginClick}
                  className="px-8 py-4 bg-secondary text-on-secondary rounded-xl font-semibold hover:brightness-110 transition-all active:scale-95"
                >
                  Create Account
                </button>
                <button
                  onClick={() => navigate('/impact')}
                  className="px-8 py-4 bg-white/10 text-white rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all active:scale-95"
                >
                  Explore Map
                </button>
              </div>
            </div>
            <div className="md:w-2/5 flex flex-col items-center">
              <div className="bg-white p-6 rounded-3xl shadow-2xl relative">
                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center mb-4 rounded-xl">
                  <QrIcon size={96} className="text-primary" />
                </div>
                <p className="text-black text-[14px] font-semibold text-center">Scan to See Live Impact</p>
                <div className="absolute -top-4 -right-4 bg-secondary text-on-secondary w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm">
                  LIVE
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
