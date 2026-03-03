import React, { useState, useRef, useEffect } from "react";

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
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
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

  return (
    <div className="h-full flex flex-col bg-white">
      
      {/* Header */}
      <div className="px-4 py-3 border-b shrink-0">
        <h2 className="font-semibold text-lg tracking-tight fs-6">AI Assistant</h2>
        <p className="text-xs text-gray-500">Multimodal Enabled</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[75%] ${
              msg.role === "user" ? "ml-auto items-end" : "items-start"
            }`}
          >
            {msg.content && (
              <div
                className={`px-4 py-2 rounded-2xl text-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {msg.content}
              </div>
            )}

            {msg.image && (
              <img
                src={msg.image}
                alt="uploaded"
                className="mt-2 rounded-lg max-h-40 border"
              />
            )}
          </div>
        ))}

        {loading && (
          <div className="text-sm text-gray-400 animate-pulse">
            AI is thinking...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t flex items-center gap-2 shrink-0">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
        >
          📎
        </button>

        <input
          type="file"
          ref={fileInputRef}
          hidden
          accept="image/*"
          onChange={(e) =>
            e.target.files && handleFileUpload(e.target.files[0])
          }
        />

        <input
          type="text"
          placeholder="Ask anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 px-4 py-2 rounded-full border focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />

        <button
          onClick={handleSend}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700"
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;