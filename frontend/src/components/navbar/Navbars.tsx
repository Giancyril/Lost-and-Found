import { signOut, useUserVerification } from "../../auth/auth";
import {
  Navbar,
  NavbarBrand,
  NavbarToggle,
  NavbarCollapse,
  NavbarLink,
} from "flowbite-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Modals from "../modal/Modal";
import {
  FaCog, FaSignOutAlt, FaTachometerAlt, FaChevronDown,
  FaTv, FaStar, FaTrophy, FaBoxOpen, FaChartLine, FaArrowRight,
  FaExclamationTriangle, FaSearch, FaMap, FaClipboardList
} from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import NotificationBell from "../notifications/NotificationBell";
import ChatbotConcierge from "../chatbot/ChatbotConcierge";
import { useGetMyPointsQuery, useGetLeaderboardQuery } from "../../redux/api/api";
import { calculateLevel } from "../../utils/leveling";

const UserIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className={`${className} opacity-90`}>
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
  </svg>
);

// ── Points reason label map ───────────────────────────────────────────────────
const REASON_LABEL: Record<string, string> = {
  FOUND_ITEM_REPORTED: "Reported a found item",
  CLAIM_APPROVED: "Claim approved",
  HELPFUL_COMMENT: "Helpful comment",
};
const REASON_COLOR: Record<string, string> = {
  FOUND_ITEM_REPORTED: "text-emerald-400",
  CLAIM_APPROVED: "text-blue-400",
  HELPFUL_COMMENT: "text-violet-400",
};

// ── Tier badge ────────────────────────────────────────────────────────────────
const getTier = (pts: number) => {
  if (pts >= 500) return { label: "Gold", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" };
  if (pts >= 200) return { label: "Silver", color: "text-gray-300", bg: "bg-gray-400/10 border-gray-400/20" };
  if (pts >= 50) return { label: "Bronze", color: "text-amber-600", bg: "bg-amber-600/10 border-amber-600/20" };
  return { label: "Starter", color: "text-gray-500", bg: "bg-gray-700/30 border-gray-600/20" };
};

// ── Points Dropdown ───────────────────────────────────────────────────────────
const PointsDropdown = ({ points, history, rank }: { points: number; history: any[]; rank: number }) => {
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
    <div ref={ref} className="relative">
      {/* ── Header Trigger Button ── */}
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className={`relative w-9 h-9 flex flex-col items-center justify-center rounded-full transition-all border group ${
          open 
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
          <div className="fixed md:absolute left-3 right-3 md:left-auto md:right-0 top-[72px] md:top-11 w-auto md:w-72 bg-gray-900 border border-white/10
            rounded-2xl shadow-2xl shadow-black/80 overflow-hidden z-50">

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

            {/* Recent history */}
            <div className="px-3 pt-3 pb-1">
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1 mb-2">Recent Activity</p>
              {history.length === 0 ? (
                <div className="py-6 text-center">
                  <FaBoxOpen size={18} className="text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-600 text-xs">No points yet</p>
                  <p className="text-gray-700 text-[10px] mt-0.5">Report a found item to earn 50 pts</p>
                </div>
              ) : (
                <div className="space-y-0.5 max-h-[160px] overflow-y-auto"
                  style={{ scrollbarWidth: "none" }}>
                  {history.slice(0, 6).map((h: any, i: number) => (
                    <div key={i} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/[0.03] transition-colors">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${h.amount > 0 ? "bg-yellow-500/10" : "bg-red-500/10"
                        }`}>
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

            {/* Footer CTA */}
            <div className="px-3 pb-3 pt-1 border-t border-white/[0.04] mt-1">
              <Link
                to="/dashboard/student/leaderboard"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl
                  bg-yellow-500/8 hover:bg-yellow-500/15 border border-yellow-500/15
                  text-yellow-300 text-xs font-semibold transition-all group"
              >
                <div className="flex items-center gap-2">
                  <FaChartLine size={10} />
                  <span>View full leaderboard</span>
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

// ── Nav Dropdown ──────────────────────────────────────────────────────────────
const NavDropdown = ({ label, items }: {
  label: string;
  items: { label: string; href: string; icon?: React.ReactNode; color?: string; bg?: string }[];
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const isActive = items.some(item => location.pathname === item.href);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all duration-200 font-semibold text-sm whitespace-nowrap
          ${isActive ? "text-blue-400 bg-blue-500/10" : "text-gray-200 hover:text-white hover:bg-gray-800"}`}
      >
        {label}
        <FaChevronDown size={8} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
          {/* top accent line */}
          <div className="h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
          <div className="p-1.5">
            {items.map((item) => {
              const active = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group
                    ${active ? "bg-blue-500/10 text-blue-400" : "text-gray-300 hover:text-white hover:bg-white/[0.05]"}`}
                >
                  {item.icon && (
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.bg ?? "bg-white/5"}`}>
                      <span className={item.color ?? "text-gray-400"}>{item.icon}</span>
                    </span>
                  )}
                  <span className="font-medium">{item.label}</span>
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Navbar ───────────────────────────────────────────────────────────────
export function Navbars() {
  const navigate = useNavigate();
  const location = useLocation();
  const users: any = useUserVerification();

  const isAdmin = users?.role === "ADMIN";
  const isLoggedIn = !!(users?.email || users?.id);

  const { data: pointsData, refetch: refetchPoints, isError } = useGetMyPointsQuery(undefined, {
    skip: !isLoggedIn || isAdmin,
    pollingInterval: 120_000,
    refetchOnMountOrArgChange: true,
  });
  const { data: boardData } = useGetLeaderboardQuery(undefined, {
    skip: !isLoggedIn || isAdmin,
    refetchOnMountOrArgChange: true,
  });

  const points = pointsData?.data?.totalPoints ?? 0;
  const history = pointsData?.data?.history ?? [];
  const board = boardData?.data ?? [];
  const rank = board.findIndex((u: any) => u.id === users?.id) + 1;

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    // Only refetch if user is authenticated and not admin
    // Add a small delay to prevent multiple simultaneous calls
    if (isLoggedIn && !isAdmin) {
      const timer = setTimeout(() => {
        refetchPoints();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, isAdmin, refetchPoints]);

  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBrandClick = () => {
    if (isLoggedIn) return;
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => { clickCountRef.current = 0; }, 600);
    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      const rawAdminPath = import.meta.env.VITE_ADMIN_PATH || "/nbsc-secure-portal";
      const adminPath = rawAdminPath.startsWith("/") ? rawAdminPath : `/${rawAdminPath}`;
      navigate(adminPath);
    }
  };

  useEffect(() => () => {
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
  }, []);

  const handleSignOut = () => {
    setProfileOpen(false);
    signOut(navigate);
    Modals({ message: "Log out successfully", status: true });
    window.location.reload();
  };

  const initial =
    users?.username?.charAt(0)?.toUpperCase() ||
    users?.name?.charAt(0)?.toUpperCase() ||
    users?.email?.charAt(0)?.toUpperCase() || "A";

  return (
    <>
      <Navbar fluid className="sticky top-0 z-50 bg-[#0a0f1d]/95 backdrop-blur-md border-b border-gray-800 shadow-2xl py-1 md:py-1.5 !overflow-visible">

        {/* Brand */}
        <NavbarBrand
          href="/"
          onClick={(e) => { if (!isLoggedIn) { e.preventDefault(); handleBrandClick(); } }}
        >
          <div className="flex items-center space-x-2.5 select-none">
            <img
              src="/sas lost and found logo.png"
              alt="SAS Lost and Found Logo"
              className="w-9 h-9 object-contain shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div>
              <span className="whitespace-nowrap text-sm font-black text-white tracking-widest leading-none">NBSC SAS</span>
              <p className="text-gray-500 text-[10px] font-medium tracking-wide leading-tight hidden sm:block">Lost & Found Management System</p>
            </div>
          </div>
        </NavbarBrand>

        {/* Right side */}
        <div className="flex md:order-2 items-center gap-2 !overflow-visible">
          <ChatbotConcierge />
          <NotificationBell />

          {/* Not logged in */}
          {!isLoggedIn && (
            <div className="flex items-center gap-2">
              <Link to="/login"
                className="flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-white
                  bg-blue-600 hover:bg-blue-500 border border-blue-500/50 transition-colors">
                Login
              </Link>
            </div>
          )}

          {/* Admin dropdown */}
          {isLoggedIn && isAdmin && (
            <div ref={profileRef} className="relative hidden md:block">
              <button type="button" onClick={() => setProfileOpen(p => !p)}
                className="flex items-center gap-2.5 cursor-pointer group focus:outline-none">
                <div className="relative">
                  {users?.userImg ? (
                    <img src={users.userImg} alt="Admin"
                      className="w-9 h-9 rounded-full border-2 border-gray-700 group-hover:border-blue-500 transition-all duration-200 shadow-lg" />
                  ) : (
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full
                      flex items-center justify-center border-2 border-gray-700 group-hover:border-blue-400 transition-all duration-200 shadow-lg">
                      <span className="text-white font-bold text-sm">{initial}</span>
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-gray-900 rounded-full" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-white text-sm font-semibold leading-none">{users?.username || users?.name || "Admin"}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{users?.role || "ADMIN"}</p>
                </div>
                <FaChevronDown size={10} className={`text-gray-500 hidden sm:block transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-12 w-52 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 hidden md:block">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 border-b border-white/[0.05]">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-xs">{initial}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{users?.name || users?.email}</p>
                      <p className="text-gray-400 text-xs">{users?.role}</p>
                    </div>
                  </div>
                  <div className="py-1">
                    <Link to="/dashboard" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-sm">
                      <FaTachometerAlt size={12} className="text-gray-500 shrink-0" /> Admin Dashboard
                    </Link>
                    <a href="/portal" target="_blank" rel="noopener noreferrer" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-sm">
                      <FaTv size={12} className="text-gray-500 shrink-0" /> Display Portal
                    </a>
                    <Link to="/dashboard/settings" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-sm">
                      <FaCog size={12} className="text-gray-500 shrink-0" /> Account Settings
                    </Link>
                  </div>
                  <div className="border-t border-white/[0.05] py-1">
                    <button type="button" onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-sm">
                      <FaSignOutAlt size={12} className="shrink-0" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Student — Points dropdown + profile */}
          {isLoggedIn && !isAdmin && (
            <>
              {/* ── Points dropdown ── */}
              <PointsDropdown points={points} history={history} rank={rank} />

              {/* ── Student profile dropdown ── */}
              <div ref={profileRef} className="relative hidden md:block">
                <button type="button" onClick={() => setProfileOpen(p => !p)}
                  className="flex items-center gap-2 cursor-pointer group focus:outline-none">
                  <div className="relative">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full
                      flex items-center justify-center border-2 border-gray-700
                      group-hover:border-blue-400 transition-all shadow-lg shrink-0">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-gray-900 rounded-full" />
                  </div>
                  <div className="hidden sm:block text-left max-w-[100px]">
                    <p className="text-white text-sm font-semibold leading-none truncate">
                      {users?.name?.split(' ')[0] || users?.username || "Student"}
                    </p>
                    <p className="text-gray-500 text-[10px] mt-0.5 font-mono truncate">
                      {users?.schoolId || "STUDENT"}
                    </p>
                  </div>
                  <FaChevronDown size={10} className={`text-gray-500 hidden sm:block transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40 hidden md:block" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-11 w-52 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 hidden md:block">
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 border-b border-white/[0.05]">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className="text-white text-[11px] font-medium leading-tight break-words line-clamp-2">
                            {users?.name || users?.username || "Student"}
                          </p>
                          <p className="text-gray-500 text-[10px] font-mono mt-0.5">
                            {users?.schoolId || "Student"}
                          </p>
                        </div>
                      </div>
                      <div className="py-1">
                        <Link to="/dashboard/student" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-sm">
                          <FaTachometerAlt size={12} className="text-gray-500 shrink-0" />Dashboard
                        </Link>
                      </div>
                      <div className="border-t border-white/[0.05] py-1">
                        <button type="button" onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-sm">
                          <FaSignOutAlt size={12} className="shrink-0" /> Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* Replace NavbarToggle with a custom one */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(p => !p)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors md:hidden"
          >
            <i className={`ti ${mobileMenuOpen ? "ti-x" : "ti-menu-2"} text-[17px]`} aria-hidden="true" />
          </button>
        </div>

        {/* ── Mobile menu styles ── */}
        <style>{`
          @media (max-width: 767px) {
            .mobile-nav-menu {
              position: absolute;
              top: 100%;
              left: 0;
              width: 100%;
              max-height: 90vh;
              overflow-y: auto;
              background-color: #0a0f1d; /* Custom dark navy */
              border-bottom: 1px solid rgba(255,255,255,0.06);
              z-index: 50;
              transform-origin: top center;
            }
            .mobile-nav-menu.open {
              opacity: 1;
              transform: translateY(0) scale(1);
              pointer-events: auto;
              transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.4,0,0.2,1);
            }
            .mobile-nav-menu.closed {
              opacity: 0;
              transform: translateY(-8px) scale(0.98);
              pointer-events: none;
              display: block;
              transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.4,0,0.2,1);
            }
          }
        `}</style>

        {/* Mobile menu — manually controlled */}
        <div className={`mobile-nav-menu md:hidden ${mobileMenuOpen ? "open" : "closed"}`}>
          <div className="px-2 pt-1 pb-3">

            {isLoggedIn && (
              <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0 border-2 border-blue-500/30">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">
                    {users?.name || users?.username || (isAdmin ? "Admin" : "Student")}
                  </p>
                  <p className="text-[11px] text-white/35 mt-0.5">
                    {isAdmin ? "Administrator" : `Student · ${users?.schoolId || "NBSC"}`}
                  </p>
                </div>
                {!isAdmin && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-yellow-400/10 border border-yellow-400/20 rounded-full shrink-0">
                    <FaStar size={9} className="text-yellow-400" />
                    <span className="text-[11px] font-medium text-yellow-300">{points} pts</span>
                  </div>
                )}
              </div>
            )}

            {isLoggedIn && (
              <Link to={isAdmin ? "/dashboard" : "/dashboard/student"} onClick={closeMobileMenu}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-150 mb-4 group border border-white/[0.05]">
                <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <i className="ti ti-layout-dashboard text-[15px] text-blue-400" aria-hidden="true" />
                </span>
                <span className="flex-1 text-sm font-medium text-white group-hover:text-blue-300 transition-colors duration-150">Go to Dashboard</span>
                <i className="ti ti-chevron-right text-[13px] text-white/20 group-hover:text-white transition-colors duration-150" aria-hidden="true" />
              </Link>
            )}

            <p className={`text-[10px] text-white/25 uppercase tracking-widest px-3 mb-1.5 ${!isLoggedIn ? "mt-2" : ""}`}>Navigation</p>

            {[
              { label: "Home", href: "/", icon: "ti-home", iconColor: "text-blue-400", iconBg: "bg-blue-500/10" },
              { label: "Found Items", href: "/foundItems", icon: "ti-package", iconColor: "text-emerald-400", iconBg: "bg-emerald-500/10" },
              { label: "Lost Items", href: "/lostItems", icon: "ti-alert-triangle", iconColor: "text-red-400", iconBg: "bg-red-500/10" },
              { label: "Report Lost Item", href: "/reportLostItem", icon: "ti-file-description", iconColor: "text-orange-400", iconBg: "bg-orange-500/10" },
              { label: "Smart Search", href: "/ai-search", icon: "ti-sparkles", iconColor: "text-violet-400", iconBg: "bg-violet-500/10" },
              { label: "Item Status", href: "/track", icon: "ti-radar", iconColor: "text-blue-400", iconBg: "bg-blue-500/10" },
            ].map(({ label, href, icon, iconColor, iconBg }) => (
              <Link
                key={href}
                to={href}
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] active:bg-white/[0.06] transition-all duration-150 mb-0.5 group"
              >
                <span className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                  <i className={`ti ${icon} text-[15px] ${iconColor}`} aria-hidden="true" />
                </span>
                <span className="flex-1 text-sm text-white/70 group-hover:text-white transition-colors duration-150">{label}</span>
                <i className="ti ti-chevron-right text-[13px] text-white/10 group-hover:text-white/25 transition-colors duration-150" aria-hidden="true" />
              </Link>
            ))}



            {/* Redundant dashboard links removed, handled at the top */}

            {isLoggedIn && (
              <>
                <div className="h-px bg-white/[0.05] my-2" />
                <button type="button"
                  onClick={() => { closeMobileMenu(); handleSignOut(); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/[0.06] transition-all duration-150 w-full group">
                  <span className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                    <i className="ti ti-logout text-[15px] text-red-400" aria-hidden="true" />
                  </span>
                  <span className="flex-1 text-sm text-red-400/80 group-hover:text-red-400 text-left transition-colors duration-150">Sign Out</span>
                </button>
              </>
            )}

            <div className="h-2" />
          </div>
        </div>

        {/* Desktop links — unchanged */}
        <NavbarCollapse className="hidden md:flex">
          <div className="hidden md:flex md:items-center md:gap-8 lg:gap-12 py-2 md:py-0">
            {[
              { label: "Home", href: "/" },
              { label: "Report Item", href: "/reportlostItem" },
            ].map(({ label, href }) => {
              const isActive = location.pathname === href;
              return (
                <Link
                  key={href}
                  to={href}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 font-semibold text-sm whitespace-nowrap
                    ${isActive ? "text-blue-400 bg-blue-500/10" : "text-gray-200 hover:text-white hover:bg-gray-800"}`}
                >
                  {label}
                </Link>
              );
            })}

            <NavDropdown
              label="Items"
              items={[
                { label: "Lost Items", href: "/lostItems", icon: <FaExclamationTriangle size={11} />, color: "text-red-400", bg: "bg-red-500/10" },
                { label: "Found Items", href: "/foundItems", icon: <FaBoxOpen size={11} />, color: "text-emerald-400", bg: "bg-emerald-500/10" },
              ]}
            />

            <NavDropdown
              label="Tools"
              items={[
                { label: "Smart Search", href: "/ai-search", icon: <FaSearch size={11} />, color: "text-violet-400", bg: "bg-violet-500/10" },
                { label: "Indoor Map", href: "/indoor-map", icon: <FaMap size={11} />, color: "text-cyan-400", bg: "bg-cyan-500/10" },
              ]}
            />

            {[
              { label: "Item Status", href: "/track" },
            ].map(({ label, href }) => {
              const isActive = location.pathname === href;
              return (
                <Link
                  key={href}
                  to={href}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 font-semibold text-sm whitespace-nowrap
                    ${isActive ? "text-blue-400 bg-blue-500/10" : "text-gray-200 hover:text-white hover:bg-gray-800"}`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </NavbarCollapse>
      </Navbar>
    </>
  );
}