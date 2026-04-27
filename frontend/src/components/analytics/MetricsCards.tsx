import React from 'react';
import {
  FaUsers, FaCommentAlt, FaEye, FaSearch,
  FaArrowUp, FaArrowDown, FaMinus,
} from 'react-icons/fa';

interface Metric {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
  accent: string;
  bg: string;
  border: string;
}

interface MetricsCardsProps {
  metrics?: any;
}

const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics }) => {
  const displayMetrics: Metric[] = [
    {
      label: 'Active Users',
      value: metrics?.activeUsers ?? 0,
      change: 12.5,
      trend: 'up',
      icon: <FaUsers size={13} />,
      color: 'text-cyan-400',
      accent: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
      border: 'border-cyan-400/20',
    },
    {
      label: 'Discussion Threads',
      value: metrics?.totalThreads ?? 0,
      change: 5.2,
      trend: 'up',
      icon: <FaCommentAlt size={13} />,
      color: 'text-violet-400',
      accent: 'text-violet-400',
      bg: 'bg-violet-400/10',
      border: 'border-violet-400/20',
    },
    {
      label: 'Item Recovery Rate',
      value: `${(((metrics?.itemRecoveryRate ?? 0) * 100)).toFixed(1)}%`,
      change: -2.1,
      trend: 'down',
      icon: <FaSearch size={13} />,
      color: 'text-emerald-400',
      accent: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/20',
    },
    {
      label: 'User Engagement',
      value: `${(((metrics?.userEngagementRate ?? 0) * 100)).toFixed(1)}%`,
      change: 0.5,
      trend: 'stable',
      icon: <FaEye size={13} />,
      color: 'text-yellow-400',
      accent: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
      border: 'border-yellow-400/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {displayMetrics.map((m, i) => {
        const TrendIcon =
          m.trend === 'up' ? FaArrowUp :
          m.trend === 'down' ? FaArrowDown :
          FaMinus;

        const trendColor =
          m.trend === 'up' ? 'text-emerald-400' :
          m.trend === 'down' ? 'text-red-400' :
          'text-gray-500';

        return (
          <div
            key={i}
            className={`rounded-2xl border p-4 flex flex-col gap-3 ${m.bg} ${m.border} bg-gray-900`}
          >
            {/* Icon + trend */}
            <div className="flex items-center justify-between">
              <div className={`w-8 h-8 rounded-xl ${m.bg} border ${m.border} flex items-center justify-center ${m.color}`}>
                {m.icon}
              </div>
              <div className={`flex items-center gap-0.5 text-[10px] font-semibold ${trendColor}`}>
                <TrendIcon size={8} />
                <span>{Math.abs(m.change)}%</span>
              </div>
            </div>

            {/* Value */}
            <div>
              <p className={`text-2xl sm:text-3xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-gray-500 text-xs font-medium mt-0.5">{m.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetricsCards;