import React, { useState, useRef, useEffect } from "react";
import {
  FaBullhorn, FaTicketAlt, FaCommentDots, FaBell,
  FaTimes, FaTrash, FaReply, FaCheck, FaCheckDouble,
  FaExclamationTriangle, FaInfoCircle, FaCheckCircle,
  FaFire, FaEnvelope, FaUser, FaPaperPlane, FaEye,
  FaSpinner, FaStar, FaRegStar,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { baseApi } from "../../redux/api/baseApi";

// ── RTK Query endpoints ────────────────────────────────────────────────────────
const commApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCommStats: builder.query({
      query: () => ({ url: "/admin/comm-hub/stats", method: "GET" }),
      providesTags: ["commHub"],
    }),
    getAnnouncements: builder.query({
      query: () => ({ url: "/admin/announcements", method: "GET" }),
      providesTags: ["commHub"],
    }),
    createAnnouncement: builder.mutation({
      query: (data: any) => ({ url: "/admin/announcements", method: "POST", body: data }),
      invalidatesTags: ["commHub"],
    }),
    deleteAnnouncement: builder.mutation({
      query: (id: string) => ({ url: `/admin/announcements/${id}`, method: "DELETE" }),
      invalidatesTags: ["commHub"],
    }),
    getTickets: builder.query({
      query: (status?: string) => ({ url: "/admin/tickets", method: "GET", params: status ? { status } : {} }),
      providesTags: ["commHub"],
    }),
    replyTicket: builder.mutation({
      query: ({ id, ...data }: any) => ({ url: `/admin/tickets/${id}/reply`, method: "PUT", body: data }),
      invalidatesTags: ["commHub"],
    }),
    updateTicketStatus: builder.mutation({
      query: ({ id, status }: any) => ({ url: `/admin/tickets/${id}/status`, method: "PUT", body: { status } }),
      invalidatesTags: ["commHub"],
    }),
    deleteTicket: builder.mutation({
      query: (id: string) => ({ url: `/admin/tickets/${id}`, method: "DELETE" }),
      invalidatesTags: ["commHub"],
    }),
    getFeedbacks: builder.query({
      query: (status?: string) => ({ url: "/admin/feedback", method: "GET", params: status ? { status } : {} }),
      providesTags: ["commHub"],
    }),
    updateFeedbackStatus: builder.mutation({
      query: ({ id, ...data }: any) => ({ url: `/admin/feedback/${id}/status`, method: "PUT", body: data }),
      invalidatesTags: ["commHub"],
    }),
    deleteFeedback: builder.mutation({
      query: (id: string) => ({ url: `/admin/feedback/${id}`, method: "DELETE" }),
      invalidatesTags: ["commHub"],
    }),
  }),
  overrideExisting: false,
});

const {
  useGetCommStatsQuery,
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useGetTicketsQuery,
  useReplyTicketMutation,
  useUpdateTicketStatusMutation,
  useDeleteTicketMutation,
  useGetFeedbacksQuery,
  useUpdateFeedbackStatusMutation,
  useDeleteFeedbackMutation,
} = commApi;

// ── Helpers ───────────────────────────────────────────────────────────────────
const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ── Dropdown data ─────────────────────────────────────────────────────────────
interface DropdownOption {
  value: string;
  icon: string;
  label: string;
  sub: string;
  bg: string;
  color: string;
}

const ANN_TYPES: DropdownOption[] = [
  { value: "INFO",    icon: "ℹ️",  label: "Info",    sub: "General information for users",   bg: "#ecfeff", color: "#164e63" },
  { value: "WARNING", icon: "⚠️",  label: "Warning", sub: "Important notice requiring attention", bg: "#fefce8", color: "#713f12" },
  { value: "SUCCESS", icon: "✅",  label: "Success", sub: "Positive update or achievement",  bg: "#f0fdf4", color: "#14532d" },
  { value: "URGENT",  icon: "🚨",  label: "Urgent",  sub: "Critical alert needing immediate action", bg: "#fff1f2", color: "#881337" },
];

const ANN_TARGETS: DropdownOption[] = [
  { value: "ALL",      icon: "👥", label: "All Users",     sub: "Broadcast to everyone",        bg: "#ede9fe", color: "#4c1d95" },
  { value: "STUDENTS", icon: "🎓", label: "Students Only", sub: "Target student accounts only", bg: "#eff6ff", color: "#1e3a5f" },
  { value: "ADMINS",   icon: "🛡️", label: "Admins Only",   sub: "Target admin accounts only",   bg: "#fef3c7", color: "#78350f" },
];

// ── Custom Dropdown ───────────────────────────────────────────────────────────
const CustomDropdown = ({
  options,
  value,
  onChange,
  accentColor = "cyan",
}: {
  options: DropdownOption[];
  value: string;
  onChange: (val: string) => void;
  accentColor?: "cyan" | "blue" | "violet";
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value) ?? options[0];

  const ring     = accentColor === "cyan"   ? "border-cyan-500/40"
                 : accentColor === "blue"   ? "border-blue-500/40"
                 : "border-violet-500/40";
  const activeBg = accentColor === "cyan"   ? "bg-cyan-500/10"
                 : accentColor === "blue"   ? "bg-blue-500/10"
                 : "bg-violet-500/10";
  const dotColor = accentColor === "cyan"   ? "bg-cyan-400"
                 : accentColor === "blue"   ? "bg-blue-400"
                 : "bg-violet-400";
  const textSel  = accentColor === "cyan"   ? "text-cyan-300"
                 : accentColor === "blue"   ? "text-blue-300"
                 : "text-violet-300";

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2.5 px-3 py-2.5 bg-gray-800 border rounded-xl cursor-pointer transition-colors ${
          open ? `${ring} border` : "border-white/10 hover:border-white/20"
        }`}
      >
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
          style={{ background: selected.bg }}
        >
          {selected.icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium leading-tight">{selected.label}</p>
          <p className="text-gray-500 text-[10px] mt-0.5">{selected.sub}</p>
        </div>
        <svg
          width="10" height="6" viewBox="0 0 10 6"
          className={`text-gray-500 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </div>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-gray-900 border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl shadow-black/40">
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors select-none
                  ${i < options.length - 1 ? "border-b border-white/[0.04]" : ""}
                  ${isSelected ? activeBg : "hover:bg-white/[0.04]"}`}
              >
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                  style={{ background: opt.bg }}
                >
                  {opt.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-tight ${isSelected ? textSel : "text-white"}`}>
                    {opt.label}
                  </p>
                  <p className="text-gray-500 text-[10px] mt-0.5">{opt.sub}</p>
                </div>
                {isSelected && (
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { id: "announcements", label: "Announcements",     icon: FaBullhorn   },
  { id: "tickets",       label: "Support Tickets",   icon: FaTicketAlt  },
  { id: "feedback",      label: "Feedback",          icon: FaCommentDots},
  { id: "notifications", label: "Notification Center", icon: FaBell     },
];

const TYPE_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  INFO:    { color: "text-cyan-400",    bg: "bg-cyan-400/10 border-cyan-400/20",      icon: <FaInfoCircle size={11} />,         label: "Info"    },
  WARNING: { color: "text-yellow-400",  bg: "bg-yellow-400/10 border-yellow-400/20",  icon: <FaExclamationTriangle size={11} />, label: "Warning" },
  SUCCESS: { color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20",icon: <FaCheckCircle size={11} />,        label: "Success" },
  URGENT:  { color: "text-red-400",     bg: "bg-red-400/10 border-red-400/20",        icon: <FaFire size={11} />,               label: "Urgent"  },
};

const PRIORITY_CONFIG: Record<string, { color: string; bg: string }> = {
  LOW:    { color: "text-gray-400",   bg: "bg-gray-400/10 border-gray-400/20"   },
  NORMAL: { color: "text-cyan-400",   bg: "bg-cyan-400/10 border-cyan-400/20"   },
  HIGH:   { color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20"},
  URGENT: { color: "text-red-400",    bg: "bg-red-400/10 border-red-400/20"     },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  OPEN:        { color: "text-yellow-400",  bg: "bg-yellow-400/10 border-yellow-400/20",  label: "Open"        },
  IN_PROGRESS: { color: "text-cyan-400",    bg: "bg-cyan-400/10 border-cyan-400/20",      label: "In Progress" },
  RESOLVED:    { color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20",label: "Resolved"    },
  CLOSED:      { color: "text-gray-500",    bg: "bg-gray-500/10 border-gray-500/20",      label: "Closed"      },
};

const FEEDBACK_STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  UNREAD:   { color: "text-red-400",     bg: "bg-red-400/10 border-red-400/20",       label: "Unread"   },
  READ:     { color: "text-yellow-400",  bg: "bg-yellow-400/10 border-yellow-400/20", label: "Read"     },
  RESOLVED: { color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20",label: "Resolved"},
};

const CATEGORY_CONFIG: Record<string, { color: string; label: string }> = {
  GENERAL:    { color: "text-gray-400",    label: "General"         },
  BUG:        { color: "text-red-400",     label: "Bug"             },
  FEATURE:    { color: "text-violet-400",  label: "Feature Request" },
  COMPLAINT:  { color: "text-orange-400",  label: "Complaint"       },
  COMPLIMENT: { color: "text-emerald-400", label: "Compliment"      },
};

// ── Modal wrapper ─────────────────────────────────────────────────────────────
const Modal = ({ onClose, children, wide = false }: { onClose: () => void; children: React.ReactNode; wide?: boolean }) => (
  <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className={`bg-gray-900 border border-white/10 rounded-2xl w-full shadow-2xl max-h-[90vh] flex flex-col ${wide ? "max-w-2xl" : "max-w-lg"}`}
      style={{ borderTop: "2px solid #22d3ee" }}>
      {children}
    </div>
  </div>
);

const ModalHeader = ({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) => (
  <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
    <div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      {subtitle && <p className="text-gray-500 text-[11px] mt-0.5">{subtitle}</p>}
    </div>
    <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
      <FaTimes size={12} />
    </button>
  </div>
);

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, bg, icon }: any) => (
  <div className={`rounded-2xl border p-4 bg-gray-900 flex items-center gap-3 ${bg}`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>{icon}</div>
    <div>
      <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
      <p className="text-gray-500 text-xs font-medium">{label}</p>
    </div>
  </div>
);

// ── Field label ───────────────────────────────────────────────────────────────
const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{children}</label>
);

// ════════════════════════════════════════════════════════════════════════════════
// TAB: ANNOUNCEMENTS
// ════════════════════════════════════════════════════════════════════════════════
const AnnouncementsTab = () => {
  const { data: annData, isLoading } = useGetAnnouncementsQuery(undefined);
  const [createAnnouncement, { isLoading: isSending }] = useCreateAnnouncementMutation();
  const [deleteAnnouncement] = useDeleteAnnouncementMutation();
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "INFO", target: "ALL", sendEmail: false });

  const announcements: any[] = annData?.data || [];

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.message.trim()) { toast.error("Title and message are required"); return; }
    try {
      const res: any = await createAnnouncement(form);
      if (res?.data?.success) {
        toast.success(res.data.message || "Announcement sent!");
        setShowCompose(false);
        setForm({ title: "", message: "", type: "INFO", target: "ALL", sendEmail: false });
      } else { toast.error("Failed to send announcement"); }
    } catch { toast.error("Something went wrong"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    await deleteAnnouncement(id);
    toast.success("Deleted");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-xs">{announcements.length} announcement{announcements.length !== 1 ? "s" : ""} total</p>
        <button onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl transition-all">
          <FaBullhorn size={10} /> New Announcement
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-gray-800/60 rounded-2xl animate-pulse" />)}</div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600">
          <FaBullhorn size={28} className="mb-3 opacity-30" />
          <p className="text-sm">No announcements yet</p>
          <p className="text-xs mt-1 opacity-60">Create one to notify users</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a: any) => {
            const tc = TYPE_CONFIG[a.type] || TYPE_CONFIG.INFO;
            return (
              <div key={a.id} className="bg-gray-900 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${tc.bg} ${tc.color}`}>
                      {tc.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white text-sm font-semibold">{a.title}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tc.bg} ${tc.color}`}>{tc.label}</span>
                        <span className="text-[10px] text-gray-600 border border-white/5 px-2 py-0.5 rounded-full">{a.target}</span>
                      </div>
                      <p className="text-gray-400 text-xs mt-1 line-clamp-2 leading-relaxed">{a.message}</p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-600">
                        <span>By {a.sentByName}</span>
                        <span>·</span>
                        <span>{timeAgo(a.createdAt)}</span>
                        {a.emailSent && <><span>·</span><span className="text-cyan-600 flex items-center gap-1"><FaEnvelope size={8} /> {a.emailCount} emails sent</span></>}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(a.id)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/10 text-gray-600 hover:text-red-400 flex items-center justify-center transition-all shrink-0">
                    <FaTrash size={10} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <Modal onClose={() => setShowCompose(false)} wide>
          <ModalHeader title="New Announcement" subtitle="Broadcast a message to users" onClose={() => setShowCompose(false)} />
          <div className="p-5 overflow-y-auto space-y-4" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.2) rgba(255,255,255,0.05)" }}>
            <div className="space-y-1.5">
              <FieldLabel>Title <span className="text-red-400">*</span></FieldLabel>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder=" "
                className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30" />
            </div>

             {/* ── Custom dropdowns ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel>Type</FieldLabel>
                <CustomDropdown
                  options={ANN_TYPES}
                  value={form.type}
                  onChange={val => setForm(f => ({ ...f, type: val }))}
                  accentColor="cyan"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Target Audience</FieldLabel>
                <CustomDropdown
                  options={ANN_TARGETS}
                  value={form.target}
                  onChange={val => setForm(f => ({ ...f, target: val }))}
                  accentColor="violet"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <FieldLabel>Message <span className="text-red-400">*</span></FieldLabel>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                rows={5} placeholder=" "
                className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/30" />
            </div>

           

            <label className="flex items-center gap-3 p-3 bg-gray-800/60 border border-white/5 rounded-xl cursor-pointer hover:border-cyan-500/20 transition-all">
              <div className={`w-10 h-5 rounded-full transition-all relative ${form.sendEmail ? "bg-cyan-500" : "bg-gray-700"}`}
                onClick={() => setForm(f => ({ ...f, sendEmail: !f.sendEmail }))}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.sendEmail ? "left-5" : "left-0.5"}`} />
              </div>
              <div>
                <p className="text-white text-xs font-semibold">Send as Email</p>
                <p className="text-gray-500 text-[10px]">Deliver this announcement via email to target users</p>
              </div>
            </label>
          </div>
          <div className="px-5 py-4 border-t border-white/5 flex gap-3 shrink-0">
            <button onClick={() => setShowCompose(false)} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-300 rounded-xl text-sm font-medium transition-colors">Cancel</button>
            <button onClick={handleSubmit} disabled={isSending}
              className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              {isSending ? <><FaSpinner className="animate-spin" size={12} /> Sending…</> : <><FaPaperPlane size={10} /> {form.sendEmail ? "Send Announcement" : "Post Announcement"}</>}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// TAB: SUPPORT TICKETS
// ════════════════════════════════════════════════════════════════════════════════
const SupportTicketsTab = () => {
  const [statusFilter, setStatusFilter] = useState("");
  const { data: ticketsData, isLoading } = useGetTicketsQuery(statusFilter || undefined);
  const [replyTicket, { isLoading: isReplying }] = useReplyTicketMutation();
  const [updateStatus] = useUpdateTicketStatusMutation();
  const [deleteTicket] = useDeleteTicketMutation();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState("RESOLVED");

  const tickets: any[] = ticketsData?.data || [];

  const handleReply = async () => {
    if (!replyText.trim()) { toast.error("Reply message is required"); return; }
    try {
      const res: any = await replyTicket({ id: selectedTicket.id, adminReply: replyText, status: replyStatus });
      if (res?.data?.success) {
        toast.success("Reply sent!");
        setSelectedTicket(null);
        setReplyText("");
      } else { toast.error("Failed to send reply"); }
    } catch { toast.error("Something went wrong"); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateStatus({ id, status });
    toast.success("Status updated");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ticket?")) return;
    await deleteTicket(id);
    toast.success("Deleted");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-gray-500 text-xs">{tickets.length} ticket{tickets.length !== 1 ? "s" : ""}</p>
        <div className="flex gap-1 bg-gray-900 border border-white/5 rounded-xl p-1">
          {["", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? "bg-cyan-500/10 text-cyan-400" : "text-gray-500 hover:text-white"}`}>
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-gray-800/60 rounded-2xl animate-pulse" />)}</div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600">
          <FaTicketAlt size={28} className="mb-3 opacity-30" />
          <p className="text-sm">No tickets {statusFilter ? `with status "${statusFilter}"` : "yet"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t: any) => {
            const sc = STATUS_CONFIG[t.status] || STATUS_CONFIG.OPEN;
            const pc = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.NORMAL;
            return (
              <div key={t.id} className="bg-gray-900 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-white text-sm font-semibold truncate">{t.subject}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color}`}>{sc.label}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pc.bg} ${pc.color}`}>{t.priority}</span>
                    </div>
                    <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed mb-2">{t.message}</p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-600 flex-wrap">
                      {t.senderName && <span className="flex items-center gap-1"><FaUser size={8} /> {t.senderName}</span>}
                      {t.senderEmail && <span className="flex items-center gap-1"><FaEnvelope size={8} /> {t.senderEmail}</span>}
                      <span>{timeAgo(t.createdAt)}</span>
                    </div>
                    {t.adminReply && (
                      <div className="mt-3 p-3 bg-cyan-500/5 border border-cyan-500/15 rounded-xl">
                        <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1">Admin Reply · {t.repliedBy}</p>
                        <p className="text-gray-300 text-xs leading-relaxed">{t.adminReply}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {t.status === "OPEN" && (
                      <button onClick={() => handleStatusChange(t.id, "IN_PROGRESS")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[10px] font-bold rounded-lg transition-all">
                        <FaEye size={8} /> View
                      </button>
                    )}
                    {(t.status === "OPEN" || t.status === "IN_PROGRESS") && (
                      <button onClick={() => { setSelectedTicket(t); setReplyText(""); setReplyStatus("RESOLVED"); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded-lg transition-all">
                        <FaReply size={8} /> Reply
                      </button>
                    )}
                    <button onClick={() => handleDelete(t.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-bold rounded-lg transition-all">
                      <FaTrash size={8} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTicket && (
        <Modal onClose={() => setSelectedTicket(null)} wide>
          <ModalHeader title="Reply to Ticket" subtitle={selectedTicket.subject} onClose={() => setSelectedTicket(null)} />
          <div className="p-5 overflow-y-auto space-y-4" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.2) rgba(255,255,255,0.05)" }}>
            <div className="p-3 bg-gray-800/60 border border-white/5 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <FaUser size={8} /> {selectedTicket.senderName || "Anonymous"}
                {selectedTicket.senderEmail && <><span>·</span><FaEnvelope size={8} /> {selectedTicket.senderEmail}</>}
              </div>
              <p className="text-gray-300 text-xs leading-relaxed">{selectedTicket.message}</p>
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Your Reply <span className="text-red-400">*</span></FieldLabel>
              <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                rows={5} placeholder="Write your response..."
                className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/30" />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Set Status After Reply</FieldLabel>
              <select value={replyStatus} onChange={e => setReplyStatus(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30">
                <option value="RESOLVED">Resolved</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            {selectedTicket.senderEmail && (
              <div className="flex items-center gap-2 p-3 bg-cyan-500/5 border border-cyan-500/15 rounded-xl">
                <FaEnvelope size={10} className="text-cyan-400 shrink-0" />
                <p className="text-cyan-300/70 text-xs">Reply will be emailed to <strong className="text-cyan-300">{selectedTicket.senderEmail}</strong></p>
              </div>
            )}
          </div>
          <div className="px-5 py-4 border-t border-white/5 flex gap-3 shrink-0">
            <button onClick={() => setSelectedTicket(null)} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-300 rounded-xl text-sm font-medium transition-colors">Cancel</button>
            <button onClick={handleReply} disabled={isReplying}
              className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              {isReplying ? <><FaSpinner className="animate-spin" size={12} /> Sending…</> : <><FaPaperPlane size={10} /> Send Reply</>}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// TAB: FEEDBACK
// ════════════════════════════════════════════════════════════════════════════════
const FeedbackTab = () => {
  const [statusFilter, setStatusFilter] = useState("");
  const { data: fbData, isLoading } = useGetFeedbacksQuery(statusFilter || undefined);
  const [updateFeedbackStatus] = useUpdateFeedbackStatusMutation();
  const [deleteFeedback] = useDeleteFeedbackMutation();
  const [selectedFb, setSelectedFb] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");

  const feedbacks: any[] = fbData?.data || [];

  const handleResolve = async (id: string, note?: string) => {
    await updateFeedbackStatus({ id, status: "RESOLVED", ...(note ? { adminNote: note } : {}) });
    toast.success("Marked as resolved");
    setSelectedFb(null);
    setAdminNote("");
  };

  const handleMarkRead = async (id: string) => {
    await updateFeedbackStatus({ id, status: "READ" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this feedback?")) return;
    await deleteFeedback(id);
    toast.success("Deleted");
  };

  const StarRating = ({ rating }: { rating: number | null }) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) =>
          i < rating
            ? <FaStar key={i} size={10} className="text-yellow-400" />
            : <FaRegStar key={i} size={10} className="text-gray-700" />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-gray-500 text-xs">{feedbacks.length} feedback{feedbacks.length !== 1 ? "s" : ""}</p>
        <div className="flex gap-1 bg-gray-900 border border-white/5 rounded-xl p-1">
          {["", "UNREAD", "READ", "RESOLVED"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? "bg-cyan-500/10 text-cyan-400" : "text-gray-500 hover:text-white"}`}>
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-gray-800/60 rounded-2xl animate-pulse" />)}</div>
      ) : feedbacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600">
          <FaCommentDots size={28} className="mb-3 opacity-30" />
          <p className="text-sm">No feedback yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((f: any) => {
            const fsc = FEEDBACK_STATUS_CONFIG[f.status] || FEEDBACK_STATUS_CONFIG.UNREAD;
            const cc  = CATEGORY_CONFIG[f.category] || CATEGORY_CONFIG.GENERAL;
            return (
              <div key={f.id} className={`bg-gray-900 border rounded-2xl p-4 transition-all hover:border-white/10 ${f.status === "UNREAD" ? "border-cyan-500/20" : "border-white/5"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${fsc.bg} ${fsc.color}`}>{fsc.label}</span>
                      <span className={`text-[10px] font-semibold ${cc.color}`}>{cc.label}</span>
                      <StarRating rating={f.rating} />
                      {f.status === "UNREAD" && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed mb-2 line-clamp-3">{f.message}</p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-600 flex-wrap">
                      <span className="flex items-center gap-1"><FaUser size={8} /> {f.senderName || "Anonymous"}</span>
                      {f.senderEmail && <span className="flex items-center gap-1"><FaEnvelope size={8} /> {f.senderEmail}</span>}
                      <span>{timeAgo(f.createdAt)}</span>
                    </div>
                    {f.adminNote && (
                      <div className="mt-2 p-2.5 bg-emerald-500/5 border border-emerald-500/15 rounded-lg">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-0.5">Admin Note</p>
                        <p className="text-gray-400 text-xs">{f.adminNote}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {f.status === "UNREAD" && (
                      <button onClick={() => handleMarkRead(f.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[10px] font-bold rounded-lg transition-all">
                        <FaEye size={8} /> Read
                      </button>
                    )}
                    {f.status !== "RESOLVED" && (
                      <button onClick={() => { setSelectedFb(f); setAdminNote(f.adminNote || ""); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded-lg transition-all">
                        <FaCheck size={8} /> Resolve
                      </button>
                    )}
                    <button onClick={() => handleDelete(f.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-bold rounded-lg transition-all">
                      <FaTrash size={8} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedFb && (
        <Modal onClose={() => setSelectedFb(null)}>
          <ModalHeader title="Resolve Feedback" subtitle="Add an optional note before resolving" onClose={() => setSelectedFb(null)} />
          <div className="p-5 space-y-4">
            <div className="p-3 bg-gray-800/60 border border-white/5 rounded-xl">
              <p className="text-gray-300 text-xs leading-relaxed">{selectedFb.message}</p>
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Admin Note (optional)</FieldLabel>
              <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
                rows={3} placeholder="Internal note about this feedback..."
                className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/30" />
            </div>
          </div>
          <div className="px-5 py-4 border-t border-white/5 flex gap-3 shrink-0">
            <button onClick={() => setSelectedFb(null)} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-300 rounded-xl text-sm font-medium transition-colors">Cancel</button>
            <button onClick={() => handleResolve(selectedFb.id, adminNote)}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              <FaCheckDouble size={10} /> Mark Resolved
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// TAB: NOTIFICATION CENTER
// ════════════════════════════════════════════════════════════════════════════════
const NotificationCenterTab = () => {
  const [createAnnouncement, { isLoading: isBroadcasting }] = useCreateAnnouncementMutation();
  const [form, setForm] = useState({ title: "", message: "", type: "INFO", target: "ALL" });
  const [sent, setSent] = useState(false);
  const [lastResult, setLastResult] = useState<{ count: number; target: string } | null>(null);

  const handleBroadcast = async () => {
    if (!form.title.trim() || !form.message.trim()) { toast.error("Title and message are required"); return; }
    try {
      const res: any = await createAnnouncement({ ...form, sendEmail: true });
      if (res?.data?.success) {
        setLastResult({ count: res.data.data?.emailCount || 0, target: form.target });
        setSent(true);
        setForm({ title: "", message: "", type: "INFO", target: "ALL" });
        toast.success(res.data.message);
      } else { toast.error("Broadcast failed"); }
    } catch { toast.error("Something went wrong"); }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-white text-sm font-semibold">Broadcast Message</h3>
          <p className="text-gray-500 text-xs mt-0.5">Send a system-wide email notification to users</p>
        </div>

        {sent && lastResult ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
              <FaCheckCircle size={24} className="text-emerald-400" />
            </div>
            <p className="text-white font-semibold">Broadcast Sent!</p>
            <p className="text-gray-400 text-sm mt-1">Delivered to <span className="text-emerald-400 font-bold">{lastResult.count}</span> {lastResult.target === "ALL" ? "users" : lastResult.target.toLowerCase()}</p>
            <button onClick={() => setSent(false)} className="mt-4 px-5 py-2 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-300 text-xs font-medium rounded-xl transition-colors">
              Send Another
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <FieldLabel>Subject / Title <span className="text-red-400">*</span></FieldLabel>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder=" "
                className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30" />
            </div>

            {/* ── Custom dropdowns ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel>Type</FieldLabel>
                <CustomDropdown
                  options={ANN_TYPES}
                  value={form.type}
                  onChange={val => setForm(f => ({ ...f, type: val }))}
                  accentColor="cyan"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Recipients</FieldLabel>
                <CustomDropdown
                  options={ANN_TARGETS}
                  value={form.target}
                  onChange={val => setForm(f => ({ ...f, target: val }))}
                  accentColor="violet"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Message <span className="text-red-400">*</span></FieldLabel>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                rows={6} placeholder=" "
                className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/30" />
            </div>

            <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl flex items-start gap-2">
              <FaExclamationTriangle size={10} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="text-blue-300/70 text-xs leading-relaxed">
                This will send an email to <strong className="text-blue-300">
                  {form.target === "ALL" ? "all active users" : form.target.toLowerCase()}
                </strong>. Make sure the message is accurate before broadcasting.
              </p>
            </div>
            <button onClick={handleBroadcast} disabled={isBroadcasting}
              className="w-full py-3 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              {isBroadcasting ? <><FaSpinner className="animate-spin" size={12} /> Broadcasting…</> : <><FaBell size={11} /> Broadcast Now</>}
            </button>
          </div>
        )}
      </div>

      {/* Quick tips */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-5">
        <h4 className="text-white text-xs font-semibold mb-3">Notification Guidelines</h4>
        <div className="space-y-2.5">
          {[
            { icon: <FaInfoCircle size={10} className="text-cyan-400" />,         text: "Use Info type for general announcements like office hours changes" },
            { icon: <FaExclamationTriangle size={10} className="text-yellow-400"/>,text: "Use Warning for important notices that require user action" },
            { icon: <FaFire size={10} className="text-red-400" />,                text: "Reserve Urgent for critical alerts like system outages or security issues" },
            { icon: <FaCheckCircle size={10} className="text-emerald-400" />,     text: "Use Success to celebrate milestones or confirm resolved issues" },
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="shrink-0 mt-0.5">{tip.icon}</div>
              <p className="text-gray-500 text-xs leading-relaxed">{tip.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// MAIN: CommunicationHub
// ════════════════════════════════════════════════════════════════════════════════
const CommunicationHub = () => {
  const [activeTab, setActiveTab] = useState("announcements");
  const { data: statsData } = useGetCommStatsQuery(undefined);
  const stats = statsData?.data;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Open Tickets"    value={stats?.openTickets}         color="text-yellow-400"  bg="bg-yellow-400/10 border-yellow-400/20"  icon={<FaTicketAlt  size={14} className="text-yellow-400"  />} />
        <StatCard label="Urgent Tickets"  value={stats?.urgentTickets}       color="text-red-400"     bg="bg-red-400/10 border-red-400/20"        icon={<FaFire       size={14} className="text-red-400"     />} />
        <StatCard label="Unread Feedback" value={stats?.unresolvedFeedback}  color="text-violet-400"  bg="bg-violet-400/10 border-violet-400/20"  icon={<FaCommentDots size={14} className="text-violet-400" />} />
        <StatCard label="Announcements"   value={stats?.totalAnnouncements}  color="text-cyan-400"    bg="bg-cyan-400/10 border-cyan-400/20"      icon={<FaBullhorn   size={14} className="text-cyan-400"    />} />
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 bg-gray-900 border border-white/5 rounded-2xl p-1 gap-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors w-full focus:outline-none select-none
                ${active ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-gray-500 hover:text-white hover:bg-white/5"}`}>
              <Icon size={11} className={active ? "text-cyan-400" : "text-gray-600"} />
              <span className="truncate hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "announcements"  && <AnnouncementsTab />}
      {activeTab === "tickets"        && <SupportTicketsTab />}
      {activeTab === "feedback"       && <FeedbackTab />}
      {activeTab === "notifications"  && <NotificationCenterTab />}

      <ToastContainer position="top-right" autoClose={3000} theme="dark"
        toastClassName="!bg-gray-800 !border !border-white/10 !rounded-xl !text-sm !text-white shadow-2xl" />
    </div>
  );
};

export default CommunicationHub;