// Feature: bulletin-board
// Frontend property tests for BulletinBoard card rendering.
// Run with: npx vitest run

import * as fc from "fast-check";
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { BulletinPost, BulletinTip } from "../../../types/types";

// ---------------------------------------------------------------------------
// Mock all RTK Query hooks — we test pure rendering, not data fetching
// ---------------------------------------------------------------------------
vi.mock("../../../redux/api/api", () => ({
  useGetBulletinPostsQuery:       vi.fn(),
  useCreateBulletinPostMutation:  vi.fn(() => [vi.fn(), { isLoading: false }]),
  useGetBulletinTipsQuery:        vi.fn(),
  useCreateBulletinTipMutation:   vi.fn(() => [vi.fn(), { isLoading: false }]),
  useDeleteBulletinPostMutation:  vi.fn(() => [vi.fn()]),
  useDeleteBulletinTipMutation:   vi.fn(() => [vi.fn()]),
  useResolveBulletinPostMutation: vi.fn(() => [vi.fn()]),
}));

vi.mock("../../../auth/auth", () => ({
  useUserVerification: vi.fn(() => null),
  getUserLocalStorage: vi.fn(() => null),
}));

vi.mock("react-toastify", () => ({
  toast:          { success: vi.fn(), error: vi.fn() },
  ToastContainer: () => null,
}));

import {
  useGetBulletinPostsQuery,
  useGetBulletinTipsQuery,
} from "../../../redux/api/api";
import { useUserVerification } from "../../../auth/auth";
import BulletinBoard from "../BulletinBoard";

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------
const nonEmptyStr = (min = 1, max = 60) =>
  fc.string({ minLength: min, maxLength: max }).filter((s) => s.trim().length > 0);

// Safe date string — constrained range avoids JS Date boundary crashes
const safeDateStr = () =>
  fc.date({
    min: new Date("2000-01-01T00:00:00.000Z"),
    max: new Date("2025-12-31T23:59:59.000Z"),
  }).map((d) => d.toISOString());

const bulletinPostArb: fc.Arbitrary<BulletinPost> = fc.record({
  id:           fc.uuid(),
  itemName:     nonEmptyStr(1, 60),
  description:  fc.string({ minLength: 10, maxLength: 200 }),
  location:     nonEmptyStr(1, 60),
  dateLost:     safeDateStr(),
  imageUrl:     fc.constantFrom("", "https://example.com/img.jpg"),
  reporterName: fc.oneof(fc.constant(""), nonEmptyStr(1, 40)),
  contactHint:  fc.constant(""),
  isResolved:   fc.constant(false),
  createdAt:    safeDateStr(),
  _count:       fc.record({ tips: fc.nat({ max: 99 }) }),
});

const resolvedPostArb: fc.Arbitrary<BulletinPost> = bulletinPostArb.map((p) => ({
  ...p,
  isResolved: true,
}));

const bulletinTipArb: fc.Arbitrary<BulletinTip> = fc.record({
  id:             fc.uuid(),
  bulletinPostId: fc.uuid(),
  location:       fc.oneof(fc.constant(""), nonEmptyStr(1, 40)),
  details:        fc.string({ minLength: 10, maxLength: 200 }).filter(
    (s) => s.trim().length > 0
  ),
  createdAt:      safeDateStr(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const mockPosts = (posts: BulletinPost[]) => {
  (useGetBulletinPostsQuery as ReturnType<typeof vi.fn>).mockReturnValue({
    data: {
      data: posts,
      meta: { total: posts.length, page: 1, totalPage: 1, limit: 12 },
    },
    isLoading:  false,
    isFetching: false,
  });
};

const setAdmin = (isAdmin: boolean) => {
  (useUserVerification as ReturnType<typeof vi.fn>).mockReturnValue(
    isAdmin ? { role: "ADMIN", id: "admin-1" } : null
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  setAdmin(false);
  (useGetBulletinTipsQuery as ReturnType<typeof vi.fn>).mockReturnValue({
    data: { data: [] },
    isLoading: false,
  });
});

// ---------------------------------------------------------------------------
// Property 7: Card rendering completeness
// Feature: bulletin-board, Property 7: rendered card contains all required fields
// ---------------------------------------------------------------------------
describe("Property 7: Card rendering completeness", () => {
  it("renders item name, location, tip count, and Community Post badge for any valid post", async () => {
    await fc.assert(
      fc.asyncProperty(bulletinPostArb, async (post) => {
        mockPosts([post]);

        const { unmount } = render(<BulletinBoard />);

        // Item name must appear
        const nameEls = screen.getAllByText(new RegExp(post.itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i"));
        expect(nameEls.length).toBeGreaterThan(0);

        // Location must appear somewhere in the document
        const locEls = screen.getAllByText(new RegExp(post.location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i"));
        expect(locEls.length).toBeGreaterThan(0);

        // Tip count badge — matches "X tip" or "X tips"
        const tipCount = post._count?.tips ?? 0;
        const tipEls = screen.getAllByText(new RegExp(`${tipCount}\\s*tip`, "i"));
        expect(tipEls.length).toBeGreaterThan(0);

        // "Community Post" badge always present
        const badgeEls = screen.getAllByText(/community post/i);
        expect(badgeEls.length).toBeGreaterThan(0);

        // Reporter name shown only when non-empty and has visible characters
        const trimmedName = post.reporterName.trim();
        if (trimmedName) {
          const escaped = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const nameMatch = screen.getAllByText(new RegExp(escaped, "i"));
          expect(nameMatch.length).toBeGreaterThan(0);
        }

        unmount();
      }),
      { numRuns: 25 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9: Resolved post shows badge and disables tip button
// Feature: bulletin-board, Property 9: isResolved=true → badge shown, button disabled
// ---------------------------------------------------------------------------
describe("Property 9: Resolved post shows badge and disables tip button", () => {
  it("displays Resolved badge and the I Saw This button is disabled", async () => {
    await fc.assert(
      fc.asyncProperty(resolvedPostArb, async (post) => {
        mockPosts([post]);

        const { unmount } = render(<BulletinBoard />);

        // Resolved badge must be present
        const resolvedEls = screen.getAllByText(/resolved/i);
        expect(resolvedEls.length).toBeGreaterThan(0);

        // "I Saw This" button must be disabled
        const sawBtns = screen.getAllByRole("button", { name: /i saw this/i });
        expect(sawBtns.length).toBeGreaterThan(0);
        sawBtns.forEach((btn) => expect(btn).toBeDisabled());

        unmount();
      }),
      { numRuns: 20 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 14: Tips display content
// Feature: bulletin-board, Property 14: tip card shows details and relative time
// ---------------------------------------------------------------------------
describe("Property 14: Tips display content", () => {
  it("tip card contains details text and a relative-time string after opening modal", async () => {
    await fc.assert(
      fc.asyncProperty(
        bulletinPostArb,
        fc.array(bulletinTipArb, { minLength: 1, maxLength: 2 }),
        async (post, tips) => {
          const linkedTips = tips.map((t) => ({
            ...t,
            bulletinPostId: post.id,
            createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          }));

          mockPosts([post]);
          (useGetBulletinTipsQuery as ReturnType<typeof vi.fn>).mockReturnValue({
            data: { data: linkedTips },
            isLoading: false,
          });

          const { unmount } = render(<BulletinBoard />);

          // Click the tip count button to open TipsViewerModal
          const tipBtns = screen.getAllByText(
            new RegExp(`${post._count?.tips ?? 0}\\s*tip`, "i")
          );
          await act(async () => { tipBtns[0].click(); });

          // Each tip's details should now be visible
          for (const tip of linkedTips) {
            const tipEls = screen.getAllByText(tip.details.trim());
            expect(tipEls.length).toBeGreaterThan(0);
          }

          // At least one relative-time string should appear
          expect(
            /just now|\d+m ago|\d+h ago|\d+d ago/i.test(document.body.textContent ?? "")
          ).toBe(true);

          unmount();
        }
      ),
      { numRuns: 8 }  // reduced — each run does render+click+assert, keep under timeout
    );
  }, 30000); // 30s timeout for this property
});

// ---------------------------------------------------------------------------
// Property 16: Admin controls visibility
// Feature: bulletin-board, Property 16: delete button present iff isAdmin=true
// ---------------------------------------------------------------------------
describe("Property 16: Admin controls visibility", () => {
  it("shows delete button only for admin users", async () => {
    await fc.assert(
      fc.asyncProperty(bulletinPostArb, fc.boolean(), async (post, isAdmin) => {
        setAdmin(isAdmin);
        mockPosts([post]);

        const { unmount } = render(<BulletinBoard />);

        const deleteBtns = document.querySelectorAll('[title="Delete Post"]');

        if (isAdmin) {
          expect(deleteBtns.length).toBeGreaterThan(0);
        } else {
          expect(deleteBtns.length).toBe(0);
        }

        unmount();
      }),
      { numRuns: 25 }
    );
  });
});

// ---------------------------------------------------------------------------
// Empty state tests
// ---------------------------------------------------------------------------
describe("Empty state", () => {
  it("shows no-posts message when the list is empty", () => {
    mockPosts([]);
    render(<BulletinBoard />);
    // "No posts yet" appears in both the stats bar and the empty-state heading
    const matches = screen.getAllByText(/no posts yet/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});