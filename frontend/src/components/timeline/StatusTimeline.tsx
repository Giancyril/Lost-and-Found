import React from "react";
import {
  FaCheckCircle,
  FaClock,
  FaMapMarkerAlt,
  FaSearch,
  FaClipboardList,
  FaBoxOpen,
  FaRegTimesCircle,
} from "react-icons/fa";

interface Sighting {
  id: string;
  reporterName: string;
  img?: string;
  location: string;
  details: string;
  createdAt: string;
}

interface ClaimAuditLog {
  id: string;
  action: string;
  fromStatus: string;
  toStatus: string;
  performedBy: string;
  note: string;
  createdAt: string;
}

interface Claim {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  claimantName: string;
  schoolEmail: string;
  auditLogs?: ClaimAuditLog[];
}

interface MatchNotification {
  id: string;
  lostItemId: string;
  foundItemId: string;
  sentAt: string;
  foundItem?: any;
}

interface TimelineItemProps {
  item: any;
  type: "found" | "lost";
}

interface TimelineNode {
  key: string;
  label: string;
  description: string;
  date: string | null;
  isReached: boolean;
  type: "status" | "sighting";
  details?: string;
  img?: string;
  reporterName?: string;
  note?: string;
}

const formatDateTime = (dateStr: string | Date | null) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getCurrentStatusText = (item: any, type: "found" | "lost"): string => {
  if (type === "found") {
    if (item.isClaimed) return "Resolved";
    const approvedClaim = item.claim?.find((c: any) => c.status === "APPROVED");
    if (approvedClaim) return "Claim Approved";
    const pendingClaim = item.claim?.find((c: any) => c.status === "PENDING");
    if (pendingClaim || item.matchNotifications?.length > 0) return "Matched";
    return "Under Review";
  } else {
    if (item.isFound) return "Resolved";
    
    // Find if any matched found item has an approved claim for the user
    let hasApprovedClaim = false;
    let hasPendingClaim = false;
    if (item.matchNotifications) {
      for (const notif of item.matchNotifications) {
        const foundClaims = notif.foundItem?.claim || [];
        if (foundClaims.some((c: any) => c.status === "APPROVED")) {
          hasApprovedClaim = true;
        }
        if (foundClaims.some((c: any) => c.status === "PENDING")) {
          hasPendingClaim = true;
        }
      }
    }
    
    if (hasApprovedClaim) return "Claim Approved";
    if (hasPendingClaim || item.matchNotifications?.length > 0) return "Matched";
    return "Under Review";
  }
};

const StatusTimeline: React.FC<TimelineItemProps> = ({ item, type }) => {
  // Determine primary claim and matched claim details
  const approvedClaim = type === "found"
    ? item.claim?.find((c: any) => c.status === "APPROVED")
    : null;
  const pendingClaim = type === "found"
    ? item.claim?.find((c: any) => c.status === "PENDING")
    : null;
  const latestClaim = type === "found" && item.claim?.length > 0
    ? [...item.claim].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;
  const activeClaim = approvedClaim || pendingClaim || latestClaim;

  // For Lost Items, traverse matchNotifications to find matched claims
  let matchedClaim: Claim | null = null;
  let matchedNotif: MatchNotification | null = null;
  if (type === "lost" && item.matchNotifications) {
    matchedNotif = item.matchNotifications[0] || null;
    for (const notif of item.matchNotifications) {
      const claims = notif.foundItem?.claim || [];
      const approved = claims.find((c: any) => c.status === "APPROVED");
      const pending = claims.find((c: any) => c.status === "PENDING");
      const latest = claims[0];
      if (approved) {
        matchedClaim = approved;
        break;
      }
      if (!matchedClaim && pending) {
        matchedClaim = pending;
      }
      if (!matchedClaim && latest) {
        matchedClaim = latest;
      }
    }
  }

  // Get notes/audit log feedback
  const getApprovalNote = () => {
    const claimToUse = type === "found" ? activeClaim : matchedClaim;
    if (!claimToUse?.auditLogs) return "";
    const approvalLog = claimToUse.auditLogs.find(
      (log: any) => log.toStatus === "APPROVED"
    );
    return approvalLog?.note || "";
  };

  // 1. Define standard status steps
  const steps: TimelineNode[] = [];

  // Step 1: Submitted
  steps.push({
    key: "submitted",
    label: "Report Submitted",
    description: type === "found"
      ? `You reported finding a "${item.foundItemName || "item"}".`
      : `You reported losing a "${item.lostItemName || "item"}".`,
    date: item.createdAt || item.date,
    isReached: true,
    type: "status",
  });

  // Step 2: Under Review
  steps.push({
    key: "under_review",
    label: "Under Review",
    description: "The Student Affairs Services (SAS) office is reviewing the details.",
    date: item.createdAt || item.date,
    isReached: true,
    type: "status",
  });

  // Step 3: Matched
  const hasMatches = type === "found"
    ? (item.matchNotifications?.length > 0 || item.claim?.length > 0 || item.isClaimed)
    : (item.matchNotifications?.length > 0 || item.isFound);
  const matchDate = type === "found"
    ? item.matchNotifications?.[0]?.sentAt || item.claim?.[0]?.createdAt || (item.isClaimed ? item.updatedAt : null)
    : item.matchNotifications?.[0]?.sentAt || (item.isFound ? item.updatedAt : null);

  steps.push({
    key: "matched",
    label: "Matched",
    description: type === "found"
      ? (item.claim?.length > 0 
          ? `Claimant "${activeClaim?.claimantName || "Student"}" requested a claim.` 
          : "Potential matching lost reports found.")
      : "System matched your report with a found item.",
    date: matchDate,
    isReached: !!hasMatches,
    type: "status",
  });

  // Step 4: Claim Approved
  const isApproved = type === "found"
    ? (activeClaim?.status === "APPROVED" || item.isClaimed)
    : (matchedClaim?.status === "APPROVED" || item.isFound);
  const approvalDate = type === "found"
    ? activeClaim?.updatedAt || (item.isClaimed ? item.updatedAt : null)
    : matchedClaim?.updatedAt || (item.isFound ? item.updatedAt : null);
  const approvalNote = getApprovalNote();

  steps.push({
    key: "claim_approved",
    label: "Claim Approved",
    description: type === "found"
      ? `Claim submitted by ${activeClaim?.claimantName || "claimant"} approved.`
      : "Your claim verification was approved by the SAS office.",
    date: approvalDate,
    isReached: !!isApproved,
    type: "status",
    note: approvalNote || undefined,
  });

  // Step 5: Resolved
  const isResolved = type === "found" ? item.isClaimed : item.isFound;
  steps.push({
    key: "resolved",
    label: "Resolved",
    description: type === "found"
      ? "Item has been successfully handed over to the owner."
      : "Item recovered. Report marked as resolved.",
    date: item.updatedAt,
    isReached: !!isResolved,
    type: "status",
  });

  // 2. Separate completed and pending steps
  const completedSteps = steps.filter((s) => s.isReached);
  const pendingSteps = steps.filter((s) => !s.isReached);

  // 3. Add sighting steps (for lost items)
  const sightingSteps: TimelineNode[] = [];
  if (type === "lost" && item.sightings) {
    item.sightings.forEach((s: Sighting) => {
      sightingSteps.push({
        key: `sighting_${s.id}`,
        label: "Sighting Spotted",
        description: `Spotted at: ${s.location}`,
        date: s.createdAt,
        isReached: true,
        type: "sighting",
        details: s.details,
        img: s.img,
        reporterName: s.reporterName,
      });
    });
  }

  // 4. Merge completed steps and sightings, sort chronologically
  const timelineNodes = [...completedSteps, ...sightingSteps].sort(
    (a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime()
  );

  // 5. Find index of the most recently completed status node to give it a pulsing active effect
  const lastCompletedStatusIndex = timelineNodes.reduce((lastIdx, node, idx) => {
    return node.type === "status" ? idx : lastIdx;
  }, -1);

  return (
    <div className="relative pl-8 sm:pl-10 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-700">
      {timelineNodes.map((node, index) => {
        const isLastStatus = index === lastCompletedStatusIndex;
        let iconColor = "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
        let icon = <FaCheckCircle size={12} />;

        if (node.type === "sighting") {
          iconColor = "text-amber-400 border-amber-500/30 bg-amber-500/10";
          icon = <FaMapMarkerAlt size={11} />;
        } else if (isLastStatus && !item.isClaimed && !item.isFound) {
          // Pulse the latest active step if not fully resolved
          iconColor = "text-cyan-400 border-cyan-400/30 bg-cyan-400/10 animate-pulse ring-2 ring-cyan-500/20";
          icon = <FaClock size={11} className="animate-spin-slow" />;
        }

        return (
          <div key={node.key} className="relative flex flex-col items-start gap-1 group">
            {/* Timeline Line Marker */}
            <div
              className={`absolute -left-8 sm:-left-10 top-0.5 w-6 h-6 rounded-full border flex items-center justify-center transition-all z-10 ${iconColor} shadow-lg`}
            >
              {icon}
            </div>

            {/* Content Container */}
            <div className="w-full bg-gray-800/40 border border-gray-700/50 hover:border-gray-600 rounded-xl p-3.5 sm:p-4 transition-all duration-200 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                <span
                  className={`text-xs font-bold ${
                    node.type === "sighting" ? "text-amber-400" : "text-white"
                  }`}
                >
                  {node.label}
                </span>
                <span className="text-[10px] text-gray-500 font-semibold">
                  {formatDateTime(node.date)}
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">{node.description}</p>

              {/* Sighting Details */}
              {node.type === "sighting" && (
                <div className="mt-2.5 bg-gray-900/50 rounded-lg p-2.5 border border-gray-800 space-y-2">
                  {node.reporterName && (
                    <div className="text-[10px] text-gray-400">
                      Reported by: <span className="font-bold text-gray-300">{node.reporterName}</span>
                    </div>
                  )}
                  {node.details && (
                    <p className="text-[11px] text-gray-400 italic">"{node.details}"</p>
                  )}
                  {node.img && (
                    <div className="mt-2">
                      <a href={node.img} target="_blank" rel="noopener noreferrer">
                        <img
                          src={node.img}
                          alt="Sighting location"
                          className="max-h-28 rounded-lg object-cover border border-gray-700 hover:opacity-90 transition-opacity"
                        />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Approval Admin Note */}
              {node.key === "claim_approved" && node.note && (
                <div className="mt-2.5 bg-emerald-950/20 rounded-lg p-2.5 border border-emerald-800/30 text-[11px] text-emerald-300/90 italic">
                  <span className="font-bold text-[10px] uppercase block not-italic tracking-wider mb-1 text-emerald-400">
                    SAS Office Note:
                  </span>
                  "{node.note}"
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* 5. Render pending steps in gray */}
      {pendingSteps.map((node) => {
        let nodeIcon = <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />;
        if (node.key === "claim_approved") {
          nodeIcon = <FaClipboardList size={10} />;
        } else if (node.key === "matched") {
          nodeIcon = <FaSearch size={10} />;
        } else if (node.key === "resolved") {
          nodeIcon = <FaBoxOpen size={10} />;
        }

        return (
          <div key={node.key} className="relative flex flex-col items-start gap-1 opacity-40">
            {/* Timeline Line Marker */}
            <div className="absolute -left-8 sm:-left-10 top-0.5 w-6 h-6 rounded-full border border-gray-700 bg-gray-900/80 flex items-center justify-center text-gray-600 z-10 shadow">
              {nodeIcon}
            </div>

            {/* Content Container */}
            <div className="w-full bg-gray-900/30 border border-gray-800/40 rounded-xl p-3.5 sm:p-4">
              <span className="text-xs font-bold text-gray-500">{node.label}</span>
              <p className="text-xs text-gray-600 leading-relaxed mt-1">
                {node.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatusTimeline;
