const express = require("express");
const multer = require("multer");
const imagekit = require("../lib/imagekit"); // Make sure it's initialized with publicKey, privateKey, urlEndpoint

const router = express.Router();

// Multer setup (in-memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Route to handle image upload
router.post("/upload", upload.single("image"), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    // // Check file size (less than 1MB)
    // if (file.size > 1 * 1024 * 1024) {
    //   return res.status(400).json({ error: "File must be under 1MB" });
    // }

    const result = await imagekit.upload({
      file: file.buffer, // raw binary
      fileName: file.originalname,
      folder: "/",
      extensions: [
        {
          name: "google-auto-tagging",
          maxTags: 5,
          minConfidence: 95,
        },
      ],
      transformation: {
        pre: "l-text,i-Imagekit,fs-50,l-end",
        post: [
          {
            type: "transformation",
            value: "w-100",
          },
        ],
      },
    });

    res.status(200).json({
      url: result.url,
      fileId: result.fileId,
    });
  } catch (err) {
    console.error("Upload failed:", err.message);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
});

module.exports = router;
