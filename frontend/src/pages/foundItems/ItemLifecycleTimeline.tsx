import {
  FaClipboardList, FaCheckCircle, FaTimesCircle,
  FaBoxOpen, FaHandshake, FaClock, FaChevronDown, FaChevronUp,
} from "react-icons/fa";
import { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface TimelineEvent {
  id:       string;
  stage:    "reported" | "claimed" | "under_review" | "approved" | "rejected" | "returned";
  label:    string;
  sublabel: string;
  time:     string | null;
  actor:    string;
  done:     boolean;
  active:   boolean;
}

interface Props {
  foundItem: any;  // full foundItem object from useGetSingleFoundItemQuery
  claims?:   any[]; // unused — we read directly from foundItem.claim
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (dateStr: string | null) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString("en-PH", {
    month:   "short",
    day:     "numeric",
    year:    "numeric",
    hour:    "2-digit",
    minute:  "2-digit",
  });
};

const timeAgo = (dateStr: string | null) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ── Stage config ──────────────────────────────────────────────────────────────
const STAGE_META: Record<string, { icon: React.ReactNode; color: string; ring: string; bg: string }> = {
  reported:     { icon: <FaBoxOpen size={12} />,       color: "text-cyan-400",    ring: "border-cyan-400",    bg: "bg-cyan-400/10"    },
  claimed:      { icon: <FaClipboardList size={12} />,  color: "text-yellow-400",  ring: "border-yellow-400",  bg: "bg-yellow-400/10"  },
  under_review: { icon: <FaClock size={12} />,          color: "text-orange-400",  ring: "border-orange-400",  bg: "bg-orange-400/10"  },
  approved:     { icon: <FaCheckCircle size={12} />,    color: "text-emerald-400", ring: "border-emerald-400", bg: "bg-emerald-400/10" },
  rejected:     { icon: <FaTimesCircle size={12} />,    color: "text-red-400",     ring: "border-red-400",     bg: "bg-red-400/10"     },
  returned:     { icon: <FaHandshake size={12} />,      color: "text-violet-400",  ring: "border-violet-400",  bg: "bg-violet-400/10"  },
};

// ── Main Component ─────────────────────────────────────────────────────────────
const ItemLifecycleTimeline = ({ foundItem }: Props) => {
  const [expanded, setExpanded] = useState(true);

  if (!foundItem) return null;

  // ── Safely extract claim and auditLogs ────────────────────────────────────
  // Prisma returns claim as an array (one-to-many relation)
  const claimArr: any[]  = Array.isArray(foundItem.claim) ? foundItem.claim : [];
  const claim: any | null = claimArr.length > 0 ? claimArr[0] : null;
  const auditLogs: any[] = claim?.auditLogs ?? [];

  const isClaimed = foundItem.isClaimed;

  // ── Key timestamps ────────────────────────────────────────────────────────
  const reportedAt  = foundItem.createdAt ?? null;
  const claimedAt   = claim?.createdAt    ?? null;

  const approvedLog = auditLogs.find((l: any) => l.toStatus === "APPROVED");
  const rejectedLog = auditLogs.find((l: any) => l.toStatus === "REJECTED");
  const approvedAt  = approvedLog?.createdAt ?? null;
  const rejectedAt  = rejectedLog?.createdAt ?? null;

  // "Returned" = item is marked isClaimed AND claim is approved
  const returnedAt  = isClaimed && approvedAt ? approvedAt : null;

  // ── Build stages ──────────────────────────────────────────────────────────
  const baseEvents: TimelineEvent[] = [
    {
      id:       "reported",
      stage:    "reported",
      label:    "Item Reported",
      sublabel: `Found at ${foundItem.location ?? "unknown location"}`,
      time:     reportedAt,
      actor:    foundItem.user?.username ?? foundItem.reporterName ?? "SAS Office",
      done:     true,
      active:   !claimedAt,
    },
    {
      id:       "claimed",
      stage:    "claimed",
      label:    "Claim Submitted",
      sublabel: claim
        ? `By ${claim.claimantName ?? "Anonymous"}`
        : "Waiting for a claim",
      time:     claimedAt,
      actor:    claim?.claimantName ?? "—",
      done:     !!claimedAt,
      active:   !!claimedAt && !approvedAt && !rejectedAt,
    },
    {
      id:       "under_review",
      stage:    "under_review",
      label:    "Under Review",
      sublabel: claim
        ? "SAS office is verifying proof of ownership"
        : "No claim to review yet",
      time:     claimedAt,
      actor:    "SAS Admin",
      done:     !!claimedAt && (!!approvedAt || !!rejectedAt),
      active:   !!claimedAt && !approvedAt && !rejectedAt,
    },
  ];

  // Conditionally add rejected OR approved + returned
  const outcomeEvents: TimelineEvent[] = rejectedAt
    ? [
        {
          id:       "rejected",
          stage:    "rejected",
          label:    "Claim Rejected",
          sublabel: `Rejected by ${rejectedLog?.performedBy ?? "Admin"}`,
          time:     rejectedAt,
          actor:    rejectedLog?.performedBy ?? "Admin",
          done:     true,
          active:   true,
        },
      ]
    : [
        {
          id:       "approved",
          stage:    "approved",
          label:    "Claim Approved",
          sublabel: approvedAt
            ? `Approved by ${approvedLog?.performedBy ?? "Admin"}`
            : "Pending approval",
          time:     approvedAt,
          actor:    approvedLog?.performedBy ?? "—",
          done:     !!approvedAt,
          active:   !!approvedAt && !returnedAt,
        },
        {
          id:       "returned",
          stage:    "returned",
          label:    "Item Returned",
          sublabel: returnedAt
            ? `Returned to ${claim?.claimantName ?? "owner"}`
            : "Pending return",
          time:     returnedAt,
          actor:    claim?.claimantName ?? "—",
          done:     !!returnedAt,
          active:   !!returnedAt,
        },
      ];

  const events: TimelineEvent[] = [...baseEvents, ...outcomeEvents];

  // ── Progress ──────────────────────────────────────────────────────────────
  const doneCount    = events.filter(e => e.done).length;
  const stagePercent = Math.round((doneCount / events.length) * 100);
  const currentStage = events.filter(e => e.done).slice(-1)[0];

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
            <FaClipboardList className="text-violet-400" size={13} />
          </div>
          <div className="text-left">
            <p className="text-white text-sm font-bold">Item Lifecycle</p>
            <p className="text-gray-500 text-xs mt-0.5">
              {currentStage ? (
                <span className={STAGE_META[currentStage.stage]?.color}>
                  {currentStage.label}
                </span>
              ) : "Not started"} · {stagePercent}% complete
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:block w-24 bg-gray-800 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-700"
              style={{ width: `${stagePercent}%` }}
            />
          </div>
          {expanded
            ? <FaChevronUp size={11} className="text-gray-500" />
            : <FaChevronDown size={11} className="text-gray-500" />}
        </div>
      </button>

      {/* Timeline body */}
      {expanded && (
        <div className="px-5 pb-5 pt-1">
          {/* Full progress bar */}
          <div className="w-full bg-gray-800 rounded-full h-1 mb-6">
            <div
              className="h-1 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 transition-all duration-700"
              style={{ width: `${stagePercent}%` }}
            />
          </div>

          <div className="relative">
            {/* Vertical connector */}
            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-800" />

            <div className="space-y-5">
              {events.map((event, idx) => {
                const meta = STAGE_META[event.stage];
                return (
                  <div key={event.id} className="relative flex items-start gap-4">
                    {/* Timeline dot */}
                    <div className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      event.done
                        ? `${meta.ring} ${meta.bg} ${meta.color}`
                        : "border-gray-700 bg-gray-800 text-gray-600"
                    }`}>
                      {event.done ? meta.icon : <div className="w-2 h-2 rounded-full bg-gray-700" />}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 min-w-0 pt-0.5 pb-1 ${!event.done ? "opacity-40" : ""}`}>
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className={`text-sm font-semibold ${
                            event.done ? "text-white" : "text-gray-500"
                          } ${event.active && event.done ? meta.color : ""}`}>
                            {event.label}
                            {event.active && event.done && (
                              <span className="ml-2 text-[10px] bg-white/5 border border-white/10 text-gray-400 px-1.5 py-0.5 rounded-full align-middle">
                                Current
                              </span>
                            )}
                          </p>
                          <p className={`text-xs mt-0.5 ${event.done ? "text-gray-400" : "text-gray-600"}`}>
                            {event.sublabel}
                          </p>
                        </div>
                        {event.time && (
                          <div className="text-right shrink-0">
                            <p className="text-gray-500 text-[10px]">{timeAgo(event.time)}</p>
                            <p className="text-gray-700 text-[10px] mt-0.5">{fmt(event.time)}</p>
                          </div>
                        )}
                      </div>

                      {/* Actor chip */}
                      {event.done && event.actor !== "—" && (
                        <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/5 border border-white/5 rounded-full">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                          <span className="text-[10px] text-gray-500">{event.actor}</span>
                        </div>
                      )}

                      {idx < events.length - 1 && event.done && (
                        <div className="mt-2 h-px bg-white/5 w-full" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-5 pt-4 border-t border-white/5 flex items-center gap-2">
            <FaClock size={10} className="text-gray-600 shrink-0" />
            <p className="text-gray-600 text-[10px] leading-relaxed">
              This timeline reflects the current status of the item. Updates appear automatically as the claim is processed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemLifecycleTimeline;