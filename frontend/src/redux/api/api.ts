import { baseApi } from "./baseApi";

const api = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // login and register
    login: builder.mutation({
      query: (data: any) => ({ url: "/login", method: "POST", body: data }),
    }),
    portalLogin: builder.mutation({
      query: (data: { portalUser: string; portalToken: string }) => ({ url: "/portal-login", method: "POST", body: data }),
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
      invalidatesTags: ["foundItems", "mylostItems", "myFoundItems", "points"],
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
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        // Optimistically remove from found items list
        const patchFoundItems = dispatch(
          api.util.updateQueryData('getFoundItems', undefined as any, (draft: any) => {
            if (draft?.data) {
              draft.data = draft.data.filter((item: any) => item.id !== id);
            }
          })
        );
        // Optimistically remove from archived items if present
        const patchArchived = dispatch(
          api.util.updateQueryData('getArchivedFoundItems', undefined, (draft: any) => {
            if (draft?.data) {
              draft.data = draft.data.filter((item: any) => item.id !== id);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchFoundItems.undo();
          patchArchived.undo();
        }
      },
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
    trackClaim: builder.mutation({
      query: (data: { claimId: string; email: string }) => ({ url: `/claims/track`, method: "POST", body: data }),
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
      invalidatesTags: ["adminData", "claims", "auditLogs", "points"],
      async onQueryStarted({ claimId, status }, { dispatch, queryFulfilled }) {
        // Optimistically update claim status in all claims list
        const patchResult = dispatch(
          api.util.updateQueryData('getAllClaims', undefined, (draft: any) => {
            if (draft?.data) {
              const claim = draft.data.find((c: any) => c.id === claimId);
              if (claim) {
                claim.status = status;
                claim.updatedAt = new Date().toISOString();
              }
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    updateClaimStatusWithNote: builder.mutation({
      query: ({ claimId, status, note }: { claimId: string; status: string; note?: string }) => ({
        url: `/claims/${claimId}`, method: "PUT", body: { status, note },
      }),
      invalidatesTags: ["adminData", "claims", "auditLogs", "points"],
      async onQueryStarted({ claimId, status, note }, { dispatch, queryFulfilled }) {
        // Optimistically update claim status
        const patchResult = dispatch(
          api.util.updateQueryData('getAllClaims', undefined, (draft: any) => {
            if (draft?.data) {
              const claim = draft.data.find((c: any) => c.id === claimId);
              if (claim) {
                claim.status = status;
                claim.note = note;
                claim.updatedAt = new Date().toISOString();
              }
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    deleteClaim: builder.mutation({
      query: (claimId: string) => ({ url: `/claims/${claimId}`, method: "DELETE" }),
      invalidatesTags: ["adminData", "claims", "auditLogs"],
      async onQueryStarted(claimId, { dispatch, queryFulfilled }) {
        // Optimistically remove claim from list
        const patchResult = dispatch(
          api.util.updateQueryData('getAllClaims', undefined, (draft: any) => {
            if (draft?.data) {
              draft.data = draft.data.filter((c: any) => c.id !== claimId);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    // admin stats
    adminStats: builder.query({
      query: (params?: { year?: string | number }) => ({ url: `/admin/stats`, method: "GET", params }),
    }),

    // location stats (heatmap)
    getLocationStats: builder.query({
      query: (params?: { startDate?: string; endDate?: string }) => ({ url: "/admin/location-stats", method: "GET", params }),
    }),

    // audit logs
    getAuditLogs: builder.query({
      query: () => ({ url: "/admin/audit-logs", method: "GET" }),
      providesTags: ["auditLogs"],
    }),

    // phase 9 system audit logs
    getSystemAuditLogs: builder.query({
      query: () => ({ url: "/admin/system-audit-logs", method: "GET" }),
      providesTags: ["auditLogs"],
    }),

    getMatchNotifications: builder.query({
      query: () => ({ url: "/admin/match-notifications", method: "GET" }),
      providesTags: ["matchNotifications"],
    }),

    // user management
    blockUser: builder.mutation({
      query: (id: string) => ({ url: `/block/user/${id}`, method: "PUT" }),
      invalidatesTags: ["users"],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        // Optimistically update user blocked status
        const patchResult = dispatch(
          api.util.updateQueryData('getAllUsers', undefined, (draft: any) => {
            if (draft?.data) {
              const user = draft.data.find((u: any) => u.id === id);
              if (user) {
                user.isBlocked = !user.isBlocked;
              }
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    softDeleteUser: builder.mutation({
      query: (id: string) => ({ url: `/delete-user/${id}`, method: "DELETE" }),
      invalidatesTags: ["users"],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        // Optimistically remove user from list
        const patchResult = dispatch(
          api.util.updateQueryData('getAllUsers', undefined, (draft: any) => {
            if (draft?.data) {
              draft.data = draft.data.filter((u: any) => u.id !== id);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
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

    // lost item admin
    getAllLostItems: builder.query({
      query: (data: any) => ({ url: "/admin/lostItems", method: "GET", params: data }),
      providesTags: ["mylostItems"],
    }),

    // email
    sendLostItemEmail: builder.mutation({
      query: (data: any) => ({ url: "/email/lost-item", method: "POST", body: data }),
    }),
    sendClaimApprovedEmail: builder.mutation({
      query: (data: any) => ({ url: "/email/claim-approved", method: "POST", body: data }),
    }),

    // archived and stale items
    getArchivedFoundItems: builder.query({
      query: () => ({ url: "/found-items/archived", method: "GET" }),
      providesTags: ["foundItems"],
    }),
    getStaleFoundItems: builder.query({
      query: () => ({ url: "/found-items/stale", method: "GET" }),
      providesTags: ["foundItems"],
    }),
    archiveFoundItem: builder.mutation({
      query: (id: string) => ({ url: `/found-items/${id}/archive`, method: "PUT" }),
      invalidatesTags: ["foundItems"],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        // Optimistically remove from stale items
        const patchStale = dispatch(
          api.util.updateQueryData('getStaleFoundItems', undefined, (draft: any) => {
            if (draft?.data) {
              draft.data = draft.data.filter((item: any) => item.id !== id);
            }
          })
        );
        // Optimistically add to archived items
        const patchArchived = dispatch(
          api.util.updateQueryData('getArchivedFoundItems', undefined, (draft: any) => {
            const staleData = api.endpoints.getStaleFoundItems.select(undefined)(dispatch as any).data;
            const item = staleData?.data?.find((i: any) => i.id === id);
            if (item && draft?.data) {
              draft.data.unshift({ ...item, isArchived: true, archivedAt: new Date().toISOString() });
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchStale.undo();
          patchArchived.undo();
        }
      },
    }),
    restoreFoundItem: builder.mutation({
      query: (id: string) => ({ url: `/found-items/${id}/restore`, method: "PUT" }),
      invalidatesTags: ["foundItems"],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        // Optimistically remove from archived items
        const patchArchived = dispatch(
          api.util.updateQueryData('getArchivedFoundItems', undefined, (draft: any) => {
            if (draft?.data) {
              draft.data = draft.data.filter((item: any) => item.id !== id);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchArchived.undo();
        }
      },
    }),

    // AI search
    aiSearch: builder.mutation({
      query: (data: { query: string }) => ({ url: "/ai-search", method: "POST", body: data }),
    }),

    // AI Chat
    aiChat: builder.mutation({
      query: (data: { messages: { role: string; content: string }[] }) => ({ url: "/ai-chat", method: "POST", body: data }),
    }),

    // AI Recognition
    aiRecognize: builder.mutation({
      query: (data: any) => ({ url: "/ai-recognize", method: "POST", body: data }),
    }),

    // bulletin posts
    getBulletinPosts: builder.query({
      query: (params: { page?: number; limit?: number; searchTerm?: string }) => ({ url: "/bulletin-posts", method: "GET", params }),
      providesTags: ["bulletinPosts"],
    }),
    createBulletinPost: builder.mutation({
      query: (data: any) => ({ url: "/bulletin-posts", method: "POST", body: data }),
      invalidatesTags: ["bulletinPosts"],
    }),
    getBulletinTips: builder.query({
      query: (id: string) => ({ url: `/bulletin-posts/${id}/tips`, method: "GET" }),
    }),
    createBulletinTip: builder.mutation({
      query: ({ id, ...data }: { id: string; details: string; location?: string }) => ({
        url: `/bulletin-posts/${id}/tips`, method: "POST", body: data,
      }),
      invalidatesTags: ["bulletinPosts"],
    }),
    deleteBulletinPost: builder.mutation({
      query: (id: string) => ({ url: `/bulletin-posts/${id}`, method: "DELETE" }),
      invalidatesTags: ["bulletinPosts"],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        // Optimistically remove bulletin post
        const patchResult = dispatch(
          api.util.updateQueryData('getBulletinPosts', undefined as any, (draft: any) => {
            if (draft?.data) {
              draft.data = draft.data.filter((post: any) => post.id !== id);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    deleteBulletinTip: builder.mutation({
      query: ({ postId, tipId }: { postId: string; tipId: string }) => ({
        url: `/bulletin-posts/${postId}/tips/${tipId}`, method: "DELETE",
      }),
      invalidatesTags: ["bulletinPosts"],
      async onQueryStarted({ postId, tipId }, { dispatch, queryFulfilled }) {
        // Optimistically remove tip from post
        const patchResult = dispatch(
          api.util.updateQueryData('getBulletinPosts', undefined as any, (draft: any) => {
            if (draft?.data) {
              const post = draft.data.find((p: any) => p.id === postId);
              if (post?.tips) {
                post.tips = post.tips.filter((t: any) => t.id !== tipId);
              }
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    resolveBulletinPost: builder.mutation({
      query: (id: string) => ({ url: `/bulletin-posts/${id}/resolve`, method: "PUT" }),
      invalidatesTags: ["bulletinPosts"],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        // Optimistically mark post as resolved
        const patchResult = dispatch(
          api.util.updateQueryData('getBulletinPosts', undefined as any, (draft: any) => {
            if (draft?.data) {
              const post = draft.data.find((p: any) => p.id === id);
              if (post) {
                post.isResolved = true;
                post.resolvedAt = new Date().toISOString();
              }
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    // comments
    getComments: builder.query({
      query: ({ itemId, itemType }: { itemId: string; itemType: string }) => ({
        url: `/items/${itemId}/comments`,
        method: "GET",
        params: { itemType },
      }),
      providesTags: ["comments"],
    }),
    createComment: builder.mutation({
      query: ({ itemId, ...data }: any) => ({ url: `/items/${itemId}/comments`, method: "POST", body: data }),
      invalidatesTags: ["comments"],
    }),
    voteHelpful: builder.mutation({
      query: (commentId: string) => ({ url: `/comments/${commentId}/vote-helpful`, method: "POST" }),
      invalidatesTags: ["comments"],
    }),
    deleteComment: builder.mutation<void, { commentId: string; itemId: string }>({
      query: ({ commentId, itemId }) => ({
        url: `/comments/${commentId}?itemId=${itemId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["comments"],
      async onQueryStarted({ commentId, itemId }, { dispatch, queryFulfilled }) {
        // Optimistically remove comment
        const patchResult = dispatch(
          api.util.updateQueryData('getComments', { itemId, itemType: 'found' } as any, (draft: any) => {
            if (draft?.data) {
              draft.data = draft.data.filter((c: any) => c.id !== commentId);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    updateComment: builder.mutation({
      query: ({ commentId, itemId, ...data }: any) => ({
        url: `/items/${itemId}/comments/${commentId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["comments"],
    }),

    // sightings
    getSightings: builder.query({
      query: (lostItemId: string) => ({ url: `/sightings/lost-item/${lostItemId}`, method: "GET" }),
      providesTags: ["comments"],
    }),
    createSighting: builder.mutation({
      query: (data: any) => ({ url: `/sightings`, method: "POST", body: data }),
      invalidatesTags: ["comments"],
    }),
    verifySighting: builder.mutation({
      query: (sightingId: string) => ({ url: `/sightings/${sightingId}/verify`, method: "PUT" }),
      invalidatesTags: ["comments"],
    }),
    deleteSighting: builder.mutation({
      query: (sightingId: string) => ({ url: `/sightings/${sightingId}`, method: "DELETE" }),
      invalidatesTags: ["comments"],
    }),

    // points
    getMyPoints: builder.query({
      query: () => ({ url: "/points/my", method: "GET" }),
      providesTags: ["points"],
    }),
    getLeaderboard: builder.query({
      query: () => ({ url: "/points/leaderboard", method: "GET" }),
      providesTags: ["points"],
    }),

    // ── Student masterlist lookup ─────────────────────────────────────────────
    // Used by BarcodeScannerModal, FoundItemsPage, SingleFoundItem,
    // ReportFoundItem, ReportLostItem — fixes the missing export error.
    getStudentById: builder.query({
      query: (id: string) => ({ url: `/students/${id}`, method: "GET" }),
    }),
    getStudentByDetails: builder.query({
      query: ({ name, email }: { name: string; email: string }) => ({
        url: `/students/details`,
        method: "GET",
        params: { name, email },
      }),
    }),

    // Security endpoints
    getSecurityStats: builder.query({
      query: () => ({ url: "/admin/security/stats", method: "GET" }),
    }),
    getLoginLogs: builder.query({
      query: (params?: { success?: boolean; limit?: number }) => ({
        url: "/admin/security/logs", method: "GET", params,
      }),
    }),
    getAccessControl: builder.query({
      query: () => ({ url: "/admin/security/access-control", method: "GET" }),
    }),
    getPrivacyStats: builder.query({
      query: () => ({ url: "/admin/security/privacy", method: "GET" }),
    }),
    getComplianceReport: builder.query({
      query: () => ({ url: "/admin/security/compliance", method: "GET" }),
    }),
    clearOldLogs: builder.mutation({
      query: () => ({ url: "/admin/security/logs", method: "DELETE" }),
      invalidatesTags: ["loginLogs", "security"],
    }),
    exportUsers: builder.query({
      query: () => ({ url: "/admin/security/export-users", method: "GET" }),
    }),

    // student registration validation
    validateRegistration: builder.query({
      query: (schoolId: string) => ({
        url: `/students/validate-registration`,
        method: "GET",
        params: { schoolId },
      }),
    }),

    // bounties
    getActiveBounties: builder.query({
      query: () => ({ url: "/bounties/active", method: "GET" }),
      providesTags: ["bounties"] as any,
    }),
    
    // ── VIRTUE Spotlights ────────────────────────────────────────────────────────
    getVirtueSpotlights: builder.query({
      query: () => ({ url: "/virtue-spotlights", method: "GET" }),
      providesTags: ["virtueSpotlights"] as any,
    }),
    getAllVirtueSpotlights: builder.query({
      query: () => ({ url: "/virtue-spotlights/all", method: "GET" }),
      providesTags: ["virtueSpotlights"] as any,
    }),
    createVirtueSpotlight: builder.mutation({
      query: (formData: FormData) => ({
        url: "/virtue-spotlights",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["virtueSpotlights"] as any,
    }),
    updateVirtueSpotlight: builder.mutation({
      query: ({ id, formData }: { id: string; formData: FormData }) => ({
        url: `/virtue-spotlights/${id}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["virtueSpotlights"] as any,
    }),
    deleteVirtueSpotlight: builder.mutation({
      query: (id: string) => ({ url: `/virtue-spotlights/${id}`, method: "DELETE" }),
      invalidatesTags: ["virtueSpotlights"] as any,
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        // Optimistically remove spotlight
        const patchAll = dispatch(
          api.util.updateQueryData('getAllVirtueSpotlights', undefined, (draft: any) => {
            if (draft?.data) {
              draft.data = draft.data.filter((s: any) => s.id !== id);
            }
          })
        );
        const patchPublic = dispatch(
          api.util.updateQueryData('getVirtueSpotlights', undefined, (draft: any) => {
            if (draft?.data) {
              draft.data = draft.data.filter((s: any) => s.id !== id);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchAll.undo();
          patchPublic.undo();
        }
      },
    }),
    aiWriteVirtueSpotlight: builder.mutation({
      query: (bulletPoints: string) => ({
        url: "/virtue-spotlights/ai-write",
        method: "POST",
        body: { bulletPoints },
      }),
    }),
  }),
});

export const {
  useGetAllLostItemsQuery,
  useGetLostItemsQuery,
  useLoginMutation,
  usePortalLoginMutation,
  useRegistersMutation,
  useCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useCreateLostItemMutation,
  useGetSingleLostItemQuery,
  useLazyGetSingleLostItemQuery,
  useCreateFoundItemMutation,
  useGetFoundItemsQuery,
  useGetSingleFoundItemQuery,
  useChangePasswordMutation,
  useChangeEmailMutation,
  useChangeUsernameMutation,
  useCreateClaimMutation,
  useTrackClaimMutation,
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
  useGetSystemAuditLogsQuery,
  useBlockUserMutation,
  useSoftDeleteUserMutation,
  useGetAllUsersQuery,
  useGetAllClaimsQuery,
  useUpdateClaimStatusMutation,
  useUpdateClaimStatusWithNoteMutation,
  useDeleteClaimMutation,
  useUploadItemImagesMutation,
  useMarkLostItemAsFoundMutation,
  useGetTestimonialsQuery,
  useCreateTestimonialMutation,
  useGetServicesQuery,
  useCreateServiceMutation,
  useGetFaqsQuery,
  useCreateFaqMutation,
  useAiSearchMutation,
  useAiChatMutation,
  useAiRecognizeMutation,
  useSendLostItemEmailMutation,
  useSendClaimApprovedEmailMutation,
  useGetArchivedFoundItemsQuery,
  useGetStaleFoundItemsQuery,
  useArchiveFoundItemMutation,
  useRestoreFoundItemMutation,
  useGetBulletinPostsQuery,
  useCreateBulletinPostMutation,
  useGetBulletinTipsQuery,
  useCreateBulletinTipMutation,
  useDeleteBulletinPostMutation,
  useDeleteBulletinTipMutation,
  useResolveBulletinPostMutation,
  useGetMatchNotificationsQuery,
  useGetCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useVoteHelpfulMutation,
  useDeleteCommentMutation,
  useGetMyPointsQuery,
  useGetLeaderboardQuery,
  // sightings
  useGetSightingsQuery,
  useCreateSightingMutation,
  useVerifySightingMutation,
  useDeleteSightingMutation,
  // ── student masterlist ──
  useGetStudentByIdQuery,
  useLazyGetStudentByIdQuery,
  useLazyGetStudentByDetailsQuery,
  useGetSecurityStatsQuery,
  useGetLoginLogsQuery,
  useGetAccessControlQuery,
  useGetPrivacyStatsQuery,
  useGetComplianceReportQuery,
  useClearOldLogsMutation,
  useLazyExportUsersQuery,
  useGetActiveBountiesQuery,
  useGetVirtueSpotlightsQuery,
  useGetAllVirtueSpotlightsQuery,
  useCreateVirtueSpotlightMutation,
  useUpdateVirtueSpotlightMutation,
  useDeleteVirtueSpotlightMutation,
  useAiWriteVirtueSpotlightMutation,
} = api;