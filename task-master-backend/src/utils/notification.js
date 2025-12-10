// const admin = require("firebase-admin");
// const User = require("../models/User");

// const serviceAccount = require("../../firebase-service-account.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// async function sendReminderNotification(userId, title, body) {
//   const user = await User.findById(userId).lean();
//   if (!user || !user.fcmTokens || user.fcmTokens.length === 0) return;

//   const payload = {
//     notification: {
//       title,
//       body,
//     },
//   };

//   try {
//     await admin.messaging().sendToDevice(user.fcmTokens, payload);
//     console.log("Push sent:", title);
//   } catch (error) {
//     console.error("FCM send error:", error);
//   }
// }

// module.exports = { sendReminderNotification };
