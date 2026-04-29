import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUserVerification } from "../auth/auth";
import {
  FaTrophy, FaStar, FaBoxOpen, FaClipboardList, FaCheckCircle,
  FaTimesCircle, FaClock, FaMedal, FaSearch, FaArrowRight,
  FaChartLine, FaHistory, FaMapMarkerAlt, FaCalendarAlt,
} from "react-icons/fa";
import { MdVerified } from "react-icons/md";

// ── API base (Vite proxy forwards /api → backend) ────────────────────────────
const API = "/api";
const token = () => localStorage.getItem("accessToken") ?? "";
const authHeaders = () => ({ Authorization: `Bearer ${token()}`, "Content-Type": "application/json" });

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (d: string) => new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
const statusColor: Record<string, string> = {
  PENDING:  "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  REJECTED: "bg-red-500/10 text-red-300 border-red-500/20",
};
const statusIcon: Record<string, React.ReactNode> = {
  PENDING:  <FaClock size={10} />,
  APPROVED: <FaCheckCircle size={10} />,
  REJECTED: <FaTimesCircle size={10} />,
};

// ── Medal colours for leaderboard ────────────────────────────────────────────
const medalColor = (i: number) =>
  i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-gray-600";

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const user: any = useUserVerification();

  const [points,    setPoints]    = useState<any>(null);
  const [foundItems,setFoundItems]= useState<any[]>([]);
  const [lostItems, setLostItems] = useState<any[]>([]);
  const [claims,    setClaims]    = useState<any[]>([]);
  const [board,     setBoard]     = useState<any[]>([]);
  const [tab,       setTab]       = useState<"claims"|"found"|"lost"|"points">("claims");
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        const [p, fi, li, cl, lb] = await Promise.allSettled([
          fetch(`${API}/points/my`,          { headers: authHeaders() }).then(r => r.json()),
          fetch(`${API}/my/foundItem`,        { headers: authHeaders() }).then(r => r.json()),
          fetch(`${API}/my/lostItem`,         { headers: authHeaders() }).then(r => r.json()),
          fetch(`${API}/my/claims`,           { headers: authHeaders() }).then(r => r.json()),
          fetch(`${API}/points/leaderboard`,  { headers: authHeaders() }).then(r => r.json()),
        ]);

        if (p.status  === "fulfilled") setPoints(p.value?.data ?? null);
        if (fi.status === "fulfilled") setFoundItems(fi.value?.data?.data ?? fi.value?.data ?? []);
        if (li.status === "fulfilled") setLostItems(li.value?.data?.data  ?? li.value?.data ?? []);
        if (cl.status === "fulfilled") setClaims(cl.value?.data?.data     ?? cl.value?.data ?? []);
        if (lb.status === "fulfilled") setBoard(lb.value?.data ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const myRank = board.findIndex((u: any) => u.id === user?.id) + 1;

  // ── Stats ─────────────────────────────────────────────────────────────────
  const approvedClaims  = claims.filter((c: any) => c.status === "APPROVED").length;
  const pendingClaims   = claims.filter((c: any) => c.status === "PENDING").length;

  const initial =
    user?.name?.charAt(0)?.toUpperCase() ||
    user?.username?.charAt(0)?.toUpperCase() || "S";

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading your dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 text-white">

        {/* ── Hero / Profile Card ────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gray-900">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-400" />

        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-5 sm:p-6">
            <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-8 h-8 sm:w-9 sm:h-9 opacity-90">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
                </div>
                {/* Online dot */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-gray-900 rounded-full" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-white font-black text-lg sm:text-xl tracking-tight truncate">
                    {user?.name || user?.username || "Student"}
                </h1>
                <span className="flex items-center gap-1 text-[9px] text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold tracking-wider shrink-0">
                    <MdVerified size={9} /> STUDENT
                </span>
                </div>
                {user?.schoolId && (
                <p className="text-gray-400 text-xs sm:text-sm mt-0.5 font-mono">{user.schoolId}</p>
                )}
                <p className="text-gray-600 text-[11px] mt-0.5 truncate">{user?.email}</p>
            </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.05] my-4" />

            {/* Stats row */}
            <div className="flex items-center gap-3">
            {/* Points */}
            <div className="flex-1 flex items-center gap-3 bg-gray-800/50 border border-white/[0.05] rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                <FaStar size={12} className="text-yellow-400" />
                </div>
                <div>
                <p className="text-lg sm:text-xl font-black text-white leading-none">
                    {points?.totalPoints ?? 0}
                </p>
                <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                    Total Points
                </p>
                </div>
            </div>

            {/* Rank */}
            {myRank > 0 && (
                <div className="flex-1 flex items-center gap-3 bg-gray-800/50 border border-white/[0.05] rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <FaTrophy size={12} className="text-blue-400" />
                </div>
                <div>
                    <p className="text-lg sm:text-xl font-black text-white leading-none">#{myRank}</p>
                    <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                    Ranking
                    </p>
                </div>
                </div>
            )}
            </div>
        </div>
        </div>

        {/* ── Stats Row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Found Items Reported", value: foundItems.length, icon: <FaBoxOpen />,       color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/15" },
            { label: "Lost Items Reported",  value: lostItems.length,  icon: <FaSearch />,        color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/15" },
            { label: "Claims Approved",      value: approvedClaims,    icon: <FaCheckCircle />,   color: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/15" },
            { label: "Claims Pending",       value: pendingClaims,     icon: <FaClock />,         color: "text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/15" },
          ].map(({ label, value, icon, color, bg }) => (
            <div key={label} className={`rounded-xl border p-4 ${bg} bg-gray-900/60`}>
              <div className={`text-xl mb-2 ${color}`}>{icon}</div>
              <p className="text-2xl font-black text-white leading-none">{value}</p>
              <p className="text-gray-500 text-[10px] font-medium mt-1 leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Main Grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Tabbed Activity Panel */}
          <div className="lg:col-span-2 bg-gray-900 border border-white/[0.06] rounded-2xl overflow-hidden">

            {/* Tabs */}
            <div className="flex border-b border-white/[0.06] overflow-x-auto">
              {([
                { key: "claims", label: "My Claims",       icon: <FaClipboardList size={11} /> },
                { key: "found",  label: "Found Reports",   icon: <FaBoxOpen size={11} /> },
                { key: "lost",   label: "Lost Reports",    icon: <FaSearch size={11} /> },
                { key: "points", label: "Points History",  icon: <FaChartLine size={11} /> },
              ] as const).map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
                    tab === key
                      ? "border-blue-500 text-white bg-blue-500/5"
                      : "border-transparent text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-4 space-y-2.5 max-h-[420px] overflow-y-auto">

              {/* Claims */}
              {tab === "claims" && (
                claims.length === 0
                  ? <Empty label="No claims submitted yet" />
                  : claims.map((c: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 bg-gray-800/40 border border-white/[0.04]
                      rounded-xl px-4 py-3 hover:border-white/[0.08] transition-colors">
                      <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border mt-0.5 shrink-0 ${statusColor[c.status] ?? statusColor.PENDING}`}>
                        {statusIcon[c.status] ?? statusIcon.PENDING}
                        {c.status}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">
                          {c.foundItem?.foundItemName ?? c.lostItem?.lostItemName ?? "Item"}
                        </p>
                        <p className="text-gray-500 text-xs mt-0.5 truncate">{c.message ?? c.description}</p>
                      </div>
                      <p className="text-gray-600 text-[10px] shrink-0">{c.createdAt ? fmt(c.createdAt) : ""}</p>
                    </div>
                  ))
              )}

              {/* Found Items */}
              {tab === "found" && (
                foundItems.length === 0
                  ? <Empty label="No found items reported yet" />
                  : foundItems.map((fi: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 bg-gray-800/40 border border-white/[0.04]
                      rounded-xl px-4 py-3 hover:border-white/[0.08] transition-colors">
                      {fi.img
                        ? <img src={fi.img} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/10" />
                        : <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center shrink-0">
                            <FaBoxOpen size={14} className="text-emerald-400" />
                          </div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{fi.foundItemName}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {fi.location && (
                            <span className="flex items-center gap-1 text-gray-500 text-[10px]">
                              <FaMapMarkerAlt size={8} /> {fi.location}
                            </span>
                          )}
                          {fi.date && (
                            <span className="flex items-center gap-1 text-gray-500 text-[10px]">
                              <FaCalendarAlt size={8} /> {fmt(fi.date)}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border shrink-0 mt-0.5 ${
                        fi.isClaimed ? statusColor.APPROVED : statusColor.PENDING
                      }`}>
                        {fi.isClaimed ? "Claimed" : "Unclaimed"}
                      </span>
                    </div>
                  ))
              )}

              {/* Lost Items */}
              {tab === "lost" && (
                lostItems.length === 0
                  ? <Empty label="No lost items reported yet" />
                  : lostItems.map((li: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 bg-gray-800/40 border border-white/[0.04]
                      rounded-xl px-4 py-3 hover:border-white/[0.08] transition-colors">
                      {li.img
                        ? <img src={li.img} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/10" />
                        : <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center shrink-0">
                            <FaSearch size={12} className="text-blue-400" />
                          </div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{li.lostItemName}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {li.location && (
                            <span className="flex items-center gap-1 text-gray-500 text-[10px]">
                              <FaMapMarkerAlt size={8} /> {li.location}
                            </span>
                          )}
                          {li.date && (
                            <span className="flex items-center gap-1 text-gray-500 text-[10px]">
                              <FaCalendarAlt size={8} /> {fmt(li.date)}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border shrink-0 mt-0.5 ${
                        li.isFound ? statusColor.APPROVED : statusColor.PENDING
                      }`}>
                        {li.isFound ? "Found" : "Active"}
                      </span>
                    </div>
                  ))
              )}

              {/* Points History */}
              {tab === "points" && (
                !points || points.history?.length === 0
                  ? <Empty label="No points earned yet — report a found item to get started!" />
                  : points.history.map((h: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-800/40 border border-white/[0.04]
                      rounded-xl px-4 py-3 hover:border-white/[0.08] transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        h.amount > 0 ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-red-500/10 border border-red-500/20"
                      }`}>
                        <FaStar size={12} className={h.amount > 0 ? "text-yellow-400" : "text-red-400"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold">{h.reason?.replace(/_/g, " ")}</p>
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

          {/* Right: Leaderboard */}
          <div className="bg-gray-900 border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaTrophy size={12} className="text-yellow-400" />
                <p className="text-sm font-bold text-white">Leaderboard</p>
              </div>
              <p className="text-gray-600 text-[10px]">Top 10</p>
            </div>

            <div className="p-3 space-y-1.5 max-h-[380px] overflow-y-auto">
              {board.length === 0
                ? <Empty label="No rankings yet" />
                : board.map((u: any, i: number) => {
                  const isMe = u.id === user?.id;
                  return (
                    <div key={i} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                      isMe
                        ? "bg-blue-500/10 border border-blue-500/25"
                        : "bg-gray-800/30 border border-transparent hover:border-white/[0.06]"
                    }`}>
                      <div className={`w-6 text-center font-black text-sm ${medalColor(i)}`}>
                        {i < 3 ? <FaMedal /> : <span className="text-xs">{i + 1}</span>}
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500
                        flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-[10px]">
                          {u.name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${isMe ? "text-blue-300" : "text-gray-300"}`}>
                          {isMe ? "You" : (u.name || "Student")}
                        </p>
                      </div>
                      <p className="text-yellow-400 text-xs font-black shrink-0">{u.totalPoints}</p>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* ── Quick Actions ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Report Found Item", desc: "Earn 50 pts", href: "/reportFoundItem", icon: <FaBoxOpen size={16} />, accent: "from-emerald-600 to-teal-600" },
            { label: "Report Lost Item",  desc: "Help others find it", href: "/reportLostItem",  icon: <FaSearch size={16} />,  accent: "from-blue-600 to-cyan-600" },
            { label: "Browse Found Items",desc: "Claim what's yours", href: "/foundItems",        icon: <FaClipboardList size={16} />, accent: "from-purple-600 to-violet-600" },
          ].map(({ label, desc, href, icon, accent }) => (
            <Link key={label} to={href}
              className={`group flex items-center gap-4 rounded-2xl p-4 bg-gradient-to-br ${accent} bg-opacity-10
                border border-white/[0.08] hover:border-white/[0.15] transition-all hover:shadow-lg hover:-translate-y-0.5`}
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shrink-0 shadow-lg`}>
                <span className="text-white">{icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold">{label}</p>
                <p className="text-gray-500 text-xs">{desc}</p>
              </div>
              <FaArrowRight size={10} className="text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>

    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function Empty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-10 h-10 rounded-xl bg-gray-800 border border-white/[0.06] flex items-center justify-center mb-3">
        <FaHistory size={14} className="text-gray-600" />
      </div>
      <p className="text-gray-600 text-xs max-w-[180px] leading-relaxed">{label}</p>
    </div>
  );
}