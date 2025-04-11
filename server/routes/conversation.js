const express = require("express");
const prisma = require("../lib/prisma-client");
const verifyFirebaseSession = require("../utils/verifyFirebaseSession");

const router = express.Router();

router.get("/conversation/:id", verifyFirebaseSession, async (req, res) => {
  const { id } = req.params;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        user1: true,
        user2: true,
        messages: {
          orderBy: { createdAt: "asc" }, // important for chat order
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.json({ conversation });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
