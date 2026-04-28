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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromStorage = exports.uploadFileToStorage = exports.uploadBase64ToStorage = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = "item-images";
/**
 * Upload a base64 data URI to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
const uploadBase64ToStorage = (base64DataUri, folder, itemId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // If it's already a URL (not base64), return as-is
    if (!base64DataUri.startsWith("data:"))
        return base64DataUri;
    const matches = base64DataUri.match(/^data:(.+);base64,(.+)$/);
    if (!matches)
        throw new Error("Invalid base64 image format");
    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], "base64");
    const ext = (_a = mimeType.split("/")[1]) !== null && _a !== void 0 ? _a : "jpg";
    const path = `${folder}/${itemId}-${Date.now()}.${ext}`;
    const { error } = yield supabase.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: mimeType, upsert: true });
    if (error)
        throw new Error(`Storage upload failed: ${error.message}`);
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
});
exports.uploadBase64ToStorage = uploadBase64ToStorage;
/**
 * Upload a multipart file (Buffer) to Supabase Storage.
 * Returns the public URL.
 */
const uploadFileToStorage = (buffer, mimeType, folder, itemId) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const ext = (_b = mimeType.split("/")[1]) !== null && _b !== void 0 ? _b : "jpg";
    const path = `${folder}/${itemId}-${Date.now()}.${ext}`;
    const { error } = yield supabase.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: mimeType, upsert: true });
    if (error)
        throw new Error(`Storage upload failed: ${error.message}`);
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
});
exports.uploadFileToStorage = uploadFileToStorage;
/**
 * Delete an image from Supabase Storage by its public URL.
 */
const deleteFromStorage = (publicUrl) => __awaiter(void 0, void 0, void 0, function* () {
    if (!publicUrl || !publicUrl.includes(BUCKET))
        return;
    // Extract path from URL: everything after /object/public/item-images/
    const marker = `/object/public/${BUCKET}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1)
        return;
    const path = publicUrl.slice(idx + marker.length);
    yield supabase.storage.from(BUCKET).remove([path]);
});
exports.deleteFromStorage = deleteFromStorage;
