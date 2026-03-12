import { Link } from "react-router-dom";
import {
  FaBoxOpen, FaClipboardList, FaExclamationTriangle, FaUsers,
  FaArrowRight, FaSearch, FaCheckCircle, FaTimesCircle, FaClock,
  FaPlus, FaRecycle, FaChartBar, FaCalendarWeek,
} from "react-icons/fa";
import {
  useAdminStatsQuery,
  useGetAllClaimsQuery,
  useGetFoundItemsQuery,
  useGetLostItemsQuery,
} from "../redux/api/api";

/* ── helpers ── */
const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const claimStatusMeta: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:  { label: "Pending",  color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", icon: <FaClock size={10} /> },
  APPROVED: { label: "Approved", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: <FaCheckCircle size={10} /> },
  REJECTED: { label: "Rejected", color: "text-red-400 bg-red-400/10 border-red-400/20", icon: <FaTimesCircle size={10} /> },
};

/* ── stat card ── */
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;
  href: string;
  sub?: string;
  subColor?: string;
}
const StatCard = ({ label, value, icon, accent, href, sub, subColor }: StatCardProps) => (
  <Link to={href} className="group relative bg-gray-900 border border-white/5 rounded-2xl p-5 flex flex-col gap-4 hover:border-white/10 transition-all duration-200 overflow-hidden">
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${accent} blur-3xl scale-150`} />
    <div className="relative flex items-start justify-between">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent} bg-opacity-10`}>
        {icon}
      </div>
      <FaArrowRight size={11} className="text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all mt-1" />
    </div>
    <div className="relative">
      <p className="text-3xl font-bold text-white tracking-tight">{value ?? "—"}</p>
      <p className="text-gray-500 text-xs mt-0.5 font-medium">{label}</p>
      {sub && <p className={`text-[11px] mt-1.5 font-medium ${subColor ?? "text-gray-500"}`}>{sub}</p>}
    </div>
  </Link>
);

/* ── rate card (for disposal / resolution) ── */
interface RateCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bar: string;
  sub: string;
}
const RateCard = ({ label, value, icon, color, bar, sub }: RateCardProps) => (
  <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <p className="text-white text-sm font-semibold">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${color.includes("emerald") ? "text-emerald-400" : color.includes("blue") ? "text-blue-400" : "text-cyan-400"}`}>
        {value}%
      </p>
    </div>
    {/* Progress bar */}
    <div className="w-full bg-gray-800 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all duration-700 ${bar}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
    <p className="text-gray-500 text-xs">{sub}</p>
  </div>
);

/* ── mini stat ── */
const MiniStat = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="bg-gray-800/60 rounded-xl p-3 text-center border border-white/5">
    <p className={`text-xl font-bold ${color}`}>{value}</p>
    <p className="text-gray-500 text-[11px] mt-0.5">{label}</p>
  </div>
);

/* ── activity dot ── */
const typeDot: Record<string, string> = {
  found: "bg-cyan-400",
  lost:  "bg-red-400",
  claim: "bg-yellow-400",
};

/* ── main ── */
const Dashboard = () => {
  const { data: statsData,      isLoading: statsLoading }  = useAdminStatsQuery({});
  const { data: claimsData,     isLoading: claimsLoading } = useGetAllClaimsQuery(undefined);
  const { data: foundItemsData, isLoading: foundLoading }  = useGetFoundItemsQuery({ page: 1, limit: 5, sortBy: "createdAt", sortOrder: "desc" });
  const { data: lostItemsData,  isLoading: lostLoading }   = useGetLostItemsQuery({ page: 1, limit: 5, sortBy: "createdAt", sortOrder: "desc" });

  const stats     = statsData?.data;
  const isLoading = statsLoading || claimsLoading || foundLoading || lostLoading;

  /* build unified activity */
  const buildActivity = () => {
    const items: any[] = [];
    (foundItemsData?.data || []).slice(0, 3).forEach((item: any) => {
      items.push({ id: `f-${item.id}`, type: "found", label: item.foundItemName, sub: item.location, time: item.createdAt, link: `/foundItems/${item.id}`, status: item.isClaimed ? "Claimed" : "Available" });
    });
    (lostItemsData?.data || []).slice(0, 2).forEach((item: any) => {
      items.push({ id: `l-${item.id}`, type: "lost", label: item.lostItemName, sub: item.location, time: item.createdAt, link: `/lostItems/${item.id}`, status: "Lost" });
    });
    (claimsData?.data || []).slice(0, 3).forEach((c: any) => {
      items.push({ id: `c-${c.id}`, type: "claim", label: c.foundItem?.foundItemName ?? "Unknown item", sub: c.claimantName || "Anonymous", time: c.createdAt, link: "/dashboard/claims", status: c.status });
    });
    return items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);
  };

  const pendingClaims = (claimsData?.data || []).filter((c: any) => c.status === "PENDING");

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-gray-800/60 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-800/60 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-80 bg-gray-800/60 rounded-2xl" />
          <div className="h-80 bg-gray-800/60 rounded-2xl" />
        </div>
      </div>
    );
  }

  const activity = buildActivity();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Banner ── */}
      <div className="relative bg-gray-900 border border-white/5 rounded-2xl p-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Good to see you!</h2>
            <p className="text-gray-400 text-sm mt-1">
              National Baptist School of Caloocan · SAS Office · Lost & Found System
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard/found-items"
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-sm font-medium rounded-xl transition-all">
              <FaPlus size={11} /> Add Found Item
            </Link>
            <Link to="/dashboard/claims"
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-medium rounded-xl transition-all">
              <FaClipboardList size={11} /> Review Claims
            </Link>
          </div>
        </div>
      </div>

      {/* ── Primary Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Found Items"
          value={stats?.foundItems ?? 0}
          icon={<FaSearch size={16} className="text-cyan-400" />}
          accent="bg-cyan-500/5"
          href="/dashboard/found-items"
          sub={`+${stats?.foundThisWeek ?? 0} this week`}
          subColor="text-cyan-400"
        />
        <StatCard
          label="Lost Items"
          value={stats?.lostItems ?? 0}
          icon={<FaExclamationTriangle size={16} className="text-red-400" />}
          accent="bg-red-500/5"
          href="/dashboard/lost-items"
          sub={`+${stats?.lostThisWeek ?? 0} this week`}
          subColor="text-red-400"
        />
        <StatCard
          label="Pending Claims"
          value={stats?.pendingClaims ?? 0}
          icon={<FaClipboardList size={16} className="text-yellow-400" />}
          accent="bg-yellow-500/5"
          href="/dashboard/claims"
          sub={`${stats?.approvedClaims ?? 0} approved · ${stats?.rejectedClaims ?? 0} rejected`}
          subColor="text-yellow-400"
        />
        <StatCard
          label="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={<FaUsers size={16} className="text-violet-400" />}
          accent="bg-violet-500/5"
          href="/dashboard/users"
          sub={`${stats?.totalClaims ?? 0} total claims`}
          subColor="text-violet-400"
        />
      </div>

      {/* ── Rates + Weekly Summary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <RateCard
          label="Disposal Rate"
          value={stats?.disposalRate ?? 0}
          icon={<FaRecycle size={14} className="text-emerald-400" />}
          color="bg-emerald-400/10 text-emerald-400"
          bar="bg-emerald-400"
          sub={`${stats?.claimedItems ?? 0} of ${stats?.foundItems ?? 0} found items have been claimed`}
        />
        <RateCard
          label="Resolution Rate"
          value={stats?.resolutionRate ?? 0}
          icon={<FaChartBar size={14} className="text-blue-400" />}
          color="bg-blue-400/10 text-blue-400"
          bar="bg-blue-400"
          sub={`${stats?.resolvedLostItems ?? 0} of ${stats?.lostItems ?? 0} lost items have been found`}
        />
        {/* Weekly summary */}
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-orange-400/10 flex items-center justify-center">
              <FaCalendarWeek size={14} className="text-orange-400" />
            </div>
            <p className="text-white text-sm font-semibold">This Week</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="Found"   value={stats?.foundThisWeek   ?? 0} color="text-cyan-400"   />
            <MiniStat label="Lost"    value={stats?.lostThisWeek    ?? 0} color="text-red-400"    />
            <MiniStat label="Claims"  value={stats?.claimsThisWeek  ?? 0} color="text-yellow-400" />
          </div>
          <p className="text-gray-600 text-[11px] mt-1">
            {stats?.itemsLoggedThisWeek ?? 0} total items logged in the last 7 days
          </p>
        </div>
      </div>

      {/* ── Activity + Pending Claims ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Activity feed */}
        <div className="lg:col-span-2 bg-gray-900 border border-white/5 rounded-2xl flex flex-col">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
            <div>
              <h3 className="text-white text-sm font-semibold">Recent Activity</h3>
              <p className="text-gray-500 text-xs mt-0.5">Latest found items, lost reports & claims</p>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Live
            </span>
          </div>

          <div className="divide-y divide-white/5 flex-1">
            {activity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                <FaBoxOpen size={28} className="mb-3 opacity-40" />
                <p className="text-sm">No activity yet</p>
              </div>
            ) : (
              activity.map((a) => {
                const statusMeta = claimStatusMeta[a.status];
                return (
                  <Link key={a.id} to={a.link}
                    className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${typeDot[a.type] ?? "bg-gray-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate group-hover:text-cyan-400 transition-colors">{a.label}</p>
                      <p className="text-gray-500 text-xs truncate mt-0.5">{a.sub}</p>
                    </div>
                    <div className="shrink-0 text-right space-y-1">
                      {statusMeta ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusMeta.color}`}>
                          {statusMeta.icon} {statusMeta.label}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-[10px] px-2 py-0.5 bg-white/5 rounded-full border border-white/5">{a.status}</span>
                      )}
                      <p className="text-gray-600 text-[10px]">{timeAgo(a.time)}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Pending claims panel */}
        <div className="bg-gray-900 border border-white/5 rounded-2xl flex flex-col">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
            <div>
              <h3 className="text-white text-sm font-semibold">Pending Claims</h3>
              <p className="text-gray-500 text-xs mt-0.5">Awaiting your review</p>
            </div>
            {pendingClaims.length > 0 && (
              <span className="w-5 h-5 bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-[10px] font-bold rounded-full flex items-center justify-center">
                {pendingClaims.length}
              </span>
            )}
          </div>

          <div className="flex-1 divide-y divide-white/5 overflow-auto">
            {pendingClaims.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                <FaCheckCircle size={24} className="mb-3 opacity-40" />
                <p className="text-sm">All caught up!</p>
                <p className="text-xs mt-1 opacity-60">No pending claims</p>
              </div>
            ) : (
              pendingClaims.slice(0, 6).map((claim: any) => (
                <div key={claim.id} className="px-5 py-3.5">
                  <p className="text-white text-xs font-medium truncate">{claim.foundItem?.foundItemName ?? "Unknown"}</p>
                  <p className="text-gray-500 text-[11px] mt-0.5 truncate">{claim.claimantName || "Anonymous"}</p>
                  {claim.contactNumber && <p className="text-gray-600 text-[10px] mt-0.5">{claim.contactNumber}</p>}
                  <p className="text-gray-700 text-[10px] mt-1">{timeAgo(claim.createdAt)}</p>
                </div>
              ))
            )}
          </div>

          <div className="px-5 py-4 border-t border-white/5">
            <Link to="/dashboard/claims"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 text-xs font-medium transition-all">
              View all claims <FaArrowRight size={10} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-5">
        <h3 className="text-white text-sm font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Add Category",  icon: <FaBoxOpen size={16} />,             href: "/dashboard/categories",  color: "text-cyan-400   bg-cyan-400/5   hover:bg-cyan-400/10   border-cyan-400/10"   },
            { label: "Manage Users",  icon: <FaUsers size={16} />,               href: "/dashboard/users",       color: "text-violet-400 bg-violet-400/5 hover:bg-violet-400/10 border-violet-400/10" },
            { label: "Review Claims", icon: <FaClipboardList size={16} />,       href: "/dashboard/claims",      color: "text-yellow-400 bg-yellow-400/5 hover:bg-yellow-400/10 border-yellow-400/10" },
            { label: "Lost Items",    icon: <FaExclamationTriangle size={16} />, href: "/dashboard/lost-items",  color: "text-red-400    bg-red-400/5    hover:bg-red-400/10    border-red-400/10"    },
          ].map((action) => (
            <Link key={action.href} to={action.href}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all duration-150 ${action.color}`}>
              {action.icon}
              <span className="text-xs font-medium text-center leading-tight">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;