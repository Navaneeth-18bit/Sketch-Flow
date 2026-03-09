const express = require("express");
const router = express.Router();
const {
  createSession,
  getSessions,
  updateSessionStatus,
  getSessionStrokes,
  saveSessionStrokes
} = require("../controllers/sessionController");
const { authMiddleware } = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

// All session routes are protected by authMiddleware and restricted to Teacher/Admin
router.use(authMiddleware);
router.use(checkRole(['teacher', 'admin']));

router.post("/create", createSession);
router.get("/list", getSessions);
router.post("/update-status", updateSessionStatus);
router.get("/:sessionId/strokes", getSessionStrokes);
router.post("/:sessionId/strokes", saveSessionStrokes);

module.exports = router;