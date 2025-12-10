const admin = require("firebase-admin");
const path = require("path");

// Load service account file
const serviceAccount = require(path.join(__dirname, "../../firebase-service-account.json"));

// Initialize admin only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
