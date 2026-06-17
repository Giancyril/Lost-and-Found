import { useState } from "react";
import {
    FaServer, FaDatabase, FaShieldAlt, FaWifi, FaArchive,
    FaSync, FaCheckCircle, FaExclamationTriangle, FaTimesCircle,
    FaBolt, FaClock, FaHeartbeat, FaEnvelope,
} from "react-icons/fa";
import { baseApi } from "../../redux/api/baseApi";

// ── RTK Query endpoint (mirrors api.ts addition) ─────────────────────────────
const healthApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getApiHealthStandalone: builder.query({
            query: () => ({ url: "/admin/health", method: "GET" }),
        }),
    }),
    overrideExisting: false,
});
const { useGetApiHealthStandaloneQuery } = healthApi;

// ── Icon + color mapping per service ──────────────────────────────────────────
const SERVICE_ICON: Record<string, React.ReactNode> = {
    "API Server": <FaServer size={16} className="text-blue-400" />,
    Database: <FaDatabase size={16} className="text-emerald-400" />,
    "File Uploads": <FaArchive size={16} className="text-violet-400" />,
    Authentication: <FaWifi size={16} className="text-orange-400" />,
    "AI (Gemini)": <FaShieldAlt size={16} className="text-cyan-400" />,
    "Mail Delivery": <FaEnvelope size={16} className="text-pink-400" />,
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    HEALTHY: { label: "HEALTHY", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", icon: <FaCheckCircle size={9} /> },
    DEGRADED: { label: "DEGRADED", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", icon: <FaExclamationTriangle size={9} /> },
    DOWN: { label: "DOWN", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", icon: <FaTimesCircle size={9} /> },
};

const PERFORMANCE_BAR: Record<string, { width: string; color: string }> = {
    Excellent: { width: "90%", color: "bg-emerald-400" },
    Good: { width: "60%", color: "bg-cyan-400" },
    Slow: { width: "25%", color: "bg-amber-400" },
};

// ── Individual service card ───────────────────────────────────────────────────
const ServiceCard = ({ service }: { service: any }) => {
    const statusMeta = STATUS_META[service.status] ?? STATUS_META.DOWN;
    const perfBar = PERFORMANCE_BAR[service.performance] ?? PERFORMANCE_BAR.Slow;

    return (
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        {SERVICE_ICON[service.name] ?? <FaServer size={16} className="text-gray-400" />}
                    </div>
                    <p className="text-white text-sm font-semibold">{service.name}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.bg} ${statusMeta.color}`}>
                    {statusMeta.icon} {statusMeta.label}
                </span>
            </div>

            <p className="text-gray-500 text-xs">{service.description}</p>

            <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Response Time:</span>
                <span className="text-white font-semibold">{service.responseTime}ms</span>
            </div>

            <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Endpoint:</span>
                <span className="text-gray-400 font-mono text-[11px] truncate max-w-[140px]">{service.endpoint}</span>
            </div>

            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Performance</span>
                    <span className="text-gray-300 font-medium">{service.performance}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full transition-all duration-700 ${perfBar.color}`} style={{ width: perfBar.width }} />
                </div>
            </div>
        </div>
    );
};

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ApiStatus() {
    const { data, isLoading, isError, error, isFetching, refetch } = useGetApiHealthStandaloneQuery(undefined, {
        pollingInterval: 30000,
    });
    const [lastManualRefresh, setLastManualRefresh] = useState<Date | null>(null);

    const health = data?.data;
    const services: any[] = health?.services ?? [];

    const handleRefresh = () => {
        refetch();
        setLastManualRefresh(new Date());
    };

    const overallStatusMeta = STATUS_META[health?.overallStatus] ?? STATUS_META.HEALTHY;

    if (isLoading) {
        return (
            <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto animate-pulse">
                <div className="h-24 bg-gray-800/60 rounded-2xl" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-44 bg-gray-800/60 rounded-2xl" />)}
                </div>
            </div>
        );
    }

    if (isError) {
        const errorMsg = (error as any)?.data?.message || (error as any)?.error || "Failed to fetch system health data.";
        return (
            <div className="space-y-4 max-w-7xl mx-auto animate-fadeIn">
                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={isFetching}
                        className="flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 text-gray-300 hover:text-white text-xs font-semibold rounded-xl transition-all"
                    >
                        <FaSync size={11} className={isFetching ? "animate-spin" : ""} /> Retry Refresh
                    </button>
                </div>
                <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                        <FaTimesCircle size={24} />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">Failed to Load System Status</h3>
                        <p className="text-gray-400 text-xs mt-1.5 max-w-md leading-relaxed">{errorMsg}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-end gap-3 flex-wrap">
                <button
                    onClick={handleRefresh}
                    disabled={isFetching}
                    className="flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 text-gray-300 hover:text-white text-xs font-semibold rounded-xl transition-all"
                >
                    <FaSync size={11} className={isFetching ? "animate-spin" : ""} /> Refresh
                </button>
            </div>

            {/* Overall status banner */}
            <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
                    <div>
                        <p className="text-white text-sm font-semibold">Overall System Status</p>
                        <p className="text-gray-600 text-[11px] mt-0.5">
                            Last checked: {health?.checkedAt ? new Date(health.checkedAt).toLocaleString("en-PH") : "—"}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                    <div className="flex flex-col items-center gap-1.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${overallStatusMeta.bg} ${overallStatusMeta.color}`}>
                            {overallStatusMeta.icon} {overallStatusMeta.label}
                        </span>
                        <p className="text-gray-600 text-[10px] mt-0.5">System Status</p>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 text-center">
                        <div className="flex items-center gap-1.5 text-white font-bold text-lg">
                            <FaBolt size={13} className="text-blue-400" /> {health?.responseTime ?? 0}ms
                        </div>
                        <p className="text-gray-600 text-[10px]">Response Time</p>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 text-center">
                        <div className="flex items-center gap-1.5 text-white font-bold text-lg">
                            <FaClock size={13} className="text-emerald-400" /> Live
                        </div>
                        <p className="text-gray-600 text-[10px]">Polling every 30s</p>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 text-center">
                        <p className="text-white font-bold text-lg">{health?.healthScore ?? 0}%</p>
                        <p className="text-gray-600 text-[10px]">Health Score</p>
                    </div>
                </div>

                <div className="mt-4 sm:mt-5">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-gray-500">Overall Health</span>
                        <span className="text-gray-300 font-medium">{health?.healthScore ?? 0}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-700 ${(health?.healthScore ?? 0) >= 90 ? "bg-emerald-400" : (health?.healthScore ?? 0) >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                            style={{ width: `${Math.min(health?.healthScore ?? 0, 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Service cards */}
            {services.length === 0 ? (
                <div className="bg-gray-900 border border-white/5 rounded-2xl py-16 text-center">
                    <FaExclamationTriangle size={24} className="text-gray-600 mx-auto mb-3 opacity-40" />
                    <p className="text-gray-400 text-sm">No service data available</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {services.map((service: any) => (
                        <ServiceCard key={service.name} service={service} />
                    ))}
                </div>
            )}
        </div>
    );
}