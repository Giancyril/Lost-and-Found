import { useGetActiveBountiesQuery } from "../../redux/api/api";
import { FaTrophy, FaSpinner, FaCheckCircle, FaClock, FaFire } from "react-icons/fa";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { useLocation } from "react-router-dom";

interface Bounty {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  actionType: string;
  xpReward: number;
  icon: string;
  isActive: boolean;
  isCompleted: boolean;
  startDate: string;
  endDate: string;
}

const Bounties = () => {
  useScrollReveal();
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");
  const { data, isLoading, error } = useGetActiveBountiesQuery(undefined);

  const bounties: Bounty[] = data?.data || [];

  // Calculate time remaining until next Sunday
  const getTimeRemaining = () => {
    const now = new Date();
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
    nextSunday.setHours(23, 59, 59, 999);
    
    const diff = nextSunday.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${isDashboard ? "py-20" : "min-h-screen bg-gray-950"}`}>
        <div className="flex flex-col items-center gap-3">
          <FaSpinner className="animate-spin text-blue-400" size={32} />
          <p className="text-gray-400 text-sm">Loading bounties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-4 ${isDashboard ? "py-10" : "min-h-screen bg-gray-950"}`}>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-md">
          <p className="text-red-400 text-sm">Failed to load bounties. Please try again later.</p>
        </div>
      </div>
    );
  }

  if (isDashboard) {
    return (
      <div className="space-y-3 sm:space-y-5 max-w-7xl mx-auto pb-10 px-2 sm:px-0">
        {/* Timer Card */}
        <div className="bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <FaClock className="text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Time Remaining</p>
                <p className="text-gray-500 text-xs">Bounties reset every Monday at midnight</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FaFire className="text-orange-400" size={16} />
              <span className="text-2xl font-black text-white tabular-nums">{getTimeRemaining()}</span>
            </div>
          </div>
        </div>

        {/* Bounties Grid */}
        {bounties.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
            <FaTrophy className="text-gray-700 mx-auto mb-4" size={48} />
            <p className="text-gray-400 text-sm">No active bounties at the moment.</p>
            <p className="text-gray-600 text-xs mt-2">Check back on Monday for new challenges!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bounties.map((bounty) => {
              const progress = getProgressPercentage(bounty.currentCount, bounty.targetCount);
              const isCompleted = bounty.isCompleted;

              return (
                <div
                  key={bounty.id}
                  className={`relative bg-gray-900 border rounded-2xl p-5 sm:p-6 transition-all duration-300 ${
                    isCompleted
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-gray-800 hover:border-gray-700"
                  }`}
                >
                  {/* Completion Badge */}
                  {isCompleted && (
                    <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-emerald-500 border-4 border-gray-950 flex items-center justify-center">
                      <FaCheckCircle className="text-white" size={18} />
                    </div>
                  )}

                  {/* Icon */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                      isCompleted
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : "bg-gray-800 border border-gray-700"
                    }`}>
                      {bounty.icon}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isCompleted
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      +{bounty.xpReward} XP
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className={`text-lg font-bold mb-2 ${
                    isCompleted ? "text-emerald-400" : "text-white"
                  }`}>
                    {bounty.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                    {bounty.description}
                  </p>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 font-medium">Progress</span>
                      <span className={`font-bold tabular-nums ${
                        isCompleted ? "text-emerald-400" : "text-gray-400"
                      }`}>
                        {bounty.currentCount} / {bounty.targetCount}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted
                            ? "bg-gradient-to-r from-emerald-500 to-green-400"
                            : "bg-gradient-to-r from-blue-500 to-violet-500"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Status */}
                  {isCompleted && (
                    <div className="mt-4 pt-4 border-t border-emerald-500/20">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                        <FaCheckCircle size={12} />
                        <span>Completed! XP Awarded</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Info Footer */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
          <h3 className="text-white text-sm font-semibold mb-3">How Bounties Work</h3>
          <ul className="space-y-2 text-gray-500 text-xs sm:text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 shrink-0">•</span>
              <span>Complete challenges to earn XP and boost your leaderboard rank</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 shrink-0">•</span>
              <span>Three new bounties are generated every Monday at midnight</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 shrink-0">•</span>
              <span>Progress is tracked automatically as you use the platform</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 shrink-0">•</span>
              <span>XP is awarded instantly when you complete a bounty</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <section 
      className="min-h-screen bg-gray-950 py-10 px-4 reveal"
      style={{ backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 60%)" }}
    >
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-4">
            <FaTrophy className="text-amber-400" size={14} />
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Weekly Challenges</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Active Bounties</h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
            Complete challenges to earn XP and climb the leaderboard. New bounties refresh every Monday!
          </p>
        </div>

        {/* Timer Card */}
        <div className="bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20 rounded-2xl p-4 sm:p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <FaClock className="text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Time Remaining</p>
                <p className="text-gray-500 text-xs">Bounties reset every Monday at midnight</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FaFire className="text-orange-400" size={16} />
              <span className="text-2xl font-black text-white tabular-nums">{getTimeRemaining()}</span>
            </div>
          </div>
        </div>

        {/* Bounties Grid */}
        {bounties.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
            <FaTrophy className="text-gray-700 mx-auto mb-4" size={48} />
            <p className="text-gray-400 text-sm">No active bounties at the moment.</p>
            <p className="text-gray-600 text-xs mt-2">Check back on Monday for new challenges!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bounties.map((bounty) => {
              const progress = getProgressPercentage(bounty.currentCount, bounty.targetCount);
              const isCompleted = bounty.isCompleted;

              return (
                <div
                  key={bounty.id}
                  className={`relative bg-gray-900 border rounded-2xl p-5 sm:p-6 transition-all duration-300 ${
                    isCompleted
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-gray-800 hover:border-gray-700"
                  }`}
                >
                  {/* Completion Badge */}
                  {isCompleted && (
                    <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-emerald-500 border-4 border-gray-950 flex items-center justify-center">
                      <FaCheckCircle className="text-white" size={18} />
                    </div>
                  )}

                  {/* Icon */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                      isCompleted
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : "bg-gray-800 border border-gray-700"
                    }`}>
                      {bounty.icon}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isCompleted
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      +{bounty.xpReward} XP
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className={`text-lg font-bold mb-2 ${
                    isCompleted ? "text-emerald-400" : "text-white"
                  }`}>
                    {bounty.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                    {bounty.description}
                  </p>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 font-medium">Progress</span>
                      <span className={`font-bold tabular-nums ${
                        isCompleted ? "text-emerald-400" : "text-gray-400"
                      }`}>
                        {bounty.currentCount} / {bounty.targetCount}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted
                            ? "bg-gradient-to-r from-emerald-500 to-green-400"
                            : "bg-gradient-to-r from-blue-500 to-violet-500"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Status */}
                  {isCompleted && (
                    <div className="mt-4 pt-4 border-t border-emerald-500/20">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                        <FaCheckCircle size={12} />
                        <span>Completed! XP Awarded</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
          <h3 className="text-white text-sm font-semibold mb-3">How Bounties Work</h3>
          <ul className="space-y-2 text-gray-500 text-xs sm:text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 shrink-0">•</span>
              <span>Complete challenges to earn XP and boost your leaderboard rank</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 shrink-0">•</span>
              <span>Three new bounties are generated every Monday at midnight</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 shrink-0">•</span>
              <span>Progress is tracked automatically as you use the platform</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 shrink-0">•</span>
              <span>XP is awarded instantly when you complete a bounty</span>
            </li>
          </ul>
        </div>

      </div>
    </section>
  );
};

export default Bounties;
