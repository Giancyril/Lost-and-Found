import React, { useState } from "react";
import { baseApi } from "../../redux/api/baseApi";
import { useUserVerification } from "../../auth/auth";
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
  BRONZE: { border: "border-amber-500/20", bg: "bg-amber-500/5", text: "text-amber-500", glow: "shadow-amber-500/10" },
  SILVER: { border: "border-gray-400/20", bg: "bg-gray-400/5", text: "text-gray-300", glow: "shadow-gray-400/10" },
  GOLD: { border: "border-yellow-400/20", bg: "bg-yellow-400/5", text: "text-yellow-400", glow: "shadow-yellow-400/20" },
  PLATINUM: { border: "border-cyan-400/20", bg: "bg-cyan-400/5", text: "text-cyan-400", glow: "shadow-cyan-400/20" },
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

const StudentAchievements: React.FC = () => {
  const user: any = useUserVerification();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [unlockedAchievement, setUnlockedAchievement] = useState<any>(null);

  const { data: allData, isLoading: loadingAll } = (achievementApi as any).useGetAllAchievementsQuery();
  const { data: myData, isLoading: loadingMy } = (achievementApi as any).useGetMyAchievementsQuery();
  const [togglePin] = (achievementApi as any).useTogglePinAchievementMutation();
  const [unlockSecret] = (achievementApi as any).useUnlockSecretAchievementMutation();

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

  const AchievementModal = ({ ach, onClose }: { ach: any, onClose: () => void }) => {
    if (!ach) return null;
    const style = TIER_STYLES[ach.tier as keyof typeof TIER_STYLES] || TIER_STYLES.BRONZE;
    
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
        <div className="bg-[#0f172a] border border-white/10 rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
          
          {/* Header Section with Dotted Grid */}
          <div className="relative pt-10 pb-8 px-6 flex flex-col items-center justify-center bg-[#1e293b]/30">
            {/* Dotted Grid Pattern */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
            
            <div className="relative z-10 mb-6 flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
              <span>🎉</span> ACHIEVEMENT UNLOCKED!
            </div>

            <div className="relative z-10 w-24 h-24 bg-[#0f172a] border border-white/10 rounded-3xl flex items-center justify-center text-5xl shadow-[0_0_30px_rgba(0,0,0,0.5)] mb-6 ring-4 ring-white/5">
              <div className={`absolute inset-0 opacity-20 blur-xl rounded-full ${style.bg}`} />
              <span className="relative z-10 drop-shadow-2xl">{ach.icon}</span>
            </div>

            <div className={`relative z-10 px-4 py-1.5 rounded-full border border-white/10 bg-black/40 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${style.text}`}>
               <span className="text-xs">
                 {ach.tier === 'BRONZE' ? '🥉' : ach.tier === 'SILVER' ? '🥈' : ach.tier === 'GOLD' ? '🥇' : ach.tier === 'PLATINUM' ? '💎' : '👑'}
               </span>
               {ach.tier} TIER
            </div>
          </div>

          {/* Body Section */}
          <div className="px-8 pt-8 pb-10 text-center flex flex-col items-center bg-[#0f172a]">
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">{ach.name}</h3>
            <p className="text-gray-400 text-sm font-medium mb-8 leading-relaxed max-w-[90%] mx-auto">
              {ach.description}
            </p>

            <div className="inline-flex items-center gap-2.5 px-6 py-3 bg-yellow-400/10 border border-yellow-400/20 rounded-full text-yellow-500 font-black text-xs uppercase tracking-wider mb-10 shadow-lg shadow-yellow-400/5">
              <FaStar size={12} className="animate-pulse" />
              +{ach.xp} Bonus XP
            </div>

            <div className="w-full h-px bg-white/5 mb-8" />

            <div className="grid grid-cols-2 gap-4 w-full px-2">
              <button 
                onClick={onClose}
                className="py-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-black text-xs uppercase tracking-widest rounded-2xl border border-white/10 transition-all active:scale-95"
              >
                Dismiss
              </button>
              <button 
                onClick={() => { onClose(); setFilter('all'); }}
                className="py-4 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl border border-white/10 transition-all active:scale-95"
              >
                View All
              </button>
            </div>

            <p className="mt-6 text-[9px] text-gray-600 font-bold uppercase tracking-widest opacity-60">Auto-dismisses in a few seconds...</p>
          </div>
        </div>
      </div>
    );
  };
  const handleUnlockSecret = async (key: string) => {
    try {
      const res = await unlockSecret({ secretKey: key }).unwrap();
      if (res.success) {
        setUnlockedAchievement(res.data.achievement);
        localStorage.removeItem("easter_egg_clicks");
      }
    } catch (err: any) {
      console.error("Unlock failed", err);
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

      {/* Stats row - Standard Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: "Badges Earned", value: stats.unlocked, icon: <FaMedal size={11} className="text-blue-400" />, bg: "bg-blue-500/10", accent: "text-white" },
          { label: "Total Badges", value: stats.total, icon: <FaTrophy size={11} className="text-yellow-400" />, bg: "bg-yellow-500/10", accent: "text-yellow-400" },
          { label: "Bonus XP", value: stats.points, icon: <FaStar size={11} className="text-emerald-400" />, bg: "bg-emerald-500/10", accent: "text-emerald-400" },
          {
            label: "Completion",
            value: `${stats.percent}%`,
            icon: <FaBolt size={11} className="text-purple-400" />,
            bg: "bg-purple-500/10",
            accent: "text-purple-400",
            onClick: () => {
              const hasEgg = unlockedKeys.has("EASTER_EGG");
              if (hasEgg) return;

              const count = parseInt(localStorage.getItem('easter_egg_clicks') || '0') + 1;
              localStorage.setItem('easter_egg_clicks', count.toString());
              
              if (count >= 10) {
                handleUnlockSecret("EASTER_EGG");
              }
            }
          },
        ].map(({ label, value, icon, bg, accent, onClick }: any) => (
          <div
            key={label}
            onClick={onClick}
            className={`bg-gray-900 border border-white/5 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex items-center justify-between transition-all relative overflow-hidden ${onClick ? 'cursor-help active:scale-95' : ''}`}
          >
            <div>
              <p className={`text-lg sm:text-2xl font-bold tracking-tight ${accent}`}>{value}</p>
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
            <div className="w-6 h-6 rounded-lg bg-yellow-400/10 flex items-center justify-center">
              <FaCrown className="text-yellow-400" size={12} />
            </div>
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

          // TEST OVERRIDE: Treat the first unlocked badge as LEGEND for testing animations
          const isTestLegend = isUnlocked && ach.name === "New Recruit";
          const currentTier = isTestLegend ? "LEGEND" : ach.tier;

          const style = TIER_STYLES[currentTier as keyof typeof TIER_STYLES] || TIER_STYLES.BRONZE;
          const unlockData = myAchievements.find((ma: any) => ma.achievement.key === ach.key);
          const isSecret = ach.secret && !isUnlocked;
          const isSelected = selectedId === ach.id;

          // Rarity calculation
          const unlockCount = ach._count?.userAchievements || 0;
          const rarityPercent = Math.round((unlockCount / (totalUsers || 1)) * 100);
          const isRare = rarityPercent <= 15;

          // Progressive Badge Logic (Mock for specific categories)
          const isProgressive = !isUnlocked && !isSecret && (ach.category === "found" || ach.category === "claim" || ach.category === "points");
          const progress = isProgressive ? (ach.category === "found" ? 40 : ach.category === "claim" ? 60 : 25) : 0;

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

                  {/* Progressive Bar - New Feature */}
                  {isProgressive && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-blue-500/40 transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}

                  {/* Rarity Indicator */}
                  {!isSecret && (
                    <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[5px] sm:text-[6px] font-black uppercase tracking-tighter transition-all duration-500
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
                  {isUnlocked && (
                    <div className="mt-2 sm:mt-3 space-y-0.5 sm:space-y-1">
                      <p className="text-[6px] sm:text-[8px] text-emerald-400 font-black uppercase">+{ach.xp} XP</p>
                      {unlockData && (
                        <p className="text-[7px] text-gray-500 font-bold uppercase">
                          {new Date(unlockData.unlockedAt).toLocaleDateString()}
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
