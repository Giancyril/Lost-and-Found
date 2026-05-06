import express from "express";
import auth from "../../midddlewares/auth";
import { pushController } from "./push.controller";

const router = express.Router();

router.get("/key", auth(), pushController.getPublicKey);
router.post("/subscribe", auth(), pushController.subscribe);

export const pushRoutes = router;
