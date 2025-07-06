const express = require("express");
const prisma = require("../lib/prisma-client");
const verifyFirebaseSession = require("../utils/verifyFirebaseSession");

const router = express.Router();

router.get("/conversations", verifyFirebaseSession, async (req, res) => {
  try {
    const currentUserId = req.firebaseUID;

    const user = await prisma.user.findUnique({
      where: { fId: currentUserId },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: user.id }, { user2Id: user.id }],
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            profilePics: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            profilePics: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    res.json({ conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/conversations/:id", verifyFirebaseSession, async (req, res) => {
  const { id } = req.params;

  try {
    const currentUserId = req.firebaseUID;

    // Get the current user from database
    const user = await prisma.user.findUnique({
      where: { fId: currentUserId },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

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

router.delete("/conversations/:id", verifyFirebaseSession, async (req, res) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: {
        id: true,
        user1Id: true,
        user2Id: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    await prisma.$transaction([
      prisma.message.deleteMany({
        where: { conversationId: id },
      }),
      prisma.conversation.delete({
        where: { id },
      }),
    ]);

    res.status(200).json({ message: "Conversation deleted successfully" });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
