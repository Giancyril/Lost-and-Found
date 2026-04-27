import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

interface CommentsState {
  comments: Record<string, Comment[]>;
  loading: boolean;
  error: string | null;
}

const initialState: CommentsState = {
  comments: {},
  loading: false,
  error: null
};

const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    setComments: (state, action: PayloadAction<{ comments: Comment[]; itemId: string }>) => {
      const { comments, itemId } = action.payload;
      state.comments[itemId] = comments;
    },
    addComment: (state, action: PayloadAction<{ comment: Comment; itemId: string }>) => {
      const { comment, itemId } = action.payload;
      const existingComments = state.comments[itemId] || [];
      state.comments[itemId] = [comment, ...existingComments];
    },
    updateComment: (state, action: PayloadAction<{ comment: Comment; itemId: string }>) => {
      const { comment, itemId } = action.payload;
      const existingComments = state.comments[itemId] || [];
      state.comments[itemId] = existingComments.map(c => 
        c.id === comment.id ? comment : c
      );
    },
    removeComment: (state, action: PayloadAction<{ commentId: string; itemId: string }>) => {
      const { commentId, itemId } = action.payload;
      const existingComments = state.comments[itemId] || [];
      state.comments[itemId] = existingComments.filter(c => c.id !== commentId);
    },
    setLoading: (state, action: PayloadAction<{ loading: boolean }>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<{ error: string | null }>) => {
      state.error = action.payload;
    },
    clearComments: (state, action: PayloadAction<{ itemId: string }>) => {
      const { itemId } = action.payload;
      delete state.comments[itemId];
    }
  }
});

export const { 
  setComments, 
  addComment, 
  updateComment, 
  removeComment, 
  setLoading, 
  setError, 
  clearComments 
} = commentsSlice.actions;

export default commentsSlice.reducer;
