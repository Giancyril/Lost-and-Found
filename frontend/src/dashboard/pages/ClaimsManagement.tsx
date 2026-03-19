import { useState } from "react";
import {
  FaEye, FaSearch, FaCheck, FaTimes, FaUser, FaBoxOpen,
  FaHistory, FaClipboardList, FaChevronLeft, FaChevronRight,
  FaEnvelope, FaCheckCircle, FaMapMarkerAlt, FaCalendarAlt,
  FaTag,
} from "react-icons/fa";
import { toast } from "react-toastify";
import {
  useGetAllClaimsQuery,
  useUpdateClaimStatusMutation,
  useGetAuditLogsQuery,
  useSendClaimApprovedEmailMutation,
} from "../../redux/api/api";
import ExportButton from "../../components/export/ExportButton";

type Tab       = "claims" | "audit";
type ModalTab  = "details" | "history";
const AUDIT_PAGE_SIZE = 10;

const formatDate     = (d: string) => new Date(d).toLocaleDateString();
const formatDateTime = (d: string) =>
  new Date(d).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const ClaimsManagement = () => {
  const [activeTab, setActiveTab]       = useState<Tab>("claims");
  const [searchTerm, setSearchTerm]     = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [auditSearch, setAuditSearch]   = useState("");
  const [auditPage, setAuditPage]       = useState(1);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim]         = useState<any>(null);
  const [newStatus, setNewStatus]                 = useState("");
  const [isStatusLoading, setIsStatusLoading]     = useState(false);
  const [modalTab, setModalTab]                   = useState<ModalTab>("details");

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailClaim, setEmailClaim]             = useState<any>(null);
  const [isSendingEmail, setIsSendingEmail]     = useState(false);
  const [claimEmailToAddress, setClaimEmailToAddress] = useState("");
  const [claimEmailSentIds, setClaimEmailSentIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("claimEmailSentIds");
      return stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
    } catch { return new Set<string>(); }
  });

  const markClaimEmailSent = (id: string) => {
    setClaimEmailSentIds(prev => {
      const next = new Set(prev).add(id);
      localStorage.setItem("claimEmailSentIds", JSON.stringify([...next]));
      return next;
    });
  };

  const { data: allClaims, isLoading }               = useGetAllClaimsQuery(undefined);
  const { data: auditData, isLoading: auditLoading } = useGetAuditLogsQuery({});
  const [updateClaimStatus]                          = useUpdateClaimStatusMutation();
  const [sendClaimApprovedEmail]                     = useSendClaimApprovedEmailMutation();

  const claims    = allClaims?.data  || [];
  const auditLogs = auditData?.data  || [];

  const getClaimHistory = (claimId: string) =>
    auditLogs
      .filter((log: any) => log.claimId === claimId)
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const filteredClaims = claims.filter((claim: any) => {
    const matchesSearch =
      claim.foundItem?.foundItemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.claimantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.contactNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredLogs = auditLogs.filter((log: any) =>
    log.claim?.foundItem?.foundItemName?.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.performedBy?.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.toStatus?.toLowerCase().includes(auditSearch.toLowerCase())
  );

  const totalAuditPages = Math.max(1, Math.ceil(filteredLogs.length / AUDIT_PAGE_SIZE));
  const paginatedLogs   = filteredLogs.slice((auditPage - 1) * AUDIT_PAGE_SIZE, auditPage * AUDIT_PAGE_SIZE);

  const handleViewDetails = (claim: any) => {
    setSelectedClaim(claim);
    setModalTab("details");
    setIsDetailModalOpen(true);
  };

  const handleStatusChange = (claimId: string, status: string) => {
    const claim = claims.find((c: any) => c.id === claimId);
    setSelectedClaim(claim); setNewStatus(status); setIsStatusModalOpen(true);
  };

  const handleStatusConfirm = async () => {
    if (!selectedClaim || !newStatus) return;
    setIsStatusLoading(true);
    try {
      await updateClaimStatus({ claimId: selectedClaim.id, status: newStatus }).unwrap();
      toast.success(`Claim ${newStatus.toLowerCase()} successfully`);
      setIsStatusModalOpen(false); setSelectedClaim(null); setNewStatus("");
    } catch { toast.error("Failed to update claim status"); }
    finally { setIsStatusLoading(false); }
  };

  const handleStatusCancel = () => {
    setIsStatusModalOpen(false); setSelectedClaim(null);
    setNewStatus(""); setIsStatusLoading(false);
  };

  const handleOpenClaimEmail = (claim: any) => {
    setEmailClaim(claim);
    setClaimEmailToAddress(claim.schoolEmail || "");
    setIsEmailModalOpen(true);
  };

  const handleSendClaimEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailClaim) return;
    setIsSendingEmail(true);
    try {
      await sendClaimApprovedEmail({
        smtp: {},
        recipient: {
          toEmail:       claimEmailToAddress,
          claimantName:  emailClaim.claimantName || "Student",
          itemName:      emailClaim.foundItem?.foundItemName || "Unknown Item",
          location:      emailClaim.foundItem?.location || "Unknown",
          claimDate:     new Date(emailClaim.updatedAt || emailClaim.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }),
          contactNumber: emailClaim.contactNumber || "N/A",
        },
      }).unwrap();
      toast.success("Claim approval email sent successfully!");
      if (emailClaim) markClaimEmailSent(emailClaim.id);
      setIsEmailModalOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to send email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":  return "bg-yellow-500";
      case "APPROVED": return "bg-green-500";
      case "REJECTED": return "bg-red-500";
      default:         return "bg-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":  return "bg-yellow-400/10 text-yellow-400 border-yellow-400/20";
      case "APPROVED": return "bg-emerald-400/10 text-emerald-400 border-emerald-400/20";
      case "REJECTED": return "bg-red-400/10 text-red-400 border-red-400/20";
      default:         return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const getTimelineIcon = (toStatus: string) => {
    switch (toStatus) {
      case "APPROVED": return <div className="w-6 h-6 rounded-full bg-emerald-400/10 border-2 border-emerald-400 flex items-center justify-center shrink-0"><FaCheckCircle size={10} className="text-emerald-400" /></div>;
      case "REJECTED": return <div className="w-6 h-6 rounded-full bg-red-400/10 border-2 border-red-400 flex items-center justify-center shrink-0"><FaTimes size={10} className="text-red-400" /></div>;
      default:         return <div className="w-6 h-6 rounded-full bg-yellow-400/10 border-2 border-yellow-400 flex items-center justify-center shrink-0"><FaHistory size={10} className="text-yellow-400" /></div>;
    }
  };

  if (isLoading) return (
    <div className="space-y-4 sm:space-y-6 animate-pulse">
      <div className="h-8 bg-gray-700 rounded w-1/4 mb-6" />
      {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-700 rounded mb-4" />)}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-white/5 rounded-xl p-1 w-fit">
        <button onClick={() => setActiveTab("claims")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
            activeTab === "claims" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-gray-500 hover:text-white"
          }`}>
          <FaClipboardList size={12} /> Claims
          <span className="ml-1 text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{claims.length}</span>
        </button>
        <button onClick={() => { setActiveTab("audit"); setAuditPage(1); }}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
            activeTab === "audit" ? "bg-violet-500/10 text-violet-400 border border-violet-500/20" : "text-gray-500 hover:text-white"
          }`}>
          <FaHistory size={12} /> Audit Log
          <span className="ml-1 text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{auditLogs.length}</span>
        </button>
      </div>

      {/* CLAIMS TAB */}
      {activeTab === "claims" && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {[
              { label: "Total Claims", value: claims.length,                                             color: "text-white",      icon: <FaEye className="text-white" /> },
              { label: "Pending",      value: claims.filter((c: any) => c.status === "PENDING").length,  color: "text-yellow-500", icon: <FaSearch className="text-white" /> },
              { label: "Approved",     value: claims.filter((c: any) => c.status === "APPROVED").length, color: "text-green-500",  icon: <FaCheck className="text-white" /> },
              { label: "Rejected",     value: claims.filter((c: any) => c.status === "REJECTED").length, color: "text-red-500",    icon: <FaTimes className="text-white" /> },
            ].map((stat, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">{stat.label}</p>
                    <p className={`text-xl sm:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className="bg-gray-600 p-2 sm:p-3 rounded-lg">{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                <input type="text" placeholder="Search by item, claimant name, or contact..."
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filteredClaims.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
                <FaSearch className="mx-auto text-3xl text-gray-500 mb-3" />
                <p className="text-gray-400 text-sm">No claims found</p>
              </div>
            ) : filteredClaims.map((claim: any) => (
              <div key={claim.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <img src={claim.foundItem?.img || "/default-item.png"} alt={claim.foundItem?.foundItemName}
                    className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{claim.foundItem?.foundItemName}</p>
                    <span className="text-xs px-1.5 py-0.5 bg-blue-900/40 text-blue-300 rounded inline-block mt-0.5">
                      {claim.foundItem?.category?.name}
                    </span>
                  </div>
                  <span className={`ml-auto shrink-0 px-2.5 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(claim.status)}`}>
                    {claim.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><FaUser size={9} /> {claim.claimantName || "—"}</span>
                  <span className="flex items-center gap-1">
                    <FaEnvelope size={9} />
                    {claim.schoolEmail ? <span className="text-blue-300">{claim.schoolEmail}</span> : <span className="italic">No email</span>}
                  </span>
                </div>
                <div className="flex gap-1.5 pt-1">
                  <select value={claim.status} onChange={(e) => handleStatusChange(claim.id, e.target.value)}
                    className={`w-28 shrink-0 px-3 py-2 rounded-lg text-xs font-medium text-white border-0 cursor-pointer focus:outline-none ${getStatusColor(claim.status)}`}>
                    <option value="PENDING"  className="bg-gray-800 text-yellow-400">PENDING</option>
                    <option value="APPROVED" className="bg-gray-800 text-green-400">APPROVED</option>
                    <option value="REJECTED" className="bg-gray-800 text-red-400">REJECTED</option>
                  </select>
                  <button onClick={() => handleViewDetails(claim)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded-lg transition-colors">
                    <FaEye size={11} /> Verify
                  </button>
                  {claim.status === "APPROVED" && (
                    claimEmailSentIds.has(claim.id) ? (
                      <span className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold rounded-lg whitespace-nowrap">
                        <FaCheckCircle size={11} /> Sent
                      </span>
                    ) : (
                      <button onClick={() => handleOpenClaimEmail(claim)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-600/40 text-emerald-300 hover:text-white text-xs font-medium rounded-lg transition-colors">
                        <FaEnvelope size={11} /> Email
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-5 py-4 text-left text-sm font-medium text-gray-300">Found Item</th>
                    <th className="px-5 py-4 text-left text-sm font-medium text-gray-300">Claimant</th>
                    <th className="px-5 py-4 text-left text-sm font-medium text-gray-300">Proof of Ownership</th>
                    <th className="px-5 py-4 text-left text-sm font-medium text-gray-300">Lost Date</th>
                    <th className="px-5 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                    <th className="px-5 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredClaims.map((claim: any) => (
                    <tr key={claim.id} className="hover:bg-gray-750 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img src={claim.foundItem?.img || "/default-item.png"} alt={claim.foundItem?.foundItemName}
                            className="w-12 h-12 rounded-lg object-cover shrink-0" />
                          <div>
                            <div className="font-medium text-white text-sm">{claim.foundItem?.foundItemName}</div>
                            <div className="text-xs text-gray-400 truncate max-w-[160px]">{claim.foundItem?.description}</div>
                            <span className="text-xs px-1.5 py-0.5 bg-blue-900/40 text-blue-300 rounded mt-1 inline-block">
                              {claim.foundItem?.category?.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-white text-sm font-medium">
                            <FaUser size={10} className="text-gray-400" />
                            {claim.claimantName || <span className="text-gray-500 italic">Not provided</span>}
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                            <FaEnvelope size={9} className="text-gray-500" />
                            {claim.schoolEmail ? <span className="text-blue-300">{claim.schoolEmail}</span> : <span className="italic text-gray-600">No email</span>}
                          </div>
                          <div className="text-xs text-gray-500">Submitted: {formatDate(claim.createdAt)}</div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-gray-300 text-xs leading-relaxed line-clamp-3 max-w-[200px]">
                          {claim.distinguishingFeatures || <span className="text-gray-500 italic">No details provided</span>}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-gray-300 text-sm">{formatDate(claim.lostDate)}</td>
                      <td className="px-5 py-4">
                        <select value={claim.status} onChange={(e) => handleStatusChange(claim.id, e.target.value)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium text-white border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 ${getStatusColor(claim.status)}`}>
                          <option value="PENDING"  className="bg-gray-800 text-yellow-400">PENDING</option>
                          <option value="APPROVED" className="bg-gray-800 text-green-400">APPROVED</option>
                          <option value="REJECTED" className="bg-gray-800 text-red-400">REJECTED</option>
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleViewDetails(claim)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded-lg transition-colors">
                            <FaEye size={11} /> Verify
                          </button>
                          {claim.status === "APPROVED" && (
                            claimEmailSentIds.has(claim.id) ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold rounded-lg whitespace-nowrap">
                                <FaCheckCircle size={11} /> Sent
                              </span>
                            ) : (
                              <button onClick={() => handleOpenClaimEmail(claim)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-600/40 text-emerald-300 hover:text-white text-xs font-medium rounded-lg transition-colors">
                                <FaEnvelope size={11} /> Email
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredClaims.length === 0 && (
              <div className="text-center py-12">
                <FaSearch className="mx-auto text-4xl text-gray-500 mb-4" />
                <p className="text-gray-400">No claims found matching your criteria</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* AUDIT LOG TAB */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
              <input value={auditSearch} onChange={(e) => { setAuditSearch(e.target.value); setAuditPage(1); }}
                placeholder="Search by item name, admin, or status..."
                className="w-full bg-gray-900 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/40 transition-colors" />
            </div>
            <ExportButton
              label="Export"
              filename="nbsc-audit-log"
              pdfTitle="NBSC Lost & Found — Claim Audit Log"
              getRows={() => filteredLogs.map((log: any) => ({
                "Item": log.claim?.foundItem?.foundItemName ?? "Unknown",
                "Action": log.action ?? "",
                "From Status": log.fromStatus ?? "",
                "To Status": log.toStatus ?? "",
                "Performed By": log.performedBy ?? "",
                "Date & Time": formatDateTime(log.createdAt),
                "Note": log.note ?? "",
              }))}
            />
          </div>
          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="md:hidden divide-y divide-white/5">
              {auditLoading ? (
                <div className="space-y-2 p-4">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-800/60 rounded-xl animate-pulse" />)}</div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                  <FaHistory size={24} className="mb-3 opacity-40" /><p className="text-sm">No audit logs yet</p>
                </div>
              ) : paginatedLogs.map((log: any) => (
                <div key={log.id} className="p-4 space-y-2">
                  <div className="flex items-center gap-2 justify-between">
                    <p className="text-white text-sm font-medium truncate">{log.claim?.foundItem?.foundItemName ?? "Unknown Item"}</p>
                    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(log.action)}`}>{log.action}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className={`px-2 py-0.5 rounded-full font-medium border ${getStatusBadge(log.fromStatus)}`}>{log.fromStatus}</span>
                    <span className="text-gray-600">→</span>
                    <span className={`px-2 py-0.5 rounded-full font-medium border ${getStatusBadge(log.toStatus)}`}>{log.toStatus}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{log.performedBy}</span><span>{formatDateTime(log.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block">
              <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-[11px] uppercase tracking-widest text-gray-600 font-medium">
                <div className="col-span-3">Item</div><div className="col-span-2">Action</div>
                <div className="col-span-3">Status Change</div><div className="col-span-2">Performed By</div>
                <div className="col-span-2">Date & Time</div>
              </div>
              {auditLoading ? (
                <div className="space-y-2 p-4">{[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-800/60 rounded-xl animate-pulse" />)}</div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                  <FaHistory size={28} className="mb-3 opacity-40" /><p className="text-sm">No audit logs yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {paginatedLogs.map((log: any) => (
                    <div key={log.id} className="grid grid-cols-12 gap-4 items-center px-5 py-4 hover:bg-white/[0.02] transition-colors">
                      <div className="col-span-3 flex items-center gap-3">
                        {log.claim?.foundItem?.img && <img src={log.claim.foundItem.img} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />}
                        <p className="text-white text-sm font-medium truncate">{log.claim?.foundItem?.foundItemName ?? "Unknown Item"}</p>
                      </div>
                      <div className="col-span-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadge(log.action)}`}>
                          {log.action === "APPROVED" && "✓ "}{log.action === "REJECTED" && "✕ "}{log.action}
                        </span>
                      </div>
                      <div className="col-span-3 flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${getStatusBadge(log.fromStatus)}`}>{log.fromStatus}</span>
                        <span className="text-gray-600 text-xs">→</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${getStatusBadge(log.toStatus)}`}>{log.toStatus}</span>
                      </div>
                      <div className="col-span-2">
                        <p className="text-white text-xs font-medium">{log.performedBy}</p>
                        {log.performedByUser?.email && <p className="text-gray-600 text-[10px] truncate">{log.performedByUser.email}</p>}
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-400 text-xs">{formatDateTime(log.createdAt)}</p>
                        {log.note && <p className="text-gray-600 text-[10px] mt-0.5 truncate italic">"{log.note}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {filteredLogs.length > AUDIT_PAGE_SIZE && (
            <div className="flex items-center justify-between">
              <p className="text-gray-600 text-xs">
                Showing {(auditPage - 1) * AUDIT_PAGE_SIZE + 1}–{Math.min(auditPage * AUDIT_PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length} logs
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setAuditPage(p => Math.max(1, p - 1))} disabled={auditPage === 1}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border border-white/5 rounded-lg text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <FaChevronLeft size={10} /> Prev
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalAuditPages }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => setAuditPage(page)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${page === auditPage ? "bg-violet-500/10 text-violet-400 border border-violet-500/20" : "text-gray-500 hover:text-white hover:bg-white/5"}`}>
                      {page}
                    </button>
                  ))}
                </div>
                <button onClick={() => setAuditPage(p => Math.min(totalAuditPages, p + 1))} disabled={auditPage === totalAuditPages}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border border-white/5 rounded-lg text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  Next <FaChevronRight size={10} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Detail Modal — redesigned compact professional ── */}
      {isDetailModalOpen && selectedClaim && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 sticky top-0 bg-gray-900 z-10">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <FaClipboardList size={11} className="text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Claim Verification</h2>
                  <p className="text-gray-500 text-[11px]">Review claimant proof against item details</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(selectedClaim.status)}`}>
                  {selectedClaim.status}
                </span>
                <button onClick={() => setIsDetailModalOpen(false)}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                  <FaTimes size={12} />
                </button>
              </div>
            </div>

            {/* Modal tabs */}
            <div className="flex gap-1 px-5 pt-3 pb-0">
              <button onClick={() => setModalTab("details")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  modalTab === "details" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-gray-500 hover:text-white"
                }`}>
                <FaBoxOpen size={10} /> Details
              </button>
              <button onClick={() => setModalTab("history")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  modalTab === "history" ? "bg-violet-500/10 text-violet-400 border border-violet-500/20" : "text-gray-500 hover:text-white"
                }`}>
                <FaHistory size={10} /> History
                {getClaimHistory(selectedClaim.id).length > 0 && (
                  <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{getClaimHistory(selectedClaim.id).length}</span>
                )}
              </button>
            </div>

            {/* ── DETAILS TAB ── */}
            {modalTab === "details" && (
              <div className="p-5 space-y-4">

                {/* Item + Claimant side by side compact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  {/* Found Item */}
                  <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                      <FaBoxOpen size={10} className="text-cyan-400" />
                      <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Found Item</p>
                    </div>
                    <div className="flex gap-3 p-3">
                      <img src={selectedClaim.foundItem?.img || "/default-item.png"} alt={selectedClaim.foundItem?.foundItemName}
                        className="w-16 h-16 rounded-lg object-cover shrink-0 border border-white/5" />
                      <div className="min-w-0 space-y-1">
                        <p className="text-white text-sm font-semibold leading-tight truncate">{selectedClaim.foundItem?.foundItemName}</p>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <FaTag size={8} className="text-blue-400" />
                          <span>{selectedClaim.foundItem?.category?.name ?? "—"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <FaMapMarkerAlt size={8} className="text-blue-400" />
                          <span className="truncate">{selectedClaim.foundItem?.location ?? "—"}</span>
                        </div>
                      </div>
                    </div>
                    {selectedClaim.foundItem?.description && (
                      <div className="px-3 pb-3">
                        <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Description</p>
                        <p className="text-gray-300 text-xs leading-relaxed">{selectedClaim.foundItem.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Claimant Info */}
                  <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                      <FaUser size={10} className="text-emerald-400" />
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Claimant</p>
                    </div>
                    <div className="p-3 space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <FaUser size={11} className="text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{selectedClaim.claimantName || "—"}</p>
                          <p className="text-blue-300 text-[10px] truncate">{selectedClaim.schoolEmail || "No email"}</p>
                        </div>
                      </div>
                      <div className="h-px bg-white/5" />
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <p className="text-gray-500 uppercase tracking-widest mb-0.5">Date Lost</p>
                          <div className="flex items-center gap-1 text-gray-300">
                            <FaCalendarAlt size={8} className="text-blue-400" />
                            <span>{formatDate(selectedClaim.lostDate)}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-500 uppercase tracking-widest mb-0.5">Submitted</p>
                          <p className="text-gray-300">{formatDate(selectedClaim.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Proof of Ownership */}
                <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Proof of Ownership</p>
                  <p className="text-gray-200 text-sm leading-relaxed">
                    {selectedClaim.distinguishingFeatures || <span className="text-gray-500 italic text-xs">No details provided</span>}
                  </p>
                </div>

                {/* Action buttons — only if PENDING */}
                {selectedClaim.status === "PENDING" && (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => { handleStatusChange(selectedClaim.id, "REJECTED"); setIsDetailModalOpen(false); }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold rounded-lg transition-all">
                      <FaTimes size={10} /> Reject Claim
                    </button>
                    <button
                      onClick={() => { handleStatusChange(selectedClaim.id, "APPROVED"); setIsDetailModalOpen(false); }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/30 text-emerald-400 hover:text-white text-xs font-semibold rounded-lg transition-all">
                      <FaCheck size={10} /> Approve Claim
                    </button>
                  </div>
                )}

                {/* Already actioned notice */}
                {selectedClaim.status !== "PENDING" && (
                  <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs ${
                    selectedClaim.status === "APPROVED"
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                      : "bg-red-500/5 border-red-500/20 text-red-400"
                  }`}>
                    {selectedClaim.status === "APPROVED"
                      ? <FaCheckCircle size={12} />
                      : <FaTimes size={12} />}
                    <span>This claim has been <strong>{selectedClaim.status.toLowerCase()}</strong>.</span>
                  </div>
                )}
              </div>
            )}

            {/* ── HISTORY TAB ── */}
            {modalTab === "history" && (
              <div className="p-5">
                {(() => {
                  const history = getClaimHistory(selectedClaim.id);
                  const submitted = {
                    id: "submitted", action: "SUBMITTED", fromStatus: "—", toStatus: "PENDING",
                    performedBy: selectedClaim.claimantName || "Student",
                    createdAt: selectedClaim.createdAt, note: "",
                  };
                  const allEvents = [submitted, ...history];

                  if (allEvents.length === 1) return (
                    <div className="flex flex-col items-center py-10 text-gray-600">
                      <FaHistory size={22} className="mb-3 opacity-40" />
                      <p className="text-sm text-gray-400">No status changes yet</p>
                      <p className="text-xs mt-1 opacity-60">Changes will appear here when the claim is reviewed</p>
                    </div>
                  );

                  return (
                    <div className="relative">
                      <div className="absolute left-3 top-4 bottom-4 w-0.5 bg-white/5" />
                      <div className="space-y-5">
                        {allEvents.map((event: any, idx: number) => (
                          <div key={event.id} className="relative flex items-start gap-3.5 pl-0.5">
                            <div className="relative z-10">
                              {event.action === "SUBMITTED"
                                ? <div className="w-6 h-6 rounded-full bg-cyan-400/10 border-2 border-cyan-400 flex items-center justify-center shrink-0"><FaClipboardList size={9} className="text-cyan-400" /></div>
                                : getTimelineIcon(event.toStatus)}
                            </div>
                            <div className="flex-1 min-w-0 pb-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-white text-xs font-semibold">
                                  {event.action === "SUBMITTED" ? "Claim Submitted" : `Changed to ${event.toStatus}`}
                                </p>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(event.toStatus)}`}>
                                  {event.toStatus}
                                </span>
                                {idx === allEvents.length - 1 && (
                                  <span className="text-[10px] bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 px-1.5 py-0.5 rounded-full">Latest</span>
                                )}
                              </div>
                              <p className="text-gray-500 text-[10px] mt-0.5">
                                By <span className="text-gray-300">{event.performedBy}</span>
                              </p>
                              {event.note && <p className="text-gray-600 text-[10px] mt-0.5 italic">"{event.note}"</p>}
                              <p className="text-gray-700 text-[10px] mt-1">{formatDateTime(event.createdAt)} · {timeAgo(event.createdAt)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Confirmation Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-xl p-5 w-full max-w-sm shadow-2xl">
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 mx-auto mb-3 flex items-center justify-center">
                <FaCheck className="text-blue-400" size={14} />
              </div>
              <h2 className="text-sm font-bold text-white mb-0.5">Change Claim Status</h2>
              <p className="text-gray-500 text-xs mb-4">Are you sure you want to update this claim?</p>
              {selectedClaim && (
                <div className="bg-gray-800 border border-white/5 rounded-xl p-3 mb-4 text-left">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <img src={selectedClaim.foundItem?.img || "/default-item.png"} alt={selectedClaim.foundItem?.foundItemName}
                      className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    <div>
                      <p className="text-white text-xs font-semibold">{selectedClaim.foundItem?.foundItemName}</p>
                      {selectedClaim.claimantName && <p className="text-gray-500 text-[10px]">by {selectedClaim.claimantName}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-500">Current: <span className={`ml-1 px-2 py-0.5 rounded-full font-bold text-white ${getStatusColor(selectedClaim.status)}`}>{selectedClaim.status}</span></span>
                    <span className="text-gray-500">New: <span className={`ml-1 px-2 py-0.5 rounded-full font-bold text-white ${getStatusColor(newStatus)}`}>{newStatus}</span></span>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={handleStatusCancel} disabled={isStatusLoading}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-white/5 text-gray-300 py-2 px-4 rounded-lg text-xs font-medium transition-colors">
                  Cancel
                </button>
                <button onClick={handleStatusConfirm} disabled={isStatusLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2 px-4 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
                  {isStatusLoading ? (<><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Updating...</>) : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {isEmailModalOpen && emailClaim && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 sticky top-0 bg-gray-900 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <FaEnvelope size={11} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Send Approval Email</h2>
                  <p className="text-gray-500 text-[11px]">Notify the claimant of their approved claim</p>
                </div>
              </div>
              <button onClick={() => setIsEmailModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <FaTimes size={12} />
              </button>
            </div>
            <form onSubmit={handleSendClaimEmail} className="p-5 space-y-4">
              <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3 flex items-center gap-3">
                <img src={emailClaim.foundItem?.img || "/default-item.png"} alt={emailClaim.foundItem?.foundItemName}
                  className="w-10 h-10 rounded-lg object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-white text-xs font-semibold truncate">{emailClaim.foundItem?.foundItemName}</p>
                  <p className="text-gray-500 text-[10px]">Claimed by: {emailClaim.claimantName || "—"}</p>
                </div>
                <span className="shrink-0 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">APPROVED</span>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  Recipient Email <span className="text-red-400">*</span>
                  {emailClaim?.schoolEmail && <span className="ml-2 text-[10px] text-emerald-400 font-normal normal-case tracking-normal">✓ Pre-filled</span>}
                </label>
                <input type="email" required placeholder="claimant@nbsc.edu.ph" value={claimEmailToAddress}
                  onChange={e => setClaimEmailToAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30" />
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-3.5 py-2.5">
                <p className="text-emerald-300/80 text-xs leading-relaxed">
                  Sends a formatted approval email to <strong>{emailClaim.claimantName || "the claimant"}</strong> for <strong>"{emailClaim.foundItem?.foundItemName}"</strong>.
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setIsEmailModalOpen(false)} disabled={isSendingEmail}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-white/5 text-gray-300 py-2 rounded-xl text-xs font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSendingEmail}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
                  {isSendingEmail
                    ? <><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Sending...</>
                    : <><FaEnvelope size={10} /> Send Email</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimsManagement;