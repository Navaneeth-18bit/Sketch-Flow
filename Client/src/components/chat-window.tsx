import React, { useState, useRef, useEffect, useContext } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ThemeContext } from "../contexts/ThemeContext.jsx";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  fileName?: string;
};

const ChatWindow: React.FC<{ activeSessionId?: string | null }> = ({ activeSessionId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { toggleTheme, isDark } = useContext(ThemeContext);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleDiagramContext = async (e: any) => {
      const { message, imageFile } = e.detail;

      let base64 = undefined;
      let fileName = undefined;
      if (imageFile) {
        base64 = await convertToBase64(imageFile);
        fileName = imageFile.name;
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: message,
        image: base64,
        fileName: fileName,
      };

      setMessages((prev) => [...prev, userMessage]);
      await sendToAI(userMessage);
    };

    window.addEventListener("injectDiagramContext", handleDiagramContext);
    return () => window.removeEventListener("injectDiagramContext", handleDiagramContext);
  }, [activeSessionId, messages]); // messages needed for sendToAI history context

  useEffect(() => {
    const fetchHistory = async () => {
      if (!activeSessionId) {
        setMessages([]);
        return;
      }
      try {
        const response = await fetch(`http://localhost:5000/api/chat/${activeSessionId}`);
        if (response.ok) {
          const data = await response.json();
          const loadedMessages: Message[] = data.map((msg: any) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          }));
          setMessages(loadedMessages);
        }
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
      }
    };

    fetchHistory();
  }, [activeSessionId]);

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

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
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
          sessionId: activeSessionId
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
    <div className="h-full flex flex-col bg-white dark:bg-[#1e1e1e] text-black dark:text-gray-100 transition-colors">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-[#303030] bg-gray-50 dark:bg-[#252525] shrink-0 transition-colors">
        <h2 className="font-bold text-lg tracking-tight text-gray-800 dark:text-gray-100">AI Assistant</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Memory & Multimodal Enabled</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "ml-auto items-end" : "items-start"
              }`}
          >
            {msg.content && (
              <div
                className={`px-4 py-3 rounded-2xl text-sm shadow-sm transition-colors ${msg.role === "user"
                  ? "bg-yellow-400 text-gray-900 rounded-tr-none shadow-yellow-500/20"
                  : "bg-gray-100 dark:bg-[#2a2a2a] text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-[#333]"
                  }`}
              >
                {msg.role === "assistant" ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="font-bold text-lg mb-2 border-b border-gray-200 dark:border-gray-700 pb-1">{children}</h1>,
                      h2: ({ children }) => <h2 className="font-semibold text-base mb-2">{children}</h2>,
                      p: ({ children }) => <p className="mb-2 leading-relaxed text-gray-700 dark:text-gray-300">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                      li: ({ children }) => <li className="ml-2">{children}</li>,
                      code: ({ children }) => (
                        <code className="bg-gray-100 dark:bg-black/30 px-1.5 py-0.5 rounded text-xs font-mono border border-gray-200 dark:border-gray-700">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-gray-800 dark:bg-black text-gray-50 p-3 rounded-xl text-xs overflow-x-auto my-3 shadow-inner">
                          {children}
                        </pre>
                      ),
                      // Table styling
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-4 rounded-xl border border-gray-200 dark:border-gray-700">
                          <table className="w-full text-sm text-left border-collapse bg-white dark:bg-black/20">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-gray-100 uppercase text-[10px] font-bold tracking-wider">
                          {children}
                        </thead>
                      ),
                      th: ({ children }) => (
                        <th className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 font-bold">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
              </div>
            )}

            {msg.image && (
              <img
                src={msg.image}
                alt="uploaded"
                className="mt-2 rounded-xl max-h-60 border border-gray-200 dark:border-[#333] shadow-md object-cover"
              />
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium py-2">
            <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="ml-1">AI is crafting a response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="p-4 border-t border-gray-100 dark:border-[#303030] bg-gray-50 dark:bg-[#252525] flex items-end gap-2 shrink-0 transition-colors">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-3 rounded-xl transition-colors bg-white dark:bg-[#1e1e1e] hover:bg-gray-100 dark:hover:bg-[#333] border border-gray-200 dark:border-[#303030] text-gray-500 dark:text-gray-400 shadow-sm"
          aria-label="Upload Image"
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

        <textarea
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          onDoubleClick={handleInputToggle}
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-[#303030] outline-none transition-all focus:ring-2 focus:ring-blue-500/50 bg-white dark:bg-[#1e1e1e] text-gray-800 dark:text-gray-100 shadow-sm resize-none"
          rows={1}
          style={{ minHeight: '46px', maxHeight: '120px' }}
        />

        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="w-12 h-[46px] flex items-center justify-center rounded-xl bg-yellow-400 text-gray-900 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-yellow-500/20"
          aria-label="Send Message"
        >
          <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;