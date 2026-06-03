import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch, FaTimes, FaBoxOpen, FaExclamationTriangle, FaClipboardList,
  FaTachometerAlt, FaChartLine, FaQrcode, FaCog, FaShieldAlt,
  FaFileAlt, FaArchive, FaBullhorn, FaMedal, FaFlag, FaUserGraduate,
  FaTrophy, FaMapMarkedAlt, FaUserShield, FaChevronRight,
  FaKeyboard, FaAward, FaClock
} from "react-icons/fa";
import { useGetFoundItemsQuery, useGetLostItemsQuery, useGetAllClaimsQuery } from "../../redux/api/api";

// ── Dashboard pages index ─────────────────────────────────────────────────────
const PAGES = [
  { title: "Overview",           subtitle: "Dashboard home",               path: "/dashboard",                    icon: FaTachometerAlt,   color: "text-blue-400" },
  { title: "Recognition Feed",   subtitle: "Manage recognition posts",     path: "/dashboard/virtue-spotlight",   icon: FaAward,           color: "text-pink-400" },
  { title: "Batch Entry",        subtitle: "AI-powered item scanner",      path: "/dashboard/bulk-scanner",       icon: FaQrcode,          color: "text-violet-400" },
  { title: "Lost Items",         subtitle: "Track lost item reports",      path: "/dashboard/lost-items",         icon: FaExclamationTriangle, color: "text-orange-400" },
  { title: "Found Items",        subtitle: "Manage recovered items",       path: "/dashboard/found-items",        icon: FaBoxOpen,         color: "text-cyan-400" },
  { title: "Claims",             subtitle: "Review ownership claims",      path: "/dashboard/claims",             icon: FaClipboardList,   color: "text-yellow-400" },
  { title: "Archive Log",        subtitle: "Browse archived items",        path: "/dashboard/archive",            icon: FaArchive,         color: "text-gray-400" },
  { title: "Analytics",          subtitle: "Trends and performance",       path: "/dashboard/analytics",          icon: FaChartLine,       color: "text-emerald-400" },
  { title: "Heatmap",            subtitle: "Location-based visualization", path: "/dashboard/heatmap",            icon: FaMapMarkedAlt,    color: "text-red-400" },
  { title: "Communication Hub",  subtitle: "Announcements and tickets",    path: "/dashboard/comm-hub",           icon: FaBullhorn,        color: "text-sky-400" },
  { title: "Achievements",       subtitle: "Badge distribution",           path: "/dashboard/achievements",       icon: FaMedal,           color: "text-amber-400" },
  { title: "Content Moderation", subtitle: "Flagged content review",       path: "/dashboard/moderation",         icon: FaFlag,            color: "text-rose-400" },
  { title: "Students",           subtitle: "Student accounts",             path: "/dashboard/students",           icon: FaUserGraduate,    color: "text-indigo-400" },
  { title: "Leaderboard",        subtitle: "Top community contributors",   path: "/dashboard/leaderboard",        icon: FaTrophy,          color: "text-yellow-300" },
  { title: "Report",             subtitle: "Generate summary reports",     path: "/dashboard/report",             icon: FaFileAlt,         color: "text-slate-400" },
  { title: "Security",           subtitle: "Monitor login activity",       path: "/dashboard/security",           icon: FaShieldAlt,       color: "text-green-400" },
  { title: "Audit Logs",         subtitle: "Administrative action trail",  path: "/dashboard/audit-logs",         icon: FaClipboardList,   color: "text-purple-400" },
  { title: "Accounts",           subtitle: "Manage system users",          path: "/dashboard/users",              icon: FaUserShield,      color: "text-blue-300" },
  { title: "Categories",         subtitle: "Organize item categories",     path: "/dashboard/categories",         icon: FaBoxOpen,         color: "text-teal-400" },
  { title: "Settings",           subtitle: "System preferences",           path: "/dashboard/settings",           icon: FaCog,             color: "text-gray-300" },
];

interface SearchResult {
  id: string;
  type: "page" | "found" | "lost" | "claim";
  title: string;
  subtitle: string;
  path: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  badge?: string;
  badgeColor?: string;
}

// ── Highlight matching text ───────────────────────────────────────────────────
const Highlight = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-cyan-400/25 text-cyan-300 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </span>
  );
};

// ── Keyboard shortcut badge ───────────────────────────────────────────────────
const KbdBadge = ({ children }: { children: string }) => (
  <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-400 text-[10px] font-mono font-semibold">
    {children}
  </kbd>
);

// ── Main Modal ────────────────────────────────────────────────────────────────
interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
}

// ── Recent searches localStorage helpers ─────────────────────────────────────
const RECENT_KEY = "gsearch_recent";
const MAX_RECENT = 6;

interface RecentEntry {
  id: string;
  title: string;
  subtitle: string;
  path: string;
  iconType: "page" | "found" | "lost" | "claim";
  savedAt: number;
}

const loadRecent = (): RecentEntry[] => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); }
  catch { return []; }
};

const saveRecent = (entry: RecentEntry) => {
  const prev = loadRecent().filter(r => r.id !== entry.id);
  localStorage.setItem(RECENT_KEY, JSON.stringify([entry, ...prev].slice(0, MAX_RECENT)));
};

const removeRecent = (id: string) => {
  localStorage.setItem(RECENT_KEY, JSON.stringify(loadRecent().filter(r => r.id !== id)));
};

const clearAllRecent = () => localStorage.removeItem(RECENT_KEY);

// ── Main Modal ────────────────────────────────────────────────────────────────
const GlobalSearchModal = ({ open, onClose }: GlobalSearchModalProps) => {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [recentSearches, setRecentSearches] = useState<RecentEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: foundData } = useGetFoundItemsQuery({ limit: 200, sortBy: "createdAt", sortOrder: "desc" }, { skip: !open });
  const { data: lostData }  = useGetLostItemsQuery(  { limit: 200, sortBy: "createdAt", sortOrder: "desc" }, { skip: !open });
  const { data: claimsData } = useGetAllClaimsQuery(undefined, { skip: !open });

  // Build results list
  const results: SearchResult[] = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: SearchResult[] = [];

    // Pages
    PAGES.filter(p =>
      p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q)
    ).slice(0, 5).forEach(p => {
      const Icon = p.icon;
      out.push({ id: `page-${p.path}`, type: "page", title: p.title, subtitle: p.subtitle, path: p.path, icon: Icon, iconColor: p.color });
    });

    // Found items
    const foundArr: any[] = Array.isArray((foundData as any)?.data) ? (foundData as any).data : [];
    foundArr.filter(i =>
      i.foundItemName?.toLowerCase().includes(q) ||
      i.location?.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q)
    ).slice(0, 5).forEach(i => {
      out.push({
        id: `found-${i.id}`,
        type: "found",
        title: i.foundItemName || "Found Item",
        subtitle: `Found at ${i.location || "unknown"}`,
        path: `/foundItems/${i.id}`,
        icon: FaBoxOpen,
        iconColor: "text-cyan-400",
        badge: i.isClaimed ? "Claimed" : "Available",
        badgeColor: i.isClaimed ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-blue-500/15 text-blue-400 border-blue-500/20",
      });
    });

    // Lost items
    const lostArr: any[] = Array.isArray((lostData as any)?.data) ? (lostData as any).data : [];
    lostArr.filter(i =>
      i.lostItemName?.toLowerCase().includes(q) ||
      i.location?.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q)
    ).slice(0, 5).forEach(i => {
      out.push({
        id: `lost-${i.id}`,
        type: "lost",
        title: i.lostItemName || "Lost Item",
        subtitle: `Lost at ${i.location || "unknown"}`,
        path: `/lostItems/${i.id}`,
        icon: FaExclamationTriangle,
        iconColor: "text-orange-400",
        badge: i.isFound ? "Found" : "Missing",
        badgeColor: i.isFound ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-red-500/15 text-red-400 border-red-500/20",
      });
    });

    // Claims
    const claimsArr: any[] = Array.isArray((claimsData as any)?.data)
      ? (claimsData as any).data
      : Array.isArray(claimsData)
      ? claimsData as any[]
      : [];
    claimsArr.filter((c: any) =>
      c.claimantName?.toLowerCase().includes(q) ||
      c.foundItem?.foundItemName?.toLowerCase().includes(q) ||
      c.schoolEmail?.toLowerCase().includes(q)
    ).slice(0, 4).forEach((c: any) => {
      out.push({
        id: `claim-${c.id}`,
        type: "claim",
        title: c.foundItem?.foundItemName ? `Claim: ${c.foundItem.foundItemName}` : "Claim",
        subtitle: `By ${c.claimantName || "Anonymous"} · ${c.status}`,
        path: `/dashboard/claims`,
        icon: FaClipboardList,
        iconColor: "text-yellow-400",
        badge: c.status,
        badgeColor: c.status === "APPROVED"
          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
          : c.status === "REJECTED"
          ? "bg-red-500/15 text-red-400 border-red-500/20"
          : "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
      });
    });

    return out;
  })();

  // Group results
  const groups: { label: string; items: SearchResult[] }[] = [];
  const pageResults  = results.filter(r => r.type === "page");
  const foundResults = results.filter(r => r.type === "found");
  const lostResults  = results.filter(r => r.type === "lost");
  const claimResults = results.filter(r => r.type === "claim");
  if (pageResults.length)  groups.push({ label: "Pages", items: pageResults });
  if (foundResults.length) groups.push({ label: "Found Items", items: foundResults });
  if (lostResults.length)  groups.push({ label: "Lost Items", items: lostResults });
  if (claimResults.length) groups.push({ label: "Claims", items: claimResults });

  const flatResults = groups.flatMap(g => g.items);

  // Load recent searches when modal opens
  useEffect(() => {
    if (open) setRecentSearches(loadRecent());
  }, [open]);

  // Navigation — also persists to recent searches
  const navigate_ = useCallback((result: SearchResult) => {
    const entry: RecentEntry = {
      id: result.id,
      title: result.title,
      subtitle: result.subtitle,
      path: result.path,
      iconType: result.type,
      savedAt: Date.now(),
    };
    saveRecent(entry);
    setRecentSearches(loadRecent());
    onClose();
    navigate(result.path);
  }, [navigate, onClose]);

  useEffect(() => { setSelectedIdx(0); }, [query]);

  // Keyboard handling
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, flatResults.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && flatResults[selectedIdx]) { navigate_(flatResults[selectedIdx]); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, flatResults, selectedIdx, navigate_, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  // Focus input when opened
  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50); setQuery(""); setSelectedIdx(0); setRecentSearches(loadRecent()); }
  }, [open]);

  // Icon resolver for recent entries
  const recentIconMap: Record<string, { icon: React.ComponentType<any>; color: string }> = {
    page:  { icon: FaChevronRight,       color: "text-blue-400"   },
    found: { icon: FaBoxOpen,            color: "text-cyan-400"   },
    lost:  { icon: FaExclamationTriangle, color: "text-orange-400" },
    claim: { icon: FaClipboardList,      color: "text-yellow-400" },
  };

  if (!open) return null;

  const showEmpty  = query.trim() && flatResults.length === 0;
  const showHelp   = !query.trim();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-x-4 top-[10vh] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-2xl z-50 max-h-[80vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Global search"
      >
        <div className="flex flex-col bg-gray-900/95 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 backdrop-blur-xl overflow-hidden">

          {/* Search input row */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5">
            <FaSearch size={14} className="text-gray-500 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search items, claims, or navigate to a page…"
              className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-gray-600 hover:text-gray-400 transition-colors">
                <FaTimes size={12} />
              </button>
            )}
            <KbdBadge>Esc</KbdBadge>
          </div>

          {/* Results */}
          <div ref={listRef} className="overflow-y-auto max-h-[55vh] custom-scrollbar">
            {/* Empty query — show recent searches + quick-nav tiles */}
            {showHelp && (
              <div className="p-4 space-y-4">

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Recent Searches</p>
                      <button
                        onClick={() => { clearAllRecent(); setRecentSearches([]); }}
                        className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors font-medium"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="space-y-0.5">
                      {recentSearches.map(entry => {
                        const meta = recentIconMap[entry.iconType] ?? recentIconMap.page;
                        const Icon = meta.icon;
                        return (
                          <div
                            key={entry.id}
                            className="group flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.05] transition-all"
                          >
                            {/* Clock icon */}
                            <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                              <FaClock size={11} className="text-gray-600" />
                            </div>

                            {/* Text — click navigates */}
                            <button
                              className="flex-1 min-w-0 text-left"
                              onClick={() => { navigate(entry.path); onClose(); }}
                            >
                              <p className="text-gray-300 text-xs font-medium truncate group-hover:text-white transition-colors">{entry.title}</p>
                              <p className="text-gray-600 text-[10px] truncate mt-0.5">{entry.subtitle}</p>
                            </button>

                            {/* Type badge */}
                            <div className="shrink-0 w-6 h-6 rounded-lg bg-white/[0.04] flex items-center justify-center">
                              <Icon size={10} className={meta.color} />
                            </div>

                            {/* Remove button */}
                            <button
                              onClick={() => { removeRecent(entry.id); setRecentSearches(loadRecent()); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-700 hover:text-gray-400"
                              title="Remove"
                            >
                              <FaTimes size={10} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quick Navigation */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Quick Navigation</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PAGES.slice(0, 9).map(p => {
                      const Icon = p.icon;
                      return (
                        <button
                          key={p.path}
                          onClick={() => { onClose(); navigate(p.path); }}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-left transition-all group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                            <Icon size={12} className={p.color} />
                          </div>
                          <span className="text-gray-300 text-xs font-medium group-hover:text-white transition-colors truncate">{p.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* No results */}
            {showEmpty && (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                  <FaSearch size={18} className="text-gray-700" />
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm font-semibold">No results for "<span className="text-white">{query}</span>"</p>
                  <p className="text-gray-600 text-xs mt-1">Try a different search term or browse pages above.</p>
                </div>
              </div>
            )}

            {/* Grouped results */}
            {groups.map(group => {
              const globalOffset = groups.slice(0, groups.indexOf(group)).reduce((acc, g) => acc + g.items.length, 0);
              return (
                <div key={group.label}>
                  <p className="px-4 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600">{group.label}</p>
                  {group.items.map((result, i) => {
                    const absIdx = globalOffset + i;
                    const isSelected = absIdx === selectedIdx;
                    const Icon = result.icon;
                    return (
                      <button
                        key={result.id}
                        data-idx={absIdx}
                        onClick={() => navigate_(result)}
                        onMouseEnter={() => setSelectedIdx(absIdx)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${isSelected ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"}`}
                      >
                        {/* Icon */}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${isSelected ? "bg-white/10 border border-white/10" : "bg-white/5"}`}>
                          <Icon size={13} className={result.iconColor} />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold truncate transition-colors ${isSelected ? "text-white" : "text-gray-300"}`}>
                            <Highlight text={result.title} query={query} />
                          </p>
                          <p className="text-gray-600 text-[11px] truncate mt-0.5">
                            <Highlight text={result.subtitle} query={query} />
                          </p>
                        </div>

                        {/* Badge */}
                        {result.badge && (
                          <span className={`shrink-0 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${result.badgeColor}`}>
                            {result.badge}
                          </span>
                        )}

                        {/* Arrow */}
                        {isSelected && <FaChevronRight size={9} className="text-gray-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Footer hints */}
          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/5 bg-white/[0.015]">
            <div className="flex items-center gap-1.5 text-gray-600 text-[10px]">
              <KbdBadge>↑</KbdBadge>
              <KbdBadge>↓</KbdBadge>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 text-[10px]">
              <KbdBadge>↵</KbdBadge>
              <span>Open</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 text-[10px]">
              <KbdBadge>Esc</KbdBadge>
              <span>Close</span>
            </div>
            <div className="ml-auto flex items-center gap-1 text-gray-700 text-[10px]">
              <FaKeyboard size={9} />
              <span>Ctrl+K</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GlobalSearchModal;
