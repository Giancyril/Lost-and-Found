import express from "express";
import auth from "../../midddlewares/auth";
import { gratitudeController } from "./gratitude.controller";

const router = express.Router();

// Create a digital thank-you note (requires authentication)
router.post("/", auth(), gratitudeController.createNote);

// Get all gratitude notes received by a user (public or authenticated)
router.get("/user/:userId", gratitudeController.getUserReceivedNotes);

// Get hero statistics for a student's profile (public or authenticated)
router.get("/hero-stats/:userId", gratitudeController.getHeroStats);

export const gratitudeRoutes = router;
