"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = __importDefault(require("./app/routes/routes"));
const errorHandler_1 = __importDefault(require("./app/midddlewares/errorHandler"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.set('trust proxy', 1);
const corsOptions = {
    origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://lost-and-found-liart-seven.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "authorization",
        "Cache-Control",
        "Pragma",
    ],
};
app.use((0, cors_1.default)(corsOptions));
app.options("*", (0, cors_1.default)(corsOptions)); // ✅ preflight uses same options
// Increase body size limit to 10mb to support base64 image uploads
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
app.get("/", (req, res) => {
    res.send({ message: "Welcome to Lost and found services!" });
});
app.use("/api", routes_1.default);
app.use(errorHandler_1.default);
app.use((req, res) => {
    res.status(404).send({
        statusCode: 404,
        success: false,
        message: "Sorry, We can't find that!",
    });
});
exports.default = app;
