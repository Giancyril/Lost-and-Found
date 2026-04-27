# Phase 2 Schema & Deployment Fixes

## 🚨 Critical Issues Identified

### 1. Missing Redis Module
**Problem**: Analytics service trying to import `../../utils/redis` - module doesn't exist
**Files Affected**: 
- `server/src/api/analytics/analyticsService.ts`
- Any other files importing Redis utilities

**Solution**: Create Redis utility module or fix import paths

### 2. Schema Inconsistencies
**Problem**: Location fields missing from discussion models
**Current Schema Issues**:
```prisma
model DiscussionThread {
  // Missing location field
  title       String
  content     String
  createdBy   User     @relation(fields: [id, name, role])
  isPinned    Boolean    @default(false)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  replyCount Int      @default(0)
  tags       String[]
  voteCount  Int      @default(0)
  helpfulCount Int     @default(0)
  _count     JsonValue?
}

model ThreadReply {
  // Missing location field
  content     String
  createdBy   User     @relation(fields: [id, name, role])
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  threadId   String
  voteCount  Int      @default(0)
  helpfulCount Int     @default(0)
}
```

**Required Schema Updates**:
```prisma
model DiscussionThread {
  title       String
  content     String
  location    String?     @default(null)
  createdBy   User     @relation(fields: [id, name, role])
  isPinned    Boolean    @default(false)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  replyCount Int      @default(0)
  tags       String[]
  voteCount  Int      @default(0)
  helpfulCount Int     @default(0)
  _count     JsonValue?
}

model ThreadReply {
  content     String
  location    String?     @default(null)
  createdBy   User     @relation(fields: [id, name, role])
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  threadId   String
  voteCount  Int      @default(0)
  helpfulCount Int     @default(0)
}
```

### 3. Type Mismatches
**Problem**: TrustLevel enum casting issues
**Files Affected**:
- `server/src/api/reputation/reputationService.ts`

**Current Issues**:
```typescript
// Wrong casting
trustLevel: 'NEW_MEMBER' as any
trustLevel: TrustLevel.NEW_MEMBER as string

// Should be:
trustLevel: TrustLevel.NEW_MEMBER
trustLevel: String(trustLevel)
```

### 4. Import Path Errors
**Problem**: Incorrect relative import paths
**Files Affected**:
- Multiple service files with incorrect import paths

**Current Issues**:
```typescript
// Wrong paths
import { moderationService } from './moderationService'
import { analyticsService } from '../utils/redis'

// Should be:
import { moderationService } from './moderationService'
import { analyticsService } from '../../utils/redis'
```

### 5. Socket Type Issues
**Problem**: Extended Socket interface problems
**Files Affected**:
- `server/src/websocket/socketServer.ts`

**Current Issues**:
```typescript
// Missing ExtendedSocket interface
interface ExtendedSocket extends Socket {
  userId: string
  userRole: string
}

// Wrong type usage
const extSocket = socket as ExtendedSocket
```

## 🛠️ Step-by-Step Fix Plan

### Step 1: Create Redis Utility Module
```bash
mkdir -p server/src/utils
touch server/src/utils/redis.ts
```

### Step 2: Fix Redis Module Content
```typescript
import Redis from 'ioredis';

export class RedisClient {
  private client: Redis;
  
  constructor() {
    this.client = new Redis(process.env.REDIS_URL);
  }
  
  // Add Redis utility methods
  async get(key: string) { /* implementation */ }
  async set(key: string, value: any, ttl?: number) { /* implementation */ }
  async del(key: string) { /* implementation */ }
  async exists(key: string) { /* implementation */ }
}
```

### Step 3: Update Prisma Schema
Add location fields to discussion models and fix type issues

### Step 4: Fix Import Paths
Update all service files to use correct relative import paths

### Step 5: Fix Socket Types
Create ExtendedSocket interface and update socket server usage

### Step 6: Test & Deploy
```bash
npm run build
npm run deploy
```

## 🎯 Priority Order
1. **HIGH**: Create Redis utility module (blocks analytics)
2. **HIGH**: Fix Prisma schema (blocks all discussion features)
3. **MEDIUM**: Fix import paths (service files)
4. **MEDIUM**: Fix Socket types (blocks real-time features)
5. **LOW**: Test and deploy

## 📋 Files to Modify
- `server/src/utils/redis.ts` (CREATE)
- `server/prisma/schema.prisma` (UPDATE)
- `server/src/api/analytics/analyticsService.ts` (FIX IMPORT)
- `server/src/api/reputation/reputationService.ts` (FIX TYPES)
- `server/src/websocket/socketServer.ts` (FIX TYPES)
- All other service files with import issues

## 🚀 Expected Outcome
After these fixes:
- ✅ Prisma generation will succeed
- ✅ All services will compile without type errors
- ✅ Real-time features will work properly
- ✅ Analytics caching will function correctly
- ✅ Deployment will succeed

**Total Estimated Time**: 2-3 hours

**Ready to proceed with fixes?**
