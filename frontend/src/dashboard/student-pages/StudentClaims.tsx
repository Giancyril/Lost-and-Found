import React, { useEffect, useState } from "react";
import { FaClipboardList, FaCheckCircle, FaTimesCircle, FaClock, FaCalendarAlt } from "react-icons/fa";

const API = "/api";
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}`,
  "Content-Type": "application/json",
});
const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

const STATUS_STYLE: Record<string, string> = {
  PENDING:  "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  REJECTED: "bg-red-500/10 text-red-300 border-red-500/20",
};
const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING:  <FaClock size={10} />,
  APPROVED: <FaCheckCircle size={10} />,
  REJECTED: <FaTimesCircle size={10} />,
};

export default function StudentClaims() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/my/claims`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setClaims(d?.data?.data ?? d?.data ?? []))
      .catch(() => setClaims([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-white font-black text-xl">My Claims</h1>
        <p className="text-gray-500 text-sm mt-0.5">Track the status of your item claims</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : claims.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/15 flex items-center justify-center mb-4">
            <FaClipboardList size={20} className="text-purple-400" />
          </div>
          <p className="text-white font-semibold">No claims submitted</p>
          <p className="text-gray-500 text-sm mt-1">Your item claims will appear here</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {claims.map((claim: any, i: number) => {
            const status = claim.status ?? "PENDING";
            const itemName =
              claim.foundItem?.foundItemName ??
              claim.lostItem?.lostItemName ??
              "Item";
            return (
              <div key={i} className="bg-gray-900 border border-white/[0.06] rounded-xl p-4
                hover:border-white/[0.1] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold truncate">{itemName}</p>
                    {claim.message && (
                      <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">{claim.message}</p>
                    )}
                    {claim.createdAt && (
                      <span className="flex items-center gap-1 text-gray-600 text-xs mt-2">
                        <FaCalendarAlt size={9} /> Submitted {fmt(claim.createdAt)}
                      </span>
                    )}
                  </div>
                  <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5
                    rounded-lg border shrink-0 ${STATUS_STYLE[status] ?? STATUS_STYLE.PENDING}`}>
                    {STATUS_ICON[status] ?? STATUS_ICON.PENDING}
                    {status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}