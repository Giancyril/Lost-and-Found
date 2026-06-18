import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { getUserLocalStorage, setUserLocalStorage, signOut, verifyToken } from "../../auth/auth";

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
    const response = await fetch(`${getBaseUrl()}/csrf-token`, { 
      credentials: "include",
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    if (data.token) {
      csrfToken = data.token;
      console.log('✅ CSRF token fetched successfully');
    }
  } catch (error) {
    // Silently fail - CSRF token is optional for most operations
    // The baseQueryWithReauth will retry if we get a 403 csrf error
    if (error instanceof Error && error.name !== 'AbortError') {
      console.warn('⚠️ CSRF token fetch failed (will retry if needed):', error.message);
    }
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
  // 1. Preemptively check if the access token is already expired to avoid 401 console errors
  const token = getUserLocalStorage();
  if (token) {
    try {
      const decoded: any = verifyToken(token);
      if (decoded && decoded.exp && (decoded.exp * 1000) < Date.now()) {
        // Token is expired, try to refresh before making the actual request
        const refreshResult = await baseQuery({ url: "/refresh", method: "POST" }, api, extraOptions);
        if (refreshResult.data) {
          const newToken = (refreshResult.data as any).data?.token;
          if (newToken) {
            setUserLocalStorage(newToken);
          } else {
            signOut();
            return { error: { status: 401, data: "Unauthorized" } } as any;
          }
        } else {
          signOut();
          return { error: { status: 401, data: "Unauthorized" } } as any;
        }
      }
    } catch {
      // Ignore decode errors, let the server handle invalid tokens
    }
  }

  // 2. Proceed with the actual request
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    if (!getUserLocalStorage()) {
      return result;
    }
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

  if (result.error && result.error.status === 403) {
    const errMsg: string = (result.error.data as any)?.message ?? "";
    // Only retry for actual CSRF errors, NOT for application-level 403s
    // (e.g. wrong password, blocked user) which have descriptive messages.
    const isCsrfError = errMsg.toLowerCase().includes("csrf") || errMsg === "";
    if (isCsrfError) {
      csrfToken = null; // Invalidate stale token
      await fetchCsrfToken();
      if (csrfToken) {
        result = await baseQuery(args, api, extraOptions);
      }
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
    "analytics", "points", "commHub", "security", "loginLogs", "moderation", "chat", "push", "achievements", "virtueSpotlights", "boostEvents", "flaggedUsers"
  ],
  endpoints: () => ({}),
});