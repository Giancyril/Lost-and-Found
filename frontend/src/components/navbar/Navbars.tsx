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
import { FaCog, FaSignOutAlt, FaTachometerAlt, FaChevronDown } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";

export function Navbars() {
  const navigate = useNavigate();
  const users: any = useUserVerification();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [loginVisible, setLoginVisible] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBrandClick = () => {
    if (users?.email) return;
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => { clickCountRef.current = 0; }, 2000);
    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      setLoginVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setLoginVisible(false), 8000);
    }
  };

  useEffect(() => () => {
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    if (hideTimerRef.current)  clearTimeout(hideTimerRef.current);
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
        <NavbarBrand href="/" onClick={(e) => { if (!users?.email) { e.preventDefault(); handleBrandClick(); } }}>
          <div className="flex items-center space-x-2.5 select-none">
            <img src="https://nbsc.edu.ph/wp-content/uploads/2024/03/cropped-NBSC_NewLogo_icon.png" alt="NBSC SAS Logo"
              className="w-9 h-9 object-contain shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div>
              <span className="whitespace-nowrap text-sm font-black text-white tracking-widest leading-none">NBSC SAS</span>
              <p className="text-gray-500 text-[10px] font-medium tracking-wide leading-tight hidden sm:block">Lost & Found Management System</p>
            </div>
          </div>
        </NavbarBrand>

        {/* Right side */}
        <div className="flex md:order-2 items-center gap-2">
          {users?.email && users?.role === "ADMIN" ? (

            <div ref={profileRef} className="relative">
              {/* Trigger button */}
              <button
                type="button"
                onClick={() => setProfileOpen(prev => !prev)}
                className="flex items-center gap-2.5 cursor-pointer group focus:outline-none"
              >
                <div className="relative">
                  {users?.userImg ? (
                    <img src={users.userImg} alt="Admin"
                      className="w-9 h-9 rounded-full border-2 border-gray-700 group-hover:border-blue-500 transition-all duration-200 shadow-lg" />
                  ) : (
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center border-2 border-gray-700 group-hover:border-blue-400 transition-all duration-200 shadow-lg">
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

              {/* Dropdown panel */}
              {profileOpen && (
                <div className="absolute right-0 top-12 w-52 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 border-b border-gray-700">
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
                      className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors text-sm">
                      <FaTachometerAlt size={13} className="text-blue-400 shrink-0" />
                      Admin Dashboard
                    </Link>
                    <Link to="/dashboard/settings" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors text-sm">
                      <FaCog size={13} className="text-blue-400 shrink-0" />
                      Account Settings
                    </Link>
                  </div>

                  <div className="border-t border-gray-700 py-1">
                    <button type="button" onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm">
                      <FaSignOutAlt size={13} className="text-red-400 shrink-0" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

          ) : loginVisible ? (
            <Link to="/login"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-all duration-200 animate-pulse"
              onClick={() => setLoginVisible(false)}>
              Login
            </Link>
          ) : null}

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
              { label: "Track Claim",      href: "/track-claim"    },
            ].map(({ label, href }) => (
              <NavbarLink key={href} href={href}
                className="text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-2.5 tracking-wide rounded-lg transition-all duration-200 font-medium text-sm whitespace-nowrap">
                {label}
              </NavbarLink>
            ))}
          </div>
        </NavbarCollapse>
      </Navbar>

      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false}
        closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />
    </>
  );
}