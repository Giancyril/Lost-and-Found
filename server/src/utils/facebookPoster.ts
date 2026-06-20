import axios from "axios";

export const sendFacebookNotification = async (item: any) => {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!pageId || !accessToken) {
    return; // Silent return if not configured
  }

  try {
    const message = `🔍 New Item Found!\n\nItem: ${item.foundItemName}\nLocation Found: ${item.location}\nDate Found: ${new Date(item.date).toLocaleDateString()}\nDescription: ${item.description || "No description provided."}\nCategory: ${item.category?.name || "Uncategorized"}\n\nPlease visit the NBSC SAS Lost & Found portal to claim your item.`;

    let imageUrl = item.img;
    if (!imageUrl && item.images && item.images.length > 0) {
      imageUrl = typeof item.images[0] === 'string' ? item.images[0] : item.images[0].url;
    }

    let url = `https://graph.facebook.com/v19.0/${pageId}/feed`;
    const payload: any = {
      access_token: accessToken,
      message: message,
    };

    // If we have an image URL, use the photos endpoint instead to create a photo post
    if (imageUrl) {
      url = `https://graph.facebook.com/v19.0/${pageId}/photos`;
      payload.url = imageUrl;
    }

    await axios.post(url, payload);

    console.log("[Facebook] Page post published successfully.");
  } catch (error: any) {
    console.error("[Facebook] Failed to publish post:", error?.response?.data || error.message);
  }
};
