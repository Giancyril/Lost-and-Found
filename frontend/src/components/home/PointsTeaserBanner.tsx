import React from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaArrowRight } from 'react-icons/fa';

interface PointsTeaserBannerProps {
  isAuthenticated: boolean;
  totalPoints?: number;
}

export const PointsTeaserBanner: React.FC<PointsTeaserBannerProps> = ({
  isAuthenticated,
  totalPoints = 0,
}) => {
  // Hide once logged in AND already has points
  if (isAuthenticated && totalPoints > 0) return null;

  return (
    <div className="bg-gray-900 border border-yellow-500/15 rounded-2xl p-4
      flex items-center justify-between gap-4 overflow-hidden relative">

      {/* Subtle glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-orange-500/5
        to-transparent pointer-events-none" />

      <div className="relative flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-yellow-400/10 border border-yellow-400/20
          flex items-center justify-center shrink-0">
          <FaStar size={14} className="text-yellow-400" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm">
            {isAuthenticated ? 'Start earning points!' : 'Want to earn points?'}
          </p>
          <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
            {isAuthenticated
              ? 'Report a found item to earn your first 50 points and appear on the leaderboard.'
              : 'Register with your School ID and earn rewards every time you help someone find their lost item.'}
          </p>
        </div>
      </div>

      <Link
        to={isAuthenticated ? '/found-items/report' : '/register'}
        className="relative shrink-0 inline-flex items-center gap-1.5 px-3 py-2
          bg-yellow-400/10 text-yellow-300 border border-yellow-400/20 rounded-xl
          text-xs font-semibold hover:bg-yellow-400/20 transition-colors whitespace-nowrap"
      >
        {isAuthenticated ? 'Report Item' : 'Register Now'}
        <FaArrowRight size={9} />
      </Link>
    </div>
  );
};