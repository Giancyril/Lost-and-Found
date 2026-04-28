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
dotenv_1.default.config();
const PORT = process.env.PORT || 5000;
const httpServer = (0, http_1.createServer)(app_1.default);
// Initialize Socket.io
const io = (0, socketServer_1.initializeSocket)(httpServer);
app_1.default.set("io", io);
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        httpServer.listen(PORT, () => {
            console.log(`Server running on port ${PORT} with WebSockets enabled`);
        });
    });
}
main();
