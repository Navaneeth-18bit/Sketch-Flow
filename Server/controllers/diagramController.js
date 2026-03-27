const axios = require("axios");
const { analyzeAndExplainDiagram, improveDiagram, chatWithDiagram } = require("../utils/gemini");
const { logger } = require("../utils/logger");
const { supabase } = require("../utils/supabase");

const analyzeDiagramHandler = async (req, res, next) => {
  try {
    const { sessionId, strokeData } = req.body;
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const { mermaidCode, explanation } = await analyzeAndExplainDiagram(req.file.buffer, req.file.mimetype);

    let result = { mermaidCode, explanation };

    if (req.user && sessionId && strokeData) {
      // 1. Save Rough Sketch
      const { data: sketch, error: sketchError } = await supabase
        .from('rough_sketches')
        .insert({
          session_id: sessionId,
          teacher_id: req.user.uid,
          stroke_data: JSON.parse(strokeData),
        })
        .select()
        .single();

      if (sketchError) throw sketchError;

      // 2. Save AI Analysis
      const { data: analysis, error: analysisError } = await supabase
        .from('ai_analyses')
        .insert({
          sketch_id: sketch.sketch_id,
          ai_prompt: "Analyze the diagram and provide mermaid code and explanation.",
          explanation_text: JSON.stringify(explanation)
        })
        .select()
        .single();

      if (analysisError) throw analysisError;

      // 3. Save Clean Diagram
      const { data: cleanDiagram, error: diagramError } = await supabase
        .from('clean_diagrams')
        .insert({
          analysis_id: analysis.analysis_id,
          mermaid_code: mermaidCode,
          diagram_type: "flowchart", // Default or detect from mermaidCode
        })
        .select()
        .single();

      if (diagramError) throw diagramError;

      result.sketchId = sketch.sketch_id;
      result.analysisId = analysis.analysis_id;
      result.diagramId = cleanDiagram.diagram_id;
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const improveDiagramHandler = async (req, res, next) => {
  try {
    const { mermaidCode, prompt } = req.body;
    if (!req.file || !mermaidCode || !prompt) {
      return res.status(400).json({ error: "Original image, current mermaid code, and improvement prompt are required" });
    }

    const { mermaidCode: newMermaidCode, explanation } = await improveDiagram(req.file.buffer, req.file.mimetype, mermaidCode, prompt);
    res.json({ mermaidCode: newMermaidCode, explanation });
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
    const encodedMermaid = Buffer.from(mermaidCode).toString("base64");
    const imageUrl = `https://mermaid.ink/img/${encodedMermaid}`;

    res.json({ imageUrl });
  } catch (error) {
    next(error);
  }
};

const explainDiagramHandler = async (req, res, next) => {
  // Keeping this for backwards compatibility, though analyzeDiagramHandler now inherently returns explanation
  try {
    const { mermaidCode, analysisId } = req.body;
    if (!mermaidCode || !req.file || !analysisId) {
      return res.status(400).json({ error: "Mermaid code, image, and analysis ID are required" });
    }

    // Fallback stub since explainDiagram was replaced
    res.json({ purpose: "", components: [], relationships: [], steps: [], keyInsights: [] });
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

const getRecentAnalyzedDiagrams = async (req, res, next) => {
  try {
    const { data: diagrams, error } = await supabase
      .from('rough_sketches')
      .select(`
        sketch_id,
        stroke_data,
        created_at,
        ai_analyses (
          analysis_id,
          explanation_text,
          clean_diagrams (
            mermaid_code
          )
        )
      `)
      .eq('teacher_id', req.user.uid)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    
    // Flatten and format
    const formatted = diagrams
      .filter(d => d.ai_analyses?.[0]?.clean_diagrams?.[0]?.mermaid_code)
      .map(d => ({
        id: d.sketch_id,
        createdAt: d.created_at,
        strokeData: d.stroke_data,
        mermaidCode: d.ai_analyses[0].clean_diagrams[0].mermaid_code,
        explanation: JSON.parse(d.ai_analyses[0].explanation_text || '{}')
      }));

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeDiagramHandler,
  improveDiagramHandler,
  generateDiagramHandler,
  explainDiagramHandler,
  chatWithDiagramHandler,
  getRecentAnalyzedDiagrams,
};
