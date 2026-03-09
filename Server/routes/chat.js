const express = require("express")
const router = express.Router()

const { handleChat, getChatHistory } = require("../controllers/chatController");

router.post("/", handleChat);
router.get("/:sessionId", getChatHistory);

module.exports = router