import { useState } from "react";
import {
  FaEye, FaSearch, FaCheck, FaTimes, FaUser, FaBoxOpen,
  FaHistory, FaClipboardList, FaChevronLeft, FaChevronRight,
  FaEnvelope, FaCheckCircle, FaMapMarkerAlt, FaCalendarAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";
import {
  useGetAllClaimsQuery,
  useUpdateClaimStatusMutation,
  useGetAuditLogsQuery,
  useSendClaimApprovedEmailMutation,
} from "../../redux/api/api";

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

  // Email modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailClaim, setEmailClaim]             = useState<any>(null);
  const [isSendingEmail, setIsSendingEmail]     = useState(false);
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

  const [claimEmailForm, setClaimEmailForm] = useState({
    toEmail: "", smtpHost: "smtp.gmail.com", smtpPort: 587,
    smtpUsername: "", smtpPassword: "", fromName: "NBSC SAS Lost & Found",
    fromEmail: "", smtpSecure: false,
  });

  const { data: allClaims, isLoading }               = useGetAllClaimsQuery(undefined);
  const { data: auditData, isLoading: auditLoading } = useGetAuditLogsQuery({});
  const [updateClaimStatus]                          = useUpdateClaimStatusMutation();
  const [sendClaimApprovedEmail]                     = useSendClaimApprovedEmailMutation();

  const claims    = allClaims?.data  || [];
  const auditLogs = auditData?.data  || [];

  // ── Get audit logs for a specific claim ──
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
    setClaimEmailForm(prev => ({ ...prev, toEmail: claim.schoolEmail || "" }));
    setIsEmailModalOpen(true);
  };

  const handleSendClaimEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailClaim) return;
    setIsSendingEmail(true);
    try {
      await sendClaimApprovedEmail({
        smtp: {
          host:      claimEmailForm.smtpHost,
          port:      claimEmailForm.smtpPort,
          secure:    claimEmailForm.smtpSecure,
          username:  claimEmailForm.smtpUsername,
          password:  claimEmailForm.smtpPassword,
          fromName:  claimEmailForm.fromName,
          fromEmail: claimEmailForm.fromEmail,
        },
        recipient: {
          toEmail:       claimEmailForm.toEmail,
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
      toast.error(err?.data?.message || "Failed to send email. Check your SMTP settings.");
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
      case "APPROVED": return <div className="w-7 h-7 rounded-full bg-emerald-400/10 border-2 border-emerald-400 flex items-center justify-center shrink-0"><FaCheckCircle size={12} className="text-emerald-400" /></div>;
      case "REJECTED": return <div className="w-7 h-7 rounded-full bg-red-400/10 border-2 border-red-400 flex items-center justify-center shrink-0"><FaTimes size={12} className="text-red-400" /></div>;
      default:         return <div className="w-7 h-7 rounded-full bg-yellow-400/10 border-2 border-yellow-400 flex items-center justify-center shrink-0"><FaHistory size={12} className="text-yellow-400" /></div>;
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
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/20 hover:bg-blue-600 border border-blue-600/40 text-blue-300 hover:text-white text-xs font-medium rounded-lg transition-colors">
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
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 border border-blue-600/40 text-blue-300 hover:text-white text-xs font-medium rounded-lg transition-colors">
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
          <div className="relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
            <input value={auditSearch} onChange={(e) => { setAuditSearch(e.target.value); setAuditPage(1); }}
              placeholder="Search by item name, admin, or status..."
              className="w-full bg-gray-900 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/40 transition-colors" />
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

      {/* ── Detail Modal with History Timeline ── */}
      {isDetailModalOpen && selectedClaim && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-3xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <div>
                <h2 className="text-base font-bold text-white">Claim Verification</h2>
                <p className="text-gray-400 text-xs mt-0.5">Compare item details with claimant's proof of ownership</p>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-white p-1"><FaTimes size={15} /></button>
            </div>

            {/* Modal tabs */}
            <div className="flex gap-1 px-5 pt-4 pb-0">
              <button
                onClick={() => setModalTab("details")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  modalTab === "details"
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                <FaBoxOpen size={11} /> Details
              </button>
              <button
                onClick={() => setModalTab("history")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  modalTab === "history"
                    ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                <FaHistory size={11} /> History
                {getClaimHistory(selectedClaim.id).length > 0 && (
                  <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">
                    {getClaimHistory(selectedClaim.id).length}
                  </span>
                )}
              </button>
            </div>

            {/* Details tab */}
            {modalTab === "details" && (
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FaBoxOpen className="text-blue-400" size={13} />
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Found Item Details</h3>
                  </div>
                  <img src={selectedClaim.foundItem?.img || "/default-item.png"} alt={selectedClaim.foundItem?.foundItemName}
                    className="w-full h-44 object-cover rounded-xl border border-gray-700" />
                  <div className="bg-gray-900 rounded-xl p-4 border border-gray-700 space-y-2.5">
                    <div><p className="text-xs text-gray-500 uppercase tracking-widest">Item Name</p><p className="text-white font-semibold text-sm">{selectedClaim.foundItem?.foundItemName}</p></div>
                    <div><p className="text-xs text-gray-500 uppercase tracking-widest">Category</p><p className="text-gray-300 text-sm">{selectedClaim.foundItem?.category?.name}</p></div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-widest">Location Found</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                          <FaMapMarkerAlt className="text-blue-400" size={10} />
                        </div>
                        <p className="text-gray-300 text-sm">{selectedClaim.foundItem?.location}</p>
                      </div>
                    </div>
                    <div><p className="text-xs text-gray-500 uppercase tracking-widest">Description</p><p className="text-gray-300 text-sm leading-relaxed">{selectedClaim.foundItem?.description}</p></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FaUser className="text-green-400" size={13} />
                    <h3 className="text-xs font-bold text-green-400 uppercase tracking-widest">Claimant's Proof</h3>
                  </div>
                  <div className="bg-gray-900 rounded-xl p-4 border border-gray-700 space-y-3">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-700">
                      <div className="w-9 h-9 rounded-full bg-green-600/20 border border-green-600/30 flex items-center justify-center shrink-0">
                        <FaUser className="text-green-400" size={13} />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{selectedClaim.claimantName || "—"}</p>
                        <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-0.5">
                          <FaEnvelope size={9} />
                          {selectedClaim.schoolEmail
                            ? <span className="text-blue-300">{selectedClaim.schoolEmail}</span>
                            : <span className="italic">No email provided</span>}
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Date Item Was Lost</p>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                          <FaCalendarAlt className="text-blue-400" size={10} />
                        </div>
                        <p className="text-gray-300 text-sm">{formatDate(selectedClaim.lostDate)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Proof of Ownership</p>
                      <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
                        <p className="text-gray-200 text-sm leading-relaxed">
                          {selectedClaim.distinguishingFeatures || <span className="text-gray-500 italic">No details provided</span>}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Current Status</p>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(selectedClaim.status)}`}>{selectedClaim.status}</span>
                    </div>
                  </div>
                  {selectedClaim.status === "PENDING" && (
                    <div className="flex gap-3 pt-1">
                      <button onClick={() => { handleStatusChange(selectedClaim.id, "REJECTED"); setIsDetailModalOpen(false); }}
                        className="flex-1 py-2.5 bg-red-600/20 hover:bg-red-600 border border-red-600/40 text-red-300 hover:text-white rounded-lg text-sm font-semibold transition-all duration-200">
                        ✕ Reject
                      </button>
                      <button onClick={() => { handleStatusChange(selectedClaim.id, "APPROVED"); setIsDetailModalOpen(false); }}
                        className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-semibold transition-all duration-200">
                        ✓ Approve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* History tab — timeline */}
            {modalTab === "history" && (
              <div className="p-5">
                <div className="flex items-center gap-2 mb-5">
                  <FaHistory className="text-violet-400" size={13} />
                  <h3 className="text-xs font-bold text-violet-400 uppercase tracking-widest">Claim Timeline</h3>
                </div>

                {(() => {
                  const history = getClaimHistory(selectedClaim.id);
                  const submitted = {
                    id: "submitted",
                    action: "SUBMITTED",
                    fromStatus: "—",
                    toStatus: "PENDING",
                    performedBy: selectedClaim.claimantName || "Student",
                    createdAt: selectedClaim.createdAt,
                    note: "",
                  };
                  const allEvents = [submitted, ...history];

                  if (allEvents.length === 1) {
                    return (
                      <div className="flex flex-col items-center py-10 text-gray-600">
                        <FaHistory size={24} className="mb-3 opacity-40" />
                        <p className="text-sm text-gray-400">No status changes yet</p>
                        <p className="text-xs mt-1 opacity-60">Changes will appear here when the claim is reviewed</p>
                      </div>
                    );
                  }

                  return (
                    <div className="relative">
                      {/* vertical line */}
                      <div className="absolute left-3.5 top-4 bottom-4 w-0.5 bg-gray-700" />
                      <div className="space-y-6">
                        {allEvents.map((event: any, idx: number) => (
                          <div key={event.id} className="relative flex items-start gap-4 pl-1">
                            {/* dot / icon */}
                            <div className="relative z-10">
                              {event.action === "SUBMITTED"
                                ? <div className="w-7 h-7 rounded-full bg-cyan-400/10 border-2 border-cyan-400 flex items-center justify-center shrink-0"><FaClipboardList size={11} className="text-cyan-400" /></div>
                                : getTimelineIcon(event.toStatus)}
                            </div>
                            <div className="flex-1 min-w-0 pb-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-white text-sm font-semibold">
                                  {event.action === "SUBMITTED" ? "Claim Submitted" : `Status changed to ${event.toStatus}`}
                                </p>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(event.toStatus)}`}>
                                  {event.toStatus}
                                </span>
                                {idx === allEvents.length - 1 && (
                                  <span className="text-[10px] bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 px-1.5 py-0.5 rounded-full">Latest</span>
                                )}
                              </div>
                              <p className="text-gray-500 text-xs mt-1">
                                By <span className="text-gray-300">{event.performedBy}</span>
                                {event.action !== "SUBMITTED" && event.fromStatus && (
                                  <> · <span className={`${getStatusBadge(event.fromStatus)} px-1.5 py-0.5 rounded-full border text-[10px]`}>{event.fromStatus}</span> → <span className={`${getStatusBadge(event.toStatus)} px-1.5 py-0.5 rounded-full border text-[10px]`}>{event.toStatus}</span></>
                                )}
                              </p>
                              {event.note && (
                                <p className="text-gray-600 text-xs mt-1 italic">"{event.note}"</p>
                              )}
                              <p className="text-gray-700 text-[10px] mt-1.5">{formatDateTime(event.createdAt)} · {timeAgo(event.createdAt)}</p>
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
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <div className="text-center">
              <div className="bg-gray-700 rounded-full p-3 w-14 h-14 mx-auto mb-4 flex items-center justify-center">
                <FaCheck className="text-blue-400 text-xl" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1">Change Claim Status</h2>
              <p className="text-gray-400 text-sm mb-4">Are you sure you want to change the status?</p>
              {selectedClaim && (
                <div className="bg-gray-700 rounded-lg p-4 mb-5 text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={selectedClaim.foundItem?.img || "/default-item.png"} alt={selectedClaim.foundItem?.foundItemName}
                      className="w-10 h-10 rounded-lg object-cover" />
                    <div>
                      <p className="font-medium text-white text-sm">{selectedClaim.foundItem?.foundItemName}</p>
                      {selectedClaim.claimantName && <p className="text-xs text-gray-400">Claimed by: {selectedClaim.claimantName}</p>}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Current: <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor(selectedClaim.status)}`}>{selectedClaim.status}</span></span>
                    <span className="text-xs text-gray-400">New: <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor(newStatus)}`}>{newStatus}</span></span>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={handleStatusCancel} disabled={isStatusLoading}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white py-2.5 px-4 rounded-lg text-sm transition-colors">Cancel</button>
                <button onClick={handleStatusConfirm} disabled={isStatusLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                  {isStatusLoading ? (<><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Updating...</>) : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {isEmailModalOpen && emailClaim && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <FaEnvelope className="text-green-400" size={14} /> Send Claim Approval Email
                </h2>
                <p className="text-gray-400 text-xs mt-0.5">Notify the claimant that their claim has been approved</p>
              </div>
              <button onClick={() => setIsEmailModalOpen(false)} className="text-gray-400 hover:text-white p-1"><FaTimes size={15} /></button>
            </div>
            <form onSubmit={handleSendClaimEmail} className="p-5 space-y-4">
              <div className="bg-gray-900 rounded-xl p-3 border border-gray-700 flex items-center gap-3">
                <img src={emailClaim.foundItem?.img || "/default-item.png"} alt={emailClaim.foundItem?.foundItemName}
                  className="w-10 h-10 rounded-lg object-cover shrink-0" />
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{emailClaim.foundItem?.foundItemName}</p>
                  <p className="text-gray-500 text-xs">Claimed by: {emailClaim.claimantName || "—"} · {emailClaim.contactNumber || "—"}</p>
                </div>
                <span className="shrink-0 px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full border border-green-500/20">APPROVED</span>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Recipient Email <span className="text-red-400">*</span>
                  {emailClaim?.schoolEmail && <span className="ml-2 text-[10px] text-green-400 font-normal normal-case tracking-normal">✓ Pre-filled from school email</span>}
                </label>
                <input type="email" required placeholder="claimant@email.com" value={claimEmailForm.toEmail}
                  onChange={e => setClaimEmailForm(p => ({ ...p, toEmail: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-600 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50" />
              </div>
              <div className="bg-green-900/20 border border-green-600/20 rounded-xl px-4 py-3">
                <p className="text-green-300 text-xs leading-relaxed">
                  📧 This will send a professionally formatted <strong>claim approval email</strong> to <strong>{emailClaim.claimantName || "the claimant"}</strong>, notifying them that their claim for <strong>"{emailClaim.foundItem?.foundItemName}"</strong> has been approved and is ready for pickup at the SAS office.
                </p>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setIsEmailModalOpen(false)} disabled={isSendingEmail}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={isSendingEmail}
                  className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  {isSendingEmail ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Sending...</> : <><FaEnvelope size={12} /> Send Email</>}
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