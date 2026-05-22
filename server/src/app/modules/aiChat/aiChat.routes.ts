import express from "express";
import { aiChatController } from "./aiChat.controller";
import auth from "../../midddlewares/auth";

const router = express.Router();

router.post("/", auth(true), aiChatController.chat);

export const aiChatRoutes = router;
