import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getUserLocalStorage } from "../../auth/auth";

const isProduction = import.meta.env.VITE_PRODUCTION === "true";

// Safe URL resolution — avoids "undefined/api" bug
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
      if (token) headers.set("authorization", `${token}`);
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