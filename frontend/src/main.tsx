import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import Providers from "./providers/Providers.tsx";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import Home from "./pages/home/Home.tsx";
import Login from "./pages/login/Login.tsx";
import { StudentLogin } from "./pages/login/StudentLogin.tsx";
import { StudentRegister } from "./pages/register/StudentRegister.tsx";
import FoundItemsPage from "./pages/foundItems/FoundItems.tsx";
import SingleFoundItem from "./pages/foundItems/SingleFoundItem.tsx";
import LostItemsPage from "./pages/lostItems/LostItems.tsx";
import SingleLostItem from "./pages/lostItems/SingleLostItem.tsx";
import DashboardLayout from "./dashboard/DashboardLayout.tsx";
import Dashboard from "./dashboard/Dashboard.tsx";
import FoundItemsManagement from "./dashboard/pages/FoundItemsManagement.tsx";
import LostItemsManagement from "./dashboard/pages/LostItemsManagement.tsx";
import ClaimsManagement from "./dashboard/pages/ClaimsManagement.tsx";
import UsersManagement from "./dashboard/pages/UsersManagement.tsx";
import CategoriesManagement from "./dashboard/pages/CategoriesManagement.tsx";
import Settings from "./dashboard/pages/Settings.tsx";
import MyFoundItems from "./dashboard/myFoundItems/MyFoundItems.tsx";
import MyLostItems from "./dashboard/myLostItems/MyLostItems.tsx";
import ReportLostItem from "./pages/reportlostItem/ReportLostItem.tsx";
import ReportFoundItem from "./pages/reportFoundItem/ReportFoundItem.tsx";
import AiSearch from "./pages/aiSearch/AiSearch.tsx";
import HeatmapPage from "./dashboard/pages/HeatmapPage.tsx";
import AnalyticsPage from "./dashboard/pages/AnalyticsPage.tsx";
import ArchievePage from "./dashboard/pages/ArchievePage.tsx";
import ReportPage from "./dashboard/pages/ReportPage.tsx";
import BulletinBoard from "./pages/bulletin/BulletinBoard.tsx";
import PortalDisplay from "./pages/portal/PortalDisplay.tsx";
import AboutUs from "./components/aboutUs/aboutUs.tsx";
import StudentLayout from "./dashboard/StudentLayout.tsx";
import StudentDashboard from "./dashboard/StudentDashboard.tsx";
import StudentFoundItems from "./dashboard/student-pages/StudentFoundItems.tsx";
import StudentLostItems from "./dashboard/student-pages/StudentLostItems.tsx";
import StudentClaims from "./dashboard/student-pages/StudentClaims.tsx";
import StudentLeaderboard from "./dashboard/student-pages/StudentLeaderboard.tsx";
import StudentSettings from "./dashboard/student-pages/StudentSettings.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/",                          element: <Home /> },
      { path: "/about",                     element: <AboutUs /> },
      { path: "/login",                     element: <StudentLogin /> },   
      { path: "/register",                  element: <StudentRegister /> }, 
      { path: "/admin",                     element: <Login /> },          
      { path: "/foundItems",                element: <FoundItemsPage /> },
      { path: "/lostItems",                 element: <LostItemsPage /> },
      { path: "/foundItems/:foundItem",     element: <SingleFoundItem /> },
      { path: "/lostItems/:lostItem",       element: <SingleLostItem /> },
      { path: "/reportLostItem",            element: <ReportLostItem /> },
      { path: "/reportFoundItem",           element: <ReportFoundItem /> },
      { path: "/ai-search",                 element: <AiSearch /> },
      { path: "/bulletin",                  element: <BulletinBoard /> },
    ],
  },

  // ── Fullscreen kiosk portal — no navbar/sidebar ──────────────────────────
  {
    path: "/portal",
    element: <Providers><PortalDisplay /></Providers>,
  },

  // ── Admin Dashboard routes ────────────────────────────────────────────────
  { path: "/dashboard",                  element: <DashboardLayout><Dashboard /></DashboardLayout> },
  { path: "/dashboard/found-items",      element: <DashboardLayout><FoundItemsManagement /></DashboardLayout> },
  { path: "/dashboard/lost-items",       element: <DashboardLayout><LostItemsManagement /></DashboardLayout> },
  { path: "/dashboard/claims",           element: <DashboardLayout><ClaimsManagement /></DashboardLayout> },
  { path: "/dashboard/analytics",        element: <DashboardLayout><AnalyticsPage /></DashboardLayout> },
  { path: "/dashboard/heatmap",          element: <DashboardLayout><HeatmapPage /></DashboardLayout> },
  { path: "/dashboard/users",            element: <DashboardLayout><UsersManagement /></DashboardLayout> },
  { path: "/dashboard/categories",       element: <DashboardLayout><CategoriesManagement /></DashboardLayout> },
  { path: "/dashboard/report",           element: <DashboardLayout><ReportPage /></DashboardLayout> },
  { path: "/dashboard/settings",         element: <DashboardLayout><Settings /></DashboardLayout> },
  { path: "/dashboard/archive",          element: <DashboardLayout><ArchievePage /></DashboardLayout> },
  { path: "/dashboard/myFoundItems",     element: <DashboardLayout><MyFoundItems /></DashboardLayout> },
  { path: "/dashboard/myLostItems",      element: <DashboardLayout><MyLostItems /></DashboardLayout> },

  // ── Student Dashboard routes ──────────────────────────────────────────────
  { path: "/dashboard/student",                element: <StudentLayout><StudentDashboard /></StudentLayout> },
  { path: "/dashboard/student/found-items",    element: <StudentLayout><StudentFoundItems /></StudentLayout> },
  { path: "/dashboard/student/lost-items",     element: <StudentLayout><StudentLostItems /></StudentLayout> },
  { path: "/dashboard/student/claims",         element: <StudentLayout><StudentClaims /></StudentLayout> },
  { path: "/dashboard/student/leaderboard",    element: <StudentLayout><StudentLeaderboard /></StudentLayout> },
  { path: "/dashboard/student/settings",       element: <StudentLayout><StudentSettings /></StudentLayout> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>
);