import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { getUserLocalStorage, setUserLocalStorage, signOut } from "../../auth/auth";

const isProduction = import.meta.env.PROD;

const getBaseUrl = () => {
  if (isProduction) {
    const serverUrl = import.meta.env.VITE_SERVER_URL;
    if (!serverUrl) {
      console.error("VITE_SERVER_URL is not set!");
      return "http://localhost:5001/api";
    }
    return `${serverUrl}/api`;
  }
  return "http://localhost:5002/api";
};

// Global CSRF token storage
let csrfToken: string | null = null;

// Function to fetch and set CSRF token
export const fetchCsrfToken = async () => {
  try {
    const response = await fetch(`${getBaseUrl()}/csrf-token`, { credentials: "include" });
    const data = await response.json();
    if (data.token) {
      csrfToken = data.token;
    }
  } catch (error) {
    console.error("Failed to fetch CSRF token", error);
  }
};

const baseQuery = fetchBaseQuery({
  baseUrl: getBaseUrl(),
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = getUserLocalStorage();
    if (token) {
      const normalized = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
      headers.set("authorization", normalized);
    }
    if (csrfToken) {
      headers.set("x-csrf-token", csrfToken);
    }
    headers.set("Cache-Control", "no-cache");
    headers.set("Pragma", "no-cache");
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Try to refresh token
    const refreshResult = await baseQuery({ url: "/refresh", method: "POST" }, api, extraOptions);
    if (refreshResult.data) {
      const newToken = (refreshResult.data as any).data?.token;
      if (newToken) {
        setUserLocalStorage(newToken);
        // Retry the initial query
        result = await baseQuery(args, api, extraOptions);
      } else {
        signOut();
      }
    } else {
      signOut();
    }
  }

  if (result.error && result.error.status === 403 && (result.error.data as any)?.message === "invalid csrf token") {
    await fetchCsrfToken();
    if (csrfToken) {
       result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  refetchOnFocus: false,
  refetchOnReconnect: true,
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "mylostItems", "myFoundItems", "users", "adminData",
    "testimonials", "services", "faqs", "recentActivity",
    "foundItems", "claims", "categories", "auditLogs",
    "bulletinPosts", "matchNotifications", "comments",
    "analytics", "points", "commHub", "security", "moderation", "chat", "push", "achievements",
  ],
  endpoints: () => ({}),
});