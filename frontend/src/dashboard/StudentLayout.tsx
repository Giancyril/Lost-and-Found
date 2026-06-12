import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUserVerification, signOut } from "../auth/auth";
import {
  FaTachometerAlt, FaBoxOpen, FaSearch, FaClipboardList,
  FaTrophy, FaCog, FaBars, FaTimes, FaHome, FaSignOutAlt,
  FaChevronLeft, FaChevronRight, FaChevronDown, FaStar,
  FaChartLine, FaArrowRight, FaMedal, FaBullhorn, FaMapMarkerAlt, FaUser
} from "react-icons/fa";
import { useGetMyPointsQuery, useGetMyRankQuery } from "../redux/api/api";
import ChatDropdown from "./components/ChatDropdown";
import ProximityAlertSystem from "../components/ProximityAlertSystem";
import { calculateLevel } from "../utils/leveling";

const NAV_ITEMS = [
  {
    section: "MENU",
    items: [
      { label: "Overview", href: "/dashboard/student", icon: <FaTachometerAlt size={14} /> },
    ],
  },
  {
    section: "MY ITEMS",
    items: [
      { label: "My Found Items", href: "/dashboard/student/found-items", icon: <FaBoxOpen size={14} /> },
      { label: "My Lost Items", href: "/dashboard/student/lost-items", icon: <FaSearch size={14} /> },
      { label: "My Claims", href: "/dashboard/student/claims", icon: <FaClipboardList size={14} /> },
    ],
  },
  {
    section: "COMMUNITY",
    items: [
      { label: "Leaderboard", href: "/dashboard/student/leaderboard", icon: <FaTrophy size={14} /> },
      { label: "Active Bounties", href: "/dashboard/student/bounties", icon: <FaStar size={14} /> },
      { label: "Achievements", href: "/dashboard/student/achievements", icon: <FaMedal size={14} /> },
      { label: "Points History", href: "/dashboard/student/points", icon: <FaChartLine size={14} /> },
      { label: "Messages", href: "/dashboard/student/chat", icon: <FaBullhorn size={14} /> },
    ],
  },
  {
    section: "ACCOUNT",
    items: [
      { label: "Settings", href: "/dashboard/student/settings", icon: <FaCog size={14} /> },
    ],
  },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard/student": { title: "Overview", subtitle: "Welcome back! Here's a summary of your activity." },
  "/dashboard/student/found-items": { title: "My Found Items", subtitle: "Items you reported as found on campus." },
  "/dashboard/student/lost-items": { title: "My Lost Items", subtitle: "Items you reported as lost on campus." },
  "/dashboard/student/claims": { title: "My Claims", subtitle: "Track the status of your item claims." },
  "/dashboard/student/leaderboard": { title: "Leaderboard", subtitle: "Top students ranked by points earned." },
  "/dashboard/student/bounties": { title: "Active Bounties", subtitle: "Complete weekly challenges to earn extra XP and climb the leaderboard." },
  "/dashboard/student/achievements": { title: "Achievements", subtitle: "Collection of badges earned through community contribution." },
  "/dashboard/student/points": { title: "Points History", subtitle: "Your full XP transaction log every point earned or deducted." },
  "/dashboard/student/settings": { title: "Settings", subtitle: "Manage your account preferences." },
};

interface StudentLayoutProps {
  children: React.ReactNode;
}

// ── Tier helper ───────────────────────────────────────────────────────────────
const getTier = (pts: number) => {
  if (pts >= 500) return { label: "Gold", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20", glow: "shadow-yellow-500/20" };
  if (pts >= 200) return { label: "Silver", color: "text-gray-300", bg: "bg-gray-400/10 border-gray-400/20", glow: "shadow-gray-400/20" };
  if (pts >= 50) return { label: "Bronze", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", glow: "shadow-amber-500/20" };
  return { label: "Starter", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", glow: "shadow-cyan-500/20" };
};

const REASON_LABEL: Record<string, string> = {
  FOUND_ITEM_REPORTED: "Reported found item",
  CLAIM_APPROVED: "Claim approved",
  HELPFUL_COMMENT: "Helpful comment",
};
const REASON_COLOR: Record<string, string> = {
  FOUND_ITEM_REPORTED: "text-emerald-400",
  CLAIM_APPROVED: "text-cyan-400",
  HELPFUL_COMMENT: "text-violet-400",
};

// ── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ size = "md" }: { name?: string; size?: "sm" | "md" | "lg" }) => {
  const sz = size === "sm" ? "w-7 h-7 text-xs" : size === "lg" ? "w-11 h-11 text-base" : "w-9 h-9 text-sm";
  const iconSize = size === "sm" ? 12 : size === "lg" ? 18 : 14;
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-white shrink-0`}>
      <FaUser size={iconSize} />
    </div>
  );
};

// ── Boost Banner ─────────────────────────────────────────────────────────────
const BoostBanner = ({ boostEvent }: { boostEvent: any }) => {
  const [dismissed, setDismissed] = useState(false);
  if (!boostEvent || dismissed) return null;
  return (
    <div className="bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-500/10 border-b border-yellow-500/20 px-4 py-1.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-yellow-400 font-black animate-pulse">⚡ {boostEvent.multiplier}× XP BOOST ACTIVE</span>
        <span className="text-yellow-600 hidden sm:inline">— {boostEvent.name}</span>
        <span className="text-yellow-700 text-[10px]">
          ends {new Date(boostEvent.endDate).toLocaleDateString()}
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-yellow-700 hover:text-yellow-400 transition-colors shrink-0"
      >
        <FaTimes size={10} />
      </button>
    </div>
  );
};

// ── Points Pill ───────────────────────────────────────────────────────────────
const PointsDropdown = ({ points, history, rank, loginStreak }: {
  points: number;
  history: any[];
  rank: number;
  loginStreak: number;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { level, rankTitle, currentLevelTotalXp, nextLevelTotalXp, progressPercent } = calculateLevel(points);

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div ref={ref} className="relative flex items-center gap-1">


      {/* ── Header Trigger Button ── */}
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className={`relative w-9 h-9 flex flex-col items-center justify-center rounded-full transition-all border group ${open
          ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-400"
          : "bg-transparent border-white/5 text-gray-400 hover:text-yellow-400 hover:border-yellow-400/30 hover:bg-yellow-400/10"
          }`}
      >
        <span className="text-[7px] font-bold text-yellow-500 leading-none mb-[1px] uppercase group-hover:text-yellow-400 transition-colors">LVL</span>
        <span className="text-[13px] font-black leading-none">{level}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 w-72 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/70 overflow-hidden z-50">
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-white/5"
              style={{ background: "linear-gradient(135deg, rgba(234,179,8,0.05) 0%, transparent 60%)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/20 flex flex-col items-center justify-center">
                    <span className="text-[9px] font-bold text-yellow-500 leading-none">LVL</span>
                    <span className="text-yellow-400 text-sm font-black leading-none mt-0.5">{level}</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-black leading-none">{points.toLocaleString()} XP</p>
                    <p className="text-yellow-500 text-[10px] mt-0.5 font-bold uppercase tracking-wider">{rankTitle}</p>
                  </div>
                </div>
              </div>

              {level < 100 ? (
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1.5 font-medium">
                    <span>{currentLevelTotalXp} XP</span>
                    <span>{nextLevelTotalXp} XP</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden relative">
                    <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
                      style={{ width: `${progressPercent}%`, background: "linear-gradient(90deg, #eab308, #f59e0b)" }} />
                  </div>
                  <p className="text-[9px] text-gray-500 mt-1.5 text-right">{nextLevelTotalXp - points} XP to Level {level + 1}</p>
                </div>
              ) : (
                <p className="text-[11px] text-yellow-400 font-semibold flex items-center gap-1.5 mt-2">
                  <FaTrophy size={9} /> Maximum Level Reached!
                </p>
              )}
            </div>

            {/* Rank + Transactions */}
            <div className="grid grid-cols-2 gap-px bg-white/[0.04] border-b border-white/5">
              <div className="bg-gray-900 px-4 py-3">
                <p className="text-white text-sm font-black">{rank > 0 ? `#${rank}` : "—"}</p>
                <p className="text-gray-600 text-[10px] font-medium mt-0.5">Campus Rank</p>
              </div>
              <div className="bg-gray-900 px-4 py-3">
                <p className="text-white text-sm font-black">{history.length}</p>
                <p className="text-gray-600 text-[10px] font-medium mt-0.5">Transactions</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="px-3 pt-3 pb-1">
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1 mb-2">Recent Activity</p>
              {history.length === 0 ? (
                <div className="py-6 text-center">
                  <FaStar size={20} className="text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-600 text-xs font-medium">No points yet</p>
                  <p className="text-gray-700 text-[10px] mt-0.5">Report a found item to earn 50 pts</p>
                </div>
              ) : (
                <div className="space-y-0.5 max-h-[148px] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                  {history.slice(0, 6).map((h: any, i: number) => (
                    <div key={i} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/[0.03] transition-colors">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${h.amount > 0 ? "bg-yellow-500/10" : "bg-red-500/10"}`}>
                        <FaStar size={9} className={h.amount > 0 ? "text-yellow-400" : "text-red-400"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] font-semibold truncate ${REASON_COLOR[h.reason] ?? "text-gray-400"}`}>
                          {REASON_LABEL[h.reason] ?? h.reason?.replace(/_/g, " ")}
                        </p>
                      </div>
                      <p className={`text-xs font-black shrink-0 ${h.amount > 0 ? "text-yellow-400" : "text-red-400"}`}>
                        {h.amount > 0 ? "+" : ""}{h.amount}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-3 pb-3 pt-1 border-t border-white/[0.04] mt-1">
              <Link
                to="/dashboard/student/points"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl bg-yellow-500/[0.07] hover:bg-yellow-500/12 border border-yellow-500/15 text-yellow-300 text-xs font-semibold transition-all group"
              >
                <div className="flex items-center gap-2">
                  <FaChartLine size={10} />
                  <span>View all transactions</span>
                </div>
                <FaArrowRight size={9} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ── Profile Dropdown ──────────────────────────────────────────────────────────
const ProfileDropdown = ({ user, onSignOut }: { user: any; onSignOut: () => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const displayName = user?.name?.split(" ")[0] || user?.username || "Student";

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 cursor-pointer focus:outline-none group">
        <div className="relative">
          <Avatar name={user?.name || user?.username} size="md" />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-gray-900 rounded-full" />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-white text-sm font-semibold leading-none">{displayName}</p>
          <p className="text-gray-500 text-[10px] mt-0.5 font-mono">{user?.schoolId || "STUDENT"}</p>
        </div>
        <FaChevronDown size={10} className={`text-gray-500 hidden sm:block transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 w-56 bg-gray-900 border border-white/10 rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 bg-gray-800/50">
              <Avatar name={user?.name || user?.username} size="md" />
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold leading-tight break-words line-clamp-2">{user?.name || user?.username || "Student"}</p>
                <p className="text-gray-500 text-[10px] font-mono truncate mt-0.5">{user?.schoolId || "Student"}</p>
              </div>
            </div>
            <div className="py-1">
              <Link to="/dashboard/student/settings" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-sm">
                <FaCog size={12} className="text-gray-500 shrink-0" /> Settings
              </Link>
              <Link to="/" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-sm">
                <FaHome size={12} className="text-gray-500 shrink-0" /> Back to Home
              </Link>
            </div>
            <div className="border-t border-white/5 py-1">
              <button type="button" onClick={() => { setOpen(false); onSignOut(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/[0.07] transition-colors text-sm">
                <FaSignOutAlt size={12} className="shrink-0" /> Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ── Sidebar Nav Item ──────────────────────────────────────────────────────────
const NavItem = ({ label, href, icon, collapsed, active }: {
  label: string; href: string; icon: React.ReactNode; collapsed: boolean; active: boolean;
}) => (
  <Link
    to={href}
    title={collapsed ? label : undefined}
    className={`relative flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
      ${active
        ? "bg-cyan-500/10 text-cyan-400"
        : "text-gray-400 hover:text-white hover:bg-white/5"
      }
      ${collapsed ? "justify-center" : ""}`}
  >
    {active && (
      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-400 rounded-full" />
    )}
    <span className={`shrink-0 transition-colors ${active ? "text-cyan-400" : "text-gray-500 group-hover:text-gray-300"}`}>
      {icon}
    </span>
    {!collapsed && <span className="truncate">{label}</span>}
    {collapsed && (
      <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-gray-800 border border-white/10 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl">
        {label}
      </span>
    )}
  </Link>
);

// ── Main Layout ───────────────────────────────────────────────────────────────
export default function StudentLayout({ children }: StudentLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user: any = useUserVerification();
  const isLoggedIn = !!user?.id;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
    }
  }, [isLoggedIn, navigate, location.pathname]);

  const { data: pointsData } = useGetMyPointsQuery(undefined, {
    skip: !isLoggedIn,
    pollingInterval: 120_000,
  });
  const { data: rankData } = useGetMyRankQuery(undefined, { skip: !isLoggedIn });

  const points = pointsData?.data?.totalPoints ?? 0;
  const history = pointsData?.data?.history ?? [];
  const loginStreak = pointsData?.data?.loginStreak ?? 0;
  const boostEvent = pointsData?.data?.boostEvent ?? null;
  const rank = rankData?.data?.rank ?? 0;

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleSignOut = () => { signOut(navigate); window.location.href = "/"; };

  const isActive = (href: string) =>
    href === "/dashboard/student"
      ? location.pathname === href
      : location.pathname.startsWith(href);

  const pageMeta = (() => {
    const key = Object.keys(pageTitles).find(k =>
      k === "/dashboard/student" ? location.pathname === k : location.pathname.startsWith(k)
    );
    return pageTitles[key ?? "/dashboard/student"] ?? { title: "Student Dashboard", subtitle: "" };
  })();

  // ── Sidebar content ────────────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / header */}
      <div className={`flex items-center h-16 px-4 border-b border-white/5 shrink-0
        ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <img src="/sas lost and found logo.png" alt="logo" className="w-8 h-8 object-contain shrink-0"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div className="leading-tight min-w-0">
              <p className="text-white text-sm font-semibold tracking-widest truncate">NBSC SAS</p>
              <p className="text-gray-500 text-[10px] uppercase tracking-widest truncate">Lost & Found</p>
            </div>
          </div>
        )}
        {collapsed && (
          <img src="/sas lost and found logo.png" alt="logo" className="w-8 h-8 object-contain"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        )}
        <button onClick={() => setCollapsed(c => !c)}
          className="hidden md:flex items-center justify-center w-6 h-6 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-colors shrink-0">
          {collapsed ? <FaChevronRight size={10} /> : <FaChevronLeft size={10} />}
        </button>
        <button onClick={() => setMobileOpen(false)} className="md:hidden text-gray-500 hover:text-white p-1 transition-colors">
          <FaTimes size={14} />
        </button>
      </div>



      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4 custom-scrollbar">
        {NAV_ITEMS.map(({ section, items }) => (
          <div key={section}>
            {!collapsed && (
              <p className="text-[9px] uppercase tracking-widest text-gray-700 font-semibold px-2.5 mb-1.5">{section}</p>
            )}
            <div className="space-y-0.5">
              {items.map(({ label, href, icon }) => (
                <NavItem key={href} label={label} href={href} icon={icon} collapsed={collapsed} active={isActive(href)} />
              ))}
            </div>
          </div>
        ))}
      </nav>


    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white lg:flex overflow-x-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col
          bg-gray-900 border-r border-white/5
          transition-all duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          ${collapsed ? "lg:w-[72px]" : "lg:w-60"}
          w-60`}
        style={{ boxShadow: "4px 0 24px rgba(0,0,0,0.4)" }}
      >
        <SidebarContent />
      </aside>

      {/* ── Main area ── */}
      <div
        className={`w-full flex flex-col min-h-screen bg-gray-950 overflow-x-hidden transition-all duration-300
          ${collapsed ? "lg:ml-[72px] lg:w-[calc(100%-72px)]" : "lg:ml-60 lg:w-[calc(100%-240px)]"}`}
      >
        {/* ── Topbar ── */}
        <header
          className="h-16 flex items-center px-4 sm:px-5 gap-3 shrink-0 sticky top-0 z-30 border-b border-white/5"
          style={{
            background: "rgba(10,15,30,0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <FaBars size={16} />
          </button>

          {/* Page title */}
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <div className="hidden sm:block w-0.5 h-5 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full shrink-0" />
            <div className="min-w-0">
              <h1 className="text-white text-sm sm:text-[15px] font-semibold tracking-tight truncate leading-none">
                {pageMeta.title}
              </h1>
              <p className="text-gray-500 text-xs truncate hidden sm:block mt-0.5">
                {pageMeta.subtitle}
              </p>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {location.pathname === "/dashboard/student" && <ProximityAlertSystem />}
            <ChatDropdown />
            <PointsDropdown points={points} history={history} rank={rank} loginStreak={loginStreak} />
            <ProfileDropdown user={user} onSignOut={handleSignOut} />
          </div>
        </header>

        {/* ── Boost Banner ── */}
        <BoostBanner boostEvent={boostEvent} />

        {/* ── Page content ── */}
        <main className="flex-1 p-4 sm:p-5 lg:p-7 overflow-auto bg-gray-950 custom-scrollbar">
          {children}
        </main>

        {/* ── Footer bar ── */}
        <footer className="shrink-0 px-5 py-3 border-t border-white/[0.04] flex items-center justify-between">
          <p className="text-gray-700 text-[10px] font-medium">Student Affairs & Services · Lost and Found</p>
          <p className="text-gray-700 text-[10px]">© {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
}