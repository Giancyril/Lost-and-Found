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
exports.getMatchNotifications = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getMatchNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notifications = yield prisma_1.default.matchNotification.findMany({
            orderBy: { sentAt: "desc" },
            take: 100,
            select: {
                id: true,
                sentAt: true,
                lostItemId: true,
                foundItemId: true,
                lostItem: {
                    select: {
                        id: true,
                        lostItemName: true,
                        location: true,
                        date: true,
                        schoolEmail: true,
                        reporterName: true,
                        category: { select: { name: true } },
                    },
                },
                foundItem: {
                    select: {
                        id: true,
                        foundItemName: true,
                        location: true,
                        date: true,
                        img: true,
                        category: { select: { name: true } },
                    },
                },
            },
        });
        res.status(200).json({ success: true, data: notifications });
    }
    catch (error) {
        console.error("[MatchLog] Failed to fetch match notifications:", error);
        res.status(500).json({ success: false, message: "Failed to fetch match notifications" });
    }
});
exports.getMatchNotifications = getMatchNotifications;
