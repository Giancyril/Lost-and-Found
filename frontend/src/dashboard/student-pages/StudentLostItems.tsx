import React, { useEffect, useState } from "react";
import { FaBoxOpen, FaMapMarkerAlt, FaCalendarAlt, FaCheckCircle, FaClock } from "react-icons/fa";

const API = "/api";
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}`,
  "Content-Type": "application/json",
});
const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

export default function StudentFoundItems() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/my/foundItem`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setItems(d?.data?.data ?? d?.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-white font-black text-xl">My Found Items</h1>
        <p className="text-gray-500 text-sm mt-0.5">Items you reported as found</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center mb-4">
            <FaBoxOpen size={22} className="text-emerald-400" />
          </div>
          <p className="text-white font-semibold">No found items yet</p>
          <p className="text-gray-500 text-sm mt-1">Items you report as found will appear here</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item: any, i: number) => (
            <div key={i} className="bg-gray-900 border border-white/[0.06] rounded-xl p-4
              flex items-start gap-4 hover:border-white/[0.1] transition-colors">
              {item.img ? (
                <img src={item.img} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/10" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center shrink-0">
                  <FaBoxOpen size={18} className="text-emerald-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold">{item.foundItemName}</p>
                {item.description && (
                  <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">{item.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {item.location && (
                    <span className="flex items-center gap-1 text-gray-500 text-xs">
                      <FaMapMarkerAlt size={9} /> {item.location}
                    </span>
                  )}
                  {item.date && (
                    <span className="flex items-center gap-1 text-gray-500 text-xs">
                      <FaCalendarAlt size={9} /> {fmt(item.date)}
                    </span>
                  )}
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border shrink-0 flex items-center gap-1 ${
                item.isClaimed
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                  : "bg-yellow-500/10 text-yellow-300 border-yellow-500/20"
              }`}>
                {item.isClaimed ? <><FaCheckCircle size={9} /> Claimed</> : <><FaClock size={9} /> Unclaimed</>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}