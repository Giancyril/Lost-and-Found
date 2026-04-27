import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { FaBell, FaCheckCircle, FaTimesCircle, FaClock, FaBoxOpen } from "react-icons/fa";
import { useMyClaimsQuery, useGetAuditLogsQuery } from "../../redux/api/api";
import { useUserVerification } from "../../auth/auth";

const ADMIN_SEEN_KEY    = "notif_seen_admin";
const USER_SEEN_KEY     = "notif_seen_user";
const ADMIN_CLEARED_KEY = "notif_cleared_admin";
const USER_CLEARED_KEY  = "notif_cleared_user";

const readSeenIds = (key: string): Set<string> => {
  try {
    const v = localStorage.getItem(key);
    return v ? new Set<string>(JSON.parse(v)) : new Set<string>();
  } catch { return new Set<string>(); }
};

const writeSeenIds = (key: string, ids: Set<string>) => {
  const arr = [...ids].slice(-200);
  localStorage.setItem(key, JSON.stringify(arr));
};

const timeAgo = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const statusMeta = (status: string) => {
  switch (status) {
    case "APPROVED": return { icon: <FaCheckCircle size={11} className="text-emerald-400" />, color: "text-emerald-400", label: "Approved" };
    case "REJECTED": return { icon: <FaTimesCircle size={11} className="text-red-400" />,    color: "text-red-400",     label: "Rejected" };
    default:         return { icon: <FaClock size={11} className="text-yellow-400" />,        color: "text-yellow-400",  label: "Pending"  };
  }
};

const NotificationBell = () => {
  const users: any  = useUserVerification();
  const isAdmin     = users?.role === "ADMIN";
  const isLoggedIn  = !!users?.email;

  const [open, setOpen]           = useState(false);
  const ref                       = useRef<HTMLDivElement>(null);
  const storageKey                = isAdmin ? ADMIN_SEEN_KEY    : USER_SEEN_KEY;
  const clearedKey                = isAdmin ? ADMIN_CLEARED_KEY : USER_CLEARED_KEY;

  const [seenIds,    setSeenIds]    = useState<Set<string>>(() => readSeenIds(storageKey));
  const [clearedIds, setClearedIds] = useState<Set<string>>(() => readSeenIds(clearedKey));

  // Admin: audit logs
  const { data: auditData } = useGetAuditLogsQuery({}, { skip: !isAdmin || !isLoggedIn });
  const adminLogs: any[] = (auditData?.data ?? [])
    .slice()
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  // User: my claims
  const { data: myClaims } = useMyClaimsQuery({}, { skip: isAdmin || !isLoggedIn });
  const userClaims: any[] = (myClaims?.data ?? [])
    .slice()
    .sort((a: any, b: any) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime())
    .slice(0, 20);

  // Filter out cleared items
  const allItems = isAdmin ? adminLogs : userClaims;
  const items    = allItems.filter(item => !clearedIds.has(item.id));

  const unread = items.filter(item => !seenIds.has(item.id)).length;

  const markAllRead = useCallback(() => {
    const allIds = new Set<string>(items.map(item => item.id));
    const merged = new Set<string>([...seenIds, ...allIds]);
    writeSeenIds(storageKey, merged);
    setSeenIds(merged);
  }, [items, seenIds, storageKey]);

  const clearAll = useCallback(() => {
    const allIds = new Set<string>(allItems.map(item => item.id));
    const merged = new Set<string>([...clearedIds, ...allIds]);
    writeSeenIds(clearedKey, merged);
    setClearedIds(merged);
    // also mark all as read
    const mergedSeen = new Set<string>([...seenIds, ...allIds]);
    writeSeenIds(storageKey, mergedSeen);
    setSeenIds(mergedSeen);
  }, [allItems, clearedIds, clearedKey, seenIds, storageKey]);

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) markAllRead();
  };

  // Re-read from storage when storageKey changes (admin vs user switch)
  useEffect(() => {
    setSeenIds(readSeenIds(storageKey));
    setClearedIds(readSeenIds(clearedKey));
  }, [storageKey, clearedKey]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!isLoggedIn) return null;

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 border border-gray-700 hover:border-blue-500/50 hover:bg-gray-700 transition-all duration-200"
        aria-label="Notifications"
      >
        <FaBell size={14} className={unread > 0 ? "text-blue-400" : "text-gray-400"} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-gray-900">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-16 sm:top-11 sm:w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-50">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <FaBell size={12} className="text-blue-400" />
              <span className="text-white text-sm font-semibold">Notifications</span>
              {unread > 0 && (
                <span className="text-[10px] bg-blue-600/20 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-full font-medium">
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              
              {isAdmin && (
                <Link
                  to="/dashboard/claims"
                  onClick={() => setOpen(false)}
                  className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View all
                </Link>
              )}

              {items.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div
            className="max-h-80 overflow-y-auto divide-y divide-gray-800/60"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)",
            }}
          >
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-600">
                <FaBell size={20} className="mb-2 opacity-30" />
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : isAdmin ? (
              items.map((log: any) => {
                const isNew = !seenIds.has(log.id);
                const meta  = statusMeta(log.toStatus);
                return (
                  <div key={log.id} className={`px-4 py-3 hover:bg-gray-800/50 transition-colors ${isNew ? "bg-blue-950/20" : ""}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                        {log.claim?.foundItem?.img
                          ? <img src={log.claim.foundItem.img} alt="" className="w-full h-full object-cover" />
                          : <FaBoxOpen size={10} className="text-gray-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">
                          {log.claim?.foundItem?.foundItemName ?? "Unknown Item"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {meta.icon}
                          <span className={`text-[10px] font-medium ${meta.color}`}>
                            Status → {log.toStatus}
                          </span>
                        </div>
                        <p className="text-gray-600 text-[10px] mt-0.5">
                          by {log.performedBy} · {timeAgo(log.createdAt)}
                        </p>
                      </div>
                      {isNew && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                    </div>
                  </div>
                );
              })
            ) : (
              items.map((claim: any) => {
                const isNew = !seenIds.has(claim.id);
                const meta  = statusMeta(claim.status);
                return (
                  <Link
                    key={claim.id}
                    to="/dashboard/myClaimRequest"
                    onClick={() => setOpen(false)}
                    className={`block px-4 py-3 hover:bg-gray-800/50 transition-colors ${isNew ? "bg-blue-950/20" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                        {claim.foundItem?.img
                          ? <img src={claim.foundItem.img} alt="" className="w-full h-full object-cover" />
                          : <FaBoxOpen size={10} className="text-gray-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">
                          {claim.foundItem?.foundItemName ?? "Unknown Item"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {meta.icon}
                          <span className={`text-[10px] font-medium ${meta.color}`}>
                            Claim {meta.label}
                          </span>
                        </div>
                        <p className="text-gray-600 text-[10px] mt-0.5">
                          {timeAgo(claim.updatedAt ?? claim.createdAt)}
                        </p>
                      </div>
                      {isNew && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          {!isAdmin && items.length > 0 && (
            <div className="border-t border-gray-800 px-4 py-2.5">
              <Link to="/dashboard/myClaimRequest" onClick={() => setOpen(false)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                View all my claims →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;