/**
 * Optimizes a Cloudinary image URL by injecting transformation parameters.
 * - f_auto  ? serves WebP on modern browsers, AVIF where supported
 * - q_auto  ? Cloudinary picks the best quality level for the file size
 * - w_{width} ? resizes to the target display width (saves bandwidth on mobile)
 *
 * Falls back to the original URL for non-Cloudinary sources (local, S3, etc.)
 */
export const optimizeImage = (
  url: string | null | undefined,
  width: number = 400
): string => {
  if (!url) return "/default-item.png";
  if (!url.includes("cloudinary.com")) return url;

  // Avoid double-transforming if already optimized
  if (url.includes("f_auto") || url.includes("q_auto")) return url;

  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
};

/**
 * Returns a srcSet string for responsive Cloudinary images.
 * Provide up to 3 widths; browser picks the best one.
 * Usage: <img srcSet={cloudinarySrcSet(url)} sizes="(max-width: 640px) 100vw, 400px" />
 */
export const cloudinarySrcSet = (
  url: string | null | undefined,
  widths: number[] = [320, 640, 960]
): string => {
  if (!url || !url.includes("cloudinary.com")) return "";
  return widths
    .map((w) => `${optimizeImage(url, w)} ${w}w`)
    .join(", ");
};
