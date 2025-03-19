import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage } from "../controllers/message.controller.js";
import Message from "../models/message.model.js"; // Import Message model
import { io } from "../lib/socket.js"; // Import io for WebSocket

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);

// DELETE route for deleting a message with WebSocket integration
router.delete("/:messageId", protectRoute, async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.user._id; // From protectRoute middleware

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only allow the sender to delete the message
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    await message.deleteOne();
    // Emit WebSocket event to notify all connected clients
    io.emit("messageDeleted", messageId);
    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;