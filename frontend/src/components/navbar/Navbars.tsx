import { signOut, useUserVerification } from "../../auth/auth";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Modals from "../modal/Modal";
import { ToastContainer } from "react-toastify";
import { useState, useEffect } from "react";
import {
  FaCog, FaSignOutAlt, FaTachometerAlt, FaBars, FaTimes,
  FaSearch, FaExclamationTriangle, FaBoxOpen, FaBullhorn,
  FaBrain,
} from "react-icons/fa";

const navLinks = [
  { label: "Report Lost",  href: "/reportlostItem", icon: <FaExclamationTriangle size={11} /> },
  { label: "Lost Items",   href: "/lostItems",       icon: <FaSearch size={11} />              },
  { label: "Found Items",  href: "/foundItems",      icon: <FaBoxOpen size={11} />             },
  { label: "Bulletin",     href: "/bulletin",        icon: <FaBullhorn size={11} />            },
  { label: "Smart Search", href: "/ai-search",       icon: <FaBrain size={11} />               },
];

export function Navbars() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const users: any = useUserVerification();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setDropdownOpen(false); }, [location.pathname]);

  const handleSignOut = () => {
    signOut(navigate);
    Modals({ message: "Signed out successfully", status: true });
    window.location.reload();
  };

  const isActive = (href: string) => location.pathname === href;

  const initials =
    users?.name?.charAt(0)?.toUpperCase() ||
    users?.email?.charAt(0)?.toUpperCase() || "A";

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-gray-950/98 backdrop-blur-xl shadow-[0_1px_0_0_rgba(255,255,255,0.05)] shadow-2xl"
          : "bg-gray-950/90 backdrop-blur-md border-b border-white/[0.04]"
      }`}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Brand ─────────────────────────────────────────────── */}
            <Link to="/" className="flex items-center gap-3 group shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-md group-hover:bg-blue-500/30 transition-all duration-300" />
                <img
                  src="https://nbsc.edu.ph/wp-content/uploads/2024/03/cropped-NBSC_NewLogo_icon.png"
                  alt="NBSC SAS"
                  className="relative w-8 h-8 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              <div className="leading-none">
                <p className="text-white text-sm font-bold tracking-[0.15em] uppercase">
                  NBSC SAS
                </p>
                <p className="text-gray-500 text-[10px] tracking-widest uppercase mt-0.5 hidden sm:block">
                  Lost & Found
                </p>
              </div>
            </Link>

            {/* ── Desktop nav links ──────────────────────────────────── */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ label, href, icon }) => (
                <Link
                  key={href}
                  to={href}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 group ${
                    isActive(href)
                      ? "text-white bg-white/[0.08]"
                      : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <span className={`transition-colors ${isActive(href) ? "text-cyan-400" : "text-gray-600 group-hover:text-gray-400"}`}>
                    {icon}
                  </span>
                  {label}
                  {isActive(href) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-cyan-400 rounded-full" />
                  )}
                </Link>
              ))}
            </div>

            {/* ── Right side ─────────────────────────────────────────── */}
            <div className="flex items-center gap-2">
              {users?.email && users?.role === "ADMIN" ? (
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(v => !v)}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/5 transition-all duration-150 group"
                  >
                    <div className="relative shrink-0">
                      {users?.userImg ? (
                        <img
                          src={users.userImg}
                          alt="Admin"
                          className="w-8 h-8 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center border border-white/10 text-white text-xs font-bold">
                          {initials}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-gray-950 rounded-full" />
                    </div>
                    <div className="hidden sm:block text-left leading-none">
                      <p className="text-white text-xs font-semibold">{users?.name || users?.username || "Admin"}</p>
                      <p className="text-gray-500 text-[10px] mt-0.5 uppercase tracking-widest">{users?.role || "Admin"}</p>
                    </div>
                    <svg
                      className={`hidden sm:block text-gray-600 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                      width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
                    >
                      <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </button>

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3.5 border-b border-white/5 bg-white/[0.02]">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white text-sm font-semibold truncate">{users?.name || users?.username || "Admin"}</p>
                              <p className="text-gray-500 text-[10px] truncate">{users?.email}</p>
                            </div>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="py-1.5">
                          <Link
                            to="/dashboard"
                            className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/[0.04] transition-colors text-sm"
                          >
                            <FaTachometerAlt size={12} className="text-blue-400 shrink-0" />
                            Admin Dashboard
                          </Link>
                          <Link
                            to="/dashboard/settings"
                            className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/[0.04] transition-colors text-sm"
                          >
                            <FaCog size={12} className="text-gray-500 shrink-0" />
                            Account Settings
                          </Link>
                        </div>

                        <div className="border-t border-white/5 py-1.5">
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors text-sm"
                          >
                            <FaSignOutAlt size={12} className="shrink-0" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold tracking-wide rounded-lg transition-all duration-150 shadow-lg shadow-blue-900/30"
                >
                  Sign In
                </Link>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(v => !v)}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                {mobileOpen ? <FaTimes size={15} /> : <FaBars size={15} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile menu ─────────────────────────────────────────────── */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}>
          <div className="border-t border-white/5 px-4 py-3 space-y-0.5">
            {navLinks.map(({ label, href, icon }) => (
              <Link
                key={href}
                to={href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(href)
                    ? "bg-white/[0.07] text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <span className={isActive(href) ? "text-cyan-400" : "text-gray-600"}>
                  {icon}
                </span>
                {label}
                {isActive(href) && (
                  <span className="ml-auto w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                )}
              </Link>
            ))}

            {/* Mobile admin shortcuts */}
            {users?.email && users?.role === "ADMIN" && (
              <>
                <div className="my-2 border-t border-white/5" />
                <Link to="/dashboard"
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all">
                  <FaTachometerAlt size={11} className="text-blue-400" />
                  Admin Dashboard
                </Link>
                <button onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/[0.06] transition-all">
                  <FaSignOutAlt size={11} />
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        theme="dark"
        toastClassName="!bg-gray-900 !border !border-white/10 !rounded-xl !text-sm !text-white shadow-2xl"
      />
    </>
  );
}