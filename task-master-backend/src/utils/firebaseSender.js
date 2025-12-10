const admin = require("firebase-admin");
const User = require("../models/User");

module.exports = {
  async sendToUsers(userIds, { title, body }) {
    try {
      // Fetch all tokens of users
      const users = await User.find(
        { _id: { $in: userIds } },
        { fcmTokens: 1 }
      ).lean();

      const tokens = users.flatMap(u => u.fcmTokens || []);

      if (!tokens.length) {
        console.log("No device tokens available.");
        return;
      }

      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body }
      });

      console.log("Push sent to users:", userIds.length);

    } catch (err) {
      console.error("Notification send error:", err);
    }
  }
};
