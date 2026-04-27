import { baseApi } from "./baseApi";

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAnalyticsMetrics: builder.query({
      query: (params) => ({
        url: "/analytics/metrics",
        params,
      }),
      providesTags: ["analytics"],
    }),
    getAnalyticsTrends: builder.query({
      query: (params) => ({
        url: "/analytics/trends",
        params,
      }),
      providesTags: ["analytics"],
    }),
    getGeographicData: builder.query({
      query: (dateRange) => `/analytics/geographic?dateRange=${dateRange}`,
      providesTags: ["analytics"],
    }),
    getAnalyticsStats: builder.query({
      query: () => "/analytics/stats",
      providesTags: ["analytics"],
    }),
    createAnalyticsExport: builder.mutation({
      query: (data) => ({
        url: "/analytics/exports",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["analytics"],
    }),
    getAnalyticsExports: builder.query({
      query: (params) => ({
        url: "/analytics/exports",
        params,
      }),
      providesTags: ["analytics"],
    }),
  }),
});

export const {
  useGetAnalyticsMetricsQuery,
  useGetAnalyticsTrendsQuery,
  useGetGeographicDataQuery,
  useGetAnalyticsStatsQuery,
  useCreateAnalyticsExportMutation,
  useGetAnalyticsExportsQuery,
} = analyticsApi;
