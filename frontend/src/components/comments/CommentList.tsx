import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUserVerification } from '../../auth/auth';
import { CommentCard } from './CommentCard';

interface CommentListProps {
  comments: any[];
  onUpdateComment?: (id: string, data: any) => void;
  onDeleteComment?: (id: string) => void;
  onReply?: (parentId: string, content: string) => void;
  itemId: string;
}

// ── Mention picker (unchanged) ───────────────────────────

const MentionPickerPortal: React.FC<{
  anchorRef: React.RefObject<HTMLDivElement | null>;
  suggestions: { name: string; isAnonymous: boolean }[];
  activeIndex: number;
  onSelect: (name: string) => void;
}> = ({ anchorRef, suggestions, activeIndex, onSelect }) => {
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const recalc = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({ top: rect.top + window.scrollY - 8, left: rect.left + window.scrollX, width: rect.width });
  }, [anchorRef]);

  useEffect(() => {
    recalc();
    window.addEventListener('scroll', recalc, true);
    window.addEventListener('resize', recalc);
    return () => {
      window.removeEventListener('scroll', recalc, true);
      window.removeEventListener('resize', recalc);
    };
  }, [recalc]);

  if (!pos) return null;

  return createPortal(
    <div style={{
      position: 'absolute', top: pos.top, left: pos.left,
      width: pos.width, zIndex: 999999, transform: 'translateY(-100%)',
    }}>
      <div style={{
        background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12,
        overflow: 'hidden', maxHeight: 200, overflowY: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      }}>
        <div style={{
          padding: '6px 12px 4px', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: '#6b7280', borderBottom: '1px solid #e5e7eb',
        }}>
          Mention someone
        </div>
        {suggestions.map((s, i) => (
          <button
            key={s.name}
            onMouseDown={e => { e.preventDefault(); onSelect(s.name); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px',
              background: i === activeIndex ? '#f3f4f6' : 'transparent',
              color: '#374151', border: 'none', cursor: 'pointer', fontSize: 13,
            }}
          >
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(s.isAnonymous ? 'A' : s.name)}&background=${s.isAnonymous ? '#6b7280' : '#3b82f6'}&color=fff&size=28`}
              style={{ width: 28, height: 28, borderRadius: '50%' }}
              alt={s.name}
            />
            @{s.name}
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
};

// ── CommentList ───────────────────────────────────────────────────────────────

export const CommentList: React.FC<CommentListProps> = ({
  comments,
  onDeleteComment,
  onUpdateComment,
  onReply,
  itemId,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const currentUser: any = useUserVerification();

  const handleReply  = (commentId: string, content: string) => onReply?.(commentId, content);
  const handleEdit   = (commentId: string, content: string) => onUpdateComment?.(commentId, { content });
  const handleDelete = (commentId: string) => setShowDeleteModal(commentId);

  // Function to filter out duplicates by ID
  const deduplicate = (arr: any[]) => arr.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

  const renderComment = (comment: any, isReply = false): React.ReactNode => {
    const isCurrentUser =
      currentUser?.id === comment.userId || currentUser?.role === 'ADMIN';

    // Deduplicate replies to prevent duplicate key errors in nested threads
    const uniqueReplies = deduplicate(comment.replies || []);

    return (
      <div key={comment.id}>
        <CommentCard
          comment={comment}
          isReply={isReply}
          onReply={handleReply}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isCurrentUser={isCurrentUser}
          showDeleteModal={showDeleteModal === comment.id}
          onDeleteConfirm={() => { onDeleteComment?.(comment.id); setShowDeleteModal(null); }}
          onDeleteCancel={() => setShowDeleteModal(null)}
        />

        {uniqueReplies.length > 0 && (
          <div className={`relative mt-2 ${isReply ? '' : 'ml-10'}`}>
            <div
              className="absolute left-3.5 top-0 bottom-3 w-px"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            />
            <div className="flex flex-col gap-2">
              {uniqueReplies.map((reply: any) => (
                <div key={reply.id} className="relative pl-8">
                  <div
                    className="absolute left-3.5 top-[18px] w-4 h-px"
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                  />
                  {renderComment(reply, true)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const uniqueComments = deduplicate(comments);

  return (
    <div className="flex flex-col gap-3">
      {uniqueComments.map(comment => renderComment(comment))}
    </div>
  );
};