"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = __importDefault(require("./app/routes/routes"));
const virtueSpotlight_routes_1 = __importDefault(require("./routes/virtueSpotlight.routes"));
const errorHandler_1 = __importDefault(require("./app/midddlewares/errorHandler"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.disable("x-powered-by");
app.set("trust proxy", 1);
const ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://lost-and-found-liart-seven.vercel.app",
];
// ✅ SECURITY: CORS Configuration Check
// WARNING: Remove localhost origins before deploying to production
if (process.env.NODE_ENV === "production") {
    const devOrigins = ALLOWED_ORIGINS.filter(origin => origin.includes("localhost") || origin.includes("127.0.0.1"));
    if (devOrigins.length > 0) {
        console.error("⚠️  SECURITY WARNING: Development origins detected in production CORS policy:");
        console.error(devOrigins);
        console.error("Remove these origins from ALLOWED_ORIGINS before deploying!");
    }
}
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. curl, server-to-server, or mobile apps)
        if (!origin)
            return callback(null, true);
        // Allow exact-match origins
        if (ALLOWED_ORIGINS.includes(origin))
            return callback(null, true);
        // Dynamically allow any *.github.io subdomain (for SAS Portal embedded iframe)
        if (origin.endsWith(".github.io"))
            return callback(null, true);
        // Reject everything else
        callback(new Error(`CORS policy: origin '${origin}' is not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "authorization",
        "Cache-Control",
        "Pragma",
        "x-csrf-token"
    ],
};
app.use((0, cors_1.default)(corsOptions));
app.options("*", (0, cors_1.default)(corsOptions));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const csrf_csrf_1 = require("csrf-csrf");
const config_1 = __importDefault(require("./app/config/config"));
const isProduction = process.env.NODE_ENV === "production";
const { doubleCsrfProtection, generateCsrfToken } = (0, csrf_csrf_1.doubleCsrf)({
    getSecret: () => config_1.default.jwt_secrets || "default_csrf_secret",
    getSessionIdentifier: (req) => { var _a; return ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken) || req.ip || "anonymous"; },
    cookieName: "x-csrf-token",
    cookieOptions: {
        // "none" is required for cross-site requests (frontend & backend on different domains).
        // "lax" works for same-site / localhost dev. "strict" blocks cross-origin entirely.
        sameSite: isProduction ? "none" : "lax",
        path: "/",
        secure: isProduction, // "none" requires secure:true
    },
    size: 64,
    ignoredMethods: ["GET", "HEAD", "OPTIONS"],
});
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// Public — no CSRF needed
app.get("/", (req, res) => res.send({ message: "Welcome!" }));
app.get("/api/csrf-token", (req, res) => {
    const token = generateCsrfToken(req, res);
    res.json({ token });
});
// Selective CSRF — exempt login, register, refresh
const CSRF_EXEMPT = ["/api/login", "/api/register", "/api/refresh", "/api/auth", "/api/achievements/mark-seen"];
app.use((req, res, next) => {
    if (CSRF_EXEMPT.some(path => req.path.startsWith(path))) {
        return next();
    }
    return doubleCsrfProtection(req, res, next);
});
app.use("/api", routes_1.default);
app.use("/api", virtueSpotlight_routes_1.default);
app.use(errorHandler_1.default);
app.use((req, res) => {
    res.status(404).send({
        statusCode: 404,
        success: false,
        message: "Sorry, We can't find that!",
    });
});
exports.default = app;
