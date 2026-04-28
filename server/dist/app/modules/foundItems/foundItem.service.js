"use strict";
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
exports.foundItemService = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const storage_1 = require("../../utils/storage");
const match_service_1 = require("../matching/match.service");
const createFoundItem = (data, userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // ── STORAGE FIX: convert base64 img to Storage URL before saving ──────────
    let imgUrl = (_a = data.img) !== null && _a !== void 0 ? _a : "";
    if (imgUrl.startsWith("data:")) {
        imgUrl = yield (0, storage_1.uploadBase64ToStorage)(imgUrl, "found", `found-${Date.now()}`);
    }
    const createData = {
        categoryId: data.categoryId,
        description: data.description,
        date: data.date,
        claimProcess: data.claimProcess || "Visit the SAS office with valid ID to claim this item.",
        img: imgUrl,
        foundItemName: data.foundItemName,
        location: data.location,
        reporterName: data.reporterName || "",
        schoolEmail: data.schoolEmail || "",
    };
    if (userId)
        createData.userId = userId;
    const result = yield prisma_1.default.foundItem.create({
        data: createData,
        include: {
            user: { select: { id: true, username: true, createdAt: true, updatedAt: true } },
            category: true,
        },
    });
    if (data.lostItemId) {
        yield prisma_1.default.lostItem.update({
            where: { id: data.lostItemId },
            data: { isFound: true },
        });
    }
    // Trigger smart matching in background
    match_service_1.matchService.findMatchesForFoundItem(result).catch(err => console.error("[SmartMatch] Error during matching:", err));
    return result;
});
const getFoundItem = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { searchTerm, page = 1, limit = 10, sortBy = "foundItemName", sortOrder = "asc", foundItemName, startDate, endDate, } = data;
    const whereConditions = {
        isDeleted: false,
        isArchived: false,
    };
    if (foundItemName) {
        whereConditions.foundItemName = { contains: foundItemName, mode: "insensitive" };
    }
    if (searchTerm) {
        whereConditions.OR = [
            { foundItemName: { contains: searchTerm, mode: "insensitive" } },
            { location: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
        ];
    }
    if (startDate || endDate) {
        whereConditions.date = {};
        if (startDate)
            whereConditions.date.gte = new Date(startDate);
        if (endDate)
            whereConditions.date.lte = new Date(endDate);
    }
    let retryCount = 0;
    const maxRetries = 3;
    while (retryCount < maxRetries) {
        try {
            const result = yield prisma_1.default.foundItem.findMany({
                where: whereConditions,
                orderBy: { [sortBy]: sortOrder },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
                select: {
                    id: true,
                    foundItemName: true,
                    description: true,
                    location: true,
                    date: true,
                    isClaimed: true,
                    isArchived: true,
                    isDeleted: true,
                    img: true,
                    reporterName: true,
                    schoolEmail: true,
                    createdAt: true,
                    updatedAt: true,
                    category: { select: { id: true, name: true } },
                    user: { select: { id: true, username: true, email: true, role: true } },
                },
            });
            return result;
        }
        catch (error) {
            retryCount++;
            console.error(`getFoundItem attempt ${retryCount} failed:`, error.message);
            if (retryCount >= maxRetries) {
                console.error('getFoundItem: Max retries reached, throwing error');
                throw new Error('Database connection failed. Please try again.');
            }
            // Wait before retrying (exponential backoff)
            yield new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
    }
});
const getSingleFoundItem = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.foundItem.findFirst({
        where: { id, isDeleted: false },
        include: {
            user: { select: { id: true, email: true, username: true, role: true } },
            category: true,
            claim: {
                orderBy: { createdAt: "desc" },
                include: { auditLogs: { orderBy: { createdAt: "asc" } } },
            },
        },
    });
});
const getMyFoundItem = (user) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.foundItem.findMany({
        where: { userId: user.id, isDeleted: false },
        include: { user: true, category: true },
    });
});
const editMyFoundItem = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const updateData = {};
    if (data === null || data === void 0 ? void 0 : data.foundItemName)
        updateData.foundItemName = data.foundItemName;
    if (data === null || data === void 0 ? void 0 : data.location)
        updateData.location = data.location;
    if (data === null || data === void 0 ? void 0 : data.date)
        updateData.date = data.date;
    if (data === null || data === void 0 ? void 0 : data.description)
        updateData.description = data.description;
    if ((data === null || data === void 0 ? void 0 : data.reporterName) !== undefined)
        updateData.reporterName = data.reporterName;
    // Upload new image to Storage if base64 provided
    if ((_b = data === null || data === void 0 ? void 0 : data.img) === null || _b === void 0 ? void 0 : _b.startsWith("data:")) {
        updateData.img = yield (0, storage_1.uploadBase64ToStorage)(data.img, "found", data.id);
    }
    return prisma_1.default.foundItem.update({ where: { id: data.id }, data: updateData });
});
const deleteMyFoundItem = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.foundItem.update({
        where: { id },
        data: { isDeleted: true, deletedAt: new Date() },
    });
});
const archiveFoundItem = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.foundItem.update({
        where: { id },
        data: { isArchived: true, archivedAt: new Date() },
    });
});
const restoreFoundItem = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.foundItem.update({
        where: { id },
        data: { isArchived: false, archivedAt: null },
    });
});
const getArchivedFoundItems = () => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.foundItem.findMany({
        where: { isDeleted: false, isArchived: true },
        orderBy: { archivedAt: "desc" },
        include: {
            user: { select: { id: true, username: true, email: true } },
            category: true,
            claim: { select: { id: true, status: true, claimantName: true } },
        },
    });
});
const getStaleFoundItems = () => __awaiter(void 0, void 0, void 0, function* () {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return prisma_1.default.foundItem.findMany({
        where: {
            isDeleted: false,
            isArchived: false,
            isClaimed: false,
            createdAt: { lte: thirtyDaysAgo },
        },
        include: { category: true },
    });
});
const updateFoundItemImage = (id, imageUrl) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.foundItem.update({
        where: { id },
        data: { img: imageUrl },
    });
});
exports.foundItemService = {
    createFoundItem,
    getFoundItem,
    getSingleFoundItem,
    getMyFoundItem,
    editMyFoundItem,
    deleteMyFoundItem,
    archiveFoundItem,
    restoreFoundItem,
    getArchivedFoundItems,
    getStaleFoundItems,
    updateFoundItemImage,
};
