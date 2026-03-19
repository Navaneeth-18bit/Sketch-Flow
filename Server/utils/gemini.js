const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analyzeAndExplainDiagram = async (imageBuffer, mimeType) => {
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

  const prompt = `Analyze the provided diagram image.
Generate:
1. The Mermaid code representing the diagram structure.
2. A step-by-step student-friendly explanation of the diagram.

Format the response EXACTLY as a JSON object, with no markdown formatting around it:
{
  "mermaidCode": "flowchart TD\\n...",
  "explanation": {
    "purpose": "A clear overview of what the diagram shows",
    "components": ["List of key elements"],
    "relationships": ["How elements connect"],
    "steps": ["Step 1 — Start of process", "Step 2 — Data input", "..."],
    "keyInsights": ["Important takeaways"]
  }
}`;

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString("base64"),
      mimeType: mimeType,
    },
  };

  const result = await model.generateContent([prompt, imagePart]);
  const response = await result.response;
  let text = response.text();

  // Handle potential JSON formatting issues
  text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse JSON from AI response:", text);
    throw new Error("Invalid response format from AI");
  }
};

const improveDiagram = async (imageBuffer, mimeType, currentMermaidCode, improvementPrompt) => {
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

  const prompt = `You are an expert technical diagram instructor. Review the provided hand-drawn image and its current Mermaid representation:
Current Mermaid Code:
${currentMermaidCode}

The user has requested the following improvement: "${improvementPrompt}"
Please improve the diagram clarity, optimize the flow, suggest a better structure, or add missing steps based on the request.

Format the response EXACTLY as a JSON object, with no markdown formatting around it:
{
  "mermaidCode": "flowchart TD\\n...",
  "explanation": {
    "purpose": "A clear overview of the improved diagram",
    "components": ["List of key elements"],
    "relationships": ["How elements connect"],
    "steps": ["Step 1 — Start of process", "Step 2 — Data input", "..."],
    "keyInsights": ["Important takeaways, including what was improved"]
  }
}`;

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString("base64"),
      mimeType: mimeType,
    },
  };

  const result = await model.generateContent([prompt, imagePart]);
  const response = await result.response;
  let text = response.text();

  text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse JSON from AI response:", text);
    throw new Error("Invalid response format from AI");
  }
};

const chatWithDiagram = async (question, diagramContext) => {
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

  const prompt = `You are an expert in technical diagrams. Context:
Mermaid Code: ${diagramContext.mermaidCode}
Explanation: ${JSON.stringify(diagramContext.explanation)}

Question: ${question}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};

module.exports = {
  analyzeAndExplainDiagram,
  improveDiagram,
  chatWithDiagram,
};
