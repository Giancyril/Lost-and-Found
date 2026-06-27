/**
 * Optimizes a Cloudinary image URL by injecting transformation parameters.
 * - f_auto  ? serves WebP on modern browsers, AVIF where supported
 * - q_auto  ? Cloudinary picks the best quality level for the file size
 * - w_{width} ? resizes to the target display width (saves bandwidth on mobile)
 *
 * Falls back to the original URL for non-Cloudinary sources (local, S3, etc.)
 */
export const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%231e293b'/%3E%3Cpath d='M80 70h40v40H80z' fill='none' stroke='%2364748b' stroke-width='3' stroke-linejoin='round'/%3E%3Ccircle cx='93' cy='83' r='4' fill='%2364748b'/%3E%3Cpath d='M80 100l18-14 12 10 10-8 10 12' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linejoin='round'/%3E%3C/svg%3E`;

export const optimizeImage = (
  url: string | null | undefined,
  width: number = 400
): string => {
  if (!url || url === "/bgimg.png" || url === "/default-item.png" || url === "/default-item.jpg") {
    return PLACEHOLDER_SVG;
  }
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
