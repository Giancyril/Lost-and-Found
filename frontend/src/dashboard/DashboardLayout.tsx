import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaTachometerAlt, FaSearch, FaClipboardList, FaUsers, FaBoxOpen,
  FaExclamationTriangle, FaCog, FaBars, FaTimes, FaChevronLeft,
  FaChevronRight, FaHome, FaSignOutAlt, FaMapMarkedAlt,
  FaBell, FaCheckCircle,
} from "react-icons/fa";
import { useUserVerification, signOut } from "../auth/auth";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Dropdown, DropdownHeader, DropdownItem, DropdownDivider } from "flowbite-react";
import Modals from "../components/modal/Modal";
import {
  useGetAllClaimsQuery,
  useGetFoundItemsQuery,
  useGetLostItemsQuery,
} from "../redux/api/api";

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
  { title: "Overview",     icon: FaTachometerAlt,       path: "/dashboard",             exact: true },
  { title: "Found Items",  icon: FaSearch,              path: "/dashboard/found-items"  },
  { title: "Lost Items",   icon: FaExclamationTriangle, path: "/dashboard/lost-items"   },
  { title: "Claims",       icon: FaClipboardList,       path: "/dashboard/claims"       },
  { title: "Heatmap",      icon: FaMapMarkedAlt,        path: "/dashboard/heatmap"      },
  { title: "Users",        icon: FaUsers,               path: "/dashboard/users"        },
  { title: "Categories",   icon: FaBoxOpen,             path: "/dashboard/categories"   },
  { title: "Settings",     icon: FaCog,                 path: "/dashboard/settings"     },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard":             { title: "Overview",    subtitle: "Welcome back! Here's an overview of today's activity." },
  "/dashboard/found-items": { title: "Found Items", subtitle: "Manage all reported found items" },
  "/dashboard/lost-items":  { title: "Lost Items",  subtitle: "Track items reported as lost" },
  "/dashboard/claims":      { title: "Claims",      subtitle: "Review and verify item claims" },
  "/dashboard/heatmap":     { title: "Heatmap",     subtitle: "See where items are most commonly lost or found" },
  "/dashboard/users":       { title: "Users",       subtitle: "Manage registered users" },
  "/dashboard/categories":  { title: "Categories",  subtitle: "Organize item categories" },
  "/dashboard/settings":    { title: "Settings",    subtitle: "Configure system preferences" },
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
    case "claim":        return <div className={`${base} bg-yellow-400/10 border border-yellow-400/20`}><FaClipboardList  size={12} className="text-yellow-400" /></div>;
    case "claim_status": return <div className={`${base} bg-emerald-400/10 border border-emerald-400/20`}><FaCheckCircle   size={12} className="text-emerald-400" /></div>;
    case "found":        return <div className={`${base} bg-cyan-400/10 border border-cyan-400/20`}><FaSearch           size={12} className="text-cyan-400" /></div>;
    case "lost":         return <div className={`${base} bg-red-400/10 border border-red-400/20`}><FaExclamationTriangle size={12} className="text-red-400" /></div>;
  }
};

// ─── Notification Bell ────────────────────────────────────────────────────────
const NotificationBell = () => {
  const [open, setOpen]                   = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const bellRef                           = useRef<HTMLDivElement>(null);

  // We track the latest createdAt timestamp we've already processed per feed.
  // This is more reliable than seenIds because RTK Query may return the same
  // object reference from cache, so a Set comparison can silently fail.
  const latestClaimTs = useRef<string | null>(null);
  const latestFoundTs = useRef<string | null>(null);
  const latestLostTs  = useRef<string | null>(null);
  const initialized   = useRef({ claims: false, found: false, lost: false });

  const pollOpts = { pollingInterval: 10000, refetchOnFocus: true, refetchOnReconnect: true };

  const { data: claimsData }  = useGetAllClaimsQuery(undefined, pollOpts);
  const { data: foundData }   = useGetFoundItemsQuery({},        pollOpts);
  const { data: lostData }    = useGetLostItemsQuery({},         pollOpts);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toArray = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    return [];
  };

  // Items created within this window on first load are shown as notifications
  const RECENT_MS = 2 * 60 * 1000; // 2 minutes

  const processItems = <T extends { id: string; createdAt: string }>(
    rawData: any,
    latestTs: React.MutableRefObject<string | null>,
    initKey: keyof typeof initialized.current,
    makeNotif: (item: T) => Notification
  ) => {
    const items = [...toArray(rawData)].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ) as T[];
    if (items.length === 0) return;

    if (!initialized.current[initKey]) {
      // Seed the cutoff timestamp
      latestTs.current = items[0].createdAt;
      initialized.current[initKey] = true;

      // Show items created in the last RECENT_MS as notifications immediately
      const recentCutoff = Date.now() - RECENT_MS;
      const recentItems = items.filter(
        i => new Date(i.createdAt).getTime() > recentCutoff
      );
      if (recentItems.length > 0) {
        setNotifications(prev =>
          [...recentItems.map(makeNotif), ...prev].slice(0, 50)
        );
      }
      return;
    }

    const cutoff = latestTs.current;
    const newItems = cutoff
      ? items.filter(i => new Date(i.createdAt).getTime() > new Date(cutoff).getTime())
      : [];

    if (newItems.length > 0) {
      latestTs.current = newItems[0].createdAt;
      setNotifications(prev => [...newItems.map(makeNotif), ...prev].slice(0, 50));
    }
  };

  // ── Claims ──
  useEffect(() => {
    processItems(
      claimsData,
      latestClaimTs,
      "claims",
      (claim: any): Notification => ({
        id: `claim-${claim.id}-${claim.createdAt}`,
        type: "claim",
        title: "New Claim Submitted",
        subtitle: `${claim.claimantName || "Someone"} claimed "${claim.foundItem?.foundItemName || "an item"}"`,
        time: claim.createdAt,
        read: false,
        link: "/dashboard/claims",
      })
    );
  }, [claimsData]);

  // ── Found Items ──
  useEffect(() => {
    processItems(
      foundData,
      latestFoundTs,
      "found",
      (item: any): Notification => ({
        id: `found-${item.id}-${item.createdAt}`,
        type: "found",
        title: "New Found Item Reported",
        subtitle: `"${item.foundItemName || item.name || "Unknown item"}" found at ${item.location || "unknown location"}`,
        time: item.createdAt,
        read: false,
        link: "/dashboard/found-items",
      })
    );
  }, [foundData]);

  // ── Lost Items ──
  useEffect(() => {
    processItems(
      lostData,
      latestLostTs,
      "lost",
      (item: any): Notification => ({
        id: `lost-${item.id}-${item.createdAt}`,
        type: "lost",
        title: "New Lost Item Reported",
        subtitle: `"${item.lostItemName || item.name || "Unknown item"}" lost at ${item.location || "unknown location"}`,
        time: item.createdAt,
        read: false,
        link: "/dashboard/lost-items",
      })
    );
  }, [lostData]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const markOneRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const clearAll    = () => setNotifications([]);

  return (
    <div ref={bellRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white transition-all"
      >
        <FaBell size={14} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-gray-900 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-[68px] sm:top-11 w-auto sm:w-96 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <FaBell size={13} className="text-cyan-400" />
              <p className="text-white text-sm font-semibold">Notifications</p>
              {unreadCount > 0 && (
                <span className="bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-cyan-400 hover:text-cyan-300 text-xs font-medium transition-colors">
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
                  Clear
                </button>
              )}
              <button onClick={() => setOpen(false)} className="sm:hidden text-gray-500 hover:text-white ml-1">
                <FaTimes size={13} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[60vh] sm:max-h-[420px] overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                <FaBell size={24} className="mb-3 opacity-30" />
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs mt-1 opacity-60">New claims and items will appear here</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <Link
                  key={notif.id}
                  to={notif.link}
                  onClick={() => { markOneRead(notif.id); setOpen(false); }}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors ${!notif.read ? "bg-white/[0.02]" : ""}`}
                >
                  {notifIcon(notif.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-semibold truncate ${!notif.read ? "text-white" : "text-gray-300"}`}>
                        {notif.title}
                      </p>
                      {!notif.read && <span className="shrink-0 w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1" />}
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5 line-clamp-2 leading-relaxed">{notif.subtitle}</p>
                    <p className="text-gray-700 text-[10px] mt-1">{timeAgo(notif.time)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-white/5">
              <Link to="/dashboard/claims" onClick={() => setOpen(false)} className="text-cyan-400 hover:text-cyan-300 text-xs font-medium transition-colors">
                View all activity →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Layout ──────────────────────────────────────────────────────────────
const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen]           = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const user = useUserVerification() as any;

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : (location.pathname === path || location.pathname.startsWith(path + "/"));

  const getPageMeta = () => {
    const key = Object.keys(pageTitles).find((k) =>
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
    user?.name?.charAt(0)?.toUpperCase() ||
    user?.username?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() || "A";

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-50 flex flex-col bg-gray-900 border-r border-white/5 transition-all duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 ${sidebarCollapsed ? "lg:w-[72px]" : "lg:w-60"} w-60`}>

        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-white/5 px-4 shrink-0 ${sidebarCollapsed ? "justify-center" : "justify-between"}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5">
              <img
                src="https://nbsc.edu.ph/wp-content/uploads/2024/03/cropped-NBSC_NewLogo_icon.png"
                alt="NBSC SAS Logo"
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
              src="https://nbsc.edu.ph/wp-content/uploads/2024/03/cropped-NBSC_NewLogo_icon.png"
              alt="NBSC SAS Logo"
              className="w-8 h-8 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-white p-1">
            <FaTimes size={14} />
          </button>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`hidden lg:flex items-center justify-center w-6 h-6 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-colors ${sidebarCollapsed ? "mx-auto mt-1" : ""}`}
          >
            {sidebarCollapsed ? <FaChevronRight size={10} /> : <FaChevronLeft size={10} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {!sidebarCollapsed && <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium px-2 mb-3">Menu</p>}
          {menuItems.map((item) => {
            const active = isActive(item.path, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? item.title : undefined}
                className={`relative flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                  ${active ? "bg-cyan-500/10 text-cyan-400" : "text-gray-400 hover:text-white hover:bg-white/5"}
                  ${sidebarCollapsed ? "justify-center" : ""}`}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-400 rounded-full" />}
                <Icon size={14} className={active ? "text-cyan-400" : "text-gray-500 group-hover:text-gray-300"} />
                {!sidebarCollapsed && <span>{item.title}</span>}
                {sidebarCollapsed && (
                  <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-gray-800 border border-white/10 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl">
                    {item.title}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="shrink-0 border-t border-white/5 px-3 py-4 space-y-0.5">
          <Link
            to="/"
            title={sidebarCollapsed ? "Back to Home" : undefined}
            className={`flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors group relative ${sidebarCollapsed ? "justify-center" : ""}`}
          >
            <FaHome size={14} className="text-gray-500 group-hover:text-gray-300" />
            {!sidebarCollapsed && <span>Back to Home</span>}
            {sidebarCollapsed && <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-gray-800 border border-white/10 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible whitespace-nowrap z-50 shadow-xl">Back to Home</span>}
          </Link>
          <button
            onClick={handleSignOut}
            title={sidebarCollapsed ? "Sign Out" : undefined}
            className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors group relative ${sidebarCollapsed ? "justify-center" : ""}`}
          >
            <FaSignOutAlt size={14} className="text-gray-500 group-hover:text-red-400" />
            {!sidebarCollapsed && <span>Sign Out</span>}
            {sidebarCollapsed && <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-gray-800 border border-white/10 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible whitespace-nowrap z-50 shadow-xl">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-60"}`}>

        {/* Topbar */}
        <header className="h-16 bg-gray-900/80 backdrop-blur border-b border-white/5 flex items-center px-4 sm:px-5 gap-4 shrink-0 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <FaBars size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-white text-sm sm:text-base font-semibold tracking-tight truncate">{pageMeta.title}</h1>
            <p className="text-gray-500 text-xs truncate hidden sm:block">{pageMeta.subtitle}</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />

            <Dropdown arrowIcon={false} inline label={
              <div className="flex items-center gap-2 sm:gap-2.5 cursor-pointer">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {initials}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-gray-900 rounded-full" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-white text-xs font-medium leading-none">{user?.username || user?.name || "Admin"}</p>
                  <p className="text-gray-500 text-[10px] mt-0.5">{user?.role || "ADMIN"}</p>
                </div>
              </div>
            } className="!bg-gray-800 !border !border-white/10 !shadow-2xl !rounded-xl overflow-hidden">
              <DropdownHeader className="!bg-gray-700/50 border-b border-white/5">
                <div className="flex items-center gap-3 py-1">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{user?.username || user?.name || "Admin"}</p>
                    <p className="text-gray-400 text-xs truncate">{user?.email || ""}</p>
                  </div>
                </div>
              </DropdownHeader>
              <div className="py-1">
                <DropdownItem className="!text-gray-300 hover:!bg-white/5 hover:!text-white !text-sm">
                  <Link to="/dashboard/settings" className="flex items-center gap-2.5 w-full">
                    <FaCog size={13} className="text-gray-500" /><span>Settings</span>
                  </Link>
                </DropdownItem>
                <DropdownItem className="!text-gray-300 hover:!bg-white/5 hover:!text-white !text-sm">
                  <Link to="/" className="flex items-center gap-2.5 w-full">
                    <FaHome size={13} className="text-gray-500" /><span>Back to Home</span>
                  </Link>
                </DropdownItem>
              </div>
              <DropdownDivider className="!border-white/5" />
              <div className="py-1">
                <DropdownItem onClick={handleSignOut} className="!text-red-400 hover:!bg-red-500/10 hover:!text-red-300 !text-sm">
                  <div className="flex items-center gap-2.5 w-full">
                    <FaSignOutAlt size={13} /><span>Sign out</span>
                  </div>
                </DropdownItem>
              </div>
            </Dropdown>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-5 lg:p-7 overflow-auto">{children}</main>
      </div>

      <ToastContainer position="top-right" autoClose={4000} hideProgressBar newestOnTop closeOnClick theme="dark"
        toastClassName="!bg-gray-800 !border !border-white/10 !rounded-xl !text-sm !text-white shadow-2xl" />
    </div>
  );
};

export default DashboardLayout;