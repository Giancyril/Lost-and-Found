import React from 'react';
import { FaThumbsUp, FaReply, FaShare, FaEllipsisH } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

interface CommentItemProps {
  comment: any;
  user?: any;
  onVoteHelpful?: (commentId: string) => void;
  onReply?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  showActions?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  user,
  onVoteHelpful,
  onReply,
  onDelete,
  showActions = true
}) => {
  const isOwnComment = user?.id === comment.userId;
  const isHelpful = comment.helpfulCount > 0;
  
  return (
    <div className="flex gap-2 group mb-4">
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-gray-700 bg-gray-800">
          <img 
            src={comment.user?.userImg || `https://ui-avatars.com/api/?name=${comment.user?.name || 'User'}&background=random`} 
            alt="Avatar" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Bubble Container */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Main Bubble */}
          <div className="relative inline-block max-w-[90%] sm:max-w-[85%] !bg-[#3a3b3c] px-3.5 py-2 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-bold text-[13px] !text-[#e4e6eb] hover:underline cursor-pointer">
                {comment.user?.name || comment.userName || 'Anonymous'}
              </span>
              {comment.userRole === 'ADMIN' && (
                <span className="text-[10px] bg-blue-500/20 !text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-blue-500/20">
                  Admin
                </span>
              )}
            </div>
            <p className="text-[14px] !text-[#e4e6eb] leading-snug break-words">
              {comment.content}
            </p>

            {/* Sighting Metadata Badge inside bubble if present */}
            {(comment.location || comment.time) && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {comment.location && (
                  <span className="text-[10px] bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-800/50">
                    📍 {comment.location}
                  </span>
                )}
                {comment.time && (
                  <span className="text-[10px] bg-green-900/40 text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1 border border-green-800/50">
                    ⏰ {comment.time}
                  </span>
                )}
              </div>
            )}

            {/* Reaction Count Badge (Floating on the bottom right) */}
            {isHelpful && (
              <div className="absolute -bottom-2 -right-2 flex items-center gap-0.5 bg-gray-700 border border-gray-600 rounded-full px-1.5 py-0.5 shadow-lg">
                <div className="flex -space-x-1">
                  <div className="bg-blue-500 rounded-full p-0.5 ring-1 ring-gray-700">
                    <FaThumbsUp size={8} className="text-white" />
                  </div>
                </div>
                <span className="text-[10px] font-medium text-gray-300">{comment.helpfulCount}</span>
              </div>
            )}
          </div>

          {/* More Options (Hidden by default, shown on hover) */}
          <button className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-gray-300 transition-opacity">
            <FaEllipsisH size={14} />
          </button>
        </div>

        {/* Action Links */}
        {showActions && (
          <div className="flex items-center gap-3 mt-1 ml-2 text-[12px] font-bold text-gray-500">
            <button 
              onClick={() => onVoteHelpful?.(comment.id)}
              disabled={isOwnComment}
              className={`hover:underline transition-colors ${isHelpful ? 'text-blue-400' : 'hover:text-[#b0b3b8]'}`}
            >
              Like
            </button>
            <button 
              onClick={() => onReply?.(comment.id)}
              className="hover:underline hover:text-[#b0b3b8] transition-colors"
            >
              Reply
            </button>
            <button className="hover:underline hover:text-[#b0b3b8] transition-colors">
              Share
            </button>
            <span className="font-normal text-gray-600 ml-1">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: false }).replace('about ', '').replace('less than a minute', 'now')}
            </span>
            {isOwnComment && (
              <button 
                onClick={() => onDelete?.(comment.id)}
                className="hover:underline text-red-500/70 hover:text-red-500 ml-2"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
