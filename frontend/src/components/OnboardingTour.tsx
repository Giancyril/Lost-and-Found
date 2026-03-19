import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FaClipboardList, FaSearch, FaHandPaper, FaArrowRight, FaTimes, FaCheckCircle } from "react-icons/fa";

const STORAGE_KEY = "nbsc_onboarding_done";

const STEPS = [
  {
    icon: <FaClipboardList size={28} className="text-blue-400" />,
    badge: "Step 1 of 3",
    title: "Report a Lost Item",
    desc: "If you've lost something on campus, submit a report with a description and last known location. Our system will automatically match it against found items.",
    cta: "Got it",
    color: "blue",
    accent: "bg-blue-500/10 border-blue-500/20",
    dot: "bg-blue-500",
  },
  {
    icon: <FaSearch size={28} className="text-cyan-400" />,
    badge: "Step 2 of 3",
    title: "Browse Found Items",
    desc: "Check the Found Items page to see everything turned in to the SAS office. Use Smart Search to describe what you lost and our AI will find the closest matches.",
    cta: "Next",
    color: "cyan",
    accent: "bg-cyan-500/10 border-cyan-500/20",
    dot: "bg-cyan-500",
  },
  {
    icon: <FaHandPaper size={28} className="text-emerald-400" />,
    badge: "Step 3 of 3",
    title: "Claim Your Item",
    desc: "Found your item? Submit a claim with proof of ownership. The SAS office will review it and notify you once it's approved for pickup.",
    cta: "Get Started",
    color: "emerald",
    accent: "bg-emerald-500/10 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
];

const OnboardingTour = () => {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const location = useLocation();

  // Only show on home page, only once
  useEffect(() => {
    if (location.pathname !== "/") return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Small delay so page renders first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [location.pathname]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  const next = () => {
    if (step === STEPS.length - 1) { dismiss(); return; }
    setAnimating(true);
    setTimeout(() => {
      setStep(s => s + 1);
      setAnimating(false);
    }, 180);
  };

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Card */}
      <div
        className={`relative w-full max-w-sm bg-[#0e1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 ${animating ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
      >
        {/* Top accent bar */}
        <div className={`h-0.5 w-full ${
          step === 0 ? "bg-gradient-to-r from-blue-600 to-cyan-500"
          : step === 1 ? "bg-gradient-to-r from-cyan-500 to-teal-400"
          : "bg-gradient-to-r from-emerald-500 to-green-400"
        }`} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-0">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{current.badge}</span>
          <button
            onClick={dismiss}
            className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/8 transition-colors"
          >
            <FaTimes size={12} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pt-5 pb-6 space-y-4">
          {/* Icon */}
          <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${current.accent}`}>
            {current.icon}
          </div>

          {/* Text */}
          <div>
            <h3 className="text-white font-bold text-lg leading-tight mb-2">{current.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{current.desc}</p>
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-1.5 pt-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? `w-6 ${current.dot}` : "w-1.5 bg-white/15"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={dismiss}
              className="flex-1 py-2.5 text-gray-500 hover:text-gray-300 text-xs font-medium rounded-xl hover:bg-white/5 transition-colors"
            >
              Skip tour
            </button>
            <button
              onClick={next}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                step === STEPS.length - 1
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-blue-600 hover:bg-blue-500 text-white"
              }`}
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
