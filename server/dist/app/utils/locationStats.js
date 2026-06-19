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
exports.heatmapStats = exports.locationStats = void 0;
const foundItem_service_1 = require("../modules/foundItems/foundItem.service");
const lostItem_service_1 = require("../modules/lostItem/lostItem.service");
const response_1 = __importDefault(require("../global/response"));
const http_status_codes_1 = require("http-status-codes");
const locationStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const queryParams = { limit: 5000 };
        const [allFound, allLost] = yield Promise.all([
            foundItem_service_1.foundItemService.getFoundItem(queryParams),
            lostItem_service_1.lostTItemServices.getLostItem(queryParams)
        ]);
        const counts = {};
        const processItems = (items, type) => {
            for (const item of items) {
                const loc = (item.location || "Unknown").trim();
                if (!counts[loc])
                    counts[loc] = { found: 0, lost: 0, total: 0 };
                if (type === "found")
                    counts[loc].found++;
                else
                    counts[loc].lost++;
                counts[loc].total++;
            }
        };
        processItems(allFound || [], "found");
        processItems(allLost || [], "lost");
        const locationData = Object.entries(counts)
            .map(([location, data]) => (Object.assign({ location }, data)))
            .sort((a, b) => b.total - a.total);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Location stats retrieved successfully",
            data: locationData,
        });
    }
    catch (error) {
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: error === null || error === void 0 ? void 0 : error.message,
            data: null,
        });
    }
});
exports.locationStats = locationStats;
// ── Heatmap Stats: returns per-item detail for the upgraded interactive heatmap ──
const heatmapStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const queryParams = { limit: 5000 };
        const [allFound, allLost] = yield Promise.all([
            foundItem_service_1.foundItemService.getFoundItem(queryParams),
            lostItem_service_1.lostTItemServices.getLostItem(queryParams),
        ]);
        // Build a location → counts lookup
        const counts = {};
        const addToCount = (loc, type) => {
            if (!counts[loc])
                counts[loc] = { found: 0, lost: 0, total: 0 };
            if (type === "found")
                counts[loc].found++;
            else
                counts[loc].lost++;
            counts[loc].total++;
        };
        // Slim item payload for the frontend timeline
        const items = [];
        for (const item of allFound || []) {
            const loc = (item.location || "Unknown").trim();
            addToCount(loc, "found");
            items.push({
                id: item.id,
                type: "found",
                location: loc,
                date: item.date ? new Date(item.date).toISOString() : new Date(item.createdAt).toISOString(),
                category: (_b = (_a = item.category) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "Unknown",
                name: (_c = item.foundItemName) !== null && _c !== void 0 ? _c : "",
            });
        }
        for (const item of allLost || []) {
            const loc = (item.location || "Unknown").trim();
            addToCount(loc, "lost");
            items.push({
                id: item.id,
                type: "lost",
                location: loc,
                date: item.date ? new Date(item.date).toISOString() : new Date(item.createdAt).toISOString(),
                category: (_e = (_d = item.category) === null || _d === void 0 ? void 0 : _d.name) !== null && _e !== void 0 ? _e : "Unknown",
                name: (_f = item.lostItemName) !== null && _f !== void 0 ? _f : "",
            });
        }
        const locationData = Object.entries(counts)
            .map(([location, data]) => (Object.assign({ location }, data)))
            .sort((a, b) => b.total - a.total);
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Heatmap stats retrieved successfully",
            data: { locations: locationData, items },
        });
    }
    catch (error) {
        (0, response_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: error === null || error === void 0 ? void 0 : error.message,
            data: null,
        });
    }
});
exports.heatmapStats = heatmapStats;
