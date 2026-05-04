// dashboard/pages/ContentModeration.tsx
// Layout matches CommunicationHub exactly:
//   stats row (4 cards)  →  tab strip  →  tab content

import React, { useState } from "react";
import {
  FaFlag, FaUserShield, FaRobot, FaBalanceScale,
  FaCheck, FaTimes, FaTrash, FaEye, FaExclamationTriangle,
  FaCheckCircle, FaTimesCircle, FaBan, FaComment,
  FaShieldAlt, FaSpinner, FaBolt,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { baseApi } from "../../redux/api/baseApi";
import { useBlockUserMutation } from "../../redux/api/api";

// ── RTK Query endpoints ───────────────────────────────────────────────────────
const modApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getModerationStats:  builder.query({ query: () => ({ url: "/admin/moderation/stats",    method: "GET" }), providesTags: ["moderation"] }),
    getReports:          builder.query({ query: (s?: string) => ({ url: "/admin/moderation/reports",  method: "GET", params: s ? { status: s } : {} }), providesTags: ["moderation"] }),
    resolveReport:       builder.mutation({ query: ({ id, ...data }: any) => ({ url: `/admin/moderation/reports/${id}/resolve`, method: "PUT", body: data }), invalidatesTags: ["moderation"] }),
    deleteReport:        builder.mutation({ query: (id: string) => ({ url: `/admin/moderation/reports/${id}`, method: "DELETE" }), invalidatesTags: ["moderation"] }),
    getPendingComments:  builder.query({ query: (s?: string) => ({ url: "/admin/moderation/comments", method: "GET", params: s ? { status: s } : {} }), providesTags: ["moderation"] }),
    moderateComment:     builder.mutation({ query: ({ id, ...data }: any) => ({ url: `/admin/moderation/comments/${id}`, method: "PUT", body: data }), invalidatesTags: ["moderation"] }),
    getUserBehavior:     builder.query({ query: () => ({ url: "/admin/moderation/behavior", method: "GET" }), providesTags: ["moderation"] }),
    issueWarning:        builder.mutation({ query: (data: any) => ({ url: "/admin/moderation/warnings", method: "POST", body: data }), invalidatesTags: ["moderation"] }),
    deleteWarning:       builder.mutation({ query: (id: string) => ({ url: `/admin/moderation/warnings/${id}`, method: "DELETE" }), invalidatesTags: ["moderation"] }),
    getKeywords:         builder.query({ query: () => ({ url: "/admin/moderation/keywords", method: "GET" }), providesTags: ["moderation"] }),
    testContent:         builder.mutation({ query: (data: any) => ({ url: "/admin/moderation/test", method: "POST", body: data }) }),
    getAppeals:          builder.query({ query: (s?: string) => ({ url: "/admin/moderation/appeals",  method: "GET", params: s ? { status: s } : {} }), providesTags: ["moderation"] }),
    resolveAppeal:       builder.mutation({ query: ({ id, ...data }: any) => ({ url: `/admin/moderation/appeals/${id}/resolve`, method: "PUT", body: data }), invalidatesTags: ["moderation"] }),
  }),
  overrideExisting: false,
});

const {
  useGetModerationStatsQuery, useGetReportsQuery, useResolveReportMutation, useDeleteReportMutation,
  useGetPendingCommentsQuery, useModerateCommentMutation,
  useGetUserBehaviorQuery, useIssueWarningMutation, useDeleteWarningMutation,
  useGetKeywordsQuery, useTestContentMutation,
  useGetAppealsQuery, useResolveAppealMutation,
} = modApi;

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

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  SPAM:           { label: "Spam",           color: "text-yellow-400"  },
  INAPPROPRIATE:  { label: "Inappropriate",  color: "text-orange-400"  },
  HARASSMENT:     { label: "Harassment",     color: "text-red-400"     },
  MISINFORMATION: { label: "Misinformation", color: "text-violet-400"  },
  OTHER:          { label: "Other",          color: "text-gray-400"    },
};

const SEVERITY_CONFIG: Record<string, { color: string; bg: string }> = {
  LOW:    { color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
  MEDIUM: { color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20" },
  HIGH:   { color: "text-red-400",    bg: "bg-red-400/10 border-red-400/20"       },
};

// ── Shared UI primitives ──────────────────────────────────────────────────────
const StatCard = ({ label, value, color, bg, icon }: any) => (
  <div className={`rounded-2xl border p-4 bg-gray-900 flex items-center gap-3 ${bg}`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>{icon}</div>
    <div>
      <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
      <p className="text-gray-500 text-xs font-medium">{label}</p>
    </div>
  </div>
);

const SectionCard = ({ title, subtitle, children, action }: any) => (
  <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-white/5">
      <div className="min-w-0 flex-1">
        <h3 className="text-white text-sm font-semibold">{title}</h3>
        {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">{action}</div>}
    </div>
    {children}
  </div>
);

// ════════════════════════════════════════════════════════════════════════════════
// TAB: REPORTED CONTENT
// ════════════════════════════════════════════════════════════════════════════════
const ReportedContentTab = () => {
  const [statusFilter, setStatusFilter] = useState("");
  const { data: reportsData, isLoading } = useGetReportsQuery(statusFilter || undefined);
  const [resolveReport] = useResolveReportMutation();
  const [deleteReport]  = useDeleteReportMutation();
  const { data: commentsData } = useGetPendingCommentsQuery(undefined);
  const [moderateComment] = useModerateCommentMutation();
  const [rejectionReason, setRejectionReason] = useState("");
  const [commentFilter, setCommentFilter] = useState("PENDING");
  const reports: any[]  = reportsData?.data  || [];
  const comments: any[] = commentsData?.data || [];

  const handleResolve = async (id: string, action: string, commentAction: string) => {
    const res: any = await resolveReport({ id, action, commentAction });
    if (res?.data?.success) toast.success("Report resolved");
    else toast.error("Failed to resolve");
  };

  const handleModerate = async (id: string, action: string) => {
    const res: any = await moderateComment({ id, action, rejectionReason });
    if (res?.data?.success) { toast.success(`Comment ${action.toLowerCase()}`); setRejectionReason(""); }
    else toast.error("Failed to moderate comment");
  };

  return (
    <div className="space-y-4">
      <SectionCard title="User Reports" subtitle="Comments flagged by users as inappropriate"
        action={
          <div className="flex gap-1 bg-gray-800 border border-white/5 rounded-lg p-1 min-w-full w-max">
            {["", "PENDING", "REVIEWED", "DISMISSED"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`flex-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all whitespace-nowrap shrink-0 ${statusFilter === s ? "bg-cyan-500/10 text-cyan-400" : "text-gray-500 hover:text-white"}`}>
                {s || "All"}
              </button>
            ))}
          </div>
        }
      >
        {isLoading ? (
          <div className="p-5 space-y-3">{Array.from({length:3}).map((_,i)=><div key={i} className="h-16 bg-gray-800/60 rounded-xl animate-pulse"/>)}</div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-600">
            <FaFlag size={24} className="mb-2 opacity-30"/>
            <p className="text-sm">No reports {statusFilter ? `with status "${statusFilter}"` : "yet"}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {reports.map((r: any) => {
              const rc = REASON_LABELS[r.reason] || REASON_LABELS.OTHER;
              const isPending = r.status === "PENDING";
              return (
                <div key={r.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold ${rc.color}`}>{rc.label}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isPending ? "bg-yellow-400/10 border-yellow-400/20 text-yellow-400" : r.status === "REVIEWED" ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400" : "bg-gray-400/10 border-gray-400/20 text-gray-400"}`}>{r.status}</span>
                        {isPending && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"/>}
                      </div>
                      {r.comment && (
                        <div className="p-2.5 bg-gray-800/60 border border-white/5 rounded-lg">
                          <p className="text-gray-400 text-[10px] mb-1">Comment by <span className="text-white font-semibold">{r.comment.user?.username || "Anonymous"}</span>{" · "}{r.comment.itemType} item</p>
                          <p className="text-gray-300 text-xs line-clamp-2">{r.comment.content}</p>
                        </div>
                      )}
                      {r.details && <p className="text-gray-600 text-[10px] italic">Report: "{r.details}"</p>}
                      <div className="flex items-center gap-3 text-[10px] text-gray-600">
                        <span>By {r.reportedBy}</span><span>·</span><span>{timeAgo(r.createdAt)}</span>
                        {r.resolvedBy && <><span>·</span><span>Resolved by {r.resolvedBy}</span></>}
                      </div>
                    </div>
                    {isPending && (
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button onClick={() => handleResolve(r.id, "REVIEWED", "REJECT")} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-bold rounded-lg transition-all"><FaBan size={8}/> Reject Comment</button>
                        <button onClick={() => handleResolve(r.id, "REVIEWED", "APPROVE")} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg transition-all"><FaCheck size={8}/> Keep Comment</button>
                        <button onClick={() => handleResolve(r.id, "DISMISSED", "NONE")} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-500/10 hover:bg-gray-500/20 border border-gray-500/20 text-gray-400 text-[10px] font-bold rounded-lg transition-all"><FaTimes size={8}/> Dismiss</button>
                      </div>
                    )}
                    <button onClick={() => deleteReport(r.id)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/10 border border-white/5 text-gray-600 hover:text-red-400 flex items-center justify-center transition-all shrink-0"><FaTrash size={8}/></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Comment Moderation Queue" subtitle="Review comments flagged by auto-moderation"
        action={
          <div className="flex gap-1 bg-gray-800 border border-white/5 rounded-lg p-1 min-w-full w-max">
            {["PENDING", "APPROVED", "REJECTED"].map(s => (
              <button key={s} onClick={() => setCommentFilter(s)}
                className={`flex-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all whitespace-nowrap shrink-0 ${commentFilter === s ? "bg-cyan-500/10 text-cyan-400" : "text-gray-500 hover:text-white"}`}>
                {s}
              </button>
            ))}
          </div>
        }
      >
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-600">
            <FaComment size={24} className="mb-2 opacity-30"/>
            <p className="text-sm">No comments in queue</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {comments.map((c: any) => (
              <div key={c.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white text-xs font-semibold">{c.user?.username || "Anonymous"}</p>
                      <span className="text-gray-600 text-[10px]">{c.itemType} · {c.itemId?.slice(0,8)}…</span>
                      {c.isAnonymous && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-500/10 border border-gray-500/20 text-gray-500">Anonymous</span>}
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed">{c.content}</p>
                    {c.rejectionReason && <p className="text-red-400/70 text-[10px]">Rejection reason: {c.rejectionReason}</p>}
                    <p className="text-gray-700 text-[10px]">{timeAgo(c.createdAt)}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button onClick={() => handleModerate(c.id, "APPROVED")} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg transition-all"><FaCheck size={8}/> Approve</button>
                    <button onClick={() => handleModerate(c.id, "REJECTED")} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-bold rounded-lg transition-all"><FaTimes size={8}/> Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// TAB: USER BEHAVIOR
// ════════════════════════════════════════════════════════════════════════════════
const UserBehaviorTab = () => {
  const { data: behaviorData, isLoading, refetch } = useGetUserBehaviorQuery(undefined);
  const [issueWarning]  = useIssueWarningMutation();
  const [deleteWarning] = useDeleteWarningMutation();
  const [blockUser]     = useBlockUserMutation();
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [warnTarget, setWarnTarget]       = useState<any>(null);
  const [warnForm, setWarnForm]           = useState({ reason: "", severity: "LOW", note: "" });
  const behavior = behaviorData?.data;

  const handleIssueWarning = async () => {
    if (!warnForm.reason.trim()) { toast.error("Reason is required"); return; }
    const res: any = await issueWarning({ userId: warnTarget.id, ...warnForm });
    if (res?.data?.success) {
      toast.success(res.data.data?.autoBlocked ? "Warning issued — user auto-blocked (3 HIGH warnings)" : "Warning issued");
      setShowWarnModal(false); setWarnForm({ reason: "", severity: "LOW", note: "" }); refetch();
    } else toast.error("Failed to issue warning");
  };

  const handleBlock = async (userId: string, username: string) => {
    if (!confirm(`Block ${username}?`)) return;
    const res: any = await blockUser(userId);
    if (res?.data?.success) { toast.success(`${username} blocked`); refetch(); }
    else toast.error("Failed to block user");
  };

  if (isLoading) return <div className="space-y-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-16 bg-gray-800/60 rounded-2xl animate-pulse"/>)}</div>;

  return (
    <div className="space-y-6">
      <SectionCard title="Users with Warnings" subtitle="Users who have received moderation warnings">
        {!(behavior?.userBehaviorList?.length) ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-600">
            <FaUserShield size={24} className="mb-2 opacity-30"/>
            <p className="text-sm">No user warnings issued yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {behavior.userBehaviorList.map((item: any) => (
              <div key={item.user?.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {item.user?.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white text-xs font-semibold truncate">{item.user?.username}</p>
                    {item.highCount > 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-400/10 border border-red-400/20 text-red-400">{item.highCount} HIGH</span>}
                    {!item.user?.activated && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400">Blocked</span>}
                  </div>
                  <p className="text-gray-600 text-[10px] truncate">{item.user?.email}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right"><p className="text-orange-400 text-sm font-bold">{item.count}</p><p className="text-gray-600 text-[10px]">warnings</p></div>
                  <div className="flex gap-1.5">
                    <button onClick={() => { setWarnTarget(item.user); setShowWarnModal(true); }} className="w-7 h-7 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 flex items-center justify-center transition-all" title="Issue warning"><FaExclamationTriangle size={9}/></button>
                    {item.user?.activated && <button onClick={() => handleBlock(item.user.id, item.user.username)} className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 flex items-center justify-center transition-all" title="Block user"><FaBan size={9}/></button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Recent Warnings" subtitle="Latest warnings issued by admins">
        {!(behavior?.recentWarnings?.length) ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-600">
            <FaShieldAlt size={20} className="mb-2 opacity-30"/>
            <p className="text-sm">No warnings issued yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {behavior.recentWarnings.map((w: any) => {
              const sc = SEVERITY_CONFIG[w.severity] || SEVERITY_CONFIG.LOW;
              return (
                <div key={w.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 ${sc.bg}`}><FaExclamationTriangle size={9} className={sc.color}/></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white text-xs font-semibold">{w.user?.username || "Unknown"}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${sc.bg} ${sc.color}`}>{w.severity}</span>
                    </div>
                    <p className="text-gray-500 text-[10px] truncate">{w.reason}</p>
                    <p className="text-gray-700 text-[10px]">By {w.issuedBy} · {timeAgo(w.createdAt)}</p>
                  </div>
                  <button onClick={() => deleteWarning(w.id)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/10 border border-white/5 text-gray-600 hover:text-red-400 flex items-center justify-center transition-all shrink-0"><FaTrash size={8}/></button>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {showWarnModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl" style={{ borderTop: "2px solid #f97316" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div><h3 className="text-white text-sm font-bold">Issue Warning</h3><p className="text-gray-500 text-[11px] mt-0.5">Warning for {warnTarget?.username}</p></div>
              <button onClick={() => setShowWarnModal(false)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white"><FaTimes size={12}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reason <span className="text-red-400">*</span></label>
                <input value={warnForm.reason} onChange={e => setWarnForm(f=>({...f,reason:e.target.value}))} placeholder="e.g. Repeated spam comments"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/30"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Severity</label>
                <select value={warnForm.severity} onChange={e => setWarnForm(f=>({...f,severity:e.target.value}))}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30">
                  <option value="LOW">Low — First offense / minor</option>
                  <option value="MEDIUM">Medium — Repeated violation</option>
                  <option value="HIGH">High — Serious violation (3 = auto-block)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin Note (optional)</label>
                <textarea value={warnForm.note} onChange={e => setWarnForm(f=>({...f,note:e.target.value}))} rows={2} placeholder="Internal notes..."
                  className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/30"/>
              </div>
              {warnForm.severity === "HIGH" && (
                <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-xl flex items-start gap-2">
                  <FaExclamationTriangle size={10} className="text-red-400 shrink-0 mt-0.5"/>
                  <p className="text-red-300/70 text-xs">3 HIGH severity warnings will automatically block this user.</p>
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-white/5 flex gap-3">
              <button onClick={() => setShowWarnModal(false)} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-300 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={handleIssueWarning} className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                <FaExclamationTriangle size={10}/> Issue Warning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// TAB: AUTOMATED MODERATION
// ════════════════════════════════════════════════════════════════════════════════
const AutomatedModerationTab = () => {
  const { data: kwData } = useGetKeywordsQuery(undefined);
  const [testContent, { isLoading: isTesting }] = useTestContentMutation();
  const [testText, setTestText]   = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const keywords: string[] = kwData?.data?.keywords || [];

  const handleTest = async () => {
    if (!testText.trim()) { toast.error("Enter some text to test"); return; }
    const res: any = await testContent({ text: testText });
    if (res?.data?.success) setTestResult(res.data.data);
    else toast.error("Test failed");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center"><FaRobot size={16} className="text-cyan-400"/></div>
          <div><h3 className="text-white text-sm font-bold">How Auto-Moderation Works</h3><p className="text-gray-500 text-[10px]">No AI API cost — runs locally on every comment submission</p></div>
        </div>
        <div className="space-y-2.5">
          {[
            { step:"1", title:"Comment submitted", desc:"A user submits a comment on any found/lost item" },
            { step:"2", title:"Keyword scan",      desc:"Content is checked against the blocked keyword list" },
            { step:"3", title:"Auto-decision",     desc:"Clean content → APPROVED immediately. Flagged → PENDING for admin review" },
            { step:"4", title:"Admin review",      desc:"Pending comments appear in the Reported Content tab for manual approve/reject" },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black flex items-center justify-center shrink-0">{s.step}</div>
              <div><p className="text-white text-xs font-semibold">{s.title}</p><p className="text-gray-500 text-[10px] mt-0.5">{s.desc}</p></div>
            </div>
          ))}
        </div>
      </div>

      <SectionCard title="Blocked Keywords" subtitle={`${keywords.length} keywords — defined in moderationController.ts`}>
        <div className="p-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw:string) => <span key={kw} className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono rounded-lg">{kw}</span>)}
          </div>
          <div className="pt-2 border-t border-white/5">
            <p className="text-gray-600 text-[10px] leading-relaxed">
              Edit the <code className="bg-gray-800 px-1 rounded text-cyan-300 text-[10px]">BLOCKED_KEYWORDS</code> array in{" "}
              <code className="bg-gray-800 px-1 rounded text-cyan-300 text-[10px]">src/utils/moderationController.ts</code> and redeploy.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Content Tester" subtitle="Test a piece of text against the keyword filter">
        <div className="p-5 space-y-4">
            <textarea value={testText} onChange={e => { setTestText(e.target.value); setTestResult(null); }} rows={4}
            placeholder="Paste or type any text here to test it against the filter..."
            className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/30"/>
            <div className="flex items-center justify-end gap-2">
            {(testText || testResult) && (
                <button
                onClick={() => { setTestText(""); setTestResult(null); }}
                className="flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition-all">
                <FaTimes size={10}/> Clear
                </button>
            )}
            <button onClick={handleTest} disabled={isTesting}
                className="flex items-center gap-2 px-4 py-1.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all">
                {isTesting ? <><FaSpinner className="animate-spin" size={10}/> Testing…</> : <><FaBolt size={10}/> Test Content</>}
            </button>
            </div>
            {testResult && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${testResult.clean ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                {testResult.clean ? <FaCheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5"/> : <FaTimesCircle size={16} className="text-red-400 shrink-0 mt-0.5"/>}
                <div>
                <p className={`text-sm font-bold ${testResult.clean ? "text-emerald-400" : "text-red-400"}`}>
                    {testResult.clean ? "✓ Content is clean" : `✗ Blocked keyword found: "${testResult.flaggedKeyword}"`}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">
                    {testResult.clean ? "This text would be auto-approved when submitted as a comment." : "This text would be held as PENDING and require admin review."}
                </p>
                </div>
            </div>
            )}
        </div>
     </SectionCard>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// TAB: APPEAL PROCESS
// ════════════════════════════════════════════════════════════════════════════════
const AppealProcessTab = () => {
  const [statusFilter, setStatusFilter] = useState("");
  const { data: appealsData, isLoading } = useGetAppealsQuery(statusFilter || undefined);
  const [resolveAppeal] = useResolveAppealMutation();
  const [selectedAppeal, setSelectedAppeal] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const appeals: any[] = appealsData?.data || [];

  const handleResolve = async (action: "APPROVED" | "DENIED") => {
    const res: any = await resolveAppeal({ id: selectedAppeal.id, action, adminNote });
    if (res?.data?.success) { toast.success(action === "APPROVED" ? "Appeal approved — comment restored" : "Appeal denied"); setSelectedAppeal(null); setAdminNote(""); }
    else toast.error("Failed to resolve appeal");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3.5 bg-violet-500/5 border border-violet-500/15 rounded-xl">
        <FaBalanceScale size={13} className="text-violet-400 shrink-0 mt-0.5"/>
        <p className="text-violet-300/70 text-xs leading-relaxed">
          Users whose comments were rejected can submit an appeal via <code className="bg-gray-800 px-1 rounded text-violet-300 text-[10px]">POST /moderation/appeals</code>.
          If approved, the comment is automatically restored to APPROVED status.
        </p>
      </div>

      <SectionCard title="Moderation Appeals" subtitle="Users disputing rejected comments"
        action={
          <div className="flex gap-1 bg-gray-800 border border-white/5 rounded-lg p-1 min-w-full w-max">
            {["", "PENDING", "APPROVED", "DENIED"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`flex-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all whitespace-nowrap shrink-0 ${statusFilter === s ? "bg-cyan-500/10 text-cyan-400" : "text-gray-500 hover:text-white"}`}>
                {s || "All"}
              </button>
            ))}
          </div>
        }
      >
        {isLoading ? (
          <div className="p-5 space-y-3">{Array.from({length:3}).map((_,i)=><div key={i} className="h-16 bg-gray-800/60 rounded-xl animate-pulse"/>)}</div>
        ) : appeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-600">
            <FaBalanceScale size={24} className="mb-2 opacity-30"/>
            <p className="text-sm">No appeals {statusFilter ? `with status "${statusFilter}"` : "yet"}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {appeals.map((a: any) => {
              const isPending = a.status === "PENDING";
              return (
                <div key={a.id} className={`px-5 py-4 hover:bg-white/[0.02] transition-colors ${isPending ? "border-l-2 border-violet-500/40" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white text-xs font-semibold">{a.user?.username || "Anonymous"}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isPending ? "bg-violet-400/10 border-violet-400/20 text-violet-400" : a.status === "APPROVED" ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400" : "bg-red-400/10 border-red-400/20 text-red-400"}`}>{a.status}</span>
                        {isPending && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"/>}
                      </div>
                      {a.comment && (
                        <div className="p-2.5 bg-gray-800/60 border border-white/5 rounded-lg">
                          <p className="text-gray-600 text-[10px] mb-1">Rejected comment:</p>
                          <p className="text-gray-300 text-xs line-clamp-2">{a.comment.content}</p>
                          {a.comment.rejectionReason && <p className="text-red-400/60 text-[10px] mt-1">Reason: {a.comment.rejectionReason}</p>}
                        </div>
                      )}
                      <div className="p-2 bg-violet-500/5 border border-violet-500/10 rounded-lg">
                        <p className="text-gray-600 text-[10px] mb-0.5">Appeal reason:</p>
                        <p className="text-gray-300 text-xs">{a.reason}</p>
                      </div>
                      {a.adminNote && <p className="text-gray-600 text-[10px] italic">Admin note: {a.adminNote}</p>}
                      <p className="text-gray-700 text-[10px]">{timeAgo(a.createdAt)}{a.resolvedBy && ` · Resolved by ${a.resolvedBy}`}</p>
                    </div>
                    {isPending && (
                      <button onClick={() => { setSelectedAppeal(a); setAdminNote(""); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-400 text-[10px] font-bold rounded-lg transition-all shrink-0">
                        <FaEye size={8}/> Review
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {selectedAppeal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl" style={{ borderTop: "2px solid #a78bfa" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div><h3 className="text-white text-sm font-bold">Review Appeal</h3><p className="text-gray-500 text-[11px] mt-0.5">From {selectedAppeal.user?.username || "Anonymous"}</p></div>
              <button onClick={() => setSelectedAppeal(null)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white"><FaTimes size={12}/></button>
            </div>
            <div className="p-5 space-y-4">
              {selectedAppeal.comment && (
                <div className="p-3 bg-gray-800/60 border border-white/5 rounded-xl space-y-1">
                  <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">Rejected Comment</p>
                  <p className="text-gray-300 text-xs leading-relaxed">{selectedAppeal.comment.content}</p>
                  {selectedAppeal.comment.rejectionReason && <p className="text-red-400/60 text-[10px]">Rejection reason: {selectedAppeal.comment.rejectionReason}</p>}
                </div>
              )}
              <div className="p-3 bg-violet-500/5 border border-violet-500/15 rounded-xl">
                <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mb-1">User's Appeal Reason</p>
                <p className="text-gray-300 text-xs leading-relaxed">{selectedAppeal.reason}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin Note (optional)</label>
                <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={2} placeholder="Note about your decision..."
                  className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30"/>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-white/5 flex gap-3">
              <button onClick={() => handleResolve("DENIED")} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"><FaTimes size={10}/> Deny Appeal</button>
              <button onClick={() => handleResolve("APPROVED")} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"><FaCheck size={10}/> Approve & Restore</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// MAIN — stats first, then tabs (matches CommunicationHub layout)
// ════════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: "reports",   label: "Reported Content", icon: FaFlag         },
  { id: "behavior",  label: "User Behavior",    icon: FaUserShield   },
  { id: "automated", label: "Auto Moderation",  icon: FaRobot        },
  { id: "appeals",   label: "Appeal Process",   icon: FaBalanceScale },
];

const ContentModeration = () => {
  const [activeTab, setActiveTab] = useState("reports");
  const { data: statsData } = useGetModerationStatsQuery(undefined);
  const stats = statsData?.data;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">

        {/* Tab strip — same pill style and spacing as CommunicationHub */}
      <div className="grid grid-cols-4 bg-gray-900 border border-white/5 rounded-xl p-0.5 gap-0.5">
        {TABS.map(tab => {
          const Icon   = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
               className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] font-medium transition-colors w-full focus:outline-none select-none
                ${active
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-gray-500 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
            >
              <Icon size={11} className={active ? "text-cyan-400" : "text-gray-600"} />
              <span className="truncate hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Stats row — same structure as CommunicationHub */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Pending Reports" value={stats?.pendingReports}  color="text-yellow-400"  bg="bg-yellow-400/10 border-yellow-400/20"  icon={<FaFlag size={14} className="text-yellow-400"/>} />
        <StatCard label="Comment Queue"   value={stats?.pendingComments} color="text-cyan-400"    bg="bg-cyan-400/10 border-cyan-400/20"      icon={<FaComment size={14} className="text-cyan-400"/>} />
        <StatCard label="Pending Appeals" value={stats?.pendingAppeals}  color="text-violet-400"  bg="bg-violet-400/10 border-violet-400/20"  icon={<FaBalanceScale size={14} className="text-violet-400"/>} />
        <StatCard label="Warnings Issued" value={stats?.totalWarnings}   color="text-orange-400"  bg="bg-orange-400/10 border-orange-400/20"  icon={<FaExclamationTriangle size={14} className="text-orange-400"/>} />
      </div>

      {/* Tab content */}
      {activeTab === "reports"   && <ReportedContentTab />}
      {activeTab === "behavior"  && <UserBehaviorTab />}
      {activeTab === "automated" && <AutomatedModerationTab />}
      {activeTab === "appeals"   && <AppealProcessTab />}

      <ToastContainer position="top-right" autoClose={3000} theme="dark"
        toastClassName="!bg-gray-800 !border !border-white/10 !rounded-xl !text-sm !text-white shadow-2xl"/>
    </div>
  );
};

export default ContentModeration;