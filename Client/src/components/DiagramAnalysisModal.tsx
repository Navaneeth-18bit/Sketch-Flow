import React, { useState, useEffect } from 'react';
import { X, Copy, Download, MessageSquare, Loader2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { DiagramData, ExplainResponse } from '../types';
import DiagramChatWidget from './DiagramChatWidget';

interface DiagramAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DiagramData | null;
  loading: boolean;
}

const DiagramAnalysisModal: React.FC<DiagramAnalysisModalProps> = ({
  isOpen,
  onClose,
  data,
  loading,
}) => {
  const [activeTab, setActiveTab] = useState<'diagram' | 'code' | 'explanation'>('diagram');
  const [isChatOpen, setIsChatOpen] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const downloadImage = () => {
    if (!data?.generatedImageUrl) return;
    const link = document.createElement('a');
    link.href = data.generatedImageUrl;
    link.download = 'diagram.png';
    link.click();
  };

  const downloadExplanation = () => {
    if (!data?.explanation) return;
    const blob = new Blob([JSON.stringify(data.explanation, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'explanation.json';
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-5xl h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Diagram Analysis</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-gray-500">Analyzing diagram...</p>
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Tabs */}
              <div className="flex space-x-4 border-b dark:border-gray-800">
                {(['diagram', 'code', 'explanation'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 px-1 capitalize transition-colors ${
                      activeTab === tab
                        ? 'border-b-2 border-blue-500 text-blue-500'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Panels */}
              <div className="min-h-[400px]">
                {activeTab === 'diagram' && (
                  <div className="flex flex-col items-center space-y-4">
                    <img
                      src={data.generatedImageUrl}
                      alt="Generated Diagram"
                      className="max-w-full h-auto rounded-lg shadow-md"
                    />
                    <button
                      onClick={downloadImage}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Image</span>
                    </button>
                  </div>
                )}

                {activeTab === 'code' && (
                  <div className="relative">
                    <button
                      onClick={() => copyToClipboard(data.mermaidCode)}
                      className="absolute top-4 right-4 p-2 bg-gray-800 text-white rounded hover:bg-gray-700 z-10"
                      title="Copy Code"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <SyntaxHighlighter
                      language="mermaid"
                      style={vscDarkPlus}
                      className="rounded-lg !m-0"
                    >
                      {data.mermaidCode}
                    </SyntaxHighlighter>
                  </div>
                )}

                {activeTab === 'explanation' && (
                  <div className="space-y-6 text-gray-800 dark:text-gray-200">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold">Technical Breakdown</h3>
                      <button
                        onClick={downloadExplanation}
                        className="flex items-center space-x-2 text-blue-500 hover:text-blue-600"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download JSON</span>
                      </button>
                    </div>
                    
                    <section>
                      <h4 className="font-bold text-blue-500 mb-2">Purpose</h4>
                      <p>{data.explanation.purpose}</p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <section>
                        <h4 className="font-bold text-blue-500 mb-2">Components</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {data.explanation.components.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </section>
                      <section>
                        <h4 className="font-bold text-blue-500 mb-2">Relationships</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {data.explanation.relationships.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </section>
                    </div>

                    <section>
                      <h4 className="font-bold text-blue-500 mb-2">Key Insights</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.explanation.keyInsights.map((insight, i) => (
                          <div key={i} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                            {insight}
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No analysis data available.
            </div>
          )}
        </div>

        {/* Floating Chat Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="absolute bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 transition-all transform hover:scale-110 active:scale-95 z-50"
        >
          <MessageSquare className="w-6 h-6" />
        </button>

        {/* Chat Widget Overlay */}
        {isChatOpen && data && (
          <div className="absolute bottom-24 right-6 w-80 h-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 overflow-hidden z-50">
            <DiagramChatWidget
              diagramData={data}
              onClose={() => setIsChatOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagramAnalysisModal;
