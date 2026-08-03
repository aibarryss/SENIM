import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  QrCode,
  Store,
  Brain,
  HeartHandshake,
  PlayCircle,
  QrCode as QrIcon,
  CreditCard,
  BadgeCheck,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface LandingPageProps {
  onLoginClick: () => void;
}

const heroFoodImg =
  "https://images.pexels.com/photos/5425794/pexels-photo-5425794.jpeg?auto=compress&cs=tinysrgb&h=650&w=940";
const heroMedsImg =
  "https://images.pexels.com/photos/51929/medications-cure-tablets-pharmacy-51929.jpeg?auto=compress&cs=tinysrgb&h=650&w=940";

export default function LandingPage({ onLoginClick }: LandingPageProps) {
  const navigate = useNavigate();
  const { t } = useI18n();

  const steps = [
    {
      icon: HeartHandshake,
      title: t("landing.step1.title"),
      desc: t("landing.step1.desc"),
      num: "01",
    },
    {
      icon: Brain,
      title: t("landing.step2.title"),
      desc: t("landing.step2.desc"),
      num: "02",
    },
    {
      icon: QrCode,
      title: t("landing.step3.title"),
      desc: t("landing.step3.desc"),
      num: "03",
    },
    {
      icon: Store,
      title: t("landing.step4.title"),
      desc: t("landing.step4.desc"),
      num: "04",
    },
  ];

  const projectStatusItems = [
    {
      icon: BadgeCheck,
      label: t("landing.projectStatus.status"),
      value: t("landing.projectStatus.statusValue"),
    },
    {
      icon: CreditCard,
      label: t("landing.projectStatus.payments"),
      value: t("landing.projectStatus.paymentsValue"),
    },
    {
      icon: Store,
      label: t("landing.projectStatus.partners"),
      value: t("landing.projectStatus.partnersValue"),
    },
    {
      icon: ShieldCheck,
      label: t("landing.projectStatus.verification"),
      value: t("landing.projectStatus.verificationValue"),
    },
  ];

  return (
    <div className="bg-surface">
      {/* Hero Section */}
      <section className="relative min-h-[700px] md:min-h-[921px] flex items-center overflow-hidden bg-surface-container-lowest">
        <div className="relative z-10 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full grid md:grid-cols-2 gap-stack-xl items-center py-stack-xl">
          <div className="space-y-stack-lg">
            <div className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-4 py-2 rounded-full text-[12px] font-medium tracking-[0.04em]">
              <ShieldCheck size={18} /> {t("landing.badge")}
            </div>
            <h1 className="text-5xl md:text-7xl leading-tight tracking-tight text-primary font-bold">
              {t("landing.hero1")}
              <br />
              <span className="gradient-text">{t("landing.hero2")}</span>
            </h1>
            <p className="text-[18px] leading-7 text-on-surface-variant max-w-lg">
              {t("landing.heroSub")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={onLoginClick}
                className="px-10 py-4 bg-primary text-on-primary rounded-xl font-semibold text-lg shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
              >
                {t("landing.startDonating")}
              </button>
              <button
                onClick={() => navigate("/impact")}
                className="px-10 py-4 border-2 border-outline-variant text-on-surface rounded-xl font-semibold text-lg hover:bg-surface-container-low active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <PlayCircle size={20} /> {t("landing.viewTransparency")}
              </button>
            </div>
          </div>

          {/* Bento Photo Grid */}
          <div className="grid grid-cols-2 gap-4 h-[400px] md:h-[500px]">
            <div className="col-span-1 row-span-2 rounded-3xl overflow-hidden shadow-2xl relative group">
              <img
                src={heroFoodImg}
                alt={t("landing.foodBasketImgAlt")}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute bottom-4 left-4 right-4 glass-card p-4 rounded-xl">
                <p className="text-[12px] font-medium text-primary mb-1">
                  {t("landing.foodBasketLabel")}
                </p>
              </div>
            </div>
            <div className="col-span-1 rounded-3xl overflow-hidden shadow-2xl relative group">
              <img
                src={heroMedsImg}
                alt={t("landing.medicineImgAlt")}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute top-4 right-4 bg-secondary text-on-secondary px-3 py-1 rounded-full text-xs font-bold">
                {t("landing.urgent")}
              </div>
            </div>
            <div className="col-span-1 rounded-3xl overflow-hidden shadow-2xl relative bg-primary-container p-6 flex flex-col justify-end">
              <QrIcon size={40} className="text-secondary-fixed mb-2" />
              <h3 className="text-white text-[20px] font-semibold">
                {t("landing.secureVouchers")}
              </h3>
              <p className="text-primary-fixed-dim text-[14px] mt-1">
                {t("landing.directRedemption")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-stack-xl bg-surface-container-low">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center mb-stack-xl">
            <h2 className="text-[32px] leading-10 font-bold text-primary mb-4">
              {t("landing.loopTitle")}
            </h2>
            <p className="text-on-surface-variant text-[18px] leading-7 max-w-2xl mx-auto">
              {t("landing.loopSub")}
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
                  <span className="absolute top-6 right-8 text-4xl font-bold text-outline-variant/20">
                    {step.num}
                  </span>
                  <h3 className="text-[20px] font-semibold mb-2">
                    {step.title}
                  </h3>
                  <p className="text-on-surface-variant text-[14px] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Partner Network Status */}
      <section className="py-20 bg-surface-container-lowest">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <p className="text-[14px] font-semibold text-on-surface-variant uppercase tracking-widest">
              {t("landing.partnersTitle")}
            </p>
            <span className="text-[12px] font-medium text-amber-800 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full">
              {t("landing.partnersStatus")}
            </span>
          </div>
          <p className="text-[16px] leading-7 text-on-surface-variant max-w-2xl mx-auto">
            {t("landing.partnersBody")}
          </p>
        </div>
      </section>

      {/* Project Transparency */}
      <section className="py-stack-xl bg-surface-container-low">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="bg-surface-container-lowest rounded-[40px] p-10 md:p-16 border border-outline-variant/30">
            <h2 className="text-[28px] md:text-[32px] leading-10 font-bold text-primary mb-4">
              {t("landing.projectStatus.title")}
            </h2>
            <p className="text-[16px] leading-7 text-on-surface-variant max-w-3xl mb-10">
              {t("landing.projectStatus.body")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {projectStatusItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30"
                  >
                    <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center text-secondary mb-3">
                      <Icon size={20} />
                    </div>
                    <p className="text-[12px] font-medium text-on-surface-variant uppercase tracking-wider mb-1">
                      {item.label}
                    </p>
                    <p className="text-[16px] font-semibold text-primary">
                      {item.value}
                    </p>
                  </div>
                );
              })}
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
                {t("landing.ctaTitle")}
              </h2>
              <p className="text-[18px] leading-7 text-primary-fixed-dim max-w-xl">
                {t("landing.ctaSub")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  onClick={onLoginClick}
                  className="px-8 py-4 bg-secondary text-on-secondary rounded-xl font-semibold hover:brightness-110 transition-all active:scale-95"
                >
                  {t("common.createAccount")}
                </button>
                <button
                  onClick={() => navigate("/impact")}
                  className="px-8 py-4 bg-white/10 text-white rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all active:scale-95"
                >
                  {t("landing.exploreMap")}
                </button>
              </div>
            </div>
            <div className="md:w-2/5 flex flex-col items-center">
              <div className="bg-white p-6 rounded-3xl shadow-2xl relative">
                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center mb-4 rounded-xl">
                  <QrIcon size={96} className="text-primary" />
                </div>
                <p className="text-black text-[14px] font-semibold text-center">
                  {t("landing.scanLive")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
