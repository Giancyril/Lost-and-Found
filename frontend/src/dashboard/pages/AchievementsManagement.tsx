import React, { useState } from "react";
import { baseApi } from "../../redux/api/baseApi";
import { 
  FaTrophy, FaUsers, FaChartBar, FaSearch,
  FaMedal, FaCrown, FaStar, FaBoxOpen, FaClipboardList,
  FaChevronDown
} from "react-icons/fa";

const achievementApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getAdminAchievements: b.query({ 
      query: () => ({ url: "/admin/achievements", method: "GET" }),
      providesTags: ["achievements", "users"],
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

const TIER_COLORS: Record<string, string> = {
  BRONZE:   "text-amber-500",
  SILVER:   "text-gray-400",
  GOLD:     "text-yellow-400",
  PLATINUM: "text-cyan-400",
  LEGEND:   "text-purple-400",
};

const AchievementsManagement: React.FC = () => {
  const [search, setSearch] = useState("");
  const { data, isLoading } = (achievementApi as any).useGetAdminAchievementsQuery();

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-900 border border-white/5 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
           <div className="lg:col-span-1 h-[400px] bg-gray-900 border border-white/5 rounded-2xl" />
           <div className="lg:col-span-2 h-[400px] bg-gray-900 border border-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  const { topEarners, achievementStats } = data?.data || { topEarners: [], achievementStats: [] };

  const totalUnlocks = achievementStats.reduce((sum: number, a: any) => sum + (a._count?.userAchievements || 0), 0);
  const mostPopular = achievementStats.length > 0 ? [...achievementStats].sort((a,b) => b._count.userAchievements - a._count.userAchievements)[0] : null;

  const filteredStats = achievementStats
    .filter((a: any) => 
      a.name.toLowerCase().includes(search.toLowerCase()) || 
      a.category.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a: any, b: any) => (TIER_ORDER[a.tier] || 0) - (TIER_ORDER[b.tier] || 0));

  return (
    <div className="space-y-3 sm:space-y-5 max-w-7xl mx-auto pb-10 px-2 sm:px-0">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: "Total Badges",  value: achievementStats.length, icon: <FaTrophy size={11} className="text-yellow-400" />, bg: "bg-yellow-500/10", accent: "text-yellow-400" },
          { label: "Total Unlocks", value: totalUnlocks,            icon: <FaUsers size={11} className="text-blue-400" />,   bg: "bg-blue-500/10",   accent: "text-blue-400"   },
          { label: "Top Contributors", value: topEarners.length,    icon: <FaCrown size={11} className="text-purple-400" />, bg: "bg-purple-500/10", accent: "text-purple-400" },
          { label: "Most Popular",  value: mostPopular?.icon || "—", icon: <FaStar size={11} className="text-emerald-400" />, bg: "bg-emerald-500/10", accent: "text-emerald-400" },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-5">
        {/* Left Column: Top Earners Table */}
        <div className="lg:col-span-1 space-y-3 sm:space-y-5">
          <div className="bg-gray-900 border border-white/5 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl">
            <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaCrown size={10} className="text-yellow-400" />
                <h2 className="text-[8px] sm:text-[10px] font-black text-white uppercase tracking-widest">Global Top Earners</h2>
              </div>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {topEarners.map((user: any, index: number) => (
                <div key={user.id} className="p-4 flex items-center gap-4 hover:bg-white/[0.01] transition-colors">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-800 border border-white/5">
                      {user.userImg ? (
                        <img src={user.userImg} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-black text-gray-600">
                          {user.name?.[0] || user.username?.[0]}
                        </div>
                      )}
                    </div>
                    {index < 3 && (
                      <div className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-black text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg border-2 border-gray-900">
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{user.name || user.username}</p>
                    <p className="text-[9px] text-gray-500 font-medium truncate">@{user.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-blue-400">{user._count.userAchievements}</p>
                    <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Badges</p>
                  </div>
                </div>
              ))}
              {topEarners.length === 0 && (
                <div className="p-10 text-center text-gray-600 text-xs font-bold uppercase tracking-widest">No data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Badge Stats & Search */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-5">
          {/* Search Box */}
          <div className="bg-gray-900 border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4">
             <div className="relative group">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-400 transition-colors" size={10} />
                <input 
                  type="text" placeholder="Search statistics..." 
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 sm:py-2.5 bg-gray-800/80 border border-white/10 rounded-xl sm:rounded-2xl text-white text-xs sm:text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
             </div>
          </div>

          {/* Badge List */}
          <div className="bg-gray-900 border border-white/5 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl">
            <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaChartBar size={10} className="text-blue-400" />
                <h2 className="text-[8px] sm:text-[10px] font-black text-white uppercase tracking-widest">Badge Distribution Statistics</h2>
              </div>
            </div>
            
            <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 max-h-[600px] overflow-y-auto custom-scrollbar">
              {filteredStats.map((ach: any) => (
                <AchievementStatCard key={ach.id} ach={ach} />
              ))}
              {filteredStats.length === 0 && (
                <div className="col-span-full py-20 text-center text-gray-700 font-bold uppercase tracking-widest text-xs">
                   No badges found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AchievementStatCard = ({ ach }: { ach: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`p-3 bg-white/[0.02] border rounded-xl transition-all duration-300 group
      ${isExpanded ? "border-blue-500/30 bg-white/[0.04] ring-1 ring-blue-500/10" : "border-white/[0.05] hover:border-white/10 hover:bg-white/[0.03]"}`}>
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="text-2xl grayscale group-hover:grayscale-0 transition-all filter drop-shadow-sm shrink-0">
          {ach.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-[10px] font-black text-white uppercase tracking-widest truncate">{ach.name}</h3>
            <div className="flex items-center gap-2">
              <span className={`text-[8px] font-black uppercase shrink-0 ${TIER_COLORS[ach.tier] || "text-gray-500"}`}>
                {ach.tier}
              </span>
              <FaChevronDown size={8} className={`text-gray-600 transition-transform duration-300 ${isExpanded ? "rotate-180 text-blue-400" : ""}`} />
            </div>
          </div>
          
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500/40 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, (ach._count.userAchievements / 50) * 100)}%` }}
              />
            </div>
            <span className="text-[9px] font-black text-gray-500 whitespace-nowrap">
              {ach._count.userAchievements} <span className="text-[7px]">EARNED</span>
            </span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-white/5 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="space-y-2">
            <div>
              <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Description</p>
              <p className="text-[10px] text-gray-300 leading-relaxed italic">"{ach.description}"</p>
            </div>
            <div className="flex items-center gap-4 pt-1">
              <div>
                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Category</p>
                <p className="text-[9px] text-blue-400 font-black uppercase">{ach.category}</p>
              </div>
              <div>
                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Reward</p>
                <p className="text-[9px] text-emerald-400 font-black uppercase">+{ach.xp} XP</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementsManagement;
