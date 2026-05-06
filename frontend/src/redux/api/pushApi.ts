import { baseApi } from "./baseApi";

export const pushApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVapidPublicKey: builder.query({
      query: () => "/notifications/key",
    }),
    subscribeToPush: builder.mutation({
      query: (subscription) => ({
        url: "/notifications/subscribe",
        method: "POST",
        body: subscription,
      }),
      invalidatesTags: ["push"],
    }),
  }),
});

export const {
  useGetVapidPublicKeyQuery,
  useSubscribeToPushMutation,
} = pushApi;
