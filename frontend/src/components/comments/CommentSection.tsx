import React, { useState, useEffect } from 'react';
import { FaReply, FaExclamationTriangle, FaComments } from 'react-icons/fa';
import { useSocket } from '../../hooks/useSocket';
import { CommentList } from './CommentList';
import { CommentInput } from './CommentInput';
import { CommentFilters } from './CommentFilters';
import { useGetCommentsQuery, useCreateCommentMutation } from '../../redux/api/api';
import { toast } from 'react-toastify';

interface CommentSectionProps {
  itemId: string;
  itemType: 'lost' | 'found';
  isModalView?: boolean;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ itemId, itemType, isModalView = false }) => {
  const [comments, setComments] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const socket = useSocket({ autoConnect: true });

  const { data: fetchedData, isLoading: isFetching, isError: fetchError, error: fetchErrorDetail } = useGetCommentsQuery({ itemId });
  const [createComment] = useCreateCommentMutation();

  // Determine if this is a 404 (endpoint not deployed yet) vs a real error
  const is404 = fetchError && (fetchErrorDetail as any)?.status === 404;

  useEffect(() => {
    // Load from localStorage first
    const localComments = localStorage.getItem(`comments_${itemId}`);
    const parsedLocal = localComments ? JSON.parse(localComments) : [];
    
    if (fetchedData) {
      // Merge: unique comments from API + any unique local ones
      const merged = [...fetchedData];
      parsedLocal.forEach((lc: any) => {
        if (!merged.find(mc => mc.id === lc.id)) {
          merged.push(lc);
        }
      });
      setComments(merged);
    } else if (parsedLocal.length > 0) {
      setComments(parsedLocal);
    }
  }, [fetchedData, itemId]);

  // Sync back to localStorage whenever comments change
  useEffect(() => {
    if (comments.length > 0) {
      localStorage.setItem(`comments_${itemId}`, JSON.stringify(comments));
    }
  }, [comments, itemId]);

  useEffect(() => {
    if (!socket.socket) return;
    socket.socket.emit('join-item', itemId);
    socket.socket.on('comment-added', (comment: any) => setComments(prev => [comment, ...prev]));
    socket.socket.on('comment-updated', (updated: any) =>
      setComments(prev => prev.map(c => c.id === updated.id ? updated : c))
    );
    socket.socket.on('comment-deleted', (data: any) =>
      setComments(prev => prev.filter(c => c.id !== data.commentId))
    );
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
    const newComment = {
      id: tempId,
      itemId,
      itemType,
      ...commentData,
      createdAt: new Date().toISOString(),
      replies: [],
      helpfulCount: 0,
      user: {
        name: commentData.isAnonymous ? 'Anonymous Student' : (socket.socket?.auth as any)?.userName || 'You',
        role: 'USER'
      }
    };

    // Optimistically add to UI
    setComments(prev => [newComment, ...prev]);

    try {
      const result = await createComment({
        itemId,
        itemType,
        ...commentData
      }).unwrap();
      
      // Replace temp with real
      setComments(prev => prev.map(c => c.id === tempId ? result : c));
    } catch (err) {
      console.warn('Backend not available (404), keeping comment in local storage:', err);
      // We keep it in state, and useEffect above will save it to localStorage
    } finally {
      setIsLoading(false);
    }
  };

  const handleTyping = (isTyping: boolean) =>
    socket.emit(isTyping ? 'typing-start' : 'typing-stop', { itemId });

  const handleVoteHelpful = (commentId: string) => {
    socket.emit('vote-helpful', { commentId, itemId });
    setComments(prev =>
      prev.map(c => c.id === commentId ? { ...c, helpfulCount: (c.helpfulCount || 0) + 1 } : c)
    );
  };

  const handleDeleteComment = (commentId: string) => {
    socket.emit('delete-comment', { commentId, itemId });
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleUpdateComment = (commentId: string, updateData: any) =>
    socket.emit('update-comment', { commentId, updateData, itemId });

  const handleReplyToComment = async (parentCommentId: string, content: string) => {
    const tempId = `reply_${Date.now()}`;
    const newReply = {
      id: tempId,
      content,
      createdAt: new Date().toISOString(),
      isAnonymous: false, // Default to known user for replies
      user: {
        name: 'You',
        role: 'USER'
      }
    };

    // Optimistically add to UI
    setComments(prev => prev.map(c => 
      c.id === parentCommentId 
        ? { ...c, replies: [...(c.replies || []), newReply] } 
        : c
    ));

    try {
      const result = await createComment({
        itemId,
        itemType,
        content,
        parentCommentId,
      }).unwrap();
      
      // Replace temp with real in the nested replies
      setComments(prev => prev.map(c => 
        c.id === parentCommentId 
          ? { ...c, replies: c.replies.map((r: any) => r.id === tempId ? result : r) } 
          : c
      ));
    } catch (err) {
      console.warn('Backend not available for reply, keeping local:', err);
    }
  };

  const filteredComments = comments.filter(comment => {
    switch (filter) {
      case 'helpful':   return comment.helpfulCount > 0;
      case 'questions': return comment.content.includes('?');
      case 'sightings': return /saw|seen|found/i.test(comment.content);
      default:          return true;
    }
  });

  const mainContent = (
    <div className="space-y-6">
      {/* Header section with Stats & Filters */}
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
            <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></span>
          </div>
          {typingUsers.join(', ')} typing…
        </div>
      )}

      {/* Comment List */}
      {isFetching ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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

  // If in modal view, we want a sticky input at the bottom
  if (isModalView) {
    return (
      <div className="flex flex-col h-full max-h-[80vh] overflow-hidden">
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="pb-4">
            {mainContent}
          </div>
        </div>
        
        {/* Sticky Input Bar at Bottom (Inside Modal) */}
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

  // Standard inline view
  return (
    <div className="flex flex-col gap-6">
      <CommentInput
        onSubmit={handleNewComment}
        isLoading={isLoading}
        onTyping={handleTyping}
      />
      <div className="h-px bg-gray-800/50" />
      <div className="pb-6">
        {mainContent}
      </div>
    </div>
  );
};