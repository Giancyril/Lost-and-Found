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
const ai_service_1 = require("../ai/ai.service");
const mailer_1 = require("../../utils/mailer");
const emailTemplates_1 = require("../../utils/emailTemplates");
const createClaim = (item, user) => __awaiter(void 0, void 0, void 0, function* () {
    // 0. Duplicate Claim Prevention — check if user already has PENDING or APPROVED claim for this item
    if ((user === null || user === void 0 ? void 0 : user.id) && item.foundItemId) {
        const existingClaim = yield prisma_1.default.claim.findFirst({
            where: {
                userId: user.id,
                foundItemId: item.foundItemId,
                status: { in: ["PENDING", "APPROVED"] },
                isDeleted: false,
            },
        });
        if (existingClaim) {
            throw new Error(`You already have a ${existingClaim.status.toLowerCase()} claim for this item. Please wait for the admin to review your existing claim.`);
        }
    }
    // Also check by email for guest claims (when userId is not available)
    if (!(user === null || user === void 0 ? void 0 : user.id) && item.schoolEmail && item.foundItemId) {
        const existingClaim = yield prisma_1.default.claim.findFirst({
            where: {
                schoolEmail: item.schoolEmail,
                foundItemId: item.foundItemId,
                status: { in: ["PENDING", "APPROVED"] },
                isDeleted: false,
            },
        });
        if (existingClaim) {
            throw new Error(`A ${existingClaim.status.toLowerCase()} claim for this item already exists with this email. Please wait for the admin to review the existing claim.`);
        }
    }
    let isHighRisk = false;
    let fraudScore = 0;
    let serialWarning = null;
    let aiAssessment = null;
    // 1. Serial Claimant Check
    if (user === null || user === void 0 ? void 0 : user.id) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentClaimsCount = yield prisma_1.default.claim.count({
            where: {
                userId: user.id,
                createdAt: { gte: thirtyDaysAgo }
            }
        });
        if (recentClaimsCount >= 3) {
            isHighRisk = true;
            serialWarning = `User has submitted ${recentClaimsCount} claims in the last 30 days.`;
        }
    }
    // 2. AI Fraud Detection
    if (item.distinguishingFeatures && item.foundItemId) {
        const foundItem = yield prisma_1.default.foundItem.findUnique({ where: { id: item.foundItemId } });
        if (foundItem) {
            const aiResult = yield ai_service_1.aiRecognitionService.analyzeClaimFraud(item.distinguishingFeatures, foundItem.description, foundItem.foundItemName);
            fraudScore = aiResult.fraudScore;
            if (aiResult.isHighRisk)
                isHighRisk = true;
            aiAssessment = aiResult;
        }
    }
    const fraudReasonObj = {
        serialWarning,
        aiAssessment
    };
    const fraudReason = JSON.stringify(fraudReasonObj);
    const result = yield prisma_1.default.claim.create({
        data: Object.assign(Object.assign({ foundItemId: item.foundItemId, distinguishingFeatures: item.distinguishingFeatures, lostDate: item.lostDate, claimantName: item.claimantName || "", contactNumber: item.contactNumber || "", schoolEmail: item.schoolEmail || "" }, ((user === null || user === void 0 ? void 0 : user.id) ? { userId: user.id } : {})), { fraudScore,
            fraudReason,
            isHighRisk }),
    });
    if (result.schoolEmail) {
        const template = (0, emailTemplates_1.claimSubmittedTemplate)({
            claimantName: result.claimantName,
            trackingId: result.id,
        });
        (0, mailer_1.sendEmail)({
            fromName: process.env.SMTP_FROM_NAME || "NBSC SAS Lost & Found",
            fromEmail: process.env.SMTP_FROM_EMAIL || "noreply@nbsc.edu.ph",
            toEmail: result.schoolEmail,
            subject: template.subject,
            html: template.html,
        }).catch((e) => console.error("Failed to send claim submitted email:", e));
    }
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
    if (!user || !user.id)
        return [];
    const whereConditions = { foundItem: { isDeleted: false } };
    // Safely match by userId, OR by schoolEmail if the user's JWT includes an email.
    // This allows items claimed while logged out (as guests) to be seen by the user.
    if (user.email) {
        whereConditions.OR = [
            { userId: user.id },
            { schoolEmail: user.email }
        ];
    }
    else {
        whereConditions.userId = user.id;
    }
    const result = yield prisma_1.default.claim.findMany({
        where: whereConditions,
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
            auditLogs: {
                orderBy: { createdAt: "asc" },
            },
        },
    });
    return result;
});
const updateClaimStatus = (claimId, data, performer) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const existing = yield prisma_1.default.claim.findUnique({
        where: { id: claimId },
        include: { foundItem: true }
    });
    if (!existing) {
        throw new Error("Claim not found");
    }
    // ✅ CRITICAL SECURITY: Prevent users from approving their own claims
    if (data.status === "APPROVED" && (performer === null || performer === void 0 ? void 0 : performer.id)) {
        if (existing.userId === performer.id) {
            throw new Error("You cannot approve your own claim. This action has been logged.");
        }
        // Also prevent approving claims for items you reported
        if (((_a = existing.foundItem) === null || _a === void 0 ? void 0 : _a.userId) === performer.id) {
            throw new Error("You cannot approve a claim for an item you reported. This action has been logged.");
        }
    }
    const fromStatus = (_b = existing === null || existing === void 0 ? void 0 : existing.status) !== null && _b !== void 0 ? _b : "PENDING";
    const result = yield prisma_1.default.claim.update({
        where: { id: claimId },
        data,
    });
    if (data.status && data.status !== fromStatus) {
        yield prisma_1.default.claimAuditLog.create({
            data: Object.assign(Object.assign({ claimId, action: data.status, fromStatus: fromStatus, toStatus: data.status, performedBy: (performer === null || performer === void 0 ? void 0 : performer.name) || "Admin" }, ((performer === null || performer === void 0 ? void 0 : performer.id) ? { performedById: performer.id } : {})), { note: data.note || "" }),
        });
        // Also log to the new unified SystemAuditLog for Phase 9
        const { logSystemAudit } = yield Promise.resolve().then(() => __importStar(require("../../utils/auditLog")));
        yield logSystemAudit({
            entityType: "CLAIM",
            entityId: claimId,
            action: `STATUS_${data.status}`,
            oldData: { status: fromStatus },
            newData: { status: data.status, note: data.note },
            performedBy: performer === null || performer === void 0 ? void 0 : performer.name,
            performedById: performer === null || performer === void 0 ? void 0 : performer.id,
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
const deleteClaim = (claimId, requestingUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield prisma_1.default.claim.findUnique({
        where: { id: claimId },
        include: { foundItem: true }
    });
    if (!existing) {
        throw new Error("Claim not found");
    }
    // ✅ CRITICAL SECURITY: IDOR Protection - Only allow users to delete their own claims
    // Admins can delete any claim (checked in controller via role)
    if (requestingUserId && existing.userId && existing.userId !== requestingUserId) {
        throw new Error("You are not authorized to delete this claim");
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
            performedBy: requestingUserId ? "User" : "Admin",
            note: "Claim deleted",
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
const trackClaim = (claimId, email) => __awaiter(void 0, void 0, void 0, function* () {
    const claim = yield prisma_1.default.claim.findFirst({
        where: {
            id: claimId,
            schoolEmail: email,
            isDeleted: false,
        },
        include: {
            foundItem: {
                select: { foundItemName: true, img: true, location: true, category: true },
            },
        },
    });
    return claim;
});
const analyzeClaimFraud = (claimId) => __awaiter(void 0, void 0, void 0, function* () {
    const claim = yield prisma_1.default.claim.findUnique({
        where: { id: claimId },
        include: { foundItem: true }
    });
    if (!claim) {
        throw new Error("Claim not found");
    }
    if (!claim.foundItem) {
        throw new Error("Found item details not found for this claim");
    }
    const aiResult = yield ai_service_1.aiRecognitionService.analyzeClaimFraud(claim.distinguishingFeatures || "", claim.foundItem.description, claim.foundItem.foundItemName);
    let serialWarning = null;
    if (claim.userId) {
        const thirtyDaysAgo = new Date(claim.createdAt);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentClaimsCount = yield prisma_1.default.claim.count({
            where: {
                userId: claim.userId,
                createdAt: { gte: thirtyDaysAgo, lte: claim.createdAt },
                id: { not: claimId }
            }
        });
        if (recentClaimsCount >= 3) {
            serialWarning = `User had submitted ${recentClaimsCount} claims in the last 30 days.`;
        }
    }
    const fraudReasonObj = {
        serialWarning,
        aiAssessment: aiResult
    };
    const updatedClaim = yield prisma_1.default.claim.update({
        where: { id: claimId },
        data: {
            fraudScore: aiResult.fraudScore,
            isHighRisk: aiResult.isHighRisk || !!serialWarning,
            fraudReason: JSON.stringify(fraudReasonObj)
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
        }
    });
    return updatedClaim;
});
exports.claimsService = {
    createClaim,
    getClaim,
    updateClaimStatus,
    getMyClaim,
    deleteClaim,
    getAuditLogs,
    trackClaim,
    analyzeClaimFraud,
};
