import { useState, useEffect } from "react";
import { useGetActiveBountiesQuery } from "../../redux/api/api";
import { FaTrophy, FaSpinner, FaCheckCircle, FaClock, FaFire, FaStar, FaLock, FaBolt } from "react-icons/fa";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { useLocation } from "react-router-dom";

interface Bounty {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  actionType: string;
  xpReward: number;
  icon: string;
  isActive: boolean;
  isCompleted: boolean;
  startDate: string;
  endDate: string;
}

// ── Live countdown to next Monday 00:00 ──────────────────────────────────────
function useCountdown() {
  const getMs = () => {
    const now = new Date();
    const next = new Date(now);
    const daysUntilMonday = (1 - now.getDay() + 7) % 7 || 7;
    next.setDate(now.getDate() + daysUntilMonday);
    next.setHours(0, 0, 0, 0);
    return next.getTime() - now.getTime();
  };

  const [ms, setMs] = useState(getMs);
  useEffect(() => {
    const id = setInterval(() => setMs(getMs()), 1000);
    return () => clearInterval(id);
  }, []);

  const totalSecs = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(totalSecs / 86400);
  const h = Math.floor((totalSecs % 86400) / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return { d, h, m, s };
}

// ── Countdown digit block ─────────────────────────────────────────────────────
const CountUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gray-800/80 border border-white/[0.07] flex items-center justify-center">
      <span className="text-lg sm:text-xl font-black text-white tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
    </div>
    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mt-1">{label}</span>
  </div>
);

// ── Single bounty card — matches screenshot style ─────────────────────────────
const BountyCard = ({ bounty }: { bounty: Bounty }) => {
  const { isCompleted, currentCount, targetCount, xpReward, icon, title, description } = bounty;
  const pct = Math.min((currentCount / targetCount) * 100, 100);

  return (
    <div
      className="relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 border border-white/[0.08] hover:border-white/[0.16]"
      style={{ background: "#111827" }}
    >
      <div className="flex flex-col flex-1 gap-5 p-5">

        {/* Row 1: icon (left) + XP pill (right) */}
        <div className="flex items-start justify-between gap-3">
          {/* Emoji icon box */}
          <div
            className="w-[60px] h-[60px] rounded-xl flex items-center justify-center text-[26px] shrink-0 border bg-white/[0.04] border-white/[0.07]"
          >
            {icon}
          </div>

          {/* XP reward pill */}
          <div
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] font-black border shrink-0 text-amber-400 border-amber-500/25 bg-amber-600/10"
          >
            +{xpReward} XP
          </div>
        </div>

        {/* Row 2: title + description */}
        <div className="space-y-1.5">
          <h3 className="text-lg font-black leading-tight text-white">
            {title}
          </h3>
          <p className="text-[13px] leading-relaxed" style={{ color: "#6b7280" }}>
            {description}
          </p>
        </div>

        {/* Row 3: progress */}
        <div className="space-y-2 mt-auto">
          <div className="flex items-center justify-between text-[12px]">
            <span style={{ color: "#6b7280" }}>Progress</span>
            <span className="font-bold tabular-nums text-gray-400">
              {currentCount} / {targetCount}
            </span>
          </div>
          <div className="h-[6px] rounded-full overflow-hidden" style={{ background: "#1f2937" }}>
            <div
              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-emerald-500 to-green-400"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Row 4: completed footer */}
        {isCompleted && (
          <div
            className="flex items-center gap-2 text-[13px] font-bold pt-3 border-t text-emerald-400 border-white/[0.05]"
          >
            <FaCheckCircle size={13} />
            <span>Completed! XP Awarded</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const Bounties = () => {
  useScrollReveal();
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");
  const { data, isLoading, error } = useGetActiveBountiesQuery(undefined);
  const countdown = useCountdown();

  const bounties: Bounty[] = data?.data || [];
  const completedCount = bounties.filter(b => b.isCompleted).length;
  const totalXpAvailable = bounties.reduce((s, b) => s + b.xpReward, 0);
  const earnedXp = bounties.filter(b => b.isCompleted).reduce((s, b) => s + b.xpReward, 0);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${isDashboard ? "py-24" : "min-h-screen bg-gray-950"}`}>
        <div className="flex flex-col items-center gap-3">
          <FaSpinner className="animate-spin text-blue-400" size={28} />
          <p className="text-gray-500 text-sm">Loading bounties…</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className={`flex items-center justify-center p-6 ${isDashboard ? "py-16" : "min-h-screen bg-gray-950"}`}>
        <div className="bg-red-500/8 border border-red-500/20 rounded-2xl p-8 max-w-sm text-center">
          <FaLock size={24} className="text-red-500/50 mx-auto mb-3" />
          <p className="text-red-400 text-sm font-semibold">Failed to load bounties</p>
          <p className="text-gray-600 text-xs mt-1">Please check your connection and try again.</p>
        </div>
      </div>
    );
  }

  // ── Shared inner content ──
  const inner = (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* Public page header */}
      {!isDashboard && (
        <div className="text-center pb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/8 border border-amber-500/20 rounded-full mb-5">
            <FaTrophy className="text-amber-400" size={11} />
            <span className="text-amber-400 text-[11px] font-bold uppercase tracking-widest">Weekly Challenges</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">Active Bounties</h1>
          <p className="text-gray-400 text-sm max-w-lg mx-auto leading-relaxed">
            Complete challenges to earn XP and climb the campus leaderboard. Three new bounties unlock every Monday.
          </p>
        </div>
      )}

      {/* ── Top strip: 3 stat cards + countdown ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Stat cards — match leaderboard/points page style */}
        {[
          {
            label: "Completed",
            value: `${completedCount}/${bounties.length}`,
            icon: <FaCheckCircle size={11} className="text-emerald-400" />,
            accent: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            label: "XP Earned",
            value: `+${earnedXp}`,
            icon: <FaStar size={11} className="text-yellow-400" />,
            accent: "text-yellow-400",
            bg: "bg-yellow-500/10",
          },
          {
            label: "XP Remaining",
            value: totalXpAvailable - earnedXp > 0 ? `+${totalXpAvailable - earnedXp}` : "All Done!",
            icon: <FaBolt size={11} className="text-cyan-400" />,
            accent: totalXpAvailable - earnedXp > 0 ? "text-cyan-400" : "text-emerald-400",
            bg: "bg-cyan-500/10",
          },
          {
            label: "Resets In",
            value: `${countdown.d}d ${countdown.h}h`,
            icon: <FaClock size={11} className="text-violet-400" />,
            accent: "text-violet-400",
            bg: "bg-violet-500/10",
          },
        ].map(({ label, value, icon, accent, bg }) => (
          <div key={label} className="bg-gray-900 border border-white/5 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex items-center justify-between transition-all relative overflow-hidden">
            <div>
              <div className="flex items-center gap-1.5">
                <p className={`text-lg sm:text-2xl font-bold tracking-tight ${accent}`}>{value}</p>
              </div>
              <p className="text-gray-500 text-[8px] sm:text-[10px] uppercase tracking-widest mt-0.5 font-bold">{label}</p>
            </div>
            <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center ${bg}`}>{icon}</div>
          </div>
        ))}
      </div>

      {/* ── Countdown bar ── */}
      <div className="bg-gray-900 border border-white/[0.07] rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <FaClock size={11} className="text-blue-400" />
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Next reset</p>
            </div>
            <p className="text-gray-600 text-xs">Bounties reset every Monday at 12:00 AM</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <CountUnit value={countdown.d} label="Days" />
            <span className="text-gray-700 text-lg font-black pb-4">:</span>
            <CountUnit value={countdown.h} label="Hrs" />
            <span className="text-gray-700 text-lg font-black pb-4">:</span>
            <CountUnit value={countdown.m} label="Min" />
            <span className="text-gray-700 text-lg font-black pb-4">:</span>
            <CountUnit value={countdown.s} label="Sec" />
          </div>
        </div>
      </div>

      {/* ── Bounty cards grid ── */}
      {bounties.length === 0 ? (
        <div className="bg-gray-900 border border-white/[0.07] rounded-2xl py-20 text-center">
          <FaTrophy size={36} className="text-gray-800 mx-auto mb-4" />
          <p className="text-gray-400 text-sm font-semibold">No active bounties right now</p>
          <p className="text-gray-600 text-xs mt-1.5">Check back on Monday for new challenges.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {bounties.map(bounty => <BountyCard key={bounty.id} bounty={bounty} />)}
        </div>
      )}

      {/* ── How it works ── */}
      <div className="bg-gray-900 border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05] flex items-center gap-2">
          <FaBolt size={10} className="text-cyan-400" />
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">How it works</p>
        </div>
        <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.05]">
          {[
            { n: "01", text: "Complete the challenge action report items, comment helpfully, or get claims approved." },
            { n: "02", text: "Progress is tracked automatically. You don't need to check in — the system does it for you." },
            { n: "03", text: "XP lands in your account the moment a bounty is completed. Climb the leaderboard instantly." },
            { n: "04", text: "Three new bounties unlock every Monday at midnight. Unused progress does not carry over." },
          ].map(({ n, text }) => (
            <div key={n} className="px-5 py-4 flex items-start gap-3">
              <span className="text-[10px] font-black text-blue-500/50 font-mono pt-0.5 shrink-0">{n}</span>
              <p className="text-gray-500 text-xs leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );

  // ── Dashboard wrapper ──
  if (isDashboard) {
    return <div className="pb-10">{inner}</div>;
  }

  // ── Public page wrapper ──
  return (
    <section
      className="min-h-screen bg-gray-950 py-12 px-4"
      style={{ backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.07) 0%, transparent 55%)" }}
    >
      {inner}
    </section>
  );
};

export default Bounties;