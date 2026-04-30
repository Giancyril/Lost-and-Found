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
const adminStats_1 = require("../utils/adminStats");
const locationStats_1 = require("../utils/locationStats");
const auditLog_1 = require("../utils/auditLog");
const aiSearch_controller_1 = require("../modules/aiSearch/aiSearch.controller");
const aiSearch_validate_1 = require("../modules/aiSearch/aiSearch.validate");
const emailController_1 = require("../utils/emailController");
const bulletinPost_controller_1 = require("../modules/bulletinPost/bulletinPost.controller");
const bulletinPost_validate_1 = require("../modules/bulletinPost/bulletinPost.validate");
const bulletinRateLimit_1 = require("../midddlewares/bulletinRateLimit");
const getMatchNotifications_1 = require("../utils/getMatchNotifications");
const student_routes_1 = require("../modules/student/student.routes");
const sheets_routes_1 = __importDefault(require("../modules/sheets/sheets.routes"));
const upload_1 = require("../midddlewares/upload");
const commentsRouter_1 = require("../comments/commentsRouter");
const points_controller_1 = require("../modules/points/points.controller");
const router = express_1.default.Router();
////////////////////////////////////////////////// user //////////////////////////////////////////////
router.post("/register", user_controllers_1.userController.registerUser);
router.get("/users", user_controllers_1.userController.allUsers);
router.post("/login", (0, validate_1.default)(user_validate_1.UserSchema.userLoginSchema), auth_controller_1.authController.login);
////////////////////////////////////////////////// profile //////////////////////////////////////////////
router.post("/change-password", (0, auth_1.default)(), (0, validate_1.default)(user_validate_1.UserSchema.changePasswordSchema), auth_controller_1.authController.newPasswords);
router.post("/change-email", (0, auth_1.default)(), (0, validate_1.default)(user_validate_1.UserSchema.changeEmailSchema), auth_controller_1.authController.changeEmail);
router.post("/change-username", (0, auth_1.default)(), (0, validate_1.default)(user_validate_1.UserSchema.changeUsernameSchema), auth_controller_1.authController.changeUsername);
////////////////////////////////////////////////// categories //////////////////////////////////////////////
router.post("/item-categories", (0, validate_1.default)(itemCategory_validate_1.FoundItemCategorySchema.createFoundItemCategory), (0, auth_1.default)(), itemcategory_controller_1.itemcategoryController.createItemCategory);
router.get("/item-categories", itemcategory_controller_1.itemcategoryController.getItemCategory);
router.put("/item-categories/:id", (0, validate_1.default)(itemCategory_validate_1.FoundItemCategorySchema.createFoundItemCategory), (0, auth_1.default)(), itemcategory_controller_1.itemcategoryController.updateItemCategory);
router.delete("/item-categories/:id", (0, auth_1.default)(), itemcategory_controller_1.itemcategoryController.deleteItemCategory);
////////////////////////////////////////////////// found items //////////////////////////////////////////////
router.post("/found-items/public", foundItem_controller_1.foundItemController.createFoundItem);
router.post("/found-items", (0, validate_1.default)(foundItems_validate_1.FoundItemSchema.createFoundItem), (0, auth_1.default)(), foundItem_controller_1.foundItemController.createFoundItem);
router.get("/found-items", foundItem_controller_1.foundItemController.getFoundItem);
router.get("/found-item/:id", foundItem_controller_1.foundItemController.getSingleFoundItem);
router.post("/found-items/:id/images", upload_1.uploadImages.array('images', 5), foundItem_controller_1.foundItemController.uploadFoundItemImages);
// ── Archive routes (admin only) ──
router.get("/found-items/archived", (0, auth_1.default)(), foundItem_controller_1.foundItemController.getArchivedFoundItems);
router.get("/found-items/stale", (0, auth_1.default)(), foundItem_controller_1.foundItemController.getStaleFoundItems);
router.put("/found-items/:id/archive", (0, auth_1.default)(), foundItem_controller_1.foundItemController.archiveFoundItem);
router.put("/found-items/:id/restore", (0, auth_1.default)(), foundItem_controller_1.foundItemController.restoreFoundItem);
////////////////////////////////////////////////// lost items //////////////////////////////////////////////
router.post("/lostItem", lost_controller_1.lostItemController.createLostItem);
router.get("/lostItem", lost_controller_1.lostItemController.getLostItem);
router.get("/lostItem/:id", lost_controller_1.lostItemController.getSingleLostItem);
router.put("/found-lost", (0, auth_1.default)(), lost_controller_1.lostItemController.toggleFoundStatus);
router.get("/my/lostItem", (0, auth_1.default)(), lost_controller_1.lostItemController.getMyLostItem);
router.put("/my/lostItem", (0, auth_1.default)(), lost_controller_1.lostItemController.editMyLostItem);
router.delete("/my/lostItem/:id", (0, auth_1.default)(), lost_controller_1.lostItemController.deleteMyLostItem);
router.get("/my/foundItem", (0, auth_1.default)(), foundItem_controller_1.foundItemController.getMyFoundItem);
router.put("/my/foundItem", (0, auth_1.default)(), foundItem_controller_1.foundItemController.editMyFoundItem);
router.delete("/my/foundItem/:id", (0, auth_1.default)(), foundItem_controller_1.foundItemController.deleteMyFoundItem);
////////////////////////////////////////////////// claims //////////////////////////////////////////////
router.post("/claims", (0, validate_1.default)(claim_validate_1.ItemClaimSchema.createClaim), claim_controller_1.claimsController.createClaim);
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
router.put("/change-role/:id", (0, auth_1.default)(), user_controllers_1.userController.changeUserRole);
router.delete("/delete-user/:id", (0, auth_1.default)(), user_controllers_1.userController.softDeleteUser);
router.get("/admin/match-notifications", (0, auth_1.default)(), getMatchNotifications_1.getMatchNotifications);
////////////////////////////////////////////////// AI search //////////////////////////////////////////////
router.post("/ai-search", (0, validate_1.default)(aiSearch_validate_1.aiSearchValidation.aiSearchSchema), aiSearch_controller_1.aiSearchController.aiSearch);
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
router.use("/", commentsRouter_1.commentsRouter);
router.get("/points/my", (0, auth_1.default)(), points_controller_1.pointsController.getMyPoints);
router.get("/points/leaderboard", points_controller_1.pointsController.getLeaderboard);
exports.default = router;
