import React, { useState } from 'react';
import {
  FaChartBar, FaGlobeAmericas, FaFileExport, FaBell, FaSync,
  FaCalendarAlt, FaChevronDown, FaSearch, FaUserShield,
  FaBoxOpen, FaClipboardList, FaCheckCircle, FaTimesCircle,
} from 'react-icons/fa';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
  useGetAnalyticsMetricsQuery,
  useGetGeographicDataQuery,
} from '../../redux/api/analyticsApi';
import { useGetAuditLogsQuery } from '../../redux/api/api';

import MetricsCards from './MetricsCards';
import TrendReports from './TrendReports';
import GeographicHeatMap from './GeographicHeatMap';
import ExportTools from './ExportTools';
import AlertSystem from './AlertSystem';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Pick an icon + colour based on the audit log action string */
const resolveLogMeta = (action: string = '') => {
  const a = action.toLowerCase();
  if (a.includes('lost'))    return { icon: <FaBoxOpen size={9} />,       dot: 'bg-red-400',     label: 'Lost Report'   };
  if (a.includes('found'))   return { icon: <FaSearch size={9} />,        dot: 'bg-cyan-400',    label: 'Found Item'    };
  if (a.includes('claim'))   return { icon: <FaClipboardList size={9} />, dot: 'bg-yellow-400',  label: 'Claim'         };
  if (a.includes('approv'))  return { icon: <FaCheckCircle size={9} />,   dot: 'bg-emerald-400', label: 'Approved'      };
  if (a.includes('reject'))  return { icon: <FaTimesCircle size={9} />,   dot: 'bg-red-400',     label: 'Rejected'      };
  return                            { icon: <FaChartBar size={9} />,      dot: 'bg-gray-500',    label: 'Activity'      };
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// ─── component ──────────────────────────────────────────────────────────────

const AnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'geographic' | 'exports' | 'alerts'>('overview');
  const [dateRange, setDateRange] = useState('month');

  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } =
    useGetAnalyticsMetricsQuery(dateRange);
  const { data: geographicData, isLoading: geoLoading } =
    useGetGeographicDataQuery(dateRange);
  const { data: auditData, isLoading: auditLoading, refetch: refetchAudit } =
    useGetAuditLogsQuery({});

  // The endpoint returns { data: [...] } based on the pattern in api.ts
  const auditLogs: any[] = auditData?.data ?? auditData ?? [];
  const recentLogs = [...auditLogs]
    .sort((a, b) => new Date(b.createdAt ?? b.timestamp ?? 0).getTime()
                  - new Date(a.createdAt ?? a.timestamp ?? 0).getTime())
    .slice(0, 8);

  const handleRefresh = () => {
    refetchMetrics();
    refetchAudit();
  };

  const tabs = [
    { id: 'overview',   label: 'Platform Overview', icon: <FaChartBar />      },
    { id: 'geographic', label: 'Campus Activity',   icon: <FaGlobeAmericas /> },
    { id: 'exports',    label: 'Data Exports',      icon: <FaFileExport />    },
    { id: 'alerts',     label: 'Monitoring Alerts', icon: <FaBell />          },
  ];

  return (
    <div className="min-h-screen bg-[#0b0c0d] text-[#e4e6eb] pb-20 font-sans">
      <ToastContainer theme="dark" />

      {/* ── Top Header ── */}
      <div className="bg-[#121417]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-[1100]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 hover:scale-110 transition-transform duration-300">
                <FaUserShield size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Admin Analytics</h1>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1.5 opacity-80">Real-time Platform Monitoring</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Date range picker */}
              <div className="relative group">
                <button className="flex items-center gap-3 bg-[#1c1e22] hover:bg-[#25282c] px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border border-white/5 shadow-xl">
                  <FaCalendarAlt className="text-blue-500" />
                  <span className="text-gray-300">{dateRange}</span>
                  <FaChevronDown size={10} className="text-gray-600" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#1c1e22] border border-white/10 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all translate-y-2 group-hover:translate-y-0 z-[1200] overflow-hidden">
                  {['today', 'week', 'month', 'year', 'all'].map(r => (
                    <button
                      key={r}
                      onClick={() => setDateRange(r)}
                      className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-blue-600 transition-all border-b border-white/5 last:border-none"
                    >
                      Last {r}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleRefresh}
                className="w-12 h-12 bg-[#1c1e22] hover:bg-[#25282c] flex items-center justify-center rounded-2xl transition-all border border-white/5 text-gray-500 hover:text-white shadow-xl group"
              >
                <FaSync
                  size={16}
                  className={`${metricsLoading || auditLoading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* ── Sidebar ── */}
          <div className="w-full lg:w-72 space-y-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/40 scale-[1.02]'
                    : 'text-gray-500 hover:bg-[#1c1e22] hover:text-gray-300'
                }`}
              >
                <span className={`${activeTab === tab.id ? 'text-white' : 'text-gray-600'} text-xl`}>{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && <div className="ml-auto w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" />}
              </button>
            ))}
          </div>

          {/* ── Main Content ── */}
          <div className="flex-1 space-y-8 min-w-0">

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-fadeIn">
                <MetricsCards metrics={metrics} />

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  <div className="xl:col-span-2">
                    <TrendReports isLoading={metricsLoading} />
                  </div>

                  {/* ── Recent Reports Log ── */}
                  <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-white/5">
                      <h3 className="text-white text-sm font-semibold">Recent Activity Log</h3>
                      <p className="text-gray-500 text-xs mt-0.5">Live audit trail · latest actions first</p>
                    </div>

                    <div className="flex-1 divide-y divide-white/5 overflow-y-auto max-h-[400px]">
                      {auditLoading ? (
                        /* skeleton */
                        Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
                            <div className="w-2 h-2 rounded-full bg-gray-700 shrink-0" />
                            <div className="flex-1 space-y-1.5">
                              <div className="h-2.5 bg-gray-800 rounded w-3/4" />
                              <div className="h-2 bg-gray-800 rounded w-1/2" />
                            </div>
                            <div className="h-2 bg-gray-800 rounded w-10" />
                          </div>
                        ))
                      ) : recentLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                          <FaClipboardList size={20} className="mb-2 opacity-30" />
                          <p className="text-sm">No activity yet</p>
                        </div>
                      ) : (
                        recentLogs.map((log: any, i: number) => {
                          const meta = resolveLogMeta(log.action ?? log.type ?? '');
                          const timestamp = log.createdAt ?? log.timestamp ?? log.date ?? null;
                          // Build a readable description from available fields
                          const itemName    = log.itemName ?? log.details ?? log.description ?? log.action ?? 'Activity recorded';
                          const locationStr = log.location ?? log.itemLocation ?? null;
                          const actor       = log.performedBy ?? log.userName ?? log.user?.name ?? null;

                          return (
                            <div
                              key={log.id ?? i}
                              className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group"
                            >
                              {/* dot */}
                              <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />

                              <div className="flex-1 min-w-0">
                                <p className="text-gray-300 text-xs font-medium truncate leading-snug">
                                  {itemName}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span className="text-gray-600 text-[10px]">{meta.label}</span>
                                  {locationStr && (
                                    <>
                                      <span className="text-gray-700 text-[10px]">·</span>
                                      <span className="text-gray-600 text-[10px] truncate max-w-[100px]">{locationStr}</span>
                                    </>
                                  )}
                                  {actor && (
                                    <>
                                      <span className="text-gray-700 text-[10px]">·</span>
                                      <span className="text-gray-600 text-[10px] truncate max-w-[80px]">{actor}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <span className="text-gray-600 text-[10px] shrink-0 pt-0.5">
                                {timestamp ? timeAgo(timestamp) : '—'}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="border-t border-white/5 px-5 py-3">
                      <button
                        onClick={() => refetchAudit()}
                        className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-[10px] font-semibold uppercase tracking-widest text-gray-400 hover:text-white rounded-xl transition-all"
                      >
                        Refresh Logs
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'geographic' && (
              <div className="h-full animate-fadeIn">
                <GeographicHeatMap data={geographicData || []} isLoading={geoLoading} />
              </div>
            )}

            {activeTab === 'exports' && (
              <div className="animate-fadeIn">
                <ExportTools />
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="animate-fadeIn">
                <AlertSystem />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;