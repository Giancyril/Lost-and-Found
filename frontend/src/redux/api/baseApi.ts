import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getUserLocalStorage } from "../../auth/auth";

const isProduction = import.meta.env.VITE_PRODUCTION == "true";
const serverUrl = `${import.meta.env.VITE_SERVER_URL}/api` || "http://localhost:5000/api";

export const baseApi = createApi({
  reducerPath: "baseApi",
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({
    baseUrl: isProduction ? serverUrl : "http://127.0.0.1:5000/api",
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
    "bulletinPosts","matchNotifications","comments",
  ],
  endpoints: () => ({}),
});