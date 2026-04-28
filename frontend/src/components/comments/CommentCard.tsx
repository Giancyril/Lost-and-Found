import React, { useState, useRef } from 'react';
import { FaReply, FaEdit, FaTrash, FaUser, FaTimes, FaComment, FaCalendarAlt } from 'react-icons/fa';
import { useUserVerification } from '../../auth/auth';

interface CommentCardProps {
  comment: any;
  isReply?: boolean;
  onReply?: (id: string, content: string) => void;
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
  isCurrentUser?: boolean;
  showDeleteModal?: boolean;
  onDeleteConfirm?: () => void;
  onDeleteCancel?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const timeAgo = (dateString: string): string => {
  try {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    if (diff < 10080) return `${Math.floor(diff / 1440)}d ago`;
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'just now';
  }
};

// ── Avatar ────────────────────────────────────────────────────────────────────

const Avatar = ({
  name,
  userImg,
  isAnonymous,
  size = 'md',
}: {
  name: string;
  userImg?: string;
  isAnonymous?: boolean;
  size?: 'sm' | 'md';
}) => {
  const dim = size === 'sm' ? 'w-6 h-6 text-[9px]' : 'w-7 h-7 text-[10px]';
  const initials = isAnonymous
    ? '?'
    : name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

  if (isAnonymous) {
    return (
      <div
        className={`${dim} rounded-full flex items-center justify-center shrink-0
          bg-gray-800 border border-gray-700/60 font-bold text-gray-500`}
      >
        {initials}
      </div>
    );
  }

  if (userImg) {
    return (
      <img
        src={userImg}
        alt={name}
        className={`${dim} rounded-full object-cover shrink-0 border border-blue-500/25`}
      />
    );
  }

  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center shrink-0 font-bold
        bg-gradient-to-br from-blue-600 to-blue-800 border border-blue-500/25 text-blue-200`}
    >
      {initials}
    </div>
  );
};

// ── CommentCard ───────────────────────────────────────────────────────────────

export const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  isReply = false,
  onReply,
  onEdit,
  onDelete,
  isCurrentUser = false,
  showDeleteModal = false,
  onDeleteConfirm,
  onDeleteCancel,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content || '');
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const editRef = useRef<HTMLTextAreaElement>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const currentUser: any = useUserVerification();

  const displayName = comment.isAnonymous
    ? 'Anonymous'
    : comment.user?.name || 'Unknown';

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply?.(comment.id, replyContent);
      setReplyContent('');
      setShowReplyInput(false);
    }
  };

  const handleEdit = () => {
    if (editContent.trim() && editContent !== comment.content) {
      onEdit?.(comment.id, editContent);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content || '');
    setIsEditing(false);
  };

  return (
    <>
      {/* ── Card ─────────────────────────────────────────────────────────── */}
      <div
        className={`
          relative bg-gray-900 border border-white/[0.06] rounded-2xl
          overflow-hidden transition-all duration-200 hover:border-white/[0.10]
          ${isReply ? '' : 'mb-3'}
        `}
      >
        {/* Header strip — mirrors dashboard panel headers */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-white/[0.04] bg-white/[0.01]">
          <Avatar
            name={displayName}
            userImg={comment.user?.userImg}
            isAnonymous={comment.isAnonymous}
          />

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-[12px] font-bold text-white tracking-wide truncate">
              {displayName}
            </span>
            {isCurrentUser && (
              <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-400/10 text-blue-300 border border-blue-400/20 rounded-full shrink-0">
                You
              </span>
            )}
          </div>

          <span className="text-[11px] text-gray-600 shrink-0 font-medium">
            {timeAgo(comment.createdAt)}
          </span>
        </div>

        {/* Body */}
        <div className="px-3.5 py-3">
          {isEditing ? (
            /* Edit mode — inline panel like dashboard form fields */
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden">
              <textarea
                ref={editRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                autoFocus
                className="w-full bg-transparent text-gray-200 text-sm px-3 py-2.5
                  resize-none focus:outline-none min-h-[72px] placeholder-gray-600"
                style={{ fontFamily: 'inherit' }}
              />
              <div className="flex gap-2 px-2.5 py-2 border-t border-white/[0.05]">
                <button
                  onClick={handleEdit}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-lg
                    bg-blue-400/10 text-blue-300 border border-blue-400/20
                    hover:bg-blue-400/20 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-lg
                    text-gray-500 border border-white/[0.07]
                    hover:text-gray-300 hover:bg-white/[0.04] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-300 leading-relaxed">
              {comment.content}
            </p>
          )}
        </div>

        {/* Footer actions — compact icon-button row */}
        {!isEditing && (
          <div className="flex items-center gap-1.5 px-3.5 py-2 border-t border-white/[0.04]">
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold
                px-2.5 py-1.5 rounded-lg text-gray-400
                bg-white/[0.04] border border-white/[0.07]
                hover:text-gray-200 hover:bg-white/[0.07] transition-colors"
            >
              <FaReply size={10} /> Reply
            </button>

            {isCurrentUser && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold
                    px-2.5 py-1.5 rounded-lg text-gray-400
                    bg-white/[0.04] border border-white/[0.07]
                    hover:text-gray-200 hover:bg-white/[0.07] transition-colors"
                >
                  <FaEdit size={10} /> Edit
                </button>
                <button
                  onClick={() => onDelete?.(comment.id)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold
                    px-2.5 py-1.5 rounded-lg text-red-400
                    bg-red-500/[0.07] border border-red-500/20
                    hover:bg-red-500/15 hover:text-red-300 transition-colors"
                >
                  <FaTrash size={10} /> Delete
                </button>
              </>
            )}
          </div>
        )}

        {/* Reply input — inline panel */}
        {showReplyInput && (
          <div className="mx-3.5 mb-3 bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden">
            <div className="flex items-start gap-2.5 px-3 pt-2.5">
              <Avatar
                name={currentUser?.name || 'You'}
                userImg={currentUser?.userImg}
                isAnonymous={!currentUser}
                size="sm"
              />
              <textarea
                ref={replyRef}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Reply to ${displayName}…`}
                autoFocus
                rows={2}
                className="flex-1 bg-transparent text-gray-200 text-sm pt-0.5 pb-2.5
                  resize-none focus:outline-none placeholder-gray-600 min-h-[52px]"
                style={{ fontFamily: 'inherit' }}
              />
            </div>
            <div className="flex gap-2 px-2.5 py-2 border-t border-white/[0.05]">
              <button
                onClick={handleReply}
                disabled={!replyContent.trim()}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg
                  bg-blue-400/10 text-blue-300 border border-blue-400/20
                  hover:bg-blue-400/20 disabled:opacity-40 disabled:cursor-not-allowed
                  transition-colors"
              >
                Reply
              </button>
              <button
                onClick={() => { setShowReplyInput(false); setReplyContent(''); }}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg
                  text-gray-500 border border-white/[0.07]
                  hover:text-gray-300 hover:bg-white/[0.04] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Modal ──────────────────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <FaTrash size={11} className="text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Delete Comment</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={onDeleteCancel}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/[0.07]
                  flex items-center justify-center text-gray-500 hover:text-white transition-colors"
              >
                <FaTimes size={11} />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-4 space-y-3">
              {/* Comment preview panel */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.05]">
                  <FaComment size={9} className="text-blue-400" />
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                    Comment to Delete
                  </p>
                </div>
                <div className="p-3 space-y-1.5">
                  <p className="text-white text-sm font-semibold line-clamp-3">
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-3 pt-1 text-[10px] text-gray-600">
                    <span className="flex items-center gap-1">
                      <FaUser size={8} className="text-emerald-400" />
                      {comment.user?.name || 'Anonymous'}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaCalendarAlt size={8} className="text-emerald-400" />
                      {timeAgo(comment.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-red-500/5 border border-red-500/15 rounded-xl px-3 py-2.5">
                <p className="text-red-300/80 text-xs leading-relaxed">
                  This will <strong>permanently remove</strong> the comment and all associated data.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={onDeleteCancel}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold
                    bg-white/[0.04] text-gray-400 border border-white/[0.07]
                    hover:text-gray-200 hover:bg-white/[0.07] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onDeleteConfirm}
                  className="flex-1 flex items-center justify-center gap-1.5
                    py-2.5 rounded-xl text-xs font-semibold
                    bg-red-500/10 text-red-400 border border-red-500/30
                    hover:bg-red-500/20 hover:text-red-300 transition-colors"
                >
                  <FaTrash size={10} /> Delete Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};