import { baseApi } from "./baseApi";

export const gratitudeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendGratitudeNote: builder.mutation({
      query: (data) => ({
        url: "/gratitude",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["points", "users", "chat"],
    }),
    getReceivedNotes: builder.query({
      query: (userId) => `/gratitude/user/${userId}`,
      providesTags: ["users"],
    }),
    getHeroStats: builder.query({
      query: (userId) => `/gratitude/hero-stats/${userId}`,
      providesTags: ["users"],
    }),
  }),
});

export const {
  useSendGratitudeNoteMutation,
  useGetReceivedNotesQuery,
  useGetHeroStatsQuery,
} = gratitudeApi;
