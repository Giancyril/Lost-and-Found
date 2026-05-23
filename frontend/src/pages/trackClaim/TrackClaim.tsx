import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaArrowLeft, FaCheckCircle, FaSpinner } from "react-icons/fa";
import { useTrackClaimMutation } from "../../redux/api/api";
import { toast } from "react-toastify";

const TrackClaim = () => {
  const [claimId, setClaimId] = useState("");
  const [email, setEmail] = useState("");
  const [trackClaim, { isLoading }] = useTrackClaimMutation();
  const [result, setResult] = useState<any>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimId || !email) {
      toast.error("Please provide both Tracking ID and Email");
      return;
    }

    try {
      const res = await trackClaim({ claimId, email }).unwrap();
      if (res.success) {
        setResult(res.data);
      }
    } catch (error: any) {
      toast.error(error.data?.message || "Failed to track claim");
      setResult(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "REJECTED": return "text-red-400 bg-red-500/10 border-red-500/20";
      default: return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center py-20 px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-xl z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8">
          <FaArrowLeft /> Back to Home
        </Link>

        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Track Your Claim</h1>
            <p className="text-gray-400 text-sm">Enter your Tracking ID and Email to check your claim status.</p>
          </div>

          <form onSubmit={handleTrack} className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Tracking ID</label>
              <input
                type="text"
                placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                value={claimId}
                onChange={(e) => setClaimId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="you@student.nbsc.edu.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-medium py-3.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {isLoading ? <FaSpinner className="animate-spin" /> : <FaSearch />}
              {isLoading ? "Searching..." : "Track Claim"}
            </button>
          </form>

          {result && (
            <div className="animate-fade-in-up bg-black/30 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <div className={`inline-flex items-center px-3 py-1 mt-1 rounded-full border text-xs font-bold ${getStatusColor(result.status)}`}>
                    {result.status}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Date Submitted</p>
                  <p className="text-white font-medium mt-1">
                    {new Date(result.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6">
                <div className="flex items-start gap-4">
                  {result.foundItem?.img && (
                    <img 
                      src={result.foundItem.img} 
                      alt="Item" 
                      className="w-20 h-20 object-cover rounded-xl border border-white/10"
                    />
                  )}
                  <div>
                    <p className="text-sm text-gray-400">Claimed Item</p>
                    <h3 className="text-lg font-medium text-white mb-1">
                      {result.foundItem?.foundItemName || "Unknown Item"}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Location: {result.foundItem?.location || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {result.status === "APPROVED" && (
                <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex gap-3">
                  <FaCheckCircle className="text-emerald-400 text-xl shrink-0 mt-0.5" />
                  <div>
                    <p className="text-emerald-400 font-medium">Claim Approved!</p>
                    <p className="text-sm text-emerald-400/80 mt-1">Please visit the SAS Office with your ID to pick up your item.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackClaim;
