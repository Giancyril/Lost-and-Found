# Community Features Implementation Plan

## 🚀 Phase 1: Foundation (Weeks 1-3)

### Week 1: Database & Backend Setup

#### Database Schema
```
server/src/prisma/schema.prisma
├── Add Comment model
├── Add DiscussionThread model  
├── Add ThreadReply model
├── Add UserReputation model
└── Run migrations
```

#### WebSocket Infrastructure
```
server/src/
├── websocket/
│   ├── socketServer.ts
│   ├── socketHandlers.ts
│   └── socketMiddleware.ts
├── redis/
│   ├── redisClient.ts
│   └── redisPubSub.ts
└── config/
    └── socketConfig.ts
```

#### API Endpoints
```
server/src/api/
├── comments/
│   ├── commentsRouter.ts
│   ├── commentsController.ts
│   └── commentsService.ts
├── threads/
│   ├── threadsRouter.ts
│   ├── threadsController.ts
│   └── threadsService.ts
└── moderation/
    ├── moderationRouter.ts
    └── moderationService.ts
```

### Week 2: Frontend Components

#### Comment System UI
```
frontend/src/components/comments/
├── CommentSection.tsx
├── CommentList.tsx
├── CommentItem.tsx
├── CommentInput.tsx
├── CommentFilters.tsx
└── CommentModeration.tsx
```

#### Real-Time Integration
```
frontend/src/hooks/
├── useSocket.ts
├── useComments.ts
└── useRealTime.ts

frontend/src/store/
├── commentsSlice.ts
└── socketSlice.ts
```

#### User Authentication Integration
```
frontend/src/components/auth/
├── UserProfile.tsx
├── UserBadge.tsx
└── AnonymousToggle.tsx
```

### Week 3: Integration & Testing

#### Integration Tasks
- [ ] Connect WebSocket client to server
- [ ] Implement real-time comment updates
- [ ] Add comment posting functionality
- [ ] Integrate with existing authentication
- [ ] Test with sample data

#### Testing Setup
```
frontend/src/__tests__/
├── components/comments/
├── hooks/useSocket.test.ts
└── integration/comments.test.tsx

server/src/__tests__/
├── websocket/
├── comments/
└── integration/
```

---

## 📝 Detailed Task Breakdown

### Database Schema Implementation

#### 1. Update Prisma Schema
**File**: `server/src/prisma/schema.prisma`

```prisma
model Comment {
  id            String   @id @default(cuid())
  itemId        String
  userId        String?  // null for anonymous
  content       String
  isAnonymous   Boolean  @default(false)
  helpfulCount  Int      @default(0)
  status        CommentStatus @default(PENDING)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  item          LostItem @relation(fields: [itemId], references: [id])
  user          User?    @relation(fields: [userId], references: [id])
  
  @@map("comments")
}

model DiscussionThread {
  id          String           @id @default(cuid())
  title       String
  category    ThreadCategory
  createdBy   String
  isPinned    Boolean          @default(false)
  replyCount  Int              @default(0)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  
  creator     User             @relation(fields: [createdBy], references: [id])
  replies     ThreadReply[]
  
  @@map("discussion_threads")
}

model ThreadReply {
  id           String   @id @default(cuid())
  threadId     String
  userId       String
  content      String
  helpfulCount Int      @default(0)
  createdAt    DateTime @default(now())
  
  thread       DiscussionThread @relation(fields: [threadId], references: [id])
  user         User             @relation(fields: [userId], references: [id])
  
  @@map("thread_replies")
}

model UserReputation {
  userId              String @id
  helpfulPoints       Int    @default(0)
  commentsCount       Int    @default(0)
  verifiedSightings   Int    @default(0)
  trustLevel          TrustLevel @default(NEW)
  
  user                User   @relation(fields: [userId], references: [id])
  
  @@map("user_reputation")
}

enum CommentStatus {
  PENDING
  APPROVED
  REJECTED
}

enum ThreadCategory {
  LOCATION
  GENERAL
  TRENDING
}

enum TrustLevel {
  NEW
  TRUSTED
  MODERATOR
}
```

#### 2. Create Migration
```bash
npx prisma migrate dev --name add-community-features
```

### WebSocket Server Setup

#### 1. Socket Server Configuration
**File**: `server/src/websocket/socketServer.ts`

```typescript
import { Server } from 'socket.io';
import { createServer } from 'http';
import { socketHandlers } from './socketHandlers';
import { socketMiddleware } from './socketMiddleware';

export const initializeSocket = (httpServer: any) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
  });

  // Apply middleware for authentication
  io.use(socketMiddleware);

  // Handle socket connections
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    socketHandlers(io, socket);
  });

  return io;
};
```

#### 2. Socket Handlers
**File**: `server/src/websocket/socketHandlers.ts`

```typescript
import { Server, Socket } from 'socket.io';
import { commentService } from '../api/comments/commentsService';
import { redisClient } from '../redis/redisClient';

export const socketHandlers = (io: Server, socket: Socket) => {
  // Join item room for real-time updates
  socket.on('join-item', (itemId: string) => {
    socket.join(`item-${itemId}`);
  });

  // Leave item room
  socket.on('leave-item', (itemId: string) => {
    socket.leave(`item-${itemId}`);
  });

  // Handle new comment
  socket.on('new-comment', async (data) => {
    try {
      const comment = await commentService.createComment(data);
      
      // Emit to item room
      io.to(`item-${data.itemId}`).emit('comment-added', comment);
      
      // Cache in Redis for performance
      await redisClient.setex(
        `comments:${data.itemId}`, 
        3600, 
        JSON.stringify(comment)
      );
      
    } catch (error) {
      socket.emit('error', { message: 'Failed to post comment' });
    }
  });

  // Handle comment updates (helpful count, status)
  socket.on('update-comment', async (data) => {
    try {
      const updatedComment = await commentService.updateComment(data);
      
      io.to(`item-${data.itemId}`).emit('comment-updated', updatedComment);
      
    } catch (error) {
      socket.emit('error', { message: 'Failed to update comment' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
};
```

### Frontend Comment Components

#### 1. Comment Section Component
**File**: `frontend/src/components/comments/CommentSection.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { CommentList } from './CommentList';
import { CommentInput } from './CommentInput';
import { CommentFilters } from './CommentFilters';

interface CommentSectionProps {
  itemId: string;
  itemType: 'lost' | 'found';
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  itemId,
  itemType
}) => {
  const [comments, setComments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    // Join item room for real-time updates
    socket.emit('join-item', itemId);

    // Listen for new comments
    socket.on('comment-added', (comment) => {
      setComments(prev => [comment, ...prev]);
    });

    socket.on('comment-updated', (updatedComment) => {
      setComments(prev => 
        prev.map(comment => 
          comment.id === updatedComment.id ? updatedComment : comment
        )
      );
    });

    return () => {
      socket.emit('leave-item', itemId);
      socket.off('comment-added');
      socket.off('comment-updated');
    };
  }, [itemId, socket]);

  const handleNewComment = async (commentData: any) => {
    setIsLoading(true);
    socket.emit('new-comment', {
      ...commentData,
      itemId,
      itemType
    });
    setIsLoading(false);
  };

  const filteredComments = comments.filter(comment => {
    switch (filter) {
      case 'helpful': return comment.helpfulCount > 0;
      case 'questions': return comment.content.includes('?');
      case 'sightings': return comment.content.includes('saw') || comment.content.includes('seen');
      default: return true;
    }
  });

  return (
    <div className="comment-section">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          Community Tips ({comments.length})
        </h3>
        <CommentFilters 
          filter={filter} 
          onChange={setFilter} 
        />
      </div>
      
      <CommentInput 
        onSubmit={handleNewComment}
        isLoading={isLoading}
      />
      
      <CommentList 
        comments={filteredComments}
        itemId={itemId}
      />
    </div>
  );
};
```

#### 2. Comment Input Component
**File**: `frontend/src/components/comments/CommentInput.tsx`

```typescript
import React, { useState } from 'react';
import { FaMapMarkerAlt, FaClock, FaCamera } from 'react-icons/fa';

interface CommentInputProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit,
  isLoading
}) => {
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    onSubmit({
      content: content.trim(),
      isAnonymous,
      location,
      time
    });

    setContent('');
    setLocation('');
    setTime('');
  };

  const charCount = content.length;
  const maxChars = 300;

  return (
    <form onSubmit={handleSubmit} className="comment-input">
      <div className="mb-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share a sighting, tip, or question..."
          className="w-full p-3 border border-gray-300 rounded-lg resize-none"
          rows={3}
          maxLength={maxChars}
        />
        <div className="flex items-center justify-between mt-1">
          <span className={`text-sm ${charCount > maxChars * 0.9 ? 'text-red-500' : 'text-gray-500'}`}>
            {charCount}/{maxChars}
          </span>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setLocation('Current location')}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              <FaMapMarkerAlt className="inline mr-1" />
              Add Location
            </button>
            <button
              type="button"
              onClick={() => setTime(new Date().toLocaleTimeString())}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              <FaClock className="inline mr-1" />
              Add Time
            </button>
          </div>
        </div>
      </div>

      {(location || time) && (
        <div className="mb-3 p-2 bg-gray-100 rounded-lg text-sm">
          {location && <div>📍 {location}</div>}
          {time && <div>⏰ {time}</div>}
        </div>
      )}

      <div className="flex items-center justify-between">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-600">Post anonymously</span>
        </label>

        <button
          type="submit"
          disabled={!content.trim() || isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Posting...' : 'Post Tip'}
        </button>
      </div>
    </form>
  );
};
```

### API Endpoints

#### 1. Comments Router
**File**: `server/src/api/comments/commentsRouter.ts`

```typescript
import { Router } from 'express';
import { commentsController } from './commentsController';
import { authenticateToken } from '../../middleware/auth';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Rate limiting: 10 comments per minute per user
const commentRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many comments, please try again later'
});

router.get('/items/:itemId/comments', commentsController.getComments);
router.post('/items/:itemId/comments', 
  authenticateToken, 
  commentRateLimit, 
  commentsController.createComment
);
router.put('/comments/:id', 
  authenticateToken, 
  commentsController.updateComment
);
router.delete('/comments/:id', 
  authenticateToken, 
  commentsController.deleteComment
);

export { router as commentsRouter };
```

#### 2. Comments Controller
**File**: `server/src/api/comments/commentsController.ts`

```typescript
import { Request, Response } from 'express';
import { commentsService } from './commentsService';
import { notificationService } from '../notifications/notificationService';

export const commentsController = {
  async getComments(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      const { filter = 'all', sort = 'newest', page = 1, limit = 50 } = req.query;
      
      const comments = await commentsService.getComments(itemId, {
        filter: filter as string,
        sort: sort as string,
        page: Number(page),
        limit: Number(limit)
      });
      
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  },

  async createComment(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      const commentData = {
        ...req.body,
        itemId,
        userId: req.user.id
      };
      
      const comment = await commentsService.createComment(commentData);
      
      // Send notifications to item owner and subscribers
      await notificationService.notifyNewComment(comment);
      
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create comment' });
    }
  },

  async updateComment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const updatedComment = await commentsService.updateComment(id, req.body, userId);
      
      res.json(updatedComment);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update comment' });
    }
  },

  async deleteComment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      await commentsService.deleteComment(id, userId);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  }
};
```

---

## 🎯 Success Criteria for Phase 1

### Technical Requirements
- [ ] WebSocket server handling 1000+ concurrent connections
- [ ] Database schema implemented with proper relationships
- [ ] Real-time comment posting and delivery (<100ms latency)
- [ ] Basic moderation (pending/approved status)
- [ ] Anonymous and identified commenting

### User Experience Requirements
- [ ] Comments appear instantly without page refresh
- [ ] Character count and validation for comments
- [ ] Anonymous toggle for guest users
- [ ] Basic filtering (all, helpful, questions, sightings)
- [ ] Mobile-responsive comment interface

### Integration Requirements
- [ ] Seamless integration with existing authentication
- [ ] Comments display on both lost and found item pages
- [ ] User profiles show comment history and reputation
- [ ] Notification system for new comments

---

## 📦 Dependencies to Add

### Backend Dependencies
```json
{
  "socket.io": "^4.7.2",
  "redis": "^4.6.7",
  "bull": "^4.11.3",
  "express-rate-limit": "^6.8.1"
}
```

### Frontend Dependencies
```json
{
  "socket.io-client": "^4.7.2",
  "@types/socket.io-client": "^3.0.0"
}
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
# Backend
cd server
npm install socket.io redis bull express-rate-limit

# Frontend  
cd frontend
npm install socket.io-client @types/socket.io-client
```

### 2. Update Database
```bash
cd server
npx prisma migrate dev --name add-community-features
npx prisma generate
```

### 3. Start Redis (for development)
```bash
docker run -p 6379:6379 redis:latest
```

### 4. Run Development Servers
```bash
# Backend with WebSocket support
cd server
npm run dev

# Frontend
cd frontend  
npm run dev
```

---

**Ready for Phase 1 implementation!**
