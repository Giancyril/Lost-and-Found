import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaTachometerAlt, FaSearch, FaClipboardList, FaUsers, FaBoxOpen,
  FaExclamationTriangle, FaCog, FaBars, FaTimes, FaChevronLeft,
  FaChevronRight, FaHome, FaSignOutAlt,
} from "react-icons/fa";
import { useUserVerification, signOut } from "../auth/auth";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Dropdown, DropdownHeader, DropdownItem, DropdownDivider } from "flowbite-react";
import Modals from "../components/modal/Modal";

interface DashboardLayoutProps { children: React.ReactNode; }

const menuItems = [
  { title: "Overview",     icon: FaTachometerAlt,       path: "/dashboard",             exact: true },
  { title: "Found Items",  icon: FaSearch,              path: "/dashboard/found-items" },
  { title: "Lost Items",   icon: FaExclamationTriangle, path: "/dashboard/lost-items"  },
  { title: "Claims",       icon: FaClipboardList,       path: "/dashboard/claims"      },
  { title: "Users",        icon: FaUsers,               path: "/dashboard/users"       },
  { title: "Categories",   icon: FaBoxOpen,             path: "/dashboard/categories"  },
  { title: "Settings",     icon: FaCog,                 path: "/dashboard/settings"    },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard":             { title: "Overview",    subtitle: "Welcome back — here's what's happening today" },
  "/dashboard/found-items": { title: "Found Items", subtitle: "Manage all reported found items" },
  "/dashboard/lost-items":  { title: "Lost Items",  subtitle: "Track items reported as lost" },
  "/dashboard/claims":      { title: "Claims",      subtitle: "Review and verify item claims" },
  "/dashboard/users":       { title: "Users",       subtitle: "Manage registered users" },
  "/dashboard/categories":  { title: "Categories",  subtitle: "Organize item categories" },
  "/dashboard/settings":    { title: "Settings",    subtitle: "Configure system preferences" },
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
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
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-white p-1"><FaTimes size={14} /></button>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className={`hidden lg:flex items-center justify-center w-6 h-6 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-colors ${sidebarCollapsed ? "mx-auto mt-1" : ""}`}>
            {sidebarCollapsed ? <FaChevronRight size={10} /> : <FaChevronLeft size={10} />}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {!sidebarCollapsed && <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium px-2 mb-3">Menu</p>}
          {menuItems.map((item) => {
            const active = isActive(item.path, item.exact);
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} title={sidebarCollapsed ? item.title : undefined}
                className={`relative flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${active ? "bg-cyan-500/10 text-cyan-400" : "text-gray-400 hover:text-white hover:bg-white/5"} ${sidebarCollapsed ? "justify-center" : ""}`}>
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
          <Link to="/" title={sidebarCollapsed ? "Back to Site" : undefined}
            className={`flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors group relative ${sidebarCollapsed ? "justify-center" : ""}`}>
            <FaHome size={14} className="text-gray-500 group-hover:text-gray-300" />
            {!sidebarCollapsed && <span>Back to Site</span>}
            {sidebarCollapsed && <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-gray-800 border border-white/10 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible whitespace-nowrap z-50 shadow-xl">Back to Site</span>}
          </Link>
          <button onClick={handleSignOut} title={sidebarCollapsed ? "Sign Out" : undefined}
            className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors group relative ${sidebarCollapsed ? "justify-center" : ""}`}>
            <FaSignOutAlt size={14} className="text-gray-500 group-hover:text-red-400" />
            {!sidebarCollapsed && <span>Sign Out</span>}
            {sidebarCollapsed && <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-gray-800 border border-white/10 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible whitespace-nowrap z-50 shadow-xl">Sign Out</span>}
          </button>

          {!sidebarCollapsed && (
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2.5 px-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">{initials}</div>
              <div className="min-w-0">
                <p className="text-white text-xs font-medium truncate">{user?.name || user?.email || "Admin"}</p>
                <p className="text-gray-500 text-[10px] truncate">{user?.role || "ADMIN"}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-60"}`}>

        {/* Topbar */}
        <header className="h-16 bg-gray-900/80 backdrop-blur border-b border-white/5 flex items-center px-5 gap-4 shrink-0 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <FaBars size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-white text-base font-semibold tracking-tight truncate">{pageMeta.title}</h1>
            <p className="text-gray-500 text-xs truncate hidden sm:block">{pageMeta.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <Dropdown arrowIcon={false} inline label={
              <div className="flex items-center gap-2.5 cursor-pointer">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-gray-900 rounded-full" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-white text-xs font-medium leading-none">{user?.name || "Admin"}</p>
                  <p className="text-gray-500 text-[10px] mt-0.5">{user?.role || "ADMIN"}</p>
                </div>
              </div>
            } className="!bg-gray-800 !border !border-white/10 !shadow-2xl !rounded-xl overflow-hidden">
              <DropdownHeader className="!bg-gray-700/50 border-b border-white/5">
                <div className="flex items-center gap-3 py-1">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">{initials}</div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{user?.name || "Admin"}</p>
                    <p className="text-gray-400 text-xs truncate">{user?.email || ""}</p>
                  </div>
                </div>
              </DropdownHeader>
              <div className="py-1">
                <DropdownItem className="!text-gray-300 hover:!bg-white/5 hover:!text-white !text-sm">
                  <Link to="/dashboard/settings" className="flex items-center gap-2.5 w-full"><FaCog size={13} className="text-gray-500" /><span>Settings</span></Link>
                </DropdownItem>
                <DropdownItem className="!text-gray-300 hover:!bg-white/5 hover:!text-white !text-sm">
                  <Link to="/" className="flex items-center gap-2.5 w-full"><FaHome size={13} className="text-gray-500" /><span>Back to Site</span></Link>
                </DropdownItem>
              </div>
              <DropdownDivider className="!border-white/5" />
              <div className="py-1">
                <DropdownItem onClick={handleSignOut} className="!text-red-400 hover:!bg-red-500/10 hover:!text-red-300 !text-sm">
                  <div className="flex items-center gap-2.5 w-full"><FaSignOutAlt size={13} /><span>Sign out</span></div>
                </DropdownItem>
              </div>
            </Dropdown>
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-7 overflow-auto">{children}</main>
      </div>

      <ToastContainer position="top-right" autoClose={4000} hideProgressBar newestOnTop closeOnClick theme="dark"
        toastClassName="!bg-gray-800 !border !border-white/10 !rounded-xl !text-sm !text-white shadow-2xl" />
    </div>
  );
};

export default DashboardLayout;