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
import {
  FaSearch,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaList,
  FaTachometerAlt,
} from "react-icons/fa";

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
          <div className="flex items-center space-x-3">
            <img
              src="https://nbsc.edu.ph/wp-content/uploads/2024/03/cropped-NBSC_NewLogo_icon.png"
              alt="NBSC SAS Logo"
              className="w-10 h-10 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="hidden sm:block">
              <span className="whitespace-nowrap text-base font-black text-white tracking-tight">
                NBSC SAS
              </span>
              <p className="text-gray-500 text-xs font-medium tracking-wide">
                Lost & Found Management System
              </p>
            </div>
          </div>
        </NavbarBrand>

        {/* Right side — user or login */}
        <div className="flex md:order-2">
          {users?.email ? (
            <div className="flex items-center space-x-3">
              <div className="hidden lg:block text-right">
                <p className="text-white text-sm font-semibold">
                  {users?.name || "User"}
                </p>
                <p className="text-gray-500 text-xs">{users?.role || "USER"}</p>
              </div>

              <Dropdown
                arrowIcon={false}
                inline
                label={
                  <div className="relative group cursor-pointer">
                    {users?.userImg ? (
                      <img
                        src={users?.userImg}
                        alt="User"
                        className="w-10 h-10 rounded-full border-2 border-gray-700 group-hover:border-blue-500 transition-all duration-200 shadow-lg"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center border-2 border-gray-700 group-hover:border-blue-400 transition-all duration-200 shadow-lg">
                        <span className="text-white font-bold text-sm">
                          {users?.username?.charAt(0)?.toUpperCase() ||
                            users?.email?.charAt(0)?.toUpperCase() ||
                            "U"}
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></div>
                  </div>
                }
                className="bg-gray-900 border border-gray-700 shadow-2xl"
              >
                <DropdownHeader className="bg-gray-800/50">
                  <div className="flex items-center space-x-3 py-2">
                    {users?.userImg ? (
                      <img src={users?.userImg} alt="User" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs">
                          {users?.name?.charAt(0)?.toUpperCase() ||
                            users?.username?.charAt(0)?.toUpperCase() ||
                            users?.email?.charAt(0)?.toUpperCase() ||
                            "U"}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="block text-white font-semibold text-sm">
                        {users?.email || "User"}
                      </span>
                      <span className="block text-gray-400 text-xs">{users?.role}</span>
                    </div>
                  </div>
                </DropdownHeader>

                {users?.role === "ADMIN" && (
                  <DropdownItem className="hover:bg-gray-700 text-gray-300 hover:text-white">
                    <Link to="/dashboard" className="flex items-center space-x-2 w-full">
                      <FaTachometerAlt className="text-blue-400" />
                      <span>Admin Dashboard</span>
                    </Link>
                  </DropdownItem>
                )}

                <DropdownItem className="hover:bg-gray-700 text-gray-300 hover:text-white">
                  <Link to="/dashboard/settings" className="flex items-center space-x-2 w-full">
                    <FaCog className="text-blue-400" />
                    <span>Account Settings</span>
                  </Link>
                </DropdownItem>

                <DropdownItem className="hover:bg-gray-700 text-gray-300 hover:text-white">
                  <Link to="/dashboard/myLostItems" className="flex items-center space-x-2 w-full">
                    <FaList className="text-yellow-400" />
                    <span>My Lost Item Reports</span>
                  </Link>
                </DropdownItem>

                <DropdownItem className="hover:bg-gray-700 text-gray-300 hover:text-white">
                  <Link to="/dashboard/myFoundItems" className="flex items-center space-x-2 w-full">
                    <FaSearch className="text-green-400" />
                    <span>My Found Item Reports</span>
                  </Link>
                </DropdownItem>

                <DropdownItem className="hover:bg-gray-700 text-gray-300 hover:text-white">
                  <Link to="/dashboard/myClaimRequest" className="flex items-center space-x-2 w-full">
                    <FaUser className="text-cyan-400" />
                    <span>My Claim Requests</span>
                  </Link>
                </DropdownItem>

                <DropdownDivider className="border-gray-700" />

                <DropdownItem
                  onClick={handleSignOut}
                  className="hover:bg-red-600/20 text-gray-300 hover:text-red-400"
                >
                  <div className="flex items-center space-x-2 w-full">
                    <FaSignOutAlt className="text-red-400" />
                    <span>Sign Out</span>
                  </div>
                </DropdownItem>
              </Dropdown>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link to="/login">
                <button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-5 rounded-lg shadow-lg transition-all duration-200 text-sm">
                  Login
                </button>
              </Link>
              <Link to="/register">
                <button className="border border-gray-600 hover:border-blue-500 text-gray-300 hover:text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 text-sm">
                  Register
                </button>
              </Link>
            </div>
          )}
          <NavbarToggle />
        </div>

        {/* Nav Links */}
        <NavbarCollapse>
          <div className="flex flex-col md:flex-row md:items-center md:gap-10">
            <NavbarLink
              href="/"
              className="text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-2.5 tracking-wide rounded-lg transition-all duration-200 font-medium text-sm whitespace-nowrap"
            >
              Home
            </NavbarLink>
            <NavbarLink
              href="/reportlostItem"
              className="text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-2.5 tracking-wide rounded-lg transition-all duration-200 font-medium text-sm whitespace-nowrap"
            >
              Report Lost Item
            </NavbarLink>
            <NavbarLink
              href="/reportFoundItem"
              className="text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-2.5 tracking-wide rounded-lg transition-all duration-200 font-medium text-sm whitespace-nowrap"
            >
              Submit Found Item
            </NavbarLink>
            <NavbarLink
              href="/lostItems"
              className="text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-2.5 tracking-wide rounded-lg transition-all duration-200 font-medium text-sm whitespace-nowrap"
            >
              Lost Items Board
            </NavbarLink>
            <NavbarLink
              href="/foundItems"
              className="text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-2.5 tracking-wide rounded-lg transition-all duration-200 font-medium text-sm whitespace-nowrap"
            >
              Found Items Board
            </NavbarLink>
            <NavbarLink
              href="/ai-search"
              className="text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-2.5 tracking-wide rounded-lg transition-all duration-200 font-medium text-sm whitespace-nowrap"
            >
              Smart Search
            </NavbarLink>
            <NavbarLink
              href="#aboutUs"
              className="text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-2.5 tracking-wide rounded-lg transition-all duration-200 font-medium text-sm whitespace-nowrap"
            >
              About SAS L&F
            </NavbarLink>
          </div>
        </NavbarCollapse>
      </Navbar>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </>
  );
}