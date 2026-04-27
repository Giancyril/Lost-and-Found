import { baseApi } from "./baseApi";

export const reputationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserReputation: builder.query({
      query: (userId) => `/reputation/user/${userId}`,
      providesTags: (result, error, userId) => [{ type: "reputation", id: userId }],
    }),
    getReputationHistory: builder.query({
      query: ({ userId, page, limit }) => ({
        url: `/reputation/user/${userId}/history`,
        params: { page, limit },
      }),
      providesTags: (result, error, { userId }) => [{ type: "reputation", id: `HISTORY_${userId}` }],
    }),
    getUserBadges: builder.query({
      query: (userId) => `/reputation/user/${userId}/badges`,
      providesTags: (result, error, userId) => [{ type: "reputation", id: `BADGES_${userId}` }],
    }),
    getReputationRanking: builder.query({
      query: (params) => ({
        url: "/reputation/ranking",
        params,
      }),
      providesTags: ["reputation"],
    }),
    getLeaderboard: builder.query({
      query: (period) => `/reputation/leaderboard?period=${period}`,
      providesTags: ["reputation"],
    }),
    getTrustLevelRequirements: builder.query({
      query: () => "/reputation/trust-levels",
      providesTags: ["reputation"],
    }),
    // Admin only
    awardBadge: builder.mutation({
      query: ({ userId, badgeId, ...data }) => ({
        url: `/reputation/badges-management/award/${userId}/${badgeId}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { userId }) => ["reputation", { type: "reputation", id: `BADGES_${userId}` }],
    }),
  }),
});

export const {
  useGetUserReputationQuery,
  useGetReputationHistoryQuery,
  useGetUserBadgesQuery,
  useGetReputationRankingQuery,
  useGetLeaderboardQuery,
  useGetTrustLevelRequirementsQuery,
  useAwardBadgeMutation,
} = reputationApi;
