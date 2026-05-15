import React, { useState } from "react";
import {
  FaShieldAlt, FaLock, FaUserShield, FaFileAlt,
  FaExclamationTriangle, FaCheckCircle, FaTimesCircle,
  FaSignInAlt, FaBan, FaTrash, FaUserCheck, FaUserSlash,
  FaDownload, FaSync, FaEye, FaClock, FaGlobe,
  FaChartBar, FaUsers, FaDatabase,
} from "react-icons/fa";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { toast } from "react-toastify";
import { baseApi } from "../../redux/api/baseApi";
import {
  useBlockUserMutation,
  useSoftDeleteUserMutation,
} from "../../redux/api/api";

// ── RTK Query endpoints ───────────────────────────────────────────────────────
const securityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSecurityStats:   builder.query({ query: () => ({ url: "/admin/security/stats",       method: "GET" }), providesTags:    ["security"] }),
    getLoginLogs:       builder.query({ query: (s?: string) => ({ url: "/admin/security/logs", method: "GET", params: s ? { success: s } : {} }), providesTags: ["security"] }),
    getAccessControl:   builder.query({ query: () => ({ url: "/admin/security/access-control",      method: "GET" }), providesTags:    ["security"] }),
    getPrivacyStats:    builder.query({ query: () => ({ url: "/admin/security/privacy",     method: "GET" }), providesTags:    ["security"] }),
    exportUserData:     builder.query({ query: () => ({ url: "/admin/security/export",      method: "GET" }) }),
    getPurgeCheck:      builder.query({ query: () => ({ url: "/admin/security/purge-check", method: "GET" }) }),
    getComplianceReport:builder.query({ query: () => ({ url: "/admin/security/compliance",  method: "GET" }), providesTags:    ["security"] }),
    clearOldLogs:       builder.mutation({ query: () => ({ url: "/admin/security/logs",     method: "DELETE" }), invalidatesTags: ["security"] }),
  }),
  overrideExisting: false,
});

const {
  useGetSecurityStatsQuery, useGetLoginLogsQuery, useGetAccessControlQuery,
  useGetPrivacyStatsQuery, useGetComplianceReportQuery,
  useLazyExportUserDataQuery, useGetPurgeCheckQuery,
  useClearOldLogsMutation,
} = securityApi;

// ── Helpers ───────────────────────────────────────────────────────────────────
const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const downloadCSV = (data: any[], filename: string) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(",");
  const rows    = data.map(r => Object.values(r).map(v => `"${v}"`).join(",")).join("\n");
  const blob    = new Blob([`${headers}\n${rows}`], { type: "text/csv" });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement("a");
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-white/10 rounded-xl px-4 py-3 shadow-2xl text-xs">
      <p className="text-gray-400 font-medium mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1 last:mb-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-gray-300 capitalize">{p.name}:</span>
          <span className="text-white font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const TABS = [
  { id: "monitor",    label: "Security Monitor",   icon: FaShieldAlt   },
  { id: "access",     label: "Access Control",     icon: FaUserShield  },
  { id: "privacy",    label: "Data Privacy",       icon: FaLock        },
  { id: "compliance", label: "Compliance Reports", icon: FaFileAlt     },
];

const StatCard = ({ label, value, color, bg, icon, sub }: any) => (
  <div className={`rounded-2xl border p-4 bg-gray-900 flex items-center gap-3 ${bg}`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>{icon}</div>
    <div>
      <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
      <p className="text-gray-500 text-xs font-medium">{label}</p>
    </div>
  </div>
);

const SectionCard = ({ title, subtitle, children, action }: any) => (
  <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-4 border-b border-white/5">
      <div className="min-w-0">
        <h3 className="text-white text-sm font-semibold">{title}</h3>
        {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 self-end sm:self-auto">{action}</div>}
    </div>
    {children}
  </div>
);

// ════════════════════════════════════════════════════════════════════════════════
// TAB: SECURITY MONITOR
// ════════════════════════════════════════════════════════════════════════════════
const SecurityMonitorTab = () => {
  const { data: statsData, isLoading, refetch } = useGetSecurityStatsQuery(undefined);
  const [clearLogs, { isLoading: isClearing }] = useClearOldLogsMutation();
  const [logFilter, setLogFilter] = useState("");
  const { data: logsData } = useGetLoginLogsQuery(logFilter || undefined);
  const stats = statsData?.data;
  const logs: any[] = logsData?.data || [];

  const handleClearLogs = async () => {
    if (!confirm("Clear all login logs older than 30 days?")) return;
    const res: any = await clearLogs(undefined);
    if (res?.data?.success) toast.success(res.data.message);
    else toast.error("Failed to clear logs");
  };

  if (isLoading) return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-20 bg-gray-800/60 rounded-2xl"/>)}</div>
      <div className="h-64 bg-gray-800/60 rounded-2xl"/>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Logins (24h)"   value={stats?.totalLogins24h}            color="text-cyan-400"    bg="bg-cyan-400/10 border-cyan-400/20"    icon={<FaSignInAlt   size={14} className="text-cyan-400"   />} />
        <StatCard label="Failed (24h)"   value={stats?.failedLogins24h}           color="text-red-400"     bg="bg-red-400/10 border-red-400/20"      icon={<FaTimesCircle size={14} className="text-red-400"   />} />
        <StatCard label="Suspicious IPs" value={stats?.suspiciousIps?.length ?? 0} color="text-orange-400" bg="bg-orange-400/10 border-orange-400/20" icon={<FaGlobe       size={14} className="text-orange-400"/>} />
        <StatCard label="Blocked Users"  value={stats?.blockedUsers}              color="text-yellow-400"  bg="bg-yellow-400/10 border-yellow-400/20" icon={<FaBan         size={14} className="text-yellow-400"/>} />
      </div>

      {/* Login trend chart */}
      <SectionCard
        title="Login Activity — Last 7 Days"
        subtitle="Successful vs failed login attempts"
        action={
          <button onClick={() => refetch()} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 hover:text-white text-xs rounded-lg transition-all">
            <FaSync size={9} /> Refresh
          </button>
        }
      >
        <div className="px-2 pb-4 pt-4 h-64">
          {(stats?.loginTrend || []).length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">No login data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.loginTrend || []} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="success" name="Success" stroke="#22d3ee" strokeWidth={2} dot={{ fill: "#22d3ee", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="failed"  name="Failed"  stroke="#f87171" strokeWidth={2} dot={{ fill: "#f87171", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </SectionCard>

      {/* Suspicious IPs */}
      {(stats?.suspiciousIps || []).length > 0 && (
        <SectionCard title="Suspicious IP Addresses" subtitle="IPs with 5+ failed login attempts in the last 24 hours">
          <div className="divide-y divide-white/5">
            {stats.suspiciousIps.map((ip: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-400/10 border border-orange-400/20 flex items-center justify-center">
                    <FaGlobe size={11} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-mono font-semibold">{ip.ip || "Unknown"}</p>
                    <p className="text-gray-600 text-[10px]">Multiple failed attempts detected</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-red-400/10 border border-red-400/20 text-red-400 text-xs font-bold rounded-full">
                  {ip.attempts} attempts
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Login logs */}
      <SectionCard
        title="Recent Login Logs"
        subtitle="Latest authentication activity"
        action={
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex flex-1 sm:flex-none gap-1 bg-gray-800 border border-white/5 rounded-lg p-1">
            {[["", "All"], ["true", "Success"], ["false", "Failed"]].map(([val, label]) => (
              <button key={val} onClick={() => setLogFilter(val)}
                className={`flex-1 sm:flex-none px-2 py-1 rounded-md text-[10px] font-medium transition-all ${logFilter === val ? "bg-cyan-500/10 text-cyan-400" : "text-gray-500 hover:text-white"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => downloadCSV(logs, "login-logs")}
              className="flex items-center gap-1 px-2 py-1.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 hover:text-white text-[10px] font-bold rounded-lg transition-all whitespace-nowrap">
              <FaDownload size={8} /> Export
            </button>
            <button onClick={handleClearLogs} disabled={isClearing}
              className="flex items-center gap-1 px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap">
              <FaTrash size={8} /> Clear
            </button>
          </div>
        </div>
      }
      >
        <div className="divide-y divide-white/5 max-h-96 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.2) rgba(255,255,255,0.05)" }}>
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-600">
              <FaSignInAlt size={24} className="mb-2 opacity-30" />
              <p className="text-sm">No login logs yet</p>
            </div>
          ) : logs.map((log: any) => (
            <div key={log.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${log.success ? "bg-emerald-400/10 border border-emerald-400/20" : "bg-red-400/10 border border-red-400/20"}`}>
                {log.success
                  ? <FaCheckCircle size={10} className="text-emerald-400" />
                  : <FaTimesCircle size={10} className="text-red-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white text-xs font-semibold truncate">{log.email || log.username || "Unknown"}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${log.success ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>
                    {log.success ? "Success" : "Failed"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-600 mt-0.5 flex-wrap">
                  {log.ipAddress && <span className="font-mono">{log.ipAddress}</span>}
                  {log.reason && !log.success && <span className="text-red-700">{log.reason}</span>}
                </div>
              </div>
              <span className="text-gray-700 text-[10px] shrink-0">{timeAgo(log.createdAt)}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// TAB: ACCESS CONTROL
// ════════════════════════════════════════════════════════════════════════════════
const AccessControlTab = () => {
  const { data: accessData, isLoading, refetch } = useGetAccessControlQuery(undefined);
  const [blockUser]      = useBlockUserMutation();
  const [deleteUser]     = useSoftDeleteUserMutation();
  const [search, setSearch]   = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const users: any[]  = accessData?.data?.users  || [];
  const stats: any    = accessData?.data?.stats   || {};

  const filtered = users.filter(u => {
    const matchSearch = !search || u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = !roleFilter || u.role === roleFilter;
    const matchStatus = !statusFilter ||
      (statusFilter === "active"  && u.activated && !u.isDeleted) ||
      (statusFilter === "blocked" && !u.activated && !u.isDeleted) ||
      (statusFilter === "deleted" && u.isDeleted);
    return matchSearch && matchRole && matchStatus;
  });

  const handleBlock = async (id: string, name: string) => {
    const res: any = await blockUser(id);
    if (res?.data?.success) { toast.success(`${name} status updated`); refetch(); }
    else toast.error("Failed to update user status");
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Soft delete ${name}? They can be restored later.`)) return;
    const res: any = await deleteUser(id);
    if (res?.data?.success) { toast.success(`${name} deleted`); refetch(); }
    else toast.error("Failed to delete user");
  };

  if (isLoading) return <div className="space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="h-16 bg-gray-800/60 rounded-2xl animate-pulse"/>)}</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total Users",   value: stats.total,   color: "text-white",         bg: "bg-white/5 border-white/10"              },
          { label: "Admins",        value: stats.admins,  color: "text-violet-400",    bg: "bg-violet-400/10 border-violet-400/20"   },
          { label: "Active",        value: stats.active,  color: "text-emerald-400",   bg: "bg-emerald-400/10 border-emerald-400/20" },
          { label: "Blocked",       value: stats.blocked, color: "text-yellow-400",    bg: "bg-yellow-400/10 border-yellow-400/20"   },
          { label: "Deleted",       value: stats.deleted, color: "text-red-400",       bg: "bg-red-400/10 border-red-400/20"         },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-3 bg-gray-900 text-center ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value ?? 0}</p>
            <p className="text-gray-500 text-[10px] font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
          className="flex-1 px-4 py-2.5 bg-gray-900 border border-white/5 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30" />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-900 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30">
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="USER">User</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-900 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>

      {/* User table */}
      <SectionCard title={`Users (${filtered.length})`} subtitle="Manage roles, access and account status">
        <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.2) rgba(255,255,255,0.05)" }}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-600">
              <FaUsers size={24} className="mb-2 opacity-30" />
              <p className="text-sm">No users found</p>
            </div>
          ) : filtered.map((u: any) => (
            <div key={u.id} className={`flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors ${u.isDeleted ? "opacity-50" : ""}`}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {u.username?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white text-xs font-semibold truncate">{u.username}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${u.role === "ADMIN" ? "bg-violet-400/10 border-violet-400/20 text-violet-400" : "bg-gray-400/10 border-gray-400/20 text-gray-400"}`}>{u.role}</span>
                  {u.isDeleted && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-400/10 border border-red-400/20 text-red-400">Deleted</span>}
                  {!u.activated && !u.isDeleted && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400">Blocked</span>}
                </div>
                <p className="text-gray-600 text-[10px] mt-0.5 truncate">{u.email}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {!u.isDeleted && (
                  <>
                    <button onClick={() => handleBlock(u.id, u.username)} title={u.activated ? "Block user" : "Unblock user"}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all text-[10px]
                        ${u.activated ? "bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400" : "bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400"}`}>
                      {u.activated ? <FaBan size={9} /> : <FaUserCheck size={9} />}
                    </button>
                    <button onClick={() => handleDelete(u.id, u.username)} title="Delete user"
                      className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 flex items-center justify-center transition-all">
                      <FaTrash size={9} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// TAB: DATA PRIVACY
// ════════════════════════════════════════════════════════════════════════════════
const DataPrivacyTab = () => {
  const { data: privacyData, isLoading } = useGetPrivacyStatsQuery(undefined);
  const { data: purgeData }              = useGetPurgeCheckQuery(undefined);
  const [triggerExport]                  = useLazyExportUserDataQuery();
  const stats = privacyData?.data;

  const handleExport = async () => {
    const res: any = await triggerExport(undefined);
    if (res?.data?.success) {
      downloadCSV(res.data.data, "nbsc-user-data-export");
      toast.success("User data exported as CSV");
    } else {
      toast.error("Export failed");
    }
  };

  if (isLoading) return <div className="space-y-3">{Array.from({length:3}).map((_,i)=><div key={i} className="h-32 bg-gray-800/60 rounded-2xl animate-pulse"/>)}</div>;

  const purgeEligible = purgeData?.data?.eligible ?? 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Users"    value={stats?.totalUsers}       color="text-white"        bg="bg-white/5 border-white/10"              icon={<FaUsers size={14} className="text-gray-400"/>} />
        <StatCard label="Deleted Users"  value={stats?.deletedUsers}     color="text-red-400"      bg="bg-red-400/10 border-red-400/20"          icon={<FaUserSlash size={14} className="text-red-400"/>} />
        <StatCard label="With School ID" value={stats?.usersWithSchoolId} color="text-cyan-400"    bg="bg-cyan-400/10 border-cyan-400/20"        icon={<FaDatabase size={14} className="text-cyan-400"/>} />
        <StatCard label="Purge Eligible" value={purgeEligible}           color="text-orange-400"   bg="bg-orange-400/10 border-orange-400/20"    icon={<FaTrash size={14} className="text-orange-400"/>} sub="Deleted 90+ days ago" />
      </div>

      {/* Data retention policy */}
      <SectionCard title="Data Retention Policy" subtitle="How user data is managed in this system">
        <div className="p-5 space-y-3">
          {[
            { label: "Retention Period",    value: "90 days after soft-delete",          color: "text-cyan-400"    },
            { label: "Login Logs",          value: "30 days rolling window",             color: "text-yellow-400"  },
            { label: "Claim Audit Logs",    value: "Kept indefinitely for compliance",   color: "text-emerald-400" },
            { label: "Personal Data",       value: "Name, email, school ID stored only for service delivery", color: "text-gray-300" },
            { label: "Data Shared With",    value: "No third parties — internal use only", color: "text-emerald-400" },
            { label: "Last Privacy Audit",  value: new Date(stats?.lastAuditDate || "").toLocaleDateString(), color: "text-violet-400" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
              <span className="text-gray-400 text-xs">{item.label}</span>
              <span className={`text-xs font-semibold ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Export + Purge actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SectionCard title="Export User Data" subtitle="Download all user data as CSV for compliance">
          <div className="p-5 space-y-4">
            <div className="p-3 bg-cyan-500/5 border border-cyan-500/15 rounded-xl">
              <p className="text-cyan-300/70 text-xs leading-relaxed">
                Exports all active user records including name, email, role, school ID, course, year level, and registration date. No passwords are included.
              </p>
            </div>
            <button onClick={handleExport}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
              <FaDownload size={11} /> Export as CSV
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Purge Check" subtitle="Users eligible for permanent deletion">
          <div className="p-5 space-y-4">
            <div className={`p-3 rounded-xl border ${purgeEligible > 0 ? "bg-orange-500/5 border-orange-500/15" : "bg-emerald-500/5 border-emerald-500/15"}`}>
              <p className={`text-xs leading-relaxed ${purgeEligible > 0 ? "text-orange-300/70" : "text-emerald-300/70"}`}>
                {purgeEligible > 0
                  ? `${purgeEligible} user${purgeEligible !== 1 ? "s were" : " was"} soft-deleted more than 90 days ago and may be eligible for permanent purge.`
                  : "No users are currently eligible for purge. All deleted accounts are within the 90-day retention window."}
              </p>
            </div>
            <div className={`text-center py-3 rounded-xl border ${purgeEligible > 0 ? "bg-orange-400/10 border-orange-400/20" : "bg-emerald-400/10 border-emerald-400/20"}`}>
              <p className={`text-3xl font-bold ${purgeEligible > 0 ? "text-orange-400" : "text-emerald-400"}`}>{purgeEligible}</p>
              <p className="text-gray-500 text-xs mt-0.5">eligible for purge</p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Recently deleted */}
      {(stats?.recentDeleted || []).length > 0 && (
        <SectionCard title="Recently Deleted Accounts" subtitle="Last 10 soft-deleted users">
          <div className="divide-y divide-white/5">
            {stats.recentDeleted.map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-xs font-bold shrink-0">
                  {u.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-300 text-xs font-semibold truncate">{u.username}</p>
                  <p className="text-gray-600 text-[10px] truncate">{u.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-400/10 border border-red-400/20 text-red-400">{u.role}</span>
                  <p className="text-gray-700 text-[10px] mt-1">{u.deletedAt ? timeAgo(u.deletedAt) : "—"}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// TAB: COMPLIANCE REPORTS
// ════════════════════════════════════════════════════════════════════════════════
const ComplianceTab = () => {
  const { data: compData, isLoading, refetch } = useGetComplianceReportQuery(undefined);
  const report  = compData?.data;
  const summary = report?.summary;

  const handleExportAudit = () => {
    if (!report?.auditLogs?.length) { toast.error("No audit logs to export"); return; }
    downloadCSV(report.auditLogs.map((l: any) => ({
      ID:           l.id,
      "Claim ID":   l.claimId,
      Action:       l.action,
      "From Status":l.fromStatus,
      "To Status":  l.toStatus,
      "Performed By": l.performedBy,
      Note:         l.note,
      Date:         new Date(l.createdAt).toLocaleString(),
    })), "claim-audit-logs");
    toast.success("Audit logs exported");
  };

  if (isLoading) return <div className="space-y-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-24 bg-gray-800/60 rounded-2xl animate-pulse"/>)}</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Claims"    value={summary?.totalClaims}       color="text-cyan-400"    bg="bg-cyan-400/10 border-cyan-400/20"    icon={<FaFileAlt size={14} className="text-cyan-400"/>} />
        <StatCard label="Approval Rate"   value={`${summary?.approvalRate ?? 0}%`} color="text-emerald-400" bg="bg-emerald-400/10 border-emerald-400/20" icon={<FaCheckCircle size={14} className="text-emerald-400"/>} />
        <StatCard label="Logins This Month" value={summary?.loginLogsThisMonth} color="text-violet-400" bg="bg-violet-400/10 border-violet-400/20" icon={<FaSignInAlt size={14} className="text-violet-400"/>} />
        <StatCard label="Fail Rate (Mo.)" value={`${summary?.failRateThisMonth ?? 0}%`} color="text-red-400" bg="bg-red-400/10 border-red-400/20" icon={<FaExclamationTriangle size={14} className="text-red-400"/>} />
      </div>

      {/* Monthly audit activity */}
      <SectionCard
        title="Monthly Admin Actions"
        subtitle="Claim audit actions per month — approved vs rejected"
        action={
          <button onClick={() => refetch()} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 hover:text-white text-xs rounded-lg transition-all">
            <FaSync size={9} /> Refresh
          </button>
        }
      >
        <div className="px-2 pb-4 pt-4 h-64">
          {(report?.monthlyAudit || []).length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">No audit data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.monthlyAudit} margin={{ top: 5, right: 20, left: -20, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="approved" name="Approved" fill="#34d399" radius={[4,4,0,0]} maxBarSize={28} />
                <Bar dataKey="rejected" name="Rejected" fill="#f87171" radius={[4,4,0,0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="grid grid-cols-3 border-t border-white/5">
          {[
            { label: "Approved",      value: summary?.approvedClaims, color: "text-emerald-400" },
            { label: "Rejected",      value: summary?.rejectedClaims, color: "text-red-400"     },
            { label: "This Month",    value: summary?.claimsThisMonth,color: "text-cyan-400"    },
          ].map((s, i) => (
            <div key={i} className={`px-5 py-4 flex flex-col gap-1 ${i > 0 ? "border-l border-white/5" : ""}`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value ?? 0}</p>
              <p className="text-gray-600 text-[10px]">{s.label}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* System summary */}
      <SectionCard title="System Summary" subtitle="Overall platform activity snapshot">
        <div className="p-5 space-y-0">
          {[
            { label: "Total Found Items Logged",   value: summary?.totalFoundItems,      color: "text-cyan-400"    },
            { label: "Total Lost Items Reported",  value: summary?.totalLostItems,       color: "text-red-400"     },
            { label: "Total Claims Submitted",     value: summary?.totalClaims,          color: "text-yellow-400"  },
            { label: "Claims Approved",            value: summary?.approvedClaims,       color: "text-emerald-400" },
            { label: "Claims Rejected",            value: summary?.rejectedClaims,       color: "text-red-400"     },
            { label: "New Users This Month",       value: summary?.newUsersThisMonth,    color: "text-violet-400"  },
            { label: "Login Attempts This Month",  value: summary?.loginLogsThisMonth,   color: "text-cyan-400"    },
            { label: "Failed Logins This Month",   value: summary?.failedLoginsThisMonth,color: "text-orange-400"  },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
              <span className="text-gray-400 text-xs">{item.label}</span>
              <span className={`text-sm font-bold ${item.color}`}>{item.value ?? 0}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Audit log table */}
      <SectionCard
        title="Claim Audit Log"
        subtitle="All admin actions on claims — who did what and when"
        action={
          <button onClick={handleExportAudit}
            className="flex items-center gap-1 px-2 py-1.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 hover:text-white text-[10px] font-bold rounded-lg transition-all whitespace-nowrap">
            <FaDownload size={8} /> Export
          </button>
        }
      >
        <div className="divide-y divide-white/5 max-h-96 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.2) rgba(255,255,255,0.05)" }}>
          {(report?.auditLogs || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-600">
              <FaFileAlt size={24} className="mb-2 opacity-30" />
              <p className="text-sm">No audit logs yet</p>
            </div>
          ) : (report.auditLogs || []).map((log: any) => (
            <div key={log.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${log.toStatus === "APPROVED" ? "bg-emerald-400/10 border border-emerald-400/20" : log.toStatus === "REJECTED" ? "bg-red-400/10 border border-red-400/20" : "bg-gray-400/10 border border-gray-400/20"}`}>
                {log.toStatus === "APPROVED" ? <FaCheckCircle size={9} className="text-emerald-400" /> : log.toStatus === "REJECTED" ? <FaTimesCircle size={9} className="text-red-400" /> : <FaClock size={9} className="text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white text-xs font-semibold truncate">{log.claim?.claimantName || "Unknown"}</p>
                  <span className="text-gray-600 text-[10px]">→</span>
                  <span className="text-gray-400 text-[10px]">{log.claim?.foundItem?.foundItemName || "Unknown item"}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-600 flex-wrap">
                  <span>{log.fromStatus} → <span className={log.toStatus === "APPROVED" ? "text-emerald-600" : log.toStatus === "REJECTED" ? "text-red-600" : "text-gray-500"}>{log.toStatus}</span></span>
                  <span>·</span>
                  <span>By {log.performedBy}</span>
                  {log.note && <><span>·</span><span className="italic">{log.note}</span></>}
                </div>
              </div>
              <span className="text-gray-700 text-[10px] shrink-0">{timeAgo(log.createdAt)}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// MAIN: SecurityCompliance
// ════════════════════════════════════════════════════════════════════════════════
const SecurityCompliance = () => {
  const [activeTab, setActiveTab] = useState("monitor");

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Tabs */}
      <div className="grid grid-cols-4 bg-gray-900 border border-white/5 rounded-xl p-0.5 gap-0.5">
      {TABS.map(tab => {
        const Icon   = tab.icon;
        const active = activeTab === tab.id;
        return (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            title={tab.label}
            className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] font-medium transition-colors w-full focus:outline-none select-none
              ${active
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                : "text-gray-500 hover:text-gray-200 hover:bg-white/5 border border-transparent"
              }`}>
            <Icon size={10} className={`transition-colors shrink-0 ${active ? "text-cyan-400" : "text-gray-600"}`} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>

      {activeTab === "monitor"    && <SecurityMonitorTab />}
      {activeTab === "access"     && <AccessControlTab />}
      {activeTab === "privacy"    && <DataPrivacyTab />}
      {activeTab === "compliance" && <ComplianceTab />}

    </div>
  );
};

export default SecurityCompliance;