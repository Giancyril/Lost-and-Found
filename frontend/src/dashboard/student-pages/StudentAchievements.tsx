import React, { useState, useMemo, useEffect } from "react";
import { baseApi } from "../../redux/api/baseApi";
import { useUserVerification } from "../../auth/auth";
import { notify } from "../../utils/notify";
import { useGetMyRankQuery } from "../../redux/api/api";
import {
  FaTrophy, FaSearch, FaBullseye, FaCheckCircle,
  FaStar, FaComments, FaBolt, FaClock, FaLock, FaFilter,
  FaMedal, FaCrown, FaTimes
} from "react-icons/fa";

const achievementApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getAllAchievements: b.query({
      query: () => ({ url: "/achievements", method: "GET" }),
      providesTags: ["achievements"],
    }),
    getMyAchievements: b.query({
      query: () => ({ url: "/achievements/my", method: "GET" }),
      providesTags: ["achievements"],
    }),
    togglePinAchievement: b.mutation({
      query: (achievementId: string) => ({ url: `/achievements/${achievementId}/pin`, method: "PUT" }),
      async onQueryStarted(achievementId, { dispatch, queryFulfilled }) {
        // Optimistic update for my achievements list
        const patchResult = dispatch(
          (achievementApi.util as any).updateQueryData('getMyAchievements', undefined, (draft: any) => {
            if (draft?.data) {
              const ua = draft.data.find((a: any) => a.achievementId === achievementId);
              if (ua) ua.isPinned = !ua.isPinned;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    unlockSecretAchievement: b.mutation({
      query: (body: { secretKey: string }) => ({ url: "/achievements/unlock-secret", method: "POST", body }),
      invalidatesTags: ["achievements"],
    }),
  }),
  overrideExisting: false,
});

const TIER_ORDER: Record<string, number> = {
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
  PLATINUM: 4,
  LEGEND: 5,
};

const TIER_STYLES = {
  BRONZE: { border: "border-amber-500/20", bg: "bg-amber-500/5", text: "text-amber-500", glow: "shadow-amber-500/10", animation: "" },
  SILVER: { border: "border-gray-400/20", bg: "bg-gray-400/5", text: "text-gray-300", glow: "shadow-gray-400/10", animation: "" },
  GOLD: { border: "border-yellow-400/20", bg: "bg-yellow-400/5", text: "text-yellow-400", glow: "shadow-yellow-400/20", animation: "" },
  PLATINUM: { border: "border-cyan-400/20", bg: "bg-cyan-400/5", text: "text-cyan-400", glow: "shadow-cyan-400/20", animation: "" },
  LEGEND: {
    border: "border-indigo-500/60",
    bg: "bg-indigo-950/40",
    text: "text-indigo-100 drop-shadow-[0_0_12px_rgba(129,140,248,0.8)] font-black italic tracking-tight",
    glow: "shadow-[0_0_40px_rgba(129,140,248,0.3)] border-indigo-400/50",
    animation: "animate-pulse-slow"
  },
};

const CATEGORIES = [
  { id: "all", label: "All Badges", icon: <FaTrophy size={12} /> },
  { id: "found", label: "Found", icon: <FaSearch size={12} /> },
  { id: "lost", label: "Lost", icon: <FaBullseye size={12} /> },
  { id: "claim", label: "Claims", icon: <FaCheckCircle size={12} /> },
  { id: "points", label: "Points", icon: <FaStar size={12} /> },
  { id: "community", label: "Community", icon: <FaComments size={12} /> },
  { id: "streak", label: "Streaks", icon: <FaBolt size={12} /> },
  { id: "special", label: "Special", icon: <FaClock size={12} /> },
];

const AchievementModal = ({ ach, onClose, onViewAll }: { ach: any, onClose: () => void, onViewAll: () => void }) => {
  useEffect(() => {
    const playTierSound = (tier: string) => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        const playNote = (freq: number, start: number, duration: number, volume: number, type: 'sine' | 'triangle' | 'sawtooth' | 'square' = 'triangle') => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(volume, start + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + duration);
        };

        if (tier === "BRONZE") {
          const vol = 0.05;
          playNote(880, now, 0.4, vol, 'sine');       // A5
          playNote(1318.51, now + 0.08, 0.5, vol, 'sine'); // E6
        } else if (tier === "SILVER") {
          const vol = 0.06;
          playNote(783.99, now, 0.5, vol, 'triangle');     // G5
          playNote(987.77, now + 0.08, 0.5, vol, 'triangle');  // B5
          playNote(1174.66, now + 0.16, 0.6, vol, 'triangle'); // D6
        } else if (tier === "GOLD") {
          const vol = 0.07;
          playNote(523.25, now, 0.6, vol, 'triangle');     // C5
          playNote(659.25, now + 0.06, 0.6, vol, 'triangle');  // E5
          playNote(783.99, now + 0.12, 0.7, vol, 'triangle');  // G5
          playNote(1046.50, now + 0.18, 0.8, vol + 0.02, 'triangle'); // C6
        } else if (tier === "PLATINUM") {
          const vol = 0.07;
          playNote(587.33, now, 0.6, vol, 'triangle');     // D5
          playNote(739.99, now + 0.06, 0.6, vol, 'triangle');  // F#5
          playNote(880.00, now + 0.12, 0.6, vol, 'triangle');  // A5
          playNote(1174.66, now + 0.18, 0.7, vol, 'triangle'); // D6
          playNote(1479.98, now + 0.24, 0.9, vol + 0.03, 'sine'); // F#6
        } else {
          // LEGEND / Other: Cosmic scale
          const thudOsc = ctx.createOscillator();
          const thudGain = ctx.createGain();
          thudOsc.type = 'sine';
          thudOsc.frequency.setValueAtTime(55, now);
          thudOsc.frequency.exponentialRampToValueAtTime(110, now + 0.3);
          thudGain.gain.setValueAtTime(0, now);
          thudGain.gain.linearRampToValueAtTime(0.3, now + 0.05);
          thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
          thudOsc.connect(thudGain);
          thudGain.connect(ctx.destination);
          thudOsc.start(now);
          thudOsc.stop(now + 0.6);

          const shimVol = 0.08;
          playNote(1174.66, now + 0.05, 0.8, shimVol, 'triangle');
          playNote(1479.98, now + 0.10, 0.8, shimVol, 'triangle');
          playNote(1760.00, now + 0.15, 0.8, shimVol, 'triangle');
          playNote(2349.32, now + 0.20, 1.0, shimVol + 0.02, 'triangle');

          const airOsc = ctx.createOscillator();
          const airGain = ctx.createGain();
          airOsc.type = 'sine';
          airOsc.frequency.setValueAtTime(2349.32, now + 0.20);
          airGain.gain.setValueAtTime(0, now + 0.20);
          airGain.gain.linearRampToValueAtTime(0.04, now + 0.25);
          airGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
          airOsc.connect(airGain);
          airGain.connect(ctx.destination);
          airOsc.start(now + 0.20);
          airOsc.stop(now + 2.0);
        }

        setTimeout(() => { if (ctx.state !== 'closed') ctx.close(); }, 3000);
      } catch (e) {
        console.warn(" célébration sound landscape failed to play", e);
      }
    };

    if (ach?.tier) {
      playTierSound(ach.tier);
    }
    
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [ach, onClose]);

  if (!ach) return null;
  const style = TIER_STYLES[ach.tier as keyof typeof TIER_STYLES] || TIER_STYLES.BRONZE;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
      <div className="bg-[#0f172a] border border-white/10 rounded-[1.5rem] w-full max-w-[240px] sm:max-w-[280px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="relative pt-6 pb-4 px-4 flex flex-col items-center justify-center bg-[#1e293b]/30">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
          <div className="relative z-10 mb-3 flex items-center gap-1 text-[7px] font-black text-gray-500 uppercase tracking-[0.2em]">
            <span>🎉</span> ACHIEVEMENT UNLOCKED!
          </div>
          <div className="relative z-10 w-14 h-14 bg-[#0f172a] border border-white/10 rounded-2xl flex items-center justify-center text-3xl shadow-2xl mb-4 ring-1 ring-white/10">
            <div className={`absolute inset-0 opacity-20 blur-xl rounded-full ${style.bg}`} />
            <span className="relative z-10 drop-shadow-2xl">{ach.icon}</span>
          </div>
          <div className={`relative z-10 px-2.5 py-1 rounded-full border border-white/10 bg-[#1e293b] text-[6px] sm:text-[7px] font-black uppercase tracking-widest flex items-center gap-1 ${style.text}`}>
            <span>
              {ach.tier === 'BRONZE' ? '🥉' : ach.tier === 'SILVER' ? '🥈' : ach.tier === 'GOLD' ? '🥇' : ach.tier === 'PLATINUM' ? '💎' : '👑'}
            </span>
            {ach.tier} TIER
          </div>
        </div>
        <div className="px-5 pt-5 pb-6 text-center flex flex-col items-center bg-[#0f172a]">
          <h3 className="text-lg font-black text-white mb-1 tracking-tight">{ach.name}</h3>
          <p className="text-gray-400 text-[9px] font-medium mb-5 leading-relaxed max-w-[95%] mx-auto">
            {ach.description}
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-full text-yellow-500 font-black text-[8px] uppercase tracking-wider mb-6">
            <FaStar size={8} className="animate-pulse" />
            +{ach.xp} Bonus XP
          </div>
          <div className="w-full h-px bg-white/5 mb-5" />
          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              onClick={onClose}
              className="py-2.5 bg-[#1e293b]/50 hover:bg-[#1e293b] text-gray-400 hover:text-white font-black text-[7px] uppercase tracking-widest rounded-lg border border-white/5 transition-all active:scale-95"
            >
              Dismiss
            </button>
            <button
              onClick={onViewAll}
              className="py-2.5 bg-[#1e293b]/50 hover:bg-[#1e293b] text-white font-black text-[7px] uppercase tracking-widest rounded-lg border border-white/5 transition-all active:scale-95"
            >
              View All
            </button>
          </div>
          <p className="mt-4 text-[7px] text-gray-700 font-bold uppercase tracking-widest opacity-40">Auto-dismisses in a few seconds...</p>
        </div>
      </div>
    </div>
  );
};

const StudentAchievements: React.FC = () => {
  const user: any = useUserVerification();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [unlockedAchievement, setUnlockedAchievement] = useState<any>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const isLoggedIn = !!user?.id;
  const { data: allData, isLoading: loadingAll } = (achievementApi as any).useGetAllAchievementsQuery(undefined, { skip: !isLoggedIn });
  const { data: myData, isLoading: loadingMy } = (achievementApi as any).useGetMyAchievementsQuery(undefined, { skip: !isLoggedIn });
  const [togglePin] = (achievementApi as any).useTogglePinAchievementMutation();
  const [unlockSecret] = (achievementApi as any).useUnlockSecretAchievementMutation();
  const { data: rankData } = useGetMyRankQuery(undefined, { skip: !isLoggedIn });
  const myRankInfo = rankData?.data ?? null;
  const myRank: number = myRankInfo?.rank ?? 0;
  const myDelta: number | null = myRankInfo?.delta ?? null;


  const allAchievements = allData?.data?.achievements || [];
  const totalUsers = allData?.data?.totalUsers || 1;
  const myAchievements = myData?.data || [];
  const unlockedKeys = new Set(myAchievements.map((a: any) => a.achievement.key));

  if (loadingAll || loadingMy) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-900 border border-white/5 rounded-2xl" />)}
        </div>
        <div className="h-16 bg-gray-900 border border-white/5 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-square bg-gray-900 border border-white/5 rounded-2xl" />)}
        </div>
      </div>
    );
  }


  const handleUnlockSecret = async (key: string) => {
    if (isUnlocking) return;
    setIsUnlocking(true);
    try {
      const res = await unlockSecret({ secretKey: key }).unwrap();
      if (res.success) {
        setUnlockedAchievement(res.data.achievement);
        localStorage.removeItem("easter_egg_clicks");
        notify.success("Secret achievement unlocked!");
      } else {
        notify.error("Could not unlock achievement.");
      }
    } catch (err: any) {
      notify.error(err?.data?.message || "Invalid secret key.");
    } finally {
      setIsUnlocking(false);
    }
  };


  const pinnedAchievements = myAchievements.filter((a: any) => a.isPinned);

  const filteredAchievements = allAchievements
    .filter((a: any) => {
      const matchesFilter = filter === "all" || a.category === filter;
      const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.description.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    })
    .sort((a: any, b: any) => (TIER_ORDER[a.tier] || 0) - (TIER_ORDER[b.tier] || 0));

  const stats = {
    total: allAchievements.length,
    unlocked: myAchievements.length,
    percent: Math.round((myAchievements.length / (allAchievements.length || 1)) * 100),
    points: myAchievements.reduce((sum: number, a: any) => sum + (a.achievement.xp || 0), 0)
  };

  return (
    <div className="space-y-3 sm:space-y-5 max-w-7xl mx-auto pb-10 px-2 sm:px-0">
      {unlockedAchievement && (
        <AchievementModal
          ach={unlockedAchievement}
          onClose={() => setUnlockedAchievement(null)}
          onViewAll={() => { setUnlockedAchievement(null); setFilter('all'); }}
        />
      )}
      <style>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.01); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        {[
          {
            label: "Badges Earned",
            value: stats.unlocked,
            icon: <FaMedal size={11} className="text-blue-400" />,
            bg: "bg-blue-500/10",
            accent: "text-white",
          },
          { label: "Total Badges", value: stats.total, icon: <FaTrophy size={11} className="text-yellow-400" />, bg: "bg-yellow-500/10", accent: "text-yellow-400" },
          { label: "Bonus XP", value: stats.points, icon: <FaStar size={11} className="text-emerald-400" />, bg: "bg-emerald-500/10", accent: "text-emerald-400" },
          {
            label: "Leaderboard Rank",
            value: myRank > 0 ? `#${myRank}` : "—",
            sub: myDelta !== null && myDelta !== 0
              ? (myDelta > 0 ? `▲${myDelta}` : `▼${Math.abs(myDelta)}`)
              : null,
            subColor: myDelta !== null && myDelta > 0 ? "text-emerald-400" : "text-red-400",
            icon: <FaTrophy size={11} className="text-cyan-400" />,
            bg: "bg-cyan-500/10",
            accent: "text-cyan-400",
          },
          {
            label: "Completion",
            value: `${stats.percent}%`,
            icon: <FaBolt size={11} className="text-purple-400" />,
            bg: "bg-purple-500/10",
            accent: "text-purple-400",
            onClick: () => {
              if (isUnlocking) return;
              const hasEgg = unlockedKeys.has("EASTER_EGG");
              if (hasEgg) return;

              const count = parseInt(localStorage.getItem('easter_egg_clicks') || '0') + 1;
              localStorage.setItem('easter_egg_clicks', count.toString());

              if (count >= 10) {
                handleUnlockSecret("EASTER_EGG");
              }
            }
          },
        ].map(({ label, value, sub, subColor, icon, bg, accent, onClick }: any) => (
          <div
            key={label}
            onClick={onClick}
            className={`bg-gray-900 border border-white/5 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex items-center justify-between transition-all relative overflow-hidden ${onClick ? 'cursor-help active:scale-95' : ''}`}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <p className={`text-lg sm:text-2xl font-bold tracking-tight ${accent}`}>{value}</p>
                {sub && <span className={`text-[9px] font-black ${subColor}`}>{sub}</span>}
              </div>
              <p className="text-gray-500 text-[8px] sm:text-[10px] uppercase tracking-widest mt-0.5 font-bold">{label}</p>
            </div>
            <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center ${bg}`}>{icon}</div>
          </div>
        ))}
      </div>

      {/* 👑 Achievement Showcase Section */}
      {pinnedAchievements.length > 0 && (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 mb-4 px-1">

            <div>
              <h2 className="text-[10px] sm:text-[12px] font-black text-white uppercase tracking-widest leading-none">Achievement Showcase</h2>
              <p className="text-[8px] text-gray-600 font-bold uppercase tracking-tighter mt-1">{pinnedAchievements.length} of 6 Badges Featured</p>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
            {pinnedAchievements.map((ua: any) => {
              const ach = ua.achievement;
              const style = TIER_STYLES[ach.tier as keyof typeof TIER_STYLES] || TIER_STYLES.BRONZE;
              return (
                <div key={ach.id} className={`group relative aspect-square rounded-xl bg-gray-900 border-2 ${style.border} flex flex-col items-center justify-center p-2 text-center overflow-hidden transition-all hover:scale-105 shadow-lg ${style.glow}`}>
                  <div className="text-2xl sm:text-3xl mb-1 drop-shadow-sm">{ach.icon}</div>
                  <h3 className={`text-[7px] sm:text-[9px] font-black uppercase tracking-tight truncate w-full ${style.text}`}>{ach.name}</h3>
                  <button
                    onClick={() => togglePin(ach.id)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:text-gray-300 text-gray-500 bg-gray-950/50 rounded-lg border border-white/10"
                    title="Remove from showcase"
                  >
                    <FaTimes size={8} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filter - Standard Layout */}
      <div className="bg-gray-900 border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div className="relative flex-1 w-full">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={10} />
          <input
            type="text" placeholder="Search badges..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 sm:py-2.5 bg-gray-800/80 border border-white/10 rounded-xl sm:rounded-2xl text-white text-xs sm:text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-bold uppercase tracking-widest transition-all border
                ${filter === cat.id
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  : "bg-gray-800/50 text-gray-500 hover:text-gray-300 border-transparent"}`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Badges Grid - Modern & Clean */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
        {filteredAchievements.map((ach: any) => {
          const isUnlocked = unlockedKeys.has(ach.key);

          const currentTier = ach.tier;

          const style = TIER_STYLES[currentTier as keyof typeof TIER_STYLES] || TIER_STYLES.BRONZE;
          const unlockData = myAchievements.find((ma: any) => ma.achievement.key === ach.key);
          const isSecret = ach.secret && !isUnlocked;
          const isSelected = selectedId === ach.id;

          // Rarity calculation
          const unlockCount = ach._count?.userAchievements || 0;
          const rarityPercent = Math.round((unlockCount / (totalUsers || 1)) * 100);
          const isRare = rarityPercent <= 15;

          // Real Progress Tracking
          const hasProgress = ach.progress && ach.progress.targetValue > 0;
          const currentProgress = hasProgress ? ach.progress.currentProgress : 0;
          const targetValue = hasProgress ? ach.progress.targetValue : 100;
          const progressPercent = hasProgress ? Math.min(100, Math.round((currentProgress / targetValue) * 100)) : 0;
          // Binary achievements (target === 1): show "Not yet" vs "Done"
          const isBinary = hasProgress && targetValue === 1;
          
          // Chain indicator
          const hasParent = !!ach.parentKey;
          const isUpgraded = isUnlocked && hasParent;

          return (
            <div
              key={ach.id}
              onClick={() => setSelectedId(prev => prev === ach.id ? null : ach.id)}
              className={`group relative aspect-square rounded-xl sm:rounded-2xl p-0.5 transition-all duration-300 cursor-pointer select-none
                ${isUnlocked ? `hover:scale-[1.02] ${currentTier === 'LEGEND' ? style.animation : ''}` : "grayscale opacity-50"}
                ${isSelected ? "scale-[1.02] ring-2 ring-blue-500/20" : ""}`}
            >
              <div className={`h-full w-full rounded-[0.7rem] sm:rounded-[0.9rem] border flex flex-col items-center justify-center p-2 sm:p-3 text-center relative overflow-hidden transition-colors
                ${isUnlocked
                  ? `bg-gray-900 ${style.border} ${currentTier === 'LEGEND' ? style.glow : ''}`
                  : "bg-gray-900/40 border-white/5"}`}
              >
                {/* Main Content Layer - Hides on hover/select to prevent "merging" */}
                <div className={`flex flex-col items-center justify-center w-full h-full transition-opacity duration-200 
                  ${isSelected ? "opacity-0" : "group-hover:opacity-0"}`}>

                  {/* Progressive Bar - Real Progress */}
                  {!isUnlocked && !isSecret && hasProgress && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-blue-500/40 transition-all duration-1000"
                        style={{ width: `${Math.max(progressPercent, 4)}%` }}
                      />
                    </div>
                  )}
                  
                  {/* Chain Indicator - Shows if upgraded from previous tier */}
                  {isUpgraded && (
                    <div className="absolute top-1 left-1 text-[8px] opacity-70">⬆️</div>
                  )}

                  {/* Rarity Indicator */}
                  {!isSecret && (
                    <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[5px] sm:text-[6px] font-black uppercase tracking-tighter transition-all duration-500
                      ${isRare ? "bg-purple-600/20 text-purple-400 border border-purple-500/30 animate-pulse" : "bg-white/5 text-gray-600 border border-transparent"}`}>
                      {rarityPercent}% EARNED
                    </div>
                  )}

                  {/* Badge Icon */}
                  <div className="text-xl sm:text-3xl mb-1 sm:mb-2 transition-transform duration-500 group-hover:scale-110 drop-shadow-sm">
                    {isSecret ? <FaLock size={14} className="text-gray-700" /> : ach.icon}
                  </div>

                  {/* Badge Name */}
                  <h3 className={`text-[7px] sm:text-[10px] font-black uppercase tracking-widest leading-tight px-1
                    ${isUnlocked ? (currentTier === 'LEGEND' ? style.text : style.text) : "text-gray-600"}`}>
                    {isSecret ? "???" : ach.name}
                  </h3>

                  {/* Tier Label */}
                  {!isSecret && (
                    <span className={`mt-1 sm:mt-1.5 text-[6px] sm:text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border
                      ${isUnlocked ? `${style.bg} ${style.border} ${style.text}` : "bg-white/5 border-white/5 text-gray-700"}`}>
                      {currentTier}
                    </span>
                  )}
                </div>

                {/* Info Overlay Layer - Shows on hover or select */}
                <div
                  onClick={(e) => {
                    if (isSelected && window.innerWidth < 640) {
                      e.stopPropagation();
                      setSelectedId(null);
                    }
                  }}
                  className={`absolute inset-0 bg-gray-950 flex flex-col items-center p-2 sm:p-4 transition-opacity duration-200 z-20
                  ${isSelected ? "opacity-100 pointer-events-auto" : "opacity-0 group-hover:opacity-100 pointer-events-none sm:pointer-events-auto"}
                  ${isUnlocked ? "justify-end pb-4 sm:justify-center" : "justify-center text-center"}`}>
                  {/* Pin/Showcase Button - Top Right, compact size */}
                  {isUnlocked && (
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePin(ach.id); }}
                      className={`absolute top-1 right-1 sm:top-1.5 sm:right-1.5 p-1 transition-all duration-300 hover:scale-110 bg-gray-900 border border-white/20 z-30 rounded-md
                         ${unlockData?.isPinned ? "text-yellow-400 border-yellow-400/40 shadow-[0_0_15px_rgba(250,204,21,0.25)]" : "text-gray-500 hover:text-white"}`}
                      title={unlockData?.isPinned ? "Remove from showcase" : "Add to showcase"}
                    >
                      <FaCrown size={9} className="sm:w-3 sm:h-3" />
                    </button>
                  )}

                  <p className="text-[7.5px] sm:text-[10px] text-gray-300 font-bold leading-tight sm:leading-relaxed max-w-[85%] mx-auto">
                    {isSecret ? "Unlock this secret achievement to reveal its details." : ach.description}
                  </p>
                  
                  {/* Progress Counter for incomplete progressive achievements */}
                  {!isUnlocked && !isSecret && hasProgress && (
                    <div className="mt-2 space-y-1">
                      {isBinary ? (
                        <p className={`text-[8px] font-black uppercase ${currentProgress >= 1 ? "text-emerald-400" : "text-gray-500"}`}>
                          {currentProgress >= 1 ? "✓ Condition met" : "Not yet achieved"}
                        </p>
                      ) : (
                        <p className="text-[8px] text-blue-400 font-black uppercase">
                          Progress: {currentProgress}/{targetValue}
                        </p>
                      )}
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isBinary
                              ? currentProgress >= 1 ? "bg-emerald-500/60" : "bg-white/10"
                              : "bg-blue-500/60"
                          }`}
                          style={{ width: `${Math.max(progressPercent, 4)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {isUnlocked && (
                    <div className="mt-2 sm:mt-3 space-y-0.5 sm:space-y-1">
                      <p className="text-[6px] sm:text-[8px] text-emerald-400 font-black uppercase">+{ach.xp} XP</p>
                      {unlockData && (
                        <p className="text-[7px] text-gray-500 font-bold uppercase">
                          {new Date(unlockData.unlockedAt).toLocaleDateString()}
                        </p>
                      )}
                      {isUpgraded && (
                        <p className="text-[6px] text-indigo-400 font-bold uppercase flex items-center gap-1 justify-center">
                          <span>⬆️</span> Upgraded Badge
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="py-20 text-center bg-gray-900 border border-white/5 rounded-2xl">
          <FaTrophy size={24} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">No badges match your filters</p>
        </div>
      )}
    </div>
  );
};

export default StudentAchievements;