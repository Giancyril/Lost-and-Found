import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import Providers from "./providers/Providers.tsx";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

// ── Lazy-loaded pages ────────────────────────────────────────────────────────
const Home                  = lazy(() => import("./pages/home/Home.tsx"));
const Login                 = lazy(() => import("./pages/login/Login.tsx"));
const StudentAuth           = lazy(() => import("./pages/login/StudentAuth.tsx"));
const AutoLogin             = lazy(() => import("./pages/login/AutoLogin.tsx"));
const FoundItemsPage        = lazy(() => import("./pages/foundItems/FoundItems.tsx"));
const SingleFoundItem       = lazy(() => import("./pages/foundItems/SingleFoundItem.tsx"));
const LostItemsPage         = lazy(() => import("./pages/lostItems/LostItems.tsx"));
const SingleLostItem        = lazy(() => import("./pages/lostItems/SingleLostItem.tsx"));
const ReportLostItem        = lazy(() => import("./pages/reportlostItem/ReportLostItem.tsx"));
const ReportFoundItem       = lazy(() => import("./pages/reportFoundItem/ReportFoundItem.tsx"));
const AiSearch              = lazy(() => import("./pages/aiSearch/AiSearch.tsx"));
const BulletinBoard         = lazy(() => import("./pages/bulletin/BulletinBoard.tsx"));
const AboutUs               = lazy(() => import("./components/aboutUs/aboutUs.tsx"));
const PortalDisplay         = lazy(() => import("./pages/portal/PortalDisplay.tsx"));
const SupportPage           = lazy(() => import("./pages/support/SupportPage.tsx"));
const ItemStatus            = lazy(() => import("./pages/itemStatus/ItemStatus.tsx"));
const IndoorMapPage         = lazy(() => import("./pages/IndoorMapPage.tsx"));
const Bounties              = lazy(() => import("./pages/bounties/Bounties.tsx"));

// ── Admin dashboard pages ─────────────────────────────────────────────────────
const DashboardLayout           = lazy(() => import("./dashboard/DashboardLayout.tsx"));
const Dashboard                 = lazy(() => import("./dashboard/Dashboard.tsx"));
const BulkScanner               = lazy(() => import("./dashboard/pages/BulkScanner.tsx"));
const FoundItemsManagement      = lazy(() => import("./dashboard/pages/FoundItemsManagement.tsx"));
const LostItemsManagement       = lazy(() => import("./dashboard/pages/LostItemsManagement.tsx"));
const ClaimsManagement          = lazy(() => import("./dashboard/pages/ClaimsManagement.tsx"));
const UsersManagement           = lazy(() => import("./dashboard/pages/UsersManagement.tsx"));
const CategoriesManagement      = lazy(() => import("./dashboard/pages/CategoriesManagement.tsx"));
const Settings                  = lazy(() => import("./dashboard/pages/Settings.tsx"));
const HeatmapPage               = lazy(() => import("./dashboard/pages/HeatmapPage.tsx"));
const AnalyticsPage             = lazy(() => import("./dashboard/pages/AnalyticsPage.tsx"));
const ReportPage                = lazy(() => import("./dashboard/pages/ReportPage.tsx"));
const ArchievePage              = lazy(() => import("./dashboard/pages/ArchievePage.tsx"));
const MyFoundItems              = lazy(() => import("./dashboard/myFoundItems/MyFoundItems.tsx"));
const MyLostItems               = lazy(() => import("./dashboard/myLostItems/MyLostItems.tsx"));
const AchievementsManagement    = lazy(() => import("./dashboard/pages/AchievementsManagement.tsx"));
const StudentRegistry           = lazy(() => import("./dashboard/pages/StudentRegistry.tsx"));
const LeaderboardPage           = lazy(() => import("./dashboard/pages/LeaderboardPage.tsx"));
const CommunicationHub          = lazy(() => import("./dashboard/pages/CommunicationHub.tsx"));
const SecurityPage              = lazy(() => import("./dashboard/pages/SecurityCompliance.tsx"));
const ContentModeration         = lazy(() => import("./dashboard/pages/ContentModeration.tsx"));
const ChatPage                  = lazy(() => import("./dashboard/pages/ChatPage.tsx"));
const AuditLogsPage             = lazy(() => import("./dashboard/pages/AuditLogsPage.tsx"));
const VirtueSpotlightAdmin      = lazy(() => import("./pages/admin/VirtueSpotlightAdmin.tsx"));
const BoostEventsManagement     = lazy(() => import("./dashboard/pages/BoostEventsManagement.tsx"));
const FlaggedUsersManagement    = lazy(() => import("./dashboard/pages/FlaggedUsersManagement.tsx"));
const ApiStatus                 = lazy(() => import("./dashboard/pages/ApiStatus.tsx"));

// ── Student dashboard pages ───────────────────────────────────────────────────
const StudentLayout             = lazy(() => import("./dashboard/StudentLayout.tsx"));
const StudentDashboard          = lazy(() => import("./dashboard/StudentDashboard.tsx"));
const StudentFoundItems         = lazy(() => import("./dashboard/student-pages/StudentFoundItems.tsx"));
const StudentLostItems          = lazy(() => import("./dashboard/student-pages/StudentLostItems.tsx"));
const StudentClaims             = lazy(() => import("./dashboard/student-pages/StudentClaims.tsx"));
const StudentLeaderboard        = lazy(() => import("./dashboard/student-pages/StudentLeaderboard.tsx"));
const StudentSettings           = lazy(() => import("./dashboard/student-pages/StudentSettings.tsx"));
const StudentAchievements       = lazy(() => import("./dashboard/student-pages/StudentAchievements.tsx"));
const StudentPointsHistory      = lazy(() => import("./dashboard/student-pages/StudentPointsHistory.tsx"));

// ── Loading fallback ──────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#020817]">
    <div className="flex flex-col items-center gap-3">
      <svg className="animate-spin h-8 w-8 text-indigo-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p className="text-gray-500 text-sm">Loading...</p>
    </div>
  </div>
);

const S = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

const rawAdminPath = import.meta.env.VITE_ADMIN_PATH || "/nbsc-secure-portal";
const ADMIN_PATH = rawAdminPath.startsWith("/") ? rawAdminPath : `/${rawAdminPath}`;

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/",                        element: <S><Home /></S> },
      { path: "/about",                   element: <S><AboutUs /></S> },
      { path: "/login",                   element: <S><StudentAuth key="student-auth" /></S> },
      { path: "/sas-auto-login",          element: <S><AutoLogin /></S> },
      { path: "/register",                element: <S><StudentAuth key="student-auth" /></S> },
      { path: ADMIN_PATH,                 element: <S><Login /></S> },
      { path: "/admin",                   element: <Navigate to="/" replace /> },
      { path: "/foundItems",              element: <S><FoundItemsPage /></S> },
      { path: "/lostItems",               element: <S><LostItemsPage /></S> },
      { path: "/foundItems/:foundItem",   element: <S><SingleFoundItem /></S> },
      { path: "/lostItems/:lostItem",     element: <S><SingleLostItem /></S> },
      { path: "/reportLostItem",          element: <S><ReportLostItem /></S> },
      { path: "/reportlostItem",          element: <S><ReportLostItem /></S> },
      { path: "/reportFoundItem",         element: <S><ReportFoundItem /></S> },
      { path: "/ai-search",               element: <S><AiSearch /></S> },
      { path: "/aiSearch",                element: <S><AiSearch /></S> },
      { path: "/bulletin",                element: <S><BulletinBoard /></S> },
      { path: "/support",                 element: <S><SupportPage /></S> },
      { path: "/itemStatus",              element: <S><ItemStatus /></S> },
      { path: "/indoor-map",              element: <S><IndoorMapPage /></S> },
      { path: "/track",                   element: <S><ItemStatus /></S> },
      { path: "/bounties",                element: <S><Bounties /></S> },
    ],
  },

  // Fullscreen kiosk portal
  {
    path: "/portal",
    element: <Providers><S><PortalDisplay /></S></Providers>,
  },

  // Admin Dashboard routes
  { path: "/dashboard",                         element: <S><DashboardLayout><Dashboard /></DashboardLayout></S> },
  { path: "/dashboard/bulk-scanner",            element: <S><DashboardLayout><BulkScanner /></DashboardLayout></S> },
  { path: "/dashboard/found-items",             element: <S><DashboardLayout><FoundItemsManagement /></DashboardLayout></S> },
  { path: "/dashboard/lost-items",              element: <S><DashboardLayout><LostItemsManagement /></DashboardLayout></S> },
  { path: "/dashboard/claims",                  element: <S><DashboardLayout><ClaimsManagement /></DashboardLayout></S> },
  { path: "/dashboard/analytics",               element: <S><DashboardLayout><AnalyticsPage /></DashboardLayout></S> },
  { path: "/dashboard/heatmap",                 element: <S><DashboardLayout><HeatmapPage /></DashboardLayout></S> },
  { path: "/dashboard/comm-hub",                element: <S><DashboardLayout><CommunicationHub /></DashboardLayout></S> },
  { path: "/dashboard/virtue-spotlight",        element: <S><DashboardLayout><VirtueSpotlightAdmin /></DashboardLayout></S> },
  { path: "/dashboard/users",                   element: <S><DashboardLayout><UsersManagement /></DashboardLayout></S> },
  { path: "/dashboard/students",                element: <S><DashboardLayout><StudentRegistry /></DashboardLayout></S> },
  { path: "/dashboard/leaderboard",             element: <S><DashboardLayout><LeaderboardPage /></DashboardLayout></S> },
  { path: "/dashboard/categories",              element: <S><DashboardLayout><CategoriesManagement /></DashboardLayout></S> },
  { path: "/dashboard/report",                  element: <S><DashboardLayout><ReportPage /></DashboardLayout></S> },
  { path: "/dashboard/settings",                element: <S><DashboardLayout><Settings /></DashboardLayout></S> },
  { path: "/dashboard/archive",                 element: <S><DashboardLayout><ArchievePage /></DashboardLayout></S> },
  { path: "/dashboard/achievements",            element: <S><DashboardLayout><AchievementsManagement /></DashboardLayout></S> },
  { path: "/dashboard/boost-events",            element: <S><DashboardLayout><BoostEventsManagement /></DashboardLayout></S> },
  { path: "/dashboard/flagged-users",           element: <S><DashboardLayout><FlaggedUsersManagement /></DashboardLayout></S> },
  { path: "/dashboard/myFoundItems",            element: <S><DashboardLayout><MyFoundItems /></DashboardLayout></S> },
  { path: "/dashboard/myLostItems",             element: <S><DashboardLayout><MyLostItems /></DashboardLayout></S> },
  { path: "/dashboard/security",                element: <S><DashboardLayout><SecurityPage /></DashboardLayout></S> },
  { path: "/dashboard/audit-logs",              element: <S><DashboardLayout><AuditLogsPage /></DashboardLayout></S> },
  { path: "/dashboard/moderation",              element: <S><DashboardLayout><ContentModeration /></DashboardLayout></S> },
  { path: "/dashboard/chat",                    element: <S><DashboardLayout><ChatPage /></DashboardLayout></S> },
  { path: "/dashboard/api-status",              element: <S><DashboardLayout><ApiStatus /></DashboardLayout></S> },

  // Student Dashboard routes
  { path: "/dashboard/student",                 element: <S><StudentLayout><StudentDashboard /></StudentLayout></S> },
  { path: "/dashboard/student/found-items",     element: <S><StudentLayout><StudentFoundItems /></StudentLayout></S> },
  { path: "/dashboard/student/lost-items",      element: <S><StudentLayout><StudentLostItems /></StudentLayout></S> },
  { path: "/dashboard/student/claims",          element: <S><StudentLayout><StudentClaims /></StudentLayout></S> },
  { path: "/dashboard/student/leaderboard",     element: <S><StudentLayout><StudentLeaderboard /></StudentLayout></S> },
  { path: "/dashboard/student/bounties",        element: <S><StudentLayout><Bounties /></StudentLayout></S> },
  { path: "/dashboard/student/achievements",    element: <S><StudentLayout><StudentAchievements /></StudentLayout></S> },
  { path: "/dashboard/student/points",          element: <S><StudentLayout><StudentPointsHistory /></StudentLayout></S> },
  { path: "/dashboard/student/settings",        element: <S><StudentLayout><StudentSettings /></StudentLayout></S> },
  { path: "/dashboard/student/chat",            element: <S><StudentLayout><ChatPage /></StudentLayout></S> },
]);

import { fetchCsrfToken } from "./redux/api/baseApi";

// Initialize CSRF token asynchronously (don't block render)
setTimeout(() => {
  fetchCsrfToken().catch(() => {
    // Silent fail - will retry when needed
  });
}, 1000);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>
);
