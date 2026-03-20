# Requirements Document

## Introduction

The Bulletin Board feature allows students and community members of NBSC SAS to post "I lost this" bulletin posts directly on a public bulletin board page — without requiring any login. Each post can include a photo upload, item details, and contact information. Other community members can respond to bulletin posts with anonymous sightings/tips, extending the existing tip system already present in the app.

The existing `BulletinBoard.tsx` page currently displays admin-logged lost items from the backend. This feature extends it to also show student-initiated bulletin posts, stored in a new `BulletinPost` table in the database, with their own tip/sighting system persisted server-side (not localStorage).

## Glossary

- **Bulletin_Board**: The public-facing page at `/bulletin` that displays both admin-logged lost items and student-initiated bulletin posts.
- **Bulletin_Post**: A student-initiated "I lost this" post, created without login, containing item details and an optional photo.
- **Bulletin_Tip**: An anonymous sighting or tip submitted by any community member in response to a specific Bulletin_Post.
- **Post_Form**: The modal or inline form used by students to create a new Bulletin_Post.
- **Photo_Upload**: The optional image attachment on a Bulletin_Post, uploaded via multipart form data.
- **System**: The NBSC SAS Lost & Found web application (frontend + backend).
- **Student**: Any unauthenticated public user who creates a Bulletin_Post.
- **Community_Member**: Any unauthenticated public user who submits a Bulletin_Tip.
- **Admin**: An authenticated user with the ADMIN role who can moderate Bulletin_Posts and Bulletin_Tips.
- **Tip_Storage**: The server-side persistence layer for Bulletin_Tips (PostgreSQL via Prisma).

---

## Requirements

### Requirement 1: Create a Bulletin Post (Student-Initiated)

**User Story:** As a student, I want to post a "I lost this" bulletin without logging in, so that I can quickly alert the community about my missing item.

#### Acceptance Criteria

1. THE Bulletin_Board SHALL display a prominent "Post Lost Item" button accessible to all unauthenticated users.
2. WHEN a student clicks the "Post Lost Item" button, THE Post_Form SHALL open as a modal overlay.
3. WHEN a student submits the Post_Form with a valid item name (1–100 characters), description (10–500 characters), last-seen location (1–100 characters), and date lost, THE System SHALL create a new Bulletin_Post and display it on the Bulletin_Board.
4. WHEN a student submits the Post_Form with an empty or whitespace-only item name, THE System SHALL reject the submission and display a validation error message.
5. WHEN a student submits the Post_Form with a description shorter than 10 characters, THE System SHALL reject the submission and display a validation error message.
6. WHEN a student submits the Post_Form with a date lost set in the future, THE System SHALL reject the submission and display a validation error message.
7. THE Post_Form SHALL include an optional reporter name field (1–80 characters) and an optional contact hint field (1–100 characters, e.g. section/grade).
8. WHEN a student submits the Post_Form, THE System SHALL assign a unique identifier to the Bulletin_Post and persist it to the database.

---

### Requirement 2: Photo Upload on Bulletin Posts

**User Story:** As a student, I want to attach a photo to my bulletin post, so that community members can more easily identify my lost item.

#### Acceptance Criteria

1. THE Post_Form SHALL include an optional photo upload field that accepts JPEG, PNG, and WebP image files.
2. WHEN a student selects an image file larger than 5 MB, THE System SHALL reject the file and display an error message indicating the size limit.
3. WHEN a student selects a file with an unsupported MIME type, THE System SHALL reject the file and display an error message listing accepted formats.
4. WHEN a student uploads a valid image, THE System SHALL store the image and associate its URL with the Bulletin_Post.
5. WHEN no photo is uploaded, THE System SHALL display a default placeholder image on the Bulletin_Post card.

---

### Requirement 3: Display Bulletin Posts on the Bulletin Board

**User Story:** As a community member, I want to browse student-initiated bulletin posts alongside admin-logged lost items, so that I can see all missing items in one place.

#### Acceptance Criteria

1. THE Bulletin_Board SHALL display Bulletin_Posts in a card grid consistent with the existing dark UI theme (gray-950 background, Tailwind dark design).
2. WHEN Bulletin_Posts are loaded, THE Bulletin_Board SHALL show each post's item name, photo (or placeholder), last-seen location, date lost, reporter name (if provided), and tip count.
3. THE Bulletin_Board SHALL visually distinguish Bulletin_Posts from admin-logged lost items using a distinct badge or label (e.g. "Community Post").
4. WHEN the Bulletin_Board page loads, THE System SHALL fetch Bulletin_Posts from the server with pagination support (default 12 per page).
5. WHEN a student's Bulletin_Post is marked as resolved, THE Bulletin_Board SHALL display a "Resolved" badge on that post's card.
6. THE Bulletin_Board SHALL support filtering Bulletin_Posts by a text search across item name, description, and location fields.

---

### Requirement 4: Anonymous Tips on Bulletin Posts

**User Story:** As a community member, I want to submit an anonymous sighting tip on a bulletin post, so that I can help the student find their lost item without revealing my identity.

#### Acceptance Criteria

1. WHEN a community member clicks "I Saw This" on a Bulletin_Post card, THE System SHALL open a tip submission form.
2. WHEN a community member submits a tip with a details field of at least 10 characters, THE System SHALL persist the Bulletin_Tip to the database linked to the Bulletin_Post.
3. WHEN a community member submits a tip with a details field shorter than 10 characters, THE System SHALL reject the submission and display a validation error.
4. THE tip submission form SHALL include an optional location field (where the item was seen) and a required details field.
5. WHEN a tip is submitted successfully, THE System SHALL display a confirmation message and increment the tip count on the Bulletin_Post card.
6. THE System SHALL store Bulletin_Tips without collecting any personally identifiable information from the submitter.
7. WHEN a Bulletin_Post is marked as resolved, THE System SHALL disable the "I Saw This" button on that post's card.

---

### Requirement 5: View Tips on a Bulletin Post

**User Story:** As a student or community member, I want to view all anonymous tips submitted for a bulletin post, so that I can follow up on sightings.

#### Acceptance Criteria

1. WHEN a user clicks the tip count button on a Bulletin_Post card, THE System SHALL open a tips viewer modal showing all Bulletin_Tips for that post.
2. WHEN no tips have been submitted for a Bulletin_Post, THE System SHALL display an empty-state message in the tips viewer modal.
3. WHEN tips are displayed, THE System SHALL show each tip's location (if provided), details text, and relative time (e.g. "2h ago").
4. THE System SHALL display Bulletin_Tips in reverse-chronological order (newest first).

---

### Requirement 6: Admin Moderation of Bulletin Posts and Tips

**User Story:** As an admin, I want to moderate student bulletin posts and their tips, so that I can remove inappropriate content and mark resolved posts.

#### Acceptance Criteria

1. WHEN an admin views the Bulletin_Board, THE System SHALL display a delete button on each Bulletin_Post card visible only to authenticated admins.
2. WHEN an admin deletes a Bulletin_Post, THE System SHALL soft-delete the post (set `isDeleted = true`) and remove it from the public Bulletin_Board.
3. WHEN an admin views the tips viewer modal for a Bulletin_Post, THE System SHALL display a delete button on each Bulletin_Tip visible only to authenticated admins.
4. WHEN an admin deletes a Bulletin_Tip, THE System SHALL remove the tip from the database and update the tip count on the Bulletin_Post card.
5. WHEN an admin marks a Bulletin_Post as resolved, THE System SHALL set the post's `isResolved` flag to true and display a "Resolved" badge on the card.
6. THE System SHALL require admin authentication (JWT) for all moderation actions (delete post, delete tip, mark resolved).

---

### Requirement 7: Bulletin Post Data Persistence

**User Story:** As a system operator, I want bulletin posts and their tips to be persisted server-side, so that data is not lost when users clear their browser storage.

#### Acceptance Criteria

1. THE System SHALL store all Bulletin_Posts in a dedicated `BulletinPost` table in the PostgreSQL database via Prisma ORM.
2. THE System SHALL store all Bulletin_Tips in a dedicated `BulletinTip` table in the PostgreSQL database, with a foreign key referencing the parent `BulletinPost`.
3. WHEN a Bulletin_Post is created, THE System SHALL record the `createdAt` timestamp automatically.
4. WHEN a Bulletin_Tip is created, THE System SHALL record the `createdAt` timestamp automatically.
5. THE System SHALL expose a REST API endpoint `POST /bulletin-posts` for creating Bulletin_Posts (no authentication required).
6. THE System SHALL expose a REST API endpoint `GET /bulletin-posts` for retrieving paginated Bulletin_Posts (no authentication required).
7. THE System SHALL expose a REST API endpoint `POST /bulletin-posts/:id/tips` for submitting a Bulletin_Tip (no authentication required).
8. THE System SHALL expose a REST API endpoint `GET /bulletin-posts/:id/tips` for retrieving all tips for a Bulletin_Post (no authentication required).

---

### Requirement 8: Rate Limiting and Spam Prevention

**User Story:** As a system operator, I want to limit how frequently unauthenticated users can create bulletin posts and tips, so that the board is not flooded with spam.

#### Acceptance Criteria

1. THE System SHALL limit each IP address to a maximum of 5 Bulletin_Post creations per hour.
2. THE System SHALL limit each IP address to a maximum of 20 Bulletin_Tip submissions per hour.
3. IF an IP address exceeds the Bulletin_Post creation rate limit, THEN THE System SHALL return an HTTP 429 response with a descriptive error message.
4. IF an IP address exceeds the Bulletin_Tip submission rate limit, THEN THE System SHALL return an HTTP 429 response with a descriptive error message.
