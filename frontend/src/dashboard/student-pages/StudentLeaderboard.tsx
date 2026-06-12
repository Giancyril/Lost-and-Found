import { useState } from "react";
import { useUserVerification } from "../../auth/auth";
import { FaTrophy, FaMedal, FaStar, FaSearch, FaFire, FaClock, FaCalendarAlt, FaInfinity } from "react-icons/fa";
import { useGetLeaderboardQuery, useGetMyPointsQuery, useGetMyRankQuery } from "../../redux/api/api";

// ── Leaderboard period tabs ───────────────────────────────────────────────────
type LeaderboardType = "alltime" | "weekly" | "monthly";
const PERIOD_TABS: { id: LeaderboardType; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "alltime", label: "All Time", icon: <FaInfinity size={11} />, desc: "Total points earned since joining" },
  { id: "weekly", label: "This Week", icon: <FaClock size={11} />, desc: "Points earned in the past 7 days" },
  { id: "monthly", label: "This Month", icon: <FaCalendarAlt size={11} />, desc: "Points earned this calendar month" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const medalLabel = (i: number) =>
  i === 0 ? "🥇 1st Place" : i === 1 ? "🥈 2nd Place" : i === 2 ? "🥉 3rd Place" : null;

const rankColor = (i: number) =>
  i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-500" : "text-gray-600";

const rankBg = (i: number, isMe: boolean) => {
  if (isMe) return "bg-blue-500/10 border-blue-500/25";
  if (i < 3) return "bg-gray-900 border-white/[0.06]";
  return "bg-gray-900 border-white/[0.05]";
};

// ── Delta badge — shows ▲3 / ▼1 / — ──────────────────────────────────────────
const DeltaBadge = ({ delta }: { delta: number | null }) => {
  if (delta === null) return null;
  if (delta === 0) return (
    <span className="text-[9px] font-black text-gray-600 bg-gray-800 border border-white/5 px-1.5 py-0.5 rounded-full">
      —
    </span>
  );
  const up = delta > 0;
  return (
    <span
      className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border flex items-center gap-0.5 ${up
          ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          : "text-red-400 bg-red-500/10 border-red-500/20"
        }`}
    >
      {up ? "▲" : "▼"}
      {Math.abs(delta)}
    </span>
  );
};

// ── Personal rank card (shown even when outside top 50) ───────────────────────
const PersonalRankCard = ({ rankData, myPoints, board }: {
  rankData: any; myPoints: number; board: any[];
}) => {
  if (!rankData) return null;

  const { rank, delta, rankSnapshot } = rankData;
  const isInTop50 = rank <= board.length;

  const pointsToNext = (() => {
    if (rank <= 1) return null;
    const personAhead = board[rank - 2]; // rank is 1-based, array is 0-based
    if (!personAhead) return null;
    return personAhead.totalPoints - myPoints;
  })();

  return (
    <div className="bg-blue-500/[0.06] border border-blue-500/20 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <FaTrophy size={14} className="text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-white font-black text-sm leading-none">#{rank}</p>
              <DeltaBadge delta={delta} />
              {!isInTop50 && (
                <span className="text-[9px] font-bold text-gray-500 bg-gray-800 border border-white/5 px-1.5 py-0.5 rounded-full">
                  outside top 50
                </span>
              )}
            </div>
            <p className="text-gray-500 text-[11px] mt-1">
              <span className="text-yellow-400 font-bold">{myPoints.toLocaleString()} pts</span>
              {pointsToNext != null && pointsToNext > 0 && (
                <span className="ml-1">· {pointsToNext} pts to reach #{rank - 1}</span>
              )}
            </p>
          </div>
        </div>
        {rankSnapshot != null && delta !== null && (
          <div className="text-right shrink-0">
            <p className="text-[10px] text-gray-600 font-medium">since yesterday</p>
            {delta === 0 && <p className="text-gray-500 text-xs font-bold">No change</p>}
            {delta > 0 && <p className="text-emerald-400 text-xs font-black">↑ {delta} places</p>}
            {delta < 0 && <p className="text-red-400 text-xs font-black">↓ {Math.abs(delta)} places</p>}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
export default function StudentLeaderboard() {
  const user: any = useUserVerification();
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<LeaderboardType>("alltime");

  const isLoggedIn = !!user?.id;
  const { data: boardData, isLoading: lbLoading } = useGetLeaderboardQuery(period);
  const { data: pointsData, isLoading: ptsLoading } = useGetMyPointsQuery(undefined, { skip: !isLoggedIn });
  const { data: rankData } = useGetMyRankQuery(undefined, { skip: !isLoggedIn });

  const loading = lbLoading || ptsLoading;
  const board: any[] = boardData?.data ?? [];
  const myPoints: number = pointsData?.data?.totalPoints ?? 0;
  const myRankInfo: any = rankData?.data ?? null;
  const myId: string | undefined = user?.id ?? user?.userId ?? user?.sub;

  // Use the accurate server-side rank instead of a findIndex that caps at 50
  const myRank: number = myRankInfo?.rank ?? 0;

  const filtered = board.filter((u: any) =>
    (u.name || "").toLowerCase().includes(search.toLowerCase())
  );

  // Compute delta for each board entry from their stored rankSnapshot
  const getDelta = (u: any, currentIdx: number): number | null => {
    if (u.rankSnapshot == null) return null;
    return u.rankSnapshot - (currentIdx + 1); // positive = moved up
  };

  const activePeriodTab = PERIOD_TABS.find(t => t.id === period)!;

  return (
    <div className="space-y-5 max-w-7xl mx-auto overflow-x-hidden">
      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Your Points", value: myPoints.toLocaleString(), icon: <FaStar size={14} className="text-yellow-400" />, accent: "bg-yellow-500/5", color: "text-yellow-400" },
          { label: "Your Rank", value: myRank > 0 ? `#${myRank}` : "—", icon: <FaTrophy size={14} className="text-cyan-400" />, accent: "bg-cyan-500/5", color: "text-cyan-400" },
          { label: "Total Ranked", value: board.length, icon: <FaMedal size={14} className="text-violet-400" />, accent: "bg-violet-500/5", color: "text-violet-400" },
        ].map(({ label, value, icon, accent, color }) => (
          <div key={label} className="relative bg-gray-900 border border-white/5 rounded-2xl p-3 flex flex-col gap-2 overflow-hidden">
            <div className={`absolute inset-0 opacity-30 ${accent} blur-3xl scale-150 pointer-events-none`} />
            <div className="relative">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent}`}>
                {icon}
              </div>
            </div>
            <div className="relative">
              <p className={`text-xl font-bold tracking-tight ${color}`}>{value}</p>
              <p className="text-gray-500 text-[11px] mt-0.5 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Period tabs ── */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-1.5 flex gap-1">
        {PERIOD_TABS.map(tab => {
          const active = tab.id === period;
          return (
            <button
              key={tab.id}
              onClick={() => { setPeriod(tab.id); setSearch(""); }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all select-none ${active
                  ? "bg-blue-500/15 text-blue-300 border border-blue-500/25 shadow-sm"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] border border-transparent"
                }`}
            >
              <span className={active ? "text-blue-400" : "text-gray-600"}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Personal rank card ── */}
      {!loading && myRank > 0 && (
        <PersonalRankCard rankData={myRankInfo} myPoints={myPoints} board={board} />
      )}

      {/* ── Not yet on board ── */}
      {!loading && myRank === 0 && myPoints === 0 && (
        <div className="bg-gray-900 border border-white/5 rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <FaTrophy size={14} className="text-blue-400" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">You're not on the leaderboard yet</p>
            <p className="text-gray-500 text-xs mt-0.5">Report a found item to earn 50 points and get ranked!</p>
          </div>
        </div>
      )}

      {/* ── Search ── */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-4">
        <div className="relative">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
          <input
            type="text" placeholder={`Search students — ${activePeriodTab.desc}`} value={search}
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
          <p className="text-gray-500 text-sm mt-1">Be the first to earn points!</p>
        </div>
      ) : (
        <>
          {/* ── Desktop table ── */}
          <div className="hidden md:block bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-600 font-semibold">
              <div className="col-span-1">Rank</div>
              <div className="col-span-5">Student</div>
              <div className="col-span-2">Change</div>
              <div className="col-span-2">Streak</div>
              <div className="col-span-2 text-right">Points</div>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {filtered.map((u: any, i: number) => {
                const realIdx = board.findIndex((b: any) => b.id === u.id);
                const isMe = u.id === myId;
                const delta = getDelta(u, realIdx);

                return (
                  <div
                    key={u.id ?? i}
                    className={`grid grid-cols-12 gap-4 items-center px-5 py-3.5 transition-colors ${isMe ? "bg-blue-500/5" : "hover:bg-white/[0.02]"
                      }`}
                  >
                    {/* Rank number */}
                    <div className="col-span-1 flex items-center gap-1.5">
                      <div className={`font-black text-sm ${rankColor(realIdx)}`}>
                        {realIdx < 3
                          ? <FaMedal size={16} />
                          : <span className="text-xs">#{realIdx + 1}</span>
                        }
                      </div>
                    </div>

                    {/* Name */}
                    <div className="col-span-5 flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className={`font-bold text-sm truncate ${isMe ? "text-blue-300" : "text-white"}`}>
                          {isMe ? `${u.name || "You"} (You)` : (u.name || "Student")}
                        </p>
                        {u.schoolId && (
                          <p className="text-gray-600 text-[10px] font-mono">{u.schoolId}</p>
                        )}
                        {medalLabel(realIdx) && (
                          <p className={`text-[10px] font-semibold ${rankColor(realIdx)}`}>
                            {medalLabel(realIdx)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Delta badge */}
                    <div className="col-span-2">
                      <DeltaBadge delta={delta} />
                    </div>

                    {/* Login streak */}
                    <div className="col-span-2">
                      {u.loginStreak >= 3 ? (
                        <div className="flex items-center gap-1">
                          <FaFire size={10} className="text-orange-400" />
                          <span className="text-orange-400 text-xs font-black">{u.loginStreak}</span>
                          <span className="text-gray-600 text-[10px]">day streak</span>
                        </div>
                      ) : (
                        <span className="text-gray-700 text-[10px]">—</span>
                      )}
                    </div>

                    {/* Points */}
                    <div className="col-span-2 flex items-center justify-end gap-1.5">
                      <FaStar size={11} className="text-yellow-400" />
                      <span className="text-yellow-400 font-black text-sm">{u.totalPoints.toLocaleString()}</span>
                      <span className="text-gray-600 text-xs">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Mobile cards ── */}
          <div className="md:hidden space-y-2">
            {filtered.map((u: any) => {
              const realIdx = board.findIndex((b: any) => b.id === u.id);
              const isMe = u.id === myId;
              const delta = getDelta(u, realIdx);

              return (
                <div
                  key={u.id ?? realIdx}
                  className={`flex items-center gap-2.5 rounded-2xl px-3 py-2.5 border transition-colors ${rankBg(realIdx, isMe)}`}
                >
                  {/* Rank */}
                  <div className={`w-6 text-center font-black shrink-0 ${rankColor(realIdx)}`}>
                    {realIdx < 3
                      ? <FaMedal size={15} className="mx-auto" />
                      : <span className="text-[11px]">#{realIdx + 1}</span>
                    }
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-bold truncate leading-tight text-white">
                        {u.name || "Student"}
                        {isMe && <span className="text-blue-400"> (You)</span>}
                      </p>
                      <DeltaBadge delta={delta} />
                    </div>
                    {medalLabel(realIdx) && (
                      <p className={`text-[10px] font-semibold leading-tight ${rankColor(realIdx)}`}>
                        {medalLabel(realIdx)}
                      </p>
                    )}
                    {u.loginStreak >= 3 && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <FaFire size={9} className="text-orange-400" />
                        <span className="text-orange-400 text-[10px] font-bold">{u.loginStreak}d</span>
                      </div>
                    )}
                  </div>

                  {/* Points */}
                  <div className="flex items-center gap-1 shrink-0">
                    <FaStar size={10} className="text-yellow-400" />
                    <span className="text-yellow-400 font-black text-xs">{u.totalPoints.toLocaleString()}</span>
                    <span className="text-gray-600 text-[10px]">pts</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Personal rank card when outside top 50 ── */}
          {!loading && myRank > 50 && myRankInfo && (
            <div className="bg-gray-900 border border-blue-500/15 rounded-2xl p-4">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-3">Your position</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <span className="text-blue-400 font-black text-xs">#{myRank}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-bold text-sm truncate">{user?.name || "You"} (You)</p>
                    <DeltaBadge delta={myRankInfo.delta} />
                  </div>
                  <p className="text-gray-500 text-[11px]">
                    <span className="text-yellow-400 font-bold">{myPoints.toLocaleString()} pts</span>
                    {myRankInfo.delta !== null && myRankInfo.delta > 0 && (
                      <span className="text-emerald-400 ml-1">· moved up {myRankInfo.delta} today</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <FaStar size={11} className="text-yellow-400" />
                  <span className="text-yellow-400 font-black text-sm">{myPoints.toLocaleString()}</span>
                  <span className="text-gray-600 text-xs">pts</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}