import React, { useEffect, useState } from "react";
import { useGetActiveBountiesQuery } from "../../redux/api/api";
import { FaClock, FaCheckCircle, FaStar } from "react-icons/fa";

export default function WeeklyBountiesWidget() {
  const { data, isLoading } = useGetActiveBountiesQuery({});
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const nextSunday = new Date(now);
      nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
      nextSunday.setHours(23, 59, 59, 999);

      const diff = nextSunday.getTime() - now.getTime();
      if (diff <= 0) return "Expired";

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      return `${days}d ${hours}h`;
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <div className="h-48 bg-gray-50 dark:bg-gray-800/50 rounded-2xl animate-pulse"></div>;
  }

  const bounties = data?.data || [];
  if (bounties.length === 0) return null;

  return (
    <div className="relative bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-6 text-white mb-6 overflow-hidden">
      {/* Decorative background gradient matching profile card */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6 relative z-10">
        <div>
          <h2 className="text-white text-sm font-semibold flex items-center gap-2">
            Weekly Bounties
          </h2>
          <p className="text-gray-500 text-xs mt-0.5">Complete these tasks before Sunday midnight for massive XP!</p>
        </div>
        <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold backdrop-blur-md border border-white/5">
          <FaClock className="text-yellow-300" />
          <span className="whitespace-nowrap">{timeLeft} left</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        {bounties.map((bounty: any) => {
          const progressPercentage = Math.min(100, (bounty.currentCount / bounty.targetCount) * 100);

          return (
            <div key={bounty.id} className="relative bg-gray-800/40 hover:bg-gray-800/60 transition-colors rounded-xl p-3 sm:p-4 border border-white/5 flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                  <span className="text-xl sm:text-2xl">{bounty.icon}</span>
                  {bounty.isCompleted ? (
                    <span className="text-emerald-400 flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-emerald-400/10 px-2 py-0.5 sm:py-1 rounded-md">
                      <FaCheckCircle size={10} /> Done
                    </span>
                  ) : bounty.currentCount / bounty.targetCount >= 0.8 ? (
                    <span className="text-orange-400 flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-orange-400/10 px-2 py-0.5 sm:py-1 rounded-md animate-pulse">
                      Nearly There
                    </span>
                  ) : (
                    <span className="text-yellow-300 flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-yellow-300/10 px-2 py-0.5 sm:py-1 rounded-md">
                      <FaStar size={10} /> {bounty.xpReward} XP
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-base sm:text-lg leading-tight mb-0.5 sm:mb-1">{bounty.title}</h3>
                <p className="text-white/70 text-[10px] sm:text-xs mb-3 sm:mb-4 line-clamp-2 leading-relaxed">{bounty.description}</p>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-white/90">Progress</span>
                  <span className="text-white">{bounty.currentCount} / {bounty.targetCount}</span>
                </div>
                <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${bounty.isCompleted ? 'bg-emerald-400' : 'bg-gradient-to-r from-yellow-400 to-yellow-300'}`}
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
