import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "item-images";

/**
 * Upload a base64 data URI to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export const uploadBase64ToStorage = async (
  base64DataUri: string,
  folder: string,
  itemId: string
): Promise<string> => {
  // If it's already a URL (not base64), return as-is
  if (!base64DataUri.startsWith("data:")) return base64DataUri;

  const matches = base64DataUri.match(/^data:(.+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid base64 image format");

  const mimeType = matches[1];
  const buffer   = Buffer.from(matches[2], "base64");
  const ext      = mimeType.split("/")[1] ?? "jpg";
  const path     = `${folder}/${itemId}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Upload a multipart file (Buffer) to Supabase Storage.
 * Returns the public URL.
 */
export const uploadFileToStorage = async (
  buffer: Buffer,
  mimeType: string,
  folder: string,
  itemId: string
): Promise<string> => {
  const ext  = mimeType.split("/")[1] ?? "jpg";
  const path = `${folder}/${itemId}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Delete an image from Supabase Storage by its public URL.
 */
export const deleteFromStorage = async (publicUrl: string): Promise<void> => {
  if (!publicUrl || !publicUrl.includes(BUCKET)) return;
  // Extract path from URL: everything after /object/public/item-images/
  const marker = `/object/public/${BUCKET}/`;
  const idx    = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const path = publicUrl.slice(idx + marker.length);
  await supabase.storage.from(BUCKET).remove([path]);
};