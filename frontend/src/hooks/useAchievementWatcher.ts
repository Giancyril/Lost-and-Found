import { useEffect, useState } from "react";
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

  const { data } = (achievementApi as any).useGetUnseenAchievementsQuery(undefined, {
    skip: !isLoggedIn,
    pollingInterval: 15_000, // check every 15s
  });
  const [markSeen] = (achievementApi as any).useMarkAchievementsSeenMutation();

  useEffect(() => {
    if (data?.data?.length > 0) {
      // Add only new ones to the queue
      setQueue((prev) => {
        const existingIds = new Set(prev.map(a => a.id));
        const newAchievements = data.data.filter((a: any) => !existingIds.has(a.id));
        return [...prev, ...newAchievements];
      });
      markSeen(undefined);
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
