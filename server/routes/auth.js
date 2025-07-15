const express = require("express");
const prisma = require("../lib/prisma-client");
const admin = require("firebase-admin");
const {
  uniqueNamesGenerator,
  adjectives,
  animals,
} = require("unique-names-generator");
const verifyFirebaseSession = require("../utils/verifyFirebaseSession");
const verifyFIdToken = require("../utils/verifyFIdToken");

const router = express.Router();

const userSelect = {
  id: true,
  name: true,
  age: true,
  gender: true,
  profilePics: true,
  description: true,
  interests: true,
};

router.post("/auth/anonymous", verifyFIdToken, async (req, res) => {
  try {
    let user = await prisma.user.findUnique({
      where: { fId: req.firebaseUID },
      select: userSelect,
    });

    if (!user) {
      const generatedName = uniqueNamesGenerator({
        dictionaries: [adjectives, animals],
        separator: " ",
        style: "lowerCase",
        length: 2,
      });

      const getRandomGender = () => {
        const genders = ["MALE", "FEMALE"];
        return genders[Math.floor(Math.random() * genders.length)];
      };

      const generatedGender = getRandomGender();

      user = await prisma.user.create({
        data: {
          fId: req.firebaseUID,
          name: generatedName,
          age: 18,
          gender: generatedGender,
          interests: [],
          profilePics: [],
        },
        select: userSelect,
      });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const idToken = req.headers.authorization?.split("Bearer ")[1];

    const sessionCookie = await admin.auth().createSessionCookie(idToken, {
      expiresIn,
    });

    res.cookie(process.env.SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.json({ user });
  } catch (error) {
    console.error("Anonymous login failed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/auth/me", verifyFirebaseSession, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { fId: req.firebaseUID },
      select: userSelect,
    });

    if (user) {
      res.json({ user });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Fetch /me error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/logout", async (req, res) => {
  try {
    const sessionCookie = req.cookies[process.env.SESSION_COOKIE_NAME];
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie);
    await admin.auth().revokeRefreshTokens(decodedClaims.sub);
  } catch (err) {
    // It's okay even if token is invalid
  }

  res.clearCookie(process.env.SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  res.json({ success: true });
});

router.put("/auth/profile", verifyFirebaseSession, async (req, res) => {
  try {
    const { name, age, gender, description, interests, profilePics } = req.body;

    if (age !== undefined && (isNaN(age) || age < 13 || age > 120)) {
      return res.status(400).json({ error: "Invalid age" });
    }

    if (gender !== undefined && !["MALE", "FEMALE", "ANY"].includes(gender)) {
      return res.status(400).json({ error: "Invalid gender" });
    }

    if (profilePics !== undefined) {
      if (!Array.isArray(profilePics)) {
        return res
          .status(400)
          .json({ error: "profilePics should be an array" });
      }

      for (const pic of profilePics) {
        if (
          !pic.url ||
          typeof pic.url !== "string" ||
          !pic.imageId ||
          typeof pic.imageId !== "string"
        ) {
          return res.status(400).json({
            error: "Each profile picture must have a valid url and imageId",
          });
        }
      }
    }

    const updateData = {
      ...(name !== undefined && { name }),
      ...(age !== undefined && { age: Number(age) }),
      ...(gender !== undefined && { gender }),
      ...(description !== undefined && { description }),
      ...(interests !== undefined && { interests }),
      ...(profilePics !== undefined && { profilePics }),
    };

    const updatedUser = await prisma.user.update({
      where: { fId: req.firebaseUID },
      data: updateData,
      select: userSelect,
    });

    res.json({ user: updatedUser });
  } catch (error) {
    console.error("Profile update error:", error.message, error.stack);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

module.exports = router;
