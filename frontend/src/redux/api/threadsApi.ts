import { baseApi } from "./baseApi";

export const threadsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getThreads: builder.query({
      query: (params) => ({
        url: "/threads",
        params,
      }),
      providesTags: ["threads"],
    }),
    getThreadById: builder.query({
      query: (id) => `/threads/${id}`,
      providesTags: (result, error, id) => [{ type: "threads", id }],
    }),
    createThread: builder.mutation({
      query: (data) => ({
        url: "/threads",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["threads"],
    }),
    updateThread: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/threads/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => ["threads", { type: "threads", id }],
    }),
    deleteThread: builder.mutation({
      query: (id) => ({
        url: `/threads/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["threads"],
    }),
    getThreadReplies: builder.query({
      query: (threadId) => `/threads/${threadId}/replies`,
      providesTags: (result, error, threadId) => [{ type: "threads", id: `REPLIES_${threadId}` }],
    }),
    createReply: builder.mutation({
      query: ({ threadId, ...data }) => ({
        url: `/threads/${threadId}/replies`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { threadId }) => [{ type: "threads", id: `REPLIES_${threadId}` }],
    }),
  }),
});

export const {
  useGetThreadsQuery,
  useGetThreadByIdQuery,
  useCreateThreadMutation,
  useUpdateThreadMutation,
  useDeleteThreadMutation,
  useGetThreadRepliesQuery,
  useCreateReplyMutation,
} = threadsApi;
