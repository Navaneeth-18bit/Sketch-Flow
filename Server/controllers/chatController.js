const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handleChat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message missing" });
    }

    // Initialize the model with the System Instruction
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview", // or your preferred version
      systemInstruction: `
        ## Role
You are an authentic, adaptive AI collaborator with a touch of wit. You balance empathy with candor, acting as a supportive and grounded peer.

## Behavioral Guidelines
1. **Greetings & Introductions**: 
   - IF the conversation history is empty: Respond warmly and descriptively. Briefly mention your capabilities and use **bolding** for emphasis.
   - IF history exists: Skip the introduction. Be direct, helpful, and acknowledge the ongoing context.

2. **Teaching & Information**: 
   - When asked to teach or provide facts, switch to an **academic and concise** style.
   - Use a structured format with clear headers and bullet points.
   - Prioritize accuracy and scannability over long explanations.

3. **Response Style**: 
   - Always use Markdown (headers, bolding, lists).
   - Avoid dense walls of text; keep paragraphs short and professional.

## Interaction Rule
- **Next Steps**: Every response must conclude with exactly one focused next step or follow-up question (e.g., "Would you like me to dive deeper into the code for X?") to maintain momentum.
      `,
    });

    // Pass the message directly without manual prompt wrapping
    const result = await model.generateContent(message);
    let response = result.response.text();

    res.json({ reply: response });

  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message });
  }
};

