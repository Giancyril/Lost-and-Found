import { useEffect, useState, useRef, useCallback } from "react";
import { useUserVerification } from "../auth/auth";
import { baseApi } from "../redux/api/baseApi";

// Session-level cache to absolutely guarantee an achievement is never popped twice per session
const displayedSessionIds = new Set<string>();

const achievementApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getUnseenAchievements: b.query({ 
      query: () => ({ url: "/achievements/unseen", method: "GET" }),
      providesTags: ["achievements"],
    }),
    markAchievementsSeen: b.mutation({ 
      query: () => ({ url: "/achievements/mark-seen", method: "POST" }),
      invalidatesTags: ["achievements"],
    }),
  }),
  overrideExisting: false,
});

export const useAchievementWatcher = () => {
  const user: any = useUserVerification();
  const isLoggedIn = !!(user?.id);
  const [queue, setQueue] = useState<any[]>([]);
  const [current, setCurrent] = useState<any>(null);

  const { data } = (achievementApi as any).useGetUnseenAchievementsQuery(undefined, {
    skip: !isLoggedIn,
    pollingInterval: 15_000, // check every 15s
  });
  const [markSeen] = (achievementApi as any).useMarkAchievementsSeenMutation();

  // Clear cache upon logout to ensure fresh session when switching users
  useEffect(() => {
    if (!isLoggedIn) {
      displayedSessionIds.clear();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (data?.data?.length > 0) {
      // Filter out achievements that have already been queued/displayed in this session
      const newAchievements = data.data.filter((a: any) => !displayedSessionIds.has(a.id));
      
      if (newAchievements.length > 0) {
        newAchievements.forEach((a: any) => displayedSessionIds.add(a.id));
        setQueue((prev) => [...prev, ...newAchievements]);
      }
    }
  }, [data]);

  useEffect(() => {
    if (queue.length > 0 && !current) {
      setCurrent(queue[0]);
      setQueue(q => q.slice(1));
    }
  }, [queue, current]);

  const dismiss = useCallback(() => {
    setCurrent(null);
    markSeen(undefined);
  }, [markSeen]);

  return { current, dismiss };
};
