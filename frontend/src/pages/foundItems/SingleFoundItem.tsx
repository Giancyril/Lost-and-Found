import {
  useGetSingleFoundItemQuery,
  useCreateClaimMutation,
  useUpdateClaimStatusMutation,
  useGetStudentByIdQuery,
  useLazyGetStudentByDetailsQuery,
} from "../../redux/api/api";
import type { ScannedStudent } from "../../components/scanner/BarcodeScannerModal";
import BarcodeScannerModal from "../../components/scanner/BarcodeScannerModal";
import { Spinner } from "flowbite-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { CommentSection } from "../../components/comments/CommentSection";
import { CommentModal } from "../../components/comments/CommentModal";
import { CustomDatePicker } from "../../components/ui/CustomDatePicker";
import "react-toastify/dist/ReactToastify.css";
import {
  FaArrowLeft, FaCalendarAlt, FaMapMarkerAlt, FaUser, FaTag,
  FaTimes, FaBuilding, FaCheckCircle, FaEnvelope,
  FaChevronLeft, FaChevronRight, FaClipboardList,
  FaBoxOpen, FaHandshake, FaClock, FaSearch, FaQrcode, FaSpinner, FaUserCheck,
  FaComments,
} from "react-icons/fa";
import { useUserVerification } from "../../auth/auth";

// ── Helpers ────────────────────────────────────────────────────────────────────
const openModal  = (setter: (v: boolean) => void) => { setter(true);  document.body.classList.add("modal-open");    };
const closeModal = (setter: (v: boolean) => void) => { setter(false); document.body.classList.remove("modal-open"); };

// ── Hide image for Wallets & Purses (admin always sees) ──
const HIDDEN_IMAGE_CATEGORIES = ["wallets & purses", "wallet", "purse"];

const shouldHideImage = (categoryName: string, isAdmin: boolean) => {
  if (isAdmin) return false;
  return HIDDEN_IMAGE_CATEGORIES.some((c) =>
    categoryName?.toLowerCase().includes(c)
  );
};

const HiddenImagePlaceholder = () => (
  <div className="relative w-full h-full min-h-[430px] rounded-2xl overflow-hidden border border-gray-800 bg-gray-900 flex flex-col items-center justify-center gap-4">
    <div className="w-20 h-20 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
      <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-600" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
      </svg>
    </div>
    <div className="text-center px-6">
      <p className="text-white font-semibold text-sm mb-1">Image Not Available</p>
      <p className="text-gray-500 text-xs leading-relaxed">
        The photo of this item is hidden from public view.
        Submit a claim with proof of ownership to proceed.
      </p>
    </div>
  </div>
);

function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const prev = () => setActiveIdx((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setActiveIdx((i) => (i === images.length - 1 ? 0 : i + 1));

  if (images.length === 0) return (
    <div className="relative w-full h-full min-h-[430px] rounded-2xl overflow-hidden border border-gray-800 bg-gray-900">
      <img src="/bgimg.png" alt={alt} className="absolute inset-0 w-full h-full object-cover" />
    </div>
  );

  if (images.length === 1) return (
    <div className="relative w-full h-full min-h-[430px] rounded-2xl overflow-hidden border border-gray-800 bg-gray-900">
      <img src={images[0]} alt={alt} className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }} />
    </div>
  );

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="relative w-full flex-1 min-h-[380px] rounded-2xl overflow-hidden border border-gray-800 bg-gray-900">
        <img src={images[activeIdx]} alt={`${alt} — photo ${activeIdx + 1}`}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }} />
        <button onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 transition-all">
          <FaChevronLeft size={13} />
        </button>
        <button onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 transition-all">
          <FaChevronRight size={13} />
        </button>
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10">
          {activeIdx + 1} / {images.length}
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, idx) => (
            <button key={idx} onClick={() => setActiveIdx(idx)}
              className={`h-1.5 rounded-full transition-all duration-200 ${idx === activeIdx ? "w-4 bg-white" : "w-1.5 bg-white/40"}`} />
          ))}
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((src, idx) => (
          <button key={idx} onClick={() => setActiveIdx(idx)}
            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
              idx === activeIdx ? "border-green-500 ring-2 ring-green-500/30" : "border-gray-700 hover:border-gray-500 opacity-60 hover:opacity-100"
            }`}>
            <img src={src} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Lifecycle Timeline Modal ───────────────────────────────────────────────────
const fmt = (d: string | null) => d ? new Date(d).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;
const timeAgo = (d: string | null) => {
  if (!d) return "";
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const STAGE_META: Record<string, { icon: React.ReactNode; color: string; ring: string; bg: string; line: string }> = {
  reported:     { icon: <FaBoxOpen size={13} />,       color: "text-cyan-400",    ring: "border-cyan-500",    bg: "bg-cyan-500/10",    line: "bg-cyan-500/30"    },
  claimed:      { icon: <FaClipboardList size={13} />, color: "text-yellow-400",  ring: "border-yellow-500",  bg: "bg-yellow-500/10",  line: "bg-yellow-500/30"  },
  under_review: { icon: <FaClock size={13} />,         color: "text-orange-400",  ring: "border-orange-500",  bg: "bg-orange-500/10",  line: "bg-orange-500/30"  },
  approved:     { icon: <FaCheckCircle size={13} />,   color: "text-emerald-400", ring: "border-emerald-500", bg: "bg-emerald-500/10", line: "bg-emerald-500/30" },
  rejected:     { icon: <FaTimes size={13} />,         color: "text-red-400",     ring: "border-red-500",     bg: "bg-red-500/10",     line: "bg-red-500/30"     },
  returned:     { icon: <FaHandshake size={13} />,     color: "text-violet-400",  ring: "border-violet-500",  bg: "bg-violet-500/10",  line: "bg-violet-500/30"  },
};

function LifecycleModal({ foundItem, onClose }: { foundItem: any; onClose: () => void }) {
  const claimArr: any[] = Array.isArray(foundItem?.claim) ? foundItem.claim : foundItem?.claim ? [foundItem.claim] : [];
  const totalClaims = claimArr.length;

  const claim: any =
    claimArr.find((c: any) => c.status === "APPROVED") ??
    claimArr.find((c: any) => c.status === "PENDING")  ??
    [...claimArr].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;

  const auditLogs: any[] = claim?.auditLogs ?? [];
  const reportedAt  = foundItem?.createdAt ?? null;
  const claimedAt   = claim?.createdAt ?? null;
  const approvedLog = auditLogs.find((l: any) => l.toStatus === "APPROVED");
  const rejectedLog = auditLogs.find((l: any) => l.toStatus === "REJECTED");
  const approvedAt  = approvedLog?.createdAt ?? null;
  const rejectedAt  = rejectedLog?.createdAt ?? null;
  const returnedAt  = foundItem?.isClaimed && approvedAt ? approvedAt : null;

  const stages = [
    { id: "reported",     stage: "reported"     as const, label: "Item Reported",   sublabel: `Found at ${foundItem?.location ?? "—"}`,                                      time: reportedAt, actor: foundItem?.user?.username ?? "SAS Office", done: true,           active: !claimedAt },
    { id: "claimed",      stage: "claimed"      as const, label: "Claim Submitted", sublabel: claim ? `By ${claim.claimantName ?? "Anonymous"}` : "No claim yet",             time: claimedAt,  actor: claim?.claimantName ?? "—",                done: !!claimedAt,    active: !!claimedAt && !approvedAt && !rejectedAt },
    { id: "under_review", stage: "under_review" as const, label: "Under Review",    sublabel: claim ? "SAS office is verifying ownership" : "Awaiting claim submission",      time: claimedAt,  actor: "SAS Admin",                               done: !!claimedAt && (!!approvedAt || !!rejectedAt), active: !!claimedAt && !approvedAt && !rejectedAt },
    ...(rejectedAt ? [
      { id: "rejected",   stage: "rejected"     as const, label: "Claim Rejected",  sublabel: `Rejected by ${rejectedLog?.performedBy ?? "Admin"}`,                          time: rejectedAt, actor: rejectedLog?.performedBy ?? "Admin",        done: true,           active: true },
    ] : [
      { id: "approved",   stage: "approved"     as const, label: "Claim Approved",  sublabel: approvedAt ? `Approved by ${approvedLog?.performedBy ?? "Admin"}` : "Pending", time: approvedAt, actor: approvedLog?.performedBy ?? "—",            done: !!approvedAt,   active: !!approvedAt && !returnedAt },
      { id: "returned",   stage: "returned"     as const, label: "Item Returned",   sublabel: returnedAt ? `Returned to ${claim?.claimantName ?? "owner"}` : "Pending",       time: returnedAt, actor: claim?.claimantName ?? "—",                done: !!returnedAt,   active: !!returnedAt },
    ]),
  ];

  const doneCount = stages.filter(s => s.done).length;
  const progress  = Math.round((doneCount / stages.length) * 100);
  const current   = stages.filter(s => s.done).slice(-1)[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl shadow-2xl max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <FaClipboardList className="text-violet-400" size={14} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-white text-sm font-bold">Item Lifecycle</p>
                {totalClaims > 1 && (
                  <span className="text-[10px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-1.5 py-0.5 rounded-full font-semibold">
                    {totalClaims} claims
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-xs mt-0.5">
                {current ? <span className={STAGE_META[current.stage]?.color}>{current.label}</span> : "Not started"}
                {" "}· {progress}% complete
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors shrink-0">
            <FaTimes size={13} />
          </button>
        </div>
        <div className="px-5 pt-4 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-gray-600 text-[10px] uppercase tracking-widest font-medium">Progress</p>
            <p className="text-gray-400 text-[10px] font-semibold">{doneCount} / {stages.length} stages</p>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="h-2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 transition-all duration-700"
              style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-1.5">
            {stages.map(s => (
              <div key={s.id} className={`text-[9px] font-medium ${s.done ? STAGE_META[s.stage]?.color : "text-gray-700"}`}>
                {s.label.split(" ")[0]}
              </div>
            ))}
          </div>
        </div>
        {totalClaims > 1 && (
          <div className="mx-5 mt-4 flex items-start gap-2.5 bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-4 py-3 shrink-0">
            <FaClipboardList className="text-yellow-400 shrink-0 mt-0.5" size={11} />
            <p className="text-yellow-300/80 text-xs leading-relaxed">
              <strong>{totalClaims} students</strong> have submitted a claim for this item. Showing the most relevant claim. Admin reviews each individually in the dashboard.
            </p>
          </div>
        )}
        {/* ── scrollable timeline body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 custom-scrollbar">
          <div className="relative">
            <div className="absolute left-[18px] top-5 bottom-5 w-px bg-gray-800" />
            <div className="space-y-0">
              {stages.map((stage, idx) => {
                const meta   = STAGE_META[stage.stage];
                const isLast = idx === stages.length - 1;
                return (
                  <div key={stage.id} className="relative flex gap-4">
                    <div className="flex flex-col items-center shrink-0" style={{ width: 36 }}>
                      <div className={`relative z-10 w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                        stage.done ? `${meta.ring} ${meta.bg} ${meta.color}` : "border-gray-700 bg-gray-800/80 text-gray-700"
                      }`}>
                        {stage.done ? meta.icon : <div className="w-2.5 h-2.5 rounded-full bg-gray-700" />}
                      </div>
                      {!isLast && (
                        <div className={`w-px flex-1 my-1 min-h-[24px] ${stage.done ? meta.line : "bg-gray-800"}`} />
                      )}
                    </div>
                    <div className={`flex-1 min-w-0 pb-5 ${!stage.done ? "opacity-35" : ""}`}>
                      <div className="flex items-start justify-between gap-2 pt-1.5">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-semibold ${stage.done ? "text-white" : "text-gray-600"} ${stage.active && stage.done ? meta.color : ""}`}>
                              {stage.label}
                            </p>
                            {stage.active && stage.done && (
                              <span className="text-[10px] bg-white/5 border border-white/10 text-gray-400 px-1.5 py-0.5 rounded-full">Current</span>
                            )}
                          </div>
                          <p className={`text-xs mt-0.5 ${stage.done ? "text-gray-400" : "text-gray-700"}`}>{stage.sublabel}</p>
                          {stage.done && stage.actor !== "—" && (
                            <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-white/5 border border-white/5 rounded-full">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                              <span className="text-[10px] text-gray-500">{stage.actor}</span>
                            </div>
                          )}
                        </div>
                        {stage.time && (
                          <div className="text-right shrink-0">
                            <p className="text-gray-500 text-[10px] font-medium">{timeAgo(stage.time)}</p>
                            <p className="text-gray-700 text-[10px] mt-0.5">{fmt(stage.time)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-white/5 shrink-0 flex items-center gap-2">
          <FaClock size={10} className="text-gray-700 shrink-0" />
          <p className="text-gray-700 text-[10px]">Timeline updates automatically as the claim is processed by SAS Admin.</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
const SingleFoundItem = () => {
  const { foundItem: foundItemParam } = useParams<{ foundItem: string }>();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const foundItemId = foundItemParam;
  const users: any = useUserVerification();
  const isAdmin = users?.role === "ADMIN";

  const { data: singleFoundItem, isLoading, refetch } = useGetSingleFoundItemQuery(foundItemId!);
  const [createClaim, { isLoading: claimLoading }]    = useCreateClaimMutation();
  const [updateClaimStatus]                           = useUpdateClaimStatusMutation();
  const [isSubmitting, setIsSubmitting]               = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen]       = useState(false);
  const [isTimelineOpen, setIsTimelineOpen]           = useState(false);
  const [lostDate, setLostDate]                       = useState("");
  const [claimScannedStudent, setClaimScannedStudent] = useState<ScannedStudent | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [showClaimScanner, setShowClaimScanner]       = useState(false);
  const [isFetchingClaimStudent, setIsFetchingClaimStudent] = useState(false);
  const [getStudentByDetailsForClaim] = useLazyGetStudentByDetailsQuery();

  const useFetchStudentForClaim = (id: string) => {
    const trimmed = id?.trim() ?? "";
    const isValidId = Boolean(trimmed && trimmed.length >= 4 && !/^\d{4}-\d{2}-\d{2}$/.test(trimmed));
    return useGetStudentByIdQuery(trimmed, { skip: !isValidId });
  };

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm();

  // ── FIX: watch the claim form fields for live values ──
  const watchedClaimantName = watch("claimantName") ?? "";
  const watchedSchoolEmail  = watch("schoolEmail")  ?? "";

  const handleCloseClaimModal = () => {
    closeModal(setIsClaimModalOpen);
    reset();
    setLostDate("");
    setClaimScannedStudent(null);
  };

  const handleClaimScan = (student: ScannedStudent) => {
    setClaimScannedStudent(student);
    setValue("claimantName", student.name);
    setValue("schoolEmail", student.email);
    setShowClaimScanner(false);
    toast.success(`Student identified: ${student.name}`);
  };

  // ── FIX: use watched values instead of querySelector ──
  const handleClaimFetchDetails = async () => {
    const name  = watchedClaimantName?.trim() || "";
    const email = watchedSchoolEmail?.trim()  || "";

    if (!name && !email) { toast.info("Please enter a name or email to fetch details"); return; }

    setIsFetchingClaimStudent(true);
    try {
      let student: any = null;

      // Try name (+ email together) first
      if (name) {
        try {
          const r = await getStudentByDetailsForClaim({ name, email }).unwrap();
          student = r?.data ?? r;
        } catch {
          // name search failed — fall through to email-only
        }
      }

      // Fall back to email-only if name search failed or name was empty
      if (!student?.name && email) {
        try {
          const r = await getStudentByDetailsForClaim({ name: "", email }).unwrap();
          student = r?.data ?? r;
        } catch {
          // both failed
        }
      }

      if (student?.name) {
        setClaimScannedStudent({
          id:         student.id         || "",
          name:       student.name       || "",
          email:      student.email      || "",
          department: student.department || student.course || "",
          raw:        "manual_fetch",
        });
        setValue("claimantName", student.name);
        setValue("schoolEmail",  student.email);
        toast.success(`Found: ${student.name}`);
      } else {
        toast.error("Student not found in masterlist");
      }
    } catch {
      toast.error("Student not found in masterlist");
    } finally {
      setIsFetchingClaimStudent(false);
    }
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const claimData = {
        foundItemId,
        distinguishingFeatures: data.distinguishingFeatures,
        lostDate: new Date(lostDate + "T00:00:00").toISOString(),
        claimantName: data.claimantName,
        schoolEmail: data.schoolEmail,
      };
      const res: any = await createClaim(claimData);
      if (res?.data?.success) {
        if (isAdmin && res?.data?.data?.id) {
          await updateClaimStatus({ claimId: res.data.data.id, status: "APPROVED" });
          toast.success("Claim processed and marked as approved!");
          refetch();
        } else {
          toast.success("Your claim has been submitted. Please visit the SAS office with a valid ID for verification.");
        }
        handleCloseClaimModal();
      } else {
        toast.error("Failed to submit claim. Please try again.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!foundItemId) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center max-w-md mx-auto px-4">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-white mb-3">Invalid Item</h2>
        <Link to="/foundItems" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm">
          <FaArrowLeft size={11} /> Back
        </Link>
      </div>
    </div>
  );

  if (isLoading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center"><Spinner size="xl" className="mb-4" /><p className="text-gray-400 text-sm">Loading...</p></div>
    </div>
  );

  const foundItemData = singleFoundItem?.data;
  if (!foundItemData) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center max-w-md mx-auto px-4">
        <div className="text-5xl mb-4">😞</div>
        <h2 className="text-2xl font-bold text-white mb-3">Item Not Found</h2>
        <Link to="/foundItems" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm">
          <FaArrowLeft size={11} /> Back
        </Link>
      </div>
    </div>
  );

  const isClaimed = foundItemData?.isClaimed;
  const hideImage = shouldHideImage(foundItemData?.category?.name, isAdmin);

  const imageList: string[] = Array.isArray(foundItemData.images) && foundItemData.images.length > 0
    ? foundItemData.images.map((i: any) => (typeof i === "string" ? i : i?.url ?? i?.src ?? ""))
    : foundItemData?.img ? [foundItemData.img] : [];

  const claimCount = Array.isArray(foundItemData?.claim)
    ? foundItemData.claim.length
    : foundItemData?.claim ? 1 : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-950">
        <div className="w-full px-4 sm:px-10 lg:px-16 py-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">
                {foundItemData?.foundItemName || "Found Item"}
              </h1>
              <p className="text-gray-500 text-sm mt-1">Item details & discussion</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:shrink-0">
              <button
                onClick={() => openModal(setIsTimelineOpen)}
                className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-all"
              >
                <FaClipboardList size={10} /> View Lifecycle
                {claimCount > 0 && (
                  <span className="ml-0.5 bg-violet-500 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                    {claimCount}
                  </span>
                )}
              </button>
              <Link to="/foundItems" className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-semibold text-gray-400 hover:text-white transition-all">
                <FaArrowLeft size={10} /> Back to Board
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-10 lg:px-16 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-stretch">
          {/* Left: Image */}
          <div className="relative flex flex-col h-full rounded-2xl overflow-hidden">
            <div className="absolute top-3 left-3 z-10">
              {isClaimed ? (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-600/90 text-white text-[10px] font-bold rounded-full backdrop-blur-sm border border-emerald-500/30">
                  <FaCheckCircle size={8} /> Claimed
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-blue-600/90 text-white text-[10px] font-bold rounded-full backdrop-blur-sm border border-blue-500/30">
                  Available
                </span>
              )}
            </div>
            {hideImage ? <HiddenImagePlaceholder /> : <ImageCarousel images={imageList} alt={foundItemData?.foundItemName} />}
          </div>

          {/* Right: Info */}
          <div className="flex flex-col h-full space-y-4">
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h2 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <FaTag className="text-blue-500" size={10} /> Item Details
              </h2>
              <div className="grid grid-cols-2 gap-3 mb-1">
                <div className="space-y-1">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Category</p>
                  <p className="text-white text-sm font-semibold">{foundItemData?.category?.name || "Uncategorized"}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Found Date</p>
                  <p className="text-white text-sm font-semibold flex items-center justify-end gap-1.5">
                    <FaCalendarAlt className="text-blue-500" size={10} />
                    {foundItemData?.date?.split("T")[0] || "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h2 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <FaMapMarkerAlt className="text-blue-500" size={10} /> Location Found
              </h2>
              <div className="p-3 bg-gray-800 rounded-lg border border-gray-700/50">
                <p className="text-white text-sm font-semibold">{foundItemData?.location}</p>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 flex-1">
              <h2 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <FaClipboardList className="text-blue-500" size={10} /> Description
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed text-justify whitespace-pre-wrap">
                {foundItemData?.description || "No description provided."}
              </p>
            </div>

            {isClaimed ? (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <FaHandshake className="text-emerald-400" size={18} />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">Already Claimed</p>
                  <p className="text-emerald-400/70 text-[10px] uppercase font-black tracking-widest">Success</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-gray-800 rounded-xl p-3">
                  <FaBuilding className="text-blue-400 mt-0.5 shrink-0 text-lg" />
                  <div>
                    <p className="text-white text-sm font-semibold">Is this your item?</p>
                    <p className="text-gray-400 text-xs mt-1 leading-relaxed">Submit a claim with proof of ownership. SAS office will review and contact you.</p>
                  </div>
                </div>
                <button onClick={() => openModal(setIsClaimModalOpen)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 text-sm">
                  Submit a Claim
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Discussion & Sightings */}
        <div className="mt-10 pt-10 border-t border-gray-800">
          <button
            onClick={() => setIsCommentModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-gray-300 hover:text-white transition-all font-semibold text-sm"
          >
            <FaComments size={14} className="text-blue-400" />
            View Discussion & Sightings
          </button>
        </div>
      </div>

      {/* Modals */}
      {isTimelineOpen && (
        <LifecycleModal foundItem={foundItemData} onClose={() => closeModal(setIsTimelineOpen)} />
      )}

      {isClaimModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div id="single-claim-modal" className="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 sticky top-0 bg-gray-900 z-20">
              <div>
                <h3 className="text-base font-bold text-white">{isAdmin ? "Process Claim" : "Submit a Claim"}</h3>
                <p className="text-gray-500 text-xs mt-0.5">{isAdmin ? "Verify ownership" : "Provide proof of ownership"}</p>
              </div>
              <button onClick={handleCloseClaimModal} className="text-gray-500 hover:text-white">
                <FaTimes size={15} />
              </button>
            </div>

            <div className="px-4 pt-3 border-b border-gray-800 pb-3">
              {!claimScannedStudent ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClaimFetchDetails}
                    disabled={isFetchingClaimStudent}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-[9px] font-black text-blue-400 uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    {isFetchingClaimStudent ? <FaSpinner className="animate-spin" size={8} /> : <FaSearch size={8} />} Fetch Info
                  </button>
                  <button onClick={() => setShowClaimScanner(true)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/25 text-blue-400 text-[9px] font-black rounded-lg uppercase tracking-wider">
                    <FaQrcode size={9} /> Scan ID
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-blue-500/5 border border-blue-500/20 rounded-xl px-3 py-2.5">
                  <FaUserCheck size={14} className="text-blue-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-xs font-black uppercase truncate">{claimScannedStudent.name}</p>
                    <p className="text-blue-400/70 text-[10px] font-bold">ID: {claimScannedStudent.id}</p>
                  </div>
                  <button onClick={() => { setClaimScannedStudent(null); setValue("claimantName", ""); setValue("schoolEmail", ""); }} className="text-gray-500 hover:text-white"><FaTimes size={10} /></button>
                </div>
              )}
            </div>

            <div className="px-4 py-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Full Name *</label>
                  <input type="text" {...register("claimantName", { required: "Full name is required" })} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm" />
                  {errors.claimantName && <p className="text-red-400 text-xs mt-1">{errors.claimantName.message as string}</p>}
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">School Email *</label>
                  <input type="email" {...register("schoolEmail", { required: "School email is required", pattern: { value: /^[^\s@]+@nbsc\.edu\.ph$/i, message: "Use @nbsc.edu.ph" } })} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm" />
                  {errors.schoolEmail && <p className="text-red-400 text-xs mt-1">{errors.schoolEmail.message as string}</p>}
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Date Lost</label>
                  <CustomDatePicker value={lostDate} onChange={setLostDate} max={new Date().toISOString().split("T")[0]} placeholder=" " openUp />
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Proof of Ownership *</label>
                  <textarea rows={4} {...register("distinguishingFeatures", { required: "Description required", minLength: { value: 10, message: "Min 10 chars" } })} className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm resize-none" />
                  {errors.distinguishingFeatures && <p className="text-red-400 text-xs mt-1">{errors.distinguishingFeatures.message as string}</p>}
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={handleCloseClaimModal} className="flex-1 px-4 py-2.5 text-gray-400 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium">Cancel</button>
                  <button type="submit" disabled={isSubmitting || claimLoading} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold">
                    {isSubmitting || claimLoading ? <Spinner size="sm" /> : isAdmin ? "Approve Claim" : "Submit Claim"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showClaimScanner && (
        <BarcodeScannerModal onScan={handleClaimScan} onClose={() => setShowClaimScanner(false)} useFetchStudent={useFetchStudentForClaim} />
      )}

      <CommentModal 
        isOpen={isCommentModalOpen} 
        onClose={() => setIsCommentModalOpen(false)} 
        itemId={foundItemId!} 
        itemType="found" 
        itemName={singleFoundItem?.data?.foundItemName || "Item"} 
      />

      <ToastContainer position="top-right" autoClose={5000} theme="dark" />
    </div>
  );
};

export default SingleFoundItem;