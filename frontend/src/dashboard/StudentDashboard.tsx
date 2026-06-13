import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useUserVerification } from "../auth/auth";
import {
  FaTrophy, FaStar, FaBoxOpen, FaClipboardList, FaCheckCircle,
  FaTimesCircle, FaClock, FaMedal, FaSearch, FaArrowRight,
  FaChartLine, FaHistory, FaMapMarkerAlt, FaCalendarAlt,
  FaBolt, FaChevronRight, FaUser, FaHeart, FaSun, FaAward,
  FaShareAlt, FaFire,
} from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import { calculateLevel } from "../utils/leveling";
import { toast } from "react-toastify";

import { FaBell } from "react-icons/fa";
import {
  useGetMyPointsQuery,
  useGetMyFoundItemQuery,
  useGetMyLostItemQuery,
  useMyClaimsQuery,
  useGetLeaderboardQuery,
  useGetMyRankQuery,
} from "../redux/api/api";
import { baseApi } from "../redux/api/baseApi";
import WeeklyBountiesWidget from "../components/gamification/WeeklyBountiesWidget";
import GamificationWidget from "../components/gamification/GamificationWidget";

const achievementApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getMyAchievements: b.query({
      query: () => ({ url: "/achievements/my", method: "GET" }),
      providesTags: ["achievements"],
    }),
    markAchievementsSeen: b.mutation({
      query: () => ({ url: "/achievements/mark-seen", method: "POST" }),
      invalidatesTags: ["achievements"],
    }),
  }),
  overrideExisting: false,
});

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const STATUS_STYLE: Record<
  string,
  { dot: string; text: string; bg: string; border: string }
> = {
  APPROVED: {
    dot: "bg-emerald-400",
    text: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
  },
  PENDING: {
    dot: "bg-yellow-400",
    text: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/20",
  },
  REJECTED: {
    dot: "bg-red-400",
    text: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
  },
};

const medalColor = (i: number) =>
  i === 0
    ? "text-yellow-400 border-yellow-500/40 bg-yellow-500/10"
    : i === 1
      ? "text-gray-300 border-gray-500/40 bg-gray-500/10"
      : "text-amber-600 border-amber-700/40 bg-amber-700/10";

type TabKey = "timeline" | "claims" | "found" | "lost" | "points";
const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "timeline", label: "Timeline", icon: <FaHistory size={11} /> },
  { key: "claims", label: "Claims", icon: <FaClipboardList size={11} /> },
  { key: "found", label: "Found Reports", icon: <FaBoxOpen size={11} /> },
  { key: "lost", label: "Lost Reports", icon: <FaSearch size={11} /> },
  { key: "points", label: "Points", icon: <FaStar size={11} /> },
];

// ── Podium ────────────────────────────────────────────────────────────────────
const Podium = ({
  top3,
  currentUserId,
}: {
  top3: any[];
  currentUserId: string;
}) => {
  const order = [top3[1], top3[0], top3[2]];
  const heights = ["h-20", "h-28", "h-16"];
  const labels = ["2nd", "1st", "3rd"];
  const rings = [
    "border-gray-400/50 bg-gray-500/10",
    "border-yellow-400/60 bg-yellow-500/10",
    "border-amber-600/50 bg-amber-700/10",
  ];
  const nameColors = ["text-gray-300", "text-yellow-400", "text-amber-500"];
  const blockBgs = [
    "bg-gray-800/60 border-gray-600/20",
    "bg-yellow-900/20 border-yellow-600/20",
    "bg-amber-900/20 border-amber-700/20",
  ];
  const labelColors = [
    "text-gray-400",
    "text-yellow-400",
    "text-amber-600",
  ];

  return (
    <div className="flex items-end justify-center gap-3 px-4 pt-4 pb-2">
      {order.map((u, vi) => {
        if (!u) return <div key={vi} className="flex-1" />;
        const isMe = u.id === currentUserId;
        return (
          <div
            key={u.id}
            className="flex-1 flex flex-col items-center gap-1.5"
          >
            <div
              className={`w-10 h-10 rounded-full border-2 ${rings[vi]} flex items-center justify-center`}
            >
              <FaUser size={14} className={nameColors[vi]} />
            </div>
            <p
              className={`text-[10px] font-bold uppercase tracking-wide text-center truncate w-full px-1 ${nameColors[vi]}`}
            >
              {isMe ? "You" : u.name?.split(" ")[0] || "Student"}
            </p>
            <p className={`text-xs font-black ${nameColors[vi]}`}>
              {u.totalPoints}
            </p>
            <div
              className={`w-full ${heights[vi]} rounded-t-xl border ${blockBgs[vi]} flex items-center justify-center`}
            >
              <span className={`text-xs font-black ${labelColors[vi]}`}>
                {labels[vi]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Tier badge color helper ───────────────────────────────────────────────────
const getTierColor = (tier: string) => {
  switch (tier) {
    case "BRONZE":
      return "border-amber-700 bg-amber-900/10 text-amber-500";
    case "SILVER":
      return "border-gray-500 bg-gray-500/10 text-gray-300";
    case "GOLD":
      return "border-yellow-400 bg-yellow-400/10 text-yellow-400";
    case "PLATINUM":
      return "border-cyan-400 bg-cyan-400/10 text-cyan-400";
    case "LEGEND":
      return "border-purple-500 bg-purple-500/10 text-purple-400";
    default:
      return "border-white/10 bg-white/5 text-white";
  }
};

const getTierTextColor = (tier: string) => {
  switch (tier) {
    case "BRONZE": return "text-amber-500";
    case "SILVER": return "text-gray-400";
    case "GOLD": return "text-yellow-400";
    case "PLATINUM": return "text-cyan-400";
    case "LEGEND": return "text-purple-400";
    default: return "text-gray-500";
  }
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const user: any = useUserVerification();
  const [tab, setTab] = useState<TabKey>("timeline");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const isLoggedIn = !!user?.id;

  const { data: pointsData, isLoading: p1 } = useGetMyPointsQuery(undefined, {
    skip: !isLoggedIn,
  });
  const { data: foundData, isLoading: p2 } = useGetMyFoundItemQuery(
    undefined,
    { skip: !isLoggedIn }
  );
  const { data: lostData, isLoading: p3 } = useGetMyLostItemQuery(undefined, {
    skip: !isLoggedIn,
  });
  const { data: claimsData, isLoading: p4 } = useMyClaimsQuery(undefined, {
    skip: !isLoggedIn,
  });
  const { data: boardData, isLoading: p5 } = useGetLeaderboardQuery(undefined);
  const { data: achievementData, isLoading: p6 } = (
    achievementApi as any
  ).useGetMyAchievementsQuery(undefined, { skip: !isLoggedIn });
  const [markSeen] = (achievementApi as any).useMarkAchievementsSeenMutation();
  const { data: myRankData } = useGetMyRankQuery(undefined, { skip: !isLoggedIn });

  const loading = p1 || p2 || p3 || p4 || p5 || p6;
  const totalPoints = pointsData?.data?.totalPoints ?? 0;
  const pointsHistory = pointsData?.data?.history ?? [];
  const foundItems = foundData?.data ?? [];
  const lostItems = lostData?.data ?? [];
  const claims = claimsData?.data ?? [];
  const board = boardData?.data ?? [];
  const myAchievements = achievementData?.data ?? [];

  const streak = pointsData?.data?.streak ?? {
    currentStreak: 0,
    isOnARoll: false,
  };
  const loginStreak: number = pointsData?.data?.loginStreak ?? 0;
  const boostEvent: any = pointsData?.data?.boostEvent ?? null;
  const rankDelta: number | null = myRankData?.data?.delta ?? null;

  const { level: xpLevel, rankTitle, progressPercent } = calculateLevel(totalPoints);

  // Top 3 badges
  const top3Badges = React.useMemo(() => {
    const pinned = myAchievements.filter((a: any) => a.isPinned);
    if (pinned.length >= 3) return pinned.slice(0, 3);
    const unpinned = myAchievements.filter((a: any) => !a.isPinned);
    const tierPriority: Record<string, number> = {
      LEGEND: 5, PLATINUM: 4, GOLD: 3, SILVER: 2, BRONZE: 1,
    };
    const sortedUnpinned = [...unpinned].sort((a: any, b: any) => {
      const aTier = tierPriority[a.achievement?.tier] ?? 0;
      const bTier = tierPriority[b.achievement?.tier] ?? 0;
      if (bTier !== aTier) return bTier - aTier;
      return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
    });
    return [...pinned, ...sortedUnpinned].slice(0, 3);
  }, [myAchievements]);

  // Canvas share card
  const downloadShareCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    const tierColor = (tier: string) => {
      switch (tier) {
        case "LEGEND": return "#a855f7";
        case "PLATINUM": return "#22d3ee";
        case "GOLD": return "#eab308";
        case "SILVER": return "#9ca3af";
        default: return "#d97706";
      }
    };

    const tierLabel = (tier: string) => {
      switch (tier) {
        case "LEGEND": return "[LEGEND]";
        case "PLATINUM": return "[PLATINUM]";
        case "GOLD": return "[GOLD]";
        case "SILVER": return "[SILVER]";
        default: return "[BRONZE]";
      }
    };

    const gradient = ctx.createLinearGradient(0, 0, 600, 420);
    gradient.addColorStop(0, "#0b0f19");
    gradient.addColorStop(1, "#111827");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 420);

    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 300);
    glow.addColorStop(0, "rgba(34,211,238,0.07)");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 600, 420);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1.5;
    roundRect(4, 4, 592, 412, 16);
    ctx.stroke();

    ctx.fillStyle = "rgba(34,211,238,0.06)";
    ctx.fillRect(0, 0, 600, 36);
    ctx.fillStyle = "#22d3ee";
    ctx.font = "bold 9px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("CAMPUS HONOR REGISTRY", 24, 18);
    ctx.fillStyle = "#4b5563";
    ctx.font = "8px Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("LOST & FOUND PORTAL", 576, 18);

    ctx.beginPath();
    ctx.arc(68, 108, 34, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(37, 99, 235, 0.18)";
    ctx.fill();
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText((user?.name || "S").charAt(0).toUpperCase(), 68, 108);

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 17px Arial, sans-serif";
    const displayName = user?.name || "Verified Student";
    ctx.fillText(
      displayName.length > 28 ? displayName.substring(0, 26) + "..." : displayName,
      118, 68
    );

    ctx.fillStyle = "#6b7280";
    ctx.font = "11px Arial, sans-serif";
    ctx.fillText(user?.email || "", 118, 92);

    ctx.fillStyle = "rgba(34,211,238,0.08)";
    roundRect(118, 114, 108, 18, 9);
    ctx.fill();
    ctx.strokeStyle = "rgba(34,211,238,0.2)";
    ctx.lineWidth = 0.8;
    roundRect(118, 114, 108, 18, 9);
    ctx.stroke();
    ctx.fillStyle = "#22d3ee";
    ctx.font = "bold 8px Arial, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText("* HONEST CITIZEN", 128, 123);

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 13px Arial, sans-serif";
    ctx.fillText(`Lv.${xpLevel}  ${rankTitle}`, 340, 68);

    ctx.fillStyle = "#9ca3af";
    ctx.font = "bold 10px Arial, sans-serif";
    ctx.fillText(`${totalPoints} Total XP`, 340, 90);

    if (streak.currentStreak > 0) {
      ctx.fillStyle = streak.isOnARoll ? "#10b981" : "#f97316";
      ctx.font = "bold 10px Arial, sans-serif";
      ctx.fillText(
        `${streak.currentStreak}-Day Streak${streak.isOnARoll ? "  [ON A ROLL!]" : ""}`,
        340, 116
      );
    }

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(24, 152);
    ctx.lineTo(576, 152);
    ctx.stroke();

    ctx.fillStyle = "#6b7280";
    ctx.font = "bold 8px Arial, sans-serif";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillText("FEATURED BADGES", 24, 164);

    if (top3Badges.length === 0) {
      ctx.fillStyle = "#374151";
      ctx.font = "11px Arial, sans-serif";
      ctx.fillText("No badges unlocked yet", 24, 185);
    } else {
      top3Badges.forEach((badge: any, idx: number) => {
        const bx = 24 + idx * 186;
        const by = 182;
        const bw = 174;
        const bh = 88;
        const tier = badge.achievement?.tier || "BRONZE";
        const col = tierColor(tier);

        ctx.fillStyle = "rgba(255,255,255,0.02)";
        roundRect(bx, by, bw, bh, 8);
        ctx.fill();
        ctx.strokeStyle = `${col}88`;
        ctx.lineWidth = 1.2;
        roundRect(bx, by, bw, bh, 8);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(bx + 34, by + 44, 24, 0, Math.PI * 2);
        ctx.fillStyle = `${col}22`;
        ctx.fill();
        ctx.strokeStyle = `${col}55`;
        ctx.lineWidth = 1;
        ctx.stroke();

        const badgeName = badge.achievement?.name || "Badge";
        const icon = badge.achievement?.icon || "🏆";
        ctx.fillStyle = col;
        ctx.font = `24px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(icon, bx + 34, by + 44);

        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px Arial, sans-serif";
        ctx.fillText(
          badgeName.length > 16 ? badgeName.substring(0, 14) + "..." : badgeName,
          bx + 68, by + 28
        );

        ctx.fillStyle = col;
        ctx.font = "bold 8px Arial, sans-serif";
        ctx.fillText(tierLabel(tier), bx + 68, by + 44);
      });
    }

    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(24, 290);
    ctx.lineTo(576, 290);
    ctx.stroke();
    ctx.fillStyle = "#374151";
    ctx.font = "8px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "HONOR PROFILE  |  GENERATED AT LOST-AND-FOUND PORTAL",
      300, 302
    );

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${user?.username || user?.name?.replace(/\s+/g, "_") || "student"
      }_achievements.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const myRank = board.findIndex((u: any) => u.id === user?.id) + 1;
  const approvedClaims = claims.filter((c: any) => c.status === "APPROVED").length;
  const pendingClaims = claims.filter((c: any) => c.status === "PENDING").length;

  const tabCount: Record<TabKey, number> = {
    timeline:
      claims.length +
      foundItems.length +
      lostItems.length +
      pointsHistory.length +
      myAchievements.length,
    claims: claims.length,
    found: foundItems.length,
    lost: lostItems.length,
    points: pointsHistory.length,
  };

  const timelineEvents = React.useMemo(() => {
    const events: {
      type: "claim" | "found" | "lost" | "badge" | "points";
      date: Date;
      title: string;
      desc: string;
      icon: React.ReactNode;
      color: string;
      bg: string;
      border: string;
      link: string;
    }[] = [];

    claims.forEach((c: any) => {
      const date = new Date(c.createdAt || Date.now());
      const itemName =
        c.foundItem?.foundItemName ?? c.lostItem?.lostItemName ?? "Item";
      let title = "Claim Submitted";
      let color = "text-yellow-400";
      let bg = "bg-yellow-400/10";
      let border = "border-yellow-400/20";
      let icon = <FaClock size={10} />;

      if (c.status === "APPROVED") {
        title = "Claim Approved 🎉";
        color = "text-emerald-400";
        bg = "bg-emerald-400/10";
        border = "border-emerald-400/20";
        icon = <FaCheckCircle size={10} />;
      } else if (c.status === "REJECTED") {
        title = "Claim Rejected";
        color = "text-red-400";
        bg = "bg-red-400/10";
        border = "border-red-400/20";
        icon = <FaTimesCircle size={10} />;
      }

      events.push({
        type: "claim",
        date,
        title,
        desc: `Claim request for "${itemName}" is currently ${c.status.toLowerCase()}`,
        icon,
        color,
        bg,
        border,
        link: "/itemStatus",
      });
    });

    foundItems.forEach((fi: any) => {
      const date = new Date(fi.date || fi.createdAt || Date.now());
      events.push({
        type: "found",
        date,
        title: "Reported Found Item",
        desc: `Reported found "${fi.foundItemName}" at ${fi.location || "campus"}`,
        icon: <FaBoxOpen size={10} />,
        color: "text-cyan-400",
        bg: "bg-cyan-400/10",
        border: "border-cyan-400/20",
        link: "/foundItems",
      });
    });

    lostItems.forEach((li: any) => {
      const date = new Date(li.date || li.createdAt || Date.now());
      events.push({
        type: "lost",
        date,
        title: "Reported Lost Item",
        desc: `Reported lost "${li.lostItemName}" at ${li.location || "campus"}`,
        icon: <FaSearch size={10} />,
        color: "text-blue-400",
        bg: "bg-blue-400/10",
        border: "border-blue-400/20",
        link: "/reportLostItem",
      });
    });

    myAchievements.forEach((a: any) => {
      const date = new Date(a.unlockedAt || a.createdAt || Date.now());
      events.push({
        type: "badge",
        date,
        title: "Badge Unlocked! 🏆",
        desc: `Unlocked the "${a.achievement?.name || "Achievement"}" badge (+${a.achievement?.xp || 0} XP)`,
        icon: (
          <span className="text-xs shrink-0 select-none">
            {a.achievement?.icon || "🏅"}
          </span>
        ),
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
        link: "/dashboard/student/achievements",
      });
    });

    pointsHistory.forEach((h: any) => {
      const date = new Date(h.createdAt || Date.now());
      const amountSign = h.amount > 0 ? `+${h.amount}` : `${h.amount}`;
      events.push({
        type: "points",
        date,
        title: `${h.amount > 0 ? "Earned" : "Spent"} Points`,
        desc: `${amountSign} points for ${h.reason?.replace(/_/g, " ").toLowerCase()}`,
        icon: <FaStar size={10} />,
        color: h.amount > 0 ? "text-yellow-400" : "text-red-400",
        bg: h.amount > 0 ? "bg-yellow-400/10" : "bg-red-400/10",
        border: h.amount > 0 ? "border-yellow-400/25" : "border-red-400/25",
        link: "/dashboard/student/achievements",
      });
    });

    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [claims, foundItems, lostItems, myAchievements, pointsHistory]);

  if (loading)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );

  const handleBadgeClick = async (badge: any) => {
    if (!badge.seen) {
      try {
        await markSeen(undefined).unwrap();
        toast.info("New achievements acknowledged!");
      } catch (err) {
        console.error("Failed to mark achievements as seen:", err);
      }
    }
  };

  const top3 = board.slice(0, 3);
  const rest = board.slice(3, 10);

  return (
    <div className="space-y-4 sm:space-y-5 text-white max-w-7xl mx-auto">

      {/* ── Profile Card ──────────────────────────────────────────────── */}
      <div className="relative bg-gray-900 border border-white/5 rounded-2xl overflow-hidden p-4 sm:p-5">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-12 -right-12 w-52 h-52 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-4">

          {/* ── Row 1: Avatar + Name + Share button ── */}
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center border border-white/10 shadow-lg">
                <FaUser size={22} className="text-white opacity-90" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                <FaCheckCircle size={9} className="text-white" />
              </div>
            </div>

            {/* Name + badges */}
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-bold text-base sm:text-lg leading-tight truncate">
                {user?.name || user?.username || "Student"}
              </h1>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[9px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full font-bold tracking-wide uppercase shrink-0">
                  <MdVerified size={8} /> Verified
                </span>
                <span className="text-gray-600 text-[10px] truncate">{user?.email}</span>
              </div>
            </div>

            {/* Share button — compact, always visible */}
            <button
              onClick={() => setShareModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors shrink-0"
            >
              <FaShareAlt size={10} />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>

          {/* ── Row 2: Level pill + XP bar ── */}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2.5 py-1 rounded-full">
                Lv.{xpLevel} · {rankTitle}
              </span>
              <span className="text-[10px] text-gray-500 font-semibold shrink-0">
                {totalPoints.toLocaleString()} XP
                {xpLevel < 100 && (
                  <span className="text-gray-600"> · {calculateLevel(totalPoints).xpNeededForNext - calculateLevel(totalPoints).xpIntoCurrentLevel} to Lv.{xpLevel + 1}</span>
                )}
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${xpLevel >= 90 ? "bg-purple-500" :
                  xpLevel >= 50 ? "bg-cyan-400" :
                    xpLevel >= 20 ? "bg-yellow-400" : "bg-amber-600"
                  }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* ── Row 3: Stats chips — single scrollable row ── */}
          <div className="flex gap-2">
            {/* Points */}
            <div className="flex-1 flex flex-col items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl py-2.5 px-1">
              <FaStar size={12} className="text-yellow-400" />
              <p className="text-white font-black text-sm leading-none">{totalPoints.toLocaleString()}</p>
              <p className="text-gray-600 text-[8px] font-bold uppercase tracking-wider">Points</p>
            </div>

            {/* Rank */}
            {myRank > 0 && (
              <div className="flex-1 flex flex-col items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl py-2.5 px-1">
                <FaTrophy size={12} className="text-cyan-400" />
                <p className="text-white font-black text-sm leading-none">#{myRank}</p>
                <p className="text-gray-600 text-[8px] font-bold uppercase tracking-wider">Rank</p>
              </div>
            )}

            {/* Badges */}
            <Link
              to="/dashboard/student/achievements"
              className="flex-1 flex flex-col items-center gap-1 bg-white/[0.04] border border-white/[0.06] hover:border-white/10 rounded-xl py-2.5 px-1 transition-all"
            >
              <FaMedal size={12} className="text-purple-400" />
              <p className="text-white font-black text-sm leading-none">{myAchievements.length}</p>
              <p className="text-gray-600 text-[8px] font-bold uppercase tracking-wider">Badges</p>
            </Link>

            {/* Streak */}
            {streak.currentStreak > 0 && (
              <div
                className={`flex-1 flex flex-col items-center gap-1 rounded-xl py-2.5 px-1 transition-all ${streak.isOnARoll
                  ? "bg-orange-500/10 border border-orange-500/25"
                  : "bg-white/[0.04] border border-white/[0.06]"
                  }`}
              >
                <FaFire size={12} className="text-orange-400" />
                <p className="text-white font-black text-sm leading-none">{streak.currentStreak}</p>
                <p className={`text-[8px] font-bold uppercase tracking-wider ${streak.isOnARoll ? "text-orange-500" : "text-gray-600"}`}>
                  {streak.isOnARoll ? "On Fire!" : "Streak"}
                </p>
              </div>
            )}
          </div>

          {/* ── Row 4: Top Badges with name + tier ── */}
          <div>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-2">Top Badges</p>
            {top3Badges.length === 0 ? (
              <p className="text-gray-600 text-xs italic">No badges unlocked yet</p>
            ) : (
              <div className="flex gap-2">
                {top3Badges.map((badge: any) => {
                  const ach = badge.achievement;
                  const isUnseen = !badge.seen;
                  return (
                    <button
                      key={badge.id}
                      onClick={() => handleBadgeClick(badge)}
                      className={`flex-1 flex items-center gap-2 px-2.5 py-2 rounded-xl border transition-all min-w-0 text-left min-h-[52px] ${getTierColor(ach.tier)} hover:opacity-80`}
                      title={ach.description}
                    >
                      <span className="text-lg shrink-0 leading-none">{ach.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-white line-clamp-2 break-words leading-tight">{ach.name}</p>
                        <p className={`text-[8px] font-bold uppercase tracking-wide leading-tight mt-0.5 ${getTierTextColor(ach.tier)}`}>
                          {ach.tier}
                        </p>
                      </div>
                      {isUnseen && (
                        <span className="shrink-0 flex h-2 w-2">
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Found Items Reported",
            value: foundItems.length,
            icon: <FaBoxOpen size={14} />,
            iconBg: "bg-cyan-400/10 border-cyan-400/20",
            iconColor: "text-cyan-400",
            hoverGlow: "group-hover:bg-cyan-400/5",
          },
          {
            label: "Lost Items Reported",
            value: lostItems.length,
            icon: <FaSearch size={14} />,
            iconBg: "bg-blue-400/10 border-blue-400/20",
            iconColor: "text-blue-400",
            hoverGlow: "group-hover:bg-blue-400/5",
          },
          {
            label: "Claims Approved",
            value: approvedClaims,
            icon: <FaCheckCircle size={14} />,
            iconBg: "bg-emerald-400/10 border-emerald-400/20",
            iconColor: "text-emerald-400",
            hoverGlow: "group-hover:bg-emerald-400/5",
          },
          {
            label: "Claims Pending",
            value: pendingClaims,
            icon: <FaClock size={14} />,
            iconBg: "bg-yellow-400/10 border-yellow-400/20",
            iconColor: "text-yellow-400",
            hoverGlow: "group-hover:bg-yellow-400/5",
          },
        ].map(({ label, value, icon, iconBg, iconColor, hoverGlow }) => (
          <div
            key={label}
            className="relative group bg-gray-900 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 hover:border-white/10 transition-all duration-200 overflow-hidden"
          >
            <div
              className={`absolute inset-0 opacity-0 ${hoverGlow} transition-opacity duration-300 blur-2xl`}
            />
            <div
              className={`relative w-9 h-9 rounded-xl border flex items-center justify-center ${iconBg} ${iconColor}`}
            >
              {icon}
            </div>
            <div className="relative">
              <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{value}</p>
              <p className="text-gray-500 text-xs mt-0.5 font-medium leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Gamification Widget ── */}
      <GamificationWidget
        streak={streak}
        loginStreak={loginStreak}
        boostEvent={boostEvent}
        rankDelta={rankDelta}
        myRank={myRank}
        myAchievements={myAchievements}
        allAchievements={[]}
      />

      {/* ── Weekly Bounties Widget ── */}
      <WeeklyBountiesWidget />

      {/* ── Activity + Leaderboard ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Activity Panel — 3 cols */}
        <div className="lg:col-span-3 bg-gray-900 border border-white/5 rounded-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-white/5">
            <div>
              <h3 className="text-white text-sm font-semibold flex items-center gap-2">
                <FaChartLine size={13} className="text-gray-400" /> Activity
              </h3>
              <p className="text-gray-500 text-xs mt-0.5">Your reports and claim history</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-row overflow-x-auto gap-2 px-4 sm:px-5 pt-3 pb-3 scrollbar-none flex-nowrap">
            {TABS.map(({ key, label, icon }) => {
              const active = tab === key;
              const count = tabCount[key];
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border shrink-0 ${active
                    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                    : "border-white/5 text-gray-500 hover:text-gray-300 bg-transparent hover:bg-white/5"
                    }`}
                >
                  <span className={active ? "text-cyan-400" : "text-gray-600"}>{icon}</span>
                  <span className="truncate">{label}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0 ${active ? "bg-cyan-500 text-white" : "bg-white/[0.07] text-gray-500"
                        }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div
            className="px-3 pb-3 space-y-0.5 max-h-[340px] overflow-y-auto divide-y divide-white/5"
            style={{ scrollbarWidth: "none" }}
          >
            {tab === "timeline" &&
              (timelineEvents.length === 0 ? (
                <Empty label="No recent activity yet. Participate in reporting and claims to build your timeline!" />
              ) : (
                <div className="relative pl-6 pr-2 py-4 space-y-6 before:absolute before:left-3 before:top-4 before:bottom-4 before:w-0.5 before:bg-white/5">
                  {timelineEvents.map((ev, i) => (
                    <div key={i} className="relative flex items-start gap-4 group">
                      <div
                        className={`absolute -left-6 translate-y-0.5 w-6 h-6 rounded-full border flex items-center justify-center bg-gray-950 transition-all z-10 ${ev.border} ${ev.color} group-hover:scale-110 shadow-lg`}
                      >
                        {ev.icon}
                      </div>
                      <Link
                        to={ev.link}
                        className="flex-1 min-w-0 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-xl p-3 transition-all duration-200 block"
                      >
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <h4 className="text-white text-xs font-semibold">{ev.title}</h4>
                          <span className="text-gray-500 text-[9px] font-medium shrink-0">
                            {fmt(ev.date.toISOString())}
                          </span>
                        </div>
                        <p className="text-gray-400 text-[11px] leading-relaxed pr-6">{ev.desc}</p>
                        <div className="flex items-center gap-1 text-[9px] text-cyan-400/70 font-semibold uppercase tracking-wider mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>View Details</span>
                          <FaChevronRight size={6} />
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ))}

            {tab === "claims" &&
              (claims.length === 0 ? (
                <Empty label="No claims submitted yet" />
              ) : (
                claims.map((c: any, i: number) => {
                  const s = STATUS_STYLE[c.status] ?? STATUS_STYLE.PENDING;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-3 hover:bg-white/[0.02] transition-colors group cursor-default"
                    >
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold shrink-0 ${s.bg} ${s.border} ${s.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                        {c.status.charAt(0) + c.status.slice(1).toLowerCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {c.foundItem?.foundItemName ?? c.lostItem?.lostItemName ?? "Item"}
                        </p>
                        <p className="text-gray-600 text-[10px] mt-0.5">
                          {c.createdAt ? fmt(c.createdAt) : ""}
                        </p>
                      </div>
                      <FaChevronRight size={10} className="text-gray-700 group-hover:text-gray-500 transition-colors shrink-0" />
                    </div>
                  );
                })
              ))}

            {tab === "found" &&
              (foundItems.length === 0 ? (
                <Empty label="No found items reported yet" />
              ) : (
                foundItems.map((fi: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    {fi.img ? (
                      <img
                        src={fi.img}
                        alt=""
                        className="w-9 h-9 rounded-lg object-cover shrink-0 border border-white/10"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-cyan-400/10 border border-cyan-400/15 flex items-center justify-center shrink-0">
                        <FaBoxOpen size={12} className="text-cyan-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{fi.foundItemName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {fi.location && (
                          <span className="flex items-center gap-1 text-gray-600 text-[10px]">
                            <FaMapMarkerAlt size={7} /> {fi.location}
                          </span>
                        )}
                        {fi.date && <span className="text-gray-600 text-[10px]">{fmt(fi.date)}</span>}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${fi.isClaimed
                        ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                        : "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
                        }`}
                    >
                      {fi.isClaimed ? "Claimed" : "Active"}
                    </span>
                  </div>
                ))
              ))}

            {tab === "lost" &&
              (lostItems.length === 0 ? (
                <Empty label="No lost items reported yet" />
              ) : (
                lostItems.map((li: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    {li.img ? (
                      <img
                        src={li.img}
                        alt=""
                        className="w-9 h-9 rounded-lg object-cover shrink-0 border border-white/10"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-blue-400/10 border border-blue-400/15 flex items-center justify-center shrink-0">
                        <FaSearch size={11} className="text-blue-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{li.lostItemName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {li.location && (
                          <span className="flex items-center gap-1 text-gray-600 text-[10px]">
                            <FaMapMarkerAlt size={7} /> {li.location}
                          </span>
                        )}
                        {li.date && <span className="text-gray-600 text-[10px]">{fmt(li.date)}</span>}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${li.isFound
                        ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                        : "bg-blue-400/10 text-blue-400 border-blue-400/20"
                        }`}
                    >
                      {li.isFound ? "Found" : "Active"}
                    </span>
                  </div>
                ))
              ))}

            {tab === "points" &&
              (pointsHistory.length === 0 ? (
                <Empty label="No points earned yet — report a found item to get started!" />
              ) : (
                pointsHistory.map((h: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${h.amount > 0
                        ? "bg-yellow-400/10 border border-yellow-400/20"
                        : "bg-red-400/10 border border-red-400/20"
                        }`}
                    >
                      <FaStar size={11} className={h.amount > 0 ? "text-yellow-400" : "text-red-400"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium">
                        {h.reason?.replace(/_/g, " ")}
                      </p>
                      <p className="text-gray-600 text-[10px] mt-0.5">
                        {h.createdAt ? fmt(h.createdAt) : ""}
                      </p>
                    </div>
                    <p
                      className={`text-sm font-black shrink-0 ${h.amount > 0 ? "text-yellow-400" : "text-red-400"
                        }`}
                    >
                      {h.amount > 0 ? "+" : ""}
                      {h.amount} pts
                    </p>
                  </div>
                ))
              ))}
          </div>
        </div>

        {/* Leaderboard — 2 cols */}
        <div className="lg:col-span-2 bg-gray-900 border border-white/5 rounded-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-white/5">
            <h3 className="text-white text-sm font-semibold">Leaderboard</h3>
            <p className="text-gray-600 text-[10px] font-semibold">TOP {board.length}</p>
          </div>

          {board.length === 0 ? (
            <div className="p-6">
              <Empty label="No rankings yet" />
            </div>
          ) : (
            <>
              {top3.length >= 1 && (
                <Podium top3={top3} currentUserId={user?.id} />
              )}

              <div className="px-3 pb-3 space-y-0.5 divide-y divide-white/5">
                {myRank > 3 &&
                  (() => {
                    const me = board.find((u: any) => u.id === user?.id);
                    if (!me) return null;
                    return (
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 mb-2">
                        <span className="text-gray-500 text-xs font-bold w-4 text-center">{myRank}</span>
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
                          <FaUser size={11} className="text-cyan-400" />
                        </div>
                        <p className="text-cyan-300 text-xs font-semibold flex-1 truncate">You</p>
                        <p className="text-yellow-400 text-xs font-black shrink-0">
                          {me.totalPoints}
                          <span className="text-gray-600 font-normal"> pts</span>
                        </p>
                      </div>
                    );
                  })()}

                {rest.map((u: any, i: number) => {
                  const rank = i + 4;
                  const isMe = u.id === user?.id;
                  return (
                    <div
                      key={u.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${isMe
                        ? "bg-cyan-500/10 border border-cyan-500/20"
                        : "hover:bg-white/[0.02] border border-transparent"
                        }`}
                    >
                      <span className="text-gray-600 text-xs font-bold w-4 text-center">{rank}</span>
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isMe ? "bg-cyan-500/20" : "bg-white/[0.05]"
                          }`}
                      >
                        <FaUser size={11} className={isMe ? "text-cyan-400" : "text-gray-600"} />
                      </div>
                      <p
                        className={`text-xs font-semibold flex-1 truncate ${isMe ? "text-cyan-300" : "text-gray-300"
                          }`}
                      >
                        {isMe ? "You" : u.name || "Student"}
                      </p>
                      <p className="text-yellow-400 text-xs font-black shrink-0">
                        {u.totalPoints}
                        <span className="text-gray-600 font-normal"> pts</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Quick Actions ──────────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-5">
        <h3 className="text-white text-sm font-semibold mb-3">Quick Actions</h3>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {[
            {
              label: "Track Status",
              desc: "View real-time item & claim progress",
              href: "/itemStatus",
              icon: <FaClipboardList size={15} />,
              iconBg: "bg-emerald-400/10 border-emerald-400/15",
              iconColor: "text-emerald-400",
              hover: "hover:border-emerald-400/20",
            },
            {
              label: "Report Lost Item",
              desc: "Help the SAS office locate it",
              href: "/reportLostItem",
              icon: <FaSearch size={15} />,
              iconBg: "bg-cyan-400/10 border-cyan-400/15",
              iconColor: "text-cyan-400",
              hover: "hover:border-cyan-400/20",
            },
            {
              label: "Browse Found Items",
              desc: "Submit a claim to retrieve",
              href: "/foundItems",
              icon: <FaClipboardList size={15} />,
              iconBg: "bg-violet-400/10 border-violet-400/15",
              iconColor: "text-violet-400",
              hover: "hover:border-violet-400/20",
            },
          ].map(({ label, desc, href, icon, iconBg, iconColor, hover }) => (
            <Link
              key={label}
              to={href}
              className={`group flex items-center gap-3 sm:flex-col sm:items-start rounded-xl p-3 sm:p-4 border border-white/5 bg-white/[0.02] transition-all duration-150 flex-1 ${hover}`}
            >
              <div
                className={`shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center ${iconBg} ${iconColor}`}
              >
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold">{label}</p>
                <p className="text-gray-500 text-xs mt-0.5 truncate sm:whitespace-normal">{desc}</p>
              </div>
              <FaArrowRight
                size={11}
                className="text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all shrink-0 sm:hidden"
              />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Share Modal ─────────────────────────────────────────────────── */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">
                Share Achievements
              </h2>
              <button
                onClick={() => setShareModalOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <FaTimesCircle size={18} />
              </button>
            </div>

            {/* Card Preview */}
            <div className="relative overflow-hidden bg-gradient-to-br from-gray-950 to-gray-900 border border-white/5 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-cyan-400 tracking-wider">
                  CAMPUS HONOR REGISTRY
                </span>
                <span className="text-xs text-gray-500">🏆 Profile Card</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-white font-bold text-2xl">
                  {(user?.name || "S").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-white font-bold text-base leading-tight">
                    {user?.name || "Student"}
                  </h3>
                  <p className="text-gray-500 text-xs">{user?.email}</p>
                  <span className="inline-block mt-1.5 text-[9px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold">
                    ★ HONEST CITIZEN
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-3 text-sm items-start">
                <div>
                  <p className="text-gray-500 text-[9px] font-bold uppercase tracking-wider">XP Rank</p>
                  <p className="text-yellow-400 font-bold mt-0.5">Lv.{xpLevel} {rankTitle}</p>
                  <p className="text-gray-600 text-[9px] mt-0.5">{totalPoints} XP total</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[9px] font-bold uppercase tracking-wider">Streak</p>
                  <p className="text-white font-bold mt-0.5">
                    {streak.currentStreak > 0 ? `🔥 ${streak.currentStreak}-Day` : "No streak"}
                  </p>
                  <p className="text-gray-600 text-[9px] mt-0.5">
                    {streak.isOnARoll ? "On a roll!" : "Keep it up!"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-gray-500 text-[9px] font-bold uppercase tracking-wider">
                  Top Badges
                </p>
                <div className="flex gap-2">
                  {top3Badges.map((badge: any) => (
                    <div
                      key={badge.id}
                      className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/5 bg-white/5"
                    >
                      <span className="text-base">{badge.achievement?.icon}</span>
                      <span className="text-[10px] text-gray-300 font-bold line-clamp-2 break-words leading-tight">
                        {badge.achievement?.name}
                      </span>
                    </div>
                  ))}
                  {top3Badges.length === 0 && (
                    <p className="text-gray-600 text-xs italic">No badges unlocked yet</p>
                  )}
                </div>
              </div>
            </div>

            <canvas ref={canvasRef} width={600} height={420} className="hidden" />

            <div className="flex gap-3">
              <button
                onClick={downloadShareCard}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Download PNG Card
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Profile link copied to clipboard!");
                }}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl text-xs border border-white/5 transition-colors"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-center mb-3">
        <FaHistory size={13} className="text-gray-700" />
      </div>
      <p className="text-gray-600 text-xs max-w-[160px] leading-relaxed">{label}</p>
    </div>
  );
}