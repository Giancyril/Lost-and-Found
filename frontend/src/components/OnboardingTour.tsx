import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  FaClipboardList, FaHandPaper, FaArrowRight, FaTimes,
  FaCheckCircle, FaRobot, FaBullhorn, FaQrcode, FaBoxOpen,
  FaChartBar, FaComments, FaTrophy, FaSearch, FaUserCheck,
  FaShieldAlt, FaMapMarkerAlt, FaBolt, FaLifeRing,
} from "react-icons/fa";

const STORAGE_KEY = "nbsc_onboarding_done_v3";

const STEPS = [
  {
    icon: <FaClipboardList size={24} className="text-blue-400" />,
    accent: "from-blue-500 to-blue-400",
    glow: "bg-blue-600/10",
    badge: "Getting Started",
    tag: "Students",
    tagColor: "text-blue-400 border-blue-500/20 bg-blue-500/10",
    title: "Report a Lost Item",
    desc: "Lost something on campus? Submit a report with a description, location, and photo. The system instantly matches it against found items in real time before you even finish.",
    highlight: {
      icon: <FaBolt size={9} />,
      text: "Live match suggestions appear while you type",
    },
  },
  {
    icon: <FaUserCheck size={24} className="text-cyan-400" />,
    accent: "from-cyan-500 to-blue-400",
    glow: "bg-cyan-600/10",
    badge: "Reporter Info",
    tag: "Auto-Fill",
    tagColor: "text-cyan-400 border-cyan-500/20 bg-cyan-500/10",
    title: "Student ID Auto-Fill",
    desc: "Type your name or institutional email and click Fetch Info to auto-fill your details or scan your ID barcode for instant auto-fill in under 2 seconds.",
    highlight: {
      icon: <FaQrcode size={9} />,
      text: "Scan ID fills name, email & department instantly",
    },
  },
  {
    icon: <FaBoxOpen size={24} className="text-indigo-400" />,
    accent: "from-indigo-500 to-blue-400",
    glow: "bg-indigo-600/10",
    badge: "Browse Items",
    tag: "Everyone",
    tagColor: "text-indigo-400 border-indigo-500/20 bg-indigo-500/10",
    title: "Browse Found Items",
    desc: "Check the Found Items board to see everything turned in to the SAS office. Each listing includes photos, location, date found, and claim instructions.",
    highlight: {
      icon: <FaMapMarkerAlt size={9} />,
      text: "Filter by category, location, or date",
    },
  },
  {
    icon: <FaHandPaper size={24} className="text-emerald-400" />,
    accent: "from-emerald-500 to-teal-400",
    glow: "bg-emerald-600/10",
    badge: "Claims",
    tag: "Students",
    tagColor: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
    title: "Claim Your Item",
    desc: "Found your item on the board? Submit a claim with the distinguishing features, lost date, and contact info or visit the SAS office directly to claim in person.",
    highlight: {
      icon: <FaCheckCircle size={9} />,
      text: "Email notification sent on approval or rejection",
    },
  },
  {
    icon: <FaRobot size={24} className="text-violet-400" />,
    accent: "from-violet-500 to-purple-400",
    glow: "bg-violet-600/10",
    badge: "AI-Powered",
    tag: "Smart Search",
    tagColor: "text-violet-400 border-violet-500/20 bg-violet-500/10",
    title: "AI Smart Search",
    desc: "Describe what you lost in plain language our AI searches all reports and surfaces the closest matches instantly, with reasoning explanations for each result.",
    highlight: {
      icon: <FaRobot size={9} />,
      text: "Understands context beyond just keywords",
    },
  },
  {
    icon: <FaComments size={24} className="text-sky-400" />,
    accent: "from-sky-500 to-blue-400",
    glow: "bg-sky-600/10",
    badge: "Community",
    tag: "Real-Time",
    tagColor: "text-sky-400 border-sky-500/20 bg-sky-500/10",
    title: "Community Discussions",
    desc: "Every lost or found item has a live comment thread. Tip off the owner, ask questions, or reply to replies complete with @mentions, like counts, and real-time sync.",
    highlight: {
      icon: <FaComments size={9} />,
      text: "Type @ to mention someone in a reply",
    },
  },
  {
    icon: <FaLifeRing size={24} className="text-teal-400" />,
    accent: "from-teal-500 to-cyan-400",
    glow: "bg-teal-600/10",
    badge: "Support",
    tag: "Help Desk",
    tagColor: "text-teal-400 border-teal-500/20 bg-teal-500/10",
    title: "Support Tickets",
    desc: "Need help? Submit a support ticket directly from the app. Track status, reply to staff responses, and get notified when your issue is resolved.",
    highlight: {
      icon: <FaLifeRing size={9} />,
      text: "Tickets tracked from open to resolved",
    },
  },
  {
    icon: <FaTrophy size={24} className="text-yellow-400" />,
    accent: "from-yellow-500 to-amber-400",
    glow: "bg-yellow-600/10",
    badge: "Gamification",
    tag: "Points",
    tagColor: "text-yellow-400 border-yellow-500/20 bg-yellow-500/10",
    title: "Points & Leaderboard",
    desc: "Earn points for reporting items, helping others with tips, and successful claims. Climb the leaderboard and earn badges for community contributions.",
    highlight: {
      icon: <FaTrophy size={9} />,
      text: "Points tracked in your student dashboard",
    },
  },
    {
    icon: <FaUserCheck size={24} className="text-rose-400" />,
    accent: "from-rose-500 to-pink-400",
    glow: "bg-rose-600/10",
    badge: "Your Dashboard",
    tag: "Students",
    tagColor: "text-rose-400 border-rose-500/20 bg-rose-500/10",
    title: "Student Dashboard",
    desc: "Track your reported items, active claims, earned points, and community contributions all in one place. Your personal hub for everything lost and found.",
    highlight: {
      icon: <FaChartBar size={9} />,
      text: "View your activity, points, and claim status",
    },
  },
];

const OnboardingTour = () => {
  const [visible, setVisible]     = useState(false);
  const [step, setStep]           = useState(0);
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
    setTimeout(() => { setStep(nextStep); setAnimating(false); }, 180);
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

  const current  = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;
  const isLast   = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={dismiss} />

      {/* Card */}
      <div
        className={`relative w-full max-w-sm rounded-2xl border border-white/8 shadow-2xl overflow-hidden transition-all duration-200 ${
          animating
            ? direction === "next" ? "opacity-0 translate-x-5 scale-[0.98]" : "opacity-0 -translate-x-5 scale-[0.98]"
            : "opacity-100 translate-x-0 scale-100"
        }`}
      >
        {/* Background layers */}
        <div className="absolute inset-0 z-0 bg-[#0b0f17]" />
        <div className={`absolute top-0 right-0 w-56 h-56 rounded-full blur-3xl opacity-60 z-0 ${current.glow}`} />
        <div className={`absolute bottom-0 left-0 w-40 h-40 rounded-full blur-3xl opacity-40 z-0 ${current.glow}`} />
        {/* Subtle grid */}
        <div className="absolute inset-0 z-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        {/* Progress bar */}
        <div className="relative z-10 h-[2px] w-full bg-white/5">
          <div
            className={`h-full bg-gradient-to-r ${current.accent} transition-all duration-500 ease-out`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.15em]">
              {step + 1} / {STEPS.length}
            </span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${current.tagColor}`}>
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
          <div className={`w-12 h-12 rounded-xl border border-white/8 flex items-center justify-center ${current.glow}`}>
            {current.icon}
          </div>

          {/* Badge + Title */}
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r ${current.accent} bg-clip-text text-transparent mb-1`}>
              {current.badge}
            </p>
            <h3 className="text-white font-bold text-[17px] leading-snug">{current.title}</h3>
          </div>

          {/* Description */}
          <p className="text-gray-400 text-[13px] leading-relaxed text-justify">{current.desc}</p>

          {/* Highlight pill */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-white/6 bg-white/3`}>
            <span className={`bg-gradient-to-r ${current.accent} bg-clip-text text-transparent`}>
              {current.highlight.icon}
            </span>
            <span className="text-[11px] text-gray-400">{current.highlight.text}</span>
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-1 pt-1 flex-wrap">
            {STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => i !== step && goTo(i, i > step ? "next" : "prev")}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === step
                    ? `w-5 bg-gradient-to-r ${current.accent}`
                    : i < step
                    ? "w-1 bg-white/20"
                    : "w-1 bg-white/8"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {step > 0 ? (
              <button
                onClick={prev}
                className="px-4 py-2.5 text-gray-500 hover:text-gray-300 text-xs font-semibold rounded-xl hover:bg-white/5 transition-colors border border-white/6"
              >
                Back
              </button>
            ) : (
              <button
                onClick={dismiss}
                className="text-gray-600 hover:text-gray-400 text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-white/4 transition-colors"
              >
                Skip tour
              </button>
            )}
            <button
              onClick={next}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 bg-blue-600 hover:bg-blue-500 text-white shadow-lg`}
            >
              {isLast
                ? <><FaCheckCircle size={11} /> Get Started</>
                : <>Next </>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;