import React, { useState, useRef, useEffect, useContext } from "react";
import ReactMarkdown from "react-markdown";
import { ThemeContext } from "../contexts/ThemeContext.jsx";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  fileName?: string;
};

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { toggleTheme, isDark } = useContext(ThemeContext);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const handleFileUpload = async (file: File) => {
    const base64 = await convertToBase64(file);

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: "",
      image: base64,
      fileName: file.name,
    };

    setMessages((prev) => [...prev, newMessage]);
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData.items;

    for (let item of items) {
      if (item.type.includes("image")) {
        const file = item.getAsFile();
        if (file) {
          await handleFileUpload(file);
        }
      }
    }
  };

  const sendToAI = async (userMessage: Message) => {
    setLoading(true);

    try {
      // Map existing messages to the format Gemini expects for history
      const history = messages.map(msg => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      }));

      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: history, // Sending history to enable "memory"
        }),
      });

      const data = await response.json();

      const aiMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.reply,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    await sendToAI(userMessage);
  };

  const handleInputToggle = () => {
    toggleTheme();
  };

  return (
    <div className={`h-full flex flex-col ${isDark ? "bg-[#1e1e1e] text-white" : "bg-white text-black"}`}>
      {/* Header */}
      <div
        className={`px-4 py-3 border-b shrink-0 ${isDark ? "border-[#303030] bg-[#252525]" : "bg-gray-100 border-gray-200"}`}
      >
        <h2 className="font-semibold text-lg tracking-tight">AI Assistant</h2>
        <p className="text-xs text-gray-500">Memory & Multimodal Enabled</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[85%] ${
              msg.role === "user" ? "ml-auto items-end" : "items-start"
            }`}
          >
            {msg.content && (
              <div
                className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : isDark 
                      ? "bg-[#333333] text-gray-100 rounded-tl-none border border-[#444444]" 
                      : "bg-gray-200 text-gray-800 rounded-tl-none"
                }`}
              >
                {msg.role === "assistant" ? (
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="font-bold text-lg mb-2 border-b border-gray-500 pb-1">{children}</h1>,
                      h2: ({ children }) => <h2 className="font-semibold text-base mb-2">{children}</h2>,
                      p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                      code: ({ children }) => (
                        <code className={`${isDark ? "bg-black" : "bg-gray-300"} px-1 py-0.5 rounded text-xs font-mono`}>
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className={`${isDark ? "bg-black" : "bg-gray-800 text-white"} p-3 rounded-lg text-xs overflow-x-auto my-2`}>
                          {children}
                        </pre>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            )}

            {msg.image && (
              <img
                src={msg.image}
                alt="uploaded"
                className="mt-2 rounded-lg max-h-60 border border-gray-400 shadow-md"
              />
            )}
          </div>
        ))}

        {loading && (
          <div className={`text-sm animate-pulse ${isDark ? "text-blue-400" : "text-blue-600"}`}>
            AI is crafting a response...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div
        className={`p-4 border-t flex items-center gap-2 shrink-0 ${isDark ? "border-[#303030] bg-[#252525]" : "bg-gray-50"}`}
      >
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`p-2.5 rounded-full transition-colors ${isDark ? "bg-[#3a3a3a] hover:bg-[#4a4a4a]" : "bg-gray-200 hover:bg-gray-300"}`}
        >
          📎
        </button>

        <input
          type="file"
          ref={fileInputRef}
          hidden
          accept="image/*"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
        />

        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          onDoubleClick={handleInputToggle}
          className={`flex-1 px-4 py-2.5 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-blue-500 ${
            isDark 
              ? "bg-[#1e1e1e] border-[#444444] text-white" 
              : "bg-white border-gray-300 text-black"
          }`}
        />

        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;