import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import router from "./app/routes/routes";
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
  ],
};


app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

import cookieParser from "cookie-parser";
import { doubleCsrf } from "csrf-csrf";
import config from "./app/config/config";

const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => config.jwt_secrets as string || "default_csrf_secret",
  getSessionIdentifier: (req) => req.cookies?.refreshToken || "anonymous",
  cookieName: "x-csrf-token",
  cookieOptions: {
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
});

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/api/csrf-token", (req: Request, res: Response) => {
  const token = generateCsrfToken(req, res);
  res.json({ token });
});

// Exclude certain webhook or public paths if necessary. We'll protect all other mutating routes.
app.use(doubleCsrfProtection);

app.get("/", (req: Request, res: Response) => {
  res.send({ message: "Welcome to Lost and found services!" });
});

app.use("/api", router);
app.use(errorHandler);

app.use((req: Request, res: Response) => {
  res.status(404).send({
    statusCode: 404,
    success: false,
    message: "Sorry, We can't find that!",
  });
});

export default app;