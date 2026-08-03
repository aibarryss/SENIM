import { useEffect, useRef, useState } from "react";
import {
  Share,
  ShoppingCart,
  Stethoscope,
  ReceiptText,
  BadgeCheck,
  Info,
  FileText,
  ShieldCheck,
  Package,
  HeartHandshake,
  QrCode,
  HandCoins,
  ClipboardList,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useI18n, type TKey } from "@/lib/i18n";
import { cityLabel } from "@/lib/cities";
import type { Transaction } from "@/lib/types";

interface Step {
  num: string;
  icon: typeof FileText;
  titleKey: TKey;
  descKey: TKey;
  highlight?: boolean;
}

const steps: Step[] = [
  {
    num: "01",
    icon: FileText,
    titleKey: "impact.steps.1.title",
    descKey: "impact.steps.1.desc",
  },
  {
    num: "02",
    icon: ShieldCheck,
    titleKey: "impact.steps.2.title",
    descKey: "impact.steps.2.desc",
  },
  {
    num: "03",
    icon: Package,
    titleKey: "impact.steps.3.title",
    descKey: "impact.steps.3.desc",
    highlight: true,
  },
  {
    num: "04",
    icon: HeartHandshake,
    titleKey: "impact.steps.4.title",
    descKey: "impact.steps.4.desc",
  },
  {
    num: "05",
    icon: QrCode,
    titleKey: "impact.steps.5.title",
    descKey: "impact.steps.5.desc",
  },
];

interface Metrics {
  activeRequests: number | null;
  raised: number | null;
  donations: number | null;
}

export default function ImpactDashboard() {
  const { t, tp } = useI18n();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metrics>({
    activeRequests: null,
    raised: null,
    donations: null,
  });
  const [visible, setVisible] = useState(false);
  const flowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => {
        setTransactions((data as Transaction[]) || []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Real metrics from existing tables (no fake data).
    const fetchMetrics = async () => {
      const [activeRes, raisedRes, donationsRes] = await Promise.all([
        supabase
          .from("campaigns")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
        supabase
          .from("campaigns")
          .select("raised_amount")
          .in("status", ["active", "funded"]),
        supabase
          .from("donation_intents")
          .select("id", { count: "exact", head: true })
          .eq("status", "confirmed"),
      ]);

      const raised = (raisedRes.data as { raised_amount: number }[] | null)?.reduce(
        (sum, c) => sum + (c.raised_amount || 0),
        0,
      );

      setMetrics({
        activeRequests: activeRes.count ?? null,
        raised: raised ?? null,
        donations: donationsRes.count ?? null,
      });
    };
    fetchMetrics();
  }, []);

  useEffect(() => {
    const el = flowRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const formatKzt = (n: number) => `₸${n.toLocaleString()}`;
  const formatAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("impact.time.justNow");
    if (mins < 60) return tp("impact.time.minute", mins);
    return tp("impact.time.hour", Math.floor(mins / 60));
  };

  const txIconMap: Record<
    string,
    { icon: typeof ShoppingCart; bg: string; color: string }
  > = {
    voucher_redemption: {
      icon: ShoppingCart,
      bg: "bg-secondary-container",
      color: "text-on-secondary-container",
    },
    medicine_purchase: {
      icon: Stethoscope,
      bg: "bg-tertiary-fixed",
      color: "text-on-tertiary-fixed-variant",
    },
    utility_payment: {
      icon: ReceiptText,
      bg: "bg-secondary-container",
      color: "text-on-secondary-container",
    },
  };

  const metricCards = [
    {
      icon: ClipboardList,
      value: metrics.activeRequests,
      label: t("impact.metrics.activeRequests"),
    },
    {
      icon: HandCoins,
      value: metrics.raised,
      label: t("impact.metrics.raised"),
      format: (n: number) => formatKzt(n),
    },
    {
      icon: HeartHandshake,
      value: metrics.donations,
      label: t("impact.metrics.donations"),
    },
  ];

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-xl">
      {/* Header */}
      <section className="mb-stack-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-[32px] leading-10 font-bold text-primary mb-1">
              {t("impact.title")}
            </h1>
            <p className="text-[18px] leading-7 text-on-surface-variant max-w-2xl">
              {t("impact.subtitle")}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-lg text-[14px] font-semibold hover:bg-surface-container-highest transition-colors">
              <Share size={20} /> {t("impact.shareReport")}
            </button>
          </div>
        </div>
      </section>

      {/* Path of Help — Flow */}
      <section
        ref={flowRef}
        className="mb-stack-xl bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-stack-lg md:p-stack-xl shadow-sm"
      >
        <div className="text-center mb-stack-xl">
          <h2 className="text-[28px] md:text-[32px] leading-10 font-bold text-primary mb-3">
            {t("impact.flowTitle")}
          </h2>
          <p className="text-on-surface-variant text-[16px] leading-7 max-w-2xl mx-auto">
            {t("impact.flowSubtitle")}
          </p>
        </div>

        {/* Desktop: horizontal flow */}
        <div className="hidden lg:block">
          <div className="flex items-stretch gap-0">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isLast = i === steps.length - 1;
              return (
                <div key={step.num} className="flex-1 flex items-stretch">
                  <div
                    className={`flex-1 flex flex-col items-center text-center px-4 transition-all duration-700 ${
                      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                    }`}
                    style={{ transitionDelay: `${i * 120}ms` }}
                  >
                    <div
                      className={`relative w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-500 ${
                        step.highlight
                          ? "bg-secondary text-on-secondary shadow-lg shadow-secondary/30 scale-105"
                          : "bg-primary-fixed text-primary"
                      }`}
                    >
                      <Icon size={28} />
                      <span
                        className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                          step.highlight
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {step.num}
                      </span>
                    </div>
                    <h3
                      className={`text-[16px] font-semibold mb-2 ${
                        step.highlight ? "text-secondary" : "text-primary"
                      }`}
                    >
                      {t(step.titleKey)}
                    </h3>
                    <p className="text-[13px] leading-5 text-on-surface-variant">
                      {t(step.descKey)}
                    </p>
                  </div>
                  {!isLast && (
                    <div className="flex items-center justify-center w-8 shrink-0">
                      <div
                        className={`h-0.5 w-full rounded-full transition-all duration-700 ${
                          visible ? "opacity-100" : "opacity-0"
                        } ${step.highlight ? "bg-secondary" : "bg-outline-variant"}`}
                        style={{ transitionDelay: `${i * 120 + 60}ms` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile/Tablet: vertical flow */}
        <div className="lg:hidden">
          <div className="relative">
            <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-outline-variant" />
            <div className="space-y-6">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.num}
                    className={`relative flex gap-5 transition-all duration-700 ${
                      visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"
                    }`}
                    style={{ transitionDelay: `${i * 120}ms` }}
                  >
                    <div
                      className={`relative z-10 w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center ${
                        step.highlight
                          ? "bg-secondary text-on-secondary shadow-lg shadow-secondary/30"
                          : "bg-primary-fixed text-primary"
                      }`}
                    >
                      <Icon size={26} />
                      <span
                        className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                          step.highlight
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {step.num}
                      </span>
                    </div>
                    <div className="pt-1">
                      <h3
                        className={`text-[18px] font-semibold mb-1 ${
                          step.highlight ? "text-secondary" : "text-primary"
                        }`}
                      >
                        {t(step.titleKey)}
                      </h3>
                      <p className="text-[14px] leading-6 text-on-surface-variant">
                        {t(step.descKey)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Why It Matters */}
      <section className="mb-stack-xl">
        <div className="bg-primary-container rounded-3xl p-stack-lg md:p-stack-xl text-white relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-secondary/30 flex items-center justify-center">
                <Info size={22} className="text-secondary-fixed" />
              </div>
              <h2 className="text-[24px] md:text-[28px] leading-9 font-bold">
                {t("impact.whyTitle")}
              </h2>
            </div>
            <p className="text-[16px] leading-7 text-primary-fixed-dim">
              {t("impact.whyBody")}
            </p>
          </div>
        </div>
      </section>

      {/* Real Metrics */}
      <section className="mb-stack-xl grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {metricCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-surface-container-low p-stack-lg rounded-xl flex items-center gap-stack-md"
            >
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-secondary shrink-0">
                <Icon size={24} />
              </div>
              <div>
                {card.value === null ? (
                  <div className="h-6 w-16 bg-surface-container-high rounded animate-pulse mb-1" />
                ) : (
                  <h4 className="text-[20px] font-semibold">
                    {card.format ? card.format(card.value) : card.value.toLocaleString()}
                  </h4>
                )}
                <p className="text-[12px] font-medium text-on-surface-variant uppercase tracking-wider">
                  {card.label}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Transaction Feed + Project Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Transaction Feed */}
        <div className="lg:col-span-7 bg-white rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] p-stack-lg overflow-hidden">
          <div className="flex justify-between items-center mb-stack-lg">
            <h3 className="text-[20px] font-semibold">
              {t("impact.feedTitle")}
            </h3>
            <span className="text-[12px] font-medium bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full flex items-center gap-1">
              <BadgeCheck size={14} /> {t("impact.blockchainVerified")}
            </span>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {loading
              ? [...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg animate-pulse"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface-container-high" />
                      <div className="space-y-2">
                        <div className="h-4 bg-surface-container-high rounded w-40" />
                        <div className="h-3 bg-surface-container-high rounded w-32" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-surface-container-high rounded w-20" />
                      <div className="h-3 bg-surface-container-high rounded w-16" />
                    </div>
                  </div>
                ))
              : transactions.map((tx) => {
                  const config =
                    txIconMap[tx.type] || txIconMap.voucher_redemption;
                  const Icon = config.icon;
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg hover:bg-surface-container border border-transparent hover:border-outline-variant transition-all hover:translate-x-1"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center ${config.color}`}
                        >
                          <Icon size={20} />
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold">
                            {tx.type === "voucher_redemption" &&
                              t("impact.tx.voucher", {
                                n: tx.voucher_number ?? "",
                              })}
                            {tx.type === "medicine_purchase" &&
                              t("impact.tx.medicine", {
                                n: tx.voucher_number ?? "",
                              })}
                            {tx.type === "utility_payment" &&
                              t("impact.tx.utility", {
                                n: tx.voucher_number ?? "",
                              })}
                          </p>
                          <p className="text-[14px] text-on-surface-variant">
                            {tx.store_name}, {cityLabel(tx.city, t)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-semibold text-primary">
                          {formatKzt(tx.amount)}
                        </p>
                        <p className="text-[12px] text-on-surface-variant">
                          {formatAgo(tx.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>

        {/* Project Status Panel */}
        <div className="lg:col-span-5 bg-primary-container rounded-xl p-stack-lg flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-[20px] font-semibold text-white mb-4">
              {t("impact.auditTitle")}
            </h3>
            <p className="text-[16px] leading-6 text-on-primary-container mb-stack-lg">
              {t("impact.auditBody")}
            </p>
          </div>
          <div className="relative z-10 mt-stack-xl">
            <div className="bg-secondary/20 border border-secondary/30 p-4 rounded-xl">
              <div className="flex items-start gap-3">
                <Info
                  size={20}
                  className="text-secondary-fixed shrink-0 mt-0.5"
                />
                <p className="text-[12px] font-medium text-white/80 leading-relaxed">
                  {t("impact.charityNote")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}