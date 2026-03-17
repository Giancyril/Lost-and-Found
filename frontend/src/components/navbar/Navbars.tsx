import { signOut, useUserVerification } from "../../auth/auth";
import {
  Dropdown,
  Navbar,
  NavbarBrand,
  NavbarToggle,
  NavbarCollapse,
  NavbarLink,
  DropdownHeader,
  DropdownItem,
  DropdownDivider,
} from "flowbite-react";
import { Link, useNavigate } from "react-router-dom";
import Modals from "../modal/Modal";
import { ToastContainer } from "react-toastify";
import { FaCog, FaSignOutAlt, FaTachometerAlt } from "react-icons/fa";

export function Navbars() {
  const navigate = useNavigate();
  const users: any = useUserVerification();

  const handleSignOut = () => {
    signOut(navigate);
    Modals({ message: "Log out successfully", status: true });
    window.location.reload();
  };

  return (
    <>
      <Navbar
        fluid
        className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-gray-800 shadow-2xl"
      >
        {/* Brand / Logo */}
        <NavbarBrand href="/">
          <div className="flex items-center space-x-2.5">
            <img
              src="https://nbsc.edu.ph/wp-content/uploads/2024/03/cropped-NBSC_NewLogo_icon.png"
              alt="NBSC SAS Logo"
              className="w-9 h-9 object-contain shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div>
              <span className="whitespace-nowrap text-sm font-black text-white tracking-widest leading-none">
                NBSC SAS
              </span>
              <p className="text-gray-500 text-[10px] font-medium tracking-wide leading-tight hidden sm:block">
                Lost & Found Management System
              </p>
            </div>
          </div>
        </NavbarBrand>

        {/* Right side */}
        <div className="flex md:order-2 items-center gap-2">
          {users?.email && users?.role === "ADMIN" ? (
            <div className="flex items-center">
              <Dropdown
                arrowIcon={false}
                inline
                label={
                  <div className="flex items-center gap-2.5 cursor-pointer group">
                    <div className="relative">
                      {users?.userImg ? (
                        <img src={users?.userImg} alt="Admin"
                          className="w-9 h-9 rounded-full border-2 border-gray-700 group-hover:border-blue-500 transition-all duration-200 shadow-lg" />
                      ) : (
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center border-2 border-gray-700 group-hover:border-blue-400 transition-all duration-200 shadow-lg">
                          <span className="text-white font-bold text-sm">
                            {users?.name?.charAt(0)?.toUpperCase() || users?.email?.charAt(0)?.toUpperCase() || "A"}
                          </span>
                        </div>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-gray-900 rounded-full" />
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-white text-sm font-semibold leading-none">{users?.name || "Admin"}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{users?.role || "ADMIN"}</p>
                    </div>
                  </div>
                }
                className="bg-gray-900 border border-gray-700 shadow-2xl"
              >
                <DropdownHeader className="bg-gray-800/50">
                  <div className="flex items-center space-x-3 py-1">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-xs">
                        {users?.name?.charAt(0)?.toUpperCase() || users?.email?.charAt(0)?.toUpperCase() || "A"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="block text-white font-semibold text-sm truncate">{users?.name || users?.email}</span>
                      <span className="block text-gray-400 text-xs">{users?.role}</span>
                    </div>
                  </div>
                </DropdownHeader>

                <DropdownItem className="hover:bg-gray-700 text-gray-300 hover:text-white">
                  <Link to="/dashboard" className="flex items-center space-x-2 w-full">
                    <FaTachometerAlt className="text-blue-400" />
                    <span>Admin Dashboard</span>
                  </Link>
                </DropdownItem>

                <DropdownItem className="hover:bg-gray-700 text-gray-300 hover:text-white">
                  <Link to="/dashboard/settings" className="flex items-center space-x-2 w-full">
                    <FaCog className="text-blue-400" />
                    <span>Account Settings</span>
                  </Link>
                </DropdownItem>

                <DropdownDivider className="border-gray-700" />

                <DropdownItem onClick={handleSignOut} className="hover:bg-red-600/20 text-gray-300 hover:text-red-400">
                  <div className="flex items-center space-x-2 w-full">
                    <FaSignOutAlt className="text-red-400" />
                    <span>Sign Out</span>
                  </div>
                </DropdownItem>
              </Dropdown>
            </div>
          ) : (
            <Link to="/login"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-all duration-200">
              Login
            </Link>
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
              { label: "Bulletin",         href: "/bulletin"       },
              { label: "Smart Search",     href: "/ai-search"      },
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