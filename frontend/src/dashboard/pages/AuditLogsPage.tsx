import { useState, useMemo } from "react";
import { useGetSystemAuditLogsQuery } from "../../redux/api/api";
import { FaShieldAlt, FaSearch, FaClock, FaListUl, FaUserTag, FaChartLine, FaSync, FaDownload } from "react-icons/fa";
import { format } from "date-fns";

const StatCard = ({ label, value, color, bg, icon }: any) => (
  <div className={`rounded-2xl border p-4 bg-gray-900 flex items-center gap-3 ${bg}`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>{icon}</div>
    <div>
      <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
      <p className="text-gray-500 text-xs font-medium">{label}</p>
    </div>
  </div>
);

const SectionCard = ({ title, subtitle, children, action }: any) => (
  <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
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

export default function AuditLogsPage() {
  const { data: auditData, isLoading, refetch, isFetching } = useGetSystemAuditLogsQuery({});
  const logs = auditData?.data || [];

  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = logs.filter((log: any) => {
    const s = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(s) ||
      log.entityType.toLowerCase().includes(s) ||
      log.performedBy.toLowerCase().includes(s) ||
      (log.entityId && log.entityId.toLowerCase().includes(s))
    );
  });

  const stats = useMemo(() => {
    const uniqueActions = new Set(logs.map((l: any) => l.action)).size;
    const activeAdmins = new Set(logs.map((l: any) => l.performedBy)).size;
    const claimsUpdated = logs.filter((l: any) => l.entityType === "CLAIM").length;
    return { uniqueActions, activeAdmins, claimsUpdated };
  }, [logs]);

  const downloadCSV = () => {
    if (!filteredLogs.length) return;
    const headers = "ID,Timestamp,Admin,Action,Entity Type,Entity ID,Changes";
    const rows = filteredLogs.map((l: any) => 
      `"${l.id}","${l.createdAt}","${l.performedBy}","${l.action}","${l.entityType}","${l.entityId}","${l.newData ? l.newData.replace(/"/g, '""') : ''}"`
    ).join("\n");
    const blob = new Blob([`${headers}\n${rows}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "system-audit-logs.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header row */}
     

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Audit Logs" value={logs.length} color="text-white" bg="bg-white/5 border-white/10" icon={<FaListUl size={14} className="text-gray-400"/>} />
        <StatCard label="Unique Actions" value={stats.uniqueActions} color="text-cyan-400" bg="bg-cyan-400/10 border-cyan-400/20" icon={<FaChartLine size={14} className="text-cyan-400"/>} />
        <StatCard label="Claims Audited" value={stats.claimsUpdated} color="text-emerald-400" bg="bg-emerald-400/10 border-emerald-400/20" icon={<FaShieldAlt size={14} className="text-emerald-400"/>} />
        <StatCard label="Active Admins" value={stats.activeAdmins} color="text-violet-400" bg="bg-violet-400/10 border-violet-400/20" icon={<FaUserTag size={14} className="text-violet-400"/>} />
      </div>

      <SectionCard 
        title="Audit Event History" 
        subtitle="Chronological record of system-wide operations"
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} disabled={isFetching} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 hover:text-white text-xs rounded-lg transition-all">
              <FaSync size={9} className={isFetching ? "animate-spin" : ""} /> Refresh
            </button>
            <button onClick={downloadCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded-lg transition-all font-bold">
              <FaDownload size={9} /> Export
            </button>
          </div>
        }
      >
        <div className="p-4 border-b border-white/5 bg-gray-900/50">
          <div className="relative max-w-md">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
            <input
              type="text"
              placeholder="Search logs by action, admin, or entity..."
              className="w-full bg-gray-800 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-800/50 text-gray-400 border-b border-white/5 text-xs">
              <tr>
                <th className="px-5 py-3 font-semibold">Timestamp</th>
                <th className="px-5 py-3 font-semibold">Admin / User</th>
                <th className="px-5 py-3 font-semibold">Action</th>
                <th className="px-5 py-3 font-semibold">Entity Type</th>
                <th className="px-5 py-3 font-semibold">Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-500">
                    <FaClock className="animate-spin mx-auto mb-3 opacity-30" size={20} />
                    <span className="text-xs">Loading audit trail...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-500 text-xs">
                    <FaShieldAlt className="mx-auto mb-3 opacity-20" size={24} />
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-[11px] text-gray-400">
                      {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-600 to-blue-500 flex items-center justify-center text-[10px] font-bold">
                        {log.performedBy ? log.performedBy.charAt(0).toUpperCase() : "S"}
                      </div>
                      <span className="text-xs">{log.performedBy || "System"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-300">{log.entityType}</span>
                        <span className="font-mono text-[9px] text-gray-500 mt-0.5">{log.entityId || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      {log.newData ? (
                        <div className="max-w-xs truncate text-gray-400 font-mono text-[10px] bg-black/20 p-1.5 rounded" title={log.newData}>
                          {log.newData}
                        </div>
                      ) : (
                        <span className="text-gray-600 text-[10px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
