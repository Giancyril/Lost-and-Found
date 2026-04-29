import { signOut, useUserVerification } from "../../auth/auth";
import {
  Navbar,
  NavbarBrand,
  NavbarToggle,
  NavbarCollapse,
  NavbarLink,
} from "flowbite-react";
import { Link, useNavigate } from "react-router-dom";
import Modals from "../modal/Modal";
import { ToastContainer } from "react-toastify";
import {
  FaCog, FaSignOutAlt, FaTachometerAlt, FaChevronDown,
  FaTv,
} from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import NotificationBell from "../notifications/NotificationBell";

// ── Shared SVG user icon — matches StudentLayout & StudentDashboard ──────────
const UserIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className={`${className} opacity-90`}>
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
  </svg>
);

export function Navbars() {
  const navigate = useNavigate();
  const users: any = useUserVerification();
  const isAdmin   = users?.role === "ADMIN";
  const isLoggedIn = !!users?.email || !!users?.id;

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Triple-click on brand → navigate to hidden admin login ────────────────
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBrandClick = () => {
    if (isLoggedIn) return;
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => { clickCountRef.current = 0; }, 600);
    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      navigate("/admin");
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
      <Navbar fluid className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-gray-800 shadow-2xl">

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
        <div className="flex md:order-2 items-center gap-2">
          <NotificationBell />

          {/* ── Not logged in ── */}
          {!isLoggedIn && (
            <div className="flex items-center gap-2">
              
              <Link to="/login"
                className="flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-white
                  bg-blue-600 hover:bg-blue-500 border border-blue-500/50 transition-colors">
                Login
              </Link>
            </div>
          )}

          {/* ── Admin dropdown ── */}
          {isLoggedIn && isAdmin && (
            <div ref={profileRef} className="relative">
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
                <div className="absolute right-0 top-12 w-52 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
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

          {/* ── Student dropdown — matches StudentLayout ProfileDropdown exactly ── */}
          {isLoggedIn && !isAdmin && (
            <div ref={profileRef} className="relative">
              <button type="button" onClick={() => setProfileOpen(p => !p)}
                className="flex items-center gap-2 cursor-pointer group focus:outline-none">

                {/* Avatar — identical to StudentLayout */}
                <div className="relative">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full
                    flex items-center justify-center border-2 border-gray-700
                    group-hover:border-blue-400 transition-all shadow-lg shrink-0">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-gray-900 rounded-full" />
                </div>

                {/* Name + school ID */}
                <div className="hidden sm:block text-left">
                  <p className="text-white text-sm font-semibold leading-none">
                    {users?.name || users?.username || "Student"}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5 font-mono">
                    {users?.schoolId || "STUDENT"}
                  </p>
                </div>

                <FaChevronDown size={10} className={`text-gray-500 hidden sm:block transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-11 w-52 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">

                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 border-b border-white/[0.05]">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500
                        flex items-center justify-center shrink-0">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {users?.name || users?.username || "Student"}
                        </p>
                        <p className="text-gray-500 text-[10px] font-mono truncate">
                          {users?.schoolId || "Student"}
                        </p>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="py-1">
                      <Link to="/dashboard/student" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-sm">
                        <FaTachometerAlt size={12} className="text-gray-500 shrink-0" /> My Dashboard
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
          )}

          <NavbarToggle />
        </div>

        {/* Nav Links */}
        <NavbarCollapse>
          <div className="flex flex-col md:flex-row md:items-center md:gap-8 lg:gap-14">
            {[
              { label: "Home",             href: "/"               },
              { label: "Report Lost Item", href: "/reportlostItem" },
              { label: "Lost Items",       href: "/lostItems"      },
              { label: "Found Items",      href: "/foundItems"     },
              { label: "Smart Search",     href: "/ai-search"      },
            ].map(({ label, href }) => (
              <NavbarLink key={href} href={href}
                className="text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-2.5 tracking-wide rounded-lg transition-all duration-200 font-medium text-sm whitespace-nowrap">
                {label}
              </NavbarLink>
            ))}

            {/* Mobile-only student dashboard link */}
            {isLoggedIn && !isAdmin && (
              <NavbarLink href="/dashboard/student"
                className="text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-2.5 tracking-wide rounded-lg transition-all duration-200 font-medium text-sm md:hidden">
                My Dashboard
              </NavbarLink>
            )}

            {/* Mobile-only register */}
            {!isLoggedIn && (
              <NavbarLink href="/register"
                className="text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-2.5 tracking-wide rounded-lg transition-all duration-200 font-medium text-sm sm:hidden">
                Register
              </NavbarLink>
            )}
          </div>
        </NavbarCollapse>
      </Navbar>

      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false}
        newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />
    </>
  );
}