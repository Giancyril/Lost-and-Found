import express from "express";
import { userController } from "../modules/user/user.controllers";
import { authController } from "../auth/auth.controller";
import { itemcategoryController } from "../modules/itemCategory/itemcategory.controller";
import auth from "../midddlewares/auth";
import { foundItemController } from "../modules/foundItems/foundItem.controller";
import { claimsController } from "../modules/claim/claim.controller";
import validateRequest from "../midddlewares/validate";
import { UserSchema } from "../modules/user/user.validate";
import { FoundItemCategorySchema } from "../modules/itemCategory/itemCategory.validate";
import { FoundItemSchema } from "../modules/foundItems/foundItems.validate";
import { ItemClaimSchema } from "../modules/claim/claim.validate";
import { lostItemController } from "../modules/lostItem/lost.controller";
import { sightingController } from "../modules/sighting/sighting.controller";
import { adminStats } from "../utils/adminStats";
import { locationStats } from "../utils/locationStats";
import { getAuditLogs, getSystemAuditLogs } from "../utils/auditLog";
import { aiSearchController } from "../modules/aiSearch/aiSearch.controller";
import { aiSearchValidation } from "../modules/aiSearch/aiSearch.validate";
import { aiChatRoutes } from "../modules/aiChat/aiChat.routes";
import { aiRecognitionController } from "../modules/ai/ai.controller";
import { sendLostItemEmail, sendClaimApprovedEmail } from "../utils/emailController";
import { bulletinPostController } from "../modules/bulletinPost/bulletinPost.controller";
import { createPostSchema, createTipSchema } from "../modules/bulletinPost/bulletinPost.validate";
import { postCreationLimiter, tipSubmissionLimiter } from "../midddlewares/bulletinRateLimit";
import { loginRateLimiter, registerRateLimiter } from "../midddlewares/authRateLimit";
import { getMatchNotifications } from "../utils/getMatchNotifications";
import { studentRoutes } from "../modules/student/student.routes";
 import sheetsRoutes from "../modules/sheets/sheets.routes";
 import { reconciliationRoutes } from "../modules/sheets/reconciliation.route";
 import { chatRoutes } from "../modules/chat/chat.routes";
import { pushRoutes } from "../modules/push/push.routes";
import { uploadImages, uploadAudio } from "../midddlewares/upload";
import { commentsRouter } from "../comments/commentsRouter";
import { pointsController } from "../modules/points/points.controller";
import {
  createAnnouncement, getAnnouncements, deleteAnnouncement, sendMassReminder,
  createTicket, getTickets, replyToTicket, updateTicketStatus, deleteTicket,
  submitFeedback, getFeedbacks, updateFeedbackStatus, deleteFeedback,
  getCommHubStats,
} from "../utils/communicationController";
import { achievementController } from "../modules/achievement/achievement.controller";
import { bountyRoutes } from "../modules/bounty/bounty.routes";
import { retentionRoutes } from "../modules/retention/retention.route";
import virtueRoutes from "../../routes/virtueSpotlight.routes";

import {
  getSecurityStats,
  getLoginLogs,
  clearOldLogs,
  getAccessControlData,
  getPrivacyStats,
  exportUserData,
  purgeDeletedUsers,
  getComplianceReport,
} from "../utils/securityController";

import {
  getModerationStats,
  getReports, submitReport, resolveReport, deleteReport,
  getPendingComments, moderateComment,
  getUserBehavior, issueWarning, deleteWarning,
  getKeywords, addKeyword, removeKeyword, testContent,
  getAppeals, submitAppeal, resolveAppeal,
} from "../utils/moderationController";

const router = express.Router();

////////////////////////////////////////////////// user //////////////////////////////////////////////
// ✅ SECURITY: Rate limiting applied to prevent brute-force attacks
router.post("/register", registerRateLimiter, userController.registerUser);
router.get("/users", userController.allUsers);
router.post("/login", loginRateLimiter, validateRequest(UserSchema.userLoginSchema), authController.login);
router.post("/portal-login", loginRateLimiter, authController.portalLogin);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
////////////////////////////////////////////////// profile //////////////////////////////////////////////
router.post("/change-password", auth(), validateRequest(UserSchema.changePasswordSchema), authController.newPasswords);
router.post("/change-email", auth(), validateRequest(UserSchema.changeEmailSchema), authController.changeEmail);
router.post("/change-username", auth(), validateRequest(UserSchema.changeUsernameSchema), authController.changeUsername);
router.put("/update-profile", auth(), userController.updateUser);

////////////////////////////////////////////////// categories //////////////////////////////////////////////
router.post("/item-categories", validateRequest(FoundItemCategorySchema.createFoundItemCategory), auth(), itemcategoryController.createItemCategory);
router.get("/item-categories", itemcategoryController.getItemCategory);
router.put("/item-categories/:id", validateRequest(FoundItemCategorySchema.createFoundItemCategory), auth(), itemcategoryController.updateItemCategory);
router.delete("/item-categories/:id", auth(), itemcategoryController.deleteItemCategory);

////////////////////////////////////////////////// found items //////////////////////////////////////////////

// FIX: auth(true) makes authentication optional, allowing BOTH guests and
// logged-in users to report lost items. If logged in, req.user is populated.
router.post("/found-items/public", auth(true), foundItemController.createFoundItem);

router.post("/found-items", validateRequest(FoundItemSchema.createFoundItem), auth(), foundItemController.createFoundItem);
router.get("/found-items", foundItemController.getFoundItem);
router.get("/found-item/:id", foundItemController.getSingleFoundItem);
router.post("/found-items/:id/images", uploadImages.array("images", 5), foundItemController.uploadFoundItemImages);

// ── Archive routes (admin only) ──
router.get("/found-items/archived", auth(), foundItemController.getArchivedFoundItems);
router.get("/found-items/stale", auth(), foundItemController.getStaleFoundItems);
router.put("/found-items/:id/archive", auth(), foundItemController.archiveFoundItem);
router.put("/found-items/:id/restore", auth(), foundItemController.restoreFoundItem);

////////////////////////////////////////////////// lost items //////////////////////////////////////////////
router.post("/lostItem", auth(true), lostItemController.createLostItem);
router.get("/lostItem", lostItemController.getLostItem);
router.get("/lostItem/:id", lostItemController.getSingleLostItem);

router.put("/found-lost", auth(), lostItemController.toggleFoundStatus);
router.get("/my/lostItem", auth(), lostItemController.getMyLostItem);
router.put("/my/lostItem", auth(), lostItemController.editMyLostItem);
router.delete("/my/lostItem/:id", auth(), lostItemController.deleteMyLostItem);

////////////////////////////////////////////////// sightings //////////////////////////////////////////////
router.post("/sightings", auth(true), sightingController.createSighting);
router.get("/sightings/lost-item/:lostItemId", sightingController.getSightingsForLostItem);
router.put("/sightings/:sightingId/verify", auth(), sightingController.verifySighting);
router.delete("/sightings/:sightingId", auth(), sightingController.deleteSighting);

router.get("/my/foundItem", auth(), foundItemController.getMyFoundItem);
router.put("/my/foundItem", auth(), foundItemController.editMyFoundItem);
router.delete("/my/foundItem/:id", auth(), foundItemController.deleteMyFoundItem);

////////////////////////////////////////////////// claims //////////////////////////////////////////////
router.post("/claims", auth(true), validateRequest(ItemClaimSchema.createClaim), claimsController.createClaim);
router.get("/claims", auth(), claimsController.getClaim);
router.get("/my/claims", auth(), claimsController.getMyClaim);
router.put("/claims/:claimId", validateRequest(ItemClaimSchema.updateClaim), auth(), claimsController.updateClaimStatus);
router.delete("/claims/:claimId", auth(), claimsController.deleteClaim);
router.post("/claims/track", claimsController.trackClaim);

////////////////////////////////////////////////// admin //////////////////////////////////////////////
router.get("/admin/lostItems", auth(), lostItemController.getAllLostItems);
router.get("/admin/stats", auth(true), adminStats);
router.get("/admin/location-stats", auth(true), locationStats);
router.get("/admin/audit-logs", auth(), getAuditLogs);
router.get("/admin/system-audit-logs", auth(), getSystemAuditLogs);
router.put("/block/user/:id", auth(), userController.blockUser);
router.delete("/delete-user/:id", auth(), userController.softDeleteUser);
router.get("/admin/match-notifications", auth(), getMatchNotifications);

// ////////////////////////////////////////////////// AI search //////////////////////////////////////////////
router.post("/ai-search", validateRequest(aiSearchValidation.aiSearchSchema), aiSearchController.aiSearch);
router.post("/ai-recognize", auth(true), uploadImages.single("image"), aiRecognitionController.recognizeImage);
router.post("/ai-voice-parse", auth(true), uploadAudio.single("audio"), aiRecognitionController.parseVoice);
router.use("/ai-chat", aiChatRoutes);

// ── Email / Mailer ──
router.post("/email/lost-item", auth(), sendLostItemEmail);
router.post("/email/claim-approved", auth(), sendClaimApprovedEmail);

////////////////////////////////////////////////// bulletin posts //////////////////////////////////////////////
router.post("/bulletin-posts", postCreationLimiter, validateRequest(createPostSchema), bulletinPostController.createPost);
router.get("/bulletin-posts", bulletinPostController.getPosts);
router.post("/bulletin-posts/:id/tips", tipSubmissionLimiter, validateRequest(createTipSchema), bulletinPostController.createTip);
router.get("/bulletin-posts/:id/tips", bulletinPostController.getTips);
router.delete("/bulletin-posts/:id", auth(), bulletinPostController.deletePost);
router.delete("/bulletin-posts/:id/tips/:tipId", auth(), bulletinPostController.deleteTip);
router.put("/bulletin-posts/:id/resolve", auth(), bulletinPostController.resolvePost);

 router.use("/students", studentRoutes);
router.use("/sheets", sheetsRoutes);
router.use("/admin/reconciliation", reconciliationRoutes);
 router.use("/chat", chatRoutes);
router.use("/notifications", pushRoutes);
router.use("/", commentsRouter);
router.use("/", virtueRoutes);

////////////////////////////////////////////////// points //////////////////////////////////////////////
router.get("/points/my", auth(), pointsController.getMyPoints);
router.get("/points/my-rank", auth(), pointsController.getMyRank);
router.get("/points/leaderboard", pointsController.getLeaderboard);

// Admin boost event management
router.get("/admin/boost-events", auth(), pointsController.getBoostEvents);
router.post("/admin/boost-events", auth(), pointsController.createBoostEvent);
router.put("/admin/boost-events/:id/deactivate", auth(), pointsController.deactivateBoostEvent);

// Admin flagged users management
router.get("/admin/flagged-users", auth(), pointsController.getFlaggedUsers);
router.put("/admin/flagged-users/:userId/clear", auth(), pointsController.clearFlag);

//////////////////////////////////////////////// achievements //////////////////////////////////////////////
router.get("/achievements", auth(), achievementController.getAchievements);
router.get("/achievements/my", auth(), achievementController.getMyAchievements);
router.put("/achievements/:achievementId/pin", auth(), achievementController.togglePinAchievement);
router.get("/achievements/unseen", auth(), achievementController.getUnseenAchievements);
router.post("/achievements/mark-seen", auth(), achievementController.markAchievementsSeen);
router.post("/achievements/unlock-secret", auth(), achievementController.unlockSecretAchievement);
router.get("/admin/achievements", auth(), achievementController.getAllUserAchievements);

router.post("/admin/backfill-students", auth(), userController.backfillStudentData);

//////////////////////////////////////////////// bounties //////////////////////////////////////////////
router.use("/bounties", bountyRoutes);

//////////////////////////////////////////////// retention policy //////////////////////////////////////////////
router.use("/admin/retention", retentionRoutes);

// Communication Hub stats
router.get("/admin/comm-hub/stats", auth(), getCommHubStats);

// Announcements
router.get("/admin/announcements", auth(), getAnnouncements);
router.post("/admin/announcements", auth(), createAnnouncement);
router.post("/admin/send-reminder", auth(), sendMassReminder);
router.delete("/admin/announcements/:id", auth(), deleteAnnouncement);

// Support Tickets (public submit, admin manage)
router.post("/tickets", createTicket);                                  // public — users submit
router.get("/admin/tickets", auth(), getTickets);                       // admin only
router.put("/admin/tickets/:id/reply", auth(), replyToTicket);          // admin only
router.put("/admin/tickets/:id/status", auth(), updateTicketStatus);    // admin only
router.delete("/admin/tickets/:id", auth(), deleteTicket);              // admin only

// Feedback (public submit, admin manage)
router.post("/feedback", submitFeedback);                               // public — users submit
router.get("/admin/feedback", auth(), getFeedbacks);                    // admin only
router.put("/admin/feedback/:id/status", auth(), updateFeedbackStatus); // admin only
router.delete("/admin/feedback/:id", auth(), deleteFeedback);           // admin only

// Security Monitor
router.get("/admin/security/stats", auth(), getSecurityStats);
router.get("/admin/security/logs", auth(), getLoginLogs);
router.delete("/admin/security/logs", auth(), clearOldLogs);
router.delete("/admin/security/logs/clear", auth(), clearOldLogs);

// Access Control
router.get("/admin/security/access-control", auth(), getAccessControlData);

// Data Privacy
router.get("/admin/security/privacy", auth(), getPrivacyStats);
router.get("/admin/security/export", auth(), exportUserData);
router.get("/admin/security/purge-check", auth(), purgeDeletedUsers);

// Compliance
router.get("/admin/security/compliance", auth(), getComplianceReport);

// Moderation stats
router.get("/admin/moderation/stats", auth(), getModerationStats);

// Reported content
router.get("/admin/moderation/reports", auth(), getReports);
router.post("/moderation/reports", submitReport);   // public — anyone can report
router.put("/admin/moderation/reports/:id/resolve", auth(), resolveReport);
router.delete("/admin/moderation/reports/:id", auth(), deleteReport);

// Comment moderation queue
router.get("/admin/moderation/comments", auth(), getPendingComments);
router.put("/admin/moderation/comments/:id", auth(), moderateComment);

// User behavior & warnings
router.get("/admin/moderation/behavior", auth(), getUserBehavior);
router.post("/admin/moderation/warnings", auth(), issueWarning);
router.delete("/admin/moderation/warnings/:id", auth(), deleteWarning);

// Automated moderation
router.get("/admin/moderation/keywords", auth(), getKeywords);
router.post("/admin/moderation/keywords", auth(), addKeyword);
router.delete("/admin/moderation/keywords/:keyword", auth(), removeKeyword);
router.post("/admin/moderation/test", auth(), testContent);

// Appeals
router.get("/admin/moderation/appeals", auth(), getAppeals);
router.post("/moderation/appeals", auth(), submitAppeal);    // requires login
router.put("/admin/moderation/appeals/:id/resolve", auth(), resolveAppeal);

export default router;