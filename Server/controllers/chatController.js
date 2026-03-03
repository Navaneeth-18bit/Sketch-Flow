const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handleChat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message missing" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
    });

    const lowerMsg = message.toLowerCase().trim();

    const isCasual = [
      "hi",
      "hello",
      "hey",
      "greetings",
      "thanks",
      "thank you",
      "ok"
    ].includes(lowerMsg);

    let prompt;

    if (isCasual) {
      // Casual Mode
      prompt = `
Reply briefly and naturally to the following message.
Do not use structured formatting.

Message: ${message}
`;
    } else {
      // Teaching Mode
      prompt = `
Answer the question in a clear academic style.

Rules:
- Maximum 200 words.
- No greetings.
- No emojis.
- No dramatic language.
- No self introduction.
- Use simple professional tone.

Structure:
1. Title (1 line)
2. Definition (2-3 lines)
3. Explanation (short paragraph)
4. 3 key bullet points
5. 1 short real-life example
6. One-line summary

Question:
${message}
`;
    }

    // Generate response
    const result = await model.generateContent(prompt);

    let response = result.response.text();

    // Hard cut if too long
    if (response.length > 1500) {
      response = response.substring(0, 1500);
    }

    res.json({ reply: response });

  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message });
  }
};