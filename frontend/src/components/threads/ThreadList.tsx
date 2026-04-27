import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaFilter, FaSort, FaEye, FaStar, FaClock, FaMapMarkerAlt, FaCalendarAlt, FaTag, FaFire, FaBookmark, FaThumbsUp, FaThumbsDown, FaReply, FaUser, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useSocket } from '../../hooks/useSocket';

interface Thread {
  id: string;
  title: string;
  category: string;
  content: string;
  createdBy: {
    id: string;
    name: string;
    role: string;
  };
  isPinned: boolean;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  voteCount: number;
  helpfulCount: number;
  _count: {
    count: number;
    users: number;
    replies: number;
  };
}

interface ThreadListProps {
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  user?: any;
}

const ThreadList: React.FC<ThreadListProps> = ({
  category,
  search,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  user
}) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<'createdAt' | 'replyCount' | 'voteCount'>('createdAt');
  const [filterValue, setFilterValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [userVote, setUserVote] = useState<Record<string, 'upvote' | 'downvote'>>({});
  const [isBookmarked, setIsBookmarked] = useState<Record<string, boolean>>({});
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});

  const socket = useSocket({ autoConnect: true });

  // Categories for filtering
  const categories = [
    { value: 'ALL', label: 'All Threads', icon: <FaTag size={12} className="text-gray-400" /> },
    { value: 'location', label: 'Location-Based', icon: <FaMapMarkerAlt size={12} className="text-gray-400" /> },
    { value: 'trending', label: 'Trending', icon: <FaFire size={12} className="text-gray-400" /> },
    { value: 'general', label: 'General', icon: <FaClock size={12} className="text-gray-400" /> }
  ];

  // Sort options
  const sortOptions = [
    { value: 'createdAt-desc', label: 'Newest First' },
    { value: 'createdAt-asc', label: 'Oldest First' },
    { value: 'replyCount-desc', label: 'Most Discussed' },
    { value: 'voteCount-desc', label: 'Most Popular' }
  ];

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All Threads' },
    { value: 'pinned', label: 'Pinned Only' },
    { value: 'my', label: 'My Threads' }
  ];

  useEffect(() => {
    if (socket.isConnected) {
      socket.on('thread-created', (thread) => {
        setThreads(prev => [thread, ...prev.slice(0, 19)]);
        setTotal(prev => prev + 1);
      });
      
      socket.on('thread-updated', (thread) => {
        setThreads(prev => prev.map(t => t.id === thread.id ? thread : t));
      });
      
      socket.on('thread-deleted', (threadId) => {
        setThreads(prev => prev.filter(t => t.id !== threadId));
        setTotal(prev => Math.max(0, prev - 1));
      });
      
      socket.on('thread-pinned', (thread) => {
        setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, isPinned: thread.isPinned } : t));
      });
      
      socket.on('thread-voted', (threadId, voteCount) => {
        setThreads(prev => prev.map(t => t.id === threadId ? { ...t, voteCount } : t));
      });
    }
  }, [socket.isConnected]);

  const handleCategoryChange = (newCategory: string) => {
    setSelectedCategory(newCategory);
    setPage(1);
  };

  const handleSearchChange = (newSearch: string) => {
    setFilterValue(newSearch);
    setPage(1);
  };

  const handleSortChange = (newSortOrder: string) => {
    setSortOrder(newSortOrder as any);
    setPage(1);
  };

  const handleVote = async (threadId: string, voteType: 'upvote' | 'downvote') => {
    try {
      const response = await fetch(`/api/threads/${threadId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voteType }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserVote(prev => ({ ...prev, [threadId]: voteType }));
        setThreads(prev => prev.map(t => t.id === threadId ? { ...t, voteCount: data.voteCount } : t));
        toast.success('Vote recorded successfully');
      }
    } catch (error) {
      toast.error('Failed to record vote');
    }
  };

  const handleBookmark = async (threadId: string) => {
    try {
      const response = await fetch(`/api/threads/${threadId}/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setIsBookmarked(prev => ({ ...prev, [threadId]: !prev[threadId] }));
        toast.success(isBookmarked[threadId] ? 'Bookmark removed' : 'Thread bookmarked');
      }
    } catch (error) {
      toast.error('Failed to bookmark thread');
    }
  };

  const handleShare = async (threadId: string) => {
    try {
      const url = `${window.location.origin}/threads/${threadId}`;
      await navigator.clipboard.writeText(url);
      toast.success('Thread link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const toggleThreadExpansion = (threadId: string) => {
    setExpandedThreads(prev => ({ ...prev, [threadId]: !prev[threadId] }));
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.icon || <FaClock size={12} className="text-gray-400" />;
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <ToastContainer position="top-right" />
      
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-white text-xl font-bold">Discussion Threads</h1>
              <span className="text-gray-400 text-sm">
                {total} {total === 1 ? 'thread' : 'threads'}
              </span>
            </div>
            
            {/* Search and Filters */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                <input
                  type="text"
                  value={filterValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search threads..."
                  className="w-64 pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-gray-300 transition-colors"
              >
                <FaFilter size={14} className="mr-2" />
                Filters
              </button>
              
              <select
                value={`${sortOrder}-desc`}
                onChange={(e) => handleSortChange(e.target.value)}
                className="flex items-center px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-gray-300 transition-colors"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-800 border-b border-gray-700 sticky top-16 z-10">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Filter Threads</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <FaTimes size={14} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Filter Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Filter</label>
                <select
                  value={filterValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  {filterOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setFilterValue('');
                  setShowFilters(false);
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-gray-300 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Threads List */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading threads...</p>
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <FaSearch size={24} className="text-gray-600" />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">No threads found</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              {filterValue || selectedCategory !== 'ALL' ? 'Try adjusting your filters' : 'Be the first to start a discussion!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => (
              <div key={thread.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-all duration-200">
                {/* Thread Header */}
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {thread.isPinned && (
                          <span className="flex items-center px-2 py-0.5 bg-yellow-500/10 text-yellow-400 border-yellow-500/20 rounded-full text-xs font-medium">
                            <FaBookmark size={8} className="mr-1" /> Pinned
                          </span>
                        )}
                        <span className="flex items-center px-2 py-0.5 bg-blue-500/10 text-blue-400 border-blue-500/20 rounded-full text-xs font-medium">
                          {getCategoryIcon(thread.category)}
                          <span className="ml-1">{thread.category}</span>
                        </span>
                        <span className="flex items-center px-2 py-0.5 bg-gray-700 text-gray-300 border border-gray-600 rounded-full text-xs font-medium">
                          <FaUser size={8} className="mr-1" />
                          {thread.createdBy.name}
                        </span>
                        <span className="flex items-center px-2 py-0.5 bg-gray-700 text-gray-300 border border-gray-600 rounded-full text-xs font-medium">
                          <FaCalendarAlt size={8} className="mr-1" />
                          {formatTimeAgo(thread.createdAt)}
                        </span>
                      </div>
                      
                      <h3 className="text-white text-lg font-semibold line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {thread.title}
                      </h3>
                      
                      {thread.tags && thread.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {thread.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 bg-gray-700 text-gray-300 border border-gray-600 rounded-full text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <FaEye size={12} />
                      {thread._count?.count || 0} views
                    </span>
                    <span className="flex items-center gap-1">
                      <FaReply size={12} />
                      {thread.replyCount} replies
                    </span>
                    <span className="flex items-center gap-1">
                      <FaStar size={12} />
                      {thread.voteCount} votes
                    </span>
                  </div>
                </div>

                {/* Thread Preview */}
                <div className="px-4 pb-4">
                  {thread.content && (
                    <p className="text-gray-300 text-sm line-clamp-3 leading-relaxed">
                      {thread.content}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 border-t border-gray-700">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/threads/${thread.id}`}
                      className="flex items-center px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
                    >
                      <FaEye size={12} className="mr-2" />
                      View
                    </Link>
                    <button
                      onClick={() => handleVote(thread.id, 'upvote')}
                      className={`flex items-center px-3 py-1.5 rounded-lg transition-colors ${
                        userVote[thread.id] === 'upvote'
                          ? "bg-green-500/20 border-green-500/40 text-green-400"
                          : "bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm"
                      }`}
                    >
                      <FaThumbsUp size={12} className="mr-1" />
                      {thread.voteCount > 0 && <span>{thread.voteCount}</span>}
                    </button>
                    <button
                      onClick={() => handleVote(thread.id, 'downvote')}
                      className={`flex items-center px-3 py-1.5 rounded-lg transition-colors ${
                        userVote[thread.id] === 'downvote'
                          ? "bg-red-500/20 border-red-500/40 text-red-400"
                          : "bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm"
                      }`}
                    >
                      <FaThumbsDown size={12} className="mr-1" />
                    </button>
                    <button
                      onClick={() => handleBookmark(thread.id)}
                      className={`flex items-center px-3 py-1.5 rounded-lg transition-colors ${
                        isBookmarked[thread.id]
                          ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                          : "bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm"
                      }`}
                    >
                      <FaBookmark size={12} className="mr-1" />
                      {isBookmarked[thread.id] ? 'Bookmarked' : 'Bookmark'}
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex items-center px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
                    >
                      <FaReply size={12} className="mr-1" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-gray-400 text-sm">
                Page {page} of {Math.ceil(total / 20)}
              </span>
              <button
                onClick={() => setPage(prev => Math.min(Math.ceil(total / 20), prev + 1))}
                disabled={page >= Math.ceil(total / 20)}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadList;
