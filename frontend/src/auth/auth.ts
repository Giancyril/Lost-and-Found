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

export const useUserVerification = () => {
  const [user, setUser] = useState({});

  useEffect(() => {
    const readToken = () => {
      const token = getUserLocalStorage();
      if (token) {
        try {
          const verifiedUser = verifyToken(token);
          if (verifiedUser) setUser(verifiedUser);
        } catch {
          setUser({});
        }
      } else {
        setUser({});
      }
    };

    readToken(); // run on mount
    window.addEventListener('authchange', readToken);
    return () => window.removeEventListener('authchange', readToken);
  }, []);

  return user;
};

export const signOut = (navigate?: (path: string) => void) => {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.removeItem("accessToken");
    window.dispatchEvent(new Event('authchange')); // ← was 'storage'
    if (navigate) navigate("/");
    else window.location.href = "/";
  }
};