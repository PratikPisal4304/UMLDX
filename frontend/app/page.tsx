"use client"; // Ensure this is at the top

import mermaid from 'mermaid';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import html2canvas from 'html2canvas'; // Import html2canvas

export default function Home() {
    const [description, setDescription] = useState("");
    const [diagramType, setDiagramType] = useState("classDiagram");
    const [mermaidCode, setMermaidCode] = useState("");

    // Function to fetch the generated diagram from the backend
    const generateDiagram = async () => {
        const response = await fetch('http://localhost:8000/generate_diagram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                description: description,
                diagram_type: diagramType,
            }),
        });

        const data = await response.json();
        if (data.mermaid_code) {
            setMermaidCode(data.mermaid_code);  // Set the generated Mermaid code
        } else {
            console.error("Error:", data.error);
        }
    };

    // Function to handle refresh action
    const handleRefresh = () => {
        setDescription("");
        setDiagramType("classDiagram");
        setMermaidCode("");
    };

    // Render the Mermaid diagram whenever the mermaidCode changes
    useEffect(() => {
        if (mermaidCode) {
            // Allow time for the DOM to update before rendering the diagram
            setTimeout(() => {
                mermaid.initialize({ startOnLoad: true });
                mermaid.contentLoaded();
            }, 0);
        }
    }, [mermaidCode]);

    // Function to handle copy and download actions
    const handleCopyClick = () => {
        if (mermaidCode) {
            navigator.clipboard.writeText(mermaidCode);
            alert('Diagram code copied to clipboard!');
        }
    };

    const handleDownloadImageClick = async (format: 'png' | 'jpeg') => {
        const element = document.querySelector('.mermaid') as HTMLElement; // Assert the type
        if (element) {
            const canvas = await html2canvas(element); // Capture the diagram as a canvas
            const dataUrl = canvas.toDataURL(`image/${format}`); // Convert to data URL
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `diagram.${format}`; // Set the file name
            link.click(); // Trigger the download
        } else {
            alert('Failed to capture the diagram.');
        }
    };

    return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
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
                    className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                    onClick={generateDiagram}
                >
                    Generate Diagram
                </button>

                {/* Add Refresh Button */}
                <button
                    className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                    onClick={handleRefresh}
                >
                    Refresh
                </button>

                {mermaidCode && (
                    <div className="w-full max-w-3xl mt-8">
                        <h2 className="text-2xl font-bold mb-4">Generated Mermaid Code:</h2>

                        {/* Code block container for Mermaid code */}
                        <pre className="bg-gray-100 p-4 rounded-md border border-gray-300 overflow-auto mb-8">
                            <code>{mermaidCode}</code>
                        </pre>

                        <h2 className="text-2xl font-bold mb-4">Generated Diagram:</h2>

                        {/* Mermaid diagram container */}
                        <div className="bg-white p-4 rounded-md border border-gray-300 mb-8">
                            <div className="mermaid">
                                {mermaidCode}
                            </div>
                        </div>

                        <div className="flex gap-4 mt-4">
                            <button
                                className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
                                onClick={handleCopyClick}
                            >
                                Copy Mermaid Code
                            </button>
                            <button
                                className="bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600"
                                onClick={() => handleDownloadImageClick('png')}
                            >
                                Download as PNG
                            </button>
                            <button
                                className="bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600"
                                onClick={() => handleDownloadImageClick('jpeg')}
                            >
                                Download as JPEG
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex gap-4 items-center flex-col sm:flex-row mt-8">
                    <a
                        className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
                        href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Image
                            className="dark:invert"
                            src="https://nextjs.org/icons/vercel.svg"
                            alt="Vercel logomark"
                            width={20}
                            height={20}
                        />
                        Deploy now
                    </a>
                    <a
                        className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
                        href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Read our docs
                    </a>
                </div>
            </main>

            <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
                <a
                    className="flex items-center gap-2 hover:underline hover:underline-offset-4"
                    href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Image
                        aria-hidden
                        src="https://nextjs.org/icons/file.svg"
                        alt="File icon"
                        width={16}
                        height={16}
                    />
                    Learn
                </a>
                <a
                    className="flex items-center gap-2 hover:underline hover:underline-offset-4"
                    href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Image
                        aria-hidden
                        src="https://nextjs.org/icons/globe.svg"
                        alt="Globe icon"
                        width={16}
                        height={16}
                    />
                    Go to nextjs.org →
                </a>
            </footer>
        </div>
    );
}
