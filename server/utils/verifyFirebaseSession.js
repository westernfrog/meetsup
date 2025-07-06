const admin = require("firebase-admin");

const verifyFirebaseSession = async (req, res, next) => {
  const sessionCookie = req.cookies[process.env.SESSION_COOKIE_NAME];

  if (!sessionCookie) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = await admin.auth().verifySessionCookie(sessionCookie, true);
    req.firebaseUID = decoded.uid;
    next();
  } catch (error) {
    res.clearCookie(process.env.SESSION_COOKIE_NAME);
    return res.status(403).json({ error: "Invalid or expired session" });
  }
};

module.exports = verifyFirebaseSession;
