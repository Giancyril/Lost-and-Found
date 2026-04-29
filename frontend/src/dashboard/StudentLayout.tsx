import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUserVerification, signOut } from "../auth/auth";
import {
  FaTachometerAlt, FaBoxOpen, FaSearch, FaClipboardList,
  FaTrophy, FaCog, FaBars, FaTimes, FaHome, FaSignOutAlt,
  FaIdCard, FaChevronLeft,
} from "react-icons/fa";
import { MdVerified } from "react-icons/md";

const NAV_ITEMS = [
  {
    section: "MENU",
    items: [
      { label: "Overview",      href: "/dashboard/student",             icon: <FaTachometerAlt size={15} /> },
    ],
  },
  {
    section: "MY ITEMS",
    items: [
      { label: "My Found Items", href: "/dashboard/student/found-items", icon: <FaBoxOpen size={15} /> },
      { label: "My Lost Items",  href: "/dashboard/student/lost-items",  icon: <FaSearch size={15} /> },
      { label: "My Claims",      href: "/dashboard/student/claims",      icon: <FaClipboardList size={15} /> },
    ],
  },
  {
    section: "COMMUNITY",
    items: [
      { label: "Leaderboard",   href: "/dashboard/student/leaderboard", icon: <FaTrophy size={15} /> },
    ],
  },
  {
    section: "ACCOUNT",
    items: [
      { label: "Settings",      href: "/dashboard/student/settings",    icon: <FaCog size={15} /> },
    ],
  },
];

interface StudentLayoutProps {
  children: React.ReactNode;
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const user: any = useUserVerification();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const initial =
    user?.name?.charAt(0)?.toUpperCase() ||
    user?.username?.charAt(0)?.toUpperCase() || "S";

  const handleSignOut = () => {
    signOut(navigate);
    window.location.href = "/";
  };

  const isActive = (href: string) =>
    href === "/dashboard/student"
      ? location.pathname === href
      : location.pathname.startsWith(href);

  // ── Sidebar content (shared between desktop + mobile) ─────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Brand */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/[0.06] ${collapsed ? "justify-center px-2" : ""}`}>
        <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0">
          <img
            src="/sas lost and found logo.png"
            alt="logo"
            className="w-5 h-5 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-white font-black text-xs tracking-widest leading-none">NBSC SAS</p>
            <p className="text-gray-600 text-[9px] mt-0.5 leading-tight">Lost & Found</p>
          </div>
        )}
      </div>

      {/* Student profile pill */}
      {!collapsed && (
        <div className="mx-3 mt-3 p-3 rounded-xl bg-blue-500/8 border border-blue-500/15">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0">
              <span className="text-white font-black text-sm">{initial}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-bold truncate leading-none">
                {user?.name || user?.username || "Student"}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <MdVerified size={9} className="text-blue-400 shrink-0" />
                <p className="text-gray-500 text-[10px] truncate font-mono">
                  {user?.schoolId ?? "Student"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed avatar */}
      {collapsed && (
        <div className="flex justify-center mt-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
            <span className="text-white font-black text-sm">{initial}</span>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV_ITEMS.map(({ section, items }) => (
          <div key={section}>
            {!collapsed && (
              <p className="text-gray-600 text-[9px] font-bold tracking-widest uppercase px-2 mb-1">
                {section}
              </p>
            )}
            <div className="space-y-0.5">
              {items.map(({ label, href, icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    to={href}
                    title={collapsed ? label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                      ${active
                        ? "bg-blue-500/15 text-white border border-blue-500/20"
                        : "text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]"
                      }
                      ${collapsed ? "justify-center px-2" : ""}
                    `}
                  >
                    <span className={active ? "text-blue-400" : "text-gray-600"}>{icon}</span>
                    {!collapsed && <span>{label}</span>}
                    {!collapsed && active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className={`p-2 border-t border-white/[0.06] space-y-0.5 ${collapsed ? "px-1" : ""}`}>
        <Link
          to="/"
          title={collapsed ? "Home" : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500
            hover:text-gray-200 hover:bg-white/[0.04] transition-all
            ${collapsed ? "justify-center px-2" : ""}`}
        >
          <FaHome size={14} className="shrink-0" />
          {!collapsed && <span>Back to Home</span>}
        </Link>
        <button
          onClick={handleSignOut}
          title={collapsed ? "Sign Out" : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
            text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all
            ${collapsed ? "justify-center px-2" : ""}`}
        >
          <FaSignOutAlt size={14} className="shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">

      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col fixed top-0 left-0 h-full z-30
          bg-gray-900 border-r border-white/[0.06] transition-all duration-300
          ${collapsed ? "w-16" : "w-56"}`}
      >
        <SidebarContent />

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-gray-800
            border border-white/[0.1] flex items-center justify-center
            hover:bg-gray-700 transition-colors z-10"
        >
          <FaChevronLeft
            size={9}
            className={`text-gray-400 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </aside>

      {/* ── Mobile Overlay ───────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile Sidebar ───────────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 h-full w-56 z-50 bg-gray-900 border-r border-white/[0.06]
          transition-transform duration-300 md:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setMobileOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-lg
              text-gray-500 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <FaTimes size={12} />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300
        ${collapsed ? "md:ml-16" : "md:ml-56"}`}>

        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-20 bg-gray-950/90 backdrop-blur
          border-b border-white/[0.06] px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg
              text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <FaBars size={14} />
          </button>
          <div className="flex items-center gap-2">
            <FaIdCard size={12} className="text-blue-400" />
            <p className="text-white font-bold text-sm">Student Dashboard</p>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}