import { useEffect, useState, useRef } from "react";
import { useUserVerification } from "../auth/auth";
import { baseApi } from "../redux/api/baseApi";

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
  const queuedIds = useRef<Set<string>>(new Set());

  const { data } = (achievementApi as any).useGetUnseenAchievementsQuery(undefined, {
    skip: !isLoggedIn,
    pollingInterval: 15_000, // check every 15s
  });
  const [markSeen] = (achievementApi as any).useMarkAchievementsSeenMutation();

  useEffect(() => {
    if (data?.data?.length > 0) {
      const newAchievements = data.data.filter((a: any) => !queuedIds.current.has(a.id));
      
      if (newAchievements.length > 0) {
        newAchievements.forEach((a: any) => queuedIds.current.add(a.id));
        setQueue((prev) => [...prev, ...newAchievements]);
        markSeen(undefined);
      }
    }
  }, [data, markSeen]);

  useEffect(() => {
    if (queue.length > 0 && !current) {
      setCurrent(queue[0]);
      setQueue(q => q.slice(1));
    }
  }, [queue, current]);

  const dismiss = () => setCurrent(null);

  return { current, dismiss };
};
