import React, { useState, useEffect } from 'react';
import { FaReply, FaExclamationTriangle, FaComments } from 'react-icons/fa';
import { useSocket } from '../../hooks/useSocket';
import { CommentList } from './CommentList';
import { CommentInput } from './CommentInput';
import { CommentFilters } from './CommentFilters';
import {
  useGetCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
} from '../../redux/api/api';

interface CommentSectionProps {
  itemId: string;
  itemType: 'lost' | 'found';
  isModalView?: boolean;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  itemId,
  itemType,
  isModalView = false,
}) => {
  const [comments, setComments]       = useState<any[]>([]);
  const [filter, setFilter]           = useState('all');
  const [isLoading, setIsLoading]     = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const socket = useSocket({ autoConnect: true });

  const {
    data: fetchedData,
    isLoading: isFetching,
    isError: fetchError,
    error: fetchErrorDetail,
  } = useGetCommentsQuery({ itemId, itemType });

  const [createComment]                   = useCreateCommentMutation();
  const [deleteCommentMutation]           = useDeleteCommentMutation();

  const is404 = fetchError && (fetchErrorDetail as any)?.status === 404;

  // ── Sync fetched data → local state ──────────────────────────────────────
  useEffect(() => {
    const localComments  = localStorage.getItem(`comments_${itemId}`);
    const parsedLocal    = localComments ? JSON.parse(localComments) : [];

    if (fetchedData) {
      const merged = [...fetchedData];
      parsedLocal.forEach((lc: any) => {
        if (!merged.find((mc: any) => mc.id === lc.id)) merged.push(lc);
      });
      setComments(merged);
    } else if (parsedLocal.length > 0) {
      setComments(parsedLocal);
    }
  }, [fetchedData, itemId]);

  // ── Persist to localStorage ───────────────────────────────────────────────
  useEffect(() => {
    if (comments.length > 0) {
      localStorage.setItem(`comments_${itemId}`, JSON.stringify(comments));
    }
  }, [comments, itemId]);

  // ── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket.socket) return;

    socket.socket.emit('join-item', itemId);

    socket.socket.on('comment-added', (comment: any) => {
      setComments(prev => {
        // Avoid duplicates from optimistic update + socket broadcast
        if (prev.find(c => c.id === comment.id)) return prev;
        return [comment, ...prev];
      });
    });

    socket.socket.on('comment-updated', (updated: any) =>
      setComments(prev => prev.map(c => c.id === updated.id ? updated : c))
    );

    // Socket delete — only for OTHER users' views (we handle our own via REST)
    socket.socket.on('comment-deleted', (data: any) => {
      setComments(prev =>
        prev
          .filter(c => c.id !== data.commentId)
          .map(c => ({
            ...c,
            replies: (c.replies || []).filter((r: any) => r.id !== data.commentId),
          }))
      );
    });

    socket.socket.on('user-typing', (data: any) => {
      setTypingUsers(prev =>
        data.isTyping
          ? [...new Set([...prev, data.userName || 'Someone'])]
          : prev.filter(u => u !== (data.userName || 'Someone'))
      );
    });

    return () => {
      socket.socket?.emit('leave-item', itemId);
      socket.socket?.off('comment-added');
      socket.socket?.off('comment-updated');
      socket.socket?.off('comment-deleted');
      socket.socket?.off('user-typing');
    };
  }, [itemId, socket.socket]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleNewComment = async (commentData: any) => {
    setIsLoading(true);
    const tempId     = `local_${Date.now()}`;
    const newComment = {
      id: tempId,
      itemId,
      itemType,
      ...commentData,
      createdAt:    new Date().toISOString(),
      replies:      [],
      helpfulCount: 0,
      user: {
        name: commentData.isAnonymous
          ? 'Anonymous Student'
          : (socket.socket?.auth as any)?.userName || 'You',
        role: 'USER',
      },
    };

    setComments(prev => [newComment, ...prev]);

    try {
      const result = await createComment({
        itemId,
        itemType,
        ...commentData,
      }).unwrap();

      // Replace temp comment with real one from server
      setComments(prev => prev.map(c => c.id === tempId ? result : c));
    } catch (err) {
      console.warn('Comment save failed, keeping locally:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTyping = (isTyping: boolean) =>
    socket.emit(isTyping ? 'typing-start' : 'typing-stop', { itemId });

  const handleVoteHelpful = (commentId: string) => {
    socket.emit('vote-helpful', { commentId, itemId });
    setComments(prev =>
      prev.map(c =>
        c.id === commentId
          ? { ...c, helpfulCount: (c.helpfulCount || 0) + 1 }
          : c
      )
    );
  };

  // ── DELETE — REST first, optimistic UI, no socket emit needed ────────────
  const handleDeleteComment = async (commentId: string) => {
    // Optimistically remove from UI instantly
    setComments(prev =>
      prev
        .filter(c => c.id !== commentId)
        .map(c => ({
          ...c,
          replies: (c.replies || []).filter((r: any) => r.id !== commentId),
        }))
    );

    // Also clear from localStorage immediately
    const local = localStorage.getItem(`comments_${itemId}`);
    if (local) {
      const parsed = JSON.parse(local);
      const updated = parsed
        .filter((c: any) => c.id !== commentId)
        .map((c: any) => ({
          ...c,
          replies: (c.replies || []).filter((r: any) => r.id !== commentId),
        }));
      localStorage.setItem(`comments_${itemId}`, JSON.stringify(updated));
    }

    try {
      await deleteCommentMutation({ commentId, itemId }).unwrap();
    } catch (err) {
      console.error('Delete failed:', err);
      // RTK Query will invalidate ["comments"] tag and refetch, restoring the comment
    }
  };

  const handleUpdateComment = (commentId: string, updateData: any) =>
    socket.emit('update-comment', { commentId, updateData, itemId });

  // ── REPLY — always targets the top-level parent comment ──────────────────
  const handleReplyToComment = async (parentCommentId: string, content: string) => {
    const tempId   = `reply_${Date.now()}`;
    const newReply = {
      id:          tempId,
      content,
      createdAt:   new Date().toISOString(),
      isAnonymous: false,
      replies:     [],
      helpfulCount: 0,
      user: {
        name: (socket.socket?.auth as any)?.userName || 'You',
        role: 'USER',
      },
    };

    // Optimistically add reply under the parent
    setComments(prev =>
      prev.map(c =>
        c.id === parentCommentId
          ? { ...c, replies: [...(c.replies || []), newReply] }
          : c
      )
    );

    try {
      const result = await createComment({
        itemId,
        itemType,
        content,
        parentCommentId,
      }).unwrap();

      // Replace temp reply with real server response
      setComments(prev =>
        prev.map(c =>
          c.id === parentCommentId
            ? {
                ...c,
                replies: (c.replies || []).map((r: any) =>
                  r.id === tempId ? result : r
                ),
              }
            : c
        )
      );
    } catch (err) {
      console.warn('Reply save failed, keeping locally:', err);
    }
  };

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filteredComments = comments.filter(comment => {
    switch (filter) {
      case 'helpful':   return (comment.helpfulCount || 0) > 0;
      case 'questions': return comment.content?.includes('?');
      case 'sightings': return /saw|seen|found/i.test(comment.content || '');
      default:          return true;
    }
  });

  // ── Main content ──────────────────────────────────────────────────────────
  const mainContent = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <FaComments size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-200">Community Activity</h4>
            <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold">
              {comments.length} total interaction{comments.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <CommentFilters filter={filter} onChange={setFilter} />
      </div>

      {/* Typing indicators */}
      {typingUsers.length > 0 && (
        <div className="flex items-center gap-2 text-[12px] text-blue-400 italic animate-pulse px-2">
          <div className="flex gap-0.5">
            <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" />
          </div>
          {typingUsers.join(', ')} typing…
        </div>
      )}

      {/* Comment list */}
      {isFetching ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading discussion...</p>
        </div>
      ) : fetchError && !is404 ? (
        <div className="text-center py-12 px-4 bg-red-500/5 border border-red-500/20 rounded-2xl">
          <FaExclamationTriangle className="text-red-500 text-2xl mx-auto mb-2" />
          <h5 className="text-red-400 font-bold">Failed to load comments</h5>
          <p className="text-red-400/60 text-xs">There was an error fetching the discussion.</p>
        </div>
      ) : filteredComments.length > 0 ? (
        <CommentList
          comments={filteredComments}
          onUpdateComment={handleUpdateComment}
          onDeleteComment={handleDeleteComment}
          onVoteHelpful={handleVoteHelpful}
          onReply={handleReplyToComment}
          itemId={itemId}
        />
      ) : (
        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4 border border-gray-700/50">
            <FaReply className="text-gray-600 text-2xl rotate-180" />
          </div>
          <h5 className="text-gray-300 font-bold mb-1">No tips yet</h5>
          <p className="text-gray-500 text-xs max-w-[200px] mx-auto leading-relaxed">
            Be the first to share a sighting or leave a helpful tip for the community.
          </p>
        </div>
      )}
    </div>
  );

  // ── Modal view ────────────────────────────────────────────────────────────
  if (isModalView) {
    return (
      <div className="flex flex-col h-full max-h-[80vh] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="pb-4">{mainContent}</div>
        </div>
        <div className="mt-auto bg-gray-900 border-t border-gray-800 p-4 pt-2 z-10">
          <CommentInput
            onSubmit={handleNewComment}
            isLoading={isLoading}
            onTyping={handleTyping}
          />
        </div>
      </div>
    );
  }

  // ── Inline view ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      <CommentInput
        onSubmit={handleNewComment}
        isLoading={isLoading}
        onTyping={handleTyping}
      />
      <div className="h-px bg-gray-800/50" />
      <div className="pb-6">{mainContent}</div>
    </div>
  );
};