const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analyzeAndExplainDiagram = async (imageBuffer, mimeType) => {
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

  const prompt = `Analyze the provided image which may contain diagrams, handwritten text, annotations, or mathematical equations.
  Generate:
  1. The Mermaid code representing the structure. 
     - For diagrams, create a clear flowchart/graph. 
     - For standalone equations or text, create a simple Mermaid representation (e.g., a process node showing the problem).
     - *Crucial*: Always wrap node labels in double quotes (") if they contain any special characters like parentheses (), equal signs =, brackets [], or operators. Example: A["Value (x + 3) = 0"].
  2. A step-by-step student-friendly explanation.
     - If a mathematical problem or equation (like "find x") is detected, clearly identify it and provide the solution steps in the "steps" array.
     - The "purpose" should summarize both the visual diagram and any textual/mathematical content found.

  Format the response EXACTLY as a JSON object, with no markdown formatting around it:
  {
    "mermaidCode": "flowchart TD\\n...",
    "explanation": {
      "purpose": "A clear overview of the diagram and any identified text or equations",
      "components": ["List of key elements, variables, or symbols"],
      "relationships": ["How elements connect or logical derivation steps"],
      "steps": ["Step 1 — ...", "Step 2 — ...", "..."],
      "keyInsights": ["Important takeaways, solutions, or final answers"]
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

  const prompt = `You are an expert technical instructor. Review the provided image (which may contain diagrams, text, or math) and its current Mermaid representation:
  Current Mermaid Code:
  ${currentMermaidCode}

  The user has requested the following improvement: "${improvementPrompt}"
  Please improve the clarity, optimize the flow, suggest a better structure, or add missing steps/solutions based on the request.
  *Crucial*: Always wrap node labels in double quotes (") in the Mermaid code if they contain any special characters.

  Format the response EXACTLY as a JSON object, with no markdown formatting around it:
  {
    "mermaidCode": "flowchart TD\\n...",
    "explanation": {
      "purpose": "A clear overview of the improved content",
      "components": ["List of key elements"],
      "relationships": ["How elements connect or derivation steps"],
      "steps": ["Step 1 — ...", "Step 2 — ...", "..."],
      "keyInsights": ["Important takeaways, including what was improved or solved"]
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
