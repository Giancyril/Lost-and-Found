import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FaArrowLeft, FaUser, FaCalendarAlt, FaTag, FaBookmark, FaThumbsUp, 
  FaThumbsDown, FaReply, FaShareAlt, FaMapMarkerAlt, FaFire, FaClock 
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import { useGetThreadByIdQuery, useGetThreadRepliesQuery, useCreateReplyMutation } from '../../redux/api/threadsApi';

const ThreadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: thread, isLoading: threadLoading, error: threadError } = useGetThreadByIdQuery(id);
  const { data: replies, isLoading: repliesLoading } = useGetThreadRepliesQuery(id);
  const [createReply, { isLoading: isSubmitting }] = useCreateReplyMutation();
  
  const [replyContent, setReplyContent] = useState('');

  if (threadLoading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (threadError || !thread) return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-gray-400">
      <p className="text-xl font-bold mb-4">Thread not found</p>
      <Link to="/threads" className="text-blue-500 hover:underline">Back to discussions</Link>
    </div>
  );

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      await createReply({ threadId: id!, content: replyContent }).unwrap();
      setReplyContent('');
      toast.success('Reply posted!');
    } catch (error) {
      toast.error('Failed to post reply');
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-[#18191a] text-[#e4e6eb] pb-12">
      <ToastContainer theme="dark" />
      
      {/* Top Navigation */}
      <div className="bg-[#242526] border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/threads" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
            <FaArrowLeft size={18} className="text-gray-400" />
          </Link>
          <h1 className="font-bold truncate">{thread.title}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {/* Main Post */}
        <div className="bg-[#242526] rounded-xl border border-gray-800 p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {thread.createdBy.name[0]}
            </div>
            <div>
              <p className="font-bold text-white leading-tight">{thread.createdBy.name}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                <span className="flex items-center gap-1"><FaClock size={10} /> {formatTime(thread.createdAt)}</span>
                <span className="bg-gray-800 px-2 py-0.5 rounded-full">{thread.category}</span>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-4 leading-tight">{thread.title}</h2>
          
          <div className="text-[#e4e6eb] leading-relaxed whitespace-pre-wrap mb-6">
            {thread.content}
          </div>

          {thread.tags && thread.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {thread.tags.map((tag: string, i: number) => (
                <span key={i} className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md border border-blue-500/20">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Post Actions */}
          <div className="flex items-center gap-2 border-t border-gray-800 pt-4 mt-6">
            <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-blue-400">
              <FaThumbsUp size={16} /> <span className="font-medium">{thread.voteCount || 0}</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-red-400">
              <FaThumbsDown size={16} />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-blue-400 ml-auto">
              <FaShareAlt size={16} /> Share
            </button>
          </div>
        </div>

        {/* Reply Input */}
        <div className="bg-[#242526] rounded-xl border border-gray-800 p-4 shadow-lg">
          <form onSubmit={handleReplySubmit}>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="w-full bg-[#3a3b3c] border-none rounded-lg p-3 text-[#e4e6eb] placeholder-[#8a8d91] focus:ring-2 focus:ring-blue-500 resize-none min-h-[100px]"
            />
            <div className="flex justify-end mt-3">
              <button
                disabled={isSubmitting || !replyContent.trim()}
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {isSubmitting ? 'Posting...' : <><FaReply /> Post Reply</>}
              </button>
            </div>
          </form>
        </div>

        {/* Replies List */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white px-2">Replies ({replies?.length || 0})</h3>
          {repliesLoading ? (
            <div className="py-8 text-center text-gray-500">Loading replies...</div>
          ) : replies?.length === 0 ? (
            <div className="bg-[#242526] rounded-xl border border-gray-800 p-8 text-center text-gray-500 shadow-md">
              No replies yet. Be the first to join the conversation!
            </div>
          ) : (
            replies.map((reply: any) => (
              <div key={reply.id} className="bg-[#242526] rounded-xl border border-gray-800 p-4 shadow-md hover:border-gray-700 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {reply.user.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm leading-tight">{reply.user.name}</p>
                    <p className="text-[10px] text-gray-500">{formatTime(reply.createdAt)}</p>
                  </div>
                </div>
                <div className="text-sm text-[#e4e6eb] leading-relaxed whitespace-pre-wrap">
                  {reply.content}
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-800/50">
                  <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-400 transition-colors">
                    <FaThumbsUp size={12} /> {reply.helpfulCount || 0} Helpful
                  </button>
                  <button className="text-xs text-gray-400 hover:text-white transition-colors">
                    Reply
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreadDetail;
