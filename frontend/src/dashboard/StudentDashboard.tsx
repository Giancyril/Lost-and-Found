import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useUserVerification } from "../auth/auth";
import {
  FaTrophy, FaStar, FaBoxOpen, FaClipboardList, FaCheckCircle,
  FaTimesCircle, FaClock, FaMedal, FaSearch, FaArrowRight,
  FaChartLine, FaHistory, FaMapMarkerAlt, FaCalendarAlt,
  FaBolt, FaChevronRight, FaUser, FaHeart, FaSun, FaAward,
} from "react-icons/fa";
 import { MdVerified } from "react-icons/md";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { FaBell } from "react-icons/fa";
import {
  useGetMyPointsQuery,
  useGetMyFoundItemQuery,
  useGetMyLostItemQuery,
  useMyClaimsQuery,
  useGetLeaderboardQuery,
} from "../redux/api/api";
import { baseApi } from "../redux/api/baseApi";

const achievementApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getMyAchievements: b.query({ 
      query: () => ({ url: "/achievements/my", method: "GET" }),
      providesTags: ["achievements"],
    }),
  }),
  overrideExisting: false,
});

const fmt = (d: string) => new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

const STATUS_STYLE: Record<string, { dot: string; text: string; bg: string; border: string }> = {
  APPROVED: { dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  PENDING:  { dot: "bg-yellow-400",  text: "text-yellow-400",  bg: "bg-yellow-400/10",  border: "border-yellow-400/20"  },
  REJECTED: { dot: "bg-red-400",     text: "text-red-400",     bg: "bg-red-400/10",     border: "border-red-400/20"     },
};

const medalColor = (i: number) =>
  i === 0 ? "text-yellow-400 border-yellow-500/40 bg-yellow-500/10"
  : i === 1 ? "text-gray-300 border-gray-500/40 bg-gray-500/10"
  : "text-amber-600 border-amber-700/40 bg-amber-700/10";

type TabKey = "claims" | "found" | "lost" | "points";
const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "claims", label: "Claims",        icon: <FaClipboardList size={11} /> },
  { key: "found",  label: "Found Reports", icon: <FaBoxOpen size={11} /> },
  { key: "lost",   label: "Lost Reports",  icon: <FaSearch size={11} /> },
  { key: "points", label: "Points",        icon: <FaStar size={11} /> },
];

// ── Podium ────────────────────────────────────────────────────────────────────
const Podium = ({ top3, currentUserId }: { top3: any[]; currentUserId: string }) => {
  const order = [top3[1], top3[0], top3[2]]; // 2nd, 1st, 3rd visual order
  const heights = ["h-20", "h-28", "h-16"];
  const labels  = ["2nd", "1st", "3rd"];
  const rings   = [
    "border-gray-400/50 bg-gray-500/10",
    "border-yellow-400/60 bg-yellow-500/10",
    "border-amber-600/50 bg-amber-700/10",
  ];
  const nameColors = ["text-gray-300", "text-yellow-400", "text-amber-500"];
  const blockBgs   = [
    "bg-gray-800/60 border-gray-600/20",
    "bg-yellow-900/20 border-yellow-600/20",
    "bg-amber-900/20 border-amber-700/20",
  ];
  const labelColors = ["text-gray-400", "text-yellow-400", "text-amber-600"];

  return (
    <div className="flex items-end justify-center gap-3 px-4 pt-4 pb-2">
      {order.map((u, vi) => {
        if (!u) return <div key={vi} className="flex-1" />;
        const isMe = u.id === currentUserId;
        return (
          <div key={u.id} className="flex-1 flex flex-col items-center gap-1.5">
            <div className={`w-10 h-10 rounded-full border-2 ${rings[vi]} flex items-center justify-center`}>
              <FaUser size={14} className={nameColors[vi]} />
            </div>
            <p className={`text-[10px] font-bold uppercase tracking-wide text-center truncate w-full px-1 ${nameColors[vi]}`}>
              {isMe ? "You" : (u.name?.split(" ")[0] || "Student")}
            </p>
            <p className={`text-xs font-black ${nameColors[vi]}`}>{u.totalPoints}</p>
            <div className={`w-full ${heights[vi]} rounded-t-xl border ${blockBgs[vi]} flex items-center justify-center`}>
              <span className={`text-xs font-black ${labelColors[vi]}`}>{labels[vi]}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const user: any = useUserVerification();
  const [tab, setTab] = useState<TabKey>("claims");

  const { data: pointsData, isLoading: p1 } = useGetMyPointsQuery(undefined);
  const { data: foundData,  isLoading: p2 } = useGetMyFoundItemQuery(undefined);
  const { data: lostData,   isLoading: p3 } = useGetMyLostItemQuery(undefined);
  const { data: claimsData, isLoading: p4 } = useMyClaimsQuery(undefined);
  const { data: boardData,  isLoading: p5 } = useGetLeaderboardQuery(undefined);
  const { data: achievementData, isLoading: p6 } = (achievementApi as any).useGetMyAchievementsQuery();

  const loading       = p1 || p2 || p3 || p4 || p5 || p6;
  const totalPoints   = pointsData?.data?.totalPoints ?? 0;
  const pointsHistory = pointsData?.data?.history ?? [];
  const foundItems    = foundData?.data  ?? [];
  const lostItems     = lostData?.data   ?? [];
  const claims        = claimsData?.data ?? [];
  const board         = boardData?.data  ?? [];
  const myAchievements = achievementData?.data ?? [];
  const { permission, subscribe, isSupported } = usePushNotifications();

  const myRank         = board.findIndex((u: any) => u.id === user?.id) + 1;
  const approvedClaims = claims.filter((c: any) => c.status === "APPROVED").length;
  const pendingClaims  = claims.filter((c: any) => c.status === "PENDING").length;

  const tabCount: Record<TabKey, number> = {
    claims: claims.length,
    found:  foundItems.length,
    lost:   lostItems.length,
    points: pointsHistory.length,
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading your dashboard…</p>
      </div>
    </div>
  );

  const top3 = board.slice(0, 3);
  const rest = board.slice(3, 10);

   return (
    <div className="space-y-4 sm:space-y-6 text-white max-w-7xl mx-auto">
      
      {/* ── Push Notification Banner ── */}
      {isSupported && permission === "default" && (
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <FaBell size={13} className="text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs sm:text-sm font-bold leading-tight">Stay Updated!</p>
            <p className="text-gray-500 text-[11px] sm:text-xs mt-0.5 leading-relaxed line-clamp-1 sm:line-clamp-none">
              Enable notifications for real-time alerts on item matches and messages.
            </p>
          </div>
          <button
            onClick={subscribe}
            className="shrink-0 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs sm:text-sm font-medium rounded-xl transition-all">
            <span className="sm:hidden">Enable</span>
            <span className="hidden sm:inline">Enable Notifications</span>
          </button>
        </div>
      )}

      {/* ── Profile Card ──────────────────────────────────────────────── */}
      <div className="relative bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Desktop layout */}
        <div className="relative hidden sm:flex items-center gap-5 p-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center border-2 border-gray-700 shadow-lg">
              <FaUser size={32} className="text-white opacity-90" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
              <FaCheckCircle size={10} className="text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-white font-bold text-xl tracking-tight break-words">
                {user?.name || user?.username || "Student"}
              </h1>
              <span className="flex items-center gap-1.5 text-[10px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 px-2.5 py-1 rounded-full font-bold tracking-widest shrink-0">
                <MdVerified size={10} /> VERIFIED STUDENT
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-1">{user?.email}</p>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/5 bg-white/5">
                <FaStar size={11} className="text-yellow-400" />
                <span className="text-white font-bold text-sm">{totalPoints}</span>
                <span className="text-gray-500 text-xs">points</span>
              </div>
              {myRank > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/5 bg-white/5">
                  <FaTrophy size={11} className="text-cyan-400" />
                  <span className="text-white font-bold text-sm">#{myRank}</span>
                  <span className="text-gray-500 text-xs">rank</span>
                </div>
              )}
              <Link to="/dashboard/student/achievements" className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                <FaMedal size={11} className="text-purple-400" />
                <span className="text-white font-bold text-sm">{myAchievements.length}</span>
                <span className="text-gray-500 text-xs">badges</span>
              </Link>
              <Link to="/foundItems?report=true"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-semibold hover:bg-blue-500/10 transition-colors">
                <FaBolt size={9} /> Report items to earn more points
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="relative sm:hidden p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center border-2 border-gray-700">
                <FaUser size={22} className="text-white opacity-90" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                <FaCheckCircle size={8} className="text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-bold text-sm tracking-tight truncate leading-tight">
                {user?.name || user?.username || "Student"}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                <span className="flex items-center gap-1 text-[9px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                  <MdVerified size={8} /> VERIFIED
                </span>
                <p className="text-gray-500 text-[10px] truncate">{user?.email}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/5 bg-white/5">
              <FaStar size={10} className="text-yellow-400" />
              <span className="text-white font-bold text-sm">{totalPoints}</span>
              <span className="text-gray-500 text-xs">points</span>
            </div>
            {myRank > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/5 bg-white/5">
                <FaTrophy size={10} className="text-cyan-400" />
                <span className="text-white font-bold text-sm">#{myRank}</span>
                <span className="text-gray-500 text-xs">rank</span>
              </div>
            )}
            <Link to="/dashboard/student/achievements" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/5 bg-white/5">
              <FaMedal size={10} className="text-purple-400" />
              <span className="text-white font-bold text-sm">{myAchievements.length}</span>
              <span className="text-gray-500 text-xs">badges</span>
            </Link>
            <Link to="/foundItems?report=true"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-400/5 text-emerald-400 text-[10px] font-semibold">
              <FaBolt size={8} /> Report items to earn more points
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Found Items Reported", value: foundItems.length,  icon: <FaBoxOpen size={15} />,     accent: "bg-cyan-400/5",    iconBg: "bg-cyan-400/10 border-cyan-400/20",      iconColor: "text-cyan-400"    },
          { label: "Lost Items Reported",  value: lostItems.length,   icon: <FaSearch size={15} />,      accent: "bg-blue-400/5",    iconBg: "bg-blue-400/10 border-blue-400/20",      iconColor: "text-blue-400"    },
          { label: "Claims Approved",      value: approvedClaims,     icon: <FaCheckCircle size={15} />, accent: "bg-emerald-400/5", iconBg: "bg-emerald-400/10 border-emerald-400/20", iconColor: "text-emerald-400" },
          { label: "Claims Pending",       value: pendingClaims,      icon: <FaClock size={15} />,       accent: "bg-yellow-400/5",  iconBg: "bg-yellow-400/10 border-yellow-400/20",  iconColor: "text-yellow-400"  },
        ].map(({ label, value, icon, accent, iconBg, iconColor }) => (
          <div key={label} className={`relative group bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 hover:border-white/10 transition-all duration-200 overflow-hidden`}>
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${accent} blur-3xl scale-150`} />
            <div className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center ${iconBg} ${iconColor}`}>
              {icon}
            </div>
            <div className="relative">
              <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{value}</p>
              <p className="text-gray-500 text-xs mt-0.5 font-medium leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Activity + Leaderboard ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">

        {/* Activity Panel — 3 cols */}
        <div className="lg:col-span-3 bg-gray-900 border border-white/5 rounded-2xl flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-white/5">
            <div>
              <h3 className="text-white text-sm font-semibold flex items-center gap-2">
                <FaChartLine size={13} className="text-gray-400" /> Activity
              </h3>
              <p className="text-gray-500 text-xs mt-0.5">Your reports and claim history</p>
            </div>

          </div>

          {/* Tabs — 2×2 grid on mobile, single row on sm+ */}
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 px-4 pt-3 pb-3">
            {TABS.map(({ key, label, icon }) => {
              const active = tab === key;
              const count  = tabCount[key];
              return (
                <button key={key} onClick={() => setTab(key)}
                  className={`flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-full text-xs font-semibold transition-all border ${
                    active
                      ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                      : "border-white/5 text-gray-500 hover:text-gray-300 bg-transparent hover:bg-white/5"
                  }`}>
                  <span className={active ? "text-cyan-400" : "text-gray-600"}>{icon}</span>
                  <span className="truncate">{label}</span>
                  {count > 0 && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0 ${
                      active ? "bg-cyan-500 text-white" : "bg-white/[0.07] text-gray-500"
                    }`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="px-3 pb-3 space-y-0.5 max-h-[340px] overflow-y-auto divide-y divide-white/5" style={{ scrollbarWidth: "none" }}>

            {tab === "claims" && (
              claims.length === 0
                ? <Empty label="No claims submitted yet" />
                : claims.map((c: any, i: number) => {
                    const s = STATUS_STYLE[c.status] ?? STATUS_STYLE.PENDING;
                    return (
                      <div key={i} className="flex items-center gap-3 px-3 py-3 hover:bg-white/[0.02] transition-colors group cursor-default">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold shrink-0 ${s.bg} ${s.border} ${s.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                          {c.status.charAt(0) + c.status.slice(1).toLowerCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {c.foundItem?.foundItemName ?? c.lostItem?.lostItemName ?? "Item"}
                          </p>
                          <p className="text-gray-600 text-[10px] mt-0.5">{c.createdAt ? fmt(c.createdAt) : ""}</p>
                        </div>
                        <FaChevronRight size={10} className="text-gray-700 group-hover:text-gray-500 transition-colors shrink-0" />
                      </div>
                    );
                  })
            )}

            {tab === "found" && (
              foundItems.length === 0
                ? <Empty label="No found items reported yet" />
                : foundItems.map((fi: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-3 hover:bg-white/[0.02] transition-colors">
                    {fi.img
                      ? <img src={fi.img} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 border border-white/10" />
                      : <div className="w-9 h-9 rounded-lg bg-cyan-400/10 border border-cyan-400/15 flex items-center justify-center shrink-0"><FaBoxOpen size={12} className="text-cyan-400" /></div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{fi.foundItemName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {fi.location && <span className="flex items-center gap-1 text-gray-600 text-[10px]"><FaMapMarkerAlt size={7} /> {fi.location}</span>}
                        {fi.date && <span className="text-gray-600 text-[10px]">{fmt(fi.date)}</span>}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${fi.isClaimed ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" : "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"}`}>
                      {fi.isClaimed ? "Claimed" : "Active"}
                    </span>
                  </div>
                ))
            )}

            {tab === "lost" && (
              lostItems.length === 0
                ? <Empty label="No lost items reported yet" />
                : lostItems.map((li: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-3 hover:bg-white/[0.02] transition-colors">
                    {li.img
                      ? <img src={li.img} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 border border-white/10" />
                      : <div className="w-9 h-9 rounded-lg bg-blue-400/10 border border-blue-400/15 flex items-center justify-center shrink-0"><FaSearch size={11} className="text-blue-400" /></div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{li.lostItemName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {li.location && <span className="flex items-center gap-1 text-gray-600 text-[10px]"><FaMapMarkerAlt size={7} /> {li.location}</span>}
                        {li.date && <span className="text-gray-600 text-[10px]">{fmt(li.date)}</span>}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${li.isFound ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" : "bg-blue-400/10 text-blue-400 border-blue-400/20"}`}>
                      {li.isFound ? "Found" : "Active"}
                    </span>
                  </div>
                ))
            )}

            {tab === "points" && (
              pointsHistory.length === 0
                ? <Empty label="No points earned yet — report a found item to get started!" />
                : pointsHistory.map((h: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${h.amount > 0 ? "bg-yellow-400/10 border border-yellow-400/20" : "bg-red-400/10 border border-red-400/20"}`}>
                      <FaStar size={11} className={h.amount > 0 ? "text-yellow-400" : "text-red-400"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium">{h.reason?.replace(/_/g, " ")}</p>
                      <p className="text-gray-600 text-[10px] mt-0.5">{h.createdAt ? fmt(h.createdAt) : ""}</p>
                    </div>
                    <p className={`text-sm font-black shrink-0 ${h.amount > 0 ? "text-yellow-400" : "text-red-400"}`}>
                      {h.amount > 0 ? "+" : ""}{h.amount} pts
                    </p>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Leaderboard — 2 cols */}
        <div className="lg:col-span-2 bg-gray-900 border border-white/5 rounded-2xl flex flex-col overflow-hidden">

          <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-white/5">
            <div>
              <h3 className="text-white text-sm font-semibold flex items-center gap-2">
               
                Leaderboard
              </h3>
            </div>
            <p className="text-gray-600 text-[10px] font-semibold">TOP {board.length}</p>
          </div>

          {board.length === 0 ? (
            <div className="p-6"><Empty label="No rankings yet" /></div>
          ) : (
            <>
              {top3.length >= 1 && (
                <Podium top3={top3} currentUserId={user?.id} />
              )}

              <div className="px-3 pb-3 space-y-0.5 divide-y divide-white/5">
                {myRank > 3 && (() => {
                  const me = board.find((u: any) => u.id === user?.id);
                  if (!me) return null;
                  return (
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 mb-2">
                      <span className="text-gray-500 text-xs font-bold w-4 text-center">{myRank}</span>
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
                        <FaUser size={11} className="text-cyan-400" />
                      </div>
                      <p className="text-cyan-300 text-xs font-semibold flex-1 truncate">You</p>
                      <p className="text-yellow-400 text-xs font-black shrink-0">{me.totalPoints}<span className="text-gray-600 font-normal"> pts</span></p>
                    </div>
                  );
                })()}

                {rest.map((u: any, i: number) => {
                  const rank = i + 4;
                  const isMe = u.id === user?.id;
                  return (
                    <div key={u.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      isMe ? "bg-cyan-500/10 border border-cyan-500/20" : "hover:bg-white/[0.02] border border-transparent"
                    }`}>
                      <span className="text-gray-600 text-xs font-bold w-4 text-center">{rank}</span>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isMe ? "bg-cyan-500/20" : "bg-white/[0.05]"}`}>
                        <FaUser size={11} className={isMe ? "text-cyan-400" : "text-gray-600"} />
                      </div>
                      <p className={`text-xs font-semibold flex-1 truncate ${isMe ? "text-cyan-300" : "text-gray-300"}`}>
                        {isMe ? "You" : (u.name || "Student")}
                      </p>
                      <p className="text-yellow-400 text-xs font-black shrink-0">
                        {u.totalPoints}<span className="text-gray-600 font-normal"> pts</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Quick Actions ──────────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-5">
        <h3 className="text-white text-sm font-semibold mb-3 sm:mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Track Status",
              desc:  "View real-time item & claim progress",
              href:  "/itemStatus",
              icon:  <FaClipboardList size={16} />,
              color: "text-emerald-400 bg-emerald-400/5 hover:bg-emerald-400/10 border-emerald-400/10",
            },
            {
              label: "Report Lost Item",
              desc:  "Help the SAS office locate it",
              href:  "/reportLostItem",
              icon:  <FaSearch size={16} />,
              color: "text-cyan-400 bg-cyan-400/5 hover:bg-cyan-400/10 border-cyan-400/10",
            },
            {
              label: "Browse Found Items",
              desc:  "Submit a claim to retrieve",
              href:  "/foundItems",
              icon:  <FaClipboardList size={16} />,
              color: "text-violet-400 bg-violet-400/5 hover:bg-violet-400/10 border-violet-400/10",
            },
          ].map(({ label, desc, href, icon, color }) => (
            <Link key={label} to={href}
              className={`group flex items-center gap-4 rounded-xl p-3 sm:p-4 border transition-all duration-150 ${color}`}
            >
              <div className="shrink-0">{icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{label}</p>
                <p className="text-gray-500 text-xs mt-0.5 truncate">{desc}</p>
              </div>
              <FaArrowRight size={11} className="text-gray-700 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-center mb-3">
        <FaHistory size={13} className="text-gray-700" />
      </div>
      <p className="text-gray-600 text-xs max-w-[160px] leading-relaxed">{label}</p>
    </div>
  );
}