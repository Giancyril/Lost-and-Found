import { useState, useRef, useEffect } from "react";
import {
  FaSearch, FaMapMarkerAlt, FaCalendarAlt, FaChevronLeft, FaChevronRight,
  FaLightbulb, FaTimes, FaEye, FaTrash, FaPlus, FaCheckCircle,
  FaUser, FaTag, FaImage, FaTh, FaList,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  useGetBulletinPostsQuery,
  useCreateBulletinPostMutation,
  useGetBulletinTipsQuery,
  useCreateBulletinTipMutation,
  useDeleteBulletinPostMutation,
  useDeleteBulletinTipMutation,
  useResolveBulletinPostMutation,
} from "../../redux/api/api";
import { useUserVerification } from "../../auth/auth";
import type { BulletinPost, BulletinTip } from "../../types/types";

const MAX_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const timeAgo = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const todayStr = () => new Date().toISOString().split("T")[0];

const Spinner = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const handleApiError = (err: any, fallback = "Something went wrong.") => {
  const status = err?.status ?? err?.originalStatus;
  if (status === 429) toast.error("Too many requests. Please try again later.");
  else if (status === 401) toast.error("You are not authorized to perform this action.");
  else toast.error(err?.data?.message ?? fallback);
};

// ── Post Modal ────────────────────────────────────────────────────────────────
const PostModal = ({ onClose }: { onClose: () => void }) => {
  const [createPost, { isLoading }] = useCreateBulletinPostMutation();
  const [itemName,     setItemName]     = useState("");
  const [description,  setDescription]  = useState("");
  const [location,     setLocation]     = useState("");
  const [dateLost,     setDateLost]     = useState(todayStr());
  const [reporterName, setReporterName] = useState("");
  const [contactHint,  setContactHint]  = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageError,   setImageError]   = useState("");
  const [errors,       setErrors]       = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    setImageError("");
    if (!ACCEPTED_TYPES.includes(file.type)) { setImageError("Only JPEG, PNG, or WebP images are allowed."); return; }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { setImageError(`Image must be under ${MAX_SIZE_MB} MB.`); return; }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!itemName.trim()) e.itemName = "Item name is required";
    if (description.trim().length < 10) e.description = "Description must be at least 10 characters";
    if (!location.trim()) e.location = "Location is required";
    if (!dateLost) e.dateLost = "Date is required";
    else if (new Date(dateLost) > new Date()) e.dateLost = "Date cannot be in the future";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      await createPost({
        itemName: itemName.trim(), description: description.trim(),
        location: location.trim(), dateLost,
        imageUrl: imagePreview || undefined,
        reporterName: reporterName.trim() || undefined,
        contactHint: contactHint.trim() || undefined,
      }).unwrap();
      toast.success("Your post has been submitted!");
      onClose();
    } catch (err: any) { handleApiError(err, "Failed to submit post."); }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 sticky top-0 bg-gray-900 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <FaPlus size={11} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Post a Lost Item</h3>
              <p className="text-gray-500 text-[11px]">No login required — community will help</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <FaTimes size={12} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Item Name <span className="text-red-400">*</span></label>
            <input type="text" value={itemName} onChange={e => setItemName(e.target.value)} maxLength={100}
              placeholder="e.g. Blue backpack, iPhone 13, Student ID..."
              className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
            {errors.itemName && <p className="text-red-400 text-xs mt-1">{errors.itemName}</p>}
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description <span className="text-red-400">*</span></label>
            <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} maxLength={500}
              placeholder="Describe the item — color, brand, distinguishing features..."
              className="w-full p-3 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
            <p className="text-gray-700 text-[10px] mt-0.5">{description.length}/500</p>
            {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Last Seen Location <span className="text-red-400">*</span></label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={11} />
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} maxLength={100}
                  placeholder="Room 205, Library..."
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
              </div>
              {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date Lost <span className="text-red-400">*</span></label>
              <input type="date" value={dateLost} onChange={e => setDateLost(e.target.value)} max={todayStr()}
                className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
              {errors.dateLost && <p className="text-red-400 text-xs mt-1">{errors.dateLost}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Your Name <span className="text-gray-600 font-normal normal-case">(optional)</span></label>
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={10} />
                <input type="text" value={reporterName} onChange={e => setReporterName(e.target.value)} maxLength={80}
                  placeholder=" "
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Course <span className="text-gray-600 font-normal normal-case">(optional)</span></label>
              <div className="relative">
                <FaTag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={10} />
                <input type="text" value={contactHint} onChange={e => setContactHint(e.target.value)} maxLength={100}
                  placeholder=" "
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Photo <span className="text-gray-600 font-normal normal-case">(optional)</span></label>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => handleFile(e.target.files)} />
            {imagePreview ? (
              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/10">
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setImagePreview(""); setImageError(""); if (fileRef.current) fileRef.current.value = ""; }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-500 transition-colors">
                  <FaTimes size={10} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-white/10 hover:border-amber-500/40 rounded-xl flex flex-col items-center justify-center gap-1.5 text-gray-500 hover:text-amber-400 transition-all">
                <FaImage size={18} />
                <span className="text-xs">Click to upload (JPEG, PNG, WebP · max 5 MB)</span>
              </button>
            )}
            {imageError && <p className="text-red-400 text-xs mt-1">{imageError}</p>}
          </div>
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-3.5 py-2.5">
            <p className="text-amber-300/70 text-[11px] leading-relaxed"> Your post will be visible to the community. The SAS office may contact you if a match is found.</p>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 text-xs font-medium rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={isLoading} className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5">
              {isLoading ? <><Spinner /> Posting...</> : <><FaPlus size={10} /> Post Item</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Tip Modal ─────────────────────────────────────────────────────────────────
const TipModal = ({ post, onClose }: { post: BulletinPost; onClose: () => void }) => {
  const [createTip, { isLoading }] = useCreateBulletinTipMutation();
  const [details,  setDetails]  = useState("");
  const [location, setLocation] = useState("");
  const [error,    setError]    = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (details.trim().length < 10) { setError("Please provide at least 10 characters."); return; }
    try {
      await createTip({ id: post.id, details: details.trim(), location: location.trim() || undefined }).unwrap();
      toast.success("Tip submitted — thank you!");
      onClose();
    } catch (err: any) { handleApiError(err, "Failed to submit tip."); }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><FaLightbulb size={11} className="text-emerald-400" /></div>
            <div>
              <h3 className="text-sm font-bold text-white">I Saw This Item</h3>
              <p className="text-gray-500 text-[11px] truncate max-w-[200px]">{post.itemName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"><FaTimes size={12} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">What did you see? <span className="text-red-400">*</span></label>
            <textarea rows={4} value={details} onChange={e => { setDetails(e.target.value); setError(""); }} maxLength={500}
              placeholder="Describe where and when you saw this item..."
              className="w-full p-3 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
            <p className="text-gray-700 text-[10px] mt-0.5">{details.length}/500</p>
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Location <span className="text-gray-600 font-normal normal-case">(optional)</span></label>
            <div className="relative">
              <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={11} />
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} maxLength={100}
                placeholder="e.g. Near the canteen, Room 101..."
                className="w-full pl-9 pr-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 text-xs font-medium rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={isLoading} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5">
              {isLoading ? <><Spinner /> Submitting...</> : <><FaLightbulb size={10} /> Submit Tip</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Tips Viewer Modal ─────────────────────────────────────────────────────────
const TipsViewerModal = ({ post, isAdmin, onClose }: { post: BulletinPost; isAdmin: boolean; onClose: () => void }) => {
  const { data, isLoading } = useGetBulletinTipsQuery(post.id);
  const [deleteTip] = useDeleteBulletinTipMutation();
  const tips: BulletinTip[] = data?.data ?? [];

  const handleDelete = async (tipId: string) => {
    if (!confirm("Delete this tip?")) return;
    try { await deleteTip({ postId: post.id, tipId }).unwrap(); toast.success("Tip deleted."); }
    catch (err: any) { handleApiError(err, "Failed to delete tip."); }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"><FaEye size={11} className="text-blue-400" /></div>
            <div>
              <h3 className="text-sm font-bold text-white">Community Tips</h3>
              <p className="text-gray-500 text-[11px] truncate max-w-[200px]">{post.itemName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"><FaTimes size={12} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-10"><Spinner className="h-6 w-6 text-gray-500" /></div>
          ) : tips.length === 0 ? (
            <div className="text-center py-10">
              <FaLightbulb size={28} className="text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No tips yet.</p>
              <p className="text-gray-600 text-xs mt-1">Be the first to share a sighting.</p>
            </div>
          ) : tips.map(tip => (
            <div key={tip.id} className="bg-gray-800/60 border border-white/5 rounded-xl p-3.5 flex gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <FaLightbulb size={10} className="text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm leading-relaxed">{tip.details}</p>
                {tip.location && <p className="text-gray-500 text-xs mt-1 flex items-center gap-1"><FaMapMarkerAlt size={9} /> {tip.location}</p>}
                <p className="text-gray-600 text-[10px] mt-1">{timeAgo(tip.createdAt)}</p>
              </div>
              {isAdmin && (
                <button onClick={() => handleDelete(tip.id)}
                  className="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300 transition-colors shrink-0 self-start mt-0.5">
                  <FaTrash size={9} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BulletinBoard() {
  const user: any = useUserVerification();
  const isAdmin = user?.role === "ADMIN";

  const [searchTerm,      setSearchTerm]      = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page,            setPage]            = useState(1);
  const [viewMode,        setViewMode]        = useState<"grid" | "list">(
    typeof window !== "undefined" && window.innerWidth < 640 ? "list" : "grid"
  );
  const LIMIT = 12;

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const { data, isLoading, isFetching } = useGetBulletinPostsQuery({
    page, limit: LIMIT, searchTerm: debouncedSearch || undefined,
  });

  const [deletePost]  = useDeleteBulletinPostMutation();
  const [resolvePost] = useResolveBulletinPostMutation();

  const posts: BulletinPost[] = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, totalPage: 1 };

  const [showPostModal,  setShowPostModal]  = useState(false);
  const [tipTarget,      setTipTarget]      = useState<BulletinPost | null>(null);
  const [viewTipsTarget, setViewTipsTarget] = useState<BulletinPost | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    try { await deletePost(id).unwrap(); toast.success("Post deleted."); }
    catch (err: any) { handleApiError(err, "Failed to delete post."); }
  };

  const handleResolve = async (id: string) => {
    if (!confirm("Mark this post as resolved?")) return;
    try { await resolvePost(id).unwrap(); toast.success("Post marked as resolved."); }
    catch (err: any) { handleApiError(err, "Failed to resolve post."); }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <ToastContainer position="top-right" theme="dark" autoClose={3000} />

      {showPostModal  && <PostModal onClose={() => setShowPostModal(false)} />}
      {tipTarget      && <TipModal post={tipTarget} onClose={() => setTipTarget(null)} />}
      {viewTipsTarget && <TipsViewerModal post={viewTipsTarget} isAdmin={isAdmin} onClose={() => setViewTipsTarget(null)} />}

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-4">
                <FaLightbulb size={10} /> Community Bulletin Board
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Lost Something?</h1>
              <p className="text-gray-400 mt-2 text-sm max-w-md">Lost something on campus? Post your missing item details and let the student community help reunite you with your belongings.</p>
            </div>
            <button onClick={() => setShowPostModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-amber-900/30 shrink-0">
              <FaPlus size={12} /> Post Lost Item
            </button>
          </div>

        </div>
      </div>

      {/* Search + Filter bar — full width like Lost Items page */}
      <div className="max-w-6xl mx-auto px-4 py-5 border-b border-white/5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={13} />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by item name, description, or location..."
              className="w-full pl-11 pr-4 py-3 bg-gray-900 border border-white/5 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 transition-all" />
          </div>
          {/* View toggle */}
          <div className="flex gap-0.5 bg-gray-900 border border-white/5 rounded-xl p-1 shrink-0">
            <button onClick={() => setViewMode("grid")} title="Grid view"
              className={`p-2.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-gray-500 hover:text-white"}`}>
              <FaTh size={12} />
            </button>
            <button onClick={() => setViewMode("list")} title="List view"
              className={`p-2.5 rounded-lg transition-all ${viewMode === "list" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-gray-500 hover:text-white"}`}>
              <FaList size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-500 text-sm">
            {meta.total > 0 ? <>{meta.total} post{meta.total !== 1 ? "s" : ""} found</> : "No posts yet"}
          </p>
          {isFetching && !isLoading && <Spinner className="h-4 w-4 text-gray-500" />}
        </div>

        {isLoading ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-2"}>
            {Array.from({ length: 8 }).map((_, i) =>
              viewMode === "grid" ? (
                <div key={i} className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-40 bg-gray-800" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-800 rounded w-3/4" />
                    <div className="h-3 bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
              ) : (
                <div key={i} className="bg-gray-900 border border-white/5 rounded-xl h-20 animate-pulse" />
              )
            )}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <FaLightbulb size={24} className="text-amber-400" />
            </div>
            <h3 className="text-white font-bold text-lg mb-1">
              {debouncedSearch ? `No results for "${debouncedSearch}"` : "No posts yet"}
            </h3>
            <p className="text-gray-500 text-sm mb-5">
              {debouncedSearch ? "Try a different search term." : "Be the first to post a lost item."}
            </p>
            {!debouncedSearch && (
              <button onClick={() => setShowPostModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-xl transition-all">
                <FaPlus size={11} /> Post Lost Item
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          /* ── GRID VIEW ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {posts.map(post => (
              <div key={post.id} className={`bg-gray-900 border rounded-2xl overflow-hidden flex flex-col transition-all hover:border-white/15 ${post.isResolved ? "border-emerald-500/20 opacity-75" : "border-white/5"}`}>
                <div className="relative h-40 bg-gray-800 shrink-0">
                  {post.imageUrl ? (
                    <img src={post.imageUrl} alt={post.itemName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><FaImage size={28} className="text-gray-700" /></div>
                  )}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold">Community Post</span>
                    {post.isResolved && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                        <FaCheckCircle size={8} /> Resolved
                      </span>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      {!post.isResolved && (
                        <button onClick={() => handleResolve(post.id)} title="Mark Resolved"
                          className="w-6 h-6 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 flex items-center justify-center text-emerald-400 transition-colors">
                          <FaCheckCircle size={10} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(post.id)} title="Delete Post"
                        className="w-6 h-6 rounded-lg bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center text-red-400 transition-colors">
                        <FaTrash size={9} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1 gap-2">
                  <h3 className="text-white font-bold text-sm leading-tight line-clamp-1">{post.itemName}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{post.description}</p>
                  <div className="space-y-1 mt-auto pt-2">
                    <p className="text-gray-600 text-[11px] flex items-center gap-1.5">
                      <FaMapMarkerAlt size={9} className="text-gray-500 shrink-0" /><span className="truncate">{post.location}</span>
                    </p>
                    <p className="text-gray-600 text-[11px] flex items-center gap-1.5">
                      <FaCalendarAlt size={9} className="text-gray-500 shrink-0" />
                      {new Date(post.dateLost).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    {post.reporterName && (
                      <p className="text-gray-600 text-[11px] flex items-center gap-1.5">
                        <FaUser size={9} className="text-gray-500 shrink-0" /><span className="truncate">{post.reporterName}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1">
                    <button onClick={() => setViewTipsTarget(post)} className="flex items-center gap-1.5 text-gray-500 hover:text-blue-400 text-[11px] transition-colors">
                      <FaEye size={10} />{post._count?.tips ?? 0} tip{(post._count?.tips ?? 0) !== 1 ? "s" : ""}
                    </button>
                    <button disabled={post.isResolved} onClick={() => !post.isResolved && setTipTarget(post)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${post.isResolved ? "bg-gray-800 text-gray-600 cursor-not-allowed" : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/20"}`}>
                      <FaLightbulb size={9} /> I Saw This
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── LIST VIEW ── */
          <div className="space-y-2">
            {posts.map(post => (
              <div key={post.id} className={`group bg-gray-900 border rounded-xl transition-all hover:border-amber-500/20 ${post.isResolved ? "border-emerald-500/20 opacity-75" : "border-white/5"}`}>
                <div className="flex items-center gap-3 p-3">
                  {/* Thumbnail */}
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                    {post.imageUrl ? (
                      <img src={post.imageUrl} alt={post.itemName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><FaImage size={16} className="text-gray-600" /></div>
                    )}
                    {post.isResolved && (
                      <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                        <FaCheckCircle size={14} className="text-emerald-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-white text-sm font-semibold truncate group-hover:text-amber-400 transition-colors">{post.itemName}</p>
                      {post.isResolved && <span className="shrink-0 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold rounded-full border border-emerald-500/20">Resolved</span>}
                    </div>
                    <p className="text-gray-500 text-[10px] mt-0.5 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0"><FaMapMarkerAlt className="text-amber-400" size={7} /></span>
                      {post.location}
                    </p>
                    <p className="text-gray-500 text-[10px] mt-0.5 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0"><FaCalendarAlt className="text-amber-400" size={7} /></span>
                      {new Date(post.dateLost).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                      {post.reporterName && <> · <FaUser size={7} className="text-gray-600" /> {post.reporterName}</>}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button disabled={post.isResolved} onClick={() => !post.isResolved && setTipTarget(post)}
                      className={`px-2.5 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${post.isResolved ? "bg-gray-800 text-gray-600 cursor-not-allowed" : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/20"}`}>
                      I Saw This
                    </button>
                    <div className="flex gap-1">
                      <button onClick={() => setViewTipsTarget(post)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[10px] rounded-lg transition-all">
                        <FaEye size={8} /> {post._count?.tips ?? 0}
                      </button>
                      {isAdmin && (
                        <>
                          {!post.isResolved && (
                            <button onClick={() => handleResolve(post.id)} title="Mark Resolved"
                              className="px-2 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] rounded-lg transition-all">
                              <FaCheckCircle size={8} />
                            </button>
                          )}
                          <button onClick={() => handleDelete(post.id)} title="Delete Post"
                            className="px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] rounded-lg transition-all">
                            <FaTrash size={8} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta.totalPage > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-9 h-9 rounded-xl bg-gray-900 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              <FaChevronLeft size={12} />
            </button>
            {Array.from({ length: meta.totalPage }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-xl border text-xs font-bold transition-all ${p === page ? "bg-amber-600 border-amber-500 text-white" : "bg-gray-900 border-white/10 text-gray-400 hover:text-white hover:border-white/20"}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(meta.totalPage, p + 1))} disabled={page === meta.totalPage}
              className="w-9 h-9 rounded-xl bg-gray-900 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              <FaChevronRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}