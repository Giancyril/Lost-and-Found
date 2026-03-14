import { baseApi } from "./baseApi";

const api = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // login and register
    login: builder.mutation({
      query: (data: any) => ({ url: "/login", method: "POST", body: data }),
    }),
    registers: builder.mutation({
      query: (data: any) => ({ url: "/register", method: "POST", body: data }),
    }),

    // item category
    category: builder.query({
      query: () => ({ url: "/item-categories", method: "GET" }),
      providesTags: ["categories"],
    }),
    createCategory: builder.mutation({
      query: (data: any) => ({ url: "/item-categories", method: "POST", body: data }),
      invalidatesTags: ["categories"],
    }),
    updateCategory: builder.mutation({
      query: ({ id, data }: { id: string; data: any }) => ({ url: `/item-categories/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["categories"],
    }),
    deleteCategory: builder.mutation({
      query: (id: string) => ({ url: `/item-categories/${id}`, method: "DELETE" }),
      invalidatesTags: ["categories"],
    }),

    // lost item
    getLostItems: builder.query({
      query: (data: any) => ({ url: "/lostItem", method: "GET", params: data }),
      providesTags: ["mylostItems"],
    }),
    createLostItem: builder.mutation({
      query: (data: any) => ({ url: "/lostItem", method: "POST", body: data }),
      invalidatesTags: ["mylostItems"],
    }),
    getSingleLostItem: builder.query({
      query: (id: string) => ({ url: `/lostItem/${id}`, method: "GET" }),
    }),
    getMyLostItem: builder.query({
      query: () => ({ url: `/my/lostItem`, method: "GET" }),
      providesTags: ["mylostItems"],
    }),
    editMyLostItem: builder.mutation({
      query: (data: any) => ({ url: `/my/lostItem`, method: "PUT", body: data }),
      invalidatesTags: ["mylostItems"],
    }),
    deleteMyLostItem: builder.mutation({
      query: (id: string) => ({ url: `/my/lostItem/${id}`, method: "DELETE" }),
      invalidatesTags: ["mylostItems"],
    }),

    // found item
    getMyFoundItem: builder.query({
      query: () => ({ url: `/my/foundItem`, method: "GET" }),
      providesTags: ["myFoundItems", "foundItems"],
    }),
    createFoundItem: builder.mutation({
      query: (data: any) => ({ url: `/found-items/public`, method: "POST", body: data }),
      invalidatesTags: ["foundItems", "mylostItems"],
    }),
    getFoundItems: builder.query({
      query: (data: any) => ({ url: "/found-items", method: "GET", params: data }),
      providesTags: ["foundItems"],
    }),
    getSingleFoundItem: builder.query({
      query: (id: string) => ({ url: `/found-item/${id}`, method: "GET" }),
    }),
    editMyFoundItem: builder.mutation({
      query: (data: any) => ({ url: `/my/foundItem`, method: "PUT", body: data }),
      invalidatesTags: ["myFoundItems", "foundItems"],
    }),
    deleteMyFoundItem: builder.mutation({
      query: (id: string) => ({ url: `/my/foundItem/${id}`, method: "DELETE" }),
      invalidatesTags: ["myFoundItems", "foundItems"],
    }),

    // profile
    changePassword: builder.mutation({
      query: (data: any) => ({ url: `/change-password`, method: "POST", body: data }),
    }),
    changeEmail: builder.mutation({
      query: (data: any) => ({ url: `/change-email`, method: "POST", body: data }),
    }),
    changeUsername: builder.mutation({
      query: (data: any) => ({ url: `/change-username`, method: "POST", body: data }),
    }),

    // claims
    createClaim: builder.mutation({
      query: (data: any) => ({ url: `/claims`, method: "POST", body: data }),
      invalidatesTags: ["adminData"],
    }),
    myClaims: builder.query({
      query: () => ({ url: `/my/claims`, method: "GET" }),
      providesTags: ["claims"],
    }),
    getClaimById: builder.query({
      query: (id: string) => ({ url: `/claims/${id}`, method: "GET" }),
      providesTags: ["claims"],
    }),
    getAllClaims: builder.query({
      query: () => ({ url: "/claims", method: "GET" }),
      providesTags: ["adminData"],
    }),
    updateClaimStatus: builder.mutation({
      query: ({ claimId, ...data }: any) => ({ url: `/claims/${claimId}`, method: "PUT", body: data }),
      invalidatesTags: ["adminData", "claims", "auditLogs"],
    }),
    updateClaimStatusWithNote: builder.mutation({
      query: ({ claimId, status, note }: { claimId: string; status: string; note?: string }) => ({
        url: `/claims/${claimId}`, method: "PUT", body: { status, note },
      }),
      invalidatesTags: ["adminData", "claims", "auditLogs"],
    }),

    // admin stats
    adminStats: builder.query({
      query: () => ({ url: `/admin/stats`, method: "GET" }),
    }),

    // location stats (heatmap)
    getLocationStats: builder.query({
      query: () => ({ url: "/admin/location-stats", method: "GET" }),
    }),

    // audit logs
    getAuditLogs: builder.query({
      query: () => ({ url: "/admin/audit-logs", method: "GET" }),
      providesTags: ["auditLogs"],
    }),

    // user management
    blockUser: builder.mutation({
      query: (id: string) => ({ url: `/block/user/${id}`, method: "PUT" }),
      invalidatesTags: ["users"],
    }),
    changeUserRole: builder.mutation({
      query: ({ id, role }: { id: string; role: string }) => ({ url: `/change-role/${id}`, method: "PUT", body: { role } }),
      invalidatesTags: ["users"],
    }),
    softDeleteUser: builder.mutation({
      query: (id: string) => ({ url: `/delete-user/${id}`, method: "DELETE" }),
      invalidatesTags: ["users"],
    }),
    getAllUsers: builder.query({
      query: () => ({ url: "/users", method: "GET" }),
      providesTags: ["users"],
    }),

    // uploads
    uploadItemImages: builder.mutation({
      query: ({ id, type, formData }: { id: string; type: "lost" | "found"; formData: FormData }) => ({
        url: `/${type === "lost" ? "lostItem" : "found-items"}/${id}/images`, method: "POST", body: formData,
      }),
      invalidatesTags: ["mylostItems", "foundItems"],
    }),
    markLostItemAsFound: builder.mutation({
      query: (data: any) => ({ url: "/found-lost", method: "PUT", body: data }),
      invalidatesTags: ["mylostItems", "foundItems"],
    }),

    // testimonials
    getTestimonials: builder.query({
      query: () => ({ url: "/testimonials", method: "GET" }),
      providesTags: ["testimonials"],
    }),
    createTestimonial: builder.mutation({
      query: (data: any) => ({ url: "/testimonials", method: "POST", body: data }),
      invalidatesTags: ["testimonials"],
    }),

    // services
    getServices: builder.query({
      query: () => ({ url: "/services", method: "GET" }),
      providesTags: ["services"],
    }),
    createService: builder.mutation({
      query: (data: any) => ({ url: "/services", method: "POST", body: data }),
      invalidatesTags: ["services"],
    }),

    // faqs
    getFaqs: builder.query({
      query: () => ({ url: "/faqs", method: "GET" }),
      providesTags: ["faqs"],
    }),
    createFaq: builder.mutation({
      query: (data: any) => ({ url: "/faqs", method: "POST", body: data }),
      invalidatesTags: ["faqs"],
    }),

    // lost item — add after getLostItems
getAllLostItems: builder.query({
  query: (data: any) => ({ url: "/admin/lostItems", method: "GET", params: data }),
  providesTags: ["mylostItems"],
}),

    

    // AI search
    aiSearch: builder.mutation({
      query: (data: { query: string }) => ({ url: "/ai-search", method: "POST", body: data }),
    }),
  }),
});

export const {
  useGetAllLostItemsQuery,
  useGetLostItemsQuery,
  useLoginMutation,
  useRegistersMutation,
  useCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useCreateLostItemMutation,
  useGetSingleLostItemQuery,
  useCreateFoundItemMutation,
  useGetFoundItemsQuery,
  useGetSingleFoundItemQuery,
  useChangePasswordMutation,
  useChangeEmailMutation,
  useChangeUsernameMutation,
  useCreateClaimMutation,
  useMyClaimsQuery,
  useGetClaimByIdQuery,
  useGetMyLostItemQuery,
  useEditMyLostItemMutation,
  useDeleteMyLostItemMutation,
  useGetMyFoundItemQuery,
  useDeleteMyFoundItemMutation,
  useEditMyFoundItemMutation,
  useAdminStatsQuery,
  useGetLocationStatsQuery,
  useGetAuditLogsQuery,
  useBlockUserMutation,
  useChangeUserRoleMutation,
  useSoftDeleteUserMutation,
  useGetAllUsersQuery,
  useGetAllClaimsQuery,
  useUpdateClaimStatusMutation,
  useUpdateClaimStatusWithNoteMutation,
  useUploadItemImagesMutation,
  useMarkLostItemAsFoundMutation,
  useGetTestimonialsQuery,
  useCreateTestimonialMutation,
  useGetServicesQuery,
  useCreateServiceMutation,
  useGetFaqsQuery,
  useCreateFaqMutation,
  useAiSearchMutation,
} = api;