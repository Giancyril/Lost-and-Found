import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const TIER_CONFIG = {
  BRONZE: {
    banner:  "bg-amber-950",
    border:  "border-amber-500/50",
    glow:    "shadow-amber-500/20",
    text:    "text-amber-400",
    subtext: "text-amber-500/70",
    btn:     "bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25",
    bar:     "bg-amber-500",
    glowRgb: "217,119,6",
    icon:    "⭐",
  },
  SILVER: {
    banner:  "bg-gray-800",
    border:  "border-gray-400/50",
    glow:    "shadow-gray-400/20",
    text:    "text-gray-300",
    subtext: "text-gray-400/70",
    btn:     "bg-gray-400/10 border-gray-400/35 text-gray-300 hover:bg-gray-400/20",
    bar:     "bg-gray-400",
    glowRgb: "156,163,175",
    icon:    "🌟",
  },
  GOLD: {
    banner:  "bg-yellow-950",
    border:  "border-yellow-400/60",
    glow:    "shadow-yellow-400/25",
    text:    "text-yellow-400",
    subtext: "text-yellow-500/70",
    btn:     "bg-yellow-400/15 border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/25",
    bar:     "bg-yellow-400",
    glowRgb: "250,204,21",
    icon:    "👑",
  },
  PLATINUM: {
    banner:  "bg-cyan-950",
    border:  "border-cyan-400/60",
    glow:    "shadow-cyan-400/25",
    text:    "text-cyan-300",
    subtext: "text-cyan-400/70",
    btn:     "bg-cyan-400/12 border-cyan-400/45 text-cyan-300 hover:bg-cyan-400/22",
    bar:     "bg-cyan-400",
    glowRgb: "34,211,238",
    icon:    "💎",
  },
  LEGEND: {
    banner:  "bg-purple-950",
    border:  "border-purple-400/60",
    glow:    "shadow-purple-500/30",
    text:    "text-purple-300",
    subtext: "text-purple-400/70",
    btn:     "bg-purple-500/15 border-purple-400/50 text-purple-300 hover:bg-purple-500/25",
    bar:     "bg-purple-500",
    glowRgb: "168,85,247",
    icon:    "⚡",
  },
} as const;

interface Achievement {
  id: string;
  achievement: {
    name: string;
    description: string;
    icon: string;
    tier: keyof typeof TIER_CONFIG;
    xp: number;
  };
}

export const AchievementPopup = ({
  achievement,
  onClose,
}: {
  achievement: Achievement;
  onClose: () => void;
}) => {
  const [phase, setPhase] = useState<"enter" | "show" | "fly">("enter");
  const navigate = useNavigate();
  const t = TIER_CONFIG[achievement.achievement.tier] ?? TIER_CONFIG.BRONZE;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("show"), 600);
    const t2 = setTimeout(() => setPhase("fly"),  4000);
    const t3 = setTimeout(() => onClose(),         5200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onClose]);

  return (
    <>
      <style>{`
        @keyframes achEnter {
          0%   { opacity:0; transform:scale(0.5) translateY(60px) rotate(-4deg); }
          60%  { transform:scale(1.06) translateY(-6px) rotate(1deg); }
          80%  { transform:scale(0.98) translateY(2px) rotate(0deg); }
          100% { opacity:1; transform:scale(1) translateY(0) rotate(0deg); }
        }
        @keyframes achFly {
          0%   { opacity:1; transform:scale(1) translate(0,0); }
          30%  { transform:scale(0.85) translate(0,-16px); }
          100% { opacity:0; transform:scale(0.08) translate(160px,-300px); }
        }
        @keyframes achBurst {
          0%   { opacity:1; transform:scale(1) translate(0,0); }
          100% { opacity:0; transform:scale(0) translate(var(--tx),var(--ty)); }
        }
        @keyframes achCountdown {
          from { width:100%; }
          to   { width:0%; }
        }
        @keyframes achBadgePulse {
          0%,100% { box-shadow:0 0 16px rgba(var(--glow),0.35),0 0 32px rgba(var(--glow),0.2); }
          50%     { box-shadow:0 0 28px rgba(var(--glow),0.55),0 0 56px rgba(var(--glow),0.3); }
        }
        .ach-enter { animation: achEnter 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .ach-fly   { animation: achFly   1.2s cubic-bezier(0.4,0,1,1) forwards; }
        .ach-burst { animation: achBurst var(--dur,0.9s) ease-out var(--delay,0s) forwards; }
        .ach-badge-pulse { animation: achBadgePulse 2s ease-in-out infinite; }
        .ach-countdown { animation: achCountdown 3.4s linear 0.6s forwards; }
      `}</style>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center
          transition-all duration-500 px-4 pb-6 sm:pb-0
          ${phase === "fly" ? "pointer-events-none" : "bg-black/65 backdrop-blur-sm"}`}
        onClick={phase !== "fly" ? onClose : undefined}
      >
        {/* Particles */}
        {phase === "show" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className="ach-burst absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                style={{
                  background: i % 3 === 0 ? "#fbbf24" : i % 3 === 1 ? "#818cf8" : "#34d399",
                  "--tx": `${(Math.random() - 0.5) * 360}px`,
                  "--ty": `${(Math.random() - 0.5) * 360}px`,
                  "--dur": `${0.7 + Math.random() * 0.7}s`,
                  "--delay": `${Math.random() * 0.25}s`,
                } as any}
              />
            ))}
          </div>
        )}

        {/* Card */}
        <div
          className={`relative w-full
            max-w-[min(340px,calc(100vw-2rem))]
            sm:max-w-sm
            ${phase === "enter" ? "ach-enter" : ""}
            ${phase === "fly"   ? "ach-fly"   : ""}
            ${phase === "show"  ? "opacity-100" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Outer glow */}
          <div
            className={`absolute -inset-1 rounded-3xl blur-xl opacity-50 ${t.banner}`}
          />

          {/* Card body */}
          <div className={`relative bg-gray-900 border-2 ${t.border} rounded-3xl overflow-hidden shadow-2xl ${t.glow}`}>

            {/* ── Top banner ── */}
            <div className={`${t.banner} px-5 pt-5 pb-4 text-center relative overflow-hidden`}>
              {/* Dot grid texture */}
              <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                  backgroundSize: "18px 18px",
                }}
              />

              {/* Unlocked label */}
              <p className={`text-[10px] sm:text-[11px] font-black uppercase tracking-[0.28em] ${t.text} mb-3 flex items-center justify-center gap-1.5`}>
                🎉 Achievement Unlocked!
              </p>

              {/* Badge icon */}
              <div
                className={`ach-badge-pulse w-20 h-20 sm:w-24 sm:h-24 rounded-2xl mx-auto mb-3 flex items-center justify-center
                  text-4xl sm:text-5xl bg-gray-950/60 border-2 ${t.border} relative`}
                style={{ "--glow": t.glowRgb } as any}
              >
                {achievement.achievement.icon}
              </div>

              {/* Tier pill */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                text-[9px] sm:text-[10px] font-black uppercase tracking-widest
                bg-gray-950/60 border ${t.border} ${t.text}`}>
                {t.icon} {achievement.achievement.tier} TIER
              </span>
            </div>

            {/* ── Content ── */}
            <div className="px-5 py-4 sm:py-5 text-center">
              <h2 className={`text-xl sm:text-2xl font-black text-white mb-1 leading-tight`}>
                {achievement.achievement.name}
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-4">
                {achievement.achievement.description}
              </p>

              {/* XP reward */}
              {achievement.achievement.xp > 0 && (
                <div className="flex justify-center mb-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-yellow-400/10 border border-yellow-400/20 rounded-full">
                    <span className="text-base sm:text-lg">⭐</span>
                    <span className="text-yellow-300 font-black text-xs sm:text-sm">
                      +{achievement.achievement.xp} Bonus XP
                    </span>
                  </div>
                </div>
              )}

              {/* Countdown bar */}
              <div className="h-1 bg-white/6 rounded-full overflow-hidden mb-4">
                <div className={`ach-countdown h-full rounded-full ${t.bar}`} />
              </div>

              {/* Buttons — compact on mobile */}
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 sm:py-2.5 bg-white/5 hover:bg-white/10
                    border border-white/8 text-gray-400 hover:text-gray-300
                    text-xs sm:text-sm font-semibold rounded-xl transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => { onClose(); navigate("/dashboard/student/achievements"); }}
                  className={`flex-1 py-2 sm:py-2.5 border text-xs sm:text-sm font-bold rounded-xl transition-all ${t.btn}`}
                >
                  View All
                </button>
              </div>

              <p className="text-gray-700 text-[10px] mt-2.5">
                Auto-dismisses in a few seconds…
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};