import React, { useState } from 'react';
import { FaThumbsUp, FaTrash, FaCheckCircle, FaGlobeAmericas, FaReply, FaPaperPlane } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { useUserVerification } from '../../auth/auth';

interface CommentItemProps {
  comment: any;
  onUpdateComment?: (commentId: string, updateData: any) => void;
  onDeleteComment?: (commentId: string) => void;
  onVoteHelpful?: (commentId: string) => void;
  onReply?: (commentId: string, content: string) => void;
  itemId: string;
  isReply?: boolean;
}

interface CommentListProps {
  comments: any[];
  onUpdateComment?: (commentId: string, updateData: any) => void;
  onDeleteComment?: (commentId: string) => void;
  onVoteHelpful?: (commentId: string) => void;
  onReply?: (commentId: string, content: string) => void;
  itemId: string;
}

export const CommentList: React.FC<CommentListProps> = ({
  comments,
  onUpdateComment,
  onDeleteComment,
  onVoteHelpful,
  onReply,
  itemId
}) => {
  if (comments.length === 0) return null;

  return (
    <div className="space-y-4 mt-4">
      {comments.map((comment: any) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onUpdateComment={onUpdateComment}
          onDeleteComment={onDeleteComment}
          onVoteHelpful={onVoteHelpful}
          onReply={onReply}
          itemId={itemId}
        />
      ))}
    </div>
  );
};

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onDeleteComment,
  onVoteHelpful,
  onReply,
  isReply = false,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const currentUser: any = useUserVerification();

  const handleLike = () => {
    setIsLiked(prev => !prev);
    onVoteHelpful?.(comment.id);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this comment?')) {
      onDeleteComment?.(comment.id);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim() || isSubmittingReply) return;
    setIsSubmittingReply(true);
    try {
      await onReply?.(comment.id, replyText.trim());
      setReplyText('');
      setShowReplyInput(false);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleReplyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReplySubmit();
    }
    if (e.key === 'Escape') {
      setShowReplyInput(false);
      setReplyText('');
    }
  };

  const formatTimeShort = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const distance = formatDistanceToNow(date);
      return distance
        .replace('about ', '')
        .replace('less than a minute', '1m')
        .replace(' minutes', 'm')
        .replace(' minute', 'm')
        .replace(' hours', 'h')
        .replace(' hour', 'h')
        .replace(' days', 'd')
        .replace(' day', 'd');
    } catch {
      return 'just now';
    }
  };

  const isOwner = currentUser?.id === comment.userId || currentUser?.role === 'ADMIN';
  const likeCount = (comment.helpfulCount || 0) + (isLiked ? 1 : 0);
  const avatarName = comment.isAnonymous ? 'Anon' : (comment.user?.name || 'User');
  const avatarSrc = comment.isAnonymous
    ? `https://ui-avatars.com/api/?name=A&background=4b5563&color=fff`
    : (comment.user?.userImg || `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=random`);

  const replies: any[] = comment.replies || [];

  return (
    <div className={`flex gap-2 ${isReply ? 'ml-6 sm:ml-10' : ''}`}>
      {/* Avatar */}
      <div className={`${isReply ? 'w-6 h-6 sm:w-7 sm:h-7' : 'w-8 h-8 sm:w-9 sm:h-9'} rounded-full bg-gray-700 flex-shrink-0 overflow-hidden border border-gray-600 shadow-sm`}>
        <img
          src={avatarSrc}
          alt={avatarName}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        {/* Bubble */}
        <div className="relative inline-block max-w-full sm:max-w-[90%]">
          <div className="!bg-[#3a3b3c] rounded-[18px] px-3.5 py-2.5 shadow-sm border border-gray-700/30">
            {/* Username row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-[12px] sm:text-[13px] !text-[#e4e6eb] hover:underline cursor-pointer">
                {comment.isAnonymous ? 'Anonymous Student' : (comment.user?.name || 'Unknown User')}
              </span>
              {comment.user?.role === 'ADMIN' && (
                <FaCheckCircle className="text-blue-400 flex-shrink-0" size={10} title="Admin" />
              )}
            </div>

            {/* Content */}
            <div className="text-[13px] sm:text-[14px] !text-[#e4e6eb] leading-snug mt-0.5 break-words whitespace-pre-wrap">
              {comment.content}
            </div>

            {/* Location / Time metadata badges */}
            {(comment.location || comment.time) && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {comment.location && (
                  <span className="text-[9px] sm:text-[10px] bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-800/50">
                    📍 {comment.location}
                  </span>
                )}
                {comment.time && (
                  <span className="text-[9px] sm:text-[10px] bg-green-900/40 text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1 border border-green-800/50">
                    ⏰ {comment.time}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Reactions Count Badge */}
          {likeCount > 0 && (
            <div className="absolute -bottom-2 -right-1 !bg-[#3a3b3c] rounded-full shadow-md border border-gray-600 px-1.5 py-0.5 flex items-center gap-0.5 z-10">
              <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center">
                <FaThumbsUp className="text-white" size={7} />
              </div>
              <span className="text-[10px] sm:text-[11px] text-gray-300 font-medium px-0.5">{likeCount}</span>
            </div>
          )}
        </div>

        {/* Action Links */}
        <div className="flex items-center gap-3 mt-1.5 ml-1 text-[11px] sm:text-[12px] font-bold text-gray-500 flex-wrap">
          <button
            onClick={handleLike}
            className={`hover:underline transition-colors ${isLiked ? 'text-blue-400' : 'hover:text-[#b0b3b8]'}`}
          >
            Like
          </button>
          {onReply && (
            <button
              onClick={() => setShowReplyInput(prev => !prev)}
              className="hover:underline hover:text-[#b0b3b8] transition-colors"
            >
              Reply
            </button>
          )}
          <span className="font-normal flex items-center gap-1 text-gray-600">
            {formatTimeShort(comment.createdAt)}
            <FaGlobeAmericas size={9} className="text-gray-600" />
          </span>
          {isOwner && (
            <button
              onClick={handleDelete}
              className="font-normal text-gray-600 hover:text-red-400 hover:underline transition-colors ml-1 flex items-center gap-1"
            >
              <FaTrash size={9} /> Delete
            </button>
          )}
        </div>

        {/* Inline Reply Input */}
        {showReplyInput && (
          <div className="flex gap-2 mt-2 items-start animate-in slide-in-from-top-1 duration-150">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden border border-gray-600">
              <img
                src={currentUser?.userImg || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'You')}&background=random`}
                alt="You"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 flex gap-1.5 bg-[#3a3b3c] rounded-[18px] px-3 py-1.5 items-center focus-within:ring-1 focus-within:ring-blue-500/40 transition-all border border-gray-700/30">
              <input
                type="text"
                value={replyText}
                onChange={e => {
                  const val = e.target.value;
                  // Only block @ as the very first character on reply inputs
                  if (isReply && val === '@') return;
                  setReplyText(val);
                }}
                onKeyDown={handleReplyKeyDown}
                placeholder={`Replying to ${comment.user?.name || 'Anonymous'}...`}
                className="flex-1 bg-transparent border-none focus:ring-0 text-[12px] sm:text-[13px] !text-[#e4e6eb] placeholder-gray-500 outline-none min-w-0"
                autoFocus
              />
              <button
                onClick={handleReplySubmit}
                disabled={!replyText.trim() || isSubmittingReply}
                className={`p-1 transition-colors flex-shrink-0 ${replyText.trim() && !isSubmittingReply ? 'text-blue-400 hover:text-blue-300' : 'text-gray-600'}`}
              >
                {isSubmittingReply
                  ? <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                  : <FaPaperPlane size={12} />
                }
              </button>
            </div>
          </div>
        )}

        {/* Nested Replies */}
        {replies.length > 0 && (
          <div className="mt-3 space-y-3 border-l border-gray-800/50 pl-2">
            {replies.map((reply: any) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onDeleteComment={onDeleteComment}
                onVoteHelpful={onVoteHelpful}
                onReply={onReply}      
                itemId=""
                isReply={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
