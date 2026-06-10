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
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socketServer_1 = require("./websocket/socketServer");
const bounty_service_1 = require("./app/modules/bounty/bounty.service");
const retentionScheduler_1 = require("./app/jobs/retentionScheduler");
const announcementScheduler_1 = require("./app/jobs/announcementScheduler");
const redis_1 = require("./app/config/redis");
const masterlist_sync_1 = require("./app/modules/student/masterlist.sync");
const points_service_1 = require("./app/modules/points/points.service");
dotenv_1.default.config();
const PORT = process.env.PORT || 5001;
const httpServer = (0, http_1.createServer)(app_1.default);
// Initialize Socket.io
const io = (0, socketServer_1.initializeSocket)(httpServer);
app_1.default.set("io", io);
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Connect to Redis cache
        yield (0, redis_1.connectRedis)();
        // Start background jobs
        (0, bounty_service_1.startBountyCron)();
        (0, retentionScheduler_1.startRetentionScheduler)();
        (0, announcementScheduler_1.startAnnouncementScheduler)();
        (0, masterlist_sync_1.startMasterlistSync)();
        // Run rank snapshot once at startup, then every 24 hours
        const runDailySnapshot = () => __awaiter(this, void 0, void 0, function* () {
            yield points_service_1.pointsService.snapshotRanks();
        });
        runDailySnapshot(); // on boot
        setInterval(runDailySnapshot, 24 * 60 * 60 * 1000); // every 24h
        httpServer.listen(Number(PORT), "0.0.0.0", () => {
            console.log(`Server running on port ${PORT} with WebSockets enabled`);
        });
    });
}
main();
