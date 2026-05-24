import React, { useState } from "react";
import { Spinner } from "flowbite-react";
import {
  FaClipboardList, FaSearch, FaCheckCircle, FaClock,
  FaExclamationCircle, FaBoxOpen, FaChevronRight, FaHistory,
  FaMapMarkerAlt, FaTimes, FaSpinner, FaEnvelope
} from "react-icons/fa";
import { useGetMyLostItemQuery, useMyClaimsQuery, useLazyGetSingleLostItemQuery, useTrackClaimMutation } from "../../redux/api/api";
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
  const [trackClaim, { isLoading: trackClaimLoading }] = useTrackClaimMutation();

  const [trackingType, setTrackingType] = useState<"lost" | "claim">("lost");
  const [activeTab, setActiveTab] = useState(0);
  
  const [searchId, setSearchId] = useState("");
  const [email, setEmail] = useState("");
  
  const [isSearched, setIsSearched] = useState(false);
  const [claimResult, setClaimResult] = useState<any>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchId.trim()) return;

    if (trackingType === "lost") {
      try {
        await triggerSearch(searchId.trim()).unwrap();
        setIsSearched(true);
        setActiveTab(0);
      } catch (err: any) {
        toast.error("Invalid Tracking Code or Item not found");
        setIsSearched(false);
      }
    } else {
      if (!email.trim()) {
        toast.error("Please provide both Tracking ID and Email");
        return;
      }
      try {
        const res = await trackClaim({ claimId: searchId.trim(), email: email.trim() }).unwrap();
        if (res.success) {
          setClaimResult(res.data);
          setIsSearched(true);
        }
      } catch (error: any) {
        toast.error(error.data?.message || "Failed to track claim");
        setClaimResult(null);
        setIsSearched(true);
      }
    }
  };

  const clearSearch = () => {
    setSearchId("");
    setEmail("");
    setIsSearched(false);
    setClaimResult(null);
  };

  const handleTypeChange = (type: "lost" | "claim") => {
    setTrackingType(type);
    clearSearch();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "REJECTED": return "text-red-400 bg-red-500/10 border-red-500/20";
      default: return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    }
  };

  if (lostLoading || claimsLoading) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
      <Spinner size="xl" className="text-blue-700 mb-4" />
      <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest">Loading...</p>
    </div>
  );

  const tabs = [
    { id: 0, label: "My Lost Reports", icon: <FaSearch size={11} />, count: myLostItems?.data?.length || 0 },
    { id: 1, label: "My Claims",       icon: <FaHistory size={11} />, count: myClaims?.data?.length || 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-x-hidden reveal pb-16">

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 sm:py-16">

        {/* ── Hero Header ── */}
        <div className="text-center mb-8 lg:mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            <p className="text-blue-400 text-[11px] font-bold uppercase tracking-widest">Item Tracking</p>
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
          </div>
          <h1 className="text-2xl sm:text-5xl font-bold text-white mb-3 sm:mb-4 tracking-tight">
            My Reports & Claims
          </h1>
          <p className="text-gray-400 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
            View real-time updates on your submitted reports and active claims.
          </p>
        </div>

        {/* ── Search Bar Area ── */}
        <div className="reveal reveal-delay-1 max-w-3xl mx-auto mb-12">
          
          {/* Toggle Type */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-2 bg-gray-900 border border-white/5 rounded-xl p-1">
              <button
                onClick={() => handleTypeChange("lost")}
                className={`px-4 sm:px-6 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  trackingType === "lost" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30" : "text-gray-400 hover:text-white"
                }`}
              >
                Lost Item Reports
              </button>
              <button
                onClick={() => handleTypeChange("claim")}
                className={`px-4 sm:px-6 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  trackingType === "claim" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30" : "text-gray-400 hover:text-white"
                }`}
              >
                Claim Requests
              </button>
            </div>
          </div>

          <form onSubmit={handleSearch} className="relative w-full shadow-2xl shadow-black/40 rounded-xl">
            <div className="relative flex flex-col md:flex-row w-full bg-gray-900 border border-white/10 rounded-xl focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500/50 transition-all duration-300">
              
              {/* Tracking ID Field */}
              <div className="relative flex items-center w-full md:flex-1">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={14} />
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Enter Tracking ID..."
                  className={`w-full pl-11 py-4 bg-transparent border-none text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-0 ${trackingType === "lost" ? "pr-[80px] sm:pr-40" : "pr-4 md:pr-4"}`}
                />

                {/* Mobile Button (Track Lost) */}
                <div className={`md:hidden absolute right-2 top-1/2 -translate-y-1/2 transition-all duration-500 ease-in-out ${trackingType === "lost" ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
                  <button
                    type="submit"
                    disabled={searchLoading || trackClaimLoading}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                  >
                    {(searchLoading || trackClaimLoading) ? <FaSpinner className="animate-spin inline" size={12} /> : "Search"}
                  </button>
                </div>
              </div>
              
              {/* Expanding Email Field & Mobile Claim Button */}
              <div 
                className={`flex flex-col md:flex-row items-center overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out ${
                  trackingType === "claim" 
                    ? "max-h-[200px] md:max-h-[100px] w-full md:flex-1 opacity-100" 
                    : "max-h-0 md:max-h-[100px] w-full md:w-0 opacity-0 md:flex-none"
                }`}
              >
                <div className="hidden md:block w-px h-8 bg-white/10 shrink-0 self-center" />
                <div className="w-full md:hidden h-px bg-white/5" />
                
                <div className="relative flex items-center w-full">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={14} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Institutional Email"
                    className="w-full pl-11 py-4 md:pr-[130px] bg-transparent border-none text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-0"
                    tabIndex={trackingType === "claim" ? 0 : -1}
                  />
                </div>

                {/* Mobile Button (Track Claim) */}
                <div className="w-full p-2 md:hidden border-t border-white/5">
                  <button
                    type="submit"
                    disabled={searchLoading || trackClaimLoading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                    tabIndex={trackingType === "claim" ? 0 : -1}
                  >
                    {(searchLoading || trackClaimLoading) ? <FaSpinner className="animate-spin inline" size={12} /> : "Search"}
                  </button>
                </div>
              </div>

              {/* Desktop Button (Always absolute right) */}
              <div className={`hidden md:flex items-center gap-2 absolute right-2 top-1/2 -translate-y-1/2 transition-opacity duration-500`}>
                {(searchId || email) && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="flex items-center justify-center w-8 h-8 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 hover:text-white rounded-lg transition-all shrink-0"
                    title="Clear Search"
                  >
                    <FaTimes size={10} />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={searchLoading || trackClaimLoading}
                  className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-blue-900/20 active:scale-95 whitespace-nowrap"
                >
                  {(searchLoading || trackClaimLoading) ? <FaSpinner className="animate-spin inline" size={12} /> : "Search"}
                </button>
              </div>

            </div>
          </form>

          {isSearched && trackingType === "lost" && (
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-4 text-center animate-pulse break-all">
              Showing result for code: {searchId}
            </p>
          )}
        </div>

        {/* ── Search Results ── */}
        <div className="mb-16 max-w-3xl mx-auto">
          {trackingType === "claim" && isSearched && claimResult && (
            <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden animate-fade-in-up shadow-xl shadow-black/20">
              <div className="p-6 border-b border-white/5">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Status</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg border text-xs font-bold ${getStatusColor(claimResult.status)}`}>
                      {claimResult.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Date Submitted</p>
                    <p className="text-white font-medium text-sm">
                      {new Date(claimResult.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-black/20 rounded-xl border border-white/5">
                  {claimResult.foundItem?.img ? (
                    <img 
                      src={claimResult.foundItem.img} 
                      alt="Item" 
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-white/5 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-800 rounded-xl flex items-center justify-center shrink-0 border border-white/5">
                      <span className="text-gray-500 text-xs">No Image</span>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Claimed Item</p>
                    <h3 className="text-white font-bold text-lg leading-tight mb-1">
                      {claimResult.foundItem?.foundItemName || "Unknown Item"}
                    </h3>
                    <p className="text-gray-400 text-xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      {claimResult.foundItem?.location || "Location N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {claimResult.status === "APPROVED" && (
                <div className="p-5 bg-emerald-500/5 border-t border-emerald-500/10 flex items-start gap-3">
                  <FaCheckCircle className="text-emerald-400 text-lg shrink-0 mt-0.5" />
                  <div>
                    <p className="text-emerald-400 font-bold text-sm">Claim Approved!</p>
                    <p className="text-emerald-400/70 text-xs mt-1">
                      Your claim has been verified. Please visit the SAS Office with a valid ID to pick up your item.
                    </p>
                  </div>
                </div>
              )}
              
              {claimResult.status === "REJECTED" && (
                <div className="p-5 bg-red-500/5 border-t border-red-500/10 flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5">✕</div>
                  <div>
                    <p className="text-red-400 font-bold text-sm">Claim Rejected</p>
                    <p className="text-red-400/70 text-xs mt-1">
                      Unfortunately, this claim could not be verified. If you believe this is a mistake, please contact the SAS Office.
                    </p>
                  </div>
                </div>
              )}

              {claimResult.status === "PENDING" && (
                <div className="p-5 bg-blue-500/5 border-t border-blue-500/10 flex items-start gap-3">
                  <Spinner className="text-blue-400 text-lg shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-400 font-bold text-sm">Under Review</p>
                    <p className="text-blue-400/70 text-xs mt-1">
                      Your claim is currently being reviewed by the SAS Office. You will receive an update once it is verified.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {trackingType === "claim" && isSearched && !claimResult && (
            <div className="py-12 bg-gray-900/30 rounded-2xl border border-dashed border-red-500/20 flex flex-col items-center text-center px-4">
              <FaExclamationCircle className="text-red-400 text-3xl mb-3" />
              <h3 className="text-base font-black text-white mb-1">No Claim Found</h3>
              <p className="text-gray-500 text-xs max-w-sm">We couldn't verify a claim with that ID and Email combination.</p>
            </div>
          )}

          {trackingType === "lost" && isSearched && searchResult?.data && (
            <div className="max-w-md mx-auto animate-fade-in-up">
              {(() => {
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
                  />
                );
              })()}
            </div>
          )}
        </div>

        {/* ── Student Dashboard (Only if logged in) ── */}
        {isLoggedIn && (
          <div className="max-w-6xl mx-auto border-t border-white/5 pt-12 reveal">
            <div className="text-center mb-8">
              <h2 className="text-white text-2xl font-bold mb-2">Your Dashboard</h2>
              <p className="text-gray-400 text-sm">A quick overview of all your submitted reports and claims</p>
            </div>
            
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-2 bg-gray-900 border border-white/5 rounded-xl p-1 w-fit min-w-max overflow-x-auto no-scrollbar">
                {tabs.map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                        isActive
                          ? "bg-white/10 text-white shadow-lg shadow-black/20"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
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

            {activeTab === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myLostItems?.data?.length > 0 ? (
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
                    title={"No Active Reports"}
                    description={"You don't have any lost item reports being tracked."}
                    actionLink="/reportLostItem"
                    actionText="Report Lost Item"
                  />
                )}
              </div>
            )}

            {activeTab === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
        )}
      </div>
    </div>
  );
};

export default ItemStatus; 