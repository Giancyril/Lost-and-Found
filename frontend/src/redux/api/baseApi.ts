import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getUserLocalStorage } from "../../auth/auth";

const isProduction = false; // Force development mode for local testing

const getBaseUrl = () => {
  if (isProduction) {
    const serverUrl = import.meta.env.VITE_SERVER_URL;
    if (!serverUrl) {
      console.error("VITE_SERVER_URL is not set!");
      return "http://localhost:5000/api";
    }
    return `${serverUrl}/api`;
  }
  return "http://127.0.0.1:5000/api";
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  refetchOnFocus: false,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({
    baseUrl: getBaseUrl(),
    credentials: "include",
    prepareHeaders: (headers) => {
      const token = getUserLocalStorage();
      console.log(`[DEBUG] Frontend - Token from localStorage:`, token ? token.substring(0, 50) + '...' : 'No token');
      if (token) {
        // Always send "Bearer <token>" so the backend auth() middleware
        // can split on " " and get the raw JWT. Without "Bearer ", jwt.verify()
        // receives the full "Bearer eyJ..." string and throws "invalid token".
        const normalized = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
        console.log(`[DEBUG] Frontend - Sending token:`, normalized.substring(0, 50) + '...');
        headers.set("authorization", normalized);
      }
      headers.set("Cache-Control", "no-cache");
      headers.set("Pragma", "no-cache");
      return headers;
    },
  }),
  tagTypes: [
    "mylostItems", "myFoundItems", "users", "adminData",
    "testimonials", "services", "faqs", "recentActivity",
    "foundItems", "claims", "categories", "auditLogs",
    "bulletinPosts", "matchNotifications", "comments",
    "analytics", "points",
  ],
  endpoints: () => ({}),
});