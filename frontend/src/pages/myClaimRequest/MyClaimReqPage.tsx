import { useMyClaimsQuery, useUpdateClaimStatusWithNoteMutation } from "../../redux/api/api";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import {
  FaSearch,
  FaTimes,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUser,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import type { Claim, ClaimStatus } from "../../types/types";

// ─── Claim Tracker Step Config ────────────────────────────────────────────────
const STEPS: { status: ClaimStatus; label: string; icon: string }[] = [
  { status: "PENDING",  label: "Submitted",  icon: "📋" },
  { status: "APPROVED", label: "Approved",   icon: "✅" },
  { status: "ACCEPTED", label: "Accepted",   icon: "🎉" },
];

const STATUS_ORDER: Record<ClaimStatus, number> = {
  PENDING: 0,
  APPROVED: 1,
  ACCEPTED: 2,
  REJECTED: -1,
};

function ClaimTrackerRow({ claim }: { claim: Claim }) {
  const currentOrder = STATUS_ORDER[claim.status];
  const isRejected = claim.status === "REJECTED";

  return (
    <div className="px-6 py-5 bg-gray-900/80 border-t border-gray-700">
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* Progress Steps */}
        <div className="flex-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Claim Progress
          </p>

          {isRejected ? (
            <div className="flex items-center gap-3 bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3">
              <span className="text-xl">❌</span>
              <div>
                <p className="text-red-300 font-semibold text-sm">Claim Rejected</p>
                <p className="text-red-400/70 text-xs mt-0.5">
                  Your claim was not approved. Visit the SAS Office for more details.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              {STEPS.map((step, idx) => {
                const stepOrder = STATUS_ORDER[step.status];
                const isDone = stepOrder < currentOrder;
                const isCurrent = step.status === claim.status;
                const isPending = stepOrder > currentOrder;

                return (
                  <div key={step.status} className="flex items-center">
                    {/* Step circle */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                          isDone
                            ? "bg-green-600 border-green-600 text-white"
                            : isCurrent
                            ? "bg-blue-600/20 border-blue-500 text-blue-300 shadow-lg shadow-blue-500/20"
                            : "bg-gray-800 border-gray-600 text-gray-500"
                        }`}
                      >
                        {isDone ? "✓" : step.icon}
                      </div>
                      <span
                        className={`text-xs mt-1.5 font-medium whitespace-nowrap ${
                          isDone
                            ? "text-green-400"
                            : isCurrent
                            ? "text-blue-400"
                            : "text-gray-600"
                        }`}
                      >
                        {step.label}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] text-blue-500 mt-0.5 animate-pulse">
                          Current
                        </span>
                      )}
                    </div>

                    {/* Connector line */}
                    {idx < STEPS.length - 1 && (
                      <div
                        className={`h-0.5 w-16 sm:w-24 mx-2 mb-6 transition-all duration-300 ${
                          isDone ? "bg-green-600" : "bg-gray-700"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Claim Meta */}
        <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4 min-w-[220px] space-y-2.5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
            Claim Details
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 text-xs">ID:</span>
            <span className="font-mono text-xs text-gray-300 bg-gray-700 px-2 py-0.5 rounded">
              {claim.id.slice(0, 10)}…
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FaCalendarAlt className="text-gray-500 text-xs shrink-0" />
            <span className="text-gray-300 text-xs">
              {new Date(claim.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FaMapMarkerAlt className="text-gray-500 text-xs shrink-0" />
            <span className="text-gray-300 text-xs line-clamp-1">
              {claim.foundItem?.location || "Location not specified"}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-700">
            <Link to={`/foundItems/${claim?.foundItem?.id}`}>
              <button className="w-full text-xs font-semibold text-cyan-300 hover:text-white bg-cyan-600/10 hover:bg-cyan-600 border border-cyan-600/30 hover:border-cyan-600 rounded-lg py-2 transition-all duration-200">
                View Item Page →
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
const MyClaimReqPage = () => {
  const { data: myClaims, isLoading } = useMyClaimsQuery({});
  const [updateClaimStatus] = useUpdateClaimStatusWithNoteMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [expandedClaimId, setExpandedClaimId] = useState<string | null>(null);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          icon: <FaClock className="w-4 h-4" />,
          color: "from-yellow-500 to-yellow-600",
          label: "Pending",
        };
      case "APPROVED":
      case "ACCEPTED":
        return {
          icon: <FaCheckCircle className="w-4 h-4" />,
          color: "from-green-500 to-green-600",
          label: status === "ACCEPTED" ? "Accepted" : "Approved",
        };
      case "REJECTED":
        return {
          icon: <FaTimesCircle className="w-4 h-4" />,
          color: "from-red-500 to-red-600",
          label: "Rejected",
        };
      default:
        return {
          icon: <FaClock className="w-4 h-4" />,
          color: "from-gray-500 to-gray-600",
          label: "Unknown",
        };
    }
  };

  const filteredAndSortedClaims = useMemo(() => {
    if (!myClaims?.data) return [];

    let filtered = myClaims.data.filter((claim: Claim) => {
      const matchesSearch =
        searchTerm === "" ||
        claim?.foundItem?.foundItemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim?.foundItem?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim?.foundItem?.location?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || claim?.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a: Claim, b: Claim) => {
      let aValue: any, bValue: any;
      switch (sortBy) {
        case "createdAt":
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        case "foundItemName":
          aValue = a?.foundItem?.foundItemName?.toLowerCase() || "";
          bValue = b?.foundItem?.foundItemName?.toLowerCase() || "";
          break;
        case "status":
          aValue = a?.status || "";
          bValue = b?.status || "";
          break;
        default:
          aValue = a?.createdAt || "";
          bValue = b?.createdAt || "";
      }
      return sortOrder === "asc" ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });

    return filtered;
  }, [myClaims?.data, searchTerm, statusFilter, sortBy, sortOrder]);

  const toggleExpand = (id: string) => {
    setExpandedClaimId((prev) => (prev === id ? null : id));
  };

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="h-12 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg mb-6 animate-pulse"></div>
              <div className="h-6 bg-gradient-to-r from-gray-700 to-gray-600 rounded mb-8 max-w-md mx-auto animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 h-12 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg animate-pulse"></div>
            <div className="w-48 h-12 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg animate-pulse"></div>
          </div>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-xl border border-gray-700">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-700 animate-pulse">
                <div className="w-12 h-12 bg-gray-700 rounded-lg shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-48"></div>
                  <div className="h-3 bg-gray-700 rounded w-64"></div>
                </div>
                <div className="w-24 h-6 bg-gray-700 rounded-full"></div>
                <div className="w-24 h-8 bg-gray-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-6">
              My Claims
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Track the status of your item claims and view detailed information about each request.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-xl border border-gray-700 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by item name, description, or location..."
                className="w-full pl-12 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            {/* Status + Sort */}
            <div className="flex gap-4 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split("-");
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
              >
                <option value="createdAt-desc">Latest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="foundItemName-asc">Item Name (A-Z)</option>
                <option value="foundItemName-desc">Item Name (Z-A)</option>
                <option value="status-asc">Status (A-Z)</option>
                <option value="status-desc">Status (Z-A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-gray-300">
            {filteredAndSortedClaims.length > 0 ? (
              <span>
                Showing {filteredAndSortedClaims.length} claim
                {filteredAndSortedClaims.length !== 1 ? "s" : ""}
                {searchTerm && <span className="ml-2 text-cyan-400">for "{searchTerm}"</span>}
                {statusFilter !== "ALL" && <span className="ml-2 text-cyan-400">· {statusFilter}</span>}
              </span>
            ) : (
              <span>No claims found</span>
            )}
          </div>
        </div>

        {/* Empty state */}
        {filteredAndSortedClaims.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-12 shadow-xl border border-gray-700 max-w-md mx-auto">
              <div className="text-6xl mb-6">📋</div>
              <h3 className="text-2xl font-bold text-white mb-4">No Claims Found</h3>
              <p className="text-gray-300 mb-6">
                {searchTerm || statusFilter !== "ALL"
                  ? "No claims match your current filters. Try adjusting your search or filter criteria."
                  : "You haven't submitted any claims yet. Browse found items and claim your lost belongings!"}
              </p>
              {(searchTerm || statusFilter !== "ALL") && (
                <button
                  onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); }}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 mr-4"
                >
                  Clear Filters
                </button>
              )}
              <Link
                to="/foundItems"
                className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-200"
              >
                Browse Found Items
              </Link>
            </div>
          </div>
        ) : (
          /* Table */
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-xl border border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-900 to-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Item</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Location</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Found By</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Claim Date</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredAndSortedClaims.map((claim: Claim) => {
                    const statusConfig = getStatusConfig(claim?.status);
                    const isExpanded = expandedClaimId === claim.id;

                    return (
                      <>
                        {/* Main row */}
                        <tr
                          key={claim.id}
                          className={`transition-colors duration-200 ${
                            isExpanded ? "bg-gray-700/40" : "hover:bg-gray-700/50"
                          }`}
                        >
                          {/* Item */}
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 w-12 h-12 mr-4">
                                <img
                                  className="w-12 h-12 rounded-lg object-cover"
                                  src={claim?.foundItem?.img}
                                  alt={claim?.foundItem?.foundItemName}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/bgimg.png";
                                  }}
                                />
                              </div>
                              <div>
                                <div className="font-medium text-white">
                                  {claim?.foundItem?.foundItemName}
                                </div>
                                <div className="text-sm text-gray-400 truncate max-w-xs">
                                  {claim?.foundItem?.description || "No description provided."}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            <div
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${statusConfig.color} text-white shadow-lg`}
                            >
                              {statusConfig.icon}
                              <span className="ml-1">{statusConfig.label}</span>
                            </div>
                          </td>

                          {/* Location */}
                          <td className="px-6 py-4 text-gray-300">
                            <div className="flex items-center">
                              <FaMapMarkerAlt className="mr-2 text-gray-400" />
                              <span className="truncate max-w-xs">
                                {claim?.foundItem?.location || "Location not specified"}
                              </span>
                            </div>
                          </td>

                          {/* Found By */}
                          <td className="px-6 py-4 text-gray-300">
                            <div className="flex items-center">
                              <FaUser className="mr-2 text-gray-400" />
                              <span>{claim?.foundItem?.user?.username || "Unknown"}</span>
                            </div>
                          </td>

                          {/* Date */}
                          <td className="px-6 py-4 text-gray-300">
                            <div className="flex items-center">
                              <FaCalendarAlt className="mr-2 text-gray-400" />
                              <span>
                                {claim?.createdAt
                                  ? new Date(claim.createdAt).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })
                                  : "Date not available"}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleExpand(claim.id)}
                              className={`inline-flex items-center px-4 py-2 font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none text-sm ${
                                isExpanded
                                  ? "bg-gray-600 hover:bg-gray-500 text-white"
                                  : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl"
                              }`}
                            >
                              {isExpanded ? (
                                <>
                                  <FaEyeSlash className="mr-2" />
                                  Hide Tracker
                                </>
                              ) : (
                                <>
                                  <FaEye className="mr-2" />
                                  Track Claim
                                </>
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Tracker Row */}
                        {isExpanded && (
                          <tr key={`${claim.id}-tracker`}>
                            <td colSpan={6} className="p-0">
                              <ClaimTrackerRow claim={claim} />
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
};

export default MyClaimReqPage;