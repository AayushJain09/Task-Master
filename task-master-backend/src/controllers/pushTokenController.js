const User = require("../models/User");

const saveFCMToken = async (req, res) => {
  try {
    // console.log("ajbdfiad", req);
    const { token } = req.body;
    console.log("token received from the backend", token);
    if (!token) {
      console.log("no token received");
      return res
        .status(400)
        .json({ success: false, message: "Token required" });
    }

    await User.updateOne(
      { _id: req.user?.userId },
      { $addToSet: { fcmTokens: token } } // prevents duplicates
    );

    console.log("DB updated successfully");

    res.json({ success: true, message: "Token saved" });
  } catch (error) {
    console.error("Save token failed", error);
    res.status(500).json({ success: false, message: "Failed to save token" });
  }
};

module.exports = {
  saveFCMToken,
};
