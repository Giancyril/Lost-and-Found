import { useEffect, useRef } from "react";
import { useLazyGetLeaderboardUserProfileQuery } from "../../redux/api/api";
import { calculateLevel } from "../../utils/leveling";
import {
  FaTrophy, FaStar, FaFire, FaMedal, FaTimes,
  FaUser, FaChartBar, FaSearch, FaBoxOpen,
} from "react-icons/fa";

// ── Tier config ───────────────────────────────────────────────────────────────
const TIER_CONFIG: Record<string, {
  badge: string;
  dot: string;
  label: string;
}> = {
  LEGEND: { badge: "bg-purple-500/10 text-purple-400 border-purple-500/20", dot: "bg-purple-400", label: "Legend" },
  PLATINUM: { badge: "bg-sky-500/10 text-sky-400 border-sky-500/20", dot: "bg-sky-400", label: "Platinum" },
  GOLD: { badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", dot: "bg-yellow-400", label: "Gold" },
  SILVER: { badge: "bg-gray-500/10 text-gray-400 border-gray-500/20", dot: "bg-gray-400", label: "Silver" },
  BRONZE: { badge: "bg-orange-500/10 text-orange-400 border-orange-500/20", dot: "bg-orange-400", label: "Bronze" },
};

const tierOf = (t: string) => TIER_CONFIG[t] ?? TIER_CONFIG.BRONZE;

// ── Rank accent helpers ───────────────────────────────────────────────────────
const rankAccent = (rank: number) => {
  if (rank === 1) return { icon: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" };
  if (rank === 2) return { icon: "text-slate-300", bg: "bg-slate-500/10", border: "border-slate-400/20" };
  if (rank === 3) return { icon: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" };
  return { icon: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" };
};

// ── Divider stat cell ─────────────────────────────────────────────────────────
const StatCell = ({
  icon,
  label,
  value,
  accent,
  noBorder,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
  noBorder?: boolean;
}) => (
  <div
    className={`flex flex-col items-center gap-1 py-3 flex-1 ${!noBorder ? "border-r border-white/[0.06]" : ""
      }`}
  >
    <div className={`text-sm ${accent}`}>{icon}</div>
    <p className={`text-sm font-semibold ${accent}`}>{value}</p>
    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</p>
  </div>
);

// ── Activity pill ─────────────────────────────────────────────────────────────
const ActivityPill = ({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
}) => (
  <div className="flex items-center gap-2 flex-1 min-w-0 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5">
    <div className={`shrink-0 ${accent}`}>{icon}</div>
    <div className="min-w-0">
      <p className={`text-sm font-semibold ${accent}`}>{value}</p>
      <p className="text-[9px] text-gray-500 uppercase tracking-wider truncate">{label}</p>
    </div>
  </div>
);

// ── Main modal ────────────────────────────────────────────────────────────────
interface Props {
  userId: string | null;
  rank: number;
  onClose: () => void;
}

export default function LeaderboardProfileModal({ userId, rank, onClose }: Props) {
  const [fetchProfile, { data: raw, isFetching, isUninitialized }] =
    useLazyGetLeaderboardUserProfileQuery();

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId) fetchProfile(userId);
  }, [userId, fetchProfile]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!userId) return null;

  const profile = raw?.data;
  const isLoading = isFetching || isUninitialized || !profile;

  const { level, rankTitle, progressPercent, nextLevelTotalXp } = profile
    ? calculateLevel(profile.totalPoints ?? 0)
    : { level: 1, rankTitle: "Novice Finder", progressPercent: 0, nextLevelTotalXp: 25 };

  const ra = rankAccent(rank);
  const initials = (profile?.name ?? "?")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const xpToNext = nextLevelTotalXp - (profile?.totalPoints ?? 0);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Card */}
      <div
        className="relative w-full max-w-sm bg-[#0d0f14] border border-white/[0.07] rounded-3xl shadow-2xl overflow-hidden overflow-y-auto"
        style={{ animation: "modalIn 0.28s cubic-bezier(0.34,1.4,0.64,1)", maxHeight: "90vh" }}
      >
        {/* Top accent bar */}
        <div
          className="h-[3px] w-full"
          style={{ background: "linear-gradient(90deg,#6d28d9,#8b5cf6,#38bdf8)" }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-10 w-7 h-7 flex items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <FaTimes size={11} />
        </button>

        {/* ── Loading skeleton ── */}
        {isLoading ? (
          <div className="p-5 space-y-4 animate-pulse">
            <div className="flex gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.06] shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3.5 bg-white/[0.06] rounded-lg w-2/3" />
                <div className="h-2.5 bg-white/[0.04] rounded-lg w-1/3" />
                <div className="flex gap-1.5 mt-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-5 w-16 bg-white/[0.04] rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full" />
            <div className="grid grid-cols-3 gap-0 border border-white/[0.06] rounded-2xl overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-white/[0.04]" />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-white/[0.04] rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-white/[0.04] rounded-2xl" />
              ))}
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4 pb-6">

            {/* ── Header ── */}
            <div className="flex items-start gap-3 pr-8">
              {/* Avatar */}
              <div className="relative shrink-0">
                {profile.userImg ? (
                  <img
                    src={profile.userImg}
                    alt={profile.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-1 ring-white/10"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-700/30 to-indigo-800/30 ring-1 ring-white/10 flex items-center justify-center">
                    <span className="text-lg font-semibold text-violet-200">{initials}</span>
                  </div>
                )}
                {/* Level chip */}
                <div className="absolute -bottom-1.5 -right-1.5 bg-[#0d0f14] border border-white/10 rounded-md px-1.5 py-0.5 flex items-center gap-0.5">
                  <span className="text-[9px] text-violet-500 font-semibold leading-none">LV</span>
                  <span className="text-[10px] text-violet-300 font-semibold leading-none">{level}</span>
                </div>
              </div>

              {/* Name + metadata */}
              <div className="flex-1 min-w-0 pt-0.5">
                <h2 className="text-white font-semibold text-sm leading-tight truncate">
                  {profile.name || "Student"}
                </h2>
                <p className="text-violet-400 text-[10px] font-semibold uppercase tracking-widest mt-0.5">
                  {rankTitle}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {profile.schoolId && (
                    <span className="font-mono text-[10px] text-gray-500 bg-white/[0.04] border border-white/[0.05] px-2 py-0.5 rounded-md">
                      {profile.schoolId}
                    </span>
                  )}
                  {profile.course && (
                    <span className="text-[10px] text-gray-400 bg-white/[0.04] border border-white/[0.05] px-2 py-0.5 rounded-md max-w-[120px] truncate">
                      {profile.course}
                    </span>
                  )}
                  {profile.yearLevel && (
                    <span className="text-[10px] text-gray-400 bg-white/[0.04] border border-white/[0.05] px-2 py-0.5 rounded-md">
                      {profile.yearLevel}
                    </span>
                  )}
                </div>
              </div>

              {/* Rank badge */}
              <div
                className={`shrink-0 flex flex-col items-center justify-center w-11 h-11 rounded-xl border ${ra.bg} ${ra.border}`}
              >
                {rank <= 3 ? (
                  <>
                    <FaMedal size={16} className={ra.icon} />
                    <span className={`text-[9px] font-semibold ${ra.icon} mt-0.5`}>
                      #{rank}
                    </span>
                  </>
                ) : (
                  <span className={`text-xs font-semibold ${ra.icon}`}>#{rank}</span>
                )}
              </div>
            </div>

            {/* ── XP bar ── */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                  Progress to Lv.{level + 1}
                </span>
                <span className="text-xs font-semibold text-gray-200">
                  {(profile.totalPoints ?? 0).toLocaleString()} XP
                </span>
              </div>
              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progressPercent}%`,
                    background: "linear-gradient(90deg,#6d28d9,#8b5cf6 60%,#38bdf8)",
                  }}
                />
              </div>
              {level < 100 && (
                <p className="text-[10px] text-gray-600 text-right">
                  {xpToNext.toLocaleString()} XP to go
                </p>
              )}
            </div>

            {/* ── Stats row (divider style) ── */}
            <div className="flex border border-white/[0.06] rounded-2xl overflow-hidden">
              <StatCell
                icon={<FaTrophy />}
                label="Rank"
                value={`#${rank}`}
                accent={ra.icon}
              />
              <StatCell
                icon={<FaChartBar />}
                label="30-day XP"
                value={(profile.monthlyPoints ?? 0).toLocaleString()}
                accent="text-sky-400"
              />
              <StatCell
                icon={<FaFire />}
                label="Streak"
                value={`${profile.loginStreak ?? 0}d`}
                accent={(profile.loginStreak ?? 0) >= 7 ? "text-orange-400" : "text-gray-500"}
                noBorder
              />
            </div>

            {/* ── Activity pills ── */}
            <div className="flex gap-2">
              <ActivityPill
                icon={<FaBoxOpen size={11} />}
                label="Items found"
                value={profile._count?.foundItem ?? 0}
                accent="text-emerald-400"
              />
              <ActivityPill
                icon={<FaSearch size={11} />}
                label="Reported"
                value={profile._count?.LostItem ?? 0}
                accent="text-amber-400"
              />
              <ActivityPill
                icon={<FaStar size={11} />}
                label="Badges"
                value={profile._count?.userAchievements ?? 0}
                accent="text-violet-400"
              />
            </div>

            {/* ── Achievements ── */}
            {profile.userAchievements?.length > 0 ? (
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2.5">
                  Achievements
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {profile.userAchievements.map((ua: any) => {
                    const t = tierOf(ua.achievement?.tier);
                    return (
                      <div
                        key={ua.id}
                        title={ua.achievement?.description}
                        className={`flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 border ${t.badge}`}
                      >
                        <span className="text-xl leading-none">{ua.achievement?.icon}</span>
                        <p className="text-[9px] font-semibold text-center leading-snug line-clamp-2">
                          {ua.achievement?.name}
                        </p>
                        <div className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
                          <span className="text-[8px] uppercase tracking-wider font-semibold opacity-70">
                            {t.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 py-4 opacity-30">
                <FaUser size={16} className="text-gray-500" />
                <p className="text-[10px] text-gray-500">No achievements yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);     }
        }
      `}</style>
    </div>
  );
}