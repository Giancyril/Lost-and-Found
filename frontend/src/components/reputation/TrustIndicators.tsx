import React from 'react';
import { FaShieldAlt, FaStar, FaUserShield, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';

interface TrustIndicatorsProps {
  trustLevel: string;
  reputationPoints: number;
  compact?: boolean;
}

const TrustIndicators: React.FC<TrustIndicatorsProps> = ({ trustLevel, reputationPoints, compact = false }) => {
  const levelConfig: Record<string, { label: string; icon: any; color: string; bg: string; border: string; desc: string }> = {
    'NEW': { 
      label: 'New Member', 
      icon: <FaShieldAlt />, 
      color: 'text-gray-400', 
      bg: 'bg-gray-500/10', 
      border: 'border-gray-500/20',
      desc: 'Recently joined the community.'
    },
    'TRUSTED': { 
      label: 'Trusted User', 
      icon: <FaCheckCircle />, 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/10', 
      border: 'border-blue-500/20',
      desc: 'Active member with a history of helpful contributions.'
    },
    'EXPERT': { 
      label: 'Expert Contributor', 
      icon: <FaStar />, 
      color: 'text-purple-400', 
      bg: 'bg-purple-500/10', 
      border: 'border-purple-500/20',
      desc: 'Highly reliable member with significant community impact.'
    },
    'MASTER': { 
      label: 'Community Master', 
      icon: <FaUserShield />, 
      color: 'text-yellow-400', 
      bg: 'bg-yellow-500/10', 
      border: 'border-yellow-500/20',
      desc: 'The most dedicated members who lead by example.'
    },
    'MODERATOR': { 
      label: 'Moderator', 
      icon: <FaShieldAlt />, 
      color: 'text-green-400', 
      bg: 'bg-green-500/10', 
      border: 'border-green-500/20',
      desc: 'Community official responsible for safety and order.'
    }
  };

  const config = levelConfig[trustLevel] || levelConfig['NEW'];

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${config.bg} ${config.border} ${config.color} text-[10px] font-bold uppercase tracking-wider`}>
        {config.icon}
        {config.label}
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl border ${config.bg} ${config.border} shadow-sm group relative`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${config.color} bg-white/5`}>
          {config.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className={`font-bold ${config.color} uppercase text-xs tracking-widest`}>{config.label}</h4>
            <span className="text-gray-400 text-xs font-bold">{reputationPoints} Points</span>
          </div>
          <p className="text-gray-300 text-sm mt-1 leading-tight">{config.desc}</p>
        </div>
      </div>
      
      {/* Tooltip-like info */}
      <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <FaInfoCircle className="text-gray-500 cursor-help" size={14} />
      </div>
    </div>
  );
};

export default TrustIndicators;
