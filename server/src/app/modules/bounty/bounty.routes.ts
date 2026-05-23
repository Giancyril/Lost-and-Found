import express from "express";
import { bountyController } from "./bounty.controller";
import auth from "../../midddlewares/auth";

const router = express.Router();

router.get("/active", auth(), bountyController.getActiveBounties);

export const bountyRoutes = router;
