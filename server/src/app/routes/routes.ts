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
import { utils } from "../utils/utils";
import { adminStats } from "../utils/adminStats";
import { locationStats } from "../utils/locationStats";
import { getAuditLogs } from "../utils/auditLog";
import { aiSearchController } from "../modules/aiSearch/aiSearch.controller";
import { aiSearchValidation } from "../modules/aiSearch/aiSearch.validate";
import { sendLostItemEmail, sendClaimApprovedEmail } from "../utils/emailController";

const router = express.Router();

////////////////////////////////////////////////// user //////////////////////////////////////////////
router.post("/register", userController.registerUser);
router.get("/users", userController.allUsers);
router.post("/login", validateRequest(UserSchema.userLoginSchema), authController.login);

////////////////////////////////////////////////// profile //////////////////////////////////////////////
router.post("/change-password", auth(), validateRequest(UserSchema.changePasswordSchema), authController.newPasswords);
router.post("/change-email", auth(), validateRequest(UserSchema.changeEmailSchema), authController.changeEmail);
router.post("/change-username", auth(), validateRequest(UserSchema.changeUsernameSchema), authController.changeUsername);

////////////////////////////////////////////////// categories //////////////////////////////////////////////
router.post("/item-categories", validateRequest(FoundItemCategorySchema.createFoundItemCategory), auth(), itemcategoryController.createItemCategory);
router.get("/item-categories", itemcategoryController.getItemCategory);
router.put("/item-categories/:id", validateRequest(FoundItemCategorySchema.createFoundItemCategory), auth(), itemcategoryController.updateItemCategory);
router.delete("/item-categories/:id", auth(), itemcategoryController.deleteItemCategory);

////////////////////////////////////////////////// found items //////////////////////////////////////////////
router.post("/found-items/public", foundItemController.createFoundItem);
router.post("/found-items", validateRequest(FoundItemSchema.createFoundItem), auth(), foundItemController.createFoundItem);
router.get("/found-items", foundItemController.getFoundItem);
router.get("/found-item/:id", foundItemController.getSingleFoundItem);

// ── Archive routes (admin only) ──
router.get("/found-items/archived",        auth(), foundItemController.getArchivedFoundItems);
router.get("/found-items/stale",           auth(), foundItemController.getStaleFoundItems);
router.put("/found-items/:id/archive",     auth(), foundItemController.archiveFoundItem);
router.put("/found-items/:id/restore",     auth(), foundItemController.restoreFoundItem);

////////////////////////////////////////////////// lost items //////////////////////////////////////////////
router.post("/lostItem", lostItemController.createLostItem);
router.get("/lostItem", lostItemController.getLostItem);
router.get("/lostItem/:id", lostItemController.getSingleLostItem);

router.put("/found-lost", auth(), lostItemController.toggleFoundStatus);
router.get("/my/lostItem", auth(), lostItemController.getMyLostItem);
router.put("/my/lostItem", auth(), lostItemController.editMyLostItem);
router.delete("/my/lostItem/:id", auth(), lostItemController.deleteMyLostItem);

router.get("/my/foundItem", auth(), foundItemController.getMyFoundItem);
router.put("/my/foundItem", auth(), foundItemController.editMyFoundItem);
router.delete("/my/foundItem/:id", auth(), foundItemController.deleteMyFoundItem);

////////////////////////////////////////////////// claims //////////////////////////////////////////////
router.post("/claims", validateRequest(ItemClaimSchema.createClaim), claimsController.createClaim);
router.get("/claims", auth(), claimsController.getClaim);
router.get("/my/claims", auth(), claimsController.getMyClaim);
router.put("/claims/:claimId", validateRequest(ItemClaimSchema.updateClaim), auth(), claimsController.updateClaimStatus);

////////////////////////////////////////////////// admin //////////////////////////////////////////////
router.get("/admin/lostItems", auth(), lostItemController.getAllLostItems);
router.get("/admin/stats", adminStats);
router.get("/admin/location-stats", locationStats);
router.get("/admin/audit-logs", auth(), getAuditLogs);
router.put("/block/user/:id", auth(), userController.blockUser);
router.put("/change-role/:id", auth(), userController.changeUserRole);
router.delete("/delete-user/:id", auth(), userController.softDeleteUser);

////////////////////////////////////////////////// AI search //////////////////////////////////////////////
router.post("/ai-search", validateRequest(aiSearchValidation.aiSearchSchema), aiSearchController.aiSearch);

// ── Email / Mailer ──
router.post("/email/lost-item",      auth(), sendLostItemEmail);
router.post("/email/claim-approved", auth(), sendClaimApprovedEmail);

export default router;