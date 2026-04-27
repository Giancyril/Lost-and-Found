import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaSearch, FaFilter, FaEye, FaStar, FaClock, FaMapMarkerAlt, 
  FaCalendarAlt, FaTag, FaFire, FaBookmark, FaThumbsUp, 
  FaThumbsDown, FaReply, FaUser, FaTimes, FaPlus 
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useSocket } from '../../hooks/useSocket';
import { useGetThreadsQuery } from '../../redux/api/threadsApi';

const ThreadList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');

  const { data, isLoading, isError, refetch } = useGetThreadsQuery({
    page,
    category: category === 'ALL' ? undefined : category,
    search: search || undefined,
    sortBy,
    limit: 10
  });

  const socket = useSocket({ autoConnect: true });

  useEffect(() => {
    if (socket.isConnected) {
      const handleUpdate = () => refetch();
      socket.on('thread-created', handleUpdate);
      socket.on('thread-updated', handleUpdate);
      socket.on('thread-deleted', handleUpdate);
      
      return () => {
        socket.off('thread-created', handleUpdate);
        socket.off('thread-updated', handleUpdate);
        socket.off('thread-deleted', handleUpdate);
      };
    }
  }, [socket.isConnected, refetch]);

  const categories = [
    { value: 'ALL', label: 'All Threads', icon: <FaTag /> },
    { value: 'location', label: 'Location-Based', icon: <FaMapMarkerAlt /> },
    { value: 'trending', label: 'Trending', icon: <FaFire /> },
    { value: 'general', label: 'General', icon: <FaClock /> }
  ];

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="min-h-screen bg-[#18191a] text-[#e4e6eb] pb-20">
      <ToastContainer theme="dark" />
      
      {/* Premium Header */}
      <div className="bg-[#242526] border-b border-gray-800 sticky top-0 z-10 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <FaReply size={20} className="rotate-180" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight uppercase">Community Discussions</h1>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Connect and help fellow students</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search discussions..."
                  className="w-full md:w-64 pl-9 pr-4 py-2 bg-[#3a3b3c] border-none rounded-xl text-sm text-white placeholder-[#8a8d91] focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              
              <Link
                to="/threads/new"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 text-sm"
              >
                <FaPlus size={12} /> <span className="hidden sm:inline">Start Discussion</span>
              </Link>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  category === cat.value
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20'
                    : 'bg-[#3a3b3c] text-gray-400 border-transparent hover:bg-[#4a4b4c]'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 pl-4 border-l border-gray-800">
               <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-gray-500 focus:ring-0 cursor-pointer hover:text-gray-300"
              >
                <option value="createdAt">Newest First</option>
                <option value="replyCount">Most Discussed</option>
                <option value="voteCount">Most Popular</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Threads List */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-[#242526] rounded-2xl border border-gray-800" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-20 bg-[#242526] rounded-2xl border border-gray-800">
            <p className="text-red-400 font-bold">Failed to load discussions.</p>
            <button onClick={() => refetch()} className="mt-4 text-blue-500 hover:underline">Try again</button>
          </div>
        ) : data?.threads.length === 0 ? (
          <div className="text-center py-20 bg-[#242526] rounded-2xl border border-gray-800">
            <FaReply size={40} className="mx-auto mb-4 opacity-10 rotate-180" />
            <h3 className="text-xl font-bold text-white">No discussions found</h3>
            <p className="text-gray-500 mt-1">Be the first to start a conversation in this category!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.threads.map((thread: any) => (
              <Link 
                key={thread.id} 
                to={`/threads/${thread.id}`}
                className="bg-[#242526] border border-gray-800 rounded-2xl p-5 hover:border-gray-600 transition-all group flex flex-col shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-blue-500/20">
                      {thread.category}
                    </span>
                    {thread.isPinned && (
                      <FaBookmark className="text-yellow-500" size={10} />
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold">{formatTimeAgo(thread.createdAt)}</span>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                  {thread.title}
                </h3>
                
                <p className="text-gray-400 text-sm line-clamp-2 mb-6 flex-1 leading-relaxed">
                  {thread.content}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-800/50">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                      {thread.createdBy.name[0]}
                    </div>
                    <span className="text-xs text-gray-400 font-medium">{thread.createdBy.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-gray-500">
                    <span className="flex items-center gap-1.5 text-xs font-bold">
                      <FaReply size={12} className="opacity-50" /> {thread.replyCount}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold">
                      <FaThumbsUp size={12} className="opacity-50" /> {thread.voteCount}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && data?.total > 10 && (
          <div className="flex items-center justify-center mt-12 gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 bg-[#242526] border border-gray-800 rounded-xl text-sm font-bold disabled:opacity-30 hover:bg-[#3a3b3c] transition-all"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm font-bold text-gray-500">
              Page {page} of {Math.ceil(data.total / 10)}
            </span>
            <button
              disabled={page >= Math.ceil(data.total / 10)}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 bg-[#242526] border border-gray-800 rounded-xl text-sm font-bold disabled:opacity-30 hover:bg-[#3a3b3c] transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadList;
