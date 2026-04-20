import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  FaClipboardList, FaHandPaper, FaArrowRight,
  FaTimes, FaCheckCircle, FaRobot, FaBullhorn, FaQrcode,
  FaBoxOpen, FaChartBar,
} from "react-icons/fa";

const STORAGE_KEY = "nbsc_onboarding_done_v2";

const STEPS = [
  {
    icon: <FaClipboardList size={26} className="text-blue-400" />,
    badge: "Step 1 of 7",
    title: "Report a Lost Item",
    desc: "Lost something on campus? Submit a report with a description, location, and photo. The system automatically matches it against found items in real time.",
    cta: "Next",
    tag: "Students",
  },
  {
    icon: <FaBoxOpen size={26} className="text-blue-400" />,
    badge: "Step 2 of 7",
    title: "Browse Found Items",
    desc: "Check the Found Items board to see everything turned in to the SAS office. Each listing includes photos, location, and claim instructions.",
    cta: "Next",
    tag: "Everyone",
  },
  {
    icon: <FaHandPaper size={26} className="text-blue-400" />,
    badge: "Step 3 of 7",
    title: "Claim Your Item",
    desc: "Found your item on the board? Submit a claim with proof of ownership. The SAS office reviews it and notifies you once approved for pickup.",
    cta: "Next",
    tag: "Students",
  },
  {
    icon: <FaRobot size={26} className="text-cyan-400" />,
    badge: "Step 4 of 7",
    title: "AI Smart Search",
    desc: "Describe what you lost in plain language — our AI searches across all lost and found reports to surface the closest matches instantly.",
    cta: "Next",
    tag: "AI-Powered",
  },
  {
    icon: <FaBullhorn size={26} className="text-blue-400" />,
    badge: "Step 5 of 7",
    title: "Bulletin Board",
    desc: "Post a public bulletin for a lost item and let the community help. Other students can drop tips on your post if they've seen your item.",
    cta: "Next",
    tag: "Community",
  },
  {
    icon: <FaQrcode size={26} className="text-blue-400" />,
    badge: "Step 6 of 7",
    title: "QR Scanner",
    desc: "SAS staff can scan a student's ID barcode to instantly auto-fill reporter details when logging lost or found items — no manual typing needed.",
    cta: "Next",
    tag: "Admin Only",
  },
  {
    icon: <FaChartBar size={26} className="text-blue-400" />,
    badge: "Step 7 of 7",
    title: "Admin Dashboard",
    desc: "Admins get a full dashboard with analytics, heatmaps of where items are lost most, audit logs, user management, and claim processing tools.",
    cta: "Get Started",
    tag: "Admin Only",
  },
];

const OnboardingTour = () => {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/") return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [location.pathname]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  const goTo = (nextStep: number, dir: "next" | "prev") => {
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 180);
  };

  const next = () => {
    if (step === STEPS.length - 1) { dismiss(); return; }
    goTo(step + 1, "next");
  };

  const prev = () => {
    if (step === 0) return;
    goTo(step - 1, "prev");
  };

  if (!visible) return null;

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      {/* Backdrop — matches banner bg */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={dismiss} />

      {/* Card */}
      <div
        className={`relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-all duration-200 ${
          animating
            ? direction === "next"
              ? "opacity-0 translate-x-4"
              : "opacity-0 -translate-x-4"
            : "opacity-100 translate-x-0"
        }`}
      >
       {/* ── Background ── */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#0e1117]" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-600/10 rounded-full blur-3xl" />
        </div>

        {/* Progress bar */}
        <div className="relative z-10 h-0.5 w-full bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              {current.badge}
            </span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-blue-500/15 text-blue-400 border-blue-500/20">
              {current.tag}
            </span>
          </div>
          <button
            onClick={dismiss}
            className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/8 transition-colors"
          >
            <FaTimes size={11} />
          </button>
        </div>

        {/* Body */}
        <div className="relative z-10 px-5 pt-4 pb-5 space-y-4">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl border bg-blue-500/10 border-blue-500/20 flex items-center justify-center">
            {current.icon}
          </div>

          {/* Text */}
          <div>
            <h3 className="text-white font-bold text-lg leading-tight mb-2">{current.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{current.desc}</p>
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-1 pt-1">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => i !== step && goTo(i, i > step ? "next" : "prev")}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-6 bg-gradient-to-r from-blue-500 to-cyan-400"
                    : i < step
                    ? "w-1.5 bg-blue-500/40"
                    : "w-1.5 bg-white/10"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            {step > 0 ? (
              <button
                onClick={prev}
                className="px-4 py-2.5 text-gray-500 hover:text-gray-300 text-xs font-medium rounded-xl hover:bg-white/5 transition-colors border border-white/5"
              >
                Back
              </button>
            ) : (
              <button
                onClick={dismiss}
                className="flex-1 py-2.5 text-gray-500 hover:text-gray-300 text-xs font-medium rounded-xl hover:bg-white/5 transition-colors"
              >
                Skip tour
              </button>
            )}
            <button
              onClick={next}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 bg-blue-600 hover:bg-blue-500 text-white"
            >
              {step === STEPS.length - 1
                ? <><FaCheckCircle size={12} /> {current.cta}</>
                : <>{current.cta} <FaArrowRight size={11} /></>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;