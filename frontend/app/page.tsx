"use client";

import mermaid from "mermaid";
import { useEffect, useState } from "react";

export default function Home() {
    const [description, setDescription] = useState("");
    const [diagramType, setDiagramType] = useState("classDiagram");
    const [mermaidCode, setMermaidCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Function to fetch and generate a UML diagram
    const generateDiagram = async () => {
        if (!description.trim()) {
            alert("Please enter a description.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("http://localhost:8000/generate_diagram", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description,
                    diagram_type: diagramType,
                }),
            });

            const data = await response.json();
            if (data.mermaid_code) {
                setMermaidCode(data.mermaid_code); // Update diagram state
            } else {
                console.error("Error:", data.error);
                alert("Error generating diagram.");
            }
        } catch (error) {
            console.error("Network Error:", error);
            alert("Failed to connect to backend.");
        } finally {
            setIsLoading(false);
        }
    };

    // Automatically render the diagram when mermaidCode updates
    useEffect(() => {
        if (mermaidCode) {
            renderMermaidDiagram(mermaidCode);
        }
    }, [mermaidCode]);

    // Function to render Mermaid.js diagram dynamically
    const renderMermaidDiagram = (code: string) => {
        const diagramContainer = document.getElementById("mermaid-container");
        if (diagramContainer) {
            diagramContainer.innerHTML = `<div class="mermaid">${code}</div>`;
            mermaid.initialize({ startOnLoad: true });
            mermaid.contentLoaded();
        }
    };

    // Refresh function to clear diagram cache (frontend & backend)
    const handleRefresh = async () => {
        setDescription("");
        setDiagramType("classDiagram");
        setMermaidCode("");
        try {
            await fetch("http://localhost:8000/refresh_diagram", { method: "POST" });
        } catch (error) {
            console.error("Error refreshing:", error);
        }
        const diagramContainer = document.getElementById("mermaid-container");
        if (diagramContainer) diagramContainer.innerHTML = "";
    };

    return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
            <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
                <h1 className="text-4xl font-bold mb-8">UML Diagram Generator</h1>

                <textarea
                    className="w-full max-w-3xl p-4 border border-gray-300 rounded-md mb-4"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter your diagram description here..."
                />

                <select
                    className="w-full max-w-3xl p-2 border border-gray-300 rounded-md mb-4"
                    value={diagramType}
                    onChange={(e) => setDiagramType(e.target.value)}
                >
                    <option value="classDiagram">Class Diagram</option>
                    <option value="sequenceDiagram">Sequence Diagram</option>
                    <option value="flowchart">Flowchart</option>
                    <option value="useCase">Use Case Diagram</option>
                    <option value="stateDiagram">State Diagram</option>
                    <option value="activityDiagram">Activity Diagram</option>
                    <option value="componentDiagram">Component Diagram</option>
                    <option value="deploymentDiagram">Deployment Diagram</option>
                    <option value="objectDiagram">Object Diagram</option>
                    <option value="packageDiagram">Package Diagram</option>
                </select>

                <button
                    className={`bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={generateDiagram}
                    disabled={isLoading}
                >
                    {isLoading ? "Generating..." : "Generate Diagram"}
                </button>

                <button
                    className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                    onClick={handleRefresh}
                >
                    Refresh
                </button>

                {mermaidCode && (
                    <div className="w-full max-w-3xl mt-8">
                        <h2 className="text-2xl font-bold mb-4">Generated Mermaid Code:</h2>

                        <pre className="bg-gray-100 p-4 rounded-md border border-gray-300 overflow-auto mb-8">
                            <code>{mermaidCode}</code>
                        </pre>

                        <h2 className="text-2xl font-bold mb-4">Generated Diagram:</h2>

                        <div className="bg-white p-4 rounded-md border border-gray-300 mb-8">
                            <div id="mermaid-container"></div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
