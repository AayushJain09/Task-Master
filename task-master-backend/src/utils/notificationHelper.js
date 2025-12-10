// const admin = require("firebase-admin");
// const User = require("../models/User");

// async function sendNotificationToUsers(userIds, title, body) {
//   try {
//     console.log("inside the sendNotificationToUsers")
//     const users = await User.find({ _id: { $in: userIds } }).select("fcmTokens").lean();
//     console.log("fatched user from the notification helper", users)
//     const tokens = users.flatMap(user => user.fcmTokens || []);
//     console.log("tokens from sendNotificationToUsers", tokens)

//     if (!tokens.length) return;

//     await admin.messaging().sendMulticast({
//       tokens,
//       notification: { title, body },
//     });

//     console.log("Notification sent:", title);
//   } catch (err) {
//     console.error("Notification Error:", err);
//   }
// }

// module.exports = { sendNotificationToUsers };
