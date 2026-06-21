import express from "express";
import { bountyController } from "./bounty.controller";
import auth from "../../midddlewares/auth";

const router = express.Router();

router.get("/active", auth(), bountyController.getActiveBounties);
router.post("/view-map", auth(), bountyController.recordMapVirtualView);

export const bountyRoutes = router;
