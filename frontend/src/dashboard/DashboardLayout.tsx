import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  FaTachometerAlt, FaSearch, FaClipboardList, FaUsers, FaBoxOpen,
  FaExclamationTriangle, FaCog, FaBars, FaTimes, FaChevronLeft,
  FaChevronRight, FaHome, FaSignOutAlt, FaMapMarkedAlt, FaMapMarkerAlt,
  FaBell, FaCheckCircle, FaChartLine, FaArchive, FaFileAlt,
  FaChevronDown, FaChartBar, FaBullhorn, FaShieldAlt, FaUserGraduate,
  FaUserShield, FaFlag, FaComments, FaMedal, FaQrcode, FaTrophy, FaAward, FaBolt
} from "react-icons/fa";
import { useUserVerification, signOut, setUserLocalStorage } from "../auth/auth";

import Modals from "../components/modal/Modal";
import {
  useGetAllClaimsQuery,
  useGetFoundItemsQuery,
  useGetLostItemsQuery,
  useGetSecurityStatsQuery,
  usePortalLoginMutation,
} from "../redux/api/api";
import { baseApi } from "../redux/api/baseApi";
import ChatbotConcierge from "../components/chatbot/ChatbotConcierge";
import ChatDropdown from "./components/ChatDropdown";
import { Spinner } from "flowbite-react";
import GlobalSearchModal from "./components/GlobalSearchModal";

interface DashboardLayoutProps { children: React.ReactNode; }

interface Notification {
  id: string;
  type: "claim" | "found" | "lost" | "claim_status";
  title: string;
  subtitle: string;
  time: string;
  read: boolean;
  link: string;
}

const menuItems = [
  { title: "Overview", icon: FaTachometerAlt, path: "/dashboard", exact: true },
  { title: "Recognition Feed", icon: FaAward, path: "/dashboard/virtue-spotlight" },

  // Item Management
  { title: "Batch Entry", icon: FaQrcode, path: "/dashboard/bulk-scanner" },
  { title: "Lost Items", icon: FaExclamationTriangle, path: "/dashboard/lost-items" },
  { title: "Found Items", icon: FaSearch, path: "/dashboard/found-items" },
  { title: "Claims", icon: FaClipboardList, path: "/dashboard/claims" },
  { title: "Archive Log", icon: FaArchive, path: "/dashboard/archive" },

  // Insights
  { title: "Analytics", icon: FaChartLine, path: "/dashboard/analytics" },
  { title: "Heatmap", icon: FaMapMarkedAlt, path: "/dashboard/heatmap" },
  { title: "Communication", icon: FaBullhorn, path: "/dashboard/comm-hub" },
  { title: "Content Moderation", icon: FaFlag, path: "/dashboard/moderation" },

  // Student Management
  { title: "Students", icon: FaUserGraduate, path: "/dashboard/students" },
  { title: "Leaderboard", icon: FaTrophy, path: "/dashboard/leaderboard" },
  { title: "Achievements", icon: FaMedal, path: "/dashboard/achievements" },

  // Administration - Ordered for Professional Workflow
  { title: "XP Boost Events", icon: FaBolt, path: "/dashboard/boost-events" },
  { title: "Report", icon: FaFileAlt, path: "/dashboard/report" },
  { title: "Security", icon: FaShieldAlt, path: "/dashboard/security" },
  { title: "Audit Logs", icon: FaClipboardList, path: "/dashboard/audit-logs" },
  { title: "Accounts", icon: FaUserShield, path: "/dashboard/users" },
  { title: "Categories", icon: FaBoxOpen, path: "/dashboard/categories" },
  { title: "Settings", icon: FaCog, path: "/dashboard/settings" },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Overview", subtitle: "Welcome back! Here's an overview of today's activity." },
  "/dashboard/bulk-scanner": { title: "AI Item Entry", subtitle: "Process multiple found items at once using AI-powered recognition." },
  "/dashboard/lost-items": { title: "Lost Items", subtitle: "Track and manage items reported as lost on campus." },
  "/dashboard/found-items": { title: "Found Items", subtitle: "Review and manage all recovered items awaiting claim." },
  "/dashboard/claims": { title: "Claims", subtitle: "Review, verify and process submitted ownership claims." },
  "/dashboard/archive": { title: "Archive Log", subtitle: "Browse archived items and restore or permanently remove them." },
  "/dashboard/analytics": { title: "Analytics", subtitle: "Monthly trends, category breakdown and top reporters, user activity, item flow, and performance metrics." },
  "/dashboard/heatmap": { title: "Heatmap", subtitle: "Visualize where items are most commonly lost or found." },
  "/dashboard/comm-hub": { title: "Communication Hub", subtitle: "Announcements, support tickets, feedback and broadcasts." },
  "/dashboard/virtue-spotlight": { title: "Recognition Feed", subtitle: "Manage recognition posts displayed on the homepage." },
  "/dashboard/achievements": { title: "Achievements", subtitle: "Monitor badge distribution and top community contributors." },
  "/dashboard/boost-events": { title: "XP Boost Events", subtitle: "Create and manage time-limited XP multiplier events to boost engagement." },
  "/dashboard/report": { title: "Report", subtitle: "Generate and export weekly or monthly summary reports." },
  "/dashboard/moderation": { title: "Content Moderation", subtitle: "Review flagged content, manage reports, and moderate community posts." },
  "/dashboard/students": { title: "Students", subtitle: "View and manage all registered student accounts." },
  "/dashboard/users": { title: "Accounts", subtitle: "View and manage all registered system users." },
  "/dashboard/categories": { title: "Categories", subtitle: "Create and organize item categories for better sorting." },
  "/dashboard/settings": { title: "Settings", subtitle: "Configure system preferences and account settings." },
  "/dashboard/security": { title: "Security", subtitle: "Monitor login activity, access control, compliance reports, and point abuse detection." },
  "/dashboard/audit-logs": { title: "Audit Logs", subtitle: "Strict, un-deletable record of all administrative and system actions." },
  "/dashboard/chat": { title: "Messenger", subtitle: "Real-time communication hub for claims and support." },
  "/dashboard/leaderboard": { title: "Leaderboard", subtitle: "View top community contributors ranked by points." },
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const notifIcon = (type: Notification["type"]) => {
  const base = "w-8 h-8 rounded-full flex items-center justify-center shrink-0";
  switch (type) {
    case "claim": return <div className={`${base} bg-yellow-400/10 border border-yellow-400/20`}><FaClipboardList size={12} className="text-yellow-400" /></div>;
    case "claim_status": return <div className={`${base} bg-emerald-400/10 border border-emerald-400/20`}><FaCheckCircle size={12} className="text-emerald-400" /></div>;
    case "found": return <div className={`${base} bg-cyan-400/10 border border-cyan-400/20`}><FaSearch size={12} className="text-cyan-400" /></div>;
    case "lost": return <div className={`${base} bg-red-400/10 border border-red-400/20`}><FaExclamationTriangle size={12} className="text-red-400" /></div>;
  }
};

const getSavedLatestTs = (type: string): string | null => {
  try {
    const saved = localStorage.getItem("admin_notifications");
    if (!saved) return null;
    const notifs: Notification[] = JSON.parse(saved);
    const filtered = notifs.filter(n => type === "claims" ? n.type === "claim" : n.type === type);
    if (filtered.length === 0) return null;
    return filtered.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())[0].time;
  } catch { return null; }
};

// ── Notification Bell ─────────────────────────────────────────────────────────
const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try { const saved = localStorage.getItem("admin_notifications"); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const location = useLocation();
  const bellRef = useRef<HTMLDivElement>(null);
  const latestClaimTs = useRef<string | null>(getSavedLatestTs("claims"));
  const latestFoundTs = useRef<string | null>(getSavedLatestTs("found"));
  const latestLostTs = useRef<string | null>(getSavedLatestTs("lost"));
  const initialized = useRef({ claims: getSavedLatestTs("claims") !== null, found: getSavedLatestTs("found") !== null, lost: getSavedLatestTs("lost") !== null });
  const pollOpts = { pollingInterval: 8000, refetchOnFocus: true, refetchOnReconnect: true };
  // Sort by newest first with a generous limit so ALL batch-entered items are detected,
  // not just whichever one lands in the first page of an alphabetical sort.
  const notifQueryParams = { sortBy: "createdAt", sortOrder: "desc", limit: 50 };

  const { data: claimsData } = useGetAllClaimsQuery(undefined, pollOpts);
  const { data: foundData } = useGetFoundItemsQuery(notifQueryParams, pollOpts);
  const { data: lostData } = useGetLostItemsQuery(notifQueryParams, pollOpts);

  // Close on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const toArray = (data: any): any[] => { if (!data) return []; if (Array.isArray(data)) return data; if (Array.isArray(data.data)) return data.data; return []; };

  const mergeNotifications = (incoming: Notification[], prev: Notification[]): Notification[] => {
    const map = new Map<string, Notification>();
    [...prev, ...incoming].forEach(n => { if (!map.has(n.id)) map.set(n.id, n); });
    return Array.from(map.values()).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 50);
  };

  const RECENT_MS = 24 * 60 * 60 * 1000;

  const processItems = <T extends { id: string; createdAt: string }>(
    rawData: any, latestTs: React.MutableRefObject<string | null>,
    initKey: keyof typeof initialized.current, makeNotif: (item: T) => Notification
  ) => {
    const items = [...toArray(rawData)].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) as T[];
    if (items.length === 0) return;
    if (!initialized.current[initKey]) {
      latestTs.current = items[0].createdAt;
      initialized.current[initKey] = true;
      const recentItems = items.filter(i => new Date(i.createdAt).getTime() > Date.now() - RECENT_MS);
      if (recentItems.length > 0) setNotifications(prev => mergeNotifications(recentItems.map(makeNotif), prev));
      return;
    }
    const newItems = latestTs.current ? items.filter(i => new Date(i.createdAt).getTime() > new Date(latestTs.current!).getTime()) : [];
    if (newItems.length > 0) { latestTs.current = newItems[0].createdAt; setNotifications(prev => mergeNotifications(newItems.map(makeNotif), prev)); }
  };

  useEffect(() => { processItems(claimsData, latestClaimTs, "claims", (claim: any): Notification => ({ id: `claim-${claim.id}`, type: "claim", title: "New Claim Submitted", subtitle: `${claim.claimantName || "Someone"} claimed "${claim.foundItem?.foundItemName || "an item"}"`, time: claim.createdAt, read: false, link: "/dashboard/claims" })); }, [claimsData]);
  useEffect(() => { processItems(foundData, latestFoundTs, "found", (item: any): Notification => ({ id: `found-${item.id}`, type: "found", title: "New Found Item Reported", subtitle: `"${item.foundItemName || "Unknown item"}" found at ${item.location || "unknown location"}`, time: item.createdAt, read: false, link: "/dashboard/found-items" })); }, [foundData]);
  useEffect(() => { processItems(lostData, latestLostTs, "lost", (item: any): Notification => ({ id: `lost-${item.id}`, type: "lost", title: "New Lost Item Reported", subtitle: `"${item.lostItemName || "Unknown item"}" lost at ${item.location || "unknown location"}`, time: item.createdAt, read: false, link: "/dashboard/lost-items" })); }, [lostData]);
  useEffect(() => { try { localStorage.setItem("admin_notifications", JSON.stringify(notifications)); } catch { } }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const markAllRead = () => { const u = notifications.map(n => ({ ...n, read: true })); setNotifications(u); try { localStorage.setItem("admin_notifications", JSON.stringify(u)); } catch { } };
  const markOneRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const clearAll = () => { setNotifications([]); latestClaimTs.current = null; latestFoundTs.current = null; latestLostTs.current = null; initialized.current = { claims: false, found: false, lost: false }; try { localStorage.removeItem("admin_notifications"); } catch { } };

  return (
    <div ref={bellRef} className="relative">
      <button onClick={() => setOpen(!open)} aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white transition-all">
        <FaBell size={14} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-gray-900 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Invisible backdrop to close on outside click */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-[68px] sm:top-11 w-auto sm:w-96 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <FaBell size={13} className="text-blue-400" />
                <p className="text-white text-sm font-semibold">Notifications</p>
                {unreadCount > 0 && <span className="bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount} new</span>}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && <button onClick={markAllRead} className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors">Mark all read</button>}
                {notifications.length > 0 && <button onClick={clearAll} className="text-gray-600 hover:text-gray-400 text-xs transition-colors">Clear</button>}
                <button onClick={() => setOpen(false)} className="sm:hidden text-gray-500 hover:text-white ml-1"><FaTimes size={13} /></button>
              </div>
            </div>
            <div className="max-h-[60vh] sm:max-h-[420px] overflow-y-auto divide-y divide-white/5 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                  <FaBell size={24} className="mb-3 opacity-30" />
                  <p className="text-sm">No notifications yet</p>
                  <p className="text-xs mt-1 opacity-60">New claims and items will appear here</p>
                </div>
              ) : (
                [...notifications].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).map(notif => (
                  <Link key={notif.id} to={notif.link} onClick={() => { markOneRead(notif.id); setOpen(false); }}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors ${!notif.read ? "bg-white/[0.02]" : ""}`}>
                    {notifIcon(notif.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-semibold truncate ${!notif.read ? "text-white" : "text-gray-300"}`}>{notif.title}</p>
                        {!notif.read && <span className="shrink-0 w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1" />}
                      </div>
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-2 leading-relaxed">{notif.subtitle}</p>
                      <p className="text-gray-700 text-[10px] mt-1">{timeAgo(notif.time)}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-white/5">
                <Link to="/dashboard" onClick={() => setOpen(false)} className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors block text-center">View all activity</Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ── Custom Profile Dropdown ───────────────────────────────────────────────────
const ProfileDropdown = ({ initials, user, handleSignOut }: { initials: string; user: any; handleSignOut: () => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(prev => !prev)} className="flex items-center gap-2.5 cursor-pointer group focus:outline-none">
        <div className="relative">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center border-2 border-gray-700 group-hover:border-blue-400 transition-all duration-200 shadow-lg text-white font-bold text-sm shrink-0">{initials}</div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-gray-900 rounded-full" />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-white text-sm font-semibold leading-none">{user?.username || user?.name || "Admin"}</p>
          <p className="text-gray-500 text-xs mt-0.5">{user?.role || "ADMIN"}</p>
        </div>
        <FaChevronDown size={10} className={`text-gray-500 hidden sm:block transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          {/* Invisible backdrop to close on outside click */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-11 w-52 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 border-b border-white/5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-sm font-bold shrink-0">{initials}</div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.username || user?.name || "Admin"}</p>
                <p className="text-gray-400 text-xs truncate">{user?.email || ""}</p>
              </div>
            </div>
            <div className="py-1">
              <Link to="/dashboard/settings" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-sm">
                <FaCog size={13} className="text-gray-500 shrink-0" /> Settings
              </Link>
              <Link to="/" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-sm">
                <FaHome size={13} className="text-gray-500 shrink-0" /> Back to Home
              </Link>
            </div>
            <div className="border-t border-white/5 py-1">
              <button type="button" onClick={() => { setOpen(false); handleSignOut(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-sm">
                <FaSignOutAlt size={13} className="shrink-0" /> Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Helpers for SAS Portal public bypass ────────────────────────────────────
const checkPublicBypass = (pathname: string, search: string): boolean => {
  if (pathname !== "/dashboard/analytics") return false;
  const params = new URLSearchParams(search);
  if (params.get("source") === "sas-portal-public") return true;
  try {
    const ref = document.referrer;
    if (ref && (ref.includes(".github.io") || ref.includes("localhost"))) return true;
  } catch { /* no referrer access */ }
  return false;
};

// ─── Main Layout ──────────────────────────────────────────────────────────────
const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "q") {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const [isAuthenticating, setIsAuthenticating] = useState(() => {
    // Check if URL has portal tokens on initial load to prevent flash/redirect
    return !!(searchParams.get("portalToken") || searchParams.get("token"));
  });
  const [portalLogin] = usePortalLoginMutation();

  const user = useUserVerification() as any;
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  // ── Portal Interception Auth ──────────────────────────────────────────────
  useEffect(() => {
    const portalUser = searchParams.get("portalUser");
    const portalToken = searchParams.get("portalToken");
    const directToken = searchParams.get("token");

    const authPayloadToken = portalToken || directToken;
    const authPayloadUser = portalUser || "admin"; // Default to admin if user omitted but token provided

    const authenticate = async () => {
      try {
        if (authPayloadToken) {
          // Exchange the foreign portal token for a valid backend JWT
          const res: any = await portalLogin({
            portalUser: authPayloadUser,
            portalToken: authPayloadToken
          });

          if (res?.data?.data?.token) {
            setUserLocalStorage(res.data.data.token);
          } else {
            console.warn("Failed to exchange portal token for backend JWT");
          }

          setIsAuthenticating(false);

          // Clean up URL
          if (directToken) searchParams.delete("token");
          if (portalToken) searchParams.delete("portalToken");
          if (portalUser) searchParams.delete("portalUser");
          setSearchParams(searchParams, { replace: true });
        } else {
          setIsAuthenticating(false);
        }
      } catch (error) {
        console.error("Portal auto-login exchange failed in dashboard:", error);
        setIsAuthenticating(false);
      }
    };

    if (authPayloadToken) {
      authenticate();
    }
  }, [searchParams, portalLogin, setSearchParams]);

  // ── Public bypass check ───────────────────────────────────────────
  const isPublicBypass = checkPublicBypass(location.pathname, location.search);

  // ── Auth guard: if no token and no bypass, redirect to login ──────
  useEffect(() => {
    if (!token && !isPublicBypass && !isAuthenticating) {
      navigate("/login", { replace: true });
    }
  }, [token, isPublicBypass, isAuthenticating, navigate]);

  // Close sidebar on route change (mobile) — must be before any early return
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#060a12] text-white">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="xl" />
          <p className="text-sm text-gray-400 animate-pulse tracking-widest uppercase">
            Authenticating with SAS Portal...
          </p>
        </div>
      </div>
    );
  }

  // ── Public bypass render: clean iframe-friendly layout ────────────
  if (isPublicBypass) {
    return (
      <div className="min-h-screen bg-gray-950 overflow-x-hidden">
        <main className="p-4 sm:p-5 lg:p-7 bg-gray-950 min-h-screen custom-scrollbar overflow-auto">
          {children}
        </main>
      </div>
    );
  }

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : (location.pathname === path || location.pathname.startsWith(path + "/"));

  const getPageMeta = () => {
    const key = Object.keys(pageTitles).find(k =>
      k === "/dashboard" ? location.pathname === k : location.pathname.startsWith(k)
    );
    return pageTitles[key ?? "/dashboard"] ?? { title: "Dashboard", subtitle: "" };
  };

  const handleSignOut = () => {
    signOut();
    Modals({ message: "Signed out successfully", status: true });
    window.location.href = "/";
  };

  const pageMeta = getPageMeta();
  const initials =
    user?.username?.charAt(0)?.toUpperCase() ||
    user?.name?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() || "A";

  return (
    <div className="min-h-screen bg-gray-950 lg:flex overflow-x-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-50 flex flex-col bg-gray-900 border-r border-white/5
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        ${sidebarCollapsed ? "lg:w-[72px]" : "lg:w-60"}
        w-60`}>

        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-white/5 px-4 shrink-0 ${sidebarCollapsed ? "justify-center" : "justify-between"}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5">
              <img
                src="/sas lost and found logo.png"
                alt="SAS Lost and Found Logo"
                className="w-8 h-8 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <div className="leading-tight">
                <p className="text-white text-sm font-semibold tracking-widest">NBSC SAS</p>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest">Lost & Found</p>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <img
              src="/sas lost and found logo.png"
              alt="SAS Lost and Found Logo"
              className="w-8 h-8 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-white p-1">
            <FaTimes size={14} />
          </button>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`hidden lg:flex items-center justify-center w-6 h-6 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-colors ${sidebarCollapsed ? "mx-auto mt-1" : ""}`}>
            {sidebarCollapsed ? <FaChevronRight size={10} /> : <FaChevronLeft size={10} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 custom-scrollbar">
          {!sidebarCollapsed && <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium px-2 mb-3">Menu</p>}

          {menuItems.map((item, idx) => {
            const active = isActive(item.path, item.exact);
            const Icon = item.icon;

            // Section dividers - Path-based for robustness
            const sectionTitles: Record<string, string> = {
              "/dashboard/lost-items": "Item Management",
              "/dashboard/analytics": "Insights",
              "/dashboard/students": "Student Management",
              "/dashboard/report": "Administration"
            };
            const showDivider = !sidebarCollapsed ? sectionTitles[item.path] : null;

            return (
              <div key={item.path}>
                {showDivider && (
                  <p className="text-[9px] uppercase tracking-widest text-gray-700 font-semibold px-2 pt-4 pb-1.5">
                    {showDivider}
                  </p>
                )}
                <Link to={item.path} onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.title : undefined}
                  className={`relative flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                    ${active ? "bg-cyan-500/10 text-cyan-400" : "text-gray-400 hover:text-white hover:bg-white/5"}
                    ${sidebarCollapsed ? "justify-center" : ""}`}>
                  {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-400 rounded-full" />}
                  <Icon size={14} className={active ? "text-cyan-400" : "text-gray-500 group-hover:text-gray-300"} />
                  {!sidebarCollapsed && <span>{item.title}</span>}
                  {sidebarCollapsed && (
                    <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-gray-800 border border-white/10 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl">
                      {item.title}
                    </span>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className={`w-full flex flex-col min-h-screen bg-gray-950 overflow-x-hidden transition-all duration-300 ${sidebarCollapsed ? "lg:ml-[72px] lg:w-[calc(100%-72px)]" : "lg:ml-60 lg:w-[calc(100%-240px)]"}`}>

        {/* Topbar */}
        <header className="h-16 bg-gray-900/80 backdrop-blur border-b border-white/5 flex items-center justify-between px-4 sm:px-5 gap-4 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3.5 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors shrink-0">
              <FaBars size={16} />
            </button>
            <div className="min-w-0">
              <h1 className="text-white text-sm sm:text-base font-semibold tracking-tight truncate">{pageMeta.title}</h1>
              <p className="text-gray-500 text-xs truncate hidden sm:block">{pageMeta.subtitle}</p>
            </div>
          </div>

          {/* Centered Search Bar */}
          <div className="hidden md:flex flex-1 justify-center max-w-xl mx-4">
            <button
              onClick={() => setSearchModalOpen(true)}
              className="w-full max-w-md flex items-center justify-between px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white transition-all text-xs focus:outline-none"
            >
              <div className="flex items-center gap-2.5">
                <FaSearch size={12} className="text-gray-500" />
                <span>Search dashboard, items, claims...</span>
              </div>
              <kbd className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono font-semibold text-gray-500">Ctrl+Q</kbd>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Search Button */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white transition-all"
              aria-label="Search"
            >
              <FaSearch size={13} />
            </button>

            <ChatbotConcierge />
            <ChatDropdown />
            <NotificationBell />
            <ProfileDropdown initials={initials} user={user} handleSignOut={handleSignOut} />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-5 lg:p-7 overflow-auto bg-gray-950 custom-scrollbar">{children}</main>
      </div>

      <GlobalSearchModal open={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </div>
  );
};

export default DashboardLayout;