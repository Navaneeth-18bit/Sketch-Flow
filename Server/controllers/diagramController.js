const axios = require("axios");
const { analyzeDiagram, explainDiagram, chatWithDiagram } = require("../utils/gemini");
const Diagram = require("../models/Diagram");
const { logger } = require("../utils/logger");

const analyzeDiagramHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const mermaidCode = await analyzeDiagram(req.file.buffer, req.file.mimetype);
    res.json({ mermaidCode });
  } catch (error) {
    next(error);
  }
};

const generateDiagramHandler = async (req, res, next) => {
  try {
    const { mermaidCode } = req.body;
    if (!mermaidCode) {
      return res.status(400).json({ error: "Mermaid code is required" });
    }

    // Use mermaid.live's API or a similar rendering service
    // For simplicity, we can encode the mermaid code and use mermaid.ink
    const encodedMermaid = Buffer.from(mermaidCode).toString("base64");
    const imageUrl = `https://mermaid.ink/img/${encodedMermaid}`;

    // Return the URL directly for this example
    res.json({ imageUrl });
  } catch (error) {
    next(error);
  }
};

const explainDiagramHandler = async (req, res, next) => {
  try {
    const mermaidCode = req.body.mermaidCode || req.query.mermaidCode;
    if (!mermaidCode || !req.file) {
      return res.status(400).json({ error: "Mermaid code and image are required" });
    }

    const explanation = await explainDiagram(req.file.buffer, req.file.mimetype, mermaidCode);
    res.json(explanation);
  } catch (error) {
    next(error);
  }
};

const chatWithDiagramHandler = async (req, res, next) => {
  try {
    const { question, mermaidCode, explanation } = req.body;
    if (!question || !mermaidCode || !explanation) {
      return res.status(400).json({ error: "Question, mermaid code, and explanation are required" });
    }

    const response = await chatWithDiagram(question, { mermaidCode, explanation });
    res.json({ response });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeDiagramHandler,
  generateDiagramHandler,
  explainDiagramHandler,
  chatWithDiagramHandler,
};
