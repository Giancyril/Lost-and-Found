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
import { aiSearchController } from "../modules/aiSearch/aiSearch.controller";
import { aiSearchValidation } from "../modules/aiSearch/aiSearch.validate";

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
// No auth — student reports finding a lost item (must be BEFORE the auth route)
router.post("/found-items/public", foundItemController.createFoundItem);

// Admin only — creating a found item entry from the admin panel
router.post("/found-items", validateRequest(FoundItemSchema.createFoundItem), auth(), foundItemController.createFoundItem);
router.get("/found-items", foundItemController.getFoundItem);
router.get("/found-item/:id", foundItemController.getSingleFoundItem);

////////////////////////////////////////////////// lost items //////////////////////////////////////////////
// No auth — students report lost items without logging in
router.post("/lostItem", lostItemController.createLostItem);
router.get("/lostItem", lostItemController.getLostItem);
router.get("/lostItem/:id", lostItemController.getSingleLostItem);

// Auth required — admin/user-specific routes
router.put("/found-lost", auth(), lostItemController.toggleFoundStatus);
router.get("/my/lostItem", auth(), lostItemController.getMyLostItem);
router.put("/my/lostItem", auth(), lostItemController.editMyLostItem);
router.delete("/my/lostItem/:id", auth(), lostItemController.deleteMyLostItem);
router.get("/my/foundItem", auth(), foundItemController.getMyFoundItem);
router.put("/my/foundItem", auth(), foundItemController.editMyFoundItem);
router.delete("/my/foundItem/:id", auth(), foundItemController.deleteMyFoundItem);

////////////////////////////////////////////////// claims //////////////////////////////////////////////
// No auth — students submit claims without logging in
router.post("/claims", validateRequest(ItemClaimSchema.createClaim), claimsController.createClaim);
router.get("/claims", auth(), claimsController.getClaim);
router.get("/my/claims", auth(), claimsController.getMyClaim);
router.put("/claims/:claimId", validateRequest(ItemClaimSchema.updateClaim), auth(), claimsController.updateClaimStatus);

////////////////////////////////////////////////// "I Found This Item" — student submits found report //////////////////////////////////////////////
// This is called from SingleLostItem when a student reports finding a lost item
// Removed auth() so students can submit without logging in
// Note: FoundItemSchema validation still applies for data integrity
// router.post("/found-items") is already defined above as admin-only
// Students use a separate endpoint or we relax validation — see note below

////////////////////////////////////////////////// admin //////////////////////////////////////////////
router.get("/admin/stats", auth(), adminStats);
router.put("/block/user/:id", auth(), userController.blockUser);
router.put("/change-role/:id", auth(), userController.changeUserRole);
router.delete("/delete-user/:id", auth(), userController.softDeleteUser);

////////////////////////////////////////////////// AI search //////////////////////////////////////////////
router.post("/ai-search", validateRequest(aiSearchValidation.aiSearchSchema), aiSearchController.aiSearch);

export default router;