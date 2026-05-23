import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaArrowLeft, FaCheckCircle, FaSpinner } from "react-icons/fa";
import { useTrackClaimMutation } from "../../redux/api/api";
import { toast } from "react-toastify";

const TrackClaim = () => {
  const [claimId, setClaimId] = useState("");
  const [email, setEmail] = useState("");
  const [isSearched, setIsSearched] = useState(false);
  const [trackClaim, { isLoading }] = useTrackClaimMutation();
  const [result, setResult] = useState<any>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimId.trim() || !email.trim()) {
      toast.error("Please provide both Tracking ID and Email");
      return;
    }

    try {
      const res = await trackClaim({ claimId: claimId.trim(), email: email.trim() }).unwrap();
      if (res.success) {
        setResult(res.data);
        setIsSearched(true);
      }
    } catch (error: any) {
      toast.error(error.data?.message || "Failed to track claim");
      setResult(null);
      setIsSearched(true);
    }
  };

  const clearSearch = () => {
    setClaimId("");
    setEmail("");
    setIsSearched(false);
    setResult(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "REJECTED": return "text-red-400 bg-red-500/10 border-red-500/20";
      default: return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 pb-16 max-w-full overflow-x-hidden">
      {/* ── Page Header ── */}
      <div className="border-b border-white/5 bg-gray-900/50">
        <div className="px-4 sm:px-10 lg:px-16 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
                <p className="text-blue-400 text-[11px] font-bold uppercase tracking-widest">Status Tracking</p>
              </div>
              <h1 className="text-white text-2xl sm:text-3xl font-bold tracking-tight">Track Claim</h1>
              <p className="text-gray-500 text-sm mt-1 max-w-lg">
                Enter your Tracking ID and Email to check your claim status.
              </p>
            </div>
            <Link to="/itemStatus" className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
              Looking for Lost Reports?
            </Link>
          </div>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="px-4 sm:px-10 lg:px-16 py-5">
        <form onSubmit={handleTrack} className="flex flex-col md:flex-row items-center gap-3 bg-gray-900 border border-white/5 p-2 rounded-2xl">
          <div className="relative flex-1 w-full">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={13} />
            <input
              type="text"
              value={claimId}
              onChange={(e) => setClaimId(e.target.value)}
              placeholder="Tracking ID (e.g. 123e4567-...)"
              className="w-full pl-11 pr-4 py-3.5 bg-transparent border-none text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-0"
            />
          </div>
          <div className="hidden md:block w-px h-8 bg-white/10" />
          <div className="relative flex-1 w-full border-t border-white/5 md:border-none pt-2 md:pt-0">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your Email Address"
              className="w-full px-4 py-3.5 bg-transparent border-none text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-0"
            />
          </div>
          
          <div className="w-full md:w-auto flex items-center gap-2 pt-2 md:pt-0">
            {(claimId || email) && (
              <button
                type="button"
                onClick={clearSearch}
                className="hidden md:flex items-center justify-center w-10 h-10 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 hover:text-white rounded-xl transition-all shrink-0"
                title="Clear Search"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95 whitespace-nowrap"
            >
              {isLoading ? "Searching..." : "Track Claim"}
            </button>
          </div>
        </form>
        
        {isSearched && !result && (
          <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mt-4 px-2">
            No claim found matching those details.
          </p>
        )}
      </div>

      {/* ── Content ── */}
      <div className="px-4 sm:px-10 lg:px-16 mt-4">
        {result ? (
          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden max-w-2xl animate-fade-in-up">
            <div className="p-6 border-b border-white/5">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg border text-xs font-bold ${getStatusColor(result.status)}`}>
                    {result.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Date Submitted</p>
                  <p className="text-white font-medium text-sm">
                    {new Date(result.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-black/20 rounded-xl border border-white/5">
                {result.foundItem?.img ? (
                  <img 
                    src={result.foundItem.img} 
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
                    {result.foundItem?.foundItemName || "Unknown Item"}
                  </h3>
                  <p className="text-gray-400 text-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    {result.foundItem?.location || "Location N/A"}
                  </p>
                </div>
              </div>
            </div>

            {result.status === "APPROVED" && (
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
            
            {result.status === "REJECTED" && (
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

            {result.status === "PENDING" && (
              <div className="p-5 bg-blue-500/5 border-t border-blue-500/10 flex items-start gap-3">
                <FaSpinner className="text-blue-400 animate-spin text-lg shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-400 font-bold text-sm">Under Review</p>
                  <p className="text-blue-400/70 text-xs mt-1">
                    Your claim is currently being reviewed by the SAS Office. You will receive an update once it is verified.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : !isSearched && (
          <div className="py-16 bg-gray-900/30 rounded-2xl border border-dashed border-gray-800 flex flex-col items-center text-center px-4 max-w-2xl mx-auto">
            <div className="w-14 h-14 bg-gray-900 rounded-2xl border border-gray-800 flex items-center justify-center mb-4 text-gray-600">
              <FaSearch size={20} />
            </div>
            <h3 className="text-base font-black text-white mb-1">Track Your Claim</h3>
            <p className="text-gray-500 text-xs max-w-sm mb-5 leading-relaxed">
              Enter the Tracking ID provided in your email and the Email Address you used to submit the claim to see real-time updates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackClaim;
