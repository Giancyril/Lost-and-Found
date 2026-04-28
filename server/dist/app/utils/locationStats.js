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
exports.locationStats = void 0;
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
