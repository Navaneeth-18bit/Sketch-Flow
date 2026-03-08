const axios = require("axios");
const { analyzeDiagram, explainDiagram, chatWithDiagram } = require("../utils/gemini");
const { logger } = require("../utils/logger");
const { supabase } = require("../utils/supabase");

const analyzeDiagramHandler = async (req, res, next) => {
  try {
    const { sessionId, strokeData } = req.body;
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const mermaidCode = await analyzeDiagram(req.file.buffer, req.file.mimetype);
    
    let result = { mermaidCode };

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
    const { mermaidCode, analysisId } = req.body;
    if (!mermaidCode || !req.file || !analysisId) {
      return res.status(400).json({ error: "Mermaid code, image, and analysis ID are required" });
    }

    const explanation = await explainDiagram(req.file.buffer, req.file.mimetype, mermaidCode);
    
    // Update AI analysis with explanation text
    if (req.user) {
        const { error } = await supabase
            .from('ai_analyses')
            .update({ explanation_text: JSON.stringify(explanation) })
            .eq('analysis_id', analysisId);
        
        if (error) throw error;
    }

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
