import React, { useState } from 'react';
import { 
  FaUser, FaHistory, FaAward, FaChartLine, FaArrowUp, 
  FaArrowDown, FaCommentAlt, FaEye, FaCheckCircle, FaExclamationCircle 
} from 'react-icons/fa';
import { useGetUserReputationQuery, useGetReputationHistoryQuery, useGetUserBadgesQuery, useGetTrustLevelRequirementsQuery } from '../../redux/api/reputationApi';
import TrustIndicators from './TrustIndicators';
import BadgeSystem from './BadgeSystem';

interface ReputationDashboardProps {
  userId: string;
}

const ReputationDashboard: React.FC<ReputationDashboardProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'badges'>('overview');
  const [page, setPage] = useState(1);
  
  const { data: reputation, isLoading: repLoading } = useGetUserReputationQuery(userId);
  const { data: historyData, isLoading: historyLoading } = useGetReputationHistoryQuery({ userId, page, limit: 10 });
  const { data: userBadges, isLoading: badgesLoading } = useGetUserBadgesQuery(userId);
  const { data: trustLevels } = useGetTrustLevelRequirementsQuery({});

  if (repLoading) return (
    <div className="flex items-center justify-center p-20">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!reputation) return (
    <div className="bg-[#242526] p-8 rounded-xl text-center text-gray-500 border border-gray-800">
      <FaExclamationCircle size={40} className="mx-auto mb-4 opacity-20" />
      <p>Reputation data unavailable.</p>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FaChartLine /> },
    { id: 'history', label: 'Activity History', icon: <FaHistory /> },
    { id: 'badges', label: 'Badges', icon: <FaAward /> }
  ];

  return (
    <div className="bg-[#18191a] rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 sm:p-8 border-b border-gray-800">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 bg-gray-800 rounded-2xl border-4 border-[#18191a] flex items-center justify-center text-4xl text-blue-500 shadow-xl">
            {reputation.user?.name?.[0] || <FaUser />}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-bold text-white mb-1">{reputation.user?.name}</h2>
            <p className="text-gray-400 text-sm mb-4">{reputation.user?.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <TrustIndicators trustLevel={reputation.trustLevel} reputationPoints={reputation.reputationPoints} compact />
              <span className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Member since {new Date().getFullYear()}
              </span>
            </div>
          </div>
          <div className="bg-[#242526] p-4 rounded-xl border border-gray-800 text-center min-w-[120px]">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Total Score</p>
            <p className="text-3xl font-black text-blue-500">{reputation.reputationPoints}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#242526] border-b border-gray-800 p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all rounded-lg ${
              activeTab === tab.id 
                ? 'bg-gray-800 text-white shadow-inner' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="p-6 sm:p-8">
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Trust Status</h3>
                <TrustIndicators trustLevel={reputation.trustLevel} reputationPoints={reputation.reputationPoints} />
                
                <div className="bg-[#242526] p-5 rounded-xl border border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-bold text-sm">Next Level Progress</h4>
                    <span className="text-xs text-gray-500">500 Points to Expert</span>
                  </div>
                  <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[45%]" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Helpful Votes', val: reputation.helpfulPoints, icon: <FaCheckCircle />, color: 'text-green-400' },
                  { label: 'Discussions', val: reputation.threadsCreated, icon: <FaCommentAlt />, color: 'text-blue-400' },
                  { label: 'Comments', val: reputation.commentsCount, icon: <FaReply />, color: 'text-purple-400' },
                  { label: 'Sightings', val: reputation.verifiedSightings, icon: <FaEye />, color: 'text-yellow-400' }
                ].map((stat, i) => (
                  <div key={i} className="bg-[#242526] p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors group">
                    <div className={`${stat.color} mb-3 text-xl group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                    <p className="text-2xl font-black text-white">{stat.val}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Badge Preview */}
            <div className="border-t border-gray-800 pt-8">
              <BadgeSystem badges={userBadges || []} />
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4 animate-fadeIn">
            {historyLoading ? (
              <div className="text-center py-12 text-gray-500">Loading history...</div>
            ) : historyData?.history.length === 0 ? (
              <div className="text-center py-12 text-gray-600 bg-gray-800/20 rounded-xl border border-dashed border-gray-800">
                No reputation changes recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {historyData?.history.map((item: any) => (
                  <div key={item.id} className="bg-[#242526] p-4 rounded-xl border border-gray-800 flex items-center gap-4 group hover:bg-gray-800/50 transition-colors">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                      item.pointsChange > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {item.pointsChange > 0 ? <FaArrowUp /> : <FaArrowDown />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{item.reason}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{new Date(item.createdAt).toLocaleDateString()} • {item.actionType}</p>
                    </div>
                    <div className={`text-sm font-black ${item.pointsChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {item.pointsChange > 0 ? `+${item.pointsChange}` : item.pointsChange}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="animate-fadeIn">
            <BadgeSystem badges={userBadges || []} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReputationDashboard;
