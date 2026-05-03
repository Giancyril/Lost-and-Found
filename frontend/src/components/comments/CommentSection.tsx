import React, { useState, useEffect, useRef } from 'react';
import { FaReply, FaExclamationTriangle, FaComments } from 'react-icons/fa';
import { useSocket } from '../../hooks/useSocket';
import { useUserVerification } from '../../auth/auth';
import { CommentList } from './CommentList';
import { CommentInput } from './CommentInput';
import { CommentFilters } from './CommentFilters';
import {
  useGetCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useUpdateCommentMutation,
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

  // FIX: get the actual logged-in user so optimistic comments show correct name
  const currentUser: any = useUserVerification();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const savedIdsRef = useRef<Set<string>>(new Set());

  const socket = useSocket({ autoConnect: true });

  const {
    data: fetchedData,
    isLoading: isFetching,
    isError: fetchError,
    error: fetchErrorDetail,
  } = useGetCommentsQuery({ itemId, itemType });

  const [createComment]         = useCreateCommentMutation();
  const [deleteCommentMutation] = useDeleteCommentMutation();
  const [updateCommentMutation] = useUpdateCommentMutation();

  const is404 = fetchError && (fetchErrorDetail as any)?.status === 404;

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const findTopLevelParent = (targetId: string, commentList: any[]) => {
    return commentList.find(
      c =>
        c.id === targetId ||
        (c.replies || []).some((r: any) => r.id === targetId)
    );
  };

  useEffect(() => {
    if (fetchedData) {
      setComments(fetchedData);
      localStorage.setItem(`comments_${itemId}`, JSON.stringify(fetchedData));

      savedIdsRef.current = new Set();
      fetchedData.forEach((c: any) => {
        savedIdsRef.current.add(c.id);
        (c.replies || []).forEach((r: any) => savedIdsRef.current.add(r.id));
      });
    } else {
      const localComments = localStorage.getItem(`comments_${itemId}`);
      if (localComments) {
        try {
          const parsed = JSON.parse(localComments);
          setComments(parsed);
        } catch {
          setComments([]);
        }
      }
    }
  }, [fetchedData, itemId]);

  useEffect(() => {
    if (!socket.socket) return;

    socket.socket.emit('join-item', itemId);

    socket.socket.on('comment-added', (comment: any) => {
      if (savedIdsRef.current.has(comment.id)) return;
      savedIdsRef.current.add(comment.id);

      if (comment.parentCommentId) {
        setComments(prev => {
          const topLevel = findTopLevelParent(comment.parentCommentId, prev);
          if (!topLevel) return prev;
          return prev.map(c =>
            c.id === topLevel.id
              ? {
                  ...c,
                  replies: (c.replies || []).find((r: any) => r.id === comment.id)
                    ? c.replies
                    : [...(c.replies || []), comment],
                }
              : c
          );
        });
      } else {
        setComments(prev => {
          if (prev.find(c => c.id === comment.id)) return prev;
          return [comment, ...prev];
        });
      }
    });

    socket.socket.on('comment-updated', (updated: any) =>
      setComments(prev => prev.map(c => c.id === updated.id ? updated : c))
    );

    socket.socket.on('comment-deleted', (data: any) => {
      savedIdsRef.current.delete(data.commentId);
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

  const handleNewComment = async (commentData: any) => {
    setIsLoading(true);
    const tempId = `local_${Date.now()}`;

    // FIX: use actual logged-in user name/id for optimistic comment
    // so the "You" badge and edit/delete buttons appear immediately
    const isAnon = commentData.isAnonymous || !currentUser?.id;
    const newComment = {
      id:           tempId,
      itemId,
      itemType,
      ...commentData,
      isAnonymous:  isAnon,
      createdAt:    new Date().toISOString(),
      replies:      [],
      helpfulCount: 0,
      // Populate userId so CommentList.isCurrentUser check matches immediately
      userId:       currentUser?.id ?? null,
      user: isAnon
        ? null
        : {
            id:      currentUser.id,
            name:    currentUser.name || currentUser.username || 'You',
            userImg: currentUser.userImg ?? null,
            role:    currentUser.role ?? 'USER',
          },
    };

    setComments(prev => [newComment, ...prev]);
    scrollToTop();

    try {
      const { image, ...commentPayload } = commentData;
      const result = await createComment({
        itemId,
        itemType,
        ...commentPayload,
      }).unwrap();

      savedIdsRef.current.add(result.id);
      // Replace optimistic comment with real one from server
      setComments(prev => prev.map(c => c.id === tempId ? result : c));
    } catch (err) {
      console.warn('Comment save failed, keeping locally:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTyping = (isTyping: boolean) =>
    socket.emit(isTyping ? 'typing-start' : 'typing-stop', { itemId });

  const [replyContent, setReplyContent] = useState('');
  const [showReplyInput, setShowReplyInput] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any>(null);

  const handleDeleteComment = async (commentId: string) => {
    savedIdsRef.current.delete(commentId);

    setComments(prev =>
      prev
        .filter(c => c.id !== commentId)
        .map(c => ({
          ...c,
          replies: (c.replies || []).filter((r: any) => r.id !== commentId),
        }))
    );

    const local = localStorage.getItem(`comments_${itemId}`);
    if (local) {
      try {
        const parsed  = JSON.parse(local);
        const updated = parsed
          .filter((c: any) => c.id !== commentId)
          .map((c: any) => ({
            ...c,
            replies: (c.replies || []).filter((r: any) => r.id !== commentId),
          }));
        localStorage.setItem(`comments_${itemId}`, JSON.stringify(updated));
      } catch { /* ignore */ }
    }

    try {
      await deleteCommentMutation({ commentId, itemId }).unwrap();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

    const handleUpdateComment = async (commentId: string, updateData: any) => {
    // Optimistic update
    setComments(prev =>
      prev.map(c =>
        c.id === commentId
          ? { ...c, ...updateData }
          : { ...c, replies: (c.replies || []).map((r: any) => r.id === commentId ? { ...r, ...updateData } : r) }
      )
    );
    try {
      const updated = await updateCommentMutation({ commentId, itemId, ...updateData }).unwrap();
      setComments(prev =>
        prev.map(c =>
          c.id === commentId
            ? updated
            : { ...c, replies: (c.replies || []).map((r: any) => r.id === commentId ? updated : r) }
        )
      );
      socket.emit('update-comment', { commentId, updateData, itemId });
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleReplyToComment = async (parentCommentId: string, content: string) => {
  if (parentCommentId.startsWith('reply_') || parentCommentId.startsWith('local_')) {
    console.warn('Blocked reply to unsaved temp comment');
    return;
  }

  // ✅ Fix: search both top-level comments AND their replies
  // so replying to a reply still works correctly
  let parentComment = comments.find(c => c.id === parentCommentId);
  let topLevelId = parentCommentId;

  if (!parentComment) {
    // parentCommentId is a reply — find which top-level comment owns it
    const topLevel = comments.find(c =>
      (c.replies || []).some((r: any) => r.id === parentCommentId)
    );
    if (topLevel) {
      parentComment = topLevel.replies.find((r: any) => r.id === parentCommentId);
      topLevelId = topLevel.id; // ← always use top-level id for DB
    }
  }

  // ✅ Fix: check all possible name fields including username
  const name =
    parentComment?.user?.name ||
    parentComment?.user?.username ||
    (parentComment?.isAnonymous ? 'Anonymous Student' : 'Anonymous Student');

  const finalContent = `@${name} ${content}`;
  const tempId = `reply_${Date.now()}`;

  const newReply = {
    id:          tempId,
    content:     finalContent,
    createdAt:   new Date().toISOString(),
    isAnonymous: !currentUser?.id,
    replies:     [],
    helpfulCount: 0,
    userId:      currentUser?.id ?? null,
    user:        currentUser?.id
      ? {
          id:      currentUser.id,
          name:    currentUser.name || currentUser.username || 'You',
          userImg: currentUser.userImg ?? null,
          role:    currentUser.role ?? 'USER',
        }
      : null,
  };

  // Optimistic update — attach to top-level comment
  setComments(prev =>
    prev.map(c =>
      c.id === topLevelId
        ? { ...c, replies: [...(c.replies || []), newReply] }
        : c
    )
  );

  setReplyContent('');
  setShowReplyInput(null);
  setReplyingTo(null);

  try {
    const result = await createComment({
      itemId,
      itemType,
      content:         finalContent,
      parentCommentId: topLevelId, // ← always send top-level id to DB
    }).unwrap();

    savedIdsRef.current.add(result.id);

    setComments(prev =>
      prev.map(c =>
        c.id === topLevelId
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
    console.warn('Reply save failed, rolling back:', err);
    setComments(prev =>
      prev.map(c =>
        c.id === topLevelId
          ? { ...c, replies: (c.replies || []).filter((r: any) => r.id !== tempId) }
          : c
      )
    );
  }
};


  const filteredComments = comments.filter(comment => {
    switch (filter) {
      case 'helpful':   return (comment.helpfulCount || 0) > 0;
      case 'questions': return comment.content?.includes('?');
      case 'sightings': return /saw|seen|found/i.test(comment.content || '');
      default:          return true;
    }
  });

  const mainContent = (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <div
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(147,197,253,0.1) 100%)',
              border: '1px solid rgba(59,130,246,0.25)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <FaComments size={18} className="text-blue-400 sm:hidden" />
            <FaComments size={22} className="text-blue-400 hidden sm:block" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm sm:text-base font-bold text-white mb-1">Community Discussion</h4>
            <div className="flex items-center gap-3 sm:gap-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                {comments.length} {comments.length === 1 ? 'Interaction' : 'Interactions'}
              </p>
              {comments.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="hidden sm:inline">Active</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <CommentFilters filter={filter} onChange={setFilter} />
        </div>
      </div>

      {typingUsers.length > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-2 rounded-xl"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}
        >
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
          </div>
          <span className="text-sm text-blue-300 font-medium">
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
          </span>
        </div>
      )}

      <div className="min-h-[200px]">
        {isFetching ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-gray-400 text-sm font-medium">Loading discussion...</p>
          </div>
        ) : fetchError && !is404 ? (
          <div className="text-center py-12 px-6 rounded-2xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <FaExclamationTriangle className="text-red-400 text-3xl mx-auto mb-3" />
          </div>
        ) : filteredComments.length > 0 ? (
          <div className="space-y-1">
            <CommentList
              comments={filteredComments}
              onUpdateComment={handleUpdateComment}
              onDeleteComment={handleDeleteComment}
              onReply={handleReplyToComment}
              itemId={itemId}
            />
          </div>
        ) : (
          <div className="text-center py-16 px-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(107,114,128,0.1) 0%, rgba(75,85,99,0.05) 100%)',
                border: '2px solid rgba(107,114,128,0.2)',
              }}
            >
              <FaReply className="text-gray-500 text-3xl rotate-180" />
            </div>
            <h5 className="text-gray-300 font-bold text-lg mb-3">No comments yet</h5>
            <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed mb-6">
              Be the first to share a sighting or leave a helpful tip for the community.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (isModalView) {
    return (
      <div className="flex flex-col flex-1 min-h-0" style={{ height: '100%' }}>
        <div
          ref={scrollContainerRef}
          id="modal-comment-scroll"
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 pt-4"
          style={{ paddingBottom: '80px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
        >
          {mainContent}
        </div>
        <div
          className="shrink-0 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'linear-gradient(160deg, #0f1318 0%, #0d1117 100%)' }}
        >
          <div className="p-4">
            <CommentInput onSubmit={handleNewComment} isLoading={isLoading} onTyping={handleTyping} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <CommentInput onSubmit={handleNewComment} isLoading={isLoading} onTyping={handleTyping} />
      <div className="h-px bg-gray-800/50" />
      <div className="pb-6">{mainContent}</div>
    </div>
  );
};