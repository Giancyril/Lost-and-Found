import React from 'react';
import { FaMedal, FaLock, FaCheckCircle, FaAward, FaInfoCircle } from 'react-icons/fa';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockPoints: number;
  category: string;
  earnedAt?: string;
}

interface BadgeSystemProps {
  badges: Badge[];
  allDefinitions?: Badge[];
}

const BadgeSystem: React.FC<BadgeSystemProps> = ({ badges, allDefinitions = [] }) => {
  // Merge definitions with earned status
  const badgeMap = new Map(badges.map(b => [b.id, b]));
  
  const displayBadges = allDefinitions.length > 0 
    ? allDefinitions.map(def => ({ ...def, earnedAt: badgeMap.get(def.id)?.earnedAt }))
    : badges;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <FaMedal className="text-yellow-500" /> Achievements & Badges
        </h3>
        <span className="text-gray-500 text-xs font-medium">
          {badges.length} Unlocked
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {displayBadges.map((badge) => {
          const isEarned = !!badge.earnedAt;
          
          return (
            <div 
              key={badge.id}
              className={`relative group p-4 rounded-xl border transition-all duration-300 flex flex-col items-center text-center gap-3 ${
                isEarned 
                  ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30' 
                  : 'bg-gray-800/30 border-gray-800 grayscale'
              }`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg transition-transform group-hover:scale-110 ${
                isEarned ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-500'
              }`}>
                {isEarned ? <FaAward /> : <FaLock size={20} />}
              </div>
              
              <div>
                <h4 className={`text-xs font-bold ${isEarned ? 'text-white' : 'text-gray-500'}`}>
                  {badge.name}
                </h4>
                {isEarned && (
                  <p className="text-[9px] text-blue-400 mt-1 uppercase tracking-wider font-bold">
                    Earned {new Date(badge.earnedAt!).toLocaleDateString()}
                  </p>
                )}
                {!isEarned && (
                  <p className="text-[9px] text-gray-600 mt-1 uppercase tracking-wider font-bold">
                    Unlocks at {badge.unlockPoints} pts
                  </p>
                )}
              </div>

              {/* Tooltip */}
              <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-800 text-white text-[11px] p-3 rounded-lg shadow-2xl border border-gray-700">
                  <p className="font-bold mb-1 flex items-center gap-1">
                    <FaInfoCircle className="text-blue-400" /> {badge.name}
                  </p>
                  <p className="text-gray-400 leading-tight">{badge.description}</p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-800"></div>
                </div>
              </div>
              
              {isEarned && (
                <div className="absolute -top-1 -right-1 bg-green-500 text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#18191a]">
                  <FaCheckCircle size={10} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgeSystem;
