import { Link } from "react-router-dom";
import {
  FaBoxOpen, FaClipboardList, FaExclamationTriangle, FaUsers,
  FaArrowRight, FaSearch, FaCheckCircle, FaTimesCircle, FaClock,
  FaRecycle, FaChartBar, FaCalendarWeek,
  FaArchive, FaHistory, FaExclamationCircle,
} from "react-icons/fa";
import {
  useAdminStatsQuery,
  useGetAllClaimsQuery,
  useGetFoundItemsQuery,
  useGetLostItemsQuery,
  useGetArchivedFoundItemsQuery,
  useGetStaleFoundItemsQuery,
  useGetAuditLogsQuery,
} from "../redux/api/api";

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });

const claimStatusMeta: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:   { label: "Pending",   color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",    icon: <FaClock size={10} />            },
  APPROVED:  { label: "Approved",  color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: <FaCheckCircle size={10} />      },
  REJECTED:  { label: "Rejected",  color: "text-red-400 bg-red-400/10 border-red-400/20",             icon: <FaTimesCircle size={10} />      },
  Claimed:   { label: "Claimed",   color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: <FaCheckCircle size={10} />      },
  Available: { label: "Available", color: "text-blue-400 bg-blue-400/10 border-blue-400/20",          icon: <FaSearch size={10} />           },
  Lost:      { label: "Lost",      color: "text-red-400 bg-red-400/10 border-red-400/20",             icon: <FaExclamationTriangle size={10} /> },
};

interface StatCardProps {
  label: string; value: string | number; icon: React.ReactNode;
  accent: string; href: string; sub?: string; subColor?: string;
}
const StatCard = ({ label, value, icon, accent, href, sub, subColor }: StatCardProps) => (
  <Link to={href} className="group relative bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 hover:border-white/10 transition-all duration-200 overflow-hidden">
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${accent} blur-3xl scale-150`} />
    <div className="relative flex items-start justify-between">
      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${accent} bg-opacity-10`}>{icon}</div>
      <FaArrowRight size={11} className="text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all mt-1" />
    </div>
    <div className="relative">
      <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{value ?? "—"}</p>
      <p className="text-gray-500 text-xs mt-0.5 font-medium">{label}</p>
      {sub && <p className={`text-[11px] mt-1.5 font-medium ${subColor ?? "text-gray-500"}`}>{sub}</p>}
    </div>
  </Link>
);

interface RateCardProps {
  label: string; value: number; icon: React.ReactNode; color: string; bar: string; sub: string;
}
const RateCard = ({ label, value, icon, color, bar, sub }: RateCardProps) => (
  <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
        <p className="text-white text-sm font-semibold">{label}</p>
      </div>
      <p className={`text-xl sm:text-2xl font-bold ${color.includes("emerald") ? "text-emerald-400" : color.includes("blue") ? "text-blue-400" : "text-cyan-400"}`}>{value}%</p>
    </div>
    <div className="w-full bg-gray-800 rounded-full h-2">
      <div className={`h-2 rounded-full transition-all duration-700 ${bar}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
    <p className="text-gray-500 text-xs">{sub}</p>
  </div>
);

const MiniStat = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="bg-gray-800/60 rounded-xl p-2.5 sm:p-3 text-center border border-white/5">
    <p className={`text-lg sm:text-xl font-bold ${color}`}>{value}</p>
    <p className="text-gray-500 text-[10px] mt-0.5">{label}</p>
  </div>
);

const typeDot: Record<string, string> = {
  found: "bg-cyan-400",
  lost:  "bg-red-400",
  claim: "bg-yellow-400",
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "PENDING":  return "bg-yellow-400/10 text-yellow-400 border-yellow-400/20";
    case "APPROVED": return "bg-emerald-400/10 text-emerald-400 border-emerald-400/20";
    case "REJECTED": return "bg-red-400/10 text-red-400 border-red-400/20";
    case "SUBMITTED": return "bg-cyan-400/10 text-cyan-400 border-cyan-400/20";
    default:         return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  }
};

const Dashboard = () => {
  const { data: statsData,      isLoading: statsLoading }  = useAdminStatsQuery({});
  const { data: claimsData,     isLoading: claimsLoading } = useGetAllClaimsQuery(undefined);
  const { data: foundItemsData, isLoading: foundLoading }  = useGetFoundItemsQuery({ page: 1, limit: 5, sortBy: "createdAt", sortOrder: "desc" });
  const { data: lostItemsData,  isLoading: lostLoading }   = useGetLostItemsQuery({ page: 1, limit: 5, sortBy: "createdAt", sortOrder: "desc" });
  const { data: archivedData }                             = useGetArchivedFoundItemsQuery(undefined);
  const { data: staleData }                                = useGetStaleFoundItemsQuery(undefined);
  const { data: auditData }                                = useGetAuditLogsQuery({});

  const stats        = statsData?.data;
  const isLoading    = statsLoading || claimsLoading || foundLoading || lostLoading;
  const archivedItems = archivedData?.data ?? [];
  const staleItems    = staleData?.data    ?? [];
  const auditLogs     = auditData?.data    ?? [];

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

  // Recent audit log entries (last 6)
  const recentAuditLogs = [...auditLogs]
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  if (isLoading) return (
    <div className="space-y-4 sm:space-y-6 animate-pulse">
      <div className="h-20 sm:h-24 bg-gray-800/60 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 sm:h-32 bg-gray-800/60 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="lg:col-span-2 h-64 sm:h-80 bg-gray-800/60 rounded-2xl" />
        <div className="h-64 sm:h-80 bg-gray-800/60 rounded-2xl" />
      </div>
    </div>
  );

  const activity = buildActivity();

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">

      {/* Banner */}
      <div className="relative bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Good to see you!</h2>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              NBSC SAS · Lost & Found System
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard/found-items"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-xs sm:text-sm font-medium rounded-xl transition-all">
              <FaSearch size={11} /> Found Items
            </Link>
            <Link to="/dashboard/claims"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs sm:text-sm font-medium rounded-xl transition-all">
              <FaClipboardList size={11} /> Review Claims
            </Link>
          </div>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Found Items"    value={stats?.foundItems ?? 0}    icon={<FaSearch size={15} className="text-cyan-400" />}            accent="bg-cyan-500/5"   href="/dashboard/found-items" sub={`+${stats?.foundThisWeek ?? 0} this week`}  subColor="text-cyan-400"   />
        <StatCard label="Lost Items"     value={stats?.lostItems ?? 0}     icon={<FaExclamationTriangle size={15} className="text-red-400" />} accent="bg-red-500/5"    href="/dashboard/lost-items"  sub={`+${stats?.lostThisWeek ?? 0} this week`}   subColor="text-red-400"    />
        <StatCard label="Pending Claims" value={stats?.pendingClaims ?? 0} icon={<FaClipboardList size={15} className="text-yellow-400" />}   accent="bg-yellow-500/5" href="/dashboard/claims"       sub={`${stats?.approvedClaims ?? 0} approved · ${stats?.rejectedClaims ?? 0} rejected`} subColor="text-yellow-400" />
        <StatCard label="Total Users"    value={stats?.totalUsers ?? 0}    icon={<FaUsers size={15} className="text-violet-400" />}           accent="bg-violet-500/5" href="/dashboard/users"        sub={`${stats?.totalClaims ?? 0} total claims`}  subColor="text-violet-400" />
      </div>

      {/* Rates + Weekly */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <RateCard label="Disposal Rate"   value={stats?.disposalRate ?? 0}   icon={<FaRecycle size={14} className="text-emerald-400" />} color="bg-emerald-400/10 text-emerald-400" bar="bg-emerald-400" sub={`${stats?.claimedItems ?? 0} of ${stats?.foundItems ?? 0} found items have been claimed`} />
        <RateCard label="Resolution Rate" value={stats?.resolutionRate ?? 0} icon={<FaChartBar size={14} className="text-blue-400" />}   color="bg-blue-400/10 text-blue-400"       bar="bg-blue-400"    sub={`${stats?.resolvedLostItems ?? 0} of ${stats?.lostItems ?? 0} lost items have been found`}    />
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-orange-400/10 flex items-center justify-center">
              <FaCalendarWeek size={14} className="text-orange-400" />
            </div>
            <p className="text-white text-sm font-semibold">This Week</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="Found"  value={stats?.foundThisWeek  ?? 0} color="text-cyan-400"   />
            <MiniStat label="Lost"   value={stats?.lostThisWeek   ?? 0} color="text-red-400"    />
            <MiniStat label="Claims" value={stats?.claimsThisWeek ?? 0} color="text-yellow-400" />
          </div>
          <p className="text-gray-600 text-[11px] mt-1">
            {stats?.itemsLoggedThisWeek ?? 0} total items logged in the last 7 days
          </p>
        </div>
      </div>

      {/* Activity + Pending Claims */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 min-h-0">

        {/* Activity feed */}
        <div className="lg:col-span-2 bg-gray-900 border border-white/5 rounded-2xl flex flex-col min-h-[320px]">
          <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-white/5">
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
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-gray-600">
                <FaBoxOpen size={28} className="mb-3 opacity-40" /><p className="text-sm">No activity yet</p>
              </div>
            ) : activity.map((a) => {
              const statusMeta = claimStatusMeta[a.status];
              return (
                <Link key={a.id} to={a.link}
                  className="flex items-center gap-3 sm:gap-3.5 px-4 sm:px-5 py-3 sm:py-3.5 hover:bg-white/[0.02] transition-colors group">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${typeDot[a.type] ?? "bg-gray-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs sm:text-sm font-medium truncate group-hover:text-cyan-400 transition-colors">{a.label}</p>
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
            })}
          </div>
        </div>

        {/* Pending claims panel */}
        <div className="bg-gray-900 border border-white/5 rounded-2xl flex flex-col min-h-[280px]">
          <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-white/5">
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
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-gray-600">
                <FaCheckCircle size={24} className="mb-3 opacity-40" />
                <p className="text-sm">All caught up!</p>
                <p className="text-xs mt-1 opacity-60">No pending claims</p>
              </div>
            ) : pendingClaims.slice(0, 6).map((claim: any) => (
              <div key={claim.id} className="px-4 sm:px-5 py-3 sm:py-3.5">
                <p className="text-white text-xs font-medium truncate">{claim.foundItem?.foundItemName ?? "Unknown"}</p>
                <p className="text-gray-500 text-[11px] mt-0.5 truncate">{claim.claimantName || "Anonymous"}</p>
                {claim.contactNumber && <p className="text-gray-600 text-[10px] mt-0.5">{claim.contactNumber}</p>}
                <p className="text-gray-700 text-[10px] mt-1">{timeAgo(claim.createdAt)}</p>
              </div>
            ))}
          </div>
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-white/5">
            <Link to="/dashboard/claims"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 text-xs font-medium transition-all">
              View all claims <FaArrowRight size={10} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Archive Overview + Claim History ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">

        {/* Archive Overview */}
        <div className="bg-gray-900 border border-white/5 rounded-2xl flex flex-col">
          <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-white/5">
            <div>
              <h3 className="text-white text-sm font-semibold flex items-center gap-2">
                <FaArchive size={13} className="text-orange-400" /> Archive Overview
              </h3>
              <p className="text-gray-500 text-xs mt-0.5">Stale & archived found items</p>
            </div>
            <Link to="/dashboard/found-items/archive"
              className="text-[11px] text-orange-400 hover:text-orange-300 font-medium transition-colors flex items-center gap-1">
              Manage <FaArrowRight size={9} />
            </Link>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-2 gap-3 p-4 sm:p-5 border-b border-white/5">
            <div className="bg-orange-500/5 border border-orange-500/15 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <FaExclamationCircle size={11} className="text-orange-400" />
                <p className="text-orange-400 text-[10px] font-semibold uppercase tracking-widest">Stale Items</p>
              </div>
              <p className="text-2xl font-bold text-orange-400">{staleItems.length}</p>
              <p className="text-gray-600 text-[10px] mt-0.5">Unclaimed 30+ days</p>
            </div>
            <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <FaArchive size={11} className="text-gray-400" />
                <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest">Archived</p>
              </div>
              <p className="text-2xl font-bold text-gray-300">{archivedItems.length}</p>
              <p className="text-gray-600 text-[10px] mt-0.5">Hidden from public</p>
            </div>
          </div>

          {/* Stale items preview */}
          <div className="flex-1 divide-y divide-white/5 overflow-auto max-h-[240px]">
            {staleItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-600">
                <FaCheckCircle size={22} className="mb-2 opacity-40 text-emerald-500" />
                <p className="text-xs text-gray-400">No stale items</p>
                <p className="text-[10px] mt-0.5 opacity-60">All items claimed within 30 days</p>
              </div>
            ) : staleItems.slice(0, 5).map((item: any) => {
              const daysOld = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24));
              const isVeryStale = daysOld > 60;
              return (
                <div key={item.id} className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <img
                    src={item.img || "/bgimg.png"}
                    alt={item.foundItemName}
                    onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
                    className="w-8 h-8 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{item.foundItemName}</p>
                    <p className="text-gray-500 text-[10px] truncate">{item.location}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isVeryStale
                        ? "bg-red-400/10 text-red-400 border-red-400/20"
                        : "bg-orange-400/10 text-orange-400 border-orange-400/20"
                    }`}>
                      {daysOld}d
                    </span>
                    <p className="text-gray-700 text-[10px] mt-0.5">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {staleItems.length > 5 && (
            <div className="px-4 sm:px-5 py-3 border-t border-white/5">
              <Link to="/dashboard/found-items/archive"
                className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/15 text-orange-400 text-xs font-medium transition-all">
                View all {staleItems.length} stale items <FaArrowRight size={10} />
              </Link>
            </div>
          )}

          {/* Archived preview (recent 3) */}
          {archivedItems.length > 0 && (
            <>
              <div className="px-4 sm:px-5 py-2.5 border-t border-white/5 bg-white/[0.01]">
                <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">Recently Archived</p>
              </div>
              <div className="divide-y divide-white/5">
                {archivedItems.slice(0, 3).map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-white/[0.02] transition-colors">
                    <img
                      src={item.img || "/bgimg.png"}
                      alt={item.foundItemName}
                      onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
                      className="w-8 h-8 rounded-lg object-cover shrink-0 opacity-60"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-xs font-medium truncate">{item.foundItemName}</p>
                      <p className="text-gray-600 text-[10px]">
                        {item.claim ? (
                          <span className="text-emerald-500/70">Claimed · </span>
                        ) : null}
                        Archived {item.archivedAt ? timeAgo(item.archivedAt) : "—"}
                      </p>
                    </div>
                    <FaArchive size={10} className="text-gray-700 shrink-0" />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Claim History / Audit Log Preview */}
        <div className="bg-gray-900 border border-white/5 rounded-2xl flex flex-col">
          <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-white/5">
            <div>
              <h3 className="text-white text-sm font-semibold flex items-center gap-2">
                <FaHistory size={13} className="text-violet-400" /> Claim History
              </h3>
              <p className="text-gray-500 text-xs mt-0.5">Recent status changes & audit trail</p>
            </div>
            <Link to="/dashboard/claims"
              className="text-[11px] text-violet-400 hover:text-violet-300 font-medium transition-colors flex items-center gap-1">
              Full log <FaArrowRight size={9} />
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 p-4 sm:p-5 border-b border-white/5">
            {[
              { label: "Total",    value: (claimsData?.data || []).length,                                                    color: "text-white"       },
              { label: "Approved", value: (claimsData?.data || []).filter((c: any) => c.status === "APPROVED").length,        color: "text-emerald-400" },
              { label: "Rejected", value: (claimsData?.data || []).filter((c: any) => c.status === "REJECTED").length,        color: "text-red-400"     },
            ].map(s => (
              <div key={s.label} className="bg-gray-800/50 border border-white/5 rounded-xl p-2.5 text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-gray-600 text-[10px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Recent audit entries timeline */}
          <div className="flex-1 overflow-auto max-h-[360px]">
            {recentAuditLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                <FaHistory size={22} className="mb-2 opacity-40" />
                <p className="text-xs text-gray-400">No audit history yet</p>
                <p className="text-[10px] mt-0.5 opacity-60">Status changes will appear here</p>
              </div>
            ) : (
              <div className="relative px-4 sm:px-5 py-4">
                {/* vertical line */}
                <div className="absolute left-[28px] sm:left-[32px] top-4 bottom-4 w-px bg-gray-800" />
                <div className="space-y-4">
                  {recentAuditLogs.map((log: any) => {
                    const isApproved = log.toStatus === "APPROVED";
                    const isRejected = log.toStatus === "REJECTED";
                    return (
                      <div key={log.id} className="relative flex items-start gap-3">
                        {/* Timeline dot */}
                        <div className={`relative z-10 w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isApproved
                            ? "bg-emerald-400/10 border-emerald-400"
                            : isRejected
                            ? "bg-red-400/10 border-red-400"
                            : "bg-violet-400/10 border-violet-400"
                        }`}>
                          {isApproved
                            ? <FaCheckCircle size={10} className="text-emerald-400" />
                            : isRejected
                            ? <FaTimesCircle size={10} className="text-red-400" />
                            : <FaHistory size={10} className="text-violet-400" />
                          }
                        </div>

                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-white text-xs font-semibold truncate">
                                {log.claim?.foundItem?.foundItemName ?? "Unknown Item"}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadge(log.fromStatus)}`}>
                                  {log.fromStatus}
                                </span>
                                <span className="text-gray-700 text-[10px]">→</span>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadge(log.toStatus)}`}>
                                  {log.toStatus}
                                </span>
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-gray-600 text-[10px]">{timeAgo(log.createdAt)}</p>
                            </div>
                          </div>
                          <p className="text-gray-600 text-[10px] mt-1">
                            By <span className="text-gray-400">{log.performedBy}</span>
                          </p>
                          {log.note && (
                            <p className="text-gray-700 text-[10px] mt-0.5 italic truncate">"{log.note}"</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-white/5">
            <Link to="/dashboard/claims"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-violet-500/5 hover:bg-violet-500/10 border border-violet-500/15 text-violet-400 text-xs font-medium transition-all">
              View full audit log <FaArrowRight size={10} />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-5">
        <h3 className="text-white text-sm font-semibold mb-3 sm:mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: "Add Category",   icon: <FaBoxOpen size={16} />,       href: "/dashboard/categories",          color: "text-cyan-400   bg-cyan-400/5   hover:bg-cyan-400/10   border-cyan-400/10"   },
            { label: "Manage Users",   icon: <FaUsers size={16} />,          href: "/dashboard/users",               color: "text-violet-400 bg-violet-400/5 hover:bg-violet-400/10 border-violet-400/10" },
            { label: "Review Claims",  icon: <FaClipboardList size={16} />,  href: "/dashboard/claims",              color: "text-yellow-400 bg-yellow-400/5 hover:bg-yellow-400/10 border-yellow-400/10" },
            { label: "Archive Log",    icon: <FaArchive size={16} />,        href: "/dashboard/found-items/archive", color: "text-orange-400 bg-orange-400/5 hover:bg-orange-400/10 border-orange-400/10" },
          ].map((action) => (
            <Link key={action.href} to={action.href}
              className={`flex flex-col items-center gap-2 sm:gap-2.5 p-3 sm:p-4 rounded-xl border transition-all duration-150 ${action.color}`}>
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