import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import type { decodedUser } from "../types/types";

export const setUserLocalStorage = (token: string, navigate?: (path: string) => void) => {
  if (typeof window !== "undefined" && window.localStorage) {
    if (token == null || token == undefined) {
      localStorage.removeItem("accessToken");
      if (navigate) navigate("/");
      else window.location.href = "/";
    } else {
      localStorage.setItem("accessToken", token);
    }
  }
};

export const getUserLocalStorage = () => {
  if (typeof window !== "undefined" && window.localStorage) {
    return localStorage.getItem("accessToken");
  }
  return null;
};

export const removeUserLocalStorage = (navigate?: (path: string) => void) => {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.removeItem("accessToken");
    if (navigate) navigate("/login");
    else window.location.href = "/login";
  }
};

export const verifyToken = (token: string) => {
  const decodedUser: decodedUser = jwtDecode(token);
  return decodedUser;
};

// ── Helper: decode the token that's in localStorage right now (sync) ──────────
const decodeStoredToken = (): decodedUser | null => {
  try {
    const token = getUserLocalStorage();
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
};

export const useUserVerification = () => {
  // ✅ FIX: initialize with the decoded token synchronously so the very first
  // render already has the user — no empty-{} first render.
  // Previously useState({}) meant:
  //   - render 1: user = {} → isLoggedIn = false → useGetMyPointsQuery is skipped
  //   - render 2 (after useEffect): user = decoded → but RTK Query never retries a
  //     skipped query unless the skip condition changes within a re-render cycle
  //     that RTK Query observes at subscription time.
  const [user, setUser] = useState<decodedUser | null>(() => decodeStoredToken());

  useEffect(() => {
    const readToken = () => {
      const decoded = decodeStoredToken();
      setUser(decoded);
    };

    // Re-read on auth events (login / logout)
    window.addEventListener("authchange", readToken);
    return () => window.removeEventListener("authchange", readToken);
  }, []);

  return user;
};

export const signOut = (navigate?: (path: string) => void) => {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.removeItem("accessToken");
    window.dispatchEvent(new Event("authchange"));
    if (navigate) navigate("/");
    else window.location.href = "/";
  }
};