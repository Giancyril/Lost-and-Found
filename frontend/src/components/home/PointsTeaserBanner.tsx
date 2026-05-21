import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import { useUserVerification } from '../../auth/auth';

interface PointsTeaserBannerProps {
  isAuthenticated?: boolean;
  totalPoints?: number;
  rank?: number;
}

export const PointsTeaserBanner: React.FC<PointsTeaserBannerProps> = ({
  isAuthenticated: isAuthProp,
  totalPoints = 0,
  rank = 0,
}) => {
  const user: any = useUserVerification();
  const isAdmin = user?.role === 'ADMIN';
  const isLoggedIn = isAuthProp === true || !!user?.id || !!user?.email;

  if (isAdmin || isLoggedIn) return null;

  const glowBase = {
    background: "#0d1526",
    border: "none",
  };
  const btnStyle = { background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", border: "1px solid rgba(99,179,237,0.35)" };


  return (
    <div className="relative overflow-hidden rounded-xl" style={glowBase}>
      {/* Always side-by-side, just smaller on mobile */}
      <div className="relative flex items-center gap-3 px-3 py-2.5 sm:px-5 sm:py-4">
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-[11px] sm:text-sm leading-tight">
            Want to earn points?
          </p>
          <p className="text-[10px] sm:text-xs mt-0.5 leading-tight" style={{ color: "rgba(186,230,253,0.65)" }}>
            Register for rewards &amp; leaderboard access!
          </p>
        </div>
        <Link
          to="/register"
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold whitespace-nowrap"
          style={btnStyle}
        >
          Register <FaArrowRight size={8} />
        </Link>
      </div>
    </div>
  );
};