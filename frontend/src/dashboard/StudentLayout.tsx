import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUserVerification, signOut } from "../auth/auth";
import {
  FaTachometerAlt, FaBoxOpen, FaSearch, FaClipboardList,
  FaTrophy, FaCog, FaBars, FaTimes, FaHome, FaSignOutAlt,
  FaChevronLeft, FaChevronRight, FaStar, FaChevronDown,
} from "react-icons/fa";

const NAV_ITEMS = [
  {
    section: "MENU",
    items: [
      { label: "Overview",       href: "/dashboard/student",              icon: <FaTachometerAlt size={14} /> },
    ],
  },
  {
    section: "MY ITEMS",
    items: [
      { label: "My Found Items", href: "/dashboard/student/found-items",  icon: <FaBoxOpen size={14} /> },
      { label: "My Lost Items",  href: "/dashboard/student/lost-items",   icon: <FaSearch size={14} /> },
      { label: "My Claims",      href: "/dashboard/student/claims",       icon: <FaClipboardList size={14} /> },
    ],
  },
  {
    section: "COMMUNITY",
    items: [
      { label: "Leaderboard",    href: "/dashboard/student/leaderboard",  icon: <FaTrophy size={14} /> },
    ],
  },
  {
    section: "ACCOUNT",
    items: [
      { label: "Settings",       href: "/dashboard/student/settings",     icon: <FaCog size={14} /> },
    ],
  },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard/student":             { title: "Overview",       subtitle: "Welcome back! Here's a summary of your activity." },
  "/dashboard/student/found-items": { title: "My Found Items", subtitle: "Items you reported as found on campus." },
  "/dashboard/student/lost-items":  { title: "My Lost Items",  subtitle: "Items you reported as lost on campus." },
  "/dashboard/student/claims":      { title: "My Claims",      subtitle: "Track the status of your item claims." },
  "/dashboard/student/leaderboard": { title: "Leaderboard",    subtitle: "Top students ranked by points earned." },
  "/dashboard/student/settings":    { title: "Settings",       subtitle: "Manage your account preferences." },
};

interface StudentLayoutProps {
  children: React.ReactNode;
}

// ── Shared SVG user icon ──────────────────────────────────────────────────────
const UserIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className={`${className} opacity-90`}>
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
  </svg>
);

// ── Profile Dropdown ──────────────────────────────────────────────────────────
const ProfileDropdown = ({
  user,
  onSignOut,
}: {
  user: any;
  onSignOut: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 cursor-pointer focus:outline-none group"
      >
        <div className="relative">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full
            flex items-center justify-center border-2 border-gray-700
            group-hover:border-blue-400 transition-all shadow-lg shrink-0">
            <UserIcon className="w-5 h-5" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500
            border-2 border-gray-900 rounded-full" />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-white text-sm font-semibold leading-none">
            {user?.name || user?.username || "Student"}
          </p>
          <p className="text-gray-500 text-xs mt-0.5 font-mono">{user?.schoolId || "STUDENT"}</p>
        </div>
        <FaChevronDown
          size={10}
          className={`text-gray-500 hidden sm:block transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 w-52 bg-gray-900 border border-white/10
            rounded-xl shadow-2xl overflow-hidden z-50">

            {/* Header — SVG icon, not initial letter */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 border-b border-white/5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500
                flex items-center justify-center shrink-0">
                <UserIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {user?.name || user?.username || "Student"}
                </p>
                <p className="text-gray-500 text-[10px] font-mono truncate">
                  {user?.schoolId || "Student"}
                </p>
              </div>
            </div>

            {/* Links */}
            <div className="py-1">
              <Link to="/dashboard/student/settings" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-gray-300
                  hover:text-white hover:bg-white/5 transition-colors text-sm">
                <FaCog size={12} className="text-gray-500 shrink-0" /> Settings
              </Link>
              <Link to="/" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-gray-300
                  hover:text-white hover:bg-white/5 transition-colors text-sm">
                <FaHome size={12} className="text-gray-500 shrink-0" /> Back to Home
              </Link>
            </div>
            <div className="border-t border-white/5 py-1">
              <button type="button"
                onClick={() => { setOpen(false); onSignOut(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-400
                  hover:text-red-300 hover:bg-red-500/10 transition-colors text-sm">
                <FaSignOutAlt size={12} className="shrink-0" /> Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ── Layout ────────────────────────────────────────────────────────────────────
export default function StudentLayout({ children }: StudentLayoutProps) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const user: any = useUserVerification();
  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleSignOut = () => {
    signOut(navigate);
    window.location.href = "/";
  };

  const isActive = (href: string) =>
    href === "/dashboard/student"
      ? location.pathname === href
      : location.pathname.startsWith(href);

  const pageMeta = (() => {
    const key = Object.keys(pageTitles).find(k =>
      k === "/dashboard/student"
        ? location.pathname === k
        : location.pathname.startsWith(k)
    );
    return pageTitles[key ?? "/dashboard/student"] ?? { title: "Student Dashboard", subtitle: "" };
  })();

  // ── Sidebar Content ──────────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Brand */}
      <div className={`flex items-center gap-3 h-16 px-4 border-b border-white/[0.05] shrink-0
        ${collapsed ? "justify-center px-2" : "justify-between"}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <img
              src="/sas lost and found logo.png" alt="logo"
              className="w-8 h-8 object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div className="leading-tight">
              <p className="text-white text-sm font-semibold tracking-widest">NBSC SAS</p>
              <p className="text-gray-500 text-[10px] uppercase tracking-widest">Lost & Found</p>
            </div>
          </div>
        )}
        {collapsed && (
          <img
            src="/sas lost and found logo.png" alt="logo"
            className="w-8 h-8 object-contain"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className={`hidden md:flex items-center justify-center w-6 h-6 rounded-md
            text-gray-500 hover:text-white hover:bg-white/5 transition-colors
            ${collapsed ? "mx-auto mt-1" : ""}`}
        >
          {collapsed ? <FaChevronRight size={10} /> : <FaChevronLeft size={10} />}
        </button>
        <button onClick={() => setMobileOpen(false)} className="md:hidden text-gray-500 hover:text-white p-1">
          <FaTimes size={14} />
        </button>
      </div>

      {/* Collapsed avatar — single block, SVG icon only */}
      {collapsed && (
        <div className="flex justify-center mt-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500
            flex items-center justify-center">
            <UserIcon className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {NAV_ITEMS.map(({ section, items }) => (
          <div key={section}>
            {!collapsed && (
              <p className="text-[9px] uppercase tracking-widest text-gray-700
                font-bold px-2 mb-1.5">{section}</p>
            )}
            <div className="space-y-0.5">
              {items.map(({ label, href, icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href} to={href}
                    title={collapsed ? label : undefined}
                    className={`relative flex items-center gap-3 px-2.5 py-2.5 rounded-lg
                      text-sm font-medium transition-all duration-150 group
                      ${active
                        ? "bg-blue-500/10 text-blue-400"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                      }
                      ${collapsed ? "justify-center" : ""}`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2
                        w-0.5 h-5 bg-blue-400 rounded-full" />
                    )}
                    <span className={active ? "text-blue-400" : "text-gray-500 group-hover:text-gray-300"}>
                      {icon}
                    </span>
                    {!collapsed && <span>{label}</span>}
                    {collapsed && (
                      <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5
                        bg-gray-800 border border-white/10 text-white text-xs rounded-lg
                        opacity-0 invisible group-hover:opacity-100 group-hover:visible
                        transition-all whitespace-nowrap z-50 shadow-xl">
                        {label}
                      </span>
                    )}
                  </Link>
                );
              })}
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

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`fixed top-0 left-0 h-full z-50 flex flex-col bg-gray-900
        border-r border-white/5 transition-all duration-300 ease-in-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        ${collapsed ? "lg:w-[72px]" : "lg:w-56"}
        w-56`}>
        <SidebarContent />
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className={`w-full flex flex-col min-h-screen bg-gray-950 overflow-x-hidden
        transition-all duration-300
        ${collapsed ? "lg:ml-[72px] lg:w-[calc(100%-72px)]" : "lg:ml-56 lg:w-[calc(100%-224px)]"}`}>

        {/* ── Topbar ──────────────────────────────────────────────────── */}
        <header className="h-16 bg-gray-900/80 backdrop-blur border-b border-white/5
          flex items-center px-4 sm:px-5 gap-4 shrink-0 sticky top-0 z-30">

          <button onClick={() => setMobileOpen(true)}
            className="lg:hidden text-gray-400 hover:text-white p-1.5 rounded-lg
              hover:bg-white/5 transition-colors">
            <FaBars size={16} />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-white text-sm sm:text-base font-semibold tracking-tight truncate">
              {pageMeta.title}
            </h1>
            <p className="text-gray-500 text-xs truncate hidden sm:block">
              {pageMeta.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/dashboard/student/leaderboard"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-yellow-400/10
                text-yellow-300 border border-yellow-400/20 rounded-full text-[11px]
                font-bold hover:bg-yellow-400/15 transition-colors">
              <FaStar size={9} className="text-yellow-400" />
              <span>Points</span>
            </Link>

            <ProfileDropdown user={user} onSignOut={handleSignOut} />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-5 lg:p-7 overflow-auto bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
}