import { useState } from "react";
import { BiSupport } from "react-icons/bi";
import {
  FaTicketAlt, FaCommentDots, FaEnvelope, FaUser, FaPaperPlane,
  FaCheckCircle, FaSpinner, FaStar, FaRegStar, FaChevronDown, FaChevronUp,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ── API base — reads the same env your Redux baseApi uses ────────────────────
// If this fails, open your baseApi.ts, copy the baseUrl value, and paste it below
const getBaseUrl = (): string => {
  return (
    import.meta.env.VITE_API_URL ||
    (import.meta.env.VITE_SERVER_URL ? `${import.meta.env.VITE_SERVER_URL}/api` : "") ||
    import.meta.env.VITE_BASE_URL ||
    "http://localhost:5000/api"
  );
};

const postJSON = async (endpoint: string, data: any) => {
  const url = `${getBaseUrl()}${endpoint}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json;
};

// ── Test data pre-filled so you can hit submit immediately ───────────────────
const TEST_TICKET = {
  senderName:  "Juan Dela Cruz",
  senderEmail: "20230001@nbsc.edu.ph",
  subject:     "My claim was not processed after 3 days",
  message:     "I submitted a claim for a black backpack found at the Library last Monday. It has been 3 days and the status is still showing PENDING. I have already verified my identity at the SAS office. Please check the status of my claim. Thank you.",
  priority:    "HIGH",
};

const TEST_FEEDBACK = {
  senderName:  "Maria Santos",
  senderEmail: "20230042@nbsc.edu.ph",
  category:    "FEATURE",
  message:     "It would be really helpful if students could receive SMS notifications when a potential match is found for their lost item. Not all students check their email regularly, so an SMS alert would speed up the recovery process. Also, the AI Search feature is amazing — please keep improving it!",
  rating:      4,
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

// ── FAQ ───────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: "How do I report a lost item?",       a: "Go to the Lost Items page and click 'Report Lost Item'. Fill in the item description, location, and date. You'll receive a confirmation email." },
  { q: "How do I claim a found item?",        a: "Browse the Found Items page, find your item, and click 'Claim'. Provide proof of ownership. The SAS office will verify and contact you." },
  { q: "How long does claiming take?",        a: "Typically 1–3 business days. Claims are reviewed during office hours, Monday–Friday, 8AM–5PM." },
  { q: "What if my item isn't found?",        a: "Your report stays active. If a matching item is found later, you'll get an automatic email notification." },
  { q: "Can I report anonymously?",           a: "Found items can be reported without logging in. Lost item reports and claims require an NBSC email for verification." },
  { q: "How do I check my claim status?",     a: "Log in to your student account and go to the Claims section in your dashboard." },
];

// ════════════════════════════════════════════════════════════════════════════════
// SUPPORT PAGE
// ════════════════════════════════════════════════════════════════════════════════
const SupportPage = () => {
  const [activeTab, setActiveTab] = useState<"ticket" | "feedback">("ticket");
  const [openFaq, setOpenFaq]     = useState<number | null>(null);

  const [ticket, setTicket]               = useState(TEST_TICKET);
  const [ticketSent, setTicketSent]       = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);

  const [feedback, setFeedback]                 = useState(TEST_FEEDBACK);
  const [feedbackSent, setFeedbackSent]         = useState(false);
  const [feedbackLoading, setFeedbackLoading]   = useState(false);

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket.subject.trim() || !ticket.message.trim()) { toast.error("Subject and message are required"); return; }
    setTicketLoading(true);
    try {
      const res = await postJSON("/tickets", ticket);
      if (res?.success) { setTicketSent(true); toast.success("Ticket submitted! We'll get back to you soon."); }
      else { toast.error(res?.message || "Failed to submit ticket"); }
    } catch (err: any) {
      toast.error(err?.message || "Could not reach server — check your API URL in .env");
      console.error("[SupportPage] ticket error:", err);
    } finally { setTicketLoading(false); }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.message.trim()) { toast.error("Please write your feedback"); return; }
    setFeedbackLoading(true);
    try {
      const res = await postJSON("/feedback", feedback);
      if (res?.success) { setFeedbackSent(true); toast.success("Feedback received! Thank you."); }
      else { toast.error(res?.message || "Failed to submit feedback"); }
    } catch (err: any) {
      toast.error(err?.message || "Could not reach server — check your API URL in .env");
      console.error("[SupportPage] feedback error:", err);
    } finally { setFeedbackLoading(false); }
  };

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
      `}</style>

      <div className="min-h-screen bg-gray-950 pb-20">
        {/* Ambient bg */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[480px] h-[480px] bg-blue-600/6 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: `linear-gradient(rgba(99,179,237,0.4) 1px, transparent 1px),linear-gradient(90deg,rgba(99,179,237,0.4) 1px,transparent 1px)`,
            backgroundSize: "64px 64px",
          }} />
        </div>

        <div className="relative z-10 px-4 sm:px-6 lg:px-16 mx-auto max-w-5xl pt-16 sm:pt-20">

          {/* Header */}
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
              Submit a support ticket, send feedback, or browse the FAQ. SAS office: Mon–Fri, 8AM–5PM.
            </p>
          </div>

          {/* Info cards */}
          <div className="fade-up fade-up-2 grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
            {[
              { icon: <BiSupport size={18} className="text-blue-400" />,    label: "Office Hours",  value: "Mon–Fri, 8AM–5PM",  bg: "bg-blue-500/10 border-blue-500/20" },
              { icon: <FaEnvelope size={14} className="text-cyan-400" />,   label: "Email Support", value: "sas@nbsc.edu.ph",    bg: "bg-cyan-500/10 border-cyan-500/20" },
              { icon: <FaTicketAlt size={14} className="text-violet-400" />,label: "Response Time", value: "1–3 business days",  bg: "bg-violet-500/10 border-violet-500/20" },
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

            {/* Forms */}
            <div className="lg:col-span-3 space-y-4">
              {/* Tab switcher */}
              <div className="flex bg-gray-900 border border-white/5 rounded-2xl p-1 gap-1">
                {([
                  { id: "ticket",   label: "Support Ticket", icon: <FaTicketAlt size={11} /> },
                  { id: "feedback", label: "Send Feedback",  icon: <FaCommentDots size={11} /> },
                ] as const).map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all
                      ${activeTab === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30" : "text-gray-500 hover:text-white hover:bg-white/5"}`}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Support Ticket */}
              {activeTab === "ticket" && (
                <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden" style={{ borderTop: "2px solid #3b82f6" }}>
                  <div className="px-5 py-4 border-b border-white/5">
                    <h2 className="text-white text-sm font-bold">Submit a Support Ticket</h2>
                    <p className="text-gray-500 text-xs mt-0.5">Describe your issue and we'll reply via email</p>
                  </div>
                  {ticketSent ? (
                    <div className="p-10 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                        <FaCheckCircle size={24} className="text-blue-400" />
                      </div>
                      <p className="text-white font-bold text-lg">Ticket Submitted!</p>
                      <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto leading-relaxed">We've received your request. Expect a reply within 1–3 business days to your school email.</p>
                      <button onClick={() => { setTicketSent(false); setTicket(TEST_TICKET); }}
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
                            <input value={ticket.senderName} onChange={e => setTicket(t => ({ ...t, senderName: e.target.value }))} type="text"
                              className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">School Email</label>
                          <div className="relative">
                            <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={11} />
                            <input value={ticket.senderEmail} onChange={e => setTicket(t => ({ ...t, senderEmail: e.target.value }))} type="email"
                              className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subject <span className="text-red-400">*</span></label>
                        <input value={ticket.subject} onChange={e => setTicket(t => ({ ...t, subject: e.target.value }))} type="text" required
                          className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority</label>
                        <select value={ticket.priority} onChange={e => setTicket(t => ({ ...t, priority: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                          <option value="LOW">Low — General question</option>
                          <option value="NORMAL">Normal — Issue affecting my use</option>
                          <option value="HIGH">High — Urgent issue</option>
                          <option value="URGENT">Urgent — Critical problem</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Message <span className="text-red-400">*</span></label>
                        <textarea value={ticket.message} onChange={e => setTicket(t => ({ ...t, message: e.target.value }))} rows={5} required
                          className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                      </div>
                      <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl">
                        <p className="text-blue-300/70 text-xs leading-relaxed">Provide your school email so we can reply. Tickets are reviewed Mon–Fri during office hours.</p>
                      </div>
                      <button type="submit" disabled={ticketLoading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-900/40">
                        {ticketLoading ? <><FaSpinner className="animate-spin" size={12} /> Submitting…</> : <><FaPaperPlane size={11} /> Submit Ticket</>}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Feedback */}
              {activeTab === "feedback" && (
                <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden" style={{ borderTop: "2px solid #22d3ee" }}>
                  <div className="px-5 py-4 border-b border-white/5">
                    <h2 className="text-white text-sm font-bold">Send Feedback</h2>
                    <p className="text-gray-500 text-xs mt-0.5">Bug reports, suggestions, or compliments</p>
                  </div>
                  {feedbackSent ? (
                    <div className="p-10 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                        <FaCheckCircle size={24} className="text-cyan-400" />
                      </div>
                      <p className="text-white font-bold text-lg">Thank you!</p>
                      <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto leading-relaxed">Your feedback has been received. We read every submission and use it to improve.</p>
                      <button onClick={() => { setFeedbackSent(false); setFeedback(TEST_FEEDBACK); }}
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
                            <input value={feedback.senderName} onChange={e => setFeedback(f => ({ ...f, senderName: e.target.value }))} type="text"
                              className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email <span className="text-gray-600">(optional)</span></label>
                          <div className="relative">
                            <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={11} />
                            <input value={feedback.senderEmail} onChange={e => setFeedback(f => ({ ...f, senderEmail: e.target.value }))} type="email"
                              className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</label>
                        <select value={feedback.category} onChange={e => setFeedback(f => ({ ...f, category: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30">
                          <option value="GENERAL">💬 General Feedback</option>
                          <option value="BUG">🐛 Bug Report</option>
                          <option value="FEATURE">✨ Feature Request</option>
                          <option value="COMPLAINT">⚠️ Complaint</option>
                          <option value="COMPLIMENT">🌟 Compliment</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Overall Rating <span className="text-gray-600">(optional)</span></label>
                        <StarRating value={feedback.rating} onChange={r => setFeedback(f => ({ ...f, rating: r }))} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Feedback <span className="text-red-400">*</span></label>
                        <textarea value={feedback.message} onChange={e => setFeedback(f => ({ ...f, message: e.target.value }))} rows={5} required
                          className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/30" />
                      </div>
                      <button type="submit" disabled={feedbackLoading}
                        className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-cyan-900/40">
                        {feedbackLoading ? <><FaSpinner className="animate-spin" size={12} /> Sending…</> : <><FaPaperPlane size={11} /> Send Feedback</>}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Right: FAQ + Office */}
            <div className="lg:col-span-2 space-y-3">
              <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                  <h3 className="text-white text-sm font-bold">Frequently Asked Questions</h3>
                  <p className="text-gray-500 text-xs mt-0.5">Quick answers to common questions</p>
                </div>
                <div className="divide-y divide-white/5">
                  {FAQS.map((faq, i) => (
                    <div key={i}>
                      <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors">
                        <p className={`text-xs font-semibold leading-relaxed ${openFaq === i ? "text-blue-400" : "text-white"}`}>{faq.q}</p>
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

              <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <BiSupport size={16} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold">SAS Office</p>
                    <p className="text-gray-500 text-[10px]">Student Affairs Services</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-gray-500">
                  <p>📍 NBSC Main Campus, SAS Building</p>
                  <p>🕐 Mon–Fri, 8:00 AM – 5:00 PM</p>
                  <p>📧 sas@nbsc.edu.ph</p>
                </div>
                <div className="pt-2 border-t border-white/5">
                  <p className="text-gray-600 text-[10px] leading-relaxed">For urgent matters, visit the office directly during school hours.</p>
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