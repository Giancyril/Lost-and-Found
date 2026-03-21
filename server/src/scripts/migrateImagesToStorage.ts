/**
 * Migration script: base64 images → Supabase Storage
 * Run once with: npx ts-node src/scripts/migrateImagesToStorage.ts
 */

import { createClient } from "@supabase/supabase-js";
import prisma from "../app/config/prisma";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "item-images";

// Convert base64 data URI to a Buffer + mime type
const parseBase64 = (dataUri: string) => {
  const matches = dataUri.match(/^data:(.+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid base64 string");
  const mimeType = matches[1];
  const buffer   = Buffer.from(matches[2], "base64");
  const ext      = mimeType.split("/")[1] ?? "jpg";
  return { buffer, mimeType, ext };
};

// Upload one buffer to Supabase Storage, return public URL
const uploadToStorage = async (
  buffer: Buffer,
  mimeType: string,
  ext: string,
  folder: string,
  itemId: string
): Promise<string> => {
  const path = `${folder}/${itemId}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: true });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

const migrate = async () => {
  console.log("🚀 Starting image migration...\n");

  // ── Found Items ────────────────────────────────────────────────────────────
  const foundItems = await prisma.foundItem.findMany({
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
      const url = await uploadToStorage(buffer, mimeType, ext, "found", item.id);
      await prisma.foundItem.update({
        where: { id: item.id },
        data: { img: url },
      });
      console.log(`  ✅ foundItem ${item.id} → ${url}`);
    } catch (err: any) {
      console.error(`  ❌ foundItem ${item.id} failed: ${err.message}`);
    }
  }

  // ── Lost Items ─────────────────────────────────────────────────────────────
  const lostItems = await prisma.lostItem.findMany({
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
      const url = await uploadToStorage(buffer, mimeType, ext, "lost", item.id);
      await prisma.lostItem.update({
        where: { id: item.id },
        data: { img: url },
      });
      console.log(`  ✅ lostItem ${item.id} → ${url}`);
    } catch (err: any) {
      console.error(`  ❌ lostItem ${item.id} failed: ${err.message}`);
    }
  }

  // ── Bulletin Posts ─────────────────────────────────────────────────────────
  const bulletinPosts = await prisma.bulletinPost.findMany({
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
      const url = await uploadToStorage(buffer, mimeType, ext, "bulletin", post.id);
      await prisma.bulletinPost.update({
        where: { id: post.id },
        data: { imageUrl: url },
      });
      console.log(`  ✅ bulletinPost ${post.id} → ${url}`);
    } catch (err: any) {
      console.error(`  ❌ bulletinPost ${post.id} failed: ${err.message}`);
    }
  }

  console.log("\n✅ Migration complete!");
  await prisma.$disconnect();
};

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});