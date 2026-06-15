import { useState, useEffect, useRef } from "react";
import {
  FaEye, FaSearch, FaCheck, FaTimes, FaUser, FaBoxOpen,
  FaHistory, FaClipboardList, FaChevronLeft, FaChevronRight,
  FaEnvelope, FaCheckCircle, FaMapMarkerAlt, FaCalendarAlt,
  FaTag, FaBolt, FaTrash, FaChevronDown, FaExclamationTriangle,
} from "react-icons/fa";
import { toast } from "react-toastify";
import {
  useGetAllClaimsQuery,
  useUpdateClaimStatusMutation,
  useDeleteClaimMutation,
  useGetAuditLogsQuery,
  useSendClaimApprovedEmailMutation,
  useGetMatchNotificationsQuery,
  useGetAllLostItemsQuery,
  useGetFoundItemsQuery,
  useSendLostItemEmailMutation,
  useAnalyzeClaimFraudMutation,
} from "../../redux/api/api";
import ExportButton from "../../components/export/ExportButton";
import { getCoordinates } from "../../utils/campusLocations";

type Tab = "claims" | "audit" | "matches" | "recommender";
type ModalTab = "details" | "history";
type ClaimView = "table" | "timeline";
const AUDIT_PAGE_SIZE = 10;

const formatDate = (d: string) => new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
const formatDateTime = (d: string) => new Date(d).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "PENDING": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "APPROVED": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "REJECTED": return "bg-red-500/10 text-red-400 border-red-500/20";
    case "SUBMITTED": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  }
};

const getStatusSelect = (status: string) => {
  switch (status) {
    case "PENDING": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "APPROVED": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "REJECTED": return "bg-red-500/10 text-red-400 border-red-500/20";
    default: return "bg-gray-700 text-gray-300 border-white/5";
  }
};

const StatusSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer focus:outline-none appearance-none ${getStatusSelect(value)}`}>
    <option value="PENDING" className="bg-gray-900 text-amber-400">PENDING</option>
    <option value="APPROVED" className="bg-gray-900 text-emerald-400">APPROVED</option>
    <option value="REJECTED" className="bg-gray-900 text-red-400">REJECTED</option>
  </select>
);

const CustomDropdown = ({ options, value, onChange, allLabel = "All" }: {
  options: { id: string, name: string }[];
  value: string;
  onChange: (v: string) => void;
  allLabel?: string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = value === "ALL" ? allLabel : options.find(o => o.id === value)?.name ?? allLabel;

  return (
    <div ref={ref} className="relative w-full sm:w-56">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-800/80 border border-white/10 rounded-2xl text-white text-sm focus:outline-none transition-all"
      >
        <span className="truncate text-left">{selected}</span>
        <FaChevronDown size={11} className={`text-gray-400 shrink-0 ml-2 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-2 left-0 w-full bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
          <div className="max-h-56 overflow-y-auto custom-scrollbar">
            {[{ id: "ALL", name: allLabel }, ...options].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { onChange(opt.id); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${value === opt.id
                  ? "bg-white/5 text-white font-semibold"
                  : "text-gray-400 hover:bg-white/[0.03] hover:text-white"
                  }`}
              >
                {opt.name}
                {value === opt.id && (
                  <FaCheck size={9} className="text-gray-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const parseFraudReason = (rawReason: string | null) => {
  if (!rawReason) return null;
  try {
    const trimmed = rawReason.trim();
    if (trimmed.startsWith("{")) {
      return JSON.parse(trimmed);
    }
  } catch (e) {
    // Fail silently, fallback
  }

  const result: any = {
    serialWarning: null,
    aiAssessment: null
  };

  if (rawReason.includes("[SERIAL CLAIMANT WARNING]")) {
    const part = rawReason.split("|").find(p => p.includes("[SERIAL CLAIMANT WARNING]"));
    if (part) {
      result.serialWarning = part.replace("[SERIAL CLAIMANT WARNING]", "").trim();
    }
  }
  
  if (rawReason.includes("[AI Assessment]")) {
    const part = rawReason.split("|").find(p => p.includes("[AI Assessment]"));
    if (part) {
      result.aiAssessment = {
        fraudReason: part.replace("[AI Assessment]", "").trim()
      };
    }
  }

  if (!result.serialWarning && !result.aiAssessment) {
    result.aiAssessment = {
      fraudReason: rawReason
    };
  }

  return result;
};

const getRiskBadge = (score: number, isHighRisk: boolean) => {
  const parsedScore = score || 0;
  if (parsedScore >= 70 || isHighRisk) {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full font-bold">
        <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />
        High Risk ({parsedScore}%)
      </span>
    );
  }
  if (parsedScore >= 40) {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-bold">
        <span className="w-1 h-1 rounded-full bg-amber-400" />
        Medium Risk ({parsedScore}%)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold">
      <span className="w-1 h-1 rounded-full bg-emerald-400" />
      Low Risk ({parsedScore}%)
    </span>
  );
};

const ClaimsManagement = () => {
  const [activeTab, setActiveTab] = useState<Tab>("claims");
  const [claimView, setClaimView] = useState<ClaimView>("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditPage, setAuditPage] = useState(1);
  const [matchSearch, setMatchSearch] = useState("");
  const [matchPage, setMatchPage] = useState(1);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [modalTab, setModalTab] = useState<ModalTab>("details");
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailClaim, setEmailClaim] = useState<any>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [claimEmailToAddress, setClaimEmailToAddress] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [claimToDelete, setClaimToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  // Inline timeline expanded state
  const [expandedTimeline, setExpandedTimeline] = useState<Set<string>>(new Set());
  const [claimEmailSentIds, setClaimEmailSentIds] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem("claimEmailSentIds"); return s ? new Set<string>(JSON.parse(s)) : new Set<string>(); }
    catch { return new Set<string>(); }
  });

  const markClaimEmailSent = (id: string) => {
    setClaimEmailSentIds(prev => {
      const next = new Set(prev).add(id);
      localStorage.setItem("claimEmailSentIds", JSON.stringify([...next]));
      return next;
    });
  };

  const { data: allClaims, isLoading } = useGetAllClaimsQuery(undefined);
  const { data: auditData, isLoading: auditLoading } = useGetAuditLogsQuery({});
  const { data: matchData, isLoading: matchLoading } = useGetMatchNotificationsQuery({});
  const { data: allLostItemsData, isLoading: lostLoading } = useGetAllLostItemsQuery({ limit: 1000 });
  const { data: allFoundItemsData, isLoading: foundLoading } = useGetFoundItemsQuery({ limit: 1000 });

  const [updateClaimStatus] = useUpdateClaimStatusMutation();
  const [sendClaimApprovedEmail] = useSendClaimApprovedEmailMutation();
  const [deleteClaim] = useDeleteClaimMutation();
  const [sendLostItemEmail] = useSendLostItemEmailMutation();
  const [analyzeClaimFraud, { isLoading: isAnalyzing }] = useAnalyzeClaimFraudMutation();

  const [recommenderThreshold, setRecommenderThreshold] = useState<number>(50);
  const [recommenderSearch, setRecommenderSearch] = useState("");
  const [recommenderPage, setRecommenderPage] = useState(1);
  const [emailSendingStatus, setEmailSendingStatus] = useState<Record<string, boolean>>({});

  const claims = allClaims?.data || [];
  const auditLogs = auditData?.data || [];
  const matches = matchData?.data || [];
  const lostItems = allLostItemsData?.data || [];
  const foundItems = allFoundItemsData?.data || [];

  const deg2rad = (deg: number) => deg * (Math.PI / 180);
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const calculateMatchScore = (lost: any, found: any) => {
    let score = 0;
    const breakdown: string[] = [];

    // 1. Category Match (40%)
    if (lost.categoryId === found.categoryId || (lost.category?.name && lost.category?.name === found.category?.name)) {
      score += 40;
      breakdown.push(" Category matches perfectly (+40%)");
    }

    // 2. Location Proximity (25%)
    const lostCoords = getCoordinates(lost.location);
    const foundCoords = getCoordinates(found.location);

    if (lost.location?.toLowerCase().trim() === found.location?.toLowerCase().trim()) {
      score += 25;
      breakdown.push(" Exact same location string (+25%)");
    } else if (lostCoords && foundCoords) {
      const distKm = getDistance(lostCoords[0], lostCoords[1], foundCoords[0], foundCoords[1]);
      const distM = distKm * 1000;
      if (distM <= 50) {
        score += 22;
        breakdown.push(` Within 50m (${Math.round(distM)}m) (+22%)`);
      } else if (distM <= 120) {
        score += 18;
        breakdown.push(` Within 120m (${Math.round(distM)}m) (+18%)`);
      } else if (distM <= 350) {
        score += 12;
        breakdown.push(` Close Proximity (${Math.round(distM)}m) (+12%)`);
      } else if (distM <= 800) {
        score += 6;
        breakdown.push(` General Vicinity (${Math.round(distM)}m) (+6%)`);
      }
    }

    // 3. Temporal Alignment (15%)
    if (lost.date && found.date) {
      const lostTime = new Date(lost.date).getTime();
      const foundTime = new Date(found.date).getTime();
      const diffMs = Math.abs(foundTime - lostTime);
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays <= 1) {
        score += 15;
        breakdown.push(" Reported within 24 hours of each other (+15%)");
      } else if (diffDays <= 3) {
        score += 10;
        breakdown.push(" Reported within 3 days (+10%)");
      } else if (diffDays <= 7) {
        score += 5;
        breakdown.push(" Reported within 1 week (+5%)");
      }
    }

    // 4. Description similarity (20%)
    if (lost.description && found.description) {
      const stopWords = new Set(["a", "an", "the", "and", "or", "but", "is", "are", "was", "were", "in", "on", "at", "to", "for", "with", "my", "it", "of"]);
      const tokenize = (text: string) =>
        text.toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
          .split(/\s+/)
          .filter(w => w.length > 2 && !stopWords.has(w));

      const lostTokens = new Set(tokenize(lost.description));
      const foundTokens = tokenize(found.description);

      let overlap = 0;
      const matchingWords: string[] = [];
      foundTokens.forEach(t => {
        if (lostTokens.has(t)) {
          overlap++;
          matchingWords.push(t);
        }
      });

      if (overlap > 0) {
        const percentage = Math.min(20, overlap * 7);
        score += percentage;
        breakdown.push(`📝 Keyword match: "${matchingWords.slice(0, 3).join(", ")}" (+${percentage}%)`);
      }
    }

    return { score, breakdown };
  };

  const handleSendRecommenderEmail = async (pairId: string, lostItem: any, foundItem: any) => {
    if (!lostItem.schoolEmail) {
      toast.error("Lost item owner has no school email registered!");
      return;
    }
    setEmailSendingStatus(prev => ({ ...prev, [pairId]: true }));
    try {
      await sendLostItemEmail({
        smtp: {},
        recipient: {
          toEmail: lostItem.schoolEmail,
          reporterName: lostItem.reporterName || "Student",
          itemName: foundItem.foundItemName,
          location: foundItem.location,
          date: new Date(foundItem.date).toLocaleDateString("en-PH"),
          description: foundItem.description,
        }
      }).unwrap();
      toast.success(`Direct Match Alert email sent to ${lostItem.schoolEmail}!`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to send email");
    } finally {
      setEmailSendingStatus(prev => ({ ...prev, [pairId]: false }));
    }
  };

  // Generate All Recommendations
  const getAiRecommendations = () => {
    const unresolvedLost = lostItems.filter((item: any) => !item.isFound && !item.isDeleted);
    const unclaimedFound = foundItems.filter((item: any) => !item.isClaimed && !item.isDeleted && !item.isArchived);

    const recs: any[] = [];
    unresolvedLost.forEach((lost: any) => {
      unclaimedFound.forEach((found: any) => {
        const { score, breakdown } = calculateMatchScore(lost, found);
        if (score >= recommenderThreshold) {
          const matchesQuery =
            lost.lostItemName?.toLowerCase().includes(recommenderSearch.toLowerCase()) ||
            found.foundItemName?.toLowerCase().includes(recommenderSearch.toLowerCase()) ||
            lost.location?.toLowerCase().includes(recommenderSearch.toLowerCase()) ||
            found.location?.toLowerCase().includes(recommenderSearch.toLowerCase());

          if (matchesQuery) {
            recs.push({
              id: `${lost.id}-${found.id}`,
              lost,
              found,
              score,
              breakdown,
            });
          }
        }
      });
    });

    // Sort by highest match score first
    return recs.sort((a, b) => b.score - a.score);
  };

  const getClaimHistory = (claimId: string) =>
    auditLogs.filter((log: any) => log.claimId === claimId)
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // ── Identity Verification Score ──────────────────────────────────────────────
  const calcVerificationScore = (claim: any): { score: number; label: string; color: string; breakdown: string[] } => {
    let score = 0;
    const breakdown: string[] = [];
    const item = claim.foundItem;
    const desc = (claim.distinguishingFeatures || "").toLowerCase();
    const itemDesc = (item?.description || "").toLowerCase();
    const itemName = (item?.foundItemName || "").toLowerCase();

    // 1. Description provided at all (+20)
    if (desc.length > 10) { score += 20; breakdown.push("Proof description provided (+20%)"); }
    else if (desc.length > 0) { score += 8; breakdown.push("Short description provided (+8%)"); }

    // 2. Keyword overlap with item name/description (+30 max)
    const stopWords = new Set(["a", "an", "the", "and", "or", "is", "it", "my", "in", "on", "at", "was", "with"]);
    const tokenize = (t: string) => t.replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
    const claimTokens = new Set(tokenize(desc));
    const itemTokens = [...new Set([...tokenize(itemDesc), ...tokenize(itemName)])];
    let overlap = itemTokens.filter(t => claimTokens.has(t)).length;
    if (overlap > 0) {
      const kp = Math.min(30, overlap * 10);
      score += kp;
      breakdown.push(`Keyword match with item details (+${kp}%)`);
    }

    // 3. Lost date proximity to found date (+15)
    if (claim.lostDate && item?.date) {
      const diffDays = Math.abs(new Date(item.date).getTime() - new Date(claim.lostDate).getTime()) / 86400000;
      if (diffDays <= 3) { score += 15; breakdown.push("Lost date near found date (+15%)"); }
      else if (diffDays <= 10) { score += 8; breakdown.push("Lost date within 10 days (+8%)"); }
    }

    // 4. School email provided (+15)
    if (claim.schoolEmail && claim.schoolEmail.includes("@")) { score += 15; breakdown.push("School email on file (+15%)"); }

    // 5. Not flagged as high-risk (+20 bonus, else deduct 20)
    if (claim.isHighRisk) { score = Math.max(0, score - 20); breakdown.push("⚠ High-risk flag (−20%)"); }
    else { score += 20; breakdown.push("No fraud flag (+20%)"); }

    score = Math.min(100, score);
    const label = score >= 80 ? "High Confidence" : score >= 55 ? "Moderate" : "Low Confidence";
    const color = score >= 80 ? "text-emerald-400" : score >= 55 ? "text-amber-400" : "text-red-400";
    return { score, label, color, breakdown };
  };

  // ── Bulk actions ──────────────────────────────────────────────────────────────
  const pendingClaims = (filteredClaims?: any[]) =>
    (filteredClaims ?? claims).filter((c: any) => c.status === "PENDING");

  const toggleSelectAll = (filtered: any[]) => {
    const pendingIds = filtered.filter((c: any) => c.status === "PENDING").map((c: any) => c.id);
    if (pendingIds.every((id: string) => selectedIds.has(id))) {
      setSelectedIds(prev => { const n = new Set(prev); pendingIds.forEach(id => n.delete(id)); return n; });
    } else {
      setSelectedIds(prev => { const n = new Set(prev); pendingIds.forEach(id => n.add(id)); return n; });
    }
  };

  const handleBulkAction = async (status: "APPROVED" | "REJECTED") => {
    if (selectedIds.size === 0) return;
    setIsBulkLoading(true);
    let success = 0;
    for (const id of Array.from(selectedIds)) {
      try { await updateClaimStatus({ claimId: id, status }).unwrap(); success++; } catch { }
    }
    toast.success(`${success} claim(s) ${status.toLowerCase()} successfully`);
    setSelectedIds(new Set());
    setIsBulkLoading(false);
  };

  const toggleTimeline = (id: string) => {
    setExpandedTimeline(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const filteredClaims = claims.filter((claim: any) => {
    const matchesSearch =
      claim.foundItem?.foundItemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.claimantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.contactNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (statusFilter === "ALL" || claim.status === statusFilter);
  });

  const filteredLogs = auditLogs.filter((log: any) =>
    log.claim?.foundItem?.foundItemName?.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.performedBy?.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.toStatus?.toLowerCase().includes(auditSearch.toLowerCase())
  );
  const totalAuditPages = Math.max(1, Math.ceil(filteredLogs.length / AUDIT_PAGE_SIZE));
  const paginatedLogs = filteredLogs.slice((auditPage - 1) * AUDIT_PAGE_SIZE, auditPage * AUDIT_PAGE_SIZE);

  const filteredMatches = matches.filter((m: any) =>
    m.lostItem?.lostItemName?.toLowerCase().includes(matchSearch.toLowerCase()) ||
    m.foundItem?.foundItemName?.toLowerCase().includes(matchSearch.toLowerCase()) ||
    m.lostItem?.schoolEmail?.toLowerCase().includes(matchSearch.toLowerCase()) ||
    m.lostItem?.location?.toLowerCase().includes(matchSearch.toLowerCase()) ||
    m.foundItem?.location?.toLowerCase().includes(matchSearch.toLowerCase())
  );
  const totalMatchPages = Math.max(1, Math.ceil(filteredMatches.length / AUDIT_PAGE_SIZE));
  const paginatedMatches = filteredMatches.slice((matchPage - 1) * AUDIT_PAGE_SIZE, matchPage * AUDIT_PAGE_SIZE);

  const handleViewDetails = (claim: any) => { setSelectedClaim(claim); setModalTab("details"); setIsDetailModalOpen(true); };
  const handleStatusChange = (claimId: string, status: string) => {
    const claim = claims.find((c: any) => c.id === claimId);
    setSelectedClaim(claim); setNewStatus(status); setIsStatusModalOpen(true);
  };
  const handleStatusConfirm = async () => {
    if (!selectedClaim || !newStatus) return;
    setIsStatusLoading(true);
    try {
      await updateClaimStatus({ claimId: selectedClaim.id, status: newStatus }).unwrap();
      toast.success(`Claim ${newStatus.toLowerCase()}`);
      setIsStatusModalOpen(false); setSelectedClaim(null); setNewStatus("");
    } catch { toast.error("Failed to update"); }
    finally { setIsStatusLoading(false); }
  };
  const handleAnalyzeFraud = async (claimId: string) => {
    try {
      const result = await analyzeClaimFraud(claimId).unwrap();
      toast.success("AI Fraud analysis refreshed!");
      if (selectedClaim && selectedClaim.id === claimId) {
        setSelectedClaim(result.data); // Update modal data
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to analyze fraud");
    }
  };
  const handleSendClaimEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailClaim) return;
    setIsSendingEmail(true);
    try {
      await sendClaimApprovedEmail({
        smtp: {},
        recipient: {
          toEmail: claimEmailToAddress, claimantName: emailClaim.claimantName || "Student",
          itemName: emailClaim.foundItem?.foundItemName || "Unknown Item",
          location: emailClaim.foundItem?.location || "Unknown",
          claimDate: new Date(emailClaim.updatedAt || emailClaim.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }),
          contactNumber: emailClaim.contactNumber || "N/A",
        },
      }).unwrap();
      toast.success("Email sent!");
      if (emailClaim) markClaimEmailSent(emailClaim.id);
      setIsEmailModalOpen(false);
    } catch (err: any) { toast.error(err?.data?.message || "Failed"); }
    finally { setIsSendingEmail(false); }
  };
  const handleDeleteClaim = (claim: any) => {
    setClaimToDelete(claim);
    setIsDeleteModalOpen(true);
  };
  const handleDeleteConfirm = async () => {
    if (!claimToDelete) return;
    setIsDeleting(true);
    try {
      await deleteClaim(claimToDelete.id).unwrap();
      toast.success("Claim deleted successfully");
      setIsDeleteModalOpen(false);
      setClaimToDelete(null);
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.error || "Failed to delete claim";
      if (errorMessage.includes("foreign key") || errorMessage.includes("constraint")) {
        toast.error("Cannot delete approved claim due to existing references. Please reject the claim first.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const getTimelineIcon = (toStatus: string) => {
    if (toStatus === "APPROVED") return <div className="w-6 h-6 rounded-full bg-emerald-400/10 border-2 border-emerald-400 flex items-center justify-center shrink-0"><FaCheckCircle size={10} className="text-emerald-400" /></div>;
    if (toStatus === "REJECTED") return <div className="w-6 h-6 rounded-full bg-red-400/10 border-2 border-red-400 flex items-center justify-center shrink-0"><FaTimes size={10} className="text-red-400" /></div>;
    return <div className="w-6 h-6 rounded-full bg-amber-400/10 border-2 border-amber-400 flex items-center justify-center shrink-0"><FaHistory size={10} className="text-amber-400" /></div>;
  };

  const Spinner = () => (
    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  if (isLoading) return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-900 border border-white/5 rounded-2xl" />)}
      </div>
      {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-900 border border-white/5 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Tabs ── */}
      <div className="flex w-full sm:w-fit gap-0.5 sm:gap-1 p-1 bg-gray-900 border border-white/5 rounded-xl max-w-full overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("claims")}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[9px] xs:text-[10px] sm:text-xs font-semibold whitespace-nowrap ${activeTab === "claims"
            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
            : "text-gray-400 hover:text-white"
            }`}
        >
          <FaClipboardList size={11} className="hidden sm:inline-block" /> Claims
          <span className="text-[8px] xs:text-[9px] sm:text-[10px] bg-white/10 px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded-full">{claims.length}</span>
        </button>
        <button
          onClick={() => { setActiveTab("audit"); setAuditPage(1); }}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[9px] xs:text-[10px] sm:text-xs font-semibold whitespace-nowrap ${activeTab === "audit"
            ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
            : "text-gray-400 hover:text-white"
            }`}
        >
          <FaHistory size={11} className="hidden sm:inline-block" /> Audit Log
          <span className="text-[8px] xs:text-[9px] sm:text-[10px] bg-white/10 px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded-full">{auditLogs.length}</span>
        </button>
        <button
          onClick={() => { setActiveTab("matches"); setMatchPage(1); }}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[9px] xs:text-[10px] sm:text-xs font-semibold whitespace-nowrap ${activeTab === "matches"
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "text-gray-400 hover:text-white"
            }`}
        >
          <FaBolt size={11} className="hidden sm:inline-block" /> Match Log
          <span className="text-[8px] xs:text-[9px] sm:text-[10px] bg-white/10 px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded-full">{matches.length}</span>
        </button>
        <button
          onClick={() => { setActiveTab("recommender"); setRecommenderPage(1); }}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[9px] xs:text-[10px] sm:text-xs font-semibold whitespace-nowrap ${activeTab === "recommender"
            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
            : "text-gray-400 hover:text-white"
            }`}
        >
          <FaBolt size={11} className="hidden sm:inline-block text-cyan-400 shrink-0" /> AI Recommender
          <span className="text-[8px] xs:text-[9px] sm:text-[10px] bg-white/10 px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded-full">{getAiRecommendations().length}</span>
        </button>
      </div>

      {/* ── CLAIMS TAB ── */}
      {activeTab === "claims" && (
        <>
          {/* ── View toggle + Bulk actions bar ── */}
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total", value: claims.length, accent: "text-white", bg: "bg-blue-500/10", icon: <FaClipboardList size={13} className="text-blue-400" /> },
              { label: "Pending", value: claims.filter((c: any) => c.status === "PENDING").length, accent: "text-amber-400", bg: "bg-amber-500/10", icon: <FaEye size={13} className="text-amber-400" /> },
              { label: "Approved", value: claims.filter((c: any) => c.status === "APPROVED").length, accent: "text-emerald-400", bg: "bg-emerald-500/10", icon: <FaCheck size={13} className="text-emerald-400" /> },
              { label: "Rejected", value: claims.filter((c: any) => c.status === "REJECTED").length, accent: "text-red-400", bg: "bg-red-500/10", icon: <FaTimes size={13} className="text-red-400" /> },
            ].map((s) => (
              <div key={s.label} className="bg-gray-900 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <p className={`text-3xl font-bold tracking-tight ${s.accent}`}>{s.value}</p>
                  <p className="text-gray-500 text-xs mt-1 font-medium">{s.label}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>{s.icon}</div>
              </div>
            ))}
          </div>

          {/* Filters + View Toggle */}
          <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
            {/* Search — full width */}
            <div className="relative">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={11} />
              <input type="text" placeholder="Search by item, claimant, or contact..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-800/80 border border-transparent rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" />
            </div>
            {/* Second row: dropdown and view toggle on the right */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
              <CustomDropdown
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { id: "PENDING", name: "Pending" },
                  { id: "APPROVED", name: "Approved" },
                  { id: "REJECTED", name: "Rejected" },
                ]}
                allLabel="All Status"
              />
              {/* View switcher — matched size and styling */}
              <div className="flex gap-1 p-1 bg-gray-800 border border-white/5 rounded-2xl shrink-0 w-full sm:w-56">
                <button
                  onClick={() => { setClaimView("table"); setExpandedTimeline(new Set()); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${claimView === "table" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-white"
                    }`}
                >
                  <FaClipboardList size={10} /> Table
                </button>
                <button
                  onClick={() => setClaimView("timeline")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${claimView === "timeline" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-white"
                    }`}
                >
                  <FaHistory size={10} /> Timeline
                </button>
              </div>
            </div>
          </div>

          {/* Bulk actions bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl animate-fadeIn">
              <span className="text-blue-300 text-xs font-semibold">
                {selectedIds.size} claim{selectedIds.size > 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction("APPROVED")}
                  disabled={isBulkLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                >
                  <FaCheck size={9} /> Approve All
                </button>
                <button
                  onClick={() => handleBulkAction("REJECTED")}
                  disabled={isBulkLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                >
                  <FaTimes size={9} /> Reject All
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-800 border border-white/5 text-gray-400 text-xs rounded-lg hover:text-white transition-colors"
                >
                  <FaTimes size={9} /> Clear
                </button>
              </div>
            </div>
          )}

          {/* ── TABLE / TIMELINE VIEW ── */}
          {claimView === "table" ? (
            <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Claims</h2>
                <span className="text-[10px] text-gray-600">{filteredClaims.length} results</span>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 bg-gray-800/30">
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Item</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Claimant</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">ID Score</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Lost Date</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredClaims.map((claim: any) => {
                      const { score: idScore, label: idLabel, color: idColor } = calcVerificationScore(claim);
                      const isPending = claim.status === "PENDING";
                      const isSelected = selectedIds.has(claim.id);
                      return (
                        <tr key={claim.id} className={`transition-colors ${isSelected ? "bg-blue-500/5 border-l-2 border-l-blue-500/50" : "hover:bg-white/[0.02]"
                          }`}>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <img src={claim.foundItem?.img || "/default-item.png"} alt={claim.foundItem?.foundItemName}
                                className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/5" />
                              <div>
                                <p className="text-white text-xs font-semibold">{claim.foundItem?.foundItemName}</p>
                                <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full mt-0.5 inline-block">
                                  {claim.foundItem?.category?.name}
                                </span>
                                <span className="ml-2 mt-0.5 inline-block align-middle">
                                  {getRiskBadge(claim.fraudScore, claim.isHighRisk)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5 text-white text-xs font-medium mb-0.5">
                              <FaUser size={9} className="text-gray-500" /> {claim.claimantName || "—"}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                              <FaEnvelope size={9} className="text-gray-500" />
                              {claim.schoolEmail ? <span className="text-blue-300 text-[10px]">{claim.schoolEmail}</span> : <span className="text-gray-600 text-[10px] italic">No email</span>}
                            </div>
                          </td>
                          {/* Identity Verification Score */}
                          <td className="px-4 py-3.5">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-bold ${idColor}`}>{idScore}%</span>
                                <span className={`text-[9px] font-semibold ${idColor} opacity-70`}>{idLabel}</span>
                              </div>
                              <div className="w-20 h-1 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-700 ${idScore >= 80 ? "bg-emerald-500" : idScore >= 55 ? "bg-amber-500" : "bg-red-500"
                                    }`}
                                  style={{ width: `${idScore}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-gray-400 text-xs">{formatDate(claim.lostDate)}</td>
                          <td className="px-4 py-3.5">
                            <StatusSelect value={claim.status} onChange={v => handleStatusChange(claim.id, v)} />
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5 justify-end">
                              <button onClick={() => handleViewDetails(claim)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-300 text-xs font-medium rounded-lg transition-colors">
                                <FaEye size={10} /> Verify
                              </button>
                              {claim.status === "APPROVED" ? (
                                claimEmailSentIds.has(claim.id) ? (
                                  <span className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg whitespace-nowrap">
                                    <FaCheckCircle size={10} /> Sent
                                  </span>
                                ) : (
                                  <button onClick={() => { setEmailClaim(claim); setClaimEmailToAddress(claim.schoolEmail || ""); setIsEmailModalOpen(true); }}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg transition-colors">
                                    <FaEnvelope size={10} /> Email
                                  </button>
                                )
                              ) : null}
                              <button onClick={() => handleDeleteClaim(claim)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg transition-colors">
                                <FaTrash size={10} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile cards (table view) ── */}
              <div className="md:hidden divide-y divide-white/[0.04]">
                {filteredClaims.map((claim: any) => {
                  const { score: idScore, label: idLabel, color: idColor } = calcVerificationScore(claim);
                  const isPending = claim.status === "PENDING";
                  const isSelected = selectedIds.has(claim.id);
                  return (
                    <div key={claim.id} className={`p-4 space-y-3 ${isSelected ? "bg-blue-500/5 border-l-2 border-l-blue-500/40" : ""
                      }`}>

                      {/* Row 1: checkbox + image + name + status */}
                      <div className="flex items-start gap-3">
                        {isPending && (
                          <input
                            type="checkbox"
                            className="accent-blue-500 w-3.5 h-3.5 mt-1 cursor-pointer shrink-0"
                            checked={isSelected}
                            onChange={() => setSelectedIds(prev => { const n = new Set(prev); n.has(claim.id) ? n.delete(claim.id) : n.add(claim.id); return n; })}
                          />
                        )}
                        <img
                          src={claim.foundItem?.img || "/default-item.png"}
                          alt={claim.foundItem?.foundItemName}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-white text-sm font-semibold leading-tight truncate">
                              {claim.foundItem?.foundItemName}
                              <span className="ml-2 inline-block align-middle">
                                {getRiskBadge(claim.fraudScore, claim.isHighRisk)}
                              </span>
                            </p>
                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(claim.status)}`}>
                              {claim.status}
                            </span>
                          </div>
                          {claim.foundItem?.category?.name && (
                            <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                              {claim.foundItem.category.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Row 2: claimant info + ID score */}
                      <div className="bg-gray-800/50 border border-white/5 rounded-xl px-3 py-2.5 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-gray-300">
                          <FaUser size={9} className="text-gray-500 shrink-0" />
                          <span className="font-medium truncate">{claim.claimantName || "—"}</span>
                        </div>
                        {/* ID score row */}
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold shrink-0 ${idColor}`}>{idScore}%</span>
                          <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${idScore >= 80 ? "bg-emerald-500" : idScore >= 55 ? "bg-amber-500" : "bg-red-500"
                              }`} style={{ width: `${idScore}%` }} />
                          </div>
                          <span className={`text-[9px] font-semibold shrink-0 ${idColor} opacity-80`}>{idLabel}</span>
                        </div>
                        {claim.schoolEmail && (
                          <div className="flex items-center gap-2 text-xs">
                            <FaEnvelope size={9} className="text-gray-500 shrink-0" />
                            <span className="text-blue-300 text-[11px] truncate">{claim.schoolEmail}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <FaCalendarAlt size={9} className="text-gray-600 shrink-0" />
                          <span className="text-[11px]">Lost: {formatDate(claim.lostDate)}</span>
                        </div>
                      </div>

                      {/* Row 3: proof snippet */}
                      {claim.distinguishingFeatures && (
                        <p className="text-gray-500 text-[11px] leading-relaxed line-clamp-2 px-0.5">
                          "{claim.distinguishingFeatures}"
                        </p>
                      )}

                      {/* Row 4: actions */}
                      <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                        <StatusSelect value={claim.status} onChange={v => handleStatusChange(claim.id, v)} />
                        <button
                          onClick={() => handleViewDetails(claim)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-300 text-xs font-medium rounded-lg transition-colors"
                        >
                          <FaEye size={10} /> Verify
                        </button>
                        {claim.status === "APPROVED" && (
                          claimEmailSentIds.has(claim.id) ? (
                            <span className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg whitespace-nowrap">
                              <FaCheckCircle size={9} /> Sent
                            </span>
                          ) : (
                            <button
                              onClick={() => { setEmailClaim(claim); setClaimEmailToAddress(claim.schoolEmail || ""); setIsEmailModalOpen(true); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg transition-colors"
                            >
                              <FaEnvelope size={9} /> Email
                            </button>
                          )
                        )}
                        <button
                          onClick={() => handleDeleteClaim(claim)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg transition-colors"
                        >
                          <FaTrash size={9} /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredClaims.length === 0 && (
                <div className="py-16 text-center">
                  <FaClipboardList className="mx-auto text-gray-700 mb-3" size={24} />
                  <p className="text-gray-500 text-sm">No claims found</p>
                </div>
              )}
            </div>
          ) : (
            /* ── TIMELINE VIEW ── */
            <div className="space-y-4">
              {filteredClaims.length === 0 ? (
                <div className="py-16 text-center bg-gray-900 border border-white/5 rounded-2xl">
                  <FaClipboardList className="mx-auto text-gray-700 mb-3" size={24} />
                  <p className="text-gray-500 text-sm">No claims found</p>
                </div>
              ) : filteredClaims.map((claim: any) => {
                const { score: idScore, label: idLabel, color: idColor, breakdown: idBreak } = calcVerificationScore(claim);
                const history = getClaimHistory(claim.id);
                const submitted = { id: "sub", action: "SUBMITTED", toStatus: "PENDING", performedBy: claim.claimantName || "Student", createdAt: claim.createdAt };
                const allEvents = [submitted, ...history];
                const isExpanded = expandedTimeline.has(claim.id);
                return (
                  <div key={claim.id} className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
                    {/* Card header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                      <img
                        src={claim.foundItem?.img || "/default-item.png"}
                        alt={claim.foundItem?.foundItemName}
                        className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white text-xs font-semibold truncate">{claim.foundItem?.foundItemName}</p>
                          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(claim.status)}`}>{claim.status}</span>
                          <span className="inline-block align-middle">
                            {getRiskBadge(claim.fraudScore, claim.isHighRisk)}
                          </span>
                        </div>
                        <p className="text-gray-500 text-[10px] mt-0.5">{claim.claimantName} · {formatDate(claim.lostDate)}</p>
                      </div>
                      {/* ID score */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-xs font-bold ${idColor}`}>{idScore}%</span>
                        <span className={`text-[9px] ${idColor} opacity-70`}>{idLabel}</span>
                        <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${idScore >= 80 ? "bg-emerald-500" : idScore >= 55 ? "bg-amber-500" : "bg-red-500"
                            }`} style={{ width: `${idScore}%` }} />
                        </div>
                      </div>
                      <button
                        onClick={() => toggleTimeline(claim.id)}
                        className={`ml-2 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold transition-all ${isExpanded ? "bg-gray-800 border-white/5 text-gray-400 hover:text-white" : "bg-gray-800 border-white/5 text-gray-400 hover:text-white"
                          }`}
                      >
                        <FaHistory size={9} />
                        <span className="hidden sm:inline">{isExpanded ? "Hide" : "Timeline"}</span>
                        <FaChevronDown size={8} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                    </div>

                    {/* Expandable timeline */}
                    {isExpanded && (
                      <div className="px-4 py-4">
                        {/* Claim lifecycle timeline */}
                        <div className="relative">
                          <div className="absolute left-3 top-3 bottom-3 w-px bg-white/5" />
                          <div className="space-y-4">
                            {allEvents.map((evt: any, idx: number) => (
                              <div key={evt.id ?? idx} className="relative flex items-start gap-3 pl-0.5">
                                <div className="relative z-10">
                                  {evt.action === "SUBMITTED"
                                    ? <div className="w-6 h-6 rounded-full bg-cyan-400/10 border-2 border-cyan-400 flex items-center justify-center shrink-0"><FaClipboardList size={9} className="text-cyan-400" /></div>
                                    : getTimelineIcon(evt.toStatus)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-white text-xs font-semibold">
                                      {evt.action === "SUBMITTED" ? "Claim Submitted" : `Status → ${evt.toStatus}`}
                                    </p>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(evt.toStatus)}`}>{evt.toStatus}</span>
                                    {idx === allEvents.length - 1 && (
                                      <span className="text-[10px] bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 px-1.5 py-0.5 rounded-full">Latest</span>
                                    )}
                                  </div>
                                  <p className="text-gray-500 text-[10px] mt-0.5">By <span className="text-gray-300">{evt.performedBy}</span></p>
                                  <p className="text-gray-700 text-[10px]">{formatDateTime(evt.createdAt)} · {timeAgo(evt.createdAt)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* ID verification breakdown */}
                        <div className="mt-4 pt-3 border-t border-white/5">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Identity Verification Breakdown</p>
                          <div className="flex flex-wrap gap-1.5">
                            {idBreak.map((b, i) => (
                              <span key={i} className={`px-2 py-0.5 rounded-lg text-[9px] font-semibold border ${b.includes("−") || b.includes("⚠") ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-white/5 border-white/5 text-gray-300"
                                }`}>{b}</span>
                            ))}
                          </div>
                        </div>

                        {/* Quick actions */}
                        {claim.status === "PENDING" && (
                          <div className="mt-3 flex items-center gap-2">
                            <button onClick={() => { handleStatusChange(claim.id, "APPROVED"); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg transition-all">
                              <FaCheck size={9} /> Approve
                            </button>
                            <button onClick={() => { handleStatusChange(claim.id, "REJECTED"); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg transition-all">
                              <FaTimes size={9} /> Reject
                            </button>
                            <button onClick={() => handleViewDetails(claim)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-300 text-xs font-medium rounded-lg transition-colors">
                              <FaEye size={9} /> Full Details
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── AUDIT TAB ── */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={11} />
              <input value={auditSearch} onChange={e => { setAuditSearch(e.target.value); setAuditPage(1); }}
                placeholder="Search by item, admin, or status..."
                className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-white/5 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/40 transition-colors" />
            </div>
            <ExportButton label="Export" filename="nbsc-audit-log" pdfTitle="NBSC Lost & Found — Claim Audit Log"
              getRows={() => filteredLogs.map((log: any) => ({
                "Item": log.claim?.foundItem?.foundItemName ?? "Unknown",
                "Action": log.action ?? "", "From Status": log.fromStatus ?? "",
                "To Status": log.toStatus ?? "", "Performed By": log.performedBy ?? "",
                "Date & Time": formatDateTime(log.createdAt), "Note": log.note ?? "",
              }))} />
          </div>

          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Audit Log</h2>
            </div>

            {/* Desktop */}
            <div className="hidden md:block">
              <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 bg-gray-800/30">
                {["Item", "Action", "Status Change", "Performed By", "Date & Time"].map((h, i) => (
                  <div key={h} className={`text-[10px] font-bold text-gray-500 uppercase tracking-widest ${i === 0 ? "col-span-3" : i === 1 ? "col-span-2" : i === 2 ? "col-span-3" : i === 3 ? "col-span-2" : "col-span-2"}`}>{h}</div>
                ))}
              </div>
              {auditLoading ? (
                <div className="space-y-2 p-4">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-800/60 rounded-xl animate-pulse" />)}</div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                  <FaHistory size={24} className="mb-3 opacity-40" /><p className="text-sm">No audit logs yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {paginatedLogs.map((log: any) => (
                    <div key={log.id} className="grid grid-cols-12 gap-4 items-center px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                      <div className="col-span-3 flex items-center gap-2.5">
                        {log.claim?.foundItem?.img && <img src={log.claim.foundItem.img} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 border border-white/5" />}
                        <p className="text-white text-xs font-medium truncate">{log.claim?.foundItem?.foundItemName ?? "Unknown"}</p>
                      </div>
                      <div className="col-span-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(log.action)}`}>{log.action}</span>
                      </div>
                      <div className="col-span-3 flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getStatusBadge(log.fromStatus)}`}>{log.fromStatus}</span>
                        <span className="text-gray-600 text-xs">→</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getStatusBadge(log.toStatus)}`}>{log.toStatus}</span>
                      </div>
                      <div className="col-span-2">
                        <p className="text-white text-xs font-medium">{log.performedBy}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-400 text-xs">{formatDateTime(log.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-white/[0.04]">
              {paginatedLogs.map((log: any) => (
                <div key={log.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-white text-xs font-medium truncate">{log.claim?.foundItem?.foundItemName ?? "Unknown"}</p>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(log.action)}`}>{log.action}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className={`px-2 py-0.5 rounded-full font-bold border ${getStatusBadge(log.fromStatus)}`}>{log.fromStatus}</span>
                    <span className="text-gray-600">→</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold border ${getStatusBadge(log.toStatus)}`}>{log.toStatus}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{log.performedBy}</span><span>{formatDateTime(log.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {filteredLogs.length > AUDIT_PAGE_SIZE && (
            <div className="flex items-center justify-between">
              <p className="text-gray-600 text-xs">
                {(auditPage - 1) * AUDIT_PAGE_SIZE + 1}–{Math.min(auditPage * AUDIT_PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                  disabled={auditPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 border border-white/5 rounded-lg text-xs text-gray-400 disabled:opacity-30 outline-none"
                >
                  <FaChevronLeft size={9} /> Prev
                </button>
                {Array.from({ length: totalAuditPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setAuditPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold outline-none ${page === auditPage ? "text-gray-200 bg-gray-800" : "text-gray-500"
                      }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAuditPage(p => Math.min(totalAuditPages, p + 1))}
                  disabled={auditPage === totalAuditPages}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 border border-white/5 rounded-lg text-xs text-gray-400 disabled:opacity-30 outline-none"
                >
                  Next <FaChevronRight size={9} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MATCH LOG TAB ── */}
      {activeTab === "matches" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold tracking-tight text-emerald-400">{matches.length}</p>
                <p className="text-gray-500 text-xs mt-1 font-medium">Total Matches Fired</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <FaBolt size={13} className="text-emerald-400" />
              </div>
            </div>
            <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold tracking-tight text-cyan-400">
                  {matches.filter((m: any) => Date.now() - new Date(m.sentAt).getTime() < 86400000).length}
                </p>
                <p className="text-gray-500 text-xs mt-1 font-medium">Sent in Last 24h</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <FaEnvelope size={13} className="text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={11} />
            <input value={matchSearch} onChange={e => { setMatchSearch(e.target.value); setMatchPage(1); }}
              placeholder="Search by item name, location, or email..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-white/5 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/40 transition-colors" />
          </div>

          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaBolt size={11} className="text-emerald-400" />
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Smart Match Notifications</h2>
              </div>
              <span className="text-[10px] text-gray-600">{filteredMatches.length} records</span>
            </div>

            {matchLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-800/60 rounded-xl animate-pulse" />)}
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                <div className="w-14 h-14 rounded-2xl bg-gray-800/60 border border-white/5 flex items-center justify-center mb-4">
                  <FaBolt size={20} className="opacity-30" />
                </div>
                <p className="text-sm text-gray-500 font-medium">No matches fired yet</p>
                <p className="text-xs text-gray-600 mt-1">Matches appear here when the engine finds a lost↔found pair</p>
              </div>
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden md:block">
                  <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-white/5 bg-gray-800/30">
                    <div className="col-span-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Lost Item</div>
                    <div className="col-span-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Found Item</div>
                    <div className="col-span-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Notified</div>
                    <div className="col-span-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Category</div>
                    <div className="col-span-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Score</div>
                    <div className="col-span-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sent</div>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {paginatedMatches.map((m: any) => {
                      const { score } = calculateMatchScore(m.lostItem || {}, m.foundItem || {});
                      return (
                        <div key={m.id} className="grid grid-cols-12 gap-3 items-center px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                          <div className="col-span-3 min-w-0">
                            <p className="text-white text-xs font-semibold truncate">{m.lostItem?.lostItemName ?? "—"}</p>
                            <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                              <FaMapMarkerAlt size={7} className="text-red-400 shrink-0" />
                              <span className="truncate">{m.lostItem?.location ?? "—"}</span>
                            </div>
                          </div>
                          <div className="col-span-3 min-w-0">
                            <p className="text-white text-xs font-semibold truncate">{m.foundItem?.foundItemName ?? "—"}</p>
                            <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                              <FaMapMarkerAlt size={7} className="text-emerald-400 shrink-0" />
                              <span className="truncate">{m.foundItem?.location ?? "—"}</span>
                            </div>
                          </div>
                          <div className="col-span-2 min-w-0">
                            {m.lostItem?.schoolEmail ? (
                              <div className="flex items-center gap-1 text-[10px] text-blue-300">
                                <FaEnvelope size={8} className="text-blue-400 shrink-0" />
                                <span className="truncate">{m.lostItem.schoolEmail}</span>
                              </div>
                            ) : (
                              <span className="text-gray-600 text-[10px] italic">No email</span>
                            )}
                          </div>
                          <div className="col-span-1">
                            <span className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/5 text-gray-300 rounded-lg whitespace-nowrap">
                              {m.lostItem?.category?.name ?? m.foundItem?.category?.name ?? "—"}
                            </span>
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <span className="text-[10px] px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold rounded-lg">
                              {score}%
                            </span>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-400 text-[10px]">{formatDateTime(m.sentAt)}</p>
                            <p className="text-gray-600 text-[10px] mt-0.5">{timeAgo(m.sentAt)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile */}
                <div className="md:hidden divide-y divide-white/[0.04]">
                  {paginatedMatches.map((m: any) => {
                    const { score } = calculateMatchScore(m.lostItem || {}, m.foundItem || {});
                    return (
                      <div key={m.id} className="p-4 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full font-bold">Lost</span>
                              <p className="text-white text-xs font-semibold truncate">{m.lostItem?.lostItemName ?? "—"}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full font-bold">Found</span>
                              <p className="text-white text-xs truncate">{m.foundItem?.foundItemName ?? "—"}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold rounded-lg shrink-0">
                              {score}% Match
                            </span>
                            <p className="text-gray-600 text-[10px] shrink-0">{timeAgo(m.sentAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-blue-300">
                          <FaEnvelope size={8} className="text-blue-400 shrink-0" />
                          <span className="truncate">{m.lostItem?.schoolEmail ?? "No email on file"}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-500">
                          <div className="flex items-center gap-1">
                            <FaTag size={7} className="text-gray-600" />
                            {m.lostItem?.category?.name ?? "—"}
                          </div>
                          <span>{formatDateTime(m.sentAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {filteredMatches.length > AUDIT_PAGE_SIZE && (
            <div className="flex items-center justify-between">
              <p className="text-gray-600 text-xs">
                {(matchPage - 1) * AUDIT_PAGE_SIZE + 1}–{Math.min(matchPage * AUDIT_PAGE_SIZE, filteredMatches.length)} of {filteredMatches.length}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setMatchPage(p => Math.max(1, p - 1))} disabled={matchPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 border border-white/5 rounded-lg text-xs text-gray-400 hover:text-white disabled:opacity-30 transition-all">
                  <FaChevronLeft size={9} /> Prev
                </button>
                {Array.from({ length: totalMatchPages }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setMatchPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${page === matchPage ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-gray-500 hover:text-white hover:bg-white/5"}`}>
                    {page}
                  </button>
                ))}
                <button onClick={() => setMatchPage(p => Math.min(totalMatchPages, p + 1))} disabled={matchPage === totalMatchPages}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 border border-white/5 rounded-lg text-xs text-gray-400 hover:text-white disabled:opacity-30 transition-all">
                  Next <FaChevronRight size={9} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── AI SMART RECOMMENDER TAB ── */}
      {activeTab === "recommender" && (() => {
        const recs = getAiRecommendations();
        const REC_PAGE_SIZE = 5;
        const totalRecPages = Math.ceil(recs.length / REC_PAGE_SIZE);
        const paginatedRecs = recs.slice((recommenderPage - 1) * REC_PAGE_SIZE, recommenderPage * REC_PAGE_SIZE);

        const getScoreDetails = (score: number) => {
          if (score >= 80) return {
            border: "border-emerald-500/30 hover:border-emerald-500/50 shadow-emerald-500/5",
            badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
            label: " Excellent Match",
            glow: "bg-emerald-500/20",
            text: "text-emerald-400"
          };
          if (score >= 60) return {
            border: "border-cyan-500/30 hover:border-cyan-500/50 shadow-cyan-500/5",
            badge: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
            label: " Strong Match",
            glow: "bg-cyan-500/20",
            text: "text-cyan-400"
          };
          return {
            border: "border-amber-500/30 hover:border-amber-500/50 shadow-amber-500/5",
            badge: "bg-amber-500/10 border-amber-500/20 text-amber-400",
            label: " Probable Match",
            glow: "bg-amber-500/20",
            text: "text-amber-400"
          };
        };

        const renderItemImage = (img: string, name: string) => {
          if (img) {
            return (
              <img
                src={img}
                alt={name}
                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/10 hover:scale-105 transition-transform"
                onError={(e: any) => { e.target.onerror = null; e.target.src = "/default-item.png"; }}
              />
            );
          }
          return (
            <div className="w-16 h-16 rounded-xl bg-gray-800 border border-white/5 flex items-center justify-center text-gray-500 shrink-0">
              <FaBoxOpen size={20} className="opacity-40" />
            </div>
          );
        };

        return (
          <div className="space-y-5">
            {/* Header / Stats Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-lg">
                <div>
                  <p className="text-3xl font-extrabold tracking-tight text-cyan-400">{recs.length}</p>
                  <p className="text-gray-500 text-xs mt-1 font-semibold">Total Dynamic Pairs Detected</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                  <FaBolt size={14} className="text-cyan-400 animate-pulse" />
                </div>
              </div>
              <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-lg">
                <div>
                  <p className="text-3xl font-extrabold tracking-tight text-emerald-400">
                    {recs.filter(r => r.score >= 80).length}
                  </p>
                  <p className="text-gray-500 text-xs mt-1 font-semibold">Excellent Matches (≥80%)</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <FaCheckCircle size={14} className="text-emerald-400" />
                </div>
              </div>
              <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-lg">
                <div>
                  <p className="text-3xl font-extrabold tracking-tight text-amber-400">
                    {recs.filter(r => r.score >= 60 && r.score < 80).length}
                  </p>
                  <p className="text-gray-500 text-xs mt-1 font-semibold">Strong Matches (60%–79%)</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <FaHistory size={14} className="text-amber-400" />
                </div>
              </div>
            </div>

            {/* Filter Panel */}
            <div className="space-y-4">
              <div className="relative">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={11} />
                <input
                  value={recommenderSearch}
                  onChange={e => { setRecommenderSearch(e.target.value); setRecommenderPage(1); }}
                  placeholder="Search by item name, location, or email..."
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-white/5 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 transition-colors"
                />
              </div>

              {/* Score threshold slider panel */}
              <div className="flex items-center gap-3 bg-gray-900 border border-white/5 px-4 py-2.5 rounded-xl w-full sm:w-72 shadow-lg">
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                    <span>MATCH SCORE THRESHOLD</span>
                    <span className="text-cyan-400 font-extrabold">{recommenderThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="90"
                    step="5"
                    value={recommenderThreshold}
                    onChange={e => { setRecommenderThreshold(Number(e.target.value)); setRecommenderPage(1); }}
                    className="w-full accent-cyan-400 cursor-pointer h-1 rounded-lg bg-gray-800"
                  />
                </div>
              </div>
            </div>

            {/* Recommended List Grid */}
            {lostLoading || foundLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-64 bg-gray-955 border border-white/5 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : recs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-gray-900 border border-white/5 rounded-2xl shadow-inner text-gray-500">
                <div className="w-16 h-16 rounded-2xl bg-gray-800/80 border border-white/5 flex items-center justify-center mb-4">
                  <FaBolt size={24} className="text-gray-600 opacity-40 animate-bounce" />
                </div>
                <p className="text-sm font-semibold text-gray-400">No Potential Pairs Match Your Filters</p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm text-center">
                  Try lowering the match score threshold or clearing search terms to discover lower similarity pairs.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {paginatedRecs.map((r: any, index: number) => {
                  const details = getScoreDetails(r.score);
                  const isSending = !!emailSendingStatus[r.id];
                  const rank = (recommenderPage - 1) * REC_PAGE_SIZE + index + 1;

                  return (
                    <div
                      key={r.id}
                      className={`group bg-gray-900 border ${details.border} rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden`}
                    >
                      {/* Top Action Header bar */}
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${details.badge}`}>
                            Rank #{rank} • {details.label}
                          </span>
                        </div>

                        {/* Circular Score Gauge & Connection Button */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className={`relative w-12 h-12 flex items-center justify-center rounded-full border-2 border-white/5 ${details.glow}`}>
                              <span className={`text-xs font-black ${details.text}`}>{r.score}%</span>
                            </div>
                            <div className="hidden sm:block text-left">
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Similarity</p>
                              <p className={`text-xs font-extrabold ${details.text}`}>AI Score Match</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleSendRecommenderEmail(r.id, r.lost, r.found)}
                            disabled={isSending}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${isSending
                              ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5"
                              : "bg-blue-500 text-white hover:bg-blue-400 font-black active:scale-95"
                              }`}
                          >
                            {isSending ? (
                              <>
                                <Spinner />
                                <span>Sending Match Alert...</span>
                              </>
                            ) : (
                              <>
                                <FaEnvelope size={12} />
                                <span>Connect Parties & Send Alert</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Side-by-Side Comparison Container */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-2">
                        {/* Lost Item Column (Left) */}
                        <div className="bg-gray-955 border border-white/5 rounded-xl p-4 space-y-3 relative hover:bg-gray-955 transition-colors">
                          <div className="absolute top-3 right-3 text-[9px] px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full font-extrabold uppercase tracking-wide">
                            Reported Lost
                          </div>

                          <div className="flex gap-4">
                            {renderItemImage(r.lost.img, r.lost.lostItemName)}
                            <div className="min-w-0 flex-1 space-y-1">
                              <h3 className="text-white text-sm font-bold truncate group-hover:text-cyan-400 transition-colors">
                                {r.lost.lostItemName}
                              </h3>
                              <p className="text-xs text-gray-400 line-clamp-2 italic">
                                "{r.lost.description || "No description provided."}"
                              </p>
                            </div>
                          </div>

                          {/* Attributes Table */}
                          <div className="grid grid-cols-2 gap-3 text-[10px] pt-2 border-t border-white/[0.03]">
                            <div>
                              <p className="text-gray-500 font-bold uppercase tracking-wider mb-0.5">Category</p>
                              <div className="flex items-center gap-1.5 text-gray-300">
                                <FaTag size={9} className="text-cyan-400 shrink-0" />
                                <span className="truncate">{r.lost.category?.name || "Uncategorized"}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-gray-500 font-bold uppercase tracking-wider mb-0.5">Location Lost</p>
                              <div className="flex items-center gap-1.5 text-gray-300">
                                <FaMapMarkerAlt size={9} className="text-red-400 shrink-0" />
                                <span className="truncate">{r.lost.location}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-gray-500 font-bold uppercase tracking-wider mb-0.5">Date Lost</p>
                              <div className="flex items-center gap-1.5 text-gray-300">
                                <FaCalendarAlt size={9} className="text-cyan-400 shrink-0" />
                                <span>{formatDate(r.lost.date)}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-gray-500 font-bold uppercase tracking-wider mb-0.5">Reporter & Owner</p>
                              <div className="flex items-center gap-1.5 text-blue-300">
                                <FaUser size={9} className="text-blue-400 shrink-0" />
                                <span className="truncate font-semibold">{r.lost.reporterName || "Anonymous"}</span>
                              </div>
                            </div>
                          </div>
                          {r.lost.schoolEmail && (
                            <div className="flex items-center gap-1.5 text-[9px] bg-blue-500/5 border border-blue-500/10 px-2 py-1 rounded-md text-blue-300 mt-2">
                              <FaEnvelope size={8} className="text-blue-400 shrink-0" />
                              <span className="truncate">Contact Email: {r.lost.schoolEmail}</span>
                            </div>
                          )}
                        </div>

                        {/* Found Item Column (Right) */}
                        <div className="bg-gray-955 border border-white/5 rounded-xl p-4 space-y-3 relative hover:bg-gray-955 transition-colors">
                          <div className="absolute top-3 right-3 text-[9px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full font-extrabold uppercase tracking-wide">
                            Reported Found
                          </div>

                          <div className="flex gap-4">
                            {renderItemImage(r.found.img, r.found.foundItemName)}
                            <div className="min-w-0 flex-1 space-y-1">
                              <h3 className="text-white text-sm font-bold truncate group-hover:text-cyan-400 transition-colors">
                                {r.found.foundItemName}
                              </h3>
                              <p className="text-xs text-gray-400 line-clamp-2 italic">
                                "{r.found.description || "No description provided."}"
                              </p>
                            </div>
                          </div>

                          {/* Attributes Table */}
                          <div className="grid grid-cols-2 gap-3 text-[10px] pt-2 border-t border-white/[0.03]">
                            <div>
                              <p className="text-gray-500 font-bold uppercase tracking-wider mb-0.5">Category</p>
                              <div className="flex items-center gap-1.5 text-gray-300">
                                <FaTag size={9} className="text-cyan-400 shrink-0" />
                                <span className="truncate">{r.found.category?.name || "Uncategorized"}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-gray-500 font-bold uppercase tracking-wider mb-0.5">Location Found</p>
                              <div className="flex items-center gap-1.5 text-gray-300">
                                <FaMapMarkerAlt size={9} className="text-emerald-400 shrink-0" />
                                <span className="truncate">{r.found.location}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-gray-500 font-bold uppercase tracking-wider mb-0.5">Date Found</p>
                              <div className="flex items-center gap-1.5 text-gray-300">
                                <FaCalendarAlt size={9} className="text-cyan-400 shrink-0" />
                                <span>{formatDate(r.found.date)}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-gray-500 font-bold uppercase tracking-wider mb-0.5">Reporter / Finder</p>
                              <div className="flex items-center gap-1.5 text-blue-300">
                                <FaUser size={9} className="text-blue-400 shrink-0" />
                                <span className="truncate font-semibold">{r.found.reporterName || "Anonymous Finder"}</span>
                              </div>
                            </div>
                          </div>
                          {r.found.schoolEmail && (
                            <div className="flex items-center gap-1.5 text-[9px] bg-blue-500/5 border border-blue-500/10 px-2 py-1 rounded-md text-blue-300 mt-2">
                              <FaEnvelope size={8} className="text-blue-400 shrink-0" />
                              <span className="truncate">Finder Email: {r.found.schoolEmail}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer: Proximity Breakdown & Insights */}
                      <div className="mt-4 pt-3.5 border-t border-white/5">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                          AI Proximity Match Breakdown
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {r.breakdown.map((reason: string, idx: number) => {
                            let tagStyle = "bg-white/5 border-white/5 text-gray-300";
                            if (reason.includes("Category")) tagStyle = "bg-cyan-500/10 border-cyan-500/10 text-cyan-400";
                            else if (reason.includes("Location") || reason.includes("within")) tagStyle = "bg-emerald-500/10 border-emerald-500/10 text-emerald-400";
                            else if (reason.includes("Dates")) tagStyle = "bg-amber-500/10 border-amber-500/10 text-amber-400";
                            else if (reason.includes("Keyword") || reason.includes("overlap")) tagStyle = "bg-violet-500/10 border-violet-500/10 text-violet-400";

                            return (
                              <span
                                key={idx}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${tagStyle}`}
                              >
                                {reason}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Recommender Pagination */}
                {recs.length > REC_PAGE_SIZE && (
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-gray-600 text-xs">
                      {(recommenderPage - 1) * REC_PAGE_SIZE + 1}–{Math.min(recommenderPage * REC_PAGE_SIZE, recs.length)} of {recs.length} matches
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRecommenderPage(p => Math.max(1, p - 1))}
                        disabled={recommenderPage === 1}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 border border-white/5 rounded-lg text-xs text-gray-400 hover:text-white disabled:opacity-30 transition-all"
                      >
                        <FaChevronLeft size={9} /> Prev
                      </button>
                      {Array.from({ length: totalRecPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setRecommenderPage(page)}
                          className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${page === recommenderPage
                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                            : "text-gray-500 hover:text-white hover:bg-white/5"
                            }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setRecommenderPage(p => Math.min(totalRecPages, p + 1))}
                        disabled={recommenderPage === totalRecPages}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 border border-white/5 rounded-lg text-xs text-gray-400 hover:text-white disabled:opacity-30 transition-all"
                      >
                        Next <FaChevronRight size={9} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Detail Modal ── */}
      {isDetailModalOpen && selectedClaim && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
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
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(selectedClaim.status)}`}>{selectedClaim.status}</span>
                <button onClick={() => setIsDetailModalOpen(false)}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                  <FaTimes size={12} />
                </button>
              </div>
            </div>
            <div className="mx-5 mt-4 mb-5 bg-gray-800/40 border border-white/5 rounded-xl overflow-hidden">
              <div className="flex border-b border-white/5">
                {([
                  { key: "details" as ModalTab, label: "Details", icon: <FaBoxOpen size={10} /> },
                  { key: "history" as ModalTab, label: "History", icon: <FaHistory size={10} /> },
                ] as const).map(tab => (
                  <button key={tab.key} onClick={() => setModalTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px ${modalTab === tab.key
                      ? tab.key === "details" ? "border-cyan-400 text-cyan-400" : "border-violet-400 text-violet-400"
                      : "border-transparent text-gray-500"
                      }`}>
                    {tab.icon}{tab.label}
                    {tab.key === "history" && getClaimHistory(selectedClaim.id).length > 0 && (
                      <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{getClaimHistory(selectedClaim.id).length}</span>
                    )}
                  </button>
                ))}
              </div>
              {modalTab === "details" && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                        <FaBoxOpen size={10} className="text-cyan-400" />
                        <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Found Item</p>
                      </div>
                      <div className="flex gap-3 p-3">
                        <img src={selectedClaim.foundItem?.img || "/default-item.png"} alt={selectedClaim.foundItem?.foundItemName}
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/5" />
                        <div className="min-w-0 space-y-1">
                          <p className="text-white text-sm font-semibold truncate">{selectedClaim.foundItem?.foundItemName}</p>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400"><FaTag size={8} className="text-blue-400" />{selectedClaim.foundItem?.category?.name ?? "—"}</div>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400"><FaMapMarkerAlt size={8} className="text-blue-400" /><span className="truncate">{selectedClaim.foundItem?.location ?? "—"}</span></div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                        <FaUser size={10} className="text-emerald-400" />
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Claimant</p>
                      </div>
                      <div className="p-3 space-y-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0"><FaUser size={11} className="text-emerald-400" /></div>
                          <div className="min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{selectedClaim.claimantName || "—"}</p>
                            <p className="text-blue-300 text-[10px] truncate">{selectedClaim.schoolEmail || "No email"}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <p className="text-gray-500 uppercase tracking-widest mb-0.5">Date Lost</p>
                            <div className="flex items-center gap-1 text-gray-300"><FaCalendarAlt size={8} className="text-blue-400" />{formatDate(selectedClaim.lostDate)}</div>
                          </div>
                          <div>
                            <p className="text-gray-500 uppercase tracking-widest mb-0.5">Submitted</p>
                            <p className="text-gray-300">{formatDate(selectedClaim.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Proof of Ownership</p>
                    <p className="text-gray-200 text-sm leading-relaxed">{selectedClaim.distinguishingFeatures || <span className="text-gray-500 italic text-xs">No details provided</span>}</p>
                  </div>

                  {/* Security Assessment */}
                  {(() => {
                    const parsed = parseFraudReason(selectedClaim.fraudReason);
                    const serialWarning = parsed?.serialWarning;
                    const aiAssessment = parsed?.aiAssessment;
                    
                    const score = selectedClaim.fraudScore || 0;
                    const isHigh = selectedClaim.isHighRisk || !!aiAssessment?.isHighRisk;
                    
                    let riskText = "Low Risk";
                    let riskColor = "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
                    let glowColor = "bg-emerald-500";
                    if (score >= 70 || isHigh) {
                      riskText = "High Risk";
                      riskColor = "text-red-400 border-red-500/20 bg-red-500/10";
                      glowColor = "bg-red-500";
                    } else if (score >= 40) {
                      riskText = "Medium Risk";
                      riskColor = "text-amber-400 border-amber-500/20 bg-amber-500/10";
                      glowColor = "bg-amber-500";
                    }

                    return (
                      <div className="space-y-4">
                        {/* Serial Warning if present */}
                        {serialWarning && (
                          <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                            <FaExclamationTriangle className="shrink-0 mt-0.5" size={14} />
                            <div>
                              <strong className="font-bold block uppercase tracking-wider text-[10px] mb-0.5">Serial Claimant Warning</strong>
                              <p className="text-red-300/95 leading-relaxed">{serialWarning}</p>
                            </div>
                          </div>
                        )}

                        <div className="bg-gray-800/60 border border-white/5 rounded-xl p-4 space-y-4 relative overflow-hidden">
                          {/* Top row: Header, Badge, Re-run button */}
                          <div className="flex items-center justify-between flex-wrap gap-2.5 border-b border-white/5 pb-3">
                            <div className="flex items-center gap-2">
                              <FaBolt className={score >= 70 || isHigh ? "text-red-400" : score >= 40 ? "text-amber-400" : "text-emerald-400"} size={13} />
                              <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Fraud Detection</h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${riskColor}`}>
                                {riskText}
                              </span>
                              <button
                                type="button"
                                disabled={isAnalyzing}
                                onClick={() => handleAnalyzeFraud(selectedClaim.id)}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 border border-white/10 text-gray-300 hover:text-white text-[10px] font-bold rounded-lg transition-all"
                              >
                                {isAnalyzing ? (
                                  <>
                                    <svg className="animate-spin h-3 w-3 text-cyan-400" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Analyzing...
                                  </>
                                ) : (
                                  <>
                                    <FaBolt size={8} /> Run AI Check
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Gauge and Summary description */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                            <div className="sm:col-span-4 flex flex-col items-center justify-center p-3.5 bg-gray-900/60 border border-white/5 rounded-xl">
                              <div className={`relative w-20 h-20 flex items-center justify-center rounded-full border-4 border-white/5`}>
                                <div className={`absolute inset-0 rounded-full opacity-10 ${glowColor}`} />
                                <div className="flex flex-col items-center">
                                  <span className="text-xl font-extrabold text-white leading-none">{score}%</span>
                                  <span className="text-[9px] text-gray-500 font-bold mt-1 uppercase">Score</span>
                                </div>
                              </div>
                            </div>
                            <div className="sm:col-span-8 space-y-2">
                              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">AI Assessment Explanation</h4>
                              <p className="text-gray-300 text-xs leading-relaxed italic border-l-2 border-white/10 pl-2.5">
                                {aiAssessment?.fraudReason || "No AI explanation available. Please run the AI Fraud Check."}
                              </p>
                            </div>
                          </div>

                          {/* Structured report details cards */}
                          {aiAssessment?.auditReport && (
                            <div className="space-y-3 pt-3 border-t border-white/5">
                              <h4 className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">Gemini Audit Report</h4>
                              
                              <div className="grid grid-cols-1 gap-2.5">
                                {/* Matching Details */}
                                <div className="p-3 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-xl space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                                    <FaCheckCircle size={11} />
                                    <span>Matching Details</span>
                                  </div>
                                  {aiAssessment.auditReport.matchingDetails?.length > 0 ? (
                                    <ul className="list-disc list-inside text-gray-300 text-[11px] space-y-1">
                                      {aiAssessment.auditReport.matchingDetails.map((detail: string, i: number) => (
                                        <li key={i}>{detail}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-gray-500 text-[11px] italic">No clear matching details identified.</p>
                                  )}
                                </div>

                                {/* Contradictory Details */}
                                <div className="p-3 bg-red-500/[0.02] border border-red-500/10 rounded-xl space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold">
                                    <FaTimes size={11} className="bg-red-400/10 rounded-full p-0.5 w-4 h-4 flex items-center justify-center" />
                                    <span>Contradictory Details</span>
                                  </div>
                                  {aiAssessment.auditReport.contradictoryDetails?.length > 0 ? (
                                    <ul className="list-disc list-inside text-red-350/90 text-[11px] space-y-1">
                                      {aiAssessment.auditReport.contradictoryDetails.map((detail: string, i: number) => (
                                        <li key={i}>{detail}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-gray-500 text-[11px] italic">No contradictions identified.</p>
                                  )}
                                </div>

                                {/* Missing details / Warnings */}
                                <div className="p-3 bg-amber-500/[0.02] border border-amber-500/10 rounded-xl space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                                    <FaExclamationTriangle size={11} />
                                    <span>Missing Prominent Details</span>
                                  </div>
                                  {aiAssessment.auditReport.missingDetails?.length > 0 ? (
                                    <ul className="list-disc list-inside text-amber-305/90 text-[11px] space-y-1">
                                      {aiAssessment.auditReport.missingDetails.map((detail: string, i: number) => (
                                        <li key={i}>{detail}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-gray-500 text-[11px] italic">No prominent missing details identified.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {selectedClaim.status === "PENDING" && (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { handleStatusChange(selectedClaim.id, "REJECTED"); setIsDetailModalOpen(false); }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg transition-all">
                        <FaTimes size={10} /> Reject
                      </button>
                      <button onClick={() => { handleStatusChange(selectedClaim.id, "APPROVED"); setIsDetailModalOpen(false); }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg transition-all">
                        <FaCheck size={10} /> Approve
                      </button>
                    </div>
                  )}
                  {selectedClaim.status !== "PENDING" && (
                    <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs ${selectedClaim.status === "APPROVED" ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-red-500/5 border-red-500/20 text-red-400"}`}>
                      {selectedClaim.status === "APPROVED" ? <FaCheckCircle size={12} /> : <FaTimes size={12} />}
                      This claim has been <strong className="ml-1">{selectedClaim.status.toLowerCase()}</strong>.
                    </div>
                  )}
                </div>
              )}
              {modalTab === "history" && (
                <div className="p-4">
                  {(() => {
                    const history = getClaimHistory(selectedClaim.id);
                    const submitted = { id: "submitted", action: "SUBMITTED", fromStatus: "—", toStatus: "PENDING", performedBy: selectedClaim.claimantName || "Student", createdAt: selectedClaim.createdAt, note: "" };
                    const allEvents = [submitted, ...history];
                    if (allEvents.length === 1) return (
                      <div className="flex flex-col items-center py-10 text-gray-600">
                        <FaHistory size={22} className="mb-3 opacity-40" />
                        <p className="text-sm text-gray-400">No status changes yet</p>
                      </div>
                    );
                    return (
                      <div className="relative">
                        <div className="absolute left-3 top-4 bottom-4 w-px bg-white/5" />
                        <div className="space-y-5">
                          {allEvents.map((event: any, idx: number) => (
                            <div key={event.id} className="relative flex items-start gap-3.5 pl-0.5">
                              <div className="relative z-10">
                                {event.action === "SUBMITTED"
                                  ? <div className="w-6 h-6 rounded-full bg-cyan-400/10 border-2 border-cyan-400 flex items-center justify-center shrink-0"><FaClipboardList size={9} className="text-cyan-400" /></div>
                                  : getTimelineIcon(event.toStatus)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-white text-xs font-semibold">{event.action === "SUBMITTED" ? "Claim Submitted" : `Changed to ${event.toStatus}`}</p>
                                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(event.toStatus)}`}>{event.toStatus}</span>
                                  {idx === allEvents.length - 1 && <span className="text-[10px] bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 px-1.5 py-0.5 rounded-full">Latest</span>}
                                </div>
                                <p className="text-gray-500 text-[10px] mt-0.5">By <span className="text-gray-300">{event.performedBy}</span></p>
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
        </div>
      )}

      {/* ── Status Confirm Modal ── */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"><FaCheck size={12} className="text-blue-400" /></div>
              <div><h2 className="text-sm font-bold text-white">Confirm Status Change</h2><p className="text-gray-500 text-xs">Update this claim's status</p></div>
            </div>
            {selectedClaim && (
              <div className="flex items-center gap-3 p-3 bg-gray-800/60 border border-white/5 rounded-xl mb-4">
                <img src={selectedClaim.foundItem?.img || "/default-item.png"} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-white text-xs font-semibold truncate">{selectedClaim.foundItem?.foundItemName}</p>
                  {selectedClaim.claimantName && <p className="text-gray-500 text-[10px]">by {selectedClaim.claimantName}</p>}
                </div>
                <div className="text-right text-[10px] shrink-0">
                  <span className={`px-2 py-0.5 rounded-full font-bold border ${getStatusBadge(selectedClaim.status)}`}>{selectedClaim.status}</span>
                  <span className="block text-gray-500 mt-1">→</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold border ${getStatusBadge(newStatus)}`}>{newStatus}</span>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setIsStatusModalOpen(false); setSelectedClaim(null); setNewStatus(""); }} disabled={isStatusLoading}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-white/5 text-gray-300 text-xs font-medium rounded-xl transition-colors">Cancel</button>
              <button onClick={handleStatusConfirm} disabled={isStatusLoading}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5">
                {isStatusLoading ? <><Spinner /> Updating...</> : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {isDeleteModalOpen && claimToDelete && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <FaTrash size={12} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Delete Claim</h2>
                <p className="text-gray-500 text-xs">This action cannot be undone</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-800/60 border border-white/5 rounded-xl mb-4">
              <img src={claimToDelete.foundItem?.img || "/default-item.png"} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-semibold truncate">{claimToDelete.foundItem?.foundItemName}</p>
                {claimToDelete.claimantName && <p className="text-gray-500 text-[10px]">by {claimToDelete.claimantName}</p>}
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(claimToDelete.status)}`}>
                {claimToDelete.status}
              </span>
            </div>
            {claimToDelete.status === "APPROVED" && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-xs text-justify">
                  This claim is approved. Deleting it may fail due to database constraints. Consider rejecting it first.
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setIsDeleteModalOpen(false); setClaimToDelete(null); }}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-white/5 text-gray-300 text-xs font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 bg-red-500/10 hover:bg-red-500 border border-red-500/30 text-red-400 hover:text-white disabled:opacity-50 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                {isDeleting ? <><Spinner /> Deleting...</> : <><FaTrash size={10} /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Email Modal ── */}
      {isEmailModalOpen && emailClaim && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><FaEnvelope size={11} className="text-emerald-400" /></div>
                <div><h2 className="text-sm font-bold text-white">Send Approval Email</h2><p className="text-gray-500 text-[11px]">Notify the claimant</p></div>
              </div>
              <button onClick={() => setIsEmailModalOpen(false)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"><FaTimes size={12} /></button>
            </div>
            <form onSubmit={handleSendClaimEmail} className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-800/60 border border-white/5 rounded-xl">
                <img src={emailClaim.foundItem?.img || "/default-item.png"} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-white text-xs font-semibold truncate">{emailClaim.foundItem?.foundItemName}</p>
                  <p className="text-gray-500 text-[10px]">{emailClaim.claimantName || "—"}</p>
                </div>
                <span className="shrink-0 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">APPROVED</span>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Recipient Email <span className="text-red-400">*</span></label>
                <input type="email" required value={claimEmailToAddress} onChange={e => setClaimEmailToAddress(e.target.value)} placeholder="claimant@nbsc.edu.ph"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsEmailModalOpen(false)} disabled={isSendingEmail}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-white/5 text-gray-300 text-xs font-medium rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={isSendingEmail}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5">
                  {isSendingEmail ? <><Spinner /> Sending...</> : <><FaEnvelope size={10} /> Send Email</>}
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