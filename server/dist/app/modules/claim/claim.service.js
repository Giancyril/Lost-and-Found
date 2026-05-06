"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimsService = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const push_service_1 = require("../push/push.service");
const createClaim = (item, user) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.default.claim.create({
        data: Object.assign({ foundItemId: item.foundItemId, distinguishingFeatures: item.distinguishingFeatures, lostDate: item.lostDate, claimantName: item.claimantName || "", contactNumber: item.contactNumber || "", schoolEmail: item.schoolEmail || "" }, ((user === null || user === void 0 ? void 0 : user.id) ? { userId: user.id } : {})),
    });
    return result;
});
const getClaim = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.default.claim.findMany({
        where: {
            isDeleted: false,
            foundItem: { isDeleted: false },
        },
        include: {
            foundItem: {
                include: {
                    category: true,
                    user: {
                        select: { id: true, username: true, email: true, createdAt: true, updatedAt: true },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    return result;
});
const getMyClaim = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.default.claim.findMany({
        where: {
            userId: user.id,
            foundItem: { isDeleted: false },
        },
        include: {
            foundItem: {
                include: {
                    category: true,
                    user: {
                        select: { id: true, username: true, email: true, createdAt: true, updatedAt: true },
                    },
                },
            },
            user: {
                select: { id: true, username: true, email: true },
            },
        },
    });
    return result;
});
const updateClaimStatus = (claimId, data, performer) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const existing = yield prisma_1.default.claim.findUnique({ where: { id: claimId } });
    const fromStatus = (_a = existing === null || existing === void 0 ? void 0 : existing.status) !== null && _a !== void 0 ? _a : "PENDING";
    const result = yield prisma_1.default.claim.update({
        where: { id: claimId },
        data,
    });
    if (data.status && data.status !== fromStatus) {
        yield prisma_1.default.claimAuditLog.create({
            data: Object.assign(Object.assign({ claimId, action: data.status, fromStatus: fromStatus, toStatus: data.status, performedBy: (performer === null || performer === void 0 ? void 0 : performer.name) || "Admin" }, ((performer === null || performer === void 0 ? void 0 : performer.id) ? { performedById: performer.id } : {})), { note: data.note || "" }),
        });
        // Trigger Push Notification to claimant
        if (result.userId) {
            yield push_service_1.pushService.sendNotificationToUser(result.userId, {
                title: `Claim ${data.status}`,
                body: `Your claim for "${(existing === null || existing === void 0 ? void 0 : existing.foundItemName) || 'an item'}" has been ${data.status.toLowerCase()}.`,
                data: {
                    type: "CLAIM_UPDATE",
                    claimId: result.id,
                    status: data.status,
                },
            });
        }
    }
    if (data.status === "APPROVED") {
        yield prisma_1.default.foundItem.update({
            where: { id: result.foundItemId },
            data: { isClaimed: true },
        });
        // Award points to the student who made the claim
        if (result.userId) {
            const { pointsService } = yield Promise.resolve().then(() => __importStar(require("../points/points.service")));
            yield pointsService
                .award(result.userId, "CLAIM_APPROVED", result.id)
                .catch((err) => console.error("[Points] Failed to award points for approved claim:", err));
        }
    }
    if (data.status === "REJECTED" || data.status === "PENDING") {
        yield prisma_1.default.foundItem.update({
            where: { id: result.foundItemId },
            data: { isClaimed: false },
        });
    }
    return result;
});
const deleteClaim = (claimId) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield prisma_1.default.claim.findUnique({
        where: { id: claimId },
        include: { foundItem: true }
    });
    if (!existing) {
        throw new Error("Claim not found");
    }
    // If claim is approved, we need to handle the foreign key constraint
    if (existing.status === "APPROVED") {
        // First, update the found item to unclaim it
        yield prisma_1.default.foundItem.update({
            where: { id: existing.foundItemId },
            data: { isClaimed: false },
        });
    }
    // Soft delete the claim
    const result = yield prisma_1.default.claim.update({
        where: { id: claimId },
        data: { isDeleted: true },
    });
    // Create audit log for the deletion
    yield prisma_1.default.claimAuditLog.create({
        data: {
            claimId,
            action: "DELETED",
            fromStatus: existing.status,
            toStatus: "DELETED",
            performedBy: "Admin",
            note: "Claim deleted by admin",
        },
    });
    return result;
});
const getAuditLogs = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.default.claimAuditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
            claim: {
                include: {
                    foundItem: {
                        select: { foundItemName: true, img: true },
                    },
                },
            },
            performedByUser: {
                select: { username: true, email: true },
            },
        },
    });
    return result.filter((log) => log.claim !== null); // cast to any
});
exports.claimsService = {
    createClaim,
    getClaim,
    updateClaimStatus,
    getMyClaim,
    deleteClaim,
    getAuditLogs,
};
