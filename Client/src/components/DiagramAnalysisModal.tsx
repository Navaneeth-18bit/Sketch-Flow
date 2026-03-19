import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Loader2, PlayCircle, Sparkles } from 'lucide-react';
import mermaid from 'mermaid';
import axios from 'axios';
import { auth } from '../utils/firebase';
import { DiagramData } from '../types';

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
  loading: initialLoading,
}) => {
  const [currentData, setCurrentData] = useState<DiagramData | null>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [isImproving, setIsImproving] = useState(false);
  const [errorObj, setErrorObj] = useState<string | null>(null);

  const [isPromptingImprovement, setIsPromptingImprovement] = useState(false);
  const [improvementPrompt, setImprovementPrompt] = useState("");

  useEffect(() => {
    if (data) {
      setCurrentData(data);
      setErrorObj(null);
    }
  }, [data]);

  useEffect(() => {
    if (currentData?.mermaidCode) {
      mermaid.initialize({ startOnLoad: false, theme: 'default' });
      mermaid.render('diagram-preview', currentData.mermaidCode)
        .then((result) => {
          setSvgContent(result.svg);
        })
        .catch((e) => {
          console.error("Mermaid parsing error", e);
          setSvgContent(`<div class="text-red-500 p-4">Error rendering diagram: ${e.message}</div>`);
        });
    }
  }, [currentData?.mermaidCode]);

  if (!isOpen) return null;

  const handleImprove = async () => {
    if (!currentData?.originalImageFile || !currentData?.mermaidCode) return;

    // Only send the custom prompt if the user provided one, otherwise fall back to a generic prompt.
    const finalPrompt = improvementPrompt.trim() !== ""
      ? improvementPrompt
      : "Improve diagram clarity, optimize flow, suggest better structure, and add missing steps if needed";

    setIsImproving(true);
    setIsPromptingImprovement(false);
    setErrorObj(null);
    try {
      const formData = new FormData();
      formData.append("image", currentData.originalImageFile);
      formData.append("mermaidCode", currentData.mermaidCode);
      formData.append("prompt", finalPrompt);

      const token = await auth.currentUser?.getIdToken();
      const response = await axios.post("http://localhost:5000/api/improve-diagram", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });
      setCurrentData({
        ...currentData,
        mermaidCode: response.data.mermaidCode,
        explanation: response.data.explanation
      });
      setImprovementPrompt("");
    } catch (err: any) {
      setErrorObj(err.response?.data?.error || err.message || "Failed to improve diagram");
    } finally {
      setIsImproving(false);
    }
  };

  const continueToChatbot = () => {
    if (!currentData?.explanation) return;

    const contextMsg = `Here is my hand-drawn diagram and the AI-generated diagram with explanation. Help me understand it further.\n\n### Explanation\n${currentData.explanation.purpose}`;

    const event = new CustomEvent("injectDiagramContext", {
      detail: {
        message: contextMsg,
        imageFile: currentData.originalImageFile
      }
    });
    window.dispatchEvent(event);
    onClose();
  };

  const handleExport = (format: 'svg' | 'png') => {
    if (!svgContent) return;
    if (format === 'svg') {
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ai-diagram.svg';
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'png') {
      // Create a canvas to convert SVG to PNG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const svg = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svg);
      img.onload = () => {
        canvas.width = img.width || 800;
        canvas.height = img.height || 600;
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const pngUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = 'ai-diagram.png';
          link.click();
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  };

  const isLoading = initialLoading || isImproving;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 transition-opacity backdrop-blur-sm">
      <div className="relative w-full max-w-6xl h-[90vh] bg-white dark:bg-[#121212] rounded-2xl shadow-2xl flex flex-col overflow-hidden font-['Inter']">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a1a1a]">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              AI Diagram Analysis
            </h2>
            <p className="text-sm text-gray-500 mt-1">Converted hand-drawn sketch to clear architecture</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-[#333] rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="relative">
                <Loader2 className="w-14 h-14 text-blue-500 animate-spin" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">
                {isImproving ? "AI is refining your diagram..." : "Analyzing diagram structure..."}
              </p>
            </div>
          ) : currentData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">

              {/* Left Column: Visual Rendering */}
              <div className="flex flex-col h-full bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#333] overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-[#333] bg-white dark:bg-[#1e1e1e] flex justify-between items-center">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200">AI Generated Diagram</h3>
                  <div className="flex gap-2">
                    <button onClick={() => handleExport('svg')} className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-[#333] dark:hover:bg-[#444] text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                      SVG
                    </button>
                    <button onClick={() => handleExport('png')} className="text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                      PNG
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-6 flex items-center justify-center min-h-[400px]">
                  <div
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                    className="mermaid-wrapper w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto drop-shadow-sm transition-all"
                  />
                </div>
              </div>

              {/* Right Column: Explanation */}
              <div className="flex flex-col space-y-6 h-full overflow-y-auto pr-2 custom-scrollbar">

                {errorObj && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900">
                    {errorObj}
                  </div>
                )}

                <div>
                  <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-2">Technical Breakdown</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                    {currentData.explanation?.purpose}
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm">1</span>
                    Key Components
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentData.explanation?.components?.map((c, i) => (
                      <span key={i} className="px-3 py-1.5 bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg text-sm text-gray-700 dark:text-gray-300 shadow-sm">{c}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm">2</span>
                    Step-by-Step Flow
                  </h4>
                  <div className="space-y-3">
                    {currentData.explanation?.steps?.map((step, i) => (
                      <div key={i} className="flex gap-3 bg-white dark:bg-[#252525] p-3 rounded-xl border border-gray-100 dark:border-[#333] shadow-sm">
                        <div className="text-indigo-500 font-medium">Step {i + 1}</div>
                        <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{step}</div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              No analysis data available. Please draw a diagram and click analyze.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a1a1a] flex flex-wrap justify-between items-center gap-4 shrink-0 transition-colors">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333] transition-colors font-medium bg-white dark:bg-transparent"
          >
            Close
          </button>

          <div className="flex flex-wrap gap-3 w-full sm:w-auto flex-1 justify-end">
            {isPromptingImprovement ? (
              <div className="flex items-center gap-2 w-full max-w-lg">
                <input
                  type="text"
                  value={improvementPrompt}
                  onChange={(e) => setImprovementPrompt(e.target.value)}
                  placeholder="How can I improve the diagram?"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleImprove();
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={handleImprove}
                  disabled={isLoading || !currentData || improvementPrompt.trim() === ""}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors font-medium flex-shrink-0 disabled:opacity-50"
                >
                  Submit
                </button>
                <button
                  onClick={() => {
                    setIsPromptingImprovement(false);
                    setImprovementPrompt("");
                  }}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333] transition-colors font-medium flex-shrink-0 bg-white dark:bg-transparent"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setIsPromptingImprovement(true)}
                  disabled={isLoading || !currentData}
                  className="px-6 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  Ask AI to Improve Diagram
                </button>

                <button
                  onClick={continueToChatbot}
                  disabled={isLoading || !currentData}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                  <PlayCircle className="w-4 h-4" />
                  Continue to Chatbot
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagramAnalysisModal;
