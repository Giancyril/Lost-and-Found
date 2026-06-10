"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAudio = exports.uploadImages = void 0;
const multer_1 = __importDefault(require("multer"));
// Configure multer for memory storage
const storage = multer_1.default.memoryStorage();
// ✅ SECURITY: Allowed MIME types for image uploads
const ALLOWED_IMAGE_MIMES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
];
// ✅ SECURITY: Forbidden MIME types that could be dangerous
const FORBIDDEN_MIMES = [
    'application/x-php',
    'application/x-httpd-php',
    'application/php',
    'application/x-sh',
    'application/x-executable',
    'application/x-msdownload',
    'text/x-php',
    'text/html'
];
// File filter to accept only images with proper MIME validation
const imageFileFilter = (req, file, cb) => {
    // ✅ Check forbidden MIME types first
    if (FORBIDDEN_MIMES.includes(file.mimetype)) {
        return cb(new Error('File type not allowed for security reasons'));
    }
    // ✅ Validate against allowed image MIME types
    if (!ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
        return cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
    }
    // ✅ Additional filename extension check (defense in depth)
    const allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!allowedExtensions.test(file.originalname)) {
        return cb(new Error('File extension does not match image type'));
    }
    cb(null, true);
};
exports.uploadImages = (0, multer_1.default)({
    storage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5 // ✅ SECURITY: Maximum 5 files enforced server-side
    }
});
exports.uploadAudio = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    }
});
