import express from "express";
import auth from "../../midddlewares/auth";
import { chatController } from "./chat.controller";

const router = express.Router();

router.get("/rooms", auth(), chatController.getMyChatRooms);
router.get("/messages/:roomId", auth(), chatController.getChatMessages);
router.post("/initiate", auth(), chatController.initiateChat);
router.patch("/mark-as-read/:roomId", auth(), chatController.markAsRead);
router.patch("/mark-as-unread/:roomId", auth(), chatController.markAsUnread);
router.delete("/rooms/:roomId", auth(), chatController.deleteConversation);
router.delete("/messages/:messageId", auth(), chatController.deleteMessage);
router.post("/messages/:messageId/reaction", auth(), chatController.addReaction);

export const chatRoutes = router;
