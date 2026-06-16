import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../global/response";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// ── Helper: time an async check and classify performance ─────────────────────
type CheckResult = {
    name: string;
    status: "HEALTHY" | "DEGRADED" | "DOWN";
    responseTime: number;
    endpoint: string;
    description: string;
};

const PERFORMANCE_THRESHOLDS = { excellent: 100, good: 300 }; // ms

const classifyPerformance = (ms: number): "Excellent" | "Good" | "Slow" => {
    if (ms <= PERFORMANCE_THRESHOLDS.excellent) return "Excellent";
    if (ms <= PERFORMANCE_THRESHOLDS.good) return "Good";
    return "Slow";
};

const timeCheck = async (fn: () => Promise<void>): Promise<{ ms: number; ok: boolean; error?: string }> => {
    const start = Date.now();
    try {
        await fn();
        return { ms: Date.now() - start, ok: true };
    } catch (err: any) {
        return { ms: Date.now() - start, ok: false, error: err?.message || "Check failed" };
    }
};

// ════════════════════════════════════════════════════════════════════════════════
// API STATUS / HEALTH CHECKS
// ════════════════════════════════════════════════════════════════════════════════
// All checks below reflect what this app actually uses — no fabricated stubs,
// no third-party providers that aren't really in the stack (no Cloudinary/Auth0).
//
//   API Server      → reaching this handler proves the Express server is up
//   Database        → real Prisma query against Postgres
//   File Uploads    → multer is configured with memoryStorage(), so there's no
//                      external storage provider to ping. This check instead
//                      verifies the multer/upload module loads correctly
//                      (in-process check, since memory storage has no network
//                      dependency to fail on).
//   Authentication  → real check: signs and verifies a throwaway JWT using the
//                      same secret your auth module uses, proving the token
//                      pipeline (jsonwebtoken) is functioning end-to-end.
//   AI (Gemini)     → real check: confirms GEMINI_API_KEY is present and the
//                      @google/generative-ai client can be instantiated.
//                      Does NOT make a real generateContent() call — that would
//                      cost quota/money on every page load. This is the
//                      equivalent of confirming the AI client can reach the
//                      "ready to call" state, not confirming the live network
//                      reachability of Gemini's API itself.

export const getApiHealth = async (req: Request, res: Response) => {
    const checkedAt = new Date();

    // 1. API Server — self check (this request reaching this handler is the proof)
    const apiCheck = await timeCheck(async () => { /* reaching here = server is up */ });

    // 2. Database — real Prisma ping
    const dbCheck = await timeCheck(async () => {
        await prisma.$queryRaw`SELECT 1`;
    });

    // 3. File Uploads — multer memoryStorage, in-process module check
    //    (no external provider exists to ping; memory storage has no network call)
    const uploadCheck = await timeCheck(async () => {
        const multer = await import("multer");
        if (typeof multer.default !== "function") {
            throw new Error("multer module failed to load");
        }
    });

    // 4. Authentication — real JWT sign + verify round-trip
    const authCheck = await timeCheck(async () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error("JWT_SECRET is not configured");
        const token = jwt.sign({ healthCheck: true }, secret, { expiresIn: "10s" });
        jwt.verify(token, secret);
    });

    // 5. AI (Gemini) — confirms API key + client instantiation, no live API call
    const aiCheck = await timeCheck(async () => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const client = new GoogleGenerativeAI(apiKey);
        if (!client) throw new Error("Failed to instantiate Gemini client");
    });

    const services: CheckResult[] = [
        {
            name: "API Server",
            status: apiCheck.ok ? "HEALTHY" : "DOWN",
            responseTime: apiCheck.ms,
            endpoint: "Express Server",
            description: "Main API server health check",
        },
        {
            name: "Database",
            status: dbCheck.ok ? "HEALTHY" : "DOWN",
            responseTime: dbCheck.ms,
            endpoint: "PostgreSQL (Prisma)",
            description: "Database connection status",
        },
        {
            name: "File Uploads",
            status: uploadCheck.ok ? "HEALTHY" : "DOWN",
            responseTime: uploadCheck.ms,
            endpoint: "Multer (in-memory)",
            description: "Image and audio upload handling",
        },
        {
            name: "Authentication",
            status: authCheck.ok ? "HEALTHY" : "DOWN",
            responseTime: authCheck.ms,
            endpoint: "JWT (jsonwebtoken)",
            description: "Token signing and verification",
        },
        {
            name: "AI (Gemini)",
            status: aiCheck.ok ? "HEALTHY" : "DOWN",
            responseTime: aiCheck.ms,
            endpoint: "Google Gemini API",
            description: "AI-powered search, recognition & fraud detection",
        },
    ];

    const allHealthy = services.every(s => s.status === "HEALTHY");
    const avgResponseTime = Math.round(services.reduce((sum, s) => sum + s.responseTime, 0) / services.length);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "API health check completed",
        data: {
            overallStatus: allHealthy ? "HEALTHY" : "DEGRADED",
            checkedAt: checkedAt.toISOString(),
            responseTime: apiCheck.ms,
            healthScore: Math.round((services.filter(s => s.status === "HEALTHY").length / services.length) * 1000) / 10,
            services: services.map(s => ({ ...s, performance: classifyPerformance(s.responseTime) })),
            avgResponseTime,
        },
    });
};