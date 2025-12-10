const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { saveFCMToken } = require("../controllers/pushTokenController");
// add authenticate 
router.post("/token",authenticate,saveFCMToken);

module.exports = router;
