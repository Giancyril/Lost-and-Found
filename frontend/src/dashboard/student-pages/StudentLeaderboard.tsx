import { useState } from "react";
import { useUserVerification } from "../../auth/auth";
import { FaTrophy, FaMedal, FaStar, FaSearch, FaFire, FaClock, FaCalendarAlt, FaInfinity, FaChevronUp, FaChevronDown, FaMinus } from "react-icons/fa";
import { useGetLeaderboardQuery, useGetMyPointsQuery, useGetMyRankQuery } from "../../redux/api/api";

type LeaderboardType = "alltime" | "weekly" | "monthly";

const PERIOD_TABS: { id: LeaderboardType; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "alltime", label: "All Time", icon: <FaInfinity size={10} />, desc: "Total points earned since joining" },
  { id: "weekly", label: "This Week", icon: <FaClock size={10} />, desc: "Points earned in the past 7 days" },
  { id: "monthly", label: "This Month", icon: <FaCalendarAlt size={10} />, desc: "Points earned this calendar month" },
];

const medalLabel = (i: number) =>
  i === 0 ? "1st Place" : i === 1 ? "2nd Place" : i === 2 ? "3rd Place" : null;

const RANK_COLORS = [
  { text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", glow: "shadow-amber-500/20" },
  { text: "text-slate-300", bg: "bg-slate-300/10", border: "border-slate-300/20", glow: "shadow-slate-400/10" },
  { text: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20", glow: "shadow-orange-500/10" },
];

const getRankStyle = (i: number) => RANK_COLORS[i] ?? { text: "text-slate-500", bg: "bg-slate-800/40", border: "border-slate-700/30", glow: "" };

// ── Delta badge ───────────────────────────────────────────────────────────────
const DeltaBadge = ({ delta }: { delta: number | null }) => {
  if (delta === null) return null;
  if (delta === 0) return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-500 bg-slate-800 border border-slate-700/50 px-1.5 py-0.5 rounded-md">
      <FaMinus size={7} /> —
    </span>
  );
  const up = delta > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${up
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      : "text-rose-400 bg-rose-500/10 border-rose-500/20"}`}>
      {up ? <FaChevronUp size={7} /> : <FaChevronDown size={7} />}
      {Math.abs(delta)}
    </span>
  );
};

// ── Top 3 podium card ─────────────────────────────────────────────────────────
const PodiumCard = ({ user, index, isMe, period }: { user: any; index: number; isMe: boolean; period: LeaderboardType }) => {
  const style = getRankStyle(index);
  const medals = ["🥇", "🥈", "🥉"];
  const heights = ["h-28", "h-20", "h-16"];
  const order = [1, 0, 2]; // visual order: 2nd, 1st, 3rd
  const visualPos = order.indexOf(index);
  const displayPoints = period !== "alltime" && user.periodPoints != null ? user.periodPoints : user.totalPoints;

  return (
    <div className={`flex flex-col items-center gap-2 ${visualPos === 1 ? "mb-0" : "mt-8"}`}>
      {/* Avatar */}
      <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2 shadow-lg ${style.border} ${style.bg} ${style.glow} ${isMe ? "ring-2 ring-indigo-400/40 ring-offset-1 ring-offset-slate-900" : ""}`}>
        {medals[index]}
        {isMe && <span className="absolute -top-1.5 -right-1.5 text-[8px] font-black bg-indigo-500 text-white rounded-full px-1 py-0.5 leading-none">YOU</span>}
      </div>
      {/* Name */}
      <div className="text-center max-w-[80px]">
        <p className={`text-xs font-bold truncate ${isMe ? "text-indigo-300" : "text-slate-200"}`}>
          {user.name || "Student"}
        </p>
        <p className={`text-sm font-black ${style.text}`}>{displayPoints.toLocaleString()}</p>
        <p className="text-[9px] text-slate-600 font-medium">pts</p>
      </div>
      {/* Podium bar */}
      <div className={`w-20 ${heights[index]} rounded-t-xl border-t border-x flex items-start justify-center pt-2 ${style.bg} ${style.border}`}>
        <span className={`text-xs font-black ${style.text}`}>#{index + 1}</span>
      </div>
    </div>
  );
};

// ── Personal rank card ────────────────────────────────────────────────────────
const PersonalRankCard = ({ rankData, myPoints, board }: { rankData: any; myPoints: number; board: any[] }) => {
  if (!rankData) return null;
  const { rank, delta } = rankData;
  const isInTop50 = rank <= board.length;
  const pointsToNext = (() => {
    if (rank <= 1) return null;
    const personAhead = board[rank - 2];
    if (!personAhead) return null;
    return personAhead.totalPoints - myPoints;
  })();

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-700/60 border border-slate-600/40 flex items-center justify-center shrink-0">
            <FaTrophy size={14} className="text-slate-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-black text-base leading-none">#{rank}</span>
              <DeltaBadge delta={delta} />
              {!isInTop50 && (
                <span className="text-[9px] font-semibold text-slate-500 bg-slate-800/80 border border-slate-700/40 px-1.5 py-0.5 rounded-md">
                  outside top 50
                </span>
              )}
            </div>
            <p className="text-slate-500 text-[11px] mt-1">
              <span className="text-amber-400 font-bold">{myPoints.toLocaleString()} pts</span>
              {pointsToNext != null && pointsToNext > 0 && (
                <span className="ml-1.5 text-slate-500">· {pointsToNext.toLocaleString()} pts to reach #{rank - 1}</span>
              )}
            </p>
          </div>
        </div>
        {delta !== null && (
          <div className="text-right shrink-0">
            <p className="text-[10px] text-slate-600 font-medium mb-0.5">since yesterday</p>
            {delta === 0 && <p className="text-slate-500 text-xs font-semibold">No change</p>}
            {delta > 0 && <p className="text-emerald-400 text-xs font-black">↑ {delta} places</p>}
            {delta < 0 && <p className="text-rose-400 text-xs font-black">↓ {Math.abs(delta)} places</p>}
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
  const board: any[] = (boardData?.data ?? []).filter((u: any) => u.role !== "ADMIN" && u.role !== "SUB_ADMIN");
  const myPoints: number = pointsData?.data?.totalPoints ?? 0;
  const myRankInfo: any = rankData?.data ?? null;
  const myId: string | undefined = user?.id ?? user?.userId ?? user?.sub;
  const myRank: number = myRankInfo?.rank ?? 0;

  const filtered = board.filter((u: any) =>
    (u.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const getDelta = (u: any, currentIdx: number): number | null => {
    if (u.rankSnapshot == null) return null;
    return u.rankSnapshot - (currentIdx + 1);
  };

  const activePeriodTab = PERIOD_TABS.find(t => t.id === period)!;
  const top3 = board.slice(0, 3);
  const restFiltered = filtered.filter((_, i) => i >= 3);
  const showTop3 = !search && board.length >= 3;

  return (
    <div className="space-y-5 max-w-7xl mx-auto overflow-x-hidden">

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          {
            label: "Your Points",
            value: myPoints.toLocaleString(),
            icon: <FaStar size={11} className="text-amber-400" />,
            bg: "bg-amber-500/10",
            accent: "text-amber-400",
          },
          {
            label: "Your Rank",
            value: myRank > 0 ? `#${myRank}` : "—",
            icon: <FaTrophy size={11} className="text-indigo-400" />,
            bg: "bg-indigo-500/10",
            accent: "text-indigo-400",
          },
          {
            label: "Total Ranked",
            value: board.length,
            icon: <FaMedal size={11} className="text-violet-400" />,
            bg: "bg-violet-500/10",
            accent: "text-violet-400",
          },
        ].map(({ label, value, icon, bg, accent }) => (
          <div
            key={label}
            className="bg-gray-900 border border-white/5 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex items-center justify-between transition-all relative overflow-hidden"
          >
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

      {/* ── Period label ── */}
      {period !== "alltime" && (
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Showing <span className="text-indigo-400">{period === "weekly" ? "This Week's" : "This Month's"}</span> points
        </p>
      )}

      {/* ── Period tabs ── */}
      <div className="flex gap-1.5 bg-slate-900 border border-slate-800 rounded-2xl p-1.5">
        {PERIOD_TABS.map(tab => {
          const active = tab.id === period;
          return (
            <button
              key={tab.id}
              onClick={() => { setPeriod(tab.id); setSearch(""); }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all select-none ${active
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/50"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"}`}
            >
              <span className={active ? "text-indigo-200" : "text-slate-600"}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Personal rank card ── */}
      {!loading && myRank > 0 && (
        <PersonalRankCard rankData={myRankInfo} myPoints={myPoints} board={board} />
      )}

      {/* ── Not ranked yet ── */}
      {!loading && myRank === 0 && myPoints === 0 && (
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <FaTrophy size={14} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">You're not ranked yet</p>
            <p className="text-slate-500 text-xs mt-0.5">Report a found item to earn 50 points and claim your spot!</p>
          </div>
        </div>
      )}

      {/* ── Podium (top 3) ── */}
      {!loading && showTop3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-5">Top Performers</p>
          <div className="flex items-end justify-center gap-3">
            {/* Visual order: 2nd, 1st, 3rd */}
            {[top3[1], top3[0], top3[2]].map((u, visualIdx) => {
              if (!u) return <div key={visualIdx} className="w-20" />;
              const realIdx = board.findIndex((b: any) => b.id === u.id);
              return (
                <PodiumCard
                  key={u.id}
                  user={u}
                  index={realIdx}
                  isMe={u.id === myId}
                  period={period}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ── Search ── */}
      <div className="bg-gray-900 border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4">
        <div className="relative w-full">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={10} />
          <input
            type="text"
            placeholder="Search students…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 sm:py-2.5 bg-gray-800/80 border border-white/10 rounded-xl sm:rounded-2xl text-white text-xs sm:text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-14 bg-slate-900 border border-slate-800 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center mx-auto mb-4">
            <FaTrophy size={22} className="text-amber-400" />
          </div>
          <p className="text-white font-semibold">No rankings yet</p>
          <p className="text-slate-500 text-sm mt-1">Be the first to earn points!</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Desktop header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-800 text-[10px] uppercase tracking-widest text-slate-600 font-bold">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5">Student</div>
            <div className="col-span-2">Change</div>
            <div className="col-span-2">Streak</div>
            <div className="col-span-2 text-right">Points</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-800/60">
            {(search ? filtered : filtered).map((u: any, i: number) => {
              const realIdx = board.findIndex((b: any) => b.id === u.id);
              const isMe = u.id === myId;
              const delta = getDelta(u, realIdx);
              const style = getRankStyle(realIdx);
              const isTop3 = realIdx < 3;

              return (
                <div
                  key={u.id ?? i}
                  className={`transition-colors ${isMe
                    ? "bg-indigo-950/30 border-l-2 border-l-indigo-500"
                    : isTop3
                      ? "bg-slate-800/20 hover:bg-slate-800/40"
                      : "hover:bg-slate-800/30"}`}
                >
                  {/* Desktop row */}
                  <div className="hidden md:grid grid-cols-12 gap-4 items-center px-5 py-3.5">
                    <div className="col-span-1 flex items-center">
                      {isTop3 ? (
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${style.bg} border ${style.border}`}>
                          {["🥇", "🥈", "🥉"][realIdx]}
                        </div>
                      ) : (
                        <span className={`text-xs font-bold ${style.text}`}>#{realIdx + 1}</span>
                      )}
                    </div>

                    <div className="col-span-5 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold text-sm truncate ${isMe ? "text-indigo-300" : "text-slate-200"}`}>
                          {u.name || "Student"}
                          {isMe && <span className="ml-1.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded-md">You</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {u.schoolId && <p className="text-slate-600 text-[10px] font-mono">{u.schoolId}</p>}
                        {isTop3 && <p className={`text-[10px] font-semibold ${style.text}`}>{medalLabel(realIdx)}</p>}
                      </div>
                    </div>

                    <div className="col-span-2"><DeltaBadge delta={delta} /></div>

                    <div className="col-span-2">
                      {u.loginStreak >= 3 ? (
                        <div className="flex items-center gap-1">
                          <FaFire size={10} className="text-orange-400" />
                          <span className="text-orange-400 text-xs font-black">{u.loginStreak}</span>
                          <span className="text-slate-600 text-[10px]">days</span>
                        </div>
                      ) : (
                        <span className="text-slate-700 text-[10px]">—</span>
                      )}
                    </div>

                    <div className="col-span-2 flex items-center justify-end gap-1.5">
                      <FaStar size={10} className="text-amber-400" />
                      <span className="text-amber-400 font-black text-sm">{(period !== "alltime" && u.periodPoints != null ? u.periodPoints : u.totalPoints).toLocaleString()}</span>
                      <span className="text-slate-600 text-xs">pts</span>
                    </div>
                  </div>

                  {/* Mobile row */}
                  <div className="md:hidden flex items-center gap-3 px-4 py-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black ${isTop3 ? `${style.bg} border ${style.border}` : "bg-slate-800 border border-slate-700/40"}`}>
                      {isTop3 ? ["🥇", "🥈", "🥉"][realIdx] : <span className={style.text}>#{realIdx + 1}</span>}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className={`text-sm font-semibold truncate ${isMe ? "text-indigo-300" : "text-slate-200"}`}>
                          {u.name || "Student"}
                          {isMe && <span className="text-indigo-400 ml-1 text-xs">(You)</span>}
                        </p>
                        <DeltaBadge delta={delta} />
                      </div>
                      {u.loginStreak >= 3 && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <FaFire size={9} className="text-orange-400" />
                          <span className="text-orange-400 text-[10px] font-bold">{u.loginStreak}d streak</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <FaStar size={10} className="text-amber-400" />
                      <span className="text-amber-400 font-black text-sm">{(period !== "alltime" && u.periodPoints != null ? u.periodPoints : u.totalPoints).toLocaleString()}</span>
                      <span className="text-slate-600 text-[10px]">pts</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Outside top 50 personal card ── */}
      {!loading && myRank > 50 && myRankInfo && (
        <div className="bg-slate-900 border border-indigo-500/20 rounded-2xl p-4">
          <p className="text-slate-600 text-[10px] uppercase tracking-widest font-bold mb-3">Your position</p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <span className="text-indigo-400 font-black text-xs">#{myRank}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-slate-200 font-semibold text-sm truncate">{user?.name || "You"}</p>
                <DeltaBadge delta={myRankInfo.delta} />
              </div>
              <p className="text-slate-500 text-[11px]">
                <span className="text-amber-400 font-bold">{myPoints.toLocaleString()} pts</span>
                {myRankInfo.delta > 0 && (
                  <span className="text-emerald-400 ml-1.5">· moved up {myRankInfo.delta} today</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}