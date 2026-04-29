import React from 'react';
import { FaStar } from 'react-icons/fa';
import { Link } from 'react-router-dom';

interface PointsBadgeProps {
  points: number;
  /** If true, renders as a compact inline chip (for navbars). Default: false (larger card). */
  compact?: boolean;
}

export const PointsBadge: React.FC<PointsBadgeProps> = ({ points, compact = false }) => {
  if (compact) {
    return (
      <Link
        to="/points"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5
          bg-yellow-400/10 text-yellow-300 border border-yellow-400/20 rounded-xl
          text-[11px] font-bold hover:bg-yellow-400/20 transition-colors"
      >
        <FaStar size={9} className="text-yellow-400" />
        {points.toLocaleString()} pts
      </Link>
    );
  }

  return (
    <div className="bg-gray-900 border border-yellow-500/15 rounded-2xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/20
        flex items-center justify-center shrink-0">
        <FaStar size={16} className="text-yellow-400" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400/70">Your Points</p>
        <p className="text-white text-2xl font-bold leading-none mt-0.5">
          {points.toLocaleString()}
        </p>
      </div>
      <Link
        to="/points"
        className="ml-auto text-[11px] font-semibold px-2.5 py-1.5
          bg-yellow-400/10 text-yellow-300 border border-yellow-400/20 rounded-xl
          hover:bg-yellow-400/20 transition-colors"
      >
        Leaderboard
      </Link>
    </div>
  );
};