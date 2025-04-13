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

module.exports = router;
