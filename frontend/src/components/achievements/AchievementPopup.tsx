import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const TIER_COLORS = {
  BRONZE:   { bg: "from-amber-900/90 to-amber-800/90",   border: "border-amber-500/50",   glow: "shadow-amber-500/30",  text: "text-amber-400"   },
  SILVER:   { bg: "from-gray-700/90 to-gray-600/90",     border: "border-gray-400/50",    glow: "shadow-gray-400/30",   text: "text-gray-300"    },
  GOLD:     { bg: "from-yellow-900/90 to-yellow-800/90", border: "border-yellow-400/60",  glow: "shadow-yellow-400/40", text: "text-yellow-400"  },
  PLATINUM: { bg: "from-cyan-900/90 to-cyan-800/90",     border: "border-cyan-400/60",    glow: "shadow-cyan-400/40",   text: "text-cyan-300"    },
  LEGEND:   { bg: "from-purple-900/90 to-pink-900/90",   border: "border-purple-400/60",  glow: "shadow-purple-400/50", text: "text-purple-300"  },
};

interface Achievement {
  id: string;
  achievement: {
    name: string;
    description: string;
    icon: string;
    tier: keyof typeof TIER_COLORS;
    xp: number;
  };
}

export const AchievementPopup = ({ achievement, onClose }: {
  achievement: Achievement;
  onClose: () => void;
}) => {
  const [phase, setPhase] = useState<"enter" | "show" | "fly">("enter");
  const navigate = useNavigate();
  const tier = TIER_COLORS[achievement.achievement.tier] || TIER_COLORS.BRONZE;

  useEffect(() => {
    // Phase 1: enter animation (0.6s)
    const t1 = setTimeout(() => setPhase("show"), 600);
    // Phase 2: auto-dismiss after 4s, fly to navbar
    const t2 = setTimeout(() => setPhase("fly"), 4000);
    // Phase 3: close and navigate
    const t3 = setTimeout(() => { onClose(); }, 5200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onClose]);

  return (
    <>
      <style>{`
        @keyframes achievementEnter {
          0%   { opacity: 0; transform: scale(0.5) translateY(60px) rotate(-5deg); }
          60%  { transform: scale(1.08) translateY(-8px) rotate(1deg); }
          80%  { transform: scale(0.97) translateY(2px) rotate(0deg); }
          100% { opacity: 1; transform: scale(1) translateY(0) rotate(0deg); }
        }
        @keyframes achievementFly {
          0%   { opacity: 1; transform: scale(1) translate(0,0); }
          30%  { transform: scale(0.8) translate(0, -20px); }
          100% { opacity: 0; transform: scale(0.1) translate(180px, -320px); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes particleBurst {
          0%   { opacity: 1; transform: scale(1) translate(0,0); }
          100% { opacity: 0; transform: scale(0) translate(var(--tx), var(--ty)); }
        }
        @keyframes badgePulse {
          0%, 100% { box-shadow: 0 0 20px var(--glow-color), 0 0 40px var(--glow-color); }
          50%       { box-shadow: 0 0 40px var(--glow-color), 0 0 80px var(--glow-color); }
        }
        .achievement-enter { animation: achievementEnter 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .achievement-fly   { animation: achievementFly   1.2s cubic-bezier(0.4,0,1,1) forwards; }
        .shimmer-text {
          background: linear-gradient(90deg, currentColor 25%, rgba(255,255,255,0.8) 50%, currentColor 75%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          animation: shimmer 2s linear infinite;
        }
      `}</style>

      {/* Backdrop */}
      <div className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-500
        ${phase === "fly" ? "pointer-events-none" : "bg-black/60 backdrop-blur-sm"}`}
        onClick={phase !== "fly" ? onClose : undefined}
      >

        {/* Particle burst */}
        {phase === "show" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}
                className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                style={{
                  background: i % 3 === 0 ? "#fbbf24" : i % 3 === 1 ? "#60a5fa" : "#a78bfa",
                  "--tx": `${(Math.random() - 0.5) * 400}px`,
                  "--ty": `${(Math.random() - 0.5) * 400}px`,
                  animation: `particleBurst ${0.8 + Math.random() * 0.6}s ease-out forwards`,
                  animationDelay: `${Math.random() * 0.3}s`,
                } as any}
              />
            ))}
          </div>
        )}

        {/* Card */}
        <div className={`relative max-w-sm w-full mx-4
          ${phase === "enter" ? "achievement-enter" : ""}
          ${phase === "fly" ? "achievement-fly" : ""}
          ${phase === "show" ? "opacity-100 scale-100" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Outer glow ring */}
          <div className={`absolute -inset-1 rounded-3xl bg-gradient-to-br ${tier.bg} blur-xl opacity-60`} />

          {/* Card body */}
          <div className={`relative bg-gray-900 border-2 ${tier.border} rounded-3xl overflow-hidden
            shadow-2xl ${tier.glow}`}>

            {/* Top banner */}
            <div className={`bg-gradient-to-r ${tier.bg} px-6 pt-6 pb-4 text-center relative overflow-hidden`}>
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "radial-gradient(circle at 50% 50%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

              <p className={`text-[11px] font-black uppercase tracking-[0.3em] ${tier.text} mb-3`}>
                🎉 Achievement Unlocked!
              </p>

              {/* Icon */}
              <div className={`w-24 h-24 rounded-2xl mx-auto mb-3 flex items-center justify-center text-5xl
                bg-gray-900/50 border-2 ${tier.border} relative`}
                style={{ 
                  animation: "badgePulse 2s ease-in-out infinite", 
                  "--glow-color": tier.text === "text-amber-400" ? "rgba(245, 158, 11, 0.4)" : 
                                  tier.text === "text-gray-300" ? "rgba(209, 213, 219, 0.3)" :
                                  tier.text === "text-yellow-400" ? "rgba(250, 204, 21, 0.5)" :
                                  tier.text === "text-cyan-300" ? "rgba(34, 211, 238, 0.5)" :
                                  "rgba(168, 85, 247, 0.5)"
                } as any}>
                {achievement.achievement.icon}
              </div>

              {/* Tier label */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                bg-gray-900/60 border ${tier.border} ${tier.text}`}>
                {achievement.achievement.tier} TIER
              </span>
            </div>

            {/* Content */}
            <div className="px-6 py-5 text-center">
              <h2 className={`text-2xl font-black text-white mb-2 shimmer-text ${tier.text}`}>
                {achievement.achievement.name}
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                {achievement.achievement.description}
              </p>

              {/* XP reward */}
              {achievement.achievement.xp > 0 && (
                <div className="flex items-center justify-center gap-2 mb-5">
                  <div className="flex items-center gap-2 px-4 py-2 bg-yellow-400/10 border border-yellow-400/20 rounded-full">
                    <span className="text-yellow-400 text-lg">⭐</span>
                    <span className="text-yellow-300 font-black text-sm">+{achievement.achievement.xp} Bonus XP</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={onClose}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 text-sm font-medium rounded-xl transition-colors">
                  Dismiss
                </button>
                <button onClick={() => { onClose(); navigate("/dashboard/student/achievements"); }}
                  className={`flex-1 py-2.5 bg-gradient-to-r ${tier.bg} border ${tier.border} ${tier.text} text-sm font-bold rounded-xl transition-all hover:opacity-90`}>
                  View All
                </button>
              </div>

              <p className="text-gray-700 text-[10px] mt-3">Auto-dismisses in a few seconds…</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
