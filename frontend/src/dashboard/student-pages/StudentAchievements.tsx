import React, { useState } from "react";
import { baseApi } from "../../redux/api/baseApi";
import { useUserVerification } from "../../auth/auth";
import { 
  FaTrophy, FaSearch, FaBullseye, FaCheckCircle, 
  FaStar, FaComments, FaBolt, FaClock, FaLock, FaFilter,
  FaMedal
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
  BRONZE:   { border: "border-amber-500/20",   bg: "bg-amber-500/5",   text: "text-amber-500",   glow: "shadow-amber-500/10" },
  SILVER:   { border: "border-gray-400/20",    bg: "bg-gray-400/5",    text: "text-gray-300",    glow: "shadow-gray-400/10" },
  GOLD:     { border: "border-yellow-400/20",  bg: "bg-yellow-400/5",  text: "text-yellow-400",  glow: "shadow-yellow-400/20" },
  PLATINUM: { border: "border-cyan-400/20",    bg: "bg-cyan-400/5",    text: "text-cyan-400",    glow: "shadow-cyan-400/20" },
  LEGEND:   { border: "border-purple-500/20",  bg: "bg-purple-500/5",  text: "text-purple-400",  glow: "shadow-purple-500/30" },
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
  
  const { data: allData, isLoading: loadingAll } = (achievementApi as any).useGetAllAchievementsQuery();
  const { data: myData, isLoading: loadingMy } = (achievementApi as any).useGetMyAchievementsQuery();

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

  const allAchievements = allData?.data || [];
  const myAchievements = myData?.data || [];
  const unlockedKeys = new Set(myAchievements.map((a: any) => a.achievement.key));
  
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
      {/* Stats row - Standard Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: "Badges Earned", value: stats.unlocked, icon: <FaMedal size={11} className="text-blue-400" />, bg: "bg-blue-500/10", accent: "text-white" },
          { label: "Total Badges",  value: stats.total,    icon: <FaTrophy size={11} className="text-yellow-400" />, bg: "bg-yellow-500/10", accent: "text-yellow-400" },
          { label: "Bonus XP",      value: stats.points,   icon: <FaStar size={11} className="text-emerald-400" />, bg: "bg-emerald-500/10", accent: "text-emerald-400" },
          { label: "Completion",    value: `${stats.percent}%`, icon: <FaBolt size={11} className="text-purple-400" />, bg: "bg-purple-500/10", accent: "text-purple-400" },
        ].map(({ label, value, icon, bg, accent }) => (
          <div key={label} className="bg-gray-900 border border-white/5 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex items-center justify-between">
            <div>
              <p className={`text-lg sm:text-2xl font-bold tracking-tight ${accent}`}>{value}</p>
              <p className="text-gray-500 text-[8px] sm:text-[10px] uppercase tracking-widest mt-0.5 font-bold">{label}</p>
            </div>
            <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center ${bg}`}>{icon}</div>
          </div>
        ))}
      </div>

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
          const style = TIER_STYLES[ach.tier as keyof typeof TIER_STYLES] || TIER_STYLES.BRONZE;
          const unlockData = myAchievements.find((ma: any) => ma.achievement.key === ach.key);
          const isSecret = ach.secret && !isUnlocked;

          return (
            <div 
              key={ach.id}
              className={`group relative aspect-square rounded-xl sm:rounded-2xl p-0.5 transition-all duration-300
                ${isUnlocked ? "hover:scale-[1.02]" : "grayscale opacity-50"}`}
            >
              <div className={`h-full w-full rounded-[0.7rem] sm:rounded-[0.9rem] border flex flex-col items-center justify-center p-2 sm:p-3 text-center relative overflow-hidden transition-colors
                ${isUnlocked 
                  ? `bg-gray-900 ${style.border}` 
                  : "bg-gray-900/40 border-white/5"}`}
              >
                {/* Badge Icon */}
                <div className="text-xl sm:text-3xl mb-1 sm:mb-2 transition-transform duration-500 group-hover:scale-110 drop-shadow-sm">
                  {isSecret ? <FaLock size={14} className="text-gray-700" /> : ach.icon}
                </div>

                {/* Badge Name */}
                <h3 className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest leading-tight
                  ${isUnlocked ? style.text : "text-gray-600"}`}>
                  {isSecret ? "???" : ach.name}
                </h3>

                {/* Tier Label */}
                {!isSecret && (
                  <span className={`mt-1.5 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border
                    ${isUnlocked ? `${style.bg} ${style.border} ${style.text}` : "bg-white/5 border-white/5 text-gray-700"}`}>
                    {ach.tier}
                  </span>
                )}

                {/* Info Overlay on Hover */}
                <div className="absolute inset-0 bg-gray-950/95 flex flex-col items-center justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                   <p className="text-[10px] text-gray-300 font-bold leading-relaxed">
                     {isSecret ? "Unlock this secret achievement to reveal its details." : ach.description}
                   </p>
                   {isUnlocked && (
                     <div className="mt-3 space-y-1">
                        <p className="text-[8px] text-emerald-400 font-black uppercase">+{ach.xp} XP Earned</p>
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
