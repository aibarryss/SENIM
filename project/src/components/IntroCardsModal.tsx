import { useEffect, useState } from "react";
import { X, HeartHandshake, ShieldCheck, QrCode, Store, Users, ArrowLeft, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const STORAGE_KEY = "senim_onboarding_completed";

interface IntroCardsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function IntroCardsModal({ open, onClose }: IntroCardsModalProps) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setIndex(0);
    onClose();
  };

  const cards = [
    {
      icon: HeartHandshake,
      title: t("intro.card1.title"),
      body: t("intro.card1.body"),
    },
    {
      icon: Users,
      title: t("intro.card2.title"),
      body: t("intro.card2.body"),
    },
    {
      icon: ShieldCheck,
      title: t("intro.card3.title"),
      body: t("intro.card3.body"),
    },
    {
      icon: QrCode,
      title: t("intro.card4.title"),
      body: t("intro.card4.body"),
    },
    {
      icon: Store,
      title: t("intro.card5.title"),
      body: t("intro.card5.body"),
    },
  ];

  // Close on Escape for accessibility.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        localStorage.setItem(STORAGE_KEY, "1");
        setIndex(0);
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;

  const isLast = index === cards.length - 1;
  const isFirst = index === 0;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="intro-modal-heading"
        className="glass-card rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Heading */}
        <div className="flex items-start justify-between p-6 pb-2">
          <div>
            <h2
              id="intro-modal-heading"
              className="text-[22px] font-bold text-primary pr-4"
            >
              {t("intro.heading")}
            </h2>
            <p className="text-[14px] text-on-surface-variant mt-1">
              {t("intro.subheading")}
            </p>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="text-on-surface-variant hover:text-primary transition-colors shrink-0"
          >
            <X size={22} />
          </button>
        </div>

        {/* Sliding card track */}
        <div className="overflow-hidden px-6">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {cards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="w-full shrink-0 px-1 pb-2">
                  <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center mb-4">
                    <Icon size={26} className="text-primary" />
                  </div>
                  <h3 className="text-[18px] font-semibold mb-2">
                    {card.title}
                  </h3>
                  <p className="text-[14px] leading-relaxed text-on-surface-variant min-h-[72px]">
                    {card.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {cards.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-secondary" : "w-1.5 bg-outline-variant"
              }`}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between p-6 pt-4">
          <div className="flex gap-2">
            {!isFirst && (
              <button
                onClick={() => setIndex((i) => i - 1)}
                className="flex items-center gap-1 px-4 py-2.5 border border-outline-variant text-on-surface rounded-xl font-semibold text-[14px] hover:bg-surface-container-low active:scale-95 transition-all"
              >
                <ArrowLeft size={16} /> {t("intro.back")}
              </button>
            )}
          </div>
          <div className="flex gap-4 items-center">
            {!isLast && (
              <button
                onClick={close}
                className="text-[14px] font-semibold text-on-surface-variant hover:text-primary transition-colors"
              >
                {t("intro.skip")}
              </button>
            )}
            <button
              onClick={() => (isLast ? close() : setIndex((i) => i + 1))}
              className="flex items-center gap-1 px-6 py-2.5 bg-primary text-on-primary rounded-xl font-semibold text-[14px] hover:opacity-90 active:scale-95 transition-all"
            >
              {isLast ? t("intro.getStarted") : t("intro.next")}
              {!isLast && <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}