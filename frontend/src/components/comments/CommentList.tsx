import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaThumbsUp, FaTrash, FaCheckCircle, FaGlobeAmericas, FaPaperPlane } from 'react-icons/fa';
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
  allCommenters?: { name: string; isAnonymous: boolean }[];
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
  itemId,
}) => {
  if (comments.length === 0) return null;

  const allCommenters = React.useMemo(() => {
    const seen = new Set<string>();
    const result: { name: string; isAnonymous: boolean }[] = [];
    const push = (c: any) => {
      const name = c.isAnonymous ? 'Anonymous Student' : (c.user?.name || 'Unknown');
      if (!seen.has(name)) { seen.add(name); result.push({ name, isAnonymous: !!c.isAnonymous }); }
    };
    comments.forEach(c => { push(c); (c.replies || []).forEach(push); });
    return result;
  }, [comments]);

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
          allCommenters={allCommenters}
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
  allCommenters = [],
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0, width: 0 });

  const inputRef = useRef<HTMLInputElement>(null);
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
    setShowMentionPicker(false);
    try {
      await onReply?.(comment.id, replyText.trim());
      setReplyText('');
      setShowReplyInput(false);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const mentionSuggestions = mentionQuery
    ? allCommenters.filter(c => c.name.toLowerCase().includes(mentionQuery.toLowerCase()))
    : allCommenters;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setReplyText(val);

    const atIndex = val.lastIndexOf('@');
    if (atIndex !== -1) {
      const charBefore = val[atIndex - 1];
      if (atIndex === 0 || charBefore === ' ') {
        const query = val.slice(atIndex + 1);
        setMentionQuery(query);
        setShowMentionPicker(true);
        setMentionIndex(0);

        if (inputRef.current) {
          const rect = inputRef.current.getBoundingClientRect();
          const pickerWidth = Math.min(rect.width, 240); // max 240px
          
          // Clamp left so it never goes off right edge of screen
          const maxLeft = window.innerWidth - pickerWidth - 8;
          const clampedLeft = Math.min(rect.left, maxLeft);

          setPickerPos({
            top: rect.top,
            left: clampedLeft,
            width: pickerWidth,
          });
        }
        return;
      }
    }
    setShowMentionPicker(false);
    setMentionQuery('');
  };

  const handleMentionSelect = (name: string) => {
    const atIndex = replyText.lastIndexOf('@');
    const before = replyText.slice(0, atIndex);
    const newText = `${before}@${name} `;
    setReplyText(newText);
    setShowMentionPicker(false);
    setMentionQuery('');
    inputRef.current?.focus();
  };

  const handleReplyKeyDown = (e: React.KeyboardEvent) => {
    if (showMentionPicker) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(i => Math.min(i + 1, mentionSuggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(i => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' && mentionSuggestions.length > 0) {
        e.preventDefault();
        handleMentionSelect(mentionSuggestions[mentionIndex].name);
        return;
      }
      if (e.key === 'Escape') {
        setShowMentionPicker(false);
        return;
      }
    }

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
        <img src={avatarSrc} alt={avatarName} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Bubble */}
        <div className="relative inline-block max-w-full sm:max-w-[90%]">
          <div className="!bg-[#3a3b3c] rounded-[18px] px-3.5 py-2.5 shadow-sm border border-gray-700/30">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-[12px] sm:text-[13px] !text-[#e4e6eb] hover:underline cursor-pointer">
                {comment.isAnonymous ? 'Anonymous Student' : (comment.user?.name || 'Unknown User')}
              </span>
              {comment.user?.role === 'ADMIN' && (
                <FaCheckCircle className="text-blue-400 flex-shrink-0" size={10} title="Admin" />
              )}
            </div>
            <div className="text-[13px] sm:text-[14px] !text-[#e4e6eb] leading-snug mt-0.5 break-words whitespace-pre-wrap">
              {comment.content}
            </div>
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
            <div className="flex-1">
              <div className="flex gap-1.5 bg-[#3a3b3c] rounded-[18px] px-3 py-1.5 items-center focus-within:ring-1 focus-within:ring-blue-500/40 transition-all border border-gray-700/30">
                <input
                  ref={inputRef}
                  type="text"
                  value={replyText}
                  onChange={handleInputChange}
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
          </div>
        )}

        {/* @mention picker portal — renders in document.body to escape modal overflow */}
        {showMentionPicker && mentionSuggestions.length > 0 && createPortal(
          <div
            style={{
              position: 'fixed',
              top: pickerPos.top,
              left: pickerPos.left,
              width: pickerPos.width,
              minWidth: '180px',
              maxWidth: '240px',
              transform: 'translateY(calc(-100% - 8px))',
              zIndex: 99999,
            }}
            className="bg-[#2a2b2c] border border-gray-700 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto"
          >
            <div className="px-3 py-1.5 text-[10px] text-gray-500 uppercase tracking-widest font-bold border-b border-gray-700/50 sticky top-0 bg-[#2a2b2c]">
              Mention someone
            </div>
            {mentionSuggestions.map((s, i) => (
              <button
                key={s.name}
                onMouseDown={e => { e.preventDefault(); handleMentionSelect(s.name); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors ${
                  i === mentionIndex ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(s.isAnonymous ? 'A' : s.name)}&background=${s.isAnonymous ? '4b5563' : 'random'}&color=fff`}
                    className="w-full h-full object-cover"
                    alt={s.name}
                  />
                </div>
                <span className="text-[13px] font-medium truncate">@{s.name}</span>
              </button>
            ))}
          </div>,
          document.body
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
                allCommenters={allCommenters}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};