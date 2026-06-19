import { useState } from "react";
import {
  FaTrophy, FaMedal, FaStar, FaSearch,
  FaInfinity, FaClock, FaCalendarAlt, FaBolt, FaUsers, FaChartBar, FaFire
} from "react-icons/fa";
import { useGetLeaderboardQuery } from "../../redux/api/api";
import LeaderboardProfileModal from "../components/LeaderboardProfileModal";

type LeaderboardType = "alltime" | "weekly" | "monthly" | "weighted";

const PERIOD_TABS: { id: LeaderboardType; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "alltime", label: "All Time", icon: <FaInfinity size={10} />, desc: "Total points earned since joining" },
  { id: "weekly", label: "This Week", icon: <FaClock size={10} />, desc: "Points earned in the past 7 days" },
  { id: "monthly", label: "This Month", icon: <FaCalendarAlt size={10} />, desc: "Points earned this calendar month" },
  { id: "weighted", label: "Freshness", icon: <FaBolt size={10} />, desc: "Activity weight based on recency" },
];

const medalLabel = (i: number) =>
  i === 0 ? "🥇 1st Place" : i === 1 ? "🥈 2nd Place" : i === 2 ? "🥉 3rd Place" : null;

const rankColor = (i: number) =>
  i === 0 ? "text-blue-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-blue-600" : "text-gray-600";

const rankBg = (i: number) => {
  if (i === 0) return "bg-blue-500/5 border-blue-500/15";
  if (i === 1) return "bg-blue-500/5 border-blue-500/15";
  if (i === 2) return "bg-blue-500/5 border-blue-500/15";
  return "bg-gray-900 border-white/[0.05]";
};

export default function LeaderboardPage() {
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<LeaderboardType>("alltime");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserRank, setSelectedUserRank] = useState<number>(0);

  const { data: boardData, isLoading: loading } = useGetLeaderboardQuery(period);

  const board: any[] = (boardData?.data ?? []).filter(
    (u: any) => u.role !== "ADMIN" && u.role !== "SUB_ADMIN"
  );

  const getDisplayPoints = (u: any) => {
    if (period === "weighted") return u.weightedScore ?? 0;
    if (period !== "alltime" && u.periodPoints !== undefined) return u.periodPoints;
    return u.totalPoints ?? 0;
  };

  const ptsLabel = period === "weighted" ? "score" : "pts";

  const filtered = board.filter((u: any) =>
    (u.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const topScore = board.length > 0 ? Math.max(...board.map((u: any) => getDisplayPoints(u))) : 0;
  const avgPoints = board.length > 0
    ? Math.round(board.reduce((sum: number, u: any) => sum + getDisplayPoints(u), 0) / board.length)
    : 0;
  const activeStudents = board.filter((u: any) => getDisplayPoints(u) > 0).length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto overflow-x-hidden">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Ranked Students */}
        <div className="relative bg-gray-900 border border-white/5 rounded-2xl p-3 flex flex-col gap-2 overflow-hidden">
          <div className="absolute inset-0 opacity-30 bg-violet-500/5 blur-3xl scale-150 pointer-events-none" />
          <div className="relative">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-violet-500/10">
              <FaUsers size={13} className="text-violet-400" />
            </div>
          </div>
          <div className="relative">
            <p className="text-xl font-bold tracking-tight text-violet-400">{board.length}</p>
            <p className="text-gray-500 text-[11px] mt-0.5 font-medium">Total Ranked</p>
          </div>
        </div>

        {/* Top Score */}
        <div className="relative bg-gray-900 border border-white/5 rounded-2xl p-3 flex flex-col gap-2 overflow-hidden">
          <div className="absolute inset-0 opacity-30 bg-yellow-500/5 blur-3xl scale-150 pointer-events-none" />
          <div className="relative">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-yellow-500/10">
              <FaTrophy size={13} className="text-yellow-400" />
            </div>
          </div>
          <div className="relative">
            <p className="text-xl font-bold tracking-tight text-yellow-400">{topScore.toLocaleString()}</p>
            <p className="text-gray-500 text-[11px] mt-0.5 font-medium">Top Score</p>
          </div>
        </div>

        {/* Avg Points */}
        <div className="relative bg-gray-900 border border-white/5 rounded-2xl p-3 flex flex-col gap-2 overflow-hidden">
          <div className="absolute inset-0 opacity-30 bg-blue-500/5 blur-3xl scale-150 pointer-events-none" />
          <div className="relative">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-500/10">
              <FaChartBar size={13} className="text-blue-400" />
            </div>
          </div>
          <div className="relative">
            <p className="text-xl font-bold tracking-tight text-blue-400">{avgPoints.toLocaleString()}</p>
            <p className="text-gray-500 text-[11px] mt-0.5 font-medium">Avg Points</p>
          </div>
        </div>

        {/* Active Students */}
        <div className="relative bg-gray-900 border border-white/5 rounded-2xl p-3 flex flex-col gap-2 overflow-hidden">
          <div className="absolute inset-0 opacity-30 bg-orange-500/5 blur-3xl scale-150 pointer-events-none" />
          <div className="relative">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-orange-500/10">
              <FaFire size={13} className="text-orange-400" />
            </div>
          </div>
          <div className="relative">
            <p className="text-xl font-bold tracking-tight text-orange-400">{activeStudents}</p>
            <p className="text-gray-500 text-[11px] mt-0.5 font-medium">Active Students</p>
          </div>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex justify-start">
        <div className="inline-flex gap-0.5 bg-gray-800/40 border border-white/10 rounded-xl p-1 w-full">
          {PERIOD_TABS.map(tab => {
            const active = tab.id === period;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setPeriod(tab.id); setSearch(""); }}
                className={`flex-1 whitespace-nowrap px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1 focus:outline-none select-none ${active
                    ? "bg-violet-500/10 text-violet-300"
                    : "text-gray-400 hover:text-white"
                  }`}
                title={tab.desc}
              >
                <span className={active ? "text-violet-400" : "text-gray-500"}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-4">
        <div className="relative">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
          <input
            type="text" placeholder="Search students..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/80 border border-white/10 rounded-2xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-gray-900 border border-white/5 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-gray-900 border border-white/5 rounded-2xl py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/15 flex items-center justify-center mx-auto mb-4">
            <FaTrophy size={22} className="text-yellow-400" />
          </div>
          <p className="text-white font-semibold">No rankings yet</p>
          <p className="text-gray-500 text-sm mt-1">Students will appear here once they earn points.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-600 font-semibold">
              <div className="col-span-1">Rank</div>
              <div className="col-span-6">Student</div>
              <div className="col-span-3">Achievement</div>
              <div className="col-span-2 text-right">{period === "weighted" ? "Score" : "Points"}</div>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {filtered.map((u: any, i: number) => {
                const realIdx = board.findIndex((b: any) => b.id === u.id);
                return (
                  <div key={u.id ?? i}
                    onClick={() => {
                      setSelectedUserId(u.id);
                      setSelectedUserRank(realIdx + 1);
                    }}
                    className="grid grid-cols-12 gap-4 items-center px-5 py-3.5 transition-colors hover:bg-white/[0.04] cursor-pointer"
                  >
                    <div className="col-span-1">
                      <div className={`font-black text-sm ${rankColor(realIdx)}`}>
                        {realIdx < 3
                          ? <FaMedal size={16} />
                          : <span className="text-xs">#{realIdx + 1}</span>
                        }
                      </div>
                    </div>
                    <div className="col-span-6 flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate text-white">
                          {u.name || "Student"}
                        </p>
                        {u.schoolId && <p className="text-gray-600 text-[10px] font-mono">{u.schoolId}</p>}
                      </div>
                    </div>
                    <div className="col-span-3 flex items-center gap-1.5 min-h-[24px]">
                      {u.userAchievements && u.userAchievements.length > 0 ? (
                        u.userAchievements.map((ua: any) => (
                          <span
                            key={ua.id}
                            title={`${ua.achievement?.name}: ${ua.achievement?.description}`}
                            className="text-base cursor-help"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {ua.achievement?.icon}
                          </span>
                        ))
                      ) : medalLabel(realIdx) ? (
                        <span className={`text-xs font-semibold ${rankColor(realIdx)}`}>
                          {medalLabel(realIdx)}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-1.5">
                      <FaStar size={11} className="text-blue-400" />
                      <span className="text-blue-400 font-black text-sm">{getDisplayPoints(u)}</span>
                      <span className="text-gray-600 text-xs">{ptsLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filtered.map((u: any) => {
              const realIdx = board.findIndex((b: any) => b.id === u.id);
              return (
                <div key={u.id ?? realIdx}
                  onClick={() => {
                    setSelectedUserId(u.id);
                    setSelectedUserRank(realIdx + 1);
                  }}
                  className={`flex items-center gap-2.5 rounded-2xl px-3 py-2.5 border transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${rankBg(realIdx)}`}
                >

                  <div className={`w-6 text-center font-black shrink-0 ${rankColor(realIdx)}`}>
                    {realIdx < 3
                      ? <FaMedal size={15} className="mx-auto" />
                      : <span className="text-[11px]">#{realIdx + 1}</span>
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-bold truncate leading-tight text-white">
                        {u.name || "Student"}
                      </p>
                      <div className="flex items-center gap-0.5">
                        {u.userAchievements?.map((ua: any) => (
                          <span
                            key={ua.id}
                            title={`${ua.achievement?.name}: ${ua.achievement?.description}`}
                            className="text-xs"
                          >
                            {ua.achievement?.icon}
                          </span>
                        ))}
                      </div>
                    </div>
                    {medalLabel(realIdx) && (
                      <p className={`text-[10px] font-semibold leading-tight ${rankColor(realIdx)} mt-0.5`}>
                        {medalLabel(realIdx)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <FaStar size={10} className="text-blue-400" />
                    <span className="text-blue-400 font-black text-xs">{getDisplayPoints(u)}</span>
                    <span className="text-gray-600 text-[10px]">{ptsLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {selectedUserId && (
        <LeaderboardProfileModal
          userId={selectedUserId}
          rank={selectedUserRank}
          onClose={() => {
            setSelectedUserId(null);
            setSelectedUserRank(0);
          }}
        />
      )}
    </div>
  );
}
