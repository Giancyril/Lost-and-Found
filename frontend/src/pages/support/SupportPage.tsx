import { useState, useRef, useEffect } from "react";
import { BiSupport } from "react-icons/bi";
import {
  FaTicketAlt, FaCommentDots, FaEnvelope, FaUser,
  FaPaperPlane, FaCheckCircle, FaSpinner, FaStar, FaRegStar,
  FaChevronDown, FaChevronUp,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const postJSON = async (url: string, data: any) => {
  const res = await fetch(`${API_BASE}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

// ── Dropdown data ─────────────────────────────────────────────────────────────
const PRIORITIES = [
  { value: "LOW", icon: "🌱", label: "Low", sub: "General question", bg: "#dcfce7", color: "#166534" },
  { value: "NORMAL", icon: "⚡", label: "Normal", sub: "Issue affecting my use", bg: "#fef3c7", color: "#92400e" },
  { value: "HIGH", icon: "🔥", label: "High", sub: "Urgent issue", bg: "#fee2e2", color: "#991b1b" },
  { value: "URGENT", icon: "🚨", label: "Urgent", sub: "Critical problem", bg: "#fce7f3", color: "#9d174d" },
];

const CATEGORIES = [
  { value: "GENERAL", icon: "💬", label: "General Feedback", sub: "General comments or questions", bg: "#ede9fe", color: "#5b21b6" },
  { value: "BUG", icon: "🐛", label: "Bug Report", sub: "Something is broken or not working", bg: "#fee2e2", color: "#991b1b" },
  { value: "FEATURE", icon: "✨", label: "Feature Request", sub: "Suggest a new feature", bg: "#ede9fe", color: "#5b21b6" },
  { value: "COMPLAINT", icon: "⚠️", label: "Complaint", sub: "Report a negative experience", bg: "#fef3c7", color: "#92400e" },
  { value: "COMPLIMENT", icon: "🌟", label: "Compliment", sub: "Share positive feedback", bg: "#dcfce7", color: "#166534" },
];

// ── Custom Dropdown ───────────────────────────────────────────────────────────
interface DropdownOption {
  value: string;
  icon: string;
  label: string;
  sub: string;
  bg: string;
  color: string;
}

const CustomDropdown = ({
  options,
  value,
  onChange,
  accentColor = "blue",
}: {
  options: DropdownOption[];
  value: string;
  onChange: (val: string) => void;
  accentColor?: "blue" | "cyan";
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value) ?? options[0];

  const ring = accentColor === "cyan" ? "border-cyan-500/40" : "border-blue-500/40";
  const activeBg = accentColor === "cyan" ? "bg-cyan-500/10" : "bg-blue-500/10";
  const dotColor = accentColor === "cyan" ? "bg-cyan-400" : "bg-blue-400";
  const textSel = accentColor === "cyan" ? "text-cyan-300" : "text-blue-300";

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2.5 px-3 py-2.5 bg-gray-800 border rounded-xl cursor-pointer transition-colors ${open ? ring + " border" : "border-white/10 hover:border-white/20"
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

      {/* Menu */}
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

// ── Star Rating ───────────────────────────────────────────────────────────────
const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="flex items-center gap-1">
    {Array.from({ length: 5 }).map((_, i) => (
      <button key={i} type="button" onClick={() => onChange(i + 1)}
        className="transition-transform hover:scale-110 focus:outline-none">
        {i < value
          ? <FaStar size={20} className="text-yellow-400" />
          : <FaRegStar size={20} className="text-gray-600 hover:text-yellow-400 transition-colors" />}
      </button>
    ))}
    {value > 0 && (
      <span className="text-gray-500 text-xs ml-2">
        {["", "Poor", "Fair", "Good", "Great", "Excellent"][value]}
      </span>
    )}
  </div>
);

// ── FAQ data ──────────────────────────────────────────────────────────────────
const FAQS = [
  { q: "How do I report a lost item?", a: "Go to the Lost Items page and click 'Report Lost Item'. Fill in the details including item description, location it was lost, and date. You'll receive a confirmation email." },
  { q: "How do I claim a found item?", a: "Browse the Found Items page, find your item, and click 'Claim'. You'll need to provide proof of ownership. The SAS office will verify and contact you." },
  { q: "How long does the claiming process take?", a: "Typically 1–3 business days. The SAS office reviews claims during office hours (Monday–Friday, 8AM–5PM)." },
  { q: "What happens if my lost item isn't found?", a: "Your report stays active in the system. If a matching item is found later, you'll receive an automatic email notification." },
  { q: "Can I report anonymously?", a: "You can report found items without logging in. However, for lost item reports and claims, an NBSC email is required for verification." },
  { q: "How do I check the status of my claim?", a: "Log in to your student account and go to the Claims section in your dashboard to see the current status." },
];

// ════════════════════════════════════════════════════════════════════════════════
// SUPPORT PAGE
// ════════════════════════════════════════════════════════════════════════════════
const SupportPage = () => {
  const [activeTab, setActiveTab] = useState<"ticket" | "feedback">("ticket");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Ticket form
  const [ticket, setTicket] = useState({
    subject: "", message: "", senderName: "", senderEmail: "", priority: "NORMAL",
  });
  const [ticketSent, setTicketSent] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);

  // Feedback form
  const [feedback, setFeedback] = useState({
    senderName: "", senderEmail: "", category: "GENERAL", message: "", rating: 0,
  });
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket.subject.trim() || !ticket.message.trim()) { toast.error("Subject and message are required"); return; }
    setTicketLoading(true);
    try {
      const res = await postJSON("/tickets", ticket);
      if (res?.success) { setTicketSent(true); toast.success("Ticket submitted! We'll get back to you soon."); }
      else { toast.error(res?.message || "Failed to submit ticket"); }
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setTicketLoading(false); }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.message.trim()) { toast.error("Please write your feedback"); return; }
    setFeedbackLoading(true);
    try {
      const res = await postJSON("/feedback", feedback);
      if (res?.success) { setFeedbackSent(true); toast.success("Feedback received! Thank you."); }
      else { toast.error(res?.message || "Failed to submit feedback"); }
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setFeedbackLoading(false); }
  };

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();
      const minute = now.getMinutes();

      if (day === 0 || day === 6) {
        setIsOpen(false);
        return;
      }

      const totalMinutes = hour * 60 + minute;
      const startMinutes = 7 * 60 + 30; // 7:30 AM
      const endMinutes = 18 * 60; // 6:00 PM

      setIsOpen(totalMinutes >= startMinutes && totalMinutes < endMinutes);
    };

    checkStatus();
    const timer = setInterval(checkStatus, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up   { animation: fadeSlideUp 0.5s ease both; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.10s; }
        .fade-up-3 { animation-delay: 0.15s; }
        .fade-up-4 { animation-delay: 0.20s; }
      `}</style>

      <div className="min-h-screen bg-gray-950 pb-20">

        {/* ── Ambient bg ── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[480px] h-[480px] bg-blue-600/6 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: `linear-gradient(rgba(99,179,237,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,0.4) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }} />
        </div>

        <div className="relative z-10 px-4 sm:px-6 lg:px-16 mx-auto max-w-5xl pt-16 sm:pt-20">

          {/* ── Header ── */}
          <div className="fade-up fade-up-1 text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-blue-300 text-[11px] font-bold uppercase tracking-widest">Help Center</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-[1.1] tracking-tight mb-4">
              How can we
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                help you?
              </span>
            </h1>
            <p className="text-gray-400 text-base max-w-lg mx-auto leading-relaxed">
              Submit a support ticket, send us feedback, or browse our FAQ. The SAS office is available Monday–Friday, 7:30AM–6:00PM.
            </p>
          </div>

          {/* ── Quick info cards ── */}
          <div className="fade-up fade-up-2 grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
            {[
              { icon: <BiSupport size={18} className="text-blue-400" />, label: "Office Hours", value: "Mon–Fri, 7:30AM–6:00PM", bg: "bg-blue-500/10 border-blue-500/20" },
              { icon: <FaEnvelope size={14} className="text-blue-400" />, label: "Email Support", value: "sas@nbsc.edu.ph", bg: "bg-blue-500/10 border-blue-500/20" },
              { icon: <FaTicketAlt size={14} className="text-blue-400" />, label: "Response Time", value: "1–3 business days", bg: "bg-blue-500/10 border-blue-500/20" },
            ].map((c, i) => (
              <div key={i} className={`flex items-center gap-3 p-4 rounded-2xl border bg-gray-900 ${c.bg}`}>
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${c.bg}`}>{c.icon}</div>
                <div>
                  <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-widest">{c.label}</p>
                  <p className="text-white text-sm font-semibold">{c.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="fade-up fade-up-3 grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* ── Left: Forms ── */}
            <div className="lg:col-span-3 space-y-4">

              {/* Tab switcher */}
              <div className="flex bg-gray-900 border border-white/5 rounded-2xl p-1 gap-1">
                {([
                  { id: "ticket", label: "Support Ticket", icon: <FaTicketAlt size={11} /> },
                  { id: "feedback", label: "Send Feedback", icon: <FaCommentDots size={11} /> },
                ] as const).map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors focus:outline-none select-none
                      ${activeTab === tab.id
                        ? "bg-blue-600 text-white"
                        : "text-gray-500 hover:text-white hover:bg-white/5"}`}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* ── Support Ticket Form ── */}
              {activeTab === "ticket" && (
                <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden" style={{ borderTop: "2px solid #3b82f6" }}>
                  <div className="px-5 py-4 border-b border-white/5">
                    <h2 className="text-white text-sm font-bold">Submit a Support Ticket</h2>
                    <p className="text-gray-500 text-xs mt-0.5">Describe your issue and we'll get back to you via email</p>
                  </div>

                  {ticketSent ? (
                    <div className="p-10 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                        <FaCheckCircle size={24} className="text-blue-400" />
                      </div>
                      <p className="text-white font-bold text-lg">Ticket Submitted!</p>
                      <p className="text-gray-400 text-sm mt-2 leading-relaxed max-w-xs mx-auto">
                        We've received your request. Expect a reply within 1–3 business days to your email.
                      </p>
                      <button onClick={() => { setTicketSent(false); setTicket({ subject: "", message: "", senderName: "", senderEmail: "", priority: "NORMAL" }); }}
                        className="mt-5 px-5 py-2 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-300 text-xs font-medium rounded-xl transition-colors">
                        Submit Another
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleTicketSubmit} className="p-5 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Name</label>
                          <div className="relative">
                            <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={11} />
                            <input value={ticket.senderName} onChange={e => setTicket(t => ({ ...t, senderName: e.target.value }))}
                              placeholder=" " type="text"
                              className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">School Email</label>
                          <div className="relative">
                            <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={11} />
                            <input value={ticket.senderEmail} onChange={e => setTicket(t => ({ ...t, senderEmail: e.target.value }))}
                              placeholder=" " type="email"
                              className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subject <span className="text-red-400">*</span></label>
                        <input value={ticket.subject} onChange={e => setTicket(t => ({ ...t, subject: e.target.value }))}
                          placeholder=" " type="text" required
                          className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                      </div>

                      {/* ── Custom Priority Dropdown ── */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority</label>
                        <CustomDropdown
                          options={PRIORITIES}
                          value={ticket.priority}
                          onChange={val => setTicket(t => ({ ...t, priority: val }))}
                          accentColor="blue"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Message <span className="text-red-400">*</span></label>
                        <textarea value={ticket.message} onChange={e => setTicket(t => ({ ...t, message: e.target.value }))}
                          rows={5} required placeholder=" "
                          className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                      </div>

                      <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl">
                        <p className="text-blue-300/70 text-xs leading-relaxed text-justify">
                          Provide your school email so we can reply. Tickets are reviewed during office hours.
                        </p>
                      </div>

                      <button type="submit" disabled={ticketLoading}
                        className="w-full py-3 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-900/40">
                        {ticketLoading
                          ? <><FaSpinner className="animate-spin" size={12} /> Submitting…</>
                          : <><FaPaperPlane size={11} /> Submit Ticket</>}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* ── Feedback Form ── */}
              {activeTab === "feedback" && (
                <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden" style={{ borderTop: "2px solid #22d3ee" }}>
                  <div className="px-5 py-4 border-b border-white/5">
                    <h2 className="text-white text-sm font-bold">Send Feedback</h2>
                    <p className="text-gray-500 text-xs mt-0.5">Help us improve — bug reports, suggestions, or compliments</p>
                  </div>

                  {feedbackSent ? (
                    <div className="p-10 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                        <FaCheckCircle size={24} className="text-cyan-400" />
                      </div>
                      <p className="text-white font-bold text-lg">Thank you!</p>
                      <p className="text-gray-400 text-sm mt-2 leading-relaxed max-w-xs mx-auto">
                        Your feedback has been received. We read every submission and use it to improve.
                      </p>
                      <button onClick={() => { setFeedbackSent(false); setFeedback({ senderName: "", senderEmail: "", category: "GENERAL", message: "", rating: 0 }); }}
                        className="mt-5 px-5 py-2 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-300 text-xs font-medium rounded-xl transition-colors">
                        Send More Feedback
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleFeedbackSubmit} className="p-5 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Name <span className="text-gray-600">(optional)</span></label>
                          <div className="relative">
                            <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={11} />
                            <input value={feedback.senderName} onChange={e => setFeedback(f => ({ ...f, senderName: e.target.value }))}
                              placeholder=" " type="text"
                              className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email <span className="text-gray-600">(optional)</span></label>
                          <div className="relative">
                            <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={11} />
                            <input value={feedback.senderEmail} onChange={e => setFeedback(f => ({ ...f, senderEmail: e.target.value }))}
                              placeholder=" " type="email"
                              className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30" />
                          </div>
                        </div>
                      </div>

                      {/* ── Custom Category Dropdown ── */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</label>
                        <CustomDropdown
                          options={CATEGORIES}
                          value={feedback.category}
                          onChange={val => setFeedback(f => ({ ...f, category: val }))}
                          accentColor="cyan"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Overall Rating <span className="text-gray-600">(optional)</span></label>
                        <StarRating value={feedback.rating} onChange={r => setFeedback(f => ({ ...f, rating: r }))} />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Feedback <span className="text-red-400">*</span></label>
                        <textarea value={feedback.message} onChange={e => setFeedback(f => ({ ...f, message: e.target.value }))}
                          rows={5} required placeholder=" "
                          className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/30" />
                      </div>

                      <button type="submit" disabled={feedbackLoading}
                        className="w-full py-3 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-900/40">
                        {feedbackLoading
                          ? <><FaSpinner className="animate-spin" size={12} /> Sending…</>
                          : <><FaPaperPlane size={11} /> Send Feedback</>}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* ── Right: FAQ ── */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                  <h3 className="text-white text-sm font-bold">Frequently Asked Questions</h3>
                  <p className="text-gray-500 text-xs mt-0.5">Quick answers to common questions</p>
                </div>
                <div className="divide-y divide-white/5">
                  {FAQS.map((faq, i) => (
                    <div key={i}>
                      <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors focus:outline-none select-none">
                        <p className={`text-xs font-semibold leading-relaxed ${openFaq === i ? "text-blue-400" : "text-white"}`}>
                          {faq.q}
                        </p>
                        {openFaq === i
                          ? <FaChevronUp size={10} className="text-blue-400 shrink-0" />
                          : <FaChevronDown size={10} className="text-gray-600 shrink-0" />}
                      </button>
                      {openFaq === i && (
                        <div className="px-5 pb-4">
                          <p className="text-gray-400 text-xs leading-relaxed">{faq.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Office info card */}
              <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 flex-1 flex flex-col gap-4">

                {/* Header */}
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-white text-sm font-bold">SAS Office</p>
                    <p className="text-gray-500 text-[10px]">Student Affairs Services · NBSC</p>
                  </div>
                </div>

                {/* Location + Hours + Email */}
                <div className="space-y-2.5">
                  {[
                    { emoji: "", label: "Location", value: "NBSC SWDC - Building" },
                    { emoji: "", label: "Hours", value: "Mon–Fri, 7:30 AM – 6:00 PM" },

                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-2.5">
                      <span className="text-sm shrink-0 mt-0.5">{item.emoji}</span>
                      <div>
                        <p className="text-gray-600 text-[9px] font-bold uppercase tracking-widest">{item.label}</p>
                        <p className="text-gray-300 text-xs font-medium">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/5" />

                {/* When visiting tips */}
                <div>
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">When visiting the website</p>
                  <div className="space-y-1.5 text-justify">
                    {[
                      "Always use Fetch Student Info or scan your ID when reporting it auto-fills your name and email instantly.",
                      "Check the Found Items page first before filing a lost report your item may already be there.",
                    ].map((tip, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60 shrink-0 mt-1.5" />
                        <p className="text-gray-500 text-[11px] leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>



                {/* Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full animate-pulse ${isOpen ? "bg-emerald-400" : "bg-red-400"}`} />
                    <p className={`${isOpen ? "text-emerald-400" : "text-red-400"} text-[11px] font-semibold`}>
                      {isOpen ? "Office currently open" : "Office currently closed"}
                    </p>
                  </div>
                  <p className="text-gray-700 text-[10px]">Mon–Fri only</p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} theme="dark"
        toastClassName="!bg-gray-800 !border !border-white/10 !rounded-xl !text-sm !text-white shadow-2xl" />
    </>
  );
};

export default SupportPage;