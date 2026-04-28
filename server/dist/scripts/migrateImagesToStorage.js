"use strict";
/**
 * Migration script: base64 images → Supabase Storage
 * Run once with: npx ts-node src/scripts/migrateImagesToStorage.ts
 */
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
const supabase_js_1 = require("@supabase/supabase-js");
const prisma_1 = __importDefault(require("../app/config/prisma"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = "item-images";
// Convert base64 data URI to a Buffer + mime type
const parseBase64 = (dataUri) => {
    var _a;
    const matches = dataUri.match(/^data:(.+);base64,(.+)$/);
    if (!matches)
        throw new Error("Invalid base64 string");
    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], "base64");
    const ext = (_a = mimeType.split("/")[1]) !== null && _a !== void 0 ? _a : "jpg";
    return { buffer, mimeType, ext };
};
// Upload one buffer to Supabase Storage, return public URL
const uploadToStorage = (buffer, mimeType, ext, folder, itemId) => __awaiter(void 0, void 0, void 0, function* () {
    const path = `${folder}/${itemId}.${ext}`;
    const { error } = yield supabase.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: mimeType, upsert: true });
    if (error)
        throw new Error(`Upload failed: ${error.message}`);
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
});
const migrate = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("🚀 Starting image migration...\n");
    // ── Found Items ────────────────────────────────────────────────────────────
    const foundItems = yield prisma_1.default.foundItem.findMany({
        where: {
            isDeleted: false,
            img: { startsWith: "data:" },
        },
        select: { id: true, img: true },
    });
    console.log(`Found ${foundItems.length} foundItems with base64 images`);
    for (const item of foundItems) {
        try {
            const { buffer, mimeType, ext } = parseBase64(item.img);
            const url = yield uploadToStorage(buffer, mimeType, ext, "found", item.id);
            yield prisma_1.default.foundItem.update({
                where: { id: item.id },
                data: { img: url },
            });
            console.log(`  ✅ foundItem ${item.id} → ${url}`);
        }
        catch (err) {
            console.error(`  ❌ foundItem ${item.id} failed: ${err.message}`);
        }
    }
    // ── Lost Items ─────────────────────────────────────────────────────────────
    const lostItems = yield prisma_1.default.lostItem.findMany({
        where: {
            isDeleted: false,
            img: { startsWith: "data:" },
        },
        select: { id: true, img: true },
    });
    console.log(`\nFound ${lostItems.length} lostItems with base64 images`);
    for (const item of lostItems) {
        try {
            const { buffer, mimeType, ext } = parseBase64(item.img);
            const url = yield uploadToStorage(buffer, mimeType, ext, "lost", item.id);
            yield prisma_1.default.lostItem.update({
                where: { id: item.id },
                data: { img: url },
            });
            console.log(`  ✅ lostItem ${item.id} → ${url}`);
        }
        catch (err) {
            console.error(`  ❌ lostItem ${item.id} failed: ${err.message}`);
        }
    }
    // ── Bulletin Posts ─────────────────────────────────────────────────────────
    const bulletinPosts = yield prisma_1.default.bulletinPost.findMany({
        where: {
            isDeleted: false,
            imageUrl: { startsWith: "data:" },
        },
        select: { id: true, imageUrl: true },
    });
    console.log(`\nFound ${bulletinPosts.length} bulletinPosts with base64 images`);
    for (const post of bulletinPosts) {
        try {
            const { buffer, mimeType, ext } = parseBase64(post.imageUrl);
            const url = yield uploadToStorage(buffer, mimeType, ext, "bulletin", post.id);
            yield prisma_1.default.bulletinPost.update({
                where: { id: post.id },
                data: { imageUrl: url },
            });
            console.log(`  ✅ bulletinPost ${post.id} → ${url}`);
        }
        catch (err) {
            console.error(`  ❌ bulletinPost ${post.id} failed: ${err.message}`);
        }
    }
    console.log("\n✅ Migration complete!");
    yield prisma_1.default.$disconnect();
});
migrate().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
