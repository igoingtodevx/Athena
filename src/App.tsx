import React, { useState, useEffect } from "react";
import { Paper, Message, AnalysisMode } from "./types";
import { Sidebar } from "./components/Sidebar";
import { ChatContainer } from "./components/ChatContainer";
import { PaperCompare } from "./components/PaperCompare";
import { PresentationStudio } from "./components/PresentationStudio";
import { extractPDFText } from "./utils/pdfParser";
import { 
  Upload, 
  Layers, 
  GitMerge, 
  Sparkles, 
  HelpCircle,
  TrendingUp,
  RotateCcw,
  BookOpen,
  GraduationCap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [paper, setPaper] = useState<Paper | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeMode, setActiveMode] = useState<AnalysisMode>(AnalysisMode.DEEP_SYNTHESIS);
  const [selectedPageRange, setSelectedPageRange] = useState<[number, number] | null>(null);
  const [activeTab, setActiveTab] = useState<"analyzer" | "compare" | "presentation">("analyzer");
  
  // Loading & Error States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);

  // Load last session paper if exists
  useEffect(() => {
    const cached = localStorage.getItem("athena_cached_paper");
    const cachedMessages = localStorage.getItem("athena_cached_messages");
    if (cached) {
      try {
        setPaper(JSON.parse(cached));
      } catch (e) {
        localStorage.removeItem("athena_cached_paper");
      }
    }
    if (cachedMessages) {
      try {
        setMessages(JSON.parse(cachedMessages));
      } catch (e) {
        localStorage.removeItem("athena_cached_messages");
      }
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        await processPDFFile(file);
      } else {
        setError("Only Academic PDF manuscripts are supported.");
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processPDFFile(files[0]);
    }
  };

  // Full-stack paper processing pipeline
  const processPDFFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress("Initiating PDF worker threads...");

    try {
      // Step 1: Client-side layout text extraction
      const parsed = await extractPDFText(file);
      setUploadProgress("PDF characters extracted. Transmitting to Athena structured schema analyzer...");

      // Step 2: Full-stack analysis via Express API
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages: parsed.pages }),
      });

      if (!response.ok) {
        throw new Error("Failed to process paper structure and semantic audit.");
      }

      const analyzedData = await response.json();

      // Step 3: Package full paper model
      const completedPaper: Paper = {
        id: Math.random().toString(36).substring(7),
        title: analyzedData.title || parsed.title,
        authors: analyzedData.authors || "Unknown Authors",
        abstract: analyzedData.abstract || "No abstract extracted.",
        totalPages: parsed.totalPages,
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        pages: parsed.pages,
        outline: analyzedData.outline || [],
        audit: analyzedData.audit?.map((item: any) => ({
          ...item,
          id: Math.random().toString(36).substring(7),
        })) || [],
        formulas: analyzedData.formulas?.map((item: any) => ({
          ...item,
          id: Math.random().toString(36).substring(7),
        })) || [],
        literatureLineage: analyzedData.literatureLineage?.map((item: any) => ({
          ...item,
          id: Math.random().toString(36).substring(7),
        })) || [],
      };

      // Save to cache
      localStorage.setItem("athena_cached_paper", JSON.stringify(completedPaper));
      setPaper(completedPaper);
      
      // Clear previous message histories on new paper upload
      setMessages([]);
      localStorage.removeItem("athena_cached_messages");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during manuscript parsing.");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  // Double-Pass grounding chat executor
  const handleSendMessage = async (text: string) => {
    if (!paper) return;

    const newMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedHistory = [...messages, newMessage];
    setMessages(updatedHistory);
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paper,
          messages: updatedHistory,
          mode: activeMode,
          selectedPageRange,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process peer response.");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        pageReferences: data.targetPages || [],
      };

      const finalHistory = [...updatedHistory, assistantMessage];
      setMessages(finalHistory);
      localStorage.setItem("athena_cached_messages", JSON.stringify(finalHistory));
    } catch (err: any) {
      const errorMessage: Message = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        text: `Error during deep scholarly processing: ${err.message || "Connection timed out."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([...updatedHistory, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleClearSession = () => {
    localStorage.removeItem("athena_cached_paper");
    localStorage.removeItem("athena_cached_messages");
    setPaper(null);
    setMessages([]);
    setSelectedPageRange(null);
  };

  return (
    <div className="h-screen flex flex-col bg-[#faf9f6]">
      {/* Top Application Navbar */}
      <header className="px-6 py-4 border-b border-stone-200/80 bg-white flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-stone-900" />
          <h1 className="font-serif text-lg font-bold text-stone-900 tracking-tight">
            Athena <span className="font-sans font-normal text-stone-400 text-xs">Academic Workbench</span>
          </h1>
        </div>

        {/* Tab Selection */}
        {paper && (
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200/50">
            <button
              id="tab-analyzer-btn"
              onClick={() => setActiveTab("analyzer")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "analyzer"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Manuscript Analyzer
            </button>
            <button
              id="tab-compare-btn"
              onClick={() => setActiveTab("compare")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "compare"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <GitMerge className="w-3.5 h-3.5" /> Literature Matrix
            </button>
            <button
              id="tab-presentation-btn"
              onClick={() => setActiveTab("presentation")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "presentation"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" /> Slide Studio
            </button>
          </div>
        )}

        {/* Clear Workspace button */}
        {paper && (
          <button
            onClick={handleClearSession}
            className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-200/30 transition-all font-semibold font-sans"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear Manuscript
          </button>
        )}
      </header>

      {/* Main Body */}
      <main className="flex-1 overflow-hidden min-h-0">
        <AnimatePresence mode="wait">
          {!paper ? (
            /* LANDING AND DROPZONE SCREEN */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="h-full max-w-4xl mx-auto px-6 py-12 flex flex-col items-center justify-center overflow-y-auto"
            >
              <div className="text-center space-y-3 mb-10 max-w-xl">
                <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-stone-400 bg-stone-100 px-3 py-1 rounded-full">
                  Elite Scholarly Grounding Engine
                </span>
                <h2 className="font-serif text-3xl font-medium tracking-tight text-stone-900">
                  Ground Complex Academic Papers With Unparalleled Rigor
                </h2>
                <p className="text-sm text-stone-600 font-serif italic leading-relaxed">
                  "Indistinguishable from a world-class Peer Reviewer. Real-time structured extraction of math schemas, citation networks, and empirical methodology."
                </p>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full max-w-2xl border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all min-h-[300px] cursor-pointer bg-white relative ${
                  isDragging
                    ? "border-stone-950 bg-stone-50 shadow-md scale-[1.01]"
                    : "border-stone-200 hover:border-stone-400 shadow-sm"
                }`}
              >
                {/* File input */}
                <input
                  type="file"
                  id="pdf-upload"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />

                {isUploading ? (
                  <div className="space-y-4">
                    <Sparkles className="w-12 h-12 stroke-[1] text-stone-800 animate-spin mx-auto" />
                    <div>
                      <h4 className="font-serif text-base font-semibold text-stone-800">
                        Analyzing Manuscript
                      </h4>
                      <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 font-mono leading-relaxed">
                        {uploadProgress}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#faf9f6] flex items-center justify-center border border-stone-100 mx-auto group-hover:scale-105 transition-all">
                      <Upload className="w-8 h-8 stroke-[1] text-stone-700" />
                    </div>
                    <div>
                      <h4 className="font-serif text-base font-semibold text-stone-800">
                        Upload Academic PDF Manuscript
                      </h4>
                      <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1 leading-normal">
                        Drag and drop your paper here, or click to browse local files. Max size 50MB.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="w-full max-w-2xl bg-red-50 text-red-800 rounded-2xl p-4 border border-red-100 mt-6 text-xs flex gap-2">
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="font-bold">Extraction Fault:</span> {error}
                  </div>
                </div>
              )}

              {/* Bottom Scholarly Value Propositions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full mt-12 border-t border-stone-200/60 pt-10">
                <div className="space-y-1 text-center md:text-left">
                  <h5 className="font-serif text-xs font-bold text-stone-900 flex items-center justify-center md:justify-start gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Visual/Schema Mapping
                  </h5>
                  <p className="text-[11px] text-stone-500 leading-normal">
                    Fills mathematical dictionaries, structured sectional table of contents, and methodologies directly from the PDF context.
                  </p>
                </div>
                <div className="space-y-1 text-center md:text-left">
                  <h5 className="font-serif text-xs font-bold text-stone-900 flex items-center justify-center md:justify-start gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Double-Pass RAG
                  </h5>
                  <p className="text-[11px] text-stone-500 leading-normal">
                    Scores pages dynamically, locating targets first, before executing deep LaTeX derivation synthesis on the correct pages.
                  </p>
                </div>
                <div className="space-y-1 text-center md:text-left">
                  <h5 className="font-serif text-xs font-bold text-stone-900 flex items-center justify-center md:justify-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Citations Lineage
                  </h5>
                  <p className="text-[11px] text-stone-500 leading-normal">
                    Traces references and baseline comparison architectures to map foundational theoretical roots.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ACTIVE WORKSPACE */
            <div className="h-full flex flex-col">
              {activeTab === "analyzer" ? (
                /* MAIN WORKSPACE SPLIT: Navigator & Debate Core */
                <div className="flex-1 flex min-h-0">
                  {/* Left Sidebar Structural Navigation */}
                  <div className="w-[380px] lg:w-[420px] shrink-0 h-full overflow-hidden">
                    <Sidebar
                      paper={paper}
                      activeMode={activeMode}
                      onSelectMode={setActiveMode}
                      onSelectPageRange={setSelectedPageRange}
                      selectedPageRange={selectedPageRange}
                      onAskQuestionAboutSection={handleSendMessage}
                    />
                  </div>

                  {/* Right Chat Workbench */}
                  <div className="flex-1 h-full overflow-hidden">
                    <ChatContainer
                      messages={messages}
                      onSendMessage={handleSendMessage}
                      isLoading={isChatLoading}
                      activeMode={activeMode}
                    />
                  </div>
                </div>
              ) : activeTab === "compare" ? (
                /* TAB 2: LITERATURE COMPARATIVE MATRIX VIEW */
                <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full custom-scrollbar">
                  <PaperCompare currentPaper={paper} />
                </div>
              ) : (
                /* TAB 3: PRESENTATION PPTX STUDIO WORKBENCH */
                <div className="flex-1 h-full overflow-hidden">
                  <PresentationStudio paper={paper} />
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
