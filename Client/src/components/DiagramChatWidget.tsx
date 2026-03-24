import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Loader2 } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { ChatMessage, DiagramData } from '../types';

interface DiagramChatWidgetProps {
  diagramData: DiagramData;
  onClose: () => void;
}

const DiagramChatWidget: React.FC<DiagramChatWidgetProps> = ({ diagramData, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Connect to WebSocket server
    socketRef.current = io('http://localhost:5000');

    // Join diagram-specific chat room
    socketRef.current.emit('join_diagram_chat', diagramData.mermaidCode.slice(0, 20)); // Use a unique id

    // Listen for messages
    socketRef.current.on('receive_message', (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
      setIsTyping(false);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [diagramData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Partial<ChatMessage> = {
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    // Emit message to WebSocket server
    socketRef.current?.emit('send_message', {
      diagramId: diagramData.mermaidCode.slice(0, 20),
      message: input,
    });

    setInput('');
    setIsTyping(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-yellow-400 text-gray-900">
        <h3 className="text-sm font-semibold">Diagram Chat</h3>
        <button onClick={onClose} className="p-1 hover:bg-blue-700 rounded transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.sender === 'user'
                  ? 'bg-yellow-400 text-gray-900 rounded-br-none'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
                }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg rounded-bl-none flex space-x-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t dark:border-gray-700">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this diagram..."
            className="flex-1 p-2 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default DiagramChatWidget;
