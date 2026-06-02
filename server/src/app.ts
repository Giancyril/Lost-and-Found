import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import router from "./app/routes/routes";
import virtueRoutes from "./routes/virtueSpotlight.routes";
import errorHandler from "./app/midddlewares/errorHandler";

dotenv.config();

const app: Application = express();

app.use(helmet());
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
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (e.g. curl, server-to-server, or mobile apps)
    if (!origin) return callback(null, true);

    // Allow exact-match origins
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);

    // Dynamically allow any *.github.io subdomain (for SAS Portal embedded iframe)
    if (origin.endsWith(".github.io")) return callback(null, true);

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


app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

import cookieParser from "cookie-parser";
import { doubleCsrf } from "csrf-csrf";
import config from "./app/config/config";

const isProduction = process.env.NODE_ENV === "production";

const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => config.jwt_secrets as string || "default_csrf_secret",
  getSessionIdentifier: (req) => req.cookies?.refreshToken || req.ip || "anonymous",
  cookieName: "x-csrf-token",
  cookieOptions: {
    // "none" is required for cross-site requests (frontend & backend on different domains).
    // "lax" works for same-site / localhost dev. "strict" blocks cross-origin entirely.
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    secure: isProduction,   // "none" requires secure:true
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
});

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Public — no CSRF needed
app.get("/", (req, res) => res.send({ message: "Welcome!" }));
app.get("/api/csrf-token", (req, res) => {
  const token = generateCsrfToken(req, res);
  res.json({ token });
});

// Selective CSRF — exempt login, register, refresh
const CSRF_EXEMPT = ["/api/login", "/api/register", "/api/refresh", "/api/auth"];

app.use((req, res, next) => {
  if (CSRF_EXEMPT.some(path => req.path.startsWith(path))) {
    return next();
  }
  return doubleCsrfProtection(req, res, next);
});

app.use("/api", router);
app.use("/api", virtueRoutes);
app.use(errorHandler);

app.use((req: Request, res: Response) => {
  res.status(404).send({
    statusCode: 404,
    success: false,
    message: "Sorry, We can't find that!",
  });
});

export default app;