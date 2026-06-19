import { useEffect, useRef } from "react";
import { useLazyGetLeaderboardUserProfileQuery } from "../../redux/api/api";
import { calculateLevel } from "../../utils/leveling";
import {
  FaTrophy, FaStar, FaFire, FaMedal, FaTimes,
  FaUser, FaChartBar, FaSearch, FaBoxOpen,
} from "react-icons/fa";

// ── Tier helpers ──────────────────────────────────────────────────────────────
const TIER_CONFIG: Record<string, { ring: string; glow: string; badge: string; label: string }> = {
  LEGEND:   { ring: "ring-purple-400",  glow: "shadow-purple-500/40",  badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",  label: "✦ Legend"   },
  PLATINUM: { ring: "ring-sky-300",     glow: "shadow-sky-400/40",     badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",           label: "◈ Platinum" },
  GOLD:     { ring: "ring-yellow-400",  glow: "shadow-yellow-500/40",  badge: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",  label: "◆ Gold"     },
  SILVER:   { ring: "ring-gray-300",    glow: "shadow-gray-400/30",    badge: "bg-gray-500/15 text-gray-300 border-gray-500/30",        label: "◇ Silver"   },
  BRONZE:   { ring: "ring-orange-400",  glow: "shadow-orange-500/30",  badge: "bg-orange-500/15 text-orange-300 border-orange-500/30", label: "○ Bronze"   },
};

const tierOf = (t: string) => TIER_CONFIG[t] ?? TIER_CONFIG.BRONZE;

const rankAccent = (rank: number) => {
  if (rank === 1) return { text: "text-yellow-400",  bg: "bg-yellow-500/10",  border: "border-yellow-500/20" };
  if (rank === 2) return { text: "text-slate-300",   bg: "bg-slate-500/10",   border: "border-slate-400/20"  };
  if (rank === 3) return { text: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/20" };
  return               { text: "text-violet-400",   bg: "bg-violet-500/10",  border: "border-violet-500/20" };
};

// ── Mini stat pill ────────────────────────────────────────────────────────────
const Stat = ({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: string | number; accent: string;
}) => (
  <div className="flex flex-col items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3 flex-1">
    <div className={`text-base ${accent}`}>{icon}</div>
    <p className={`text-sm font-black ${accent}`}>{value}</p>
    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{label}</p>
  </div>
);

// ── Main modal ────────────────────────────────────────────────────────────────
interface Props {
  userId: string | null;
  rank:   number;
  onClose: () => void;
}

export default function LeaderboardProfileModal({ userId, rank, onClose }: Props) {
  const [fetchProfile, { data: raw, isFetching, isUninitialized }] =
    useLazyGetLeaderboardUserProfileQuery();

  const overlayRef = useRef<HTMLDivElement>(null);

  // Fetch when userId changes
  useEffect(() => {
    if (userId) fetchProfile(userId);
  }, [userId, fetchProfile]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!userId) return null;

  const profile = raw?.data;
  const isLoading = isFetching || isUninitialized || !profile;

  const { level, rankTitle, progressPercent, nextLevelTotalXp } =
    profile ? calculateLevel(profile.totalPoints ?? 0) : { level: 1, rankTitle: "Novice Finder", progressPercent: 0, nextLevelTotalXp: 25 };

  const ra = rankAccent(rank);
  const initials = (profile?.name ?? "?")
    .split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    /* Overlay */
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Card */}
      <div
        className="relative w-full max-w-md bg-[#0f1117] border border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden"
        style={{ animation: "profileSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        {/* ── Top gradient strip ── */}
        <div
          className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(180deg, rgba(139,92,246,0.18) 0%, transparent 100%)" }}
        />

        {/* ── Close button ── */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.06] hover:bg-white/10 text-gray-400 hover:text-white transition-all"
        >
          <FaTimes size={12} />
        </button>

        {isLoading ? (
          /* Skeleton */
          <div className="p-6 space-y-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.06]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/[0.06] rounded-lg w-3/4" />
                <div className="h-3 bg-white/[0.04] rounded-lg w-1/2" />
              </div>
            </div>
            <div className="h-2 bg-white/[0.06] rounded-full" />
            <div className="grid grid-cols-3 gap-2">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-white/[0.04] rounded-2xl" />)}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-white/[0.04] rounded-2xl" />)}
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">

            {/* ── Header: Avatar + Name + Rank badge ── */}
            <div className="flex items-start gap-4 pr-8">
              {/* Avatar */}
              <div className="relative shrink-0">
                {profile.userImg ? (
                  <img
                    src={profile.userImg}
                    alt={profile.name}
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-violet-500/30"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/40 to-indigo-700/40 ring-2 ring-violet-500/30 flex items-center justify-center">
                    <span className="text-xl font-black text-violet-200">{initials}</span>
                  </div>
                )}
                {/* Level badge overlay */}
                <div className="absolute -bottom-1.5 -right-1.5 bg-[#0f1117] border border-violet-500/30 rounded-lg px-1.5 py-0.5 flex items-center gap-0.5">
                  <span className="text-[9px] font-black text-violet-400 leading-none">LVL</span>
                  <span className="text-[11px] font-black text-violet-300 leading-none">{level}</span>
                </div>
              </div>

              {/* Name + meta */}
              <div className="flex-1 min-w-0 pt-0.5">
                <h2 className="text-white font-black text-base leading-tight truncate">{profile.name || "Student"}</h2>
                <p className="text-violet-300 text-[11px] font-bold uppercase tracking-wider mt-0.5">{rankTitle}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {profile.schoolId && (
                    <span className="text-[10px] font-mono text-gray-500 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-lg">
                      {profile.schoolId}
                    </span>
                  )}
                  {profile.course && (
                    <span className="text-[10px] text-gray-400 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-lg truncate max-w-[130px]">
                      {profile.course}
                    </span>
                  )}
                  {profile.yearLevel && (
                    <span className="text-[10px] text-gray-400 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-lg">
                      {profile.yearLevel}
                    </span>
                  )}
                </div>
              </div>

              {/* Rank badge */}
              <div className={`shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-2xl border ${ra.bg} ${ra.border} mt-0.5`}>
                {rank <= 3
                  ? <FaMedal size={18} className={ra.text} />
                  : <span className={`text-xs font-black ${ra.text}`}>#{rank}</span>
                }
                {rank <= 3 && <span className={`text-[9px] font-black ${ra.text} mt-0.5`}>#{rank}</span>}
              </div>
            </div>

            {/* ── XP Progress bar ── */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">XP Progress to Lv.{level + 1}</span>
                <span className="text-[11px] font-black text-yellow-400">{(profile.totalPoints ?? 0).toLocaleString()} XP</span>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progressPercent}%`,
                    background: "linear-gradient(90deg, #7c3aed, #a78bfa, #38bdf8)"
                  }}
                />
              </div>
              {level < 100 && (
                <p className="text-[10px] text-gray-600 text-right">
                  {(nextLevelTotalXp - (profile.totalPoints ?? 0)).toLocaleString()} XP to Level {level + 1}
                </p>
              )}
            </div>

            {/* ── Stats row ── */}
            <div className="flex gap-2">
              <Stat
                icon={<FaTrophy />}
                label="Campus Rank"
                value={`#${rank}`}
                accent={ra.text}
              />
              <Stat
                icon={<FaChartBar />}
                label="30-Day XP"
                value={(profile.monthlyPoints ?? 0).toLocaleString()}
                accent="text-blue-400"
              />
              <Stat
                icon={<FaFire />}
                label="Streak"
                value={`${profile.loginStreak ?? 0}d`}
                accent={(profile.loginStreak ?? 0) >= 7 ? "text-orange-400" : "text-gray-400"}
              />
            </div>

            {/* ── Activity counters ── */}
            <div className="flex gap-2">
              <div className="flex items-center gap-2 flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2">
                <FaBoxOpen size={11} className="text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-black text-emerald-400">{profile._count?.foundItem ?? 0}</p>
                  <p className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold">Items Found</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2">
                <FaSearch size={11} className="text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-black text-amber-400">{profile._count?.LostItem ?? 0}</p>
                  <p className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold">Items Reported</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2">
                <FaStar size={11} className="text-violet-400 shrink-0" />
                <div>
                  <p className="text-xs font-black text-violet-400">{profile._count?.userAchievements ?? 0}</p>
                  <p className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold">Achievements</p>
                </div>
              </div>
            </div>

            {/* ── Pinned Achievements ── */}
            {profile.userAchievements?.length > 0 ? (
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-2">
                  📌 Showcased Achievements
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {profile.userAchievements.map((ua: any) => {
                    const t = tierOf(ua.achievement?.tier);
                    return (
                      <div
                        key={ua.id}
                        className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2.5 border ${t.badge} ring-1 ${t.ring} shadow-lg ${t.glow}`}
                        title={ua.achievement?.description}
                      >
                        <span className="text-xl leading-none">{ua.achievement?.icon}</span>
                        <p className="text-[9px] font-bold text-center leading-tight line-clamp-2">
                          {ua.achievement?.name}
                        </p>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-black/20`}>
                          {t.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 py-3 opacity-40">
                <FaUser size={18} className="text-gray-600" />
                <p className="text-[10px] text-gray-600">No pinned achievements yet</p>
              </div>
            )}

          </div>
        )}
      </div>

      <style>{`
        @keyframes profileSlideUp {
          from { opacity: 0; transform: scale(0.92) translateY(16px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);     }
        }
      `}</style>
    </div>
  );
}
