import app from "./app";
import dotenv from "dotenv";
import { createServer } from "http";
import { initializeSocket } from "./websocket/socketServer";

dotenv.config();

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

// Initialize Socket.io
const io = initializeSocket(httpServer);
app.set("io", io);

async function main() {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT} with WebSockets enabled`);
  });
}

main();
