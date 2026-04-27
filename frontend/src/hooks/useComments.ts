import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';

interface Comment {
  id: string;
  content: string;
  userId?: string;
  user?: {
    id: string;
    name: string;
    role: string;
  };
  itemId: string;
  itemType: 'lost' | 'found';
  isAnonymous: boolean;
  helpfulCount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  location?: string;
  rejectionReason?: string;
}

interface UseCommentsOptions {
  itemId: string;
  itemType: 'lost' | 'found';
  autoConnect?: boolean;
}

export const useComments = (options: UseCommentsOptions) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socket = useSocket({ autoConnect: options.autoConnect });

  // Fetch initial comments
  useEffect(() => {
    if (!options.itemId) return;

    const fetchComments = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real implementation, this would be an API call
        // For now, we'll simulate with mock data
        const mockComments: Comment[] = [
          {
            id: '1',
            content: 'I think I saw this near the library around 3 PM today',
            userId: 'user1',
            user: { id: 'user1', name: 'John Doe', role: 'USER' },
            itemId: options.itemId,
            itemType: options.itemType,
            isAnonymous: false,
            helpfulCount: 5,
            status: 'APPROVED',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            location: 'Library - Second Floor'
          },
          {
            id: '2',
            content: 'Check the lost & found at Building A, I turned one in yesterday',
            userId: null,
            user: null,
            itemId: options.itemId,
            itemType: options.itemType,
            isAnonymous: true,
            helpfulCount: 2,
            status: 'PENDING',
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            location: 'Building A - Front Desk'
          }
        ];
        
        setComments(mockComments);
      } catch (err) {
        setError('Failed to fetch comments');
        console.error('Error fetching comments:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [options.itemId, options.itemType]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket.socket) return;

    const handleNewComment = (comment: Comment) => {
      if (comment.itemId === options.itemId && comment.itemType === options.itemType) {
        setComments(prev => [comment, ...prev]);
      }
    };

    const handleCommentUpdated = (updatedComment: Comment) => {
      if (updatedComment.itemId === options.itemId && updatedComment.itemType === options.itemType) {
        setComments(prev => 
          prev.map(comment => 
            comment.id === updatedComment.id ? updatedComment : comment
          )
        );
      }
    };

    socket.socket.on('comment-added', handleNewComment);
    socket.socket.on('comment-updated', handleCommentUpdated);

    return () => {
      socket.socket?.off('comment-added', handleNewComment);
      socket?.off('comment-updated', handleCommentUpdated);
    };
  }, [socket.socket, options.itemId, options.itemType]);

  // Join item room for real-time updates
  useEffect(() => {
    if (!socket.socket || !options.itemId) return;

    socket.socket.emit('join-item', options.itemId);
  }, [socket.socket, options.itemId]);

  const addComment = async (commentData: {
    content: string;
    isAnonymous: boolean;
    location?: string;
  }) => {
    if (!socket.socket) {
      setError('Not connected to server');
      return null;
    }

    try {
      // In a real implementation, this would emit to the server
      // For now, we'll simulate the response
      const newComment: Comment = {
        id: Date.now().toString(),
        content: commentData.content,
        userId: 'current-user', // This would come from auth context
        user: { id: 'current-user', name: 'Current User', role: 'USER' },
        itemId: options.itemId,
        itemType: options.itemType,
        isAnonymous: commentData.isAnonymous,
        helpfulCount: 0,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        location: commentData.location
      };

      // Simulate server response
      setComments(prev => [newComment, ...prev]);
      return newComment;
    } catch (err) {
      setError('Failed to post comment');
      console.error('Error posting comment:', err);
      return null;
    }
  };

  const voteHelpful = async (commentId: string) => {
    if (!socket.socket) {
      setError('Not connected to server');
      return;
    }

    try {
      // In a real implementation, this would emit to the server
      // For now, we'll simulate the response
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, helpfulCount: comment.helpfulCount + 1 }
            : comment
        )
      );
    } catch (err) {
      console.error('Error voting helpful:', err);
    }
  };

  const updateComment = async (commentId: string, updateData: {
    content?: string;
    location?: string;
  }) => {
    if (!socket.socket) {
      setError('Not connected to server');
      return null;
    }

    try {
      // In a real implementation, this would emit to the server
      // For now, we'll simulate the response
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, ...updateData, updatedAt: new Date().toISOString() }
            : comment
        )
      );
    } catch (err) {
      setError('Failed to update comment');
      console.error('Error updating comment:', err);
      return null;
    }
  };

  return {
    comments,
    isLoading,
    error,
    addComment,
    voteHelpful,
    updateComment
  };
};
