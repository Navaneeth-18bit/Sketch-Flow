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

// Rate limit: 10 requests per minute per user
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: { error: "Too many requests from this IP, please try again after a minute" },
});

router.post("/analyze-diagram", apiLimiter, upload.single("image"), analyzeDiagramHandler);
router.post("/generate-diagram", apiLimiter, generateDiagramHandler);
router.post("/explain-diagram", apiLimiter, upload.single("image"), explainDiagramHandler);
router.post("/chat-diagram", apiLimiter, chatWithDiagramHandler);

module.exports = router;
