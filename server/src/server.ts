import app from "./app";
import dotenv from "dotenv";
import { createServer } from "http";
import { initializeSocket } from "./websocket/socketServer";
import { startBountyCron } from "./app/modules/bounty/bounty.service";
import { startRetentionScheduler } from "./app/jobs/retentionScheduler";
import { startAnnouncementScheduler } from "./app/jobs/announcementScheduler";
import { connectRedis } from "./app/config/redis";
import { startMasterlistSync } from "./app/modules/student/masterlist.sync";
import { pointsService } from "./app/modules/points/points.service";

dotenv.config();

const PORT = process.env.PORT || 5001;
const httpServer = createServer(app);

// Initialize Socket.io
const io = initializeSocket(httpServer);
app.set("io", io);

async function main() {
  // Connect to Redis cache
  await connectRedis();
  
  // Start background jobs
  startBountyCron();
  startRetentionScheduler();
  startAnnouncementScheduler();
  startMasterlistSync();
  
  // Run rank snapshot once at startup, then every 24 hours
  const runDailySnapshot = async () => {
    await pointsService.snapshotRanks();
  };
  runDailySnapshot(); // on boot
  setInterval(runDailySnapshot, 24 * 60 * 60 * 1000); // every 24h
  
  httpServer.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} with WebSockets enabled`);
  });
}

main();
