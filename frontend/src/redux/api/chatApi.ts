import { baseApi } from "./baseApi";

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyChatRooms: builder.query({
      query: () => "/chat/rooms",
      providesTags: ["chat"],
    }),
    getChatMessages: builder.query({
      query: (roomId) => `/chat/messages/${roomId}`,
      providesTags: (result, error, roomId) => [{ type: "chat", id: roomId }],
    }),
    initiateChat: builder.mutation({
      query: (data) => ({
        url: "/chat/initiate",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["chat"],
    }),
    markAsRead: builder.mutation({
      query: (roomId) => ({
        url: `/chat/mark-as-read/${roomId}`,
        method: "PATCH",
      }),
      invalidatesTags: ["chat"],
    }),
  }),
});

export const {
  useGetMyChatRoomsQuery,
  useGetChatMessagesQuery,
  useInitiateChatMutation,
  useMarkAsReadMutation,
} = chatApi;
