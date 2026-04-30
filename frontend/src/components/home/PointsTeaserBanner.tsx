import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaStar, FaTrophy } from 'react-icons/fa';
import { useStudent } from "../context/StudentContext";

export const PointsTeaserBanner: React.FC = () => {
  const { isAuthenticated, isStudent, totalPoints, rank } = useStudent();

  // ── Logged-in student with points → show their stats instead ─────────────
  if (isStudent && totalPoints > 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl"
        style={{
          background: "linear-gradient(135deg, rgba(23,37,90,0.5) 0%, rgba(15,23,60,0.45) 40%, rgba(10,15,40,0.4) 100%)",
          border: "1px solid rgba(99,179,237,0.25)",
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.6) 40%, rgba(99,179,237,0.4) 60%, transparent 100%)" }} />
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)" }} />

        <div className="relative flex items-center gap-4 px-5 py-4">
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight">Your Points</p>
            <p className="text-xs mt-0.5 max-w-xs" style={{ color: "rgba(186,230,253,0.65)" }}>
              Keep reporting found items to climb the leaderboard!
            </p>
          </div>

          {/* Points pill */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
              style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)" }}>
              <FaStar size={11} className="text-yellow-400" />
              <span className="text-yellow-300 font-black text-sm">{totalPoints}</span>
              <span className="text-yellow-500 text-[10px]">pts</span>
            </div>
            {rank > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(99,179,237,0.2)" }}>
                <FaTrophy size={10} className="text-blue-300" />
                <span className="text-blue-200 font-black text-sm">#{rank}</span>
              </div>
            )}
            <Link
              to="/dashboard/student/leaderboard"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
              style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", border: "1px solid rgba(99,179,237,0.35)" }}
            >
              Leaderboard <FaArrowRight size={8} />
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.2), transparent)" }} />
      </div>
    );
  }

  // ── Logged-in student with 0 points → encourage first report ─────────────
  if (isStudent && totalPoints === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl"
        style={{
          background: "linear-gradient(135deg, rgba(23,37,90,0.5) 0%, rgba(15,23,60,0.45) 40%, rgba(10,15,40,0.4) 100%)",
          border: "1px solid rgba(99,179,237,0.25)",
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.6) 40%, rgba(99,179,237,0.4) 60%, transparent 100%)" }} />
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)" }} />

        <div className="relative flex items-center gap-4 px-5 py-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-white font-bold text-sm leading-tight">Start earning points!</p>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(99,179,237,0.25)", color: "#93c5fd" }}>
                50 pts per report
              </span>
            </div>
            <p className="text-xs mt-0.5 max-w-xs" style={{ color: "rgba(186,230,253,0.65)" }}>
              Report found items and climb the campus leaderboard.
            </p>
          </div>
          <Link
            to="/reportFoundItem"
            className="shrink-0 group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap"
            style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", border: "1px solid rgba(99,179,237,0.35)" }}
          >
            Report Found Item
            <FaArrowRight size={9} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.2), transparent)" }} />
      </div>
    );
  }

  // ── Not logged in → register teaser ───────────────────────────────────────
  return (
    <div className="relative overflow-hidden rounded-2xl"
      style={{
        background: "linear-gradient(135deg, rgba(23,37,90,0.5) 0%, rgba(15,23,60,0.45) 40%, rgba(10,15,40,0.4) 100%)",
        border: "1px solid rgba(99,179,237,0.25)",
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.6) 40%, rgba(99,179,237,0.4) 60%, transparent 100%)" }} />
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)" }} />
      <div className="absolute -bottom-6 left-10 w-28 h-28 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99,179,237,0.08) 0%, transparent 70%)" }} />

      <div className="relative flex items-center gap-4 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-bold text-sm leading-tight">Want to earn points?</p>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(99,179,237,0.25)", color: "#93c5fd" }}>
              Earn rewards
            </span>
          </div>
          <p className="text-xs mt-0.5 leading-relaxed max-w-xs" style={{ color: "rgba(186,230,253,0.65)" }}>
            Register with your School ID to earn rewards.
          </p>
        </div>

        <Link
          to="/register"
          className="shrink-0 group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap"
          style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", border: "1px solid rgba(99,179,237,0.35)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.9"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
        >
          Register Now
          <FaArrowRight size={9} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.2), transparent)" }} />
    </div>
  );
};