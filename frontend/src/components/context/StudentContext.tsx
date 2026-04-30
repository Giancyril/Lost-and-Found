import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { verifyToken, getUserLocalStorage } from "../../auth/auth";

// ── Types ─────────────────────────────────────────────────────────────────────
interface StudentUser {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  schoolId?: string;
  role?: string;
  userImg?: string;
}

interface StudentContextValue {
  user: StudentUser | null;
  isAuthenticated: boolean;
  isStudent: boolean;
  isAdmin: boolean;
  totalPoints: number;
  rank: number;
  loading: boolean;
  refreshPoints: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────
const StudentContext = createContext<StudentContextValue>({
  user: null,
  isAuthenticated: false,
  isStudent: false,
  isAdmin: false,
  totalPoints: 0,
  rank: 0,
  loading: true,
  refreshPoints: async () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────
export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]           = useState<StudentUser | null>(null);
  const [totalPoints, setPoints]  = useState(0);
  const [rank, setRank]           = useState(0);
  const [loading, setLoading]     = useState(true);

  // Read user from token
  const readToken = useCallback(() => {
    const token = getUserLocalStorage();
    if (!token) { setUser(null); setLoading(false); return; }
    try {
      const decoded: any = verifyToken(token);
      setUser({
        id:       decoded.id,
        name:     decoded.name,
        username: decoded.username,
        email:    decoded.email,
        schoolId: decoded.schoolId,
        role:     decoded.role,
        userImg:  decoded.userImg,
      });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch points + rank for students
  const refreshPoints = useCallback(async () => {
    const token = getUserLocalStorage();
    if (!token) return;
    try {
      const decoded: any = verifyToken(token);
      if (decoded?.role !== "USER") return;

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [pointsRes, boardRes] = await Promise.allSettled([
        fetch("/api/points/my",          { headers }).then(r => r.json()),
        fetch("/api/points/leaderboard", { headers }).then(r => r.json()),
      ]);

      if (pointsRes.status === "fulfilled") {
        setPoints(pointsRes.value?.data?.totalPoints ?? 0);
      }
      if (boardRes.status === "fulfilled") {
        const board: any[] = boardRes.value?.data ?? [];
        const myRank = board.findIndex((u: any) => u.id === decoded.id) + 1;
        setRank(myRank);
      }
    } catch {
      // silently fail — points are non-critical
    }
  }, []);

  useEffect(() => {
    readToken();

    // Re-read on auth changes (login / logout)
    window.addEventListener("authchange", readToken);
    return () => window.removeEventListener("authchange", readToken);
  }, [readToken]);

  // Fetch points once user is set and is a student
  useEffect(() => {
    if (user?.role === "USER") {
      refreshPoints();
    } else {
      setPoints(0);
      setRank(0);
    }
  }, [user, refreshPoints]);

  const isAuthenticated = !!user;
  const isStudent       = user?.role === "USER";
  const isAdmin         = user?.role === "ADMIN";

  return (
    <StudentContext.Provider value={{
      user, isAuthenticated, isStudent, isAdmin,
      totalPoints, rank, loading, refreshPoints,
    }}>
      {children}
    </StudentContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useStudent() {
  return useContext(StudentContext);
}