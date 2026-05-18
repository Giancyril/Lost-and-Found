"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controllers_1 = require("../modules/user/user.controllers");
const auth_controller_1 = require("../auth/auth.controller");
const itemcategory_controller_1 = require("../modules/itemCategory/itemcategory.controller");
const auth_1 = __importDefault(require("../midddlewares/auth"));
const foundItem_controller_1 = require("../modules/foundItems/foundItem.controller");
const claim_controller_1 = require("../modules/claim/claim.controller");
const validate_1 = __importDefault(require("../midddlewares/validate"));
const user_validate_1 = require("../modules/user/user.validate");
const itemCategory_validate_1 = require("../modules/itemCategory/itemCategory.validate");
const foundItems_validate_1 = require("../modules/foundItems/foundItems.validate");
const claim_validate_1 = require("../modules/claim/claim.validate");
const lost_controller_1 = require("../modules/lostItem/lost.controller");
const sighting_controller_1 = require("../modules/sighting/sighting.controller");
const adminStats_1 = require("../utils/adminStats");
const locationStats_1 = require("../utils/locationStats");
const auditLog_1 = require("../utils/auditLog");
const aiSearch_controller_1 = require("../modules/aiSearch/aiSearch.controller");
const aiSearch_validate_1 = require("../modules/aiSearch/aiSearch.validate");
const ai_controller_1 = require("../modules/ai/ai.controller");
const emailController_1 = require("../utils/emailController");
const bulletinPost_controller_1 = require("../modules/bulletinPost/bulletinPost.controller");
const bulletinPost_validate_1 = require("../modules/bulletinPost/bulletinPost.validate");
const bulletinRateLimit_1 = require("../midddlewares/bulletinRateLimit");
const getMatchNotifications_1 = require("../utils/getMatchNotifications");
const student_routes_1 = require("../modules/student/student.routes");
const sheets_routes_1 = __importDefault(require("../modules/sheets/sheets.routes"));
const chat_routes_1 = require("../modules/chat/chat.routes");
const push_routes_1 = require("../modules/push/push.routes");
const upload_1 = require("../midddlewares/upload");
const commentsRouter_1 = require("../comments/commentsRouter");
const points_controller_1 = require("../modules/points/points.controller");
const communicationController_1 = require("../utils/communicationController");
const achievement_controller_1 = require("../modules/achievement/achievement.controller");
const securityController_1 = require("../utils/securityController");
const moderationController_1 = require("../utils/moderationController");
const router = express_1.default.Router();
////////////////////////////////////////////////// user //////////////////////////////////////////////
router.post("/register", user_controllers_1.userController.registerUser);
router.get("/users", user_controllers_1.userController.allUsers);
router.post("/login", (0, validate_1.default)(user_validate_1.UserSchema.userLoginSchema), auth_controller_1.authController.login);
////////////////////////////////////////////////// profile //////////////////////////////////////////////
router.post("/change-password", (0, auth_1.default)(), (0, validate_1.default)(user_validate_1.UserSchema.changePasswordSchema), auth_controller_1.authController.newPasswords);
router.post("/change-email", (0, auth_1.default)(), (0, validate_1.default)(user_validate_1.UserSchema.changeEmailSchema), auth_controller_1.authController.changeEmail);
router.post("/change-username", (0, auth_1.default)(), (0, validate_1.default)(user_validate_1.UserSchema.changeUsernameSchema), auth_controller_1.authController.changeUsername);
router.put("/update-profile", (0, auth_1.default)(), user_controllers_1.userController.updateUser);
////////////////////////////////////////////////// categories //////////////////////////////////////////////
router.post("/item-categories", (0, validate_1.default)(itemCategory_validate_1.FoundItemCategorySchema.createFoundItemCategory), (0, auth_1.default)(), itemcategory_controller_1.itemcategoryController.createItemCategory);
router.get("/item-categories", itemcategory_controller_1.itemcategoryController.getItemCategory);
router.put("/item-categories/:id", (0, validate_1.default)(itemCategory_validate_1.FoundItemCategorySchema.createFoundItemCategory), (0, auth_1.default)(), itemcategory_controller_1.itemcategoryController.updateItemCategory);
router.delete("/item-categories/:id", (0, auth_1.default)(), itemcategory_controller_1.itemcategoryController.deleteItemCategory);
////////////////////////////////////////////////// found items //////////////////////////////////////////////
// FIX: auth(true) makes authentication optional, allowing BOTH guests and
// logged-in users to report lost items. If logged in, req.user is populated.
router.post("/found-items/public", (0, auth_1.default)(true), foundItem_controller_1.foundItemController.createFoundItem);
router.post("/found-items", (0, validate_1.default)(foundItems_validate_1.FoundItemSchema.createFoundItem), (0, auth_1.default)(), foundItem_controller_1.foundItemController.createFoundItem);
router.get("/found-items", foundItem_controller_1.foundItemController.getFoundItem);
router.get("/found-item/:id", foundItem_controller_1.foundItemController.getSingleFoundItem);
router.post("/found-items/:id/images", upload_1.uploadImages.array("images", 5), foundItem_controller_1.foundItemController.uploadFoundItemImages);
// ── Archive routes (admin only) ──
router.get("/found-items/archived", (0, auth_1.default)(), foundItem_controller_1.foundItemController.getArchivedFoundItems);
router.get("/found-items/stale", (0, auth_1.default)(), foundItem_controller_1.foundItemController.getStaleFoundItems);
router.put("/found-items/:id/archive", (0, auth_1.default)(), foundItem_controller_1.foundItemController.archiveFoundItem);
router.put("/found-items/:id/restore", (0, auth_1.default)(), foundItem_controller_1.foundItemController.restoreFoundItem);
////////////////////////////////////////////////// lost items //////////////////////////////////////////////
router.post("/lostItem", (0, auth_1.default)(true), lost_controller_1.lostItemController.createLostItem);
router.get("/lostItem", lost_controller_1.lostItemController.getLostItem);
router.get("/lostItem/:id", lost_controller_1.lostItemController.getSingleLostItem);
router.put("/found-lost", (0, auth_1.default)(), lost_controller_1.lostItemController.toggleFoundStatus);
router.get("/my/lostItem", (0, auth_1.default)(), lost_controller_1.lostItemController.getMyLostItem);
router.put("/my/lostItem", (0, auth_1.default)(), lost_controller_1.lostItemController.editMyLostItem);
router.delete("/my/lostItem/:id", (0, auth_1.default)(), lost_controller_1.lostItemController.deleteMyLostItem);
////////////////////////////////////////////////// sightings //////////////////////////////////////////////
router.post("/sightings", (0, auth_1.default)(true), sighting_controller_1.sightingController.createSighting);
router.get("/sightings/lost-item/:lostItemId", sighting_controller_1.sightingController.getSightingsForLostItem);
router.put("/sightings/:sightingId/verify", (0, auth_1.default)(), sighting_controller_1.sightingController.verifySighting);
router.delete("/sightings/:sightingId", (0, auth_1.default)(), sighting_controller_1.sightingController.deleteSighting);
router.get("/my/foundItem", (0, auth_1.default)(), foundItem_controller_1.foundItemController.getMyFoundItem);
router.put("/my/foundItem", (0, auth_1.default)(), foundItem_controller_1.foundItemController.editMyFoundItem);
router.delete("/my/foundItem/:id", (0, auth_1.default)(), foundItem_controller_1.foundItemController.deleteMyFoundItem);
////////////////////////////////////////////////// claims //////////////////////////////////////////////
router.post("/claims", (0, auth_1.default)(), (0, validate_1.default)(claim_validate_1.ItemClaimSchema.createClaim), claim_controller_1.claimsController.createClaim);
router.get("/claims", (0, auth_1.default)(), claim_controller_1.claimsController.getClaim);
router.get("/my/claims", (0, auth_1.default)(), claim_controller_1.claimsController.getMyClaim);
router.put("/claims/:claimId", (0, validate_1.default)(claim_validate_1.ItemClaimSchema.updateClaim), (0, auth_1.default)(), claim_controller_1.claimsController.updateClaimStatus);
router.delete("/claims/:claimId", (0, auth_1.default)(), claim_controller_1.claimsController.deleteClaim);
////////////////////////////////////////////////// admin //////////////////////////////////////////////
router.get("/admin/lostItems", (0, auth_1.default)(), lost_controller_1.lostItemController.getAllLostItems);
router.get("/admin/stats", adminStats_1.adminStats);
router.get("/admin/location-stats", locationStats_1.locationStats);
router.get("/admin/audit-logs", (0, auth_1.default)(), auditLog_1.getAuditLogs);
router.put("/block/user/:id", (0, auth_1.default)(), user_controllers_1.userController.blockUser);
router.delete("/delete-user/:id", (0, auth_1.default)(), user_controllers_1.userController.softDeleteUser);
router.get("/admin/match-notifications", (0, auth_1.default)(), getMatchNotifications_1.getMatchNotifications);
// ////////////////////////////////////////////////// AI search //////////////////////////////////////////////
router.post("/ai-search", (0, validate_1.default)(aiSearch_validate_1.aiSearchValidation.aiSearchSchema), aiSearch_controller_1.aiSearchController.aiSearch);
router.post("/ai-recognize", (0, auth_1.default)(true), upload_1.uploadImages.single("image"), ai_controller_1.aiRecognitionController.recognizeImage);
// ── Email / Mailer ──
router.post("/email/lost-item", (0, auth_1.default)(), emailController_1.sendLostItemEmail);
router.post("/email/claim-approved", (0, auth_1.default)(), emailController_1.sendClaimApprovedEmail);
////////////////////////////////////////////////// bulletin posts //////////////////////////////////////////////
router.post("/bulletin-posts", bulletinRateLimit_1.postCreationLimiter, (0, validate_1.default)(bulletinPost_validate_1.createPostSchema), bulletinPost_controller_1.bulletinPostController.createPost);
router.get("/bulletin-posts", bulletinPost_controller_1.bulletinPostController.getPosts);
router.post("/bulletin-posts/:id/tips", bulletinRateLimit_1.tipSubmissionLimiter, (0, validate_1.default)(bulletinPost_validate_1.createTipSchema), bulletinPost_controller_1.bulletinPostController.createTip);
router.get("/bulletin-posts/:id/tips", bulletinPost_controller_1.bulletinPostController.getTips);
router.delete("/bulletin-posts/:id", (0, auth_1.default)(), bulletinPost_controller_1.bulletinPostController.deletePost);
router.delete("/bulletin-posts/:id/tips/:tipId", (0, auth_1.default)(), bulletinPost_controller_1.bulletinPostController.deleteTip);
router.put("/bulletin-posts/:id/resolve", (0, auth_1.default)(), bulletinPost_controller_1.bulletinPostController.resolvePost);
router.use("/students", student_routes_1.studentRoutes);
router.use("/sheets", sheets_routes_1.default);
router.use("/chat", chat_routes_1.chatRoutes);
router.use("/notifications", push_routes_1.pushRoutes);
router.use("/", commentsRouter_1.commentsRouter);
////////////////////////////////////////////////// points //////////////////////////////////////////////
router.get("/points/my", (0, auth_1.default)(), points_controller_1.pointsController.getMyPoints);
router.get("/points/leaderboard", points_controller_1.pointsController.getLeaderboard);
//////////////////////////////////////////////// achievements //////////////////////////////////////////////
router.get("/achievements", (0, auth_1.default)(), achievement_controller_1.achievementController.getAchievements);
router.get("/achievements/my", (0, auth_1.default)(), achievement_controller_1.achievementController.getMyAchievements);
router.put("/achievements/:achievementId/pin", (0, auth_1.default)(), achievement_controller_1.achievementController.togglePinAchievement);
router.get("/achievements/unseen", (0, auth_1.default)(), achievement_controller_1.achievementController.getUnseenAchievements);
router.post("/achievements/mark-seen", (0, auth_1.default)(), achievement_controller_1.achievementController.markAchievementsSeen);
router.post("/achievements/unlock-secret", (0, auth_1.default)(), achievement_controller_1.achievementController.unlockSecretAchievement);
router.get("/admin/achievements", (0, auth_1.default)(), achievement_controller_1.achievementController.getAllUserAchievements);
router.post("/admin/backfill-students", (0, auth_1.default)(), user_controllers_1.userController.backfillStudentData);
// Communication Hub stats
router.get("/admin/comm-hub/stats", (0, auth_1.default)(), communicationController_1.getCommHubStats);
// Announcements
router.post("/admin/announcements", (0, auth_1.default)(), communicationController_1.createAnnouncement);
router.get("/admin/announcements", (0, auth_1.default)(), communicationController_1.getAnnouncements);
router.delete("/admin/announcements/:id", (0, auth_1.default)(), communicationController_1.deleteAnnouncement);
// Support Tickets (public submit, admin manage)
router.post("/tickets", communicationController_1.createTicket); // public — users submit
router.get("/admin/tickets", (0, auth_1.default)(), communicationController_1.getTickets); // admin only
router.put("/admin/tickets/:id/reply", (0, auth_1.default)(), communicationController_1.replyToTicket); // admin only
router.put("/admin/tickets/:id/status", (0, auth_1.default)(), communicationController_1.updateTicketStatus); // admin only
router.delete("/admin/tickets/:id", (0, auth_1.default)(), communicationController_1.deleteTicket); // admin only
// Feedback (public submit, admin manage)
router.post("/feedback", communicationController_1.submitFeedback); // public — users submit
router.get("/admin/feedback", (0, auth_1.default)(), communicationController_1.getFeedbacks); // admin only
router.put("/admin/feedback/:id/status", (0, auth_1.default)(), communicationController_1.updateFeedbackStatus); // admin only
router.delete("/admin/feedback/:id", (0, auth_1.default)(), communicationController_1.deleteFeedback); // admin only
// Security Monitor
router.get("/admin/security/stats", (0, auth_1.default)(), securityController_1.getSecurityStats);
router.get("/admin/security/logs", (0, auth_1.default)(), securityController_1.getLoginLogs);
router.delete("/admin/security/logs", (0, auth_1.default)(), securityController_1.clearOldLogs);
// Access Control
router.get("/admin/security/access-control", (0, auth_1.default)(), securityController_1.getAccessControlData);
// Data Privacy
router.get("/admin/security/privacy", (0, auth_1.default)(), securityController_1.getPrivacyStats);
router.get("/admin/security/export", (0, auth_1.default)(), securityController_1.exportUserData);
router.get("/admin/security/purge-check", (0, auth_1.default)(), securityController_1.purgeDeletedUsers);
// Compliance
router.get("/admin/security/compliance", (0, auth_1.default)(), securityController_1.getComplianceReport);
// Moderation stats
router.get("/admin/moderation/stats", (0, auth_1.default)(), moderationController_1.getModerationStats);
// Reported content
router.get("/admin/moderation/reports", (0, auth_1.default)(), moderationController_1.getReports);
router.post("/moderation/reports", moderationController_1.submitReport); // public — anyone can report
router.put("/admin/moderation/reports/:id/resolve", (0, auth_1.default)(), moderationController_1.resolveReport);
router.delete("/admin/moderation/reports/:id", (0, auth_1.default)(), moderationController_1.deleteReport);
// Comment moderation queue
router.get("/admin/moderation/comments", (0, auth_1.default)(), moderationController_1.getPendingComments);
router.put("/admin/moderation/comments/:id", (0, auth_1.default)(), moderationController_1.moderateComment);
// User behavior & warnings
router.get("/admin/moderation/behavior", (0, auth_1.default)(), moderationController_1.getUserBehavior);
router.post("/admin/moderation/warnings", (0, auth_1.default)(), moderationController_1.issueWarning);
router.delete("/admin/moderation/warnings/:id", (0, auth_1.default)(), moderationController_1.deleteWarning);
// Automated moderation
router.get("/admin/moderation/keywords", (0, auth_1.default)(), moderationController_1.getKeywords);
router.post("/admin/moderation/keywords", (0, auth_1.default)(), moderationController_1.addKeyword);
router.delete("/admin/moderation/keywords/:keyword", (0, auth_1.default)(), moderationController_1.removeKeyword);
router.post("/admin/moderation/test", (0, auth_1.default)(), moderationController_1.testContent);
// Appeals
router.get("/admin/moderation/appeals", (0, auth_1.default)(), moderationController_1.getAppeals);
router.post("/moderation/appeals", (0, auth_1.default)(), moderationController_1.submitAppeal); // requires login
router.put("/admin/moderation/appeals/:id/resolve", (0, auth_1.default)(), moderationController_1.resolveAppeal);
exports.default = router;
