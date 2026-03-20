# Implementation Plan: Bulletin Board

## Overview

Extend the existing `/bulletin` page with server-side `BulletinPost` and `BulletinTip` models, a full Express module (controller / service / validation / routes), rate-limiting middleware, RTK Query endpoints, TypeScript types, and a redesigned `BulletinBoard.tsx` with inline `PostModal`, `TipModal`, and `TipsViewerModal` components. Property-based tests use **fast-check** on both backend and frontend.

---

## Tasks

- [x] 1. Add Prisma models and run migration
  - [x] 1.1 Add `BulletinPost` and `BulletinTip` models to `server/prisma/schema.prisma`
    - Add the two model blocks exactly as specified in the design (fields, relations, `@@map` names)
    - _Requirements: 7.1, 7.2_
  - [x] 1.2 Generate and apply the Prisma migration
    - Run `npx prisma migrate dev --name add_bulletin_post_and_tip` inside `server/`
    - Run `npx prisma generate` to regenerate the client
    - _Requirements: 7.1, 7.2_

- [x] 2. Install `express-rate-limit` dependency
  - Run `npm install express-rate-limit` inside `server/`
  - _Requirements: 8.1, 8.2_

- [x] 3. Create rate-limiting middleware
  - [x] 3.1 Create `server/src/app/midddlewares/bulletinRateLimit.ts`
    - Export `postCreationLimiter`: 5 requests / hour per IP, returns 429 with `{ success: false, message: "Too many requests. Please try again later." }`
    - Export `tipSubmissionLimiter`: 20 requests / hour per IP, same response shape
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [ ]* 3.2 Write unit tests for rate limiter configuration
    - Verify `postCreationLimiter.max === 5` and `tipSubmissionLimiter.max === 20`
    - Verify `windowMs === 60 * 60 * 1000` on both limiters
    - _Requirements: 8.1, 8.2_

- [x] 4. Implement `bulletinPost` Zod validation schemas
  - Create `server/src/app/modules/bulletinPost/bulletinPost.validate.ts`
  - `createPostSchema`: `itemName` 1–100 chars (non-whitespace), `description` 10–500 chars, `location` 1–100 chars, `dateLost` must not be in the future, optional `imageUrl` (base64 prefix check), optional `reporterName` 1–80 chars, optional `contactHint` 1–100 chars
  - `createTipSchema`: `details` 10–500 chars, optional `location` string
  - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7, 2.2, 2.3, 4.2, 4.3_

- [x] 5. Implement `bulletinPost` service
  - [x] 5.1 Create `server/src/app/modules/bulletinPost/bulletinPost.service.ts`
    - `createPost(data)`: inserts a `BulletinPost`, returns the created record
    - `getPosts({ page, limit, searchTerm })`: returns paginated non-deleted posts with `_count: { tips: true }`, ordered by `createdAt desc`; search filters across `itemName`, `description`, `location` (case-insensitive)
    - `createTip(postId, data)`: inserts a `BulletinTip` linked to the post
    - `getTips(postId)`: returns all tips for a post ordered by `createdAt desc`
    - `deletePost(id)`: soft-deletes (`isDeleted = true`, `deletedAt = now()`)
    - `deleteTip(tipId)`: hard-deletes the tip record
    - `resolvePost(id)`: sets `isResolved = true`
    - _Requirements: 1.3, 1.8, 3.4, 3.6, 4.2, 4.5, 5.4, 6.2, 6.4, 6.5, 7.1–7.8_
  - [ ]* 5.2 Write property test — Property 1: Post creation round-trip
    - **Property 1: Post creation round-trip**
    - Generator: `fc.record({ itemName: fc.string({minLength:1,maxLength:100}).filter(s=>s.trim().length>0), description: fc.string({minLength:10,maxLength:500}), location: fc.string({minLength:1,maxLength:100}), dateLost: fc.date({max: new Date()}) })`
    - Assert: created post has non-null `id` and `createdAt`; `getPosts` returns a record with matching fields
    - File: `server/src/app/modules/bulletinPost/__tests__/bulletinPost.property.test.ts`
    - **Validates: Requirements 1.3, 1.8, 7.1, 7.3, 2.4**
  - [ ]* 5.3 Write property test — Property 2: Whitespace item name rejection
    - **Property 2: Whitespace item name rejection**
    - Generator: `fc.stringOf(fc.constantFrom(' ','\t','\n'))`
    - Assert: `createPost` throws / returns validation error; post count unchanged
    - **Validates: Requirements 1.4**
  - [ ]* 5.4 Write property test — Property 3: Short description rejection
    - **Property 3: Short description rejection**
    - Generator: `fc.string({maxLength:9})`
    - Assert: `createPost` throws / returns validation error
    - **Validates: Requirements 1.5**
  - [ ]* 5.5 Write property test — Property 4: Future date rejection
    - **Property 4: Future date rejection**
    - Generator: `fc.date({min: new Date(Date.now()+1)})`
    - Assert: `createPost` throws / returns validation error
    - **Validates: Requirements 1.6**
  - [ ]* 5.6 Write property test — Property 8: Pagination page size
    - **Property 8: Pagination page size**
    - Generator: `fc.integer({min:1,max:50})` as `limit`
    - Assert: `data.length <= limit`; response includes `meta.total`, `meta.page`, `meta.totalPage`
    - **Validates: Requirements 3.4, 7.6**
  - [ ]* 5.7 Write property test — Property 10: Search filtering correctness
    - **Property 10: Search filtering correctness**
    - Generator: `fc.string({minLength:1})` as `searchTerm`
    - Assert: every returned post contains the term (case-insensitive) in `itemName`, `description`, or `location`
    - **Validates: Requirements 3.6**
  - [ ]* 5.8 Write property test — Property 11: Tip submission round-trip with count increment
    - **Property 11: Tip submission round-trip with count increment**
    - Generator: `fc.string({minLength:10,maxLength:500})` as `details`
    - Assert: tip appears in `getTips`; post tip count increases by exactly 1
    - **Validates: Requirements 4.2, 4.5, 7.7**
  - [ ]* 5.9 Write property test — Property 12: Short tip details rejection
    - **Property 12: Short tip details rejection**
    - Generator: `fc.string({maxLength:9})` as `details`
    - Assert: `createTip` throws / returns validation error
    - **Validates: Requirements 4.3**
  - [ ]* 5.10 Write property test — Property 15: Tips reverse-chronological order
    - **Property 15: Tips reverse-chronological order**
    - Create multiple tips with varying `createdAt`; assert `tips[i].createdAt >= tips[i+1].createdAt` for all i
    - **Validates: Requirements 5.4, 7.8**
  - [ ]* 5.11 Write property test — Property 17: Post soft-delete removes from public list
    - **Property 17: Post soft-delete removes from public list**
    - Assert: after `deletePost(id)`, `getPosts` does not include the deleted post
    - **Validates: Requirements 6.2**
  - [ ]* 5.12 Write property test — Property 18: Tip deletion decrements count
    - **Property 18: Tip deletion decrements count**
    - Assert: after `deleteTip(tipId)`, tip absent from `getTips`; post tip count decreases by 1
    - **Validates: Requirements 6.4**

- [x] 6. Implement `bulletinPost` controller
  - Create `server/src/app/modules/bulletinPost/bulletinPost.controller.ts`
  - `createPost`: validate with `createPostSchema`, call service, return 201
  - `getPosts`: parse query params (`page`, `limit`, `searchTerm`), call service, return paginated response `{ success, meta, data }`
  - `createTip`: validate with `createTipSchema`, call service, return 201
  - `getTips`: call service, return tips array
  - `deletePost`: auth-guarded, call `service.deletePost`, return 200
  - `deleteTip`: auth-guarded, call `service.deleteTip`, return 200
  - `resolvePost`: auth-guarded, call `service.resolvePost`, return 200
  - _Requirements: 1.3, 3.4, 4.2, 5.1, 5.4, 6.2, 6.4, 6.5, 6.6, 7.5–7.8_

- [x] 7. Register bulletin-post routes in `routes.ts`
  - Import controller, `postCreationLimiter`, `tipSubmissionLimiter`, and `auth` middleware
  - Register all 7 endpoints as specified in the design (public + rate-limited for POST, auth-guarded for DELETE/PUT)
  - _Requirements: 6.6, 7.5–7.8, 8.1–8.4_

- [x] 8. Checkpoint — backend wired up
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Add `bulletinPosts` tag type to `baseApi.ts`
  - Add `"bulletinPosts"` to the `tagTypes` array in `frontend/src/redux/api/baseApi.ts`
  - _Requirements: 3.4, 4.5_

- [x] 10. Add RTK Query endpoints to `api.ts`
  - Add the 7 bulletin-post endpoints to `frontend/src/redux/api/api.ts`:
    - `useGetBulletinPostsQuery` — GET `/bulletin-posts` with `{ page, limit, searchTerm }` params, `providesTags: ["bulletinPosts"]`
    - `useCreateBulletinPostMutation` — POST `/bulletin-posts`, `invalidatesTags: ["bulletinPosts"]`
    - `useGetBulletinTipsQuery` — GET `/bulletin-posts/:id/tips`
    - `useCreateBulletinTipMutation` — POST `/bulletin-posts/:id/tips`, `invalidatesTags: ["bulletinPosts"]`
    - `useDeleteBulletinPostMutation` — DELETE `/bulletin-posts/:id`, `invalidatesTags: ["bulletinPosts"]`
    - `useDeleteBulletinTipMutation` — DELETE `/bulletin-posts/:id/tips/:tipId`, `invalidatesTags: ["bulletinPosts"]`
    - `useResolveBulletinPostMutation` — PUT `/bulletin-posts/:id/resolve`, `invalidatesTags: ["bulletinPosts"]`
  - Export all 7 hooks from the file
  - _Requirements: 3.4, 4.2, 4.5, 5.1, 6.2, 6.4, 6.5, 7.5–7.8_

- [x] 11. Add TypeScript types to `types.ts`
  - Add `BulletinPost` and `BulletinTip` interfaces to `frontend/src/types/types.ts` as specified in the design
  - _Requirements: 7.1, 7.2_

- [-] 12. Implement `PostModal` inline component in `BulletinBoard.tsx`
  - Replace the existing `PostModal` stub (or add new) inside `BulletinBoard.tsx`
  - Fields: `itemName` (required), `description` (required, min 10), `location` (required), `dateLost` (required, no future dates), optional `reporterName`, optional `contactHint`, optional image upload
  - Image upload: client-side validation for size > 5 MB and unsupported MIME types; convert to base64 data URI for submission; show preview
  - On submit: call `useCreateBulletinPostMutation`; show inline validation errors; show success toast and close modal on 201
  - On 429: show toast "Too many requests. Please try again later."
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5_

- [-] 13. Implement `TipModal` inline component in `BulletinBoard.tsx`
  - Replace the existing `TipModal` (currently uses `localStorage`) with a server-backed version
  - On submit: call `useCreateBulletinTipMutation`; show success toast; close modal
  - On 429: show toast "Too many requests. Please try again later."
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [-] 14. Implement `TipsViewerModal` inline component in `BulletinBoard.tsx`
  - Replace the existing `TipsViewerModal` (currently reads from `localStorage`) with a server-backed version
  - Fetch tips via `useGetBulletinTipsQuery(postId)`
  - Display each tip's `details`, `location` (if non-empty), and relative time (`timeAgo(createdAt)`)
  - Show empty-state message when tips array is empty
  - Admin-only delete button per tip: call `useDeleteBulletinTipMutation`; confirm before deleting
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.3, 6.4_

- [x] 15. Redesign `BulletinBoard.tsx` main page
  - Add a "Post Lost Item" button in the hero section, visible to all users (unauthenticated and admin)
  - Add a second card grid section for `BulletinPost` items fetched via `useGetBulletinPostsQuery`
  - Each `BulletinPost` card shows: item name, photo (or placeholder), location, date lost, reporter name (if provided), tip count badge, "Community Post" badge to distinguish from admin lost items
  - Resolved posts show a "Resolved" badge; their "I Saw This" button is disabled
  - Admin-only delete button and "Mark Resolved" button on each `BulletinPost` card
  - Wire search input to `searchTerm` param of `useGetBulletinPostsQuery`; wire pagination controls
  - Remove `localStorage` tip helpers (`saveTipLocally`, `getTipsForItem`, `deleteTipLocally`) — tips are now server-side
  - _Requirements: 1.1, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.7, 6.1, 6.2, 6.5_

- [ ] 16. Checkpoint — frontend wired up
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Write frontend property-based tests
  - [ ]* 17.1 Write property test — Property 7: Card rendering completeness
    - **Property 7: Card rendering completeness**
    - Generator: `fc.record({ itemName: fc.string({minLength:1}), imageUrl: fc.string(), location: fc.string({minLength:1}), dateLost: fc.date(), reporterName: fc.string(), _count: fc.record({ tips: fc.nat() }) })`
    - Assert: rendered card contains item name, an `<img>` element, location, date, reporter name, and tip count
    - File: `frontend/src/pages/bulletin/__tests__/BulletinBoard.property.test.tsx`
    - **Validates: Requirements 3.2, 3.3**
  - [ ]* 17.2 Write property test — Property 9: Resolved post shows badge and disables tip button
    - **Property 9: Resolved post shows badge and disables tip button**
    - Generator: `fc.record({ ...bulletinPostArb, isResolved: fc.constant(true) })`
    - Assert: card contains "Resolved" text; "I Saw This" button is disabled or absent
    - **Validates: Requirements 3.5, 4.7**
  - [ ]* 17.3 Write property test — Property 14: Tips display content
    - **Property 14: Tips display content**
    - Generator: `fc.record({ details: fc.string({minLength:10}), location: fc.option(fc.string()), createdAt: fc.date() })`
    - Assert: rendered tip card contains `details` text and a relative time string
    - **Validates: Requirements 5.3**
  - [ ]* 17.4 Write property test — Property 16: Admin controls visibility
    - **Property 16: Admin controls visibility**
    - Generator: `fc.boolean()` as `isAdmin`
    - Assert: delete button present iff `isAdmin === true`
    - **Validates: Requirements 6.1, 6.3**

- [ ] 18. Write backend property-based tests for rate limiting
  - [ ]* 18.1 Write property test — Property 20: Post rate limit returns 429
    - **Property 20: Post rate limit returns 429**
    - Simulate 6 `POST /bulletin-posts` requests from the same IP; assert the 6th returns HTTP 429 with a message
    - File: `server/src/app/modules/bulletinPost/__tests__/bulletinPost.property.test.ts`
    - **Validates: Requirements 8.1, 8.3**
  - [ ]* 18.2 Write property test — Property 21: Tip rate limit returns 429
    - **Property 21: Tip rate limit returns 429**
    - Simulate 21 `POST /bulletin-posts/:id/tips` requests from the same IP; assert the 21st returns HTTP 429
    - **Validates: Requirements 8.2, 8.4**

- [ ] 19. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at backend and frontend milestones
- Property tests validate universal correctness properties; unit tests validate specific examples and edge cases
- The `localStorage` tip helpers in the current `BulletinBoard.tsx` are replaced entirely by server-side persistence in task 15
