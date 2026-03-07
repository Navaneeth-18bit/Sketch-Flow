const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analyzeDiagram = async (imageBuffer, mimeType) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = "generate the mermaid code of the image. only return the mermaid code and nothing else.";

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString("base64"),
      mimeType: mimeType,
    },
  };

  const result = await model.generateContent([prompt, imagePart]);
  const response = await result.response;
  let text = response.text();

  // Clean up mermaid code if needed
  text = text.replace(/```mermaid/g, "").replace(/```/g, "").trim();

  return text;
};

const explainDiagram = async (imageBuffer, mimeType, mermaidCode) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Based on the image and the following mermaid code, provide a detailed technical explanation:
${mermaidCode}

Structure the response as a JSON object with:
- purpose: String
- components: Array of strings
- relationships: Array of strings
- keyInsights: Array of strings`;

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
  text = text.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error("Invalid response format from AI");
  }
};

const chatWithDiagram = async (question, diagramContext) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are an expert in technical diagrams. Context:
Mermaid Code: ${diagramContext.mermaidCode}
Explanation: ${JSON.stringify(diagramContext.explanation)}

Question: ${question}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};

module.exports = {
  analyzeDiagram,
  explainDiagram,
  chatWithDiagram,
};
