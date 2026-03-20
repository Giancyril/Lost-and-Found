// Feature: bulletin-board
// Property tests for bulletinPost service and rate-limit middleware.
// Run with: npx jest --testPathPattern=bulletinPost.property

import * as fc from "fast-check";
import { bulletinPostService } from "../bulletinPost.service";
import { createPostSchema, createTipSchema } from "../bulletinPost.validate";

jest.mock("../../../config/prisma", () => {
  let posts: any[] = [];
  let tips:  any[] = [];
  let idSeq = 0;
  const nextId = () => `id-${++idSeq}`;
  const resetStore = () => { posts = []; tips = []; idSeq = 0; };

  const prisma = {
    __resetStore: resetStore,
    bulletinPost: {
      create: jest.fn(async ({ data }: any) => {
        const post = { id: nextId(), ...data, createdAt: new Date(), updatedAt: new Date(), isResolved: false, isDeleted: false, deletedAt: null };
        posts.push(post);
        return post;
      }),
      findMany: jest.fn(async ({ where, skip = 0, take = 12 }: any) => {
        let result = posts.filter((p) => {
          if (p.isDeleted) return false;
          if (where?.OR) {
            const term = where.OR[0]?.itemName?.contains?.toLowerCase() ?? "";
            return p.itemName?.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term) || p.location?.toLowerCase().includes(term);
          }
          return true;
        });
        result = result.sort((a: any, b: any) => b.createdAt - a.createdAt);
        return result.slice(skip, skip + take).map((p: any) => ({ ...p, _count: { tips: tips.filter((t: any) => t.bulletinPostId === p.id).length } }));
      }),
      count: jest.fn(async ({ where }: any) => {
        return posts.filter((p) => {
          if (p.isDeleted) return false;
          if (where?.OR) {
            const term = where.OR[0]?.itemName?.contains?.toLowerCase() ?? "";
            return p.itemName?.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term) || p.location?.toLowerCase().includes(term);
          }
          return true;
        }).length;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const idx = posts.findIndex((p) => p.id === where.id);
        if (idx === -1) throw new Error("Not found");
        posts[idx] = { ...posts[idx], ...data };
        return posts[idx];
      }),
    },
    bulletinTip: {
      create: jest.fn(async ({ data }: any) => {
        const tip = { id: nextId(), ...data, createdAt: new Date() };
        tips.push(tip);
        return tip;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        return tips.filter((t: any) => t.bulletinPostId === where.bulletinPostId).sort((a: any, b: any) => b.createdAt - a.createdAt);
      }),
      delete: jest.fn(async ({ where }: any) => {
        const idx = tips.findIndex((t: any) => t.id === where.id);
        if (idx === -1) throw new Error("Not found");
        const [deleted] = tips.splice(idx, 1);
        return deleted;
      }),
    },
  };
  return { __esModule: true, default: prisma };
});

const getMockPrisma = () => require("../../../config/prisma").default;

beforeEach(() => { getMockPrisma().__resetStore(); jest.clearAllMocks(); });

const nonBlankString = (min = 1, max = 100) => fc.string({ minLength: min, maxLength: max }).filter((s) => s.trim().length > 0);
const pastDateStr = () => fc.date({ max: new Date() }).map((d) => d.toISOString());
const validPostArb = fc.record({ itemName: nonBlankString(1, 100), description: fc.string({ minLength: 10, maxLength: 500 }), location: nonBlankString(1, 100), dateLost: pastDateStr() });
const validTipDetailsArb = fc.string({ minLength: 10, maxLength: 500 });

describe("Property 1: Post creation round-trip", () => {
  it("created post has non-null id/createdAt; getPosts returns matching record", async () => {
    await fc.assert(fc.asyncProperty(validPostArb, async (payload) => {
      getMockPrisma().__resetStore(); jest.clearAllMocks();
      const created = await bulletinPostService.createPost(payload);
      expect(created.id).toBeTruthy();
      expect(created.createdAt).toBeTruthy();
      expect(created.itemName).toBe(payload.itemName.trim());
      const { data } = await bulletinPostService.getPosts({ page: 1, limit: 50 });
      const found = (data as any[]).find((p) => p.id === created.id);
      expect(found).toBeDefined();
      expect(found.description).toBe(payload.description);
      expect(found.location).toBe(payload.location);
    }), { numRuns: 50 });
  });
});

describe("Property 2: Whitespace item name rejection", () => {
  it("rejects item names composed entirely of whitespace", async () => {
    await fc.assert(fc.asyncProperty(
      fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.length > 0 && s.trim().length === 0),
      async (whitespace) => {
        const result = createPostSchema.safeParse({ body: { itemName: whitespace, description: "This is a valid description", location: "Room 101", dateLost: new Date(Date.now() - 86400000).toISOString() } });
        expect(result.success).toBe(false);
      }
    ), { numRuns: 50 });
  });
});

describe("Property 3: Short description rejection", () => {
  it("rejects descriptions shorter than 10 characters", async () => {
    await fc.assert(fc.asyncProperty(fc.string({ minLength: 0, maxLength: 9 }), async (shortDesc) => {
      const result = createPostSchema.safeParse({ body: { itemName: "Valid Item", description: shortDesc, location: "Room 101", dateLost: new Date(Date.now() - 86400000).toISOString() } });
      expect(result.success).toBe(false);
    }), { numRuns: 50 });
  });
});

describe("Property 4: Future date rejection", () => {
  it("rejects dateLost values set in the future", async () => {
    await fc.assert(fc.asyncProperty(fc.date({ min: new Date(Date.now() + 60_000) }), async (futureDate) => {
      const result = createPostSchema.safeParse({ body: { itemName: "Valid Item", description: "This is a valid description", location: "Room 101", dateLost: futureDate.toISOString() } });
      expect(result.success).toBe(false);
    }), { numRuns: 50 });
  });
});

describe("Property 8: Pagination page size", () => {
  it("returns at most `limit` posts and includes meta fields", async () => {
    for (const p of Array.from({ length: 20 }, (_, i) => ({ itemName: `Item ${i}`, description: "A valid description here", location: "Room 101", dateLost: new Date(Date.now() - 86400000).toISOString() }))) {
      await bulletinPostService.createPost(p);
    }
    await fc.assert(fc.asyncProperty(fc.integer({ min: 1, max: 50 }), async (limit) => {
      const result = await bulletinPostService.getPosts({ page: 1, limit });
      expect(result.data.length).toBeLessThanOrEqual(limit);
      expect(result.meta).toHaveProperty("total");
      expect(result.meta).toHaveProperty("page");
      expect(result.meta).toHaveProperty("totalPage");
    }), { numRuns: 30 });
  });
});

describe("Property 10: Search filtering correctness", () => {
  it("every returned post contains the search term in name, description, or location", async () => {
    for (const s of [
      { itemName: "Blue Backpack", description: "Left near the library entrance", location: "Library" },
      { itemName: "Red Umbrella",  description: "Forgotten in classroom 204",    location: "Room 204" },
      { itemName: "Black Wallet",  description: "Dropped near the canteen",      location: "Canteen" },
    ]) { await bulletinPostService.createPost({ ...s, dateLost: new Date(Date.now() - 86400000).toISOString() }); }
    await fc.assert(fc.asyncProperty(fc.constantFrom("Library", "Canteen", "Room", "Blue", "Wallet", "Umbrella"), async (searchTerm) => {
      const result = await bulletinPostService.getPosts({ page: 1, limit: 50, searchTerm });
      for (const post of result.data as any[]) {
        const lower = searchTerm.toLowerCase();
        expect(post.itemName.toLowerCase().includes(lower) || post.description.toLowerCase().includes(lower) || post.location.toLowerCase().includes(lower)).toBe(true);
      }
    }), { numRuns: 30 });
  });
});

describe("Property 11: Tip submission round-trip with count increment", () => {
  it("tip appears in getTips and post tip count increments by exactly 1", async () => {
    await fc.assert(fc.asyncProperty(validTipDetailsArb, async (details) => {
      getMockPrisma().__resetStore(); jest.clearAllMocks();
      const post = await bulletinPostService.createPost({ itemName: "Test Item", description: "A valid description here", location: "Room 101", dateLost: new Date(Date.now() - 86400000).toISOString() });
      const { data: before } = await bulletinPostService.getPosts({ page: 1, limit: 50 });
      const countBefore = (before as any[]).find((p) => p.id === post.id)?._count?.tips ?? 0;
      await bulletinPostService.createTip(post.id, { details });
      const tips = await bulletinPostService.getTips(post.id);
      expect((tips as any[]).some((t) => t.details === details)).toBe(true);
      const { data: after } = await bulletinPostService.getPosts({ page: 1, limit: 50 });
      const countAfter = (after as any[]).find((p) => p.id === post.id)?._count?.tips ?? 0;
      expect(countAfter).toBe(countBefore + 1);
    }), { numRuns: 30 });
  });
});

describe("Property 12: Short tip details rejection", () => {
  it("rejects tip details shorter than 10 characters", async () => {
    await fc.assert(fc.asyncProperty(fc.string({ minLength: 0, maxLength: 9 }), async (shortDetails) => {
      const result = createTipSchema.safeParse({ body: { details: shortDetails } });
      expect(result.success).toBe(false);
    }), { numRuns: 50 });
  });
});

describe("Property 15: Tips reverse-chronological order", () => {
  it("returns tips with createdAt descending", async () => {
    await fc.assert(fc.asyncProperty(fc.integer({ min: 2, max: 8 }), async (tipCount) => {
      getMockPrisma().__resetStore(); jest.clearAllMocks();
      const post = await bulletinPostService.createPost({ itemName: "Order Test Item", description: "A valid description here", location: "Room 101", dateLost: new Date(Date.now() - 86400000).toISOString() });
      for (let i = 0; i < tipCount; i++) { await bulletinPostService.createTip(post.id, { details: `Tip number ${i} with enough text` }); }
      const tips = await bulletinPostService.getTips(post.id) as any[];
      expect(tips.length).toBe(tipCount);
      for (let i = 0; i < tips.length - 1; i++) {
        expect(new Date(tips[i].createdAt).getTime()).toBeGreaterThanOrEqual(new Date(tips[i + 1].createdAt).getTime());
      }
    }), { numRuns: 30 });
  });
});

describe("Property 17: Post soft-delete removes from public list", () => {
  it("deleted post no longer appears in getPosts results", async () => {
    await fc.assert(fc.asyncProperty(validPostArb, async (payload) => {
      getMockPrisma().__resetStore(); jest.clearAllMocks();
      const post = await bulletinPostService.createPost(payload);
      await bulletinPostService.deletePost(post.id);
      const { data } = await bulletinPostService.getPosts({ page: 1, limit: 50 });
      expect((data as any[]).find((p) => p.id === post.id)).toBeUndefined();
    }), { numRuns: 30 });
  });
});

describe("Property 18: Tip deletion decrements count", () => {
  it("tip is absent from getTips and post tip count decreases by 1", async () => {
    await fc.assert(fc.asyncProperty(validTipDetailsArb, async (details) => {
      getMockPrisma().__resetStore(); jest.clearAllMocks();
      const post = await bulletinPostService.createPost({ itemName: "Deletion Test", description: "A valid description here", location: "Room 101", dateLost: new Date(Date.now() - 86400000).toISOString() });
      const tip = await bulletinPostService.createTip(post.id, { details }) as any;
      const { data: before } = await bulletinPostService.getPosts({ page: 1, limit: 50 });
      const countBefore = (before as any[]).find((p) => p.id === post.id)?._count?.tips ?? 0;
      await bulletinPostService.deleteTip(tip.id);
      const tipsAfter = await bulletinPostService.getTips(post.id) as any[];
      expect(tipsAfter.find((t) => t.id === tip.id)).toBeUndefined();
      const { data: after } = await bulletinPostService.getPosts({ page: 1, limit: 50 });
      const countAfter = (after as any[]).find((p) => p.id === post.id)?._count?.tips ?? 0;
      expect(countAfter).toBe(countBefore - 1);
    }), { numRuns: 30 });
  });
});

// ---------------------------------------------------------------------------
// Properties 20 & 21: Rate limit configuration
// express-rate-limit v7+ does not expose .limit/.windowMs on the handler
// function directly. We test by reading the source constants instead.
// ---------------------------------------------------------------------------

/** Read the raw source of the middleware file and extract numeric constants */
const getRateLimitSource = () => {
  const fs = require("fs");
  const path = require("path");
  // Resolve relative to this test file's location inside rootDir (src/)
  const filePath = path.resolve(__dirname, "../../../midddlewares/bulletinRateLimit.ts");
  return fs.readFileSync(filePath, "utf-8");
};

describe("Property 20: Post rate limit configuration", () => {
  it("postCreationLimiter is configured to max 5 per hour", () => {
    const source = getRateLimitSource();
    // Should contain max: 5 or limit: 5
    expect(/max\s*:\s*5|limit\s*:\s*5/.test(source)).toBe(true);
    // Should contain windowMs: 60 * 60 * 1000 or equivalent (3600000)
    expect(/windowMs\s*:\s*(60\s*\*\s*60\s*\*\s*1000|3600000)/.test(source)).toBe(true);
  });
});

describe("Property 21: Tip rate limit configuration", () => {
  it("tipSubmissionLimiter is configured to max 20 per hour", () => {
    const source = getRateLimitSource();
    // Should contain max: 20 or limit: 20
    expect(/max\s*:\s*20|limit\s*:\s*20/.test(source)).toBe(true);
    // windowMs same as above — already verified in P20 but check again
    expect(/windowMs\s*:\s*(60\s*\*\s*60\s*\*\s*1000|3600000)/.test(source)).toBe(true);
  });
});