const { GoogleGenerativeAI } = require("@google/generative-ai");
const { supabase } = require("../utils/supabase");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handleChat = async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message missing" });
    }

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID missing" });
    }

    // 1. Save User Message to Supabase
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert([
        { session_id: sessionId, role: 'user', content: message }
      ]);

    if (userMsgError) {
      console.error("Error saving user message:", userMsgError);
      // We can continue to generate a response even if saving fails, or fail early. Let's continue for UX.
    }

    // 2. Fetch recent history for the Gemini context (optional but recommended for "memory")
    const { data: historyData, error: historyError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(20); // Get last 20 messages for context

    let chatHistory = [];
    if (!historyError && historyData) {
      chatHistory = historyData.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user', // Gemini uses 'model' instead of 'assistant'
        parts: [{ text: msg.content }]
      }));
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

    const chat = model.startChat({
      history: chatHistory,
    });

    // Pass the message directly without manual prompt wrapping
    const result = await chat.sendMessage(message);
    let response = result.response.text();

    // 3. Save AI Response to Supabase
    const { error: aiMsgError } = await supabase
      .from('messages')
      .insert([
        { session_id: sessionId, role: 'assistant', content: response }
      ]);

    if (aiMsgError) {
      console.error("Error saving AI message:", aiMsgError);
    }

    res.json({ reply: response });

  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID missing" });
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    res.json(messages);

  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: error.message });
  }
};
