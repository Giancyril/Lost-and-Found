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
exports.lostTItemServices = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const storage_1 = require("../../utils/storage");
const match_service_1 = require("../matching/match.service");
const toggleFoundStatus = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const currentItem = yield prisma_1.default.lostItem.findUnique({
        where: { id },
        select: { isFound: true },
    });
    if (!currentItem)
        throw new Error("Item not found");
    return prisma_1.default.lostItem.update({
        where: { id },
        data: { isFound: !currentItem.isFound },
        include: {
            user: { select: { id: true, username: true, createdAt: true, updatedAt: true } },
            category: true,
        },
    });
});
const createLostItem = (userId, item) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // ── STORAGE FIX: convert base64 img to Storage URL before saving ──────────
    let imgUrl = (_a = item.img) !== null && _a !== void 0 ? _a : "";
    if (imgUrl.startsWith("data:")) {
        imgUrl = yield (0, storage_1.uploadBase64ToStorage)(imgUrl, "lost", `lost-${Date.now()}`);
    }
    const createData = {
        lostItemName: item.lostItemName,
        description: item.description,
        categoryId: item.categoryId,
        img: imgUrl,
        location: item.location,
        date: item.date,
        reporterName: item.reporterName || "",
        schoolEmail: item.schoolEmail || "",
    };
    if (userId)
        createData.userId = userId;
    const result = yield prisma_1.default.lostItem.create({
        data: createData,
        include: {
            user: { select: { id: true, username: true, createdAt: true, updatedAt: true } },
            category: true,
        },
    });
    // Trigger smart matching in background
    match_service_1.matchService.findMatchesForLostItem(result).catch(err => console.error("[SmartMatch] Error during matching:", err));
    return result;
});
const getLostItem = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (query = {}) {
    const { searchTerm, page = 1, limit = 10, sortBy = "lostItemName", sortOrder = "asc", startDate, endDate, } = query;
    const whereConditions = { isDeleted: false, isFound: false };
    if (searchTerm) {
        whereConditions.OR = [
            { lostItemName: { contains: searchTerm, mode: "insensitive" } },
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
            const result = yield prisma_1.default.lostItem.findMany({
                where: whereConditions,
                orderBy: { [sortBy]: sortOrder },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
                include: {
                    user: { select: { id: true, username: true, email: true, role: true } },
                    category: true,
                },
            });
            return result;
        }
        catch (error) {
            retryCount++;
            console.error(`getLostItem attempt ${retryCount} failed:`, error.message);
            if (retryCount >= maxRetries) {
                console.warn('getLostItem: returning empty after max retries');
                return [];
            }
            yield new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
    }
    return [];
});
const getAllLostItems = (...args_2) => __awaiter(void 0, [...args_2], void 0, function* (query = {}) {
    const { searchTerm, page = 1, limit = 10, sortBy = "lostItemName", sortOrder = "asc", } = query;
    const whereConditions = { isDeleted: false };
    if (searchTerm) {
        whereConditions.OR = [
            { lostItemName: { contains: searchTerm, mode: "insensitive" } },
            { location: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
        ];
    }
    return prisma_1.default.lostItem.findMany({
        where: whereConditions,
        orderBy: { [sortBy]: sortOrder },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
            user: { select: { id: true, username: true, email: true, role: true } },
            category: true,
        },
    });
});
const getSingleLostItem = (singleId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.lostItem.findFirst({
        where: { id: singleId, isDeleted: false },
        include: { user: true, category: true },
    });
});
const getMyLostItem = (user) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.lostItem.findMany({
        where: { userId: user.id, isDeleted: false },
        include: { user: true, category: true },
    });
});
const editMyLostItem = (data, user) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const updateData = {};
    if (data === null || data === void 0 ? void 0 : data.lostItemName)
        updateData.lostItemName = data.lostItemName;
    if (data === null || data === void 0 ? void 0 : data.location)
        updateData.location = data.location;
    if (data === null || data === void 0 ? void 0 : data.date)
        updateData.date = data.date;
    if (data === null || data === void 0 ? void 0 : data.description)
        updateData.description = data.description;
    if (data === null || data === void 0 ? void 0 : data.categoryId)
        updateData.categoryId = data.categoryId;
    if ((data === null || data === void 0 ? void 0 : data.reporterName) !== undefined)
        updateData.reporterName = data.reporterName;
    if ((data === null || data === void 0 ? void 0 : data.schoolEmail) !== undefined)
        updateData.schoolEmail = data.schoolEmail;
    // Upload new image to Storage if base64 provided
    if ((_b = data === null || data === void 0 ? void 0 : data.img) === null || _b === void 0 ? void 0 : _b.startsWith("data:")) {
        updateData.img = yield (0, storage_1.uploadBase64ToStorage)(data.img, "lost", data.id);
    }
    else if (data === null || data === void 0 ? void 0 : data.img) {
        updateData.img = data.img;
    }
    const whereClause = { id: data.id };
    if (user)
        whereClause.userId = user.id;
    return prisma_1.default.lostItem.update({
        where: whereClause,
        data: updateData,
        include: {
            user: { select: { id: true, username: true, createdAt: true, updatedAt: true } },
            category: true,
        },
    });
});
const deleteMyLostItem = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.lostItem.update({
        where: { id },
        data: { isDeleted: true, deletedAt: new Date() },
        include: {
            user: { select: { id: true, username: true, createdAt: true, updatedAt: true } },
            category: true,
        },
    });
});
exports.lostTItemServices = {
    toggleFoundStatus,
    createLostItem,
    getLostItem,
    getAllLostItems,
    getSingleLostItem,
    getMyLostItem,
    editMyLostItem,
    deleteMyLostItem,
};
