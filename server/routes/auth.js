const express = require("express");
const prisma = require("../lib/prisma-client");
const admin = require("firebase-admin");
const {
  uniqueNamesGenerator,
  adjectives,
  animals,
} = require("unique-names-generator");

const router = express.Router();

const SESSION_COOKIE_NAME = "session";

const verifyFirebaseSession = async (req, res, next) => {
  const sessionCookie = req.cookies[SESSION_COOKIE_NAME];

  if (!sessionCookie) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = await admin.auth().verifySessionCookie(sessionCookie, true);
    req.firebaseUID = decoded.uid;
    next();
  } catch (error) {
    res.clearCookie(SESSION_COOKIE_NAME);
    return res.status(403).json({ error: "Invalid or expired session" });
  }
};

const verifyFIdToken = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.firebaseUID = decoded.uid;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

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

      user = await prisma.user.create({
        data: {
          fId: req.firebaseUID,
          name: generatedName,
          age: 18,
          gender: "OTHER",
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

    res.cookie(SESSION_COOKIE_NAME, sessionCookie, {
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
    const sessionCookie = req.cookies[SESSION_COOKIE_NAME];
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie);
    await admin.auth().revokeRefreshTokens(decodedClaims.sub);
  } catch (err) {
    // It's okay even if token is invalid
  }

  res.clearCookie(SESSION_COOKIE_NAME, {
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

    if (gender !== undefined && !["MALE", "FEMALE", "OTHER"].includes(gender)) {
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
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
