# Phase 2: Advanced Community Features — Implementation Plan

> **Project:** NBSC Lost & Found System  
> **Phase:** 2 — Advanced Community Features  
> **Duration:** 4–6 Weeks  
> **Status:** Planning Complete → Ready for Development

---

## Table of Contents

1. [Overview & Objectives](#overview--objectives)
2. [Architecture Overview](#architecture-overview)
3. [Feature 1: Enhanced Discussion Threads](#feature-1-enhanced-discussion-threads)
4. [Feature 2: User Reputation System](#feature-2-user-reputation-system)
5. [Feature 3: Campus-Wide Analytics Dashboard](#feature-3-campus-wide-analytics-dashboard)
6. [Technical Specifications](#technical-specifications)
7. [Implementation Timeline](#implementation-timeline)
8. [Testing Strategy](#testing-strategy)
9. [Success Metrics](#success-metrics)
10. [Next Steps / Phase 3 Preview](#next-steps--phase-3-preview)

---

## Overview & Objectives

### Phase 1 Foundation (Completed)
- ✅ Real-time comment system with toggle functionality
- ✅ WebSocket server via Socket.io
- ✅ API endpoints and database schema
- ✅ React components, hooks, and Redux store
- ✅ Socket.io connection logic optimized

### Phase 2 Goals
Transform the lost and found system from a utility into a **vibrant community hub** where students, faculty, and staff can:
- Collaborate on broader campus topics via discussion threads
- Build trust through a gamified reputation system
- Enable administrators to make data-driven decisions via analytics

### Priority Order

| Priority | Feature | Complexity | Impact |
|----------|---------|------------|--------|
| 🥇 Primary | Enhanced Discussion Threads | High | High |
| 🥈 Secondary | User Reputation System | Medium | High |
| 🥉 Tertiary | Campus-Wide Analytics Dashboard | Medium | High |

---

## Architecture Overview

```
┌─ Thread Management Layer ──────────────────────────────────┐
│  • Thread Creation & Editing                               │
│  • Thread Caching (Redis)                                  │
│  • Thread Search & Filtering                               │
│  • Thread Pinning Management                               │
└────────────────────────────────────────────────────────────┘

┌─ Real-Time Layer ──────────────────────────────────────────┐
│  • Thread Events (create, update, delete)                  │
│  • Thread Voting System                                    │
│  • Live User Count & Activity                              │
└────────────────────────────────────────────────────────────┘

┌─ Reputation Engine ────────────────────────────────────────┐
│  • Point Calculation Engine                                │
│  • Badge Management System                                 │
│  • Trust Level Progression                                 │
└────────────────────────────────────────────────────────────┘

┌─ Analytics Engine ─────────────────────────────────────────┐
│  • Metrics Aggregation                                     │
│  • Data Visualization                                      │
│  • Report Generation                                       │
│  • Alert System                                            │
└────────────────────────────────────────────────────────────┘

┌─ Database Layer ───────────────────────────────────────────┐
│  • DiscussionThreads Table                                 │
│  • ThreadReplies Table                                     │
│  • UserReputation Table                                    │
│  • Comment & User Relations                                │
└────────────────────────────────────────────────────────────┘
```

---

## Feature 1: Enhanced Discussion Threads

### Purpose
Create campus-wide discussion forums **beyond item-specific comments** — a centralized community hub for knowledge sharing and collaboration.

### Target Users
Students, faculty, staff, and administrators

### Key Constraints
- Real-time performance for 4,000+ concurrent users
- Integration with existing Phase 1 comment system
- Content moderation workflow

---

### Data Models

```typescript
interface DiscussionThread {
  id: string;
  title: string;
  category: ThreadCategory; // 'location' | 'trending' | 'general'
  createdBy: string;
  isPinned: boolean;
  replyCount: number;
  voteCount: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface ThreadReply {
  id: string;
  threadId: string;
  userId?: string;
  content: string;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### File Structure

```
server/src/api/threads/
├── threadsRouter.ts
├── threadsController.ts
├── threadsService.ts
├── moderation/
│   ├── moderationRouter.ts
│   └── moderationService.ts
└── analytics/
    ├── analyticsRouter.ts
    └── analyticsService.ts

frontend/src/components/threads/
├── ThreadList.tsx
├── ThreadDetail.tsx
├── ThreadCreate.tsx
├── ThreadModeration.tsx
├── ThreadSearch.tsx
├── ThreadVoting.tsx
└── ThreadAnalytics.tsx
```

---

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/threads` | List all threads (paginated) |
| `POST` | `/api/threads` | Create a new thread |
| `GET` | `/api/threads/:id` | Get thread details |
| `PUT` | `/api/threads/:id` | Update a thread |
| `DELETE` | `/api/threads/:id` | Delete a thread |
| `POST` | `/api/threads/:id/vote` | Vote on a thread |
| `POST` | `/api/threads/:id/pin` | Pin/unpin a thread (admin) |
| `GET` | `/api/threads/:id/replies` | Get thread replies |
| `POST` | `/api/threads/:id/replies` | Add a reply |
| `DELETE` | `/api/threads/:id/replies/:replyId` | Delete a reply |

---

### Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `thread:created` | Server → Client | New thread broadcast |
| `thread:updated` | Server → Client | Thread update broadcast |
| `thread:deleted` | Server → Client | Thread deletion broadcast |
| `thread:voted` | Server → Client | Vote update broadcast |
| `thread:reply` | Server → Client | New reply broadcast |

---

### Features Checklist

**Thread Management**
- [ ] Create, edit, delete threads
- [ ] Thread categorization (location, trending, general)
- [ ] Thread tagging system
- [ ] Thread pinning (admin only)

**Engagement**
- [ ] Upvote / downvote system with real-time updates
- [ ] Thread bookmarking
- [ ] Thread sharing
- [ ] Thread reporting / flagging

**Discovery**
- [ ] Advanced search functionality
- [ ] Filter by category, status (pinned, mine)
- [ ] Sort by: newest, oldest, most discussed, most popular
- [ ] Paginated results with performance optimization

**Moderation**
- [ ] Admin moderation panel
- [ ] Thread flagging & review queue
- [ ] Auto-moderation rules

---

## Feature 2: User Reputation System

### Purpose
A gamified system to **incentivize quality contributions**, reduce moderation workload, and build community trust.

### Target Users
All users (both anonymous and identified)

### Key Constraints
- Point economy with reputation decay over time
- Integration with existing user authentication
- Performance for high-volume point calculations

---

### Point System

| Action | Points |
|--------|--------|
| Submit a helpful sighting tip | +10 |
| Tip marked as helpful by owner | +25 |
| Create a discussion thread | +5 |
| Reply marked as helpful | +15 |
| Item successfully recovered (reporter) | +50 |
| Daily login streak | +2 |
| Reputation decay (weekly) | −1% |

---

### Trust Levels

| Level | Points Required | Privileges |
|-------|----------------|------------|
| 🆕 New Member | 0–49 | Basic posting |
| 🔵 Member | 50–199 | Thread creation, voting |
| 🟢 Trusted | 200–499 | Flag content, reduced moderation |
| 🟡 Veteran | 500–999 | Moderate replies |
| 🔴 Expert | 1000+ | Full moderation, admin assistance |

---

### Badge System

| Badge | Condition |
|-------|-----------|
| 🔍 First Sighting | Submit first tip |
| 🤝 Good Samaritan | 10 successful tips |
| 💬 Conversationalist | 50 thread replies |
| ⭐ Community Star | 500 reputation points |
| 🏆 Campus Hero | 10 items helped recover |
| 📅 Streak Master | 30-day login streak |

---

### Data Models

```typescript
interface UserReputation {
  id: string;
  userId: string;
  totalPoints: number;
  trustLevel: TrustLevel;
  badges: Badge[];
  pointHistory: PointEvent[];
  lastDecayAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface PointEvent {
  id: string;
  userId: string;
  action: string;
  points: number;
  referenceId?: string; // thread/item ID
  createdAt: Date;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
}
```

---

### File Structure

```
server/src/api/reputation/
├── reputationRouter.ts
├── reputationController.ts
├── reputationService.ts
└── badges/
    ├── badgeRouter.ts
    └── badgeService.ts

frontend/src/components/reputation/
├── ReputationDashboard.tsx
├── BadgeSystem.tsx
├── TrustIndicators.tsx
├── PointHistory.tsx
└── ReputationCard.tsx
```

---

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reputation/:userId` | Get user reputation |
| `GET` | `/api/reputation/:userId/history` | Get point history |
| `GET` | `/api/reputation/:userId/badges` | Get earned badges |
| `GET` | `/api/reputation/leaderboard` | Get top users |
| `POST` | `/api/reputation/award` | Award points (internal) |

---

### Features Checklist

- [ ] Point calculation engine with decay system
- [ ] Badge unlocking with real-time notifications
- [ ] Trust level progression display
- [ ] Reputation dashboard for each user
- [ ] Community leaderboard
- [ ] Point history log and trends
- [ ] Moderation priority based on reputation

---

## Feature 3: Campus-Wide Analytics Dashboard

### Purpose
An **administrative dashboard** for campus-wide insights, enabling data-driven decisions and strategic resource planning.

### Target Users
Administrators, SAS office staff, and campus management

### Key Constraints
- Real-time data aggregation with < 5-second latency
- Export functionality (CSV, PDF, Excel)
- Role-based access control

---

### Key Metrics Tracked

| Metric | Description |
|--------|-------------|
| Item Recovery Rate | % of lost items successfully recovered |
| User Engagement | Active users, session duration, interaction frequency |
| Thread Activity | Thread creation rate, reply rate, voting patterns |
| Geographic Distribution | Campus hot spots and area analysis |
| Time-Based Trends | Daily / weekly / monthly patterns |
| Community Sentiment | Helpful vs flagged content ratio |

---

### Data Models

```typescript
interface AnalyticsMetrics {
  totalItems: number;
  activeThreads: number;
  userEngagement: number;
  itemRecoveryRate: number;
  geographicDistribution: GeographicData[];
  timeSeriesData: TimeSeriesData[];
  userActivityStats: UserActivityStats[];
}

interface GeographicData {
  location: string;
  itemCount: number;
  threadCount: number;
  userCount: number;
}

interface TimeSeriesData {
  timestamp: Date;
  metric: string;
  value: number;
  category: 'items' | 'threads' | 'users' | 'engagement';
}
```

---

### File Structure

```
server/src/api/analytics/
├── analyticsRouter.ts
├── analyticsController.ts
├── analyticsService.ts
└── jobs/
    ├── metricsAggregation.ts
    ├── dataProcessing.ts
    └── alertSystem.ts

frontend/src/components/analytics/
├── AnalyticsDashboard.tsx
├── MetricsCards.tsx
├── TrendReports.tsx
├── GeographicHeatMap.tsx
├── ExportTools.tsx
└── AlertSystem.tsx
```

---

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/overview` | Get dashboard overview |
| `GET` | `/api/analytics/trends` | Get time-series data |
| `GET` | `/api/analytics/geography` | Get geographic distribution |
| `GET` | `/api/analytics/users` | Get user engagement stats |
| `GET` | `/api/analytics/export` | Export analytics data |
| `POST` | `/api/analytics/alerts` | Configure alert thresholds |

---

### Dashboard Tabs

| Tab | Contents |
|-----|----------|
| Overview | Key metrics at a glance (KPI cards) |
| Trends | Time-series charts (daily/weekly/monthly) |
| Geography | Campus heat map with item distribution |
| Users | User engagement and activity analytics |
| Export | Data export with format options |

---

### Features Checklist

- [ ] Real-time metrics cards (KPIs)
- [ ] Trend reports with time-series analysis
- [ ] Geographic campus heat map
- [ ] Export tools (CSV, PDF, Excel)
- [ ] Alert system for threshold monitoring
- [ ] Date range selector (hourly, daily, weekly, monthly)
- [ ] Drill-down on specific data points
- [ ] Role-based access control (admin only)

---

## Technical Specifications

### Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Concurrent Users | 4,000+ simultaneous |
| Thread Load Time | < 2 seconds |
| Real-Time Updates | < 5 seconds via Socket.io |
| Search Performance | < 1 second |
| Analytics Load | < 2 seconds initial load |
| Export Generation | < 10 seconds |
| Uptime | 99.9% |

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, TypeScript, Express |
| Database | PostgreSQL via Prisma ORM |
| Cache | Redis |
| Real-Time | Socket.io |
| Frontend | React, TypeScript, Tailwind CSS |
| State Management | Redux Toolkit |
| Charts | Recharts / D3.js |

### Database Schema (New Tables)

```prisma
model DiscussionThread {
  id          String   @id @default(uuid())
  title       String
  category    String
  createdBy   String
  isPinned    Boolean  @default(false)
  replyCount  Int      @default(0)
  voteCount   Int      @default(0)
  tags        String[]
  replies     ThreadReply[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ThreadReply {
  id           String           @id @default(uuid())
  threadId     String
  thread       DiscussionThread @relation(fields: [threadId], references: [id])
  userId       String?
  content      String
  helpfulCount Int              @default(0)
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
}

model UserReputation {
  id          String   @id @default(uuid())
  userId      String   @unique
  totalPoints Int      @default(0)
  trustLevel  String   @default("NEW_MEMBER")
  badges      Json     @default("[]")
  lastDecayAt DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## Implementation Timeline

### Week 1 — Enhanced Discussion Threads

| Day | Task |
|-----|------|
| 1–2 | Backend: Thread API routes, controller, service |
| 3 | Backend: Moderation routes, Socket.io events |
| 4–5 | Frontend: ThreadList, ThreadDetail components |
| 6 | Frontend: ThreadCreate, ThreadSearch |
| 7 | Unit tests + integration tests |

### Week 2 — User Reputation System

| Day | Task |
|-----|------|
| 1–2 | Backend: Reputation engine, point calculator |
| 3 | Backend: Badge system, trust level logic |
| 4–5 | Frontend: ReputationDashboard, BadgeSystem |
| 6 | Frontend: TrustIndicators, PointHistory |
| 7 | Tests + documentation |

### Week 3 — Campus-Wide Analytics Dashboard

| Day | Task |
|-----|------|
| 1–2 | Backend: Analytics aggregation engine, jobs |
| 3 | Backend: Export tools, alert system |
| 4–5 | Frontend: AnalyticsDashboard, MetricsCards |
| 6 | Frontend: TrendReports, GeographicHeatMap |
| 7 | Tests + export validation |

### Week 4 — Integration & Polish

| Day | Task |
|-----|------|
| 1–2 | Cross-component integration testing |
| 3 | Performance optimization (Redis caching) |
| 4 | Bug fixes and UI refinements |
| 5 | Final documentation updates |
| 6–7 | Staging deployment + UAT |

---

## Testing Strategy

### Unit Testing
- All new components with Jest + React Testing Library
- Integration testing for all API endpoints
- Socket.io event simulation
- Redis caching validation
- Point calculation accuracy

### Integration Testing
- End-to-end thread creation and interaction
- Reputation point earning across actions
- Analytics data aggregation accuracy
- Export functionality for all formats

### Performance Testing
- Load testing: 4,000+ concurrent users
- Memory usage under sustained load
- Socket.io connection pooling efficiency
- Database query optimization (EXPLAIN ANALYZE)

### User Acceptance Testing
- Thread creation and reply workflow
- Reputation point earning and badge unlocking
- Analytics dashboard navigation and export
- Mobile responsive design verification

---

## Success Metrics

### Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Concurrent Users | 4,000+ | 📋 Planned |
| Thread Load Time | < 2s | 📋 Planned |
| Real-Time Updates | < 5s | 📋 Planned |
| Search Performance | < 1s | 📋 Planned |
| Analytics Load | < 2s | 📋 Planned |
| Export Generation | < 10s | 📋 Planned |

### User Experience Goals

- **Community Hub** — Centralized discussion platform beyond item-level interactions
- **Recognition System** — Clear progression from new user to trusted contributor
- **Data Insights** — Real-time campus-wide analytics for administrators
- **Mobile Support** — Fully responsive design for all screen sizes

### Technical Objectives

- **Scalability** — Architecture supports future growth beyond 4,000 users
- **Maintainability** — Clean, well-documented TypeScript code
- **Testability** — > 80% test coverage on new features
- **Security** — Role-based access control, content moderation, input validation

---

## Next Steps / Phase 3 Preview

### Phase 3 Candidates (Deferred)

| Feature | Description | Priority |
|---------|-------------|----------|
| Mobile App | React Native or PWA with push notifications | High |
| AI Moderation | Automated content moderation with ML | Medium |
| Email/SMS Alerts | Notification system for item matches | Medium |
| External Integrations | Google Maps, university SSO | Low |
| Advanced AI Matching | ML-powered item-to-report matching | High |

---

## Decision Log

| Decision | Rationale | Date |
|----------|-----------|------|
| Primary: Discussion Threads | High impact, scalable foundation for future features | Phase 2 Planning |
| Secondary: User Reputation | Gamification drives participation and reduces moderation | Phase 2 Planning |
| Tertiary: Analytics Dashboard | Critical for data-driven decision making | Phase 2 Planning |
| Mobile App deferred | High complexity, better suited for Phase 3 | Phase 2 Planning |
| Socket.io optimized | Reduced reconnection attempts 5→3 for faster response | Phase 1 |

---

*Document Version: 1.0 — Phase 2 Planning Complete*  
*Last Updated: April 2026*  
*Author: NBSC Lost & Found Development Team*