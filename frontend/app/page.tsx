"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { 
  Download, 
  Copy, 
  RefreshCw, 
  Loader2, 
  Terminal, 
  Info, 
  AlertTriangle,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Clipboard,
  // Removed Share2 as it's no longer used
  // Removed Mic and replaced with Wand2 for AI
  Wand2
} from "lucide-react";
import mermaid from "mermaid";
import html2canvas from "html2canvas";
import { motion, AnimatePresence } from "framer-motion";

// Enhanced Diagram Types with More Context
const enhancedDiagramTypes = [
  { 
    value: "classDiagram", 
    label: "Class Diagram", 
    description: "Visualize object-oriented system structure with classes, attributes, and relationships",
    example: "Define relationships between classes in a software system",
    difficultyLevel: "Intermediate",
    aiSupportLevel: "High"
  },
  { 
    value: "sequenceDiagram", 
    label: "Sequence Diagram", 
    description: "Show interactions between objects in a specific time sequence",
    example: "Model communication between system components over time",
    difficultyLevel: "Advanced",
    aiSupportLevel: "Medium"
  },
  { 
    value: "flowchart", 
    label: "Flowchart", 
    description: "Illustrate processes, decision points, and workflow steps",
    example: "Visualize steps involved in a business workflow",
    difficultyLevel: "Beginner",
    aiSupportLevel: "High"
  },
  { 
    value: "useCase", 
    label: "Use Case Diagram", 
    description: "Define system interactions from a user's perspective",
    example: "Represent how users interact with system features",
    difficultyLevel: "Intermediate",
    aiSupportLevel: "Medium"
  },
  { 
    value: "stateDiagram", 
    label: "State Diagram", 
    description: "Represent different states of a system or object",
    example: "Show the lifecycle states of a user account",
    difficultyLevel: "Advanced",
    aiSupportLevel: "Low"
  }
];

// Toast Notification Component
const Toast = ({ message, type = 'success', onClose }: { 
  message: string; 
  type?: 'success' | 'error' | 'info'; 
  onClose: () => void 
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  }[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className={`fixed bottom-4 right-4 ${bgColor} text-white p-4 rounded-lg shadow-lg z-50`}
    >
      {message}
    </motion.div>
  );
};

// AI Suggestion Component
const AISuggestionPanel = ({ onSuggestionSelect }: { onSuggestionSelect: (suggestion: { title: string; description: string; diagramType: string }) => void }) => {
  const [suggestions, setSuggestions] = useState<{ title: string; description: string; diagramType: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAISuggestions = async () => {
    setIsLoading(true);
    try {
      // Mock AI suggestions - replace with actual API call
      const mockSuggestions = [
        {
          title: "E-Commerce System",
          description: "Create a class diagram for an online shopping platform",
          diagramType: "classDiagram"
        },
        {
          title: "User Authentication Flow",
          description: "Design a sequence diagram for user login process",
          diagramType: "sequenceDiagram"
        },
        {
          title: "Order Processing",
          description: "Develop a flowchart for order management system",
          diagramType: "flowchart"
        }
      ];
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error("AI Suggestion Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAISuggestions();
  }, []);

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <div className="flex items-center mb-4">
        <Wand2 className="mr-2 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-800">AI Diagram Suggestions</h2>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center">
          <Loader2 className="animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-50 p-4 rounded-lg cursor-pointer hover:bg-blue-100 transition"
              onClick={() => onSuggestionSelect(suggestion)}
            >
              <h3 className="font-semibold text-blue-800">{suggestion.title}</h3>
              <p className="text-sm text-gray-600">{suggestion.description}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// Debounce utility function
function debounce(func: (...args: any[]) => void, wait: number) {
  let timeout: NodeJS.Timeout | undefined;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default function UMLDiagramGenerator() {
  const [description, setDescription] = useState("");
  const [diagramType, setDiagramType] = useState(enhancedDiagramTypes[0].value);
  const [mermaidCode, setMermaidCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [diagramHistory, setDiagramHistory] = useState<{ 
    code: string; 
    type: string; 
    description: string; 
    timestamp: string 
  }[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  
  const diagramRef = useRef(null);

  // Character count and validation
  const MAX_DESCRIPTION_LENGTH = 500;
  const descriptionLength = description.length;
  const isDescriptionValid = descriptionLength > 0 && descriptionLength <= MAX_DESCRIPTION_LENGTH;

  // Handle AI Suggestion
  const handleAISuggestion = (suggestion: { description: string; diagramType: string }) => {
    setDescription(suggestion.description);
    setDiagramType(suggestion.diagramType);
    setShowAISuggestions(false);
  };

  // Debounced diagram generation
  const debouncedGenerateDiagram = useCallback(
    debounce(async () => {
      if (!isDescriptionValid) {
        setError("Please provide a valid description (1-500 characters).");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("http://localhost:8000/generate_diagram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description, diagram_type: diagramType }),
        });

        const data = await response.json();
        if (data.mermaid_code) {
          setMermaidCode(data.mermaid_code);
          // Add to diagram history
          setDiagramHistory(prev => [
            { 
              code: data.mermaid_code, 
              type: diagramType, 
              description, 
              timestamp: new Date().toLocaleString() 
            },
            ...prev
          ]);
          
          // Show success toast
          setToast({
            message: "Diagram generated successfully!",
            type: "success"
          });
        } else {
          setError(data.error || "Unexpected error generating diagram");
        }
      } catch (error) {
        console.error("Network Error:", error);
        setError("Failed to connect to backend. Check your server connection.");
        setToast({
          message: "Failed to generate diagram",
          type: "error"
        });
      } finally {
        setIsLoading(false);
      }
    }, 500),
    [description, diagramType, isDescriptionValid]
  );

  // Diagram Rendering
  useEffect(() => {
    if (mermaidCode) {
      const diagramContainer = document.getElementById("mermaid-container");
      if (diagramContainer) {
        diagramContainer.innerHTML = `<div class="mermaid">${mermaidCode}</div>`;
        mermaid.initialize({ startOnLoad: true });
        mermaid.contentLoaded();
      }
    }
  }, [mermaidCode]);

  // Zoom and Fullscreen Handlers
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Download Image Handler
  const downloadImage = async (format: string) => {
    const diagramContainer = document.getElementById("mermaid-container");
    if (!diagramContainer) {
      setToast({
        message: "No diagram available to download.",
        type: "error"
      });
      return;
    }

    try {
      const canvas = await html2canvas(diagramContainer, {
        useCORS: true
      });
      
      const link = document.createElement("a");
      link.href = canvas.toDataURL(`image/${format}`);
      link.download = `uml_diagram_${diagramType}_${new Date().toISOString().replace(/:/g, '-')}.${format}`;
      link.click();

      setToast({
        message: `Diagram downloaded as ${format.toUpperCase()}`,
        type: "success"
      });
    } catch (error) {
      console.error("Image download error:", error);
      setToast({
        message: "Failed to download diagram",
        type: "error"
      });
    }
  };

  // Clipboard Copy
  const copyToClipboard = () => {
    navigator.clipboard.writeText(mermaidCode);
    setToast({
      message: "Mermaid code copied to clipboard!",
      type: "success"
    });
  };

  return (
    <div className={`
      min-h-screen 
      bg-gradient-to-br 
      from-blue-50 
      to-blue-100 
      flex 
      items-center 
      justify-center 
      p-4
      ${isFullScreen ? 'fixed inset-0 z-50 bg-black bg-opacity-90' : ''}
    `}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`
          w-full 
          max-w-6xl 
          bg-white 
          shadow-2xl 
          rounded-3xl 
          overflow-hidden
          ${isFullScreen ? 'h-full' : ''}
        `}
      >
        {/* Enhanced Header */}
        <div className="bg-blue-600 text-white p-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Terminal className="w-10 h-10" />
            <h1 className="text-3xl font-bold">UML Diagram Studio</h1>
          </div>
          <div className="flex space-x-3">
            <button 
              className="p-2 hover:bg-blue-500 rounded-full transition"
              onClick={() => setShowAISuggestions(!showAISuggestions)}
            >
              {/* Changed Mic icon to Wand2 to represent AI */}
              <Wand2 className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid md:grid-cols-2 gap-6 p-8">
          {/* Input Section */}
          <div className="space-y-6">
            {showAISuggestions && (
              <AISuggestionPanel onSuggestionSelect={handleAISuggestion} />
            )}

            {/* Diagram Type Selection */}
            <select
              className="w-full p-3 border-2 border-gray-300 rounded-lg"
              value={diagramType}
              onChange={(e) => setDiagramType(e.target.value)}
            >
              {enhancedDiagramTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            {/* Description Input */}
            <div className="relative">
              <textarea
                className={`
                  w-full 
                  p-4 
                  border-2 
                  rounded-lg 
                  transition 
                  duration-300
                  ${isDescriptionValid 
                    ? 'border-gray-300 focus:border-blue-500' 
                    : 'border-red-300 focus:border-red-500'}
                `}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your UML diagram in detail... (e.g., Model a customer management system)"
                rows={6}
                maxLength={MAX_DESCRIPTION_LENGTH}
              />
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>
                  {descriptionLength}/{MAX_DESCRIPTION_LENGTH} characters
                </span>
                {!isDescriptionValid && (
                  <span className="text-red-500">
                    Description must be 1-500 characters
                  </span>
                )}
              </div>
            </div>

            {/* Generate Button */}
            <button
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              onClick={debouncedGenerateDiagram}
              disabled={isLoading || !isDescriptionValid}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 animate-spin" />
                  Generating...
                </div>
              ) : (
                "Generate Diagram"
              )}
            </button>
          </div>

          {/* Diagram Preview Section */}
          {mermaidCode && (
            <div className="space-y-6">
              <div 
                ref={diagramRef}
                className={`
                  border 
                  border-gray-300 
                  rounded-lg 
                  p-4 
                  transition-all 
                  duration-300
                  ${isFullScreen ? 'fixed inset-10 z-50 bg-white overflow-auto' : ''}
                `}
                style={{ 
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top center'
                }}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleZoomOut} 
                      className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                    >
                      <ZoomOut size={20} />
                    </button>
                    <button 
                      onClick={handleZoomIn} 
                      className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                    >
                      <ZoomIn size={20} />
                    </button>
                  </div>
                  <button 
                    onClick={toggleFullScreen} 
                    className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                  >
                    {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                </div>
                <div id="mermaid-container" className="min-h-[300px]"></div>
              </div>

              {/* Download and Interaction Buttons */}
              <div className="flex space-x-4">
                <button
                  className="flex-grow flex items-center justify-center bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600"
                  onClick={() => downloadImage("png")}
                >
                  <Download className="mr-2" /> Download PNG
                </button>
                <button
                  className="flex-grow flex items-center justify-center bg-green-500 text-white py-3 rounded-lg hover:bg-green-600"
                  onClick={copyToClipboard}
                >
                  <Clipboard className="mr-2" /> Copy Mermaid Code
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Diagram History */}
        {diagramHistory.length > 0 && (
          <div className="bg-gray-50 p-6">
            <h2 className="text-2xl font-semibold mb-4">Diagram History</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {diagramHistory.slice(0, 6).map((diagram, index) => (
                <div 
                  key={index} 
                  className="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition"
                  onClick={() => {
                    setMermaidCode(diagram.code);
                    setDiagramType(diagram.type);
                    setDescription(diagram.description);
                  }}
                >
                  <p className="text-sm text-gray-600 mb-2">{diagram.type}</p>
                  <p className="text-xs text-gray-500">{diagram.timestamp}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
