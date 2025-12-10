const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const admin = require("../utils/firebaseAdmin"); // must export admin
const User = require("../models/User");

router.post("/test", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).lean();
    // console.log("gavdbf", user);

    if (!user?.fcmTokens || user.fcmTokens.length === 0) {
      return res.json({ success: false, message: "No FCM token saved" });
    }

    await admin.messaging().sendEachForMulticast({
      tokens: user.fcmTokens,
      notification: {
        title: "Test Notification",
        body: "Hey, what's up?",
      },
    });

    return res.json({ success: true, message: "Notification sent!" });
  } catch (err) {
    console.error("Push test error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
