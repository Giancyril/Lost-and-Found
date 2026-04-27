import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connectionCount: number;
  lastConnectedAt: string | null;
  lastActivity: string | null;
  onlineUsers: number;
  typingUsers: string[];
}

const initialState: SocketState = {
  isConnected: false,
  isConnecting: false,
  error: null,
  connectionCount: 0,
  lastConnectedAt: null,
  lastActivity: null,
  onlineUsers: 0,
  typingUsers: []
};

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    setConnected: (state) => {
      state.isConnected = true;
      state.isConnecting = false;
      state.error = null;
      state.connectionCount += 1;
      state.lastConnectedAt = new Date().toISOString();
      state.lastActivity = new Date().toISOString();
    },
    setConnecting: (state) => {
      state.isConnecting = true;
      state.error = null;
    },
    setDisconnected: (state) => {
      state.isConnected = false;
      state.isConnecting = false;
      state.error = 'Disconnected from server';
      state.typingUsers = [];
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    setOnlineUsers: (state, action: PayloadAction<number>) => {
      state.onlineUsers = action.payload;
    },
    setTypingUsers: (state, action: PayloadAction<string[]>) => {
      state.typingUsers = action.payload;
    },
    addTypingUser: (state, action: PayloadAction<string>) => {
      const userId = action.payload;
      if (!state.typingUsers.includes(userId)) {
        state.typingUsers = [...state.typingUsers, userId];
      }
    },
    removeTypingUser: (state, action: PayloadAction<string>) => {
      state.typingUsers = state.typingUsers.filter(id => id !== action.payload);
    },
    clearTypingUsers: (state) => {
      state.typingUsers = [];
    },
    updateActivity: (state) => {
      state.lastActivity = new Date().toISOString();
    }
  }
});

export const {
  setConnected,
  setConnecting,
  setDisconnected,
  setError,
  setOnlineUsers,
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
  clearTypingUsers,
  updateActivity
} = socketSlice.actions;

export default socketSlice.reducer;
