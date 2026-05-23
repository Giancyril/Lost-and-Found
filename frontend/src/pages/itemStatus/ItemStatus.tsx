import React, { useState } from "react";
import { Spinner } from "flowbite-react";
import {
  FaClipboardList, FaSearch, FaCheckCircle, FaClock,
  FaExclamationCircle, FaBoxOpen, FaChevronRight, FaHistory,
  FaMapMarkerAlt, FaTimes,
} from "react-icons/fa";
import { useGetMyLostItemQuery, useMyClaimsQuery, useLazyGetSingleLostItemQuery } from "../../redux/api/api";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { useUserVerification } from "../../auth/auth";

// ── Status Timeline ───────────────────────────────────────────────────────────
const StatusTimeline = ({ steps }: {
  steps: { label: string; date?: string; status: "completed" | "active" | "pending"; icon: React.ReactNode }[]
}) => (
  <div className="relative flex flex-col gap-4 w-full">
    {steps.map((step, idx) => {
      const isCompleted = step.status === "completed";
      const isActive    = step.status === "active";
      return (
        <div key={idx} className="relative flex items-start gap-3">
          {idx !== steps.length - 1 && (
            <div className="absolute left-[14px] top-7 bottom-[-16px] w-px bg-gray-800 overflow-hidden rounded-full">
              <div className={`w-full transition-all duration-700 ${isCompleted ? "h-full bg-gradient-to-b from-blue-500 to-cyan-400" : "h-0"}`} />
            </div>
          )}
          <div className={`relative z-10 w-7 h-7 shrink-0 rounded-lg flex items-center justify-center transition-all duration-300 ${
            isCompleted
              ? "bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20"
              : isActive
              ? "bg-gray-800 text-cyan-400 border border-cyan-500/30 ring-2 ring-cyan-500/10"
              : "bg-gray-900 border border-gray-800 text-gray-600"
          }`}>
            <span className="scale-75">{step.icon}</span>
          </div>
          <div className={`flex-1 pt-0.5 transition-all ${isActive ? "opacity-100" : isCompleted ? "opacity-100" : "opacity-40"}`}>
            <div className="flex items-center justify-between gap-2">
              <p className={`text-xs font-bold leading-tight ${
                isCompleted ? "text-white" : isActive ? "text-cyan-400" : "text-gray-500"
              }`}>{step.label}</p>
            </div>
            {step.date && (
              <p className="text-[10px] text-gray-600 mt-0.5">
                {new Date(step.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

// ── Empty State ───────────────────────────────────────────────────────────────
const EmptyState = ({ icon, title, description, actionLink, actionText }: {
  icon: React.ReactNode; title: string; description: string; actionLink: string; actionText: string;
}) => (
  <div className="col-span-full py-16 bg-gray-900/30 rounded-2xl border border-dashed border-gray-800 flex flex-col items-center text-center px-4">
    <div className="w-14 h-14 bg-gray-900 rounded-2xl border border-gray-800 flex items-center justify-center mb-4 text-gray-600">
      {icon}
    </div>
    <h3 className="text-base font-black text-white mb-1">{title}</h3>
    <p className="text-gray-500 text-xs max-w-xs mb-5 leading-relaxed">{description}</p>
    <Link to={actionLink}
      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all">
      {actionText}
    </Link>
  </div>
);

// ── Item Card ─────────────────────────────────────────────────────────────────
const TrackingCard = ({ img, title, subtitle, statusLabel, statusColor, steps, actionLink, actionText, delay = 1 }: {
  img: string; title: string; subtitle: string;
  statusLabel: string; statusColor: string;
  steps: any[]; actionLink: string; actionText: string;
  delay?: number;
}) => (
  <div className={`reveal reveal-delay-${delay} group bg-gray-900 border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-black/20 flex flex-col`}>

    {/* Top row — image + info + status */}
    <div className="flex items-start gap-3 p-4 border-b border-white/[0.05]">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-gray-800 shrink-0 border border-white/5">
        <img src={img || "/bgimg.png"} alt={title}
          onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-bold truncate leading-tight">{title}</p>
        <p className="text-gray-500 text-[11px] mt-0.5 flex items-center gap-1 truncate">
          <FaMapMarkerAlt size={8} className="text-blue-400 shrink-0" />
          <span className="truncate">{subtitle}</span>
        </p>
      </div>
      <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg border ${statusColor}`}>
        {statusLabel}
      </span>
    </div>

    {/* Timeline */}
    <div className="px-4 py-4 flex-1">
      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3">Progress</p>
      <StatusTimeline steps={steps} />
    </div>

    {/* Action */}
    <div className="px-4 pb-4">
      <Link to={actionLink}
        className="w-full flex items-center justify-center gap-1.5 py-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-gray-300 hover:text-white text-xs font-semibold rounded-xl transition-all">
        {actionText} <FaChevronRight size={9} />
      </Link>
    </div>
  </div>
);

// ── Timeline Step Helpers ───────────────────────────────────────────────────────
const getLostItemSteps = (item: any) => {
  const steps: any[] = [];
  steps.push({ label: "Report Submitted", date: item.createdAt, status: "completed" as const, icon: <FaClipboardList size={12} /> });

  if (item.sightings && item.sightings.length > 0) {
    steps.push({ label: "Community Sighting Reported", date: item.sightings[0].createdAt, status: "completed" as const, icon: <FaMapMarkerAlt size={12} /> });
  }

  if (item.isFound) {
    steps.push({ label: "Actively Searching", status: "completed" as const, icon: <FaSearch size={12} /> });
    steps.push({ label: "Secured by SAS Office", date: item.updatedAt, status: "completed" as const, icon: <FaCheckCircle size={12} /> });
  } else {
    steps.push({ label: "Actively Searching", status: "active" as const, icon: <FaSearch size={12} /> });
    steps.push({ label: "Awaiting Recovery", status: "pending" as const, icon: <FaBoxOpen size={12} /> });
  }
  return steps;
};

const getClaimSteps = (claim: any) => {
  const steps: any[] = [];
  steps.push({ label: "Claim Submitted", date: claim.createdAt, status: "completed" as const, icon: <FaClipboardList size={12} /> });

  let hasReviewLog = false;
  if (claim.auditLogs && claim.auditLogs.length > 0) {
    claim.auditLogs.forEach((log: any) => {
      if (log.action === "APPROVED") {
        steps.push({ label: "Verification Passed. Ready for Pickup!", date: log.createdAt, status: "completed" as const, icon: <FaCheckCircle size={12} /> });
        hasReviewLog = true;
      } else if (log.action === "REJECTED") {
        steps.push({ label: "Claim Rejected", date: log.createdAt, status: "completed" as const, icon: <FaExclamationCircle size={12} /> });
        hasReviewLog = true;
      } else {
        steps.push({ label: `Status Update: ${log.action}`, date: log.createdAt, status: "completed" as const, icon: <FaHistory size={12} /> });
        hasReviewLog = true;
      }
    });
  }

  if (!hasReviewLog && claim.status === "PENDING") {
    steps.push({ label: "Under Staff Review", status: "active" as const, icon: <FaClock size={12} /> });
    steps.push({ label: "Awaiting Verification", status: "pending" as const, icon: <FaCheckCircle size={12} /> });
  } else if (claim.status === "APPROVED") {
    steps.push({ label: "Awaiting Pickup", status: "active" as const, icon: <FaBoxOpen size={12} /> });
  }

  return steps;
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const ItemStatus = () => {
  useScrollReveal();
  const user: any = useUserVerification();
  const isLoggedIn = !!user;

  const { data: myLostItems, isLoading: lostLoading } = useGetMyLostItemQuery({}, { skip: !isLoggedIn });
  const { data: myClaims,    isLoading: claimsLoading } = useMyClaimsQuery({}, { skip: !isLoggedIn });
  const [triggerSearch, { data: searchResult, isFetching: searchLoading }] = useLazyGetSingleLostItemQuery();

  const [activeTab, setActiveTab] = useState(0);
  const [searchId, setSearchId] = useState("");
  const [isSearched, setIsSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchId.trim()) return;
    try {
      await triggerSearch(searchId.trim()).unwrap();
      setIsSearched(true);
      setActiveTab(0);
    } catch (err: any) {
      toast.error("Invalid Tracking Code or Item not found");
      setIsSearched(false);
    }
  };

  const clearSearch = () => {
    setSearchId("");
    setIsSearched(false);
  };

  if (lostLoading || claimsLoading) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
      <Spinner size="xl" className="text-blue-700 mb-4" />
      <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest">Loading...</p>
    </div>
  );

  const tabs = [
    { id: 0, label: "Lost Reports", icon: <FaSearch size={11} />, count: myLostItems?.data?.length || 0 },
    { id: 1, label: "My Claims",    icon: <FaHistory size={11} />, count: myClaims?.data?.length || 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-950 pb-16 reveal max-w-full overflow-x-hidden">

      {/* ── Page Header ── */}
      <div className="border-b border-white/5 bg-gray-900/50 reveal">
        <div className="px-4 sm:px-10 lg:px-16 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
                <p className="text-blue-400 text-[11px] font-bold uppercase tracking-widest">Status Tracking</p>
              </div>
              <h1 className="text-white text-2xl sm:text-3xl font-bold tracking-tight">Item Status</h1>
              <p className="text-gray-500 text-sm mt-1 max-w-lg">
                Track your lost item reports and claim requests in real time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="px-4 sm:px-10 lg:px-16 py-5 reveal reveal-delay-1">
        <form onSubmit={handleSearch} className="relative flex items-center">
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={13} />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Tracking Code..."
              className="w-full pl-11 pr-32 sm:pr-44 py-3.5 bg-gray-900 border border-white/5 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all"
            />
          </div>
          <div className="absolute right-2 flex items-center gap-1.5 sm:gap-2">
            {searchId && (
              <button
                type="button"
                onClick={clearSearch}
                className="flex items-center justify-center w-8 h-8 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 hover:text-white rounded-lg transition-all"
                title="Clear Search"
              >
                <FaTimes size={10} />
              </button>
            )}
            <button
              type="submit"
              disabled={searchLoading}
              className="px-4 sm:px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[10px] sm:text-xs font-bold rounded-lg transition-all shadow-lg shadow-blue-900/20 active:scale-95 whitespace-nowrap"
            >
              {searchLoading ? "..." : "Track"}
            </button>
          </div>
        </form>
        {isSearched && (
          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-3 px-1 animate-pulse break-all">
            Showing result for code: {searchId}
          </p>
        )}
        <div className="mt-4 flex items-center justify-center sm:justify-start">
          <p className="text-xs text-gray-500">
            Trying to track a Claim for a Found Item instead? 
            <Link to="/track" className="text-blue-400 font-bold ml-1 hover:text-blue-300 hover:underline">
              Use Track Claim
            </Link>
          </p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="px-4 sm:px-10 lg:px-16 mb-5 reveal reveal-delay-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 bg-gray-900 border border-white/5 rounded-xl p-1 w-fit min-w-max">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                    : "text-gray-400 hover:text-white"
                }`}>
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                    isActive ? "bg-white/20 text-white" : "bg-white/5 text-gray-500"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 sm:px-10 lg:px-16">

        {activeTab === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isSearched && searchResult?.data ? (
              (() => {
                const item = searchResult.data;
                const steps = getLostItemSteps(item);
                return (
                  <TrackingCard key={item.id}
                    img={item.img}
                    title={item.lostItemName}
                    subtitle={item.location}
                    statusLabel={item.isFound ? "Recovered" : "Active"}
                    statusColor={item.isFound
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-blue-500/10 text-blue-400 border-blue-500/20"}
                    steps={steps}
                    actionLink={`/lostItems/${item.id}`}
                    actionText="View Details"
                    delay={1}
                  />
                );
              })()
            ) : myLostItems?.data?.length > 0 ? (
              myLostItems.data.map((item: any, idx: number) => {
                const steps = getLostItemSteps(item);
                return (
                  <TrackingCard key={item.id}
                    img={item.img}
                    title={item.lostItemName}
                    subtitle={item.location}
                    statusLabel={item.isFound ? "Recovered" : "Active"}
                    statusColor={item.isFound
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-blue-500/10 text-blue-400 border-blue-500/20"}
                    steps={steps}
                    actionLink={`/lostItems/${item.id}`}
                    actionText="View Details"
                    delay={(idx % 4) + 1}
                  />
                );
              })
            ) : (
              <EmptyState
                icon={<FaExclamationCircle size={24} />}
                title={isSearched ? "No Item Found" : "No Active Reports"}
                description={isSearched ? "We couldn't find any report with that tracking code." : "You don't have any lost item reports being tracked."}
                actionLink="/reportLostItem"
                actionText="Report Lost Item"
              />
            )}
          </div>
        )}

        {activeTab === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myClaims?.data?.length > 0 ? (
              myClaims.data.map((claim: any, idx: number) => {
                const isApproved = claim.status === "APPROVED";
                const isRejected = claim.status === "REJECTED";
                const steps = getClaimSteps(claim);
                return (
                  <TrackingCard key={claim.id}
                    img={claim.foundItem?.img}
                    title={claim.foundItem?.foundItemName || "Unknown Item"}
                    subtitle={`ID: ${claim.id.slice(0, 8)}`}
                    statusLabel={claim.status}
                    statusColor={
                      isApproved ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : isRejected ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                    }
                    steps={steps}
                    actionLink={`/foundItems/${claim.foundItemId}`}
                    actionText="View Item"
                    delay={(idx % 4) + 1}
                  />
                );
              })
            ) : (
              <EmptyState
                icon={<FaHistory size={24} />}
                title="No Claims Found"
                description="You haven't submitted any claims for found items yet."
                actionLink="/foundItems"
                actionText="Browse Found Items"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemStatus; 