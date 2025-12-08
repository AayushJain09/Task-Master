const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authenticate } = require("../middleware/auth");

router.post("/token", authenticate, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: "Token required" });

    await User.updateOne(
      { _id: req.user.userId },
      { $addToSet: { fcmTokens: token } } // prevents duplicates
    );

    res.json({ success: true, message: "Token saved" });
  } catch (error) {
    console.error("Save token failed", error);
    res.status(500).json({ success: false, message: "Failed to save token" });
  }
});

module.exports = router;
