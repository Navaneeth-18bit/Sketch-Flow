const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const {
  analyzeDiagramHandler,
  generateDiagramHandler,
  explainDiagramHandler,
  chatWithDiagramHandler,
} = require("../controllers/diagramController");
const upload = require("../middleware/upload");
const { authMiddleware } = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

// Rate limit: 10 requests per minute per user
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: { error: "Too many requests from this IP, please try again after a minute" },
});

// Operations restricted to Teacher and Admin
router.post("/analyze-diagram", apiLimiter, authMiddleware, checkRole(['teacher', 'admin']), upload.single("image"), analyzeDiagramHandler);
router.post("/generate-diagram", apiLimiter, authMiddleware, checkRole(['teacher', 'admin']), generateDiagramHandler);
router.post("/explain-diagram", apiLimiter, authMiddleware, checkRole(['teacher', 'admin']), upload.single("image"), explainDiagramHandler);

// Chat restricted to authenticated users (Student, Teacher, Admin)
router.post("/chat-diagram", apiLimiter, authMiddleware, checkRole(['student', 'teacher', 'admin']), chatWithDiagramHandler);

module.exports = router;
