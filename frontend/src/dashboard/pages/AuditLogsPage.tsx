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

      <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 group w-full">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={12} />
          <input
            type="text"
            placeholder="Search audit logs..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/80 border border-white/10 rounded-2xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button onClick={() => refetch()} disabled={isFetching} className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 hover:text-white text-xs sm:text-sm rounded-xl transition-all">
            <FaSync size={11} className={isFetching ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={downloadCSV} className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm rounded-xl transition-all font-bold">
            <FaDownload size={11} /> Export
          </button>
        </div>
      </div>

      {/* ── Desktop Table ── */}
      <div className="hidden md:block bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="grid px-5 py-3 border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-600 font-semibold gap-4"
             style={{ gridTemplateColumns: "2fr 2fr 1fr 1.5fr 1.5fr" }}>
          <div>Timestamp</div>
          <div>Admin / User</div>
          <div>Action</div>
          <div>Entity Type</div>
          <div className="text-right">Changes</div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-gray-500 flex flex-col items-center">
            <FaClock className="animate-spin mb-3 opacity-30" size={20} />
            <span className="text-xs">Loading audit trail...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 text-center text-gray-500">
            <FaShieldAlt className="mx-auto mb-3 opacity-20" size={28} />
            <p className="text-sm">No audit logs found.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filteredLogs.map((log: any) => (
              <div key={log.id} className="grid items-center px-5 py-3.5 gap-4 hover:bg-white/[0.02] transition-colors"
                   style={{ gridTemplateColumns: "2fr 2fr 1fr 1.5fr 1.5fr" }}>
                <div className="text-[11px] text-gray-400">
                  {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-600 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                    {log.performedBy ? log.performedBy.charAt(0).toUpperCase() : "S"}
                  </div>
                  <span className="text-xs text-white font-medium">{log.performedBy || "System"}</span>
                </div>
                <div>
                  <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                    {log.action}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-gray-300 truncate">{log.entityType}</span>
                  <span className="font-mono text-[9px] text-gray-500 mt-0.5 truncate">{log.entityId || "N/A"}</span>
                </div>
                <div className="text-xs min-w-0 flex justify-end">
                  {log.newData ? (
                    <div className="max-w-xs truncate text-gray-400 font-mono text-[10px] bg-black/20 p-1.5 rounded text-left" title={log.newData}>
                      {log.newData}
                    </div>
                  ) : (
                    <span className="text-gray-600 text-[10px]">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Mobile Cards ── */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-gray-500 bg-gray-900 border border-white/5 rounded-2xl">
            <FaClock className="animate-spin mb-3 opacity-30 mx-auto" size={20} />
            <span className="text-xs">Loading...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center bg-gray-900 border border-white/5 rounded-2xl">
            <FaShieldAlt size={24} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No audit logs found.</p>
          </div>
        ) : filteredLogs.map((log: any) => (
          <div key={log.id} className="bg-gray-900 border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-600 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {log.performedBy ? log.performedBy.charAt(0).toUpperCase() : "S"}
                </div>
                <span className="text-sm text-white font-medium truncate">{log.performedBy || "System"}</span>
              </div>
              <span className="shrink-0 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                {log.action}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-white/5">
              <div>
                <p className="text-gray-600 text-[10px] uppercase tracking-widest">Entity</p>
                <p className="text-gray-300 mt-0.5">{log.entityType}</p>
                {log.entityId && <p className="font-mono text-[9px] text-gray-500 mt-0.5 truncate">{log.entityId}</p>}
              </div>
              <div>
                <p className="text-gray-600 text-[10px] uppercase tracking-widest">Date</p>
                <p className="text-gray-300 mt-0.5">{format(new Date(log.createdAt), "MMM d, yyyy")}</p>
                <p className="text-gray-500 text-[10px] mt-0.5">{format(new Date(log.createdAt), "HH:mm:ss")}</p>
              </div>
            </div>

            {log.newData && (
              <div className="pt-2 border-t border-white/5">
                <p className="text-gray-600 text-[10px] uppercase tracking-widest mb-1">Changes</p>
                <div className="text-gray-400 font-mono text-[10px] bg-black/30 p-2 rounded-lg break-words overflow-x-auto max-h-24 custom-scrollbar">
                  {log.newData}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
