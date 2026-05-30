import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import auth from "../app/midddlewares/auth";
import { uploadImages } from "../app/midddlewares/upload";
import { uploadFileToStorage } from "../app/utils/storage";
import { aiRecognitionService } from "../app/modules/ai/ai.service";

const router = Router();
const prisma = new PrismaClient();

// ── GET /virtue-spotlights  (public — homepage display) ──────────────────────
router.get("/virtue-spotlights", async (req: Request, res: Response) => {
  try {
    const spotlights = await prisma.virtueSpotlight.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: spotlights });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch spotlights" });
  }
});

// ── GET /virtue-spotlights/all  (admin — includes inactive) ──────────────────
router.get("/virtue-spotlights/all", auth(), async (req: Request, res: Response) => {
  try {
    const spotlights = await prisma.virtueSpotlight.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: spotlights });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch spotlights" });
  }
});

// ── POST /virtue-spotlights  (admin only) ────────────────────────────────────
router.post(
  "/virtue-spotlights",
  auth(),
  uploadImages.single("image"),
  async (req: Request, res: Response) => {
    try {
      const { title, description, students } = req.body;
      if (!title) return res.status(400).json({ success: false, message: "Title is required" });

      const studentList: string[] = students ? JSON.parse(students) : [];

      let imageUrl: string | null = null;
      if (req.file) {
        imageUrl = await uploadFileToStorage(
          req.file.buffer,
          req.file.mimetype,
          "virtue-spotlights",
          `new-${Date.now()}`
        );
      }

      const spotlight = await prisma.virtueSpotlight.create({
        data: { title, description: description || null, imageUrl, students: studentList },
      });

      res.status(201).json({ success: true, data: spotlight });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Failed to create spotlight" });
    }
  }
);

// ── PUT /virtue-spotlights/:id  (admin — edit or toggle active) ───────────────
router.put(
  "/virtue-spotlights/:id",
  auth(),
  uploadImages.single("image"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, description, students, isActive } = req.body;

      const studentList: string[] | undefined = students ? JSON.parse(students) : undefined;
      let imageUrl: string | undefined = undefined;

      if (req.file) {
        imageUrl = await uploadFileToStorage(
          req.file.buffer,
          req.file.mimetype,
          "virtue-spotlights",
          id
        );
      }

      const spotlight = await prisma.virtueSpotlight.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(imageUrl && { imageUrl }),
          ...(studentList && { students: studentList }),
          ...(isActive !== undefined && { isActive: isActive === "true" || isActive === true }),
        },
      });

      res.json({ success: true, data: spotlight });
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to update spotlight" });
    }
  }
);

// ── DELETE /virtue-spotlights/:id  (admin) ────────────────────────────────────
router.delete("/virtue-spotlights/:id", auth(), async (req: Request, res: Response) => {
  try {
    await prisma.virtueSpotlight.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Spotlight deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete spotlight" });
  }
});

// ── POST /virtue-spotlights/ai-write  (admin only) ───────────────────────────
router.post("/virtue-spotlights/ai-write", auth(), async (req: Request, res: Response) => {
  try {
    const { bulletPoints } = req.body;
    if (!bulletPoints) {
      return res.status(400).json({ success: false, message: "Bullet points are required" });
    }

    const aiWrittenContent = await aiRecognitionService.writeSpotlightStory(bulletPoints);
    res.json({ success: true, ...aiWrittenContent });
  } catch (err: any) {
    console.error("[AI-Write] Error:", err.message);
    res.status(500).json({ success: false, message: err.message || "Failed to generate story with AI" });
  }
});

export default router;
