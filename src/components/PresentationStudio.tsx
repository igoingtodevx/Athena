import React, { useState, useEffect, useRef } from "react";
import { Paper, Presentation, Slide, SlideBullet, PresentationTemplate } from "../types";
import { exportToPPTX } from "../utils/pptxExporter";
import { 
  Sparkles, 
  Download, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Palette, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  FileText, 
  Maximize2, 
  Upload, 
  RefreshCw, 
  HelpCircle,
  Undo,
  Heading,
  Indent,
  CornerDownRight,
  Sparkle,
  Type as FontIcon,
  Smile,
  GraduationCap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Pre-defined Academic & Corporate Templates
const PRESET_TEMPLATES: PresentationTemplate[] = [
  {
    id: "academic-minimalist",
    name: "Academic Minimalist",
    backgroundColor: "#FAF9F6", // Cream / off-white
    titleColor: "#1C1E21",      // Charcoal Ink
    textColor: "#404040",       // Soft charcoal
    accentColor: "#8C7355",     // Warm Sepia / Gold
    fontTitle: "Georgia",
    fontBody: "Arial",
    showLogo: true
  },
  {
    id: "slate-corporate",
    name: "Slate Deep Corporate",
    backgroundColor: "#0F172A", // Deep Navy Slate
    titleColor: "#F8FAFC",      // Pure White
    textColor: "#CBD5E1",       // Soft Slate
    accentColor: "#38BDF8",     // Vibrant Sky Blue
    fontTitle: "Trebuchet MS",
    fontBody: "Calibri",
    showLogo: true
  },
  {
    id: "emerald-scholar",
    name: "Emerald Scholar",
    backgroundColor: "#F4F6F4", // Olive/Ivory shade
    titleColor: "#143D28",      // Forest Green
    textColor: "#2D3A32",       // Dark Olive Sage
    accentColor: "#C0A060",     // Warm Academic Gold
    fontTitle: "Georgia",
    fontBody: "Calibri",
    showLogo: true
  },
  {
    id: "oxford-burgundy",
    name: "Oxford Prestige",
    backgroundColor: "#FFFFFF", // Crisp White
    titleColor: "#800020",      // Burgundy Crimson
    textColor: "#333333",       // Dark Charcoal
    accentColor: "#D4AF37",     // Oxford Gold
    fontTitle: "Georgia",
    fontBody: "Arial",
    showLogo: true
  }
];

interface PresentationStudioProps {
  paper: Paper;
}

export function PresentationStudio({ paper }: PresentationStudioProps) {
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [activeSlideId, setActiveSlideId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aiWorking, setAiWorking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Template customizer state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("academic-minimalist");
  const [isCustomTemplate, setIsCustomTemplate] = useState<boolean>(false);
  const [customTemplate, setCustomTemplate] = useState<PresentationTemplate>({
    id: "custom",
    name: "Custom University Style",
    backgroundColor: "#FFFFFF",
    titleColor: "#1D4ED8", // University Blue
    textColor: "#1F2937",
    accentColor: "#F59E0B", // University Gold
    fontTitle: "Georgia",
    fontBody: "Arial",
    showLogo: true,
    logoUrl: ""
  });

  // AI assistant user command
  const [aiCommand, setAiCommand] = useState<string>("");

  // Slide Inline Editing Active States
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingBulletIndex, setEditingBulletIndex] = useState<number | null>(null);
  const [editingEqId, setEditingEqId] = useState<boolean>(false);
  const [editingCallout, setEditingCallout] = useState<boolean>(false);

  // Load from local Cache on mount
  useEffect(() => {
    const cached = localStorage.getItem(`athena_cached_presentation_${paper.id}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setPresentation(parsed);
        if (parsed.slides && parsed.slides.length > 0) {
          setActiveSlideId(parsed.slides[0].id);
        }
      } catch (e) {
        localStorage.removeItem(`athena_cached_presentation_${paper.id}`);
      }
    }
  }, [paper.id]);

  // Save to Cache helper
  const saveToCache = (newPres: Presentation) => {
    setPresentation(newPres);
    localStorage.setItem(`athena_cached_presentation_${paper.id}`, JSON.stringify(newPres));
  };

  // Get active template config
  const getActiveTemplate = (): PresentationTemplate => {
    if (isCustomTemplate) return customTemplate;
    const found = PRESET_TEMPLATES.find(t => t.id === selectedTemplateId);
    return found || PRESET_TEMPLATES[0];
  };

  const activeTemplate = getActiveTemplate();

  // 1. Initial full-deck generation
  const handleGenerateDeck = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-presentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paper }),
      });

      if (!response.ok) {
        throw new Error("Failed to deconstruct manuscript into academic slides. Check GEMINI_API_KEY.");
      }

      const data = await response.json();
      
      const slidesWithIds = data.slides.map((s: any) => ({
        ...s,
        id: s.id || Math.random().toString(36).substring(7)
      }));

      const newPres: Presentation = {
        title: data.title || paper.title,
        subtitle: data.subtitle || "A Scholar-Grade Review",
        author: data.author || paper.authors.split(",")[0] + " et al.",
        slides: slidesWithIds,
        templateId: selectedTemplateId
      };

      saveToCache(newPres);
      if (slidesWithIds.length > 0) {
        setActiveSlideId(slidesWithIds[0].id);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during slide generation.");
    } finally {
      setIsLoading(false);
    }
  };

  const activeSlide = presentation?.slides.find(s => s.id === activeSlideId) || null;

  // 2. Individual slide update via Gemini AI Command
  const handleApplyAICommand = async (commandToUse?: string) => {
    if (!presentation || !activeSlide) return;
    const finalCommand = commandToUse || aiCommand;
    if (!finalCommand.trim()) return;

    setAiWorking(true);
    setError(null);
    try {
      const response = await fetch("/api/edit-slide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slide: activeSlide,
          instruction: finalCommand,
          paper: { title: paper.title, abstract: paper.abstract }
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to apply slide command. Check server status.");
      }

      const updatedSlideData = await response.json();
      
      const newSlides = presentation.slides.map(s => {
        if (s.id === activeSlide.id) {
          return {
            ...updatedSlideData,
            id: activeSlide.id // Keep same ID
          };
        }
        return s;
      });

      const updatedPres = {
        ...presentation,
        slides: newSlides
      };

      saveToCache(updatedPres);
      setAiCommand("");
    } catch (err: any) {
      setError(`AI Co-author error: ${err.message}`);
    } finally {
      setAiWorking(false);
    }
  };

  // 3. Export to pptx file
  const handleExportPresentation = async () => {
    if (!presentation) return;
    try {
      setIsLoading(true);
      await exportToPPTX(presentation, activeTemplate);
    } catch (err: any) {
      setError(`Export error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Custom university logo upload (Base64)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCustomTemplate(prev => ({
          ...prev,
          logoUrl: base64String
        }));
        setIsCustomTemplate(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // 5. Manual Slide modifications (CRUD & Reorder)
  const updateActiveSlideField = (field: keyof Slide, value: any) => {
    if (!presentation || !activeSlide) return;
    const newSlides = presentation.slides.map(s => {
      if (s.id === activeSlide.id) {
        return { ...s, [field]: value };
      }
      return s;
    });
    saveToCache({ ...presentation, slides: newSlides });
  };

  const handleUpdateBulletText = (index: number, value: string) => {
    if (!activeSlide) return;
    const newBullets = activeSlide.bullets.map((b, i) => {
      if (i === index) return { ...b, text: value };
      return b;
    });
    updateActiveSlideField("bullets", newBullets);
  };

  const handleUpdateBulletIndent = (index: number, indentDelta: number) => {
    if (!activeSlide) return;
    const newBullets = activeSlide.bullets.map((b, i) => {
      if (i === index) {
        const currentIndent = b.indent || 0;
        const nextIndent = Math.max(0, Math.min(2, currentIndent + indentDelta));
        return { ...b, indent: nextIndent };
      }
      return b;
    });
    updateActiveSlideField("bullets", newBullets);
  };

  const handleAddBullet = () => {
    if (!activeSlide) return;
    const newBullets = [...activeSlide.bullets, { text: "New scientific assertion point...", indent: 0 }];
    updateActiveSlideField("bullets", newBullets);
  };

  const handleDeleteBullet = (index: number) => {
    if (!activeSlide) return;
    const newBullets = activeSlide.bullets.filter((_, i) => i !== index);
    updateActiveSlideField("bullets", newBullets);
  };

  const handleAddNewSlide = () => {
    if (!presentation) return;
    const newSlide: Slide = {
      id: Math.random().toString(36).substring(7),
      title: "New Scholarly Insights",
      type: "content",
      bullets: [
        { text: "Primary research claim...", isBold: true, indent: 0 },
        { text: "Accompanying statistical or structural proof point...", indent: 1 }
      ],
      speakerNotes: "Presenter narrative for this newly created slide..."
    };
    const updatedPres = {
      ...presentation,
      slides: [...presentation.slides, newSlide]
    };
    saveToCache(updatedPres);
    setActiveSlideId(newSlide.id);
  };

  const handleDeleteSlide = (id: string) => {
    if (!presentation) return;
    const newSlides = presentation.slides.filter(s => s.id !== id);
    if (newSlides.length === 0) {
      setPresentation(null);
      return;
    }
    const updatedPres = {
      ...presentation,
      slides: newSlides
    };
    saveToCache(updatedPres);
    if (activeSlideId === id) {
      setActiveSlideId(newSlides[0].id);
    }
  };

  const handleMoveSlide = (direction: "up" | "down", id: string) => {
    if (!presentation) return;
    const index = presentation.slides.findIndex(s => s.id === id);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === presentation.slides.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const tempSlides = [...presentation.slides];
    const [moved] = tempSlides.splice(index, 1);
    tempSlides.splice(targetIndex, 0, moved);

    saveToCache({
      ...presentation,
      slides: tempSlides
    });
  };

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
      
      {/* Dynamic Slide Loading Bar */}
      {(isLoading || aiWorking) && (
        <div className="w-full h-1 bg-stone-100 overflow-hidden shrink-0">
          <div className="h-full bg-stone-900 animate-pulse w-full duration-1000" />
        </div>
      )}

      {/* Main Workspace Inner Split */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {!presentation ? (
          /* Onboarding Presentation Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border border-stone-200/60 shadow-sm">
              <GraduationCap className="w-9 h-9 text-stone-800" />
            </div>
            <div className="space-y-2">
              <h3 className="font-serif text-2xl font-bold text-stone-900">
                Create Perfect Scientific PPTX Slides
              </h3>
              <p className="text-sm text-stone-600 font-serif italic leading-relaxed">
                "Athena parses your manuscript's math schemas, experimental setups, SOTA statistics, and peer audits to generate a structured, human-grade slide deck. Bound completely to custom university templates with zero AI slop filler."
              </p>
            </div>

            {/* Core Template Chooser on Onboarding */}
            <div className="w-full bg-white border border-stone-200 p-5 rounded-2xl space-y-4 shadow-sm text-left">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase font-bold text-stone-500">
                  Choose Presentation Design Master
                </span>
                <span className="text-[10px] bg-stone-100 px-2 py-0.5 rounded font-mono text-stone-600">
                  Fully Editable
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {PRESET_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTemplateId(t.id);
                      setIsCustomTemplate(false);
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all ${
                      selectedTemplateId === t.id && !isCustomTemplate
                        ? "border-stone-900 ring-2 ring-stone-900/10 bg-stone-50"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <span className="font-serif text-xs font-bold text-stone-800 block">
                      {t.name}
                    </span>
                    <div className="flex gap-1.5 mt-1.5">
                      <div className="w-4 h-4 rounded-full border border-stone-300" style={{ backgroundColor: t.backgroundColor }} />
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.titleColor }} />
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.accentColor }} />
                    </div>
                  </button>
                ))}
              </div>

              {/* Quick Custom University Upload Logo Box */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-serif text-xs font-semibold text-stone-800 block">
                    Upload Custom University Logo
                  </span>
                  <span className="text-[10px] text-stone-400 block leading-tight font-sans">
                    Inserts your Uni logo (e.g., Oxford, MIT) onto the top corner of all generated slides.
                  </span>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer bg-stone-50 hover:bg-stone-100 px-3.5 py-2 rounded-xl border border-stone-200 font-mono text-[10px] font-bold text-stone-700 transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  <span>UPLOAD FILE</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoUpload} 
                    className="hidden" 
                  />
                </label>
              </div>

              {isCustomTemplate && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] p-2 rounded-lg flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Custom university logo uploaded successfully! Custom Master Template is now active.</span>
                </div>
              )}
            </div>

            <button
              onClick={handleGenerateDeck}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-mono text-xs font-bold uppercase py-3.5 rounded-xl shadow transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-stone-200 animate-pulse" />
              <span>{isLoading ? "Analyzing Manuscript & Formulating Slides..." : "GENERATE HIGH-LEVEL SCIENTIFIC PRESENTATION"}</span>
            </button>

            {error && (
              <div className="w-full bg-red-50 text-red-800 border border-red-100 p-3 rounded-xl text-xs text-left">
                <strong>Generation Error:</strong> {error}
              </div>
            )}
          </div>
        ) : (
          /* Active Presentation Studio Layout */
          <div className="flex-1 flex overflow-hidden min-h-0">
            
            {/* L1: SLIDE VERTICAL LIST NAVIGATION (Left Sidebar inside tab) */}
            <div className="w-64 border-r border-stone-200 bg-white flex flex-col shrink-0 overflow-hidden h-full">
              
              <div className="p-3 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  Deck Layout ({presentation.slides.length} slides)
                </span>
                <button
                  onClick={handleAddNewSlide}
                  className="p-1 hover:bg-stone-200 rounded text-stone-700 transition-all"
                  title="Add empty custom slide"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Draggable/Reorder Slide Vertical Stack */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                {presentation.slides.map((s, index) => {
                  const isActive = s.id === activeSlideId;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setActiveSlideId(s.id)}
                      className={`group p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                        isActive
                          ? "border-stone-900 bg-stone-50 ring-1 ring-stone-950/5 shadow-sm"
                          : "border-stone-200 bg-white hover:border-stone-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[9px] font-bold text-stone-400">
                          Folie {index + 1}
                        </span>
                        
                        {/* Control buttons on hover */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMoveSlide("up", s.id); }}
                            className="p-0.5 hover:bg-stone-200 rounded text-stone-600"
                            title="Move Up"
                          >
                            <ArrowUp className="w-2.5 h-2.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMoveSlide("down", s.id); }}
                            className="p-0.5 hover:bg-stone-200 rounded text-stone-600"
                            title="Move Down"
                          >
                            <ArrowDown className="w-2.5 h-2.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteSlide(s.id); }}
                            className="p-0.5 hover:bg-red-100 text-red-600 rounded"
                            title="Delete Slide"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-serif font-bold text-xs text-stone-800 truncate pr-4 leading-tight">
                        {s.title}
                      </h4>
                      
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="font-mono text-[8px] uppercase tracking-wider bg-stone-100 px-1 py-0.2 rounded text-stone-500">
                          {s.type}
                        </span>
                        {s.equation && (
                          <span className="text-[9px] text-stone-400 font-mono">LaTeX</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Template Master Selector right inside Studio Footer */}
              <div className="p-3 border-t border-stone-200 bg-stone-50">
                <span className="font-mono text-[9px] font-bold text-stone-400 uppercase block mb-1.5">
                  Slide Layout Design
                </span>
                
                <select
                  value={isCustomTemplate ? "custom" : selectedTemplateId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "custom") {
                      setIsCustomTemplate(true);
                    } else {
                      setSelectedTemplateId(val);
                      setIsCustomTemplate(false);
                    }
                  }}
                  className="w-full text-xs p-2 bg-white rounded-lg border border-stone-200 text-stone-800 font-semibold"
                >
                  {PRESET_TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                  <option value="custom">University Custom Template</option>
                </select>

                {/* Sub-config to show colors or upload logo */}
                {isCustomTemplate && (
                  <div className="mt-2.5 space-y-2 bg-white p-2 rounded-lg border border-stone-200">
                    <div className="flex items-center justify-between gap-1 text-[10px]">
                      <span className="text-stone-500">Accent:</span>
                      <input 
                        type="color" 
                        value={customTemplate.accentColor}
                        onChange={(e) => setCustomTemplate(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="w-5 h-5 cursor-pointer rounded overflow-hidden p-0 border-0"
                      />
                      <span className="text-stone-500">BG Color:</span>
                      <input 
                        type="color" 
                        value={customTemplate.backgroundColor}
                        onChange={(e) => setCustomTemplate(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        className="w-5 h-5 cursor-pointer rounded overflow-hidden p-0 border-0"
                      />
                    </div>
                    <label className="text-[9px] font-mono text-stone-500 uppercase flex items-center justify-center gap-1 bg-stone-50 hover:bg-stone-100 p-1 rounded border border-stone-200 cursor-pointer">
                      <Upload className="w-2.5 h-2.5" />
                      <span>Change Logo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* L2: ACTIVE SLIDE CANVAS DISPLAY (Center Workspace) */}
            <div className="flex-1 bg-stone-100 p-5 flex flex-col justify-between overflow-y-auto h-full min-w-0">
              
              {/* Header inside Canvas space */}
              <div className="flex items-center justify-between mb-3 shrink-0">
                <div>
                  <h3 className="font-serif text-sm font-bold text-stone-800">
                    Active Slide Canvas Frame
                  </h3>
                  <p className="text-[11px] text-stone-500 font-sans">
                    Click directly on any title, equation, or bullet item on the slide to edit text inline.
                  </p>
                </div>
                
                {/* Save and download deck button */}
                <button
                  onClick={handleExportPresentation}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white font-mono text-[11px] font-bold uppercase px-4 py-2 rounded-xl shadow-sm transition-all shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-stone-200" />
                  <span>EXPORT PPTX FILE</span>
                </button>
              </div>

              {activeSlide ? (
                /* The Actual Rendered Slide Canvas Frame representing aspect-ratio (16:9) */
                <div className="flex-1 flex flex-col justify-between min-h-0 space-y-4">
                  <div 
                    className="w-full aspect-[16/9] bg-white rounded-2xl shadow-lg border border-stone-200/40 p-10 flex flex-col justify-between relative overflow-hidden shrink-0 select-text transition-all duration-300"
                    style={{ 
                      backgroundColor: activeTemplate.backgroundColor,
                      color: activeTemplate.textColor,
                      fontFamily: activeTemplate.fontBody 
                    }}
                  >
                    
                    {/* Decorative solid column or corner accent */}
                    {activeSlide.type === "title" && (
                      <div 
                        className="absolute left-0 top-0 bottom-0 w-3"
                        style={{ backgroundColor: activeTemplate.accentColor }}
                      />
                    )}

                    {/* Render custom University logo on top right of all content slides if showLogo */}
                    {activeTemplate.logoUrl && activeTemplate.showLogo !== false && (
                      <div className="absolute top-6 right-8 w-24 h-12 flex items-center justify-end">
                        <img 
                          src={activeTemplate.logoUrl} 
                          alt="University Custom Logo" 
                          className="max-w-full max-h-full object-contain filter grayscale opacity-80"
                        />
                      </div>
                    )}

                    {/* A. SLIDE TYPE LAYOUTS */}
                    {activeSlide.type === "title" ? (
                      /* TITLE LAYOUT */
                      <div className="flex-1 flex flex-col justify-center pl-6">
                        
                        {/* Interactive Slide Title */}
                        {editingTitleId === activeSlide.id ? (
                          <input
                            type="text"
                            value={activeSlide.title}
                            onChange={(e) => updateActiveSlideField("title", e.target.value)}
                            onBlur={() => setEditingTitleId(null)}
                            onKeyDown={(e) => { if (e.key === 'Enter') setEditingTitleId(null); }}
                            className="bg-transparent border-b border-dashed border-stone-400 font-bold focus:outline-none focus:ring-0 w-full"
                            style={{ 
                              color: activeTemplate.titleColor,
                              fontFamily: activeTemplate.fontTitle,
                              fontSize: "32px" 
                            }}
                            autoFocus
                          />
                        ) : (
                          <h2 
                            onClick={() => setEditingTitleId(activeSlide.id)}
                            className="font-bold cursor-text hover:bg-stone-200/25 px-1 py-0.5 rounded transition-all select-all inline-block"
                            style={{ 
                              color: activeTemplate.titleColor,
                              fontFamily: activeTemplate.fontTitle,
                              fontSize: "34px",
                              lineHeight: "1.2"
                            }}
                          >
                            {activeSlide.title}
                          </h2>
                        )}

                        <div className="w-20 h-1 bg-stone-300 my-4" style={{ backgroundColor: activeTemplate.accentColor }} />

                        {/* Subtitle click editable */}
                        {editingCallout ? (
                          <input
                            type="text"
                            value={presentation.subtitle}
                            onChange={(e) => setPresentation({ ...presentation, subtitle: e.target.value })}
                            onBlur={() => setEditingCallout(false)}
                            onKeyDown={(e) => { if (e.key === 'Enter') setEditingCallout(false); }}
                            className="bg-transparent text-lg italic border-b border-dashed border-stone-400 focus:outline-none focus:ring-0 max-w-xl"
                            style={{ color: activeTemplate.textColor }}
                            autoFocus
                          />
                        ) : (
                          <p 
                            onClick={() => setEditingCallout(true)}
                            className="text-lg italic text-stone-500 font-serif cursor-text hover:bg-stone-200/25 px-1 py-0.5 rounded max-w-xl transition-all"
                          >
                            {presentation.subtitle}
                          </p>
                        )}

                        {/* Author info */}
                        <div className="mt-10 font-mono text-[11px] uppercase tracking-wider text-stone-400 font-bold">
                          {presentation.author}
                        </div>
                      </div>
                    ) : (
                      /* STANDARD & EQUATION CONTENT LAYOUTS */
                      <div className="flex-1 flex flex-col justify-start min-h-0 space-y-4">
                        
                        {/* Slide Title */}
                        <div className="flex items-center justify-between">
                          {editingTitleId === activeSlide.id ? (
                            <input
                              type="text"
                              value={activeSlide.title}
                              onChange={(e) => updateActiveSlideField("title", e.target.value)}
                              onBlur={() => setEditingTitleId(null)}
                              onKeyDown={(e) => { if (e.key === 'Enter') setEditingTitleId(null); }}
                              className="bg-transparent border-b border-dashed border-stone-400 font-bold focus:outline-none focus:ring-0 w-3/4"
                              style={{ 
                                color: activeTemplate.titleColor,
                                fontFamily: activeTemplate.fontTitle,
                                fontSize: "20px" 
                              }}
                              autoFocus
                            />
                          ) : (
                            <h3 
                              onClick={() => setEditingTitleId(activeSlide.id)}
                              className="font-bold cursor-text hover:bg-stone-200/25 px-1 rounded transition-all"
                              style={{ 
                                color: activeTemplate.titleColor,
                                fontFamily: activeTemplate.fontTitle,
                                fontSize: "22px"
                              }}
                            >
                              {activeSlide.title}
                            </h3>
                          )}
                        </div>

                        {/* Decorative separator line under title */}
                        <div className="w-full h-[1px] bg-stone-200" style={{ backgroundColor: activeTemplate.accentColor + "40" }} />

                        {/* Active Content rendering */}
                        <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-4">
                          
                          {/* 1. LaTeX Equation block if "equation" or "methods" type */}
                          {(activeSlide.type === "equation" || activeSlide.equation) && (
                            <div className="my-2 text-center p-4 rounded-xl border border-stone-200/50 relative group bg-stone-50/50">
                              {editingEqId ? (
                                <input
                                  type="text"
                                  value={activeSlide.equation}
                                  onChange={(e) => updateActiveSlideField("equation", e.target.value)}
                                  onBlur={() => setEditingEqId(false)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') setEditingEqId(false); }}
                                  className="w-full bg-transparent font-mono text-center text-xs focus:outline-none"
                                  style={{ color: activeTemplate.accentColor }}
                                  autoFocus
                                />
                              ) : (
                                <div 
                                  onClick={() => setEditingEqId(true)}
                                  className="font-mono text-sm font-bold cursor-text py-1 inline-block select-all"
                                  style={{ color: activeTemplate.accentColor }}
                                  title="Click to edit raw equation text"
                                >
                                  {activeSlide.equation || "\\text{Equation}(x) = f(x)"}
                                </div>
                              )}
                              <span className="absolute top-1.5 right-2 font-mono text-[8px] text-stone-300">
                                LaTeX Equation Block
                              </span>
                            </div>
                          )}

                          {/* 2. Structured Bullet points */}
                          <div className="space-y-2.5">
                            {activeSlide.bullets && activeSlide.bullets.map((b, bIdx) => {
                              const isEditing = editingBulletIndex === bIdx;
                              return (
                                <div 
                                  key={bIdx}
                                  className="flex items-start group/bullet relative hover:bg-stone-100/10 px-1 py-0.5 rounded transition-all"
                                  style={{ marginLeft: `${(b.indent || 0) * 1.5}rem` }}
                                >
                                  {/* Standard bullet icon depending on indent level */}
                                  <div className="mt-1.5 shrink-0 mr-2.5">
                                    {(b.indent || 0) > 0 ? (
                                      <CornerDownRight className="w-3 h-3 text-stone-400" />
                                    ) : (
                                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeTemplate.accentColor }} />
                                    )}
                                  </div>

                                  {/* Text bullet edit box */}
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={b.text}
                                      onChange={(e) => handleUpdateBulletText(bIdx, e.target.value)}
                                      onBlur={() => setEditingBulletIndex(null)}
                                      onKeyDown={(e) => { if (e.key === 'Enter') setEditingBulletIndex(null); }}
                                      className="bg-transparent border-b border-dashed border-stone-400 focus:outline-none focus:ring-0 flex-1 text-xs py-0.5"
                                      style={{ color: activeTemplate.textColor }}
                                      autoFocus
                                    />
                                  ) : (
                                    <span 
                                      onClick={() => setEditingBulletIndex(bIdx)}
                                      className={`text-xs cursor-text flex-1 py-0.5 select-all leading-relaxed ${b.isBold ? "font-bold" : ""}`}
                                      style={{ color: activeTemplate.textColor }}
                                    >
                                      {b.text}
                                    </span>
                                  )}

                                  {/* Indent, outdent, delete bullet icons on hover */}
                                  <div className="opacity-0 group-hover/bullet:opacity-100 flex items-center gap-1.5 ml-2 transition-all">
                                    <button
                                      onClick={() => handleUpdateBulletIndent(bIdx, 1)}
                                      className="p-0.5 hover:bg-stone-200/50 rounded text-stone-500"
                                      title="Indent right"
                                    >
                                      <Indent className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleUpdateBulletIndent(bIdx, -1)}
                                      className="p-0.5 hover:bg-stone-200/50 rounded text-stone-500"
                                      title="Indent left"
                                    >
                                      <Undo className="w-3 h-3 rotate-180" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteBullet(bIdx)}
                                      className="p-0.5 hover:bg-red-100 text-red-600 rounded"
                                      title="Delete bullet"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                            
                            {/* Fast Add Bullet trigger */}
                            <button
                              onClick={handleAddBullet}
                              className="text-[10px] font-mono text-stone-400 hover:text-stone-700 flex items-center gap-1 mt-2 uppercase font-bold"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Bullet assertion</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* B. SLIDE FOOTER */}
                    <div className="w-full flex items-center justify-between border-t border-stone-200/30 pt-4 mt-4 shrink-0 text-[10px] opacity-60">
                      <span>{presentation.title}</span>
                      <span>Athena Core Workbench</span>
                    </div>

                  </div>

                  {/* C. ACTIVE SLIDE SPEAKER NOTES (Bottom of Canvas) */}
                  <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex flex-col space-y-1 shrink-0">
                    <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-stone-500 block">
                      Scientific Speaker Notes / Presenter Lecture Transcript
                    </span>
                    <textarea
                      value={activeSlide.speakerNotes || ""}
                      onChange={(e) => updateActiveSlideField("speakerNotes", e.target.value)}
                      placeholder="Detailed script for what the presenter will state when showing this slide to the audience..."
                      className="w-full h-16 text-xs bg-stone-50 rounded-lg p-2 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-500 text-stone-700 font-serif leading-relaxed"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center border border-dashed border-stone-200 rounded-xl">
                  <span className="text-stone-400 font-serif">No slide active. Choose a slide from the sidebar.</span>
                </div>
              )}
            </div>

            {/* L3: CO-AUTHOR ASSISTANT CONTROL RAIL (Right Panel) */}
            <aside className="w-72 border-l border-stone-200 bg-white flex flex-col h-full overflow-hidden shrink-0">
              
              {/* Layout controls */}
              {activeSlide && (
                <div className="p-4 border-b border-stone-100 space-y-3 shrink-0">
                  <span className="font-mono text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Slide Layout Selector
                  </span>
                  
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { type: "title", label: "Title Cover" },
                      { type: "content", label: "Bullets List" },
                      { type: "comparison", label: "Two Column" },
                      { type: "equation", label: "Math Focus" }
                    ].map((lay) => (
                      <button
                        key={lay.type}
                        onClick={() => updateActiveSlideField("type", lay.type)}
                        className={`p-2 rounded-lg border text-center font-mono text-[10px] font-semibold transition-all ${
                          activeSlide.type === lay.type
                            ? "bg-stone-900 text-white border-stone-900"
                            : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                        }`}
                      >
                        {lay.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Smart AI Co-Author assistant Widget */}
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-stone-800" />
                    <span className="font-serif text-sm font-bold text-stone-900">
                      AI Co-Author Assistant
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-500 leading-normal font-sans">
                    Leverage Athena's full paper deconstructor to refine, rewrite, or expand the active slide.
                  </p>

                  {/* AI Quick actions */}
                  {activeSlide && (
                    <div className="space-y-2 pt-2">
                      <span className="font-mono text-[9px] uppercase font-bold text-stone-400 block tracking-wider">
                        Quick Assistant Actions
                      </span>
                      
                      <button
                        onClick={() => handleApplyAICommand("Expand this slide's core points by extracting exact numerical statistics, evaluation metrics, and hyperparameter results from the paper content.")}
                        disabled={aiWorking}
                        className="w-full text-left p-2 rounded-lg border border-stone-200 hover:border-stone-400 bg-stone-50/50 hover:bg-stone-50 font-mono text-[10px] font-semibold text-stone-800 flex items-center justify-between group transition-all"
                      >
                        <span>Deepen Scientific Rigor</span>
                        <Sparkle className="w-3 h-3 text-stone-400 group-hover:text-stone-800" />
                      </button>

                      <button
                        onClick={() => handleApplyAICommand("Condense all bullet points into short, highly precise, punchy academic phrases and eliminate wordy filler text.")}
                        disabled={aiWorking}
                        className="w-full text-left p-2 rounded-lg border border-stone-200 hover:border-stone-400 bg-stone-50/50 hover:bg-stone-50 font-mono text-[10px] font-semibold text-stone-800 flex items-center justify-between group transition-all"
                      >
                        <span>Condense Bullets</span>
                        <Sparkle className="w-3 h-3 text-stone-400 group-hover:text-stone-800" />
                      </button>

                      <button
                        onClick={() => handleApplyAICommand("Translate the entire slide contents, including the Title, all Bullet text, and the presenter speaker notes, into pristine high-level scientific German language.")}
                        disabled={aiWorking}
                        className="w-full text-left p-2 rounded-lg border border-stone-200 hover:border-stone-400 bg-stone-50/50 hover:bg-stone-50 font-mono text-[10px] font-semibold text-stone-800 flex items-center justify-between group transition-all"
                      >
                        <span>Translate to German</span>
                        <Sparkle className="w-3 h-3 text-stone-400 group-hover:text-stone-800" />
                      </button>

                      <button
                        onClick={() => handleApplyAICommand("Translate the entire slide contents, including the Title, all Bullet text, and the presenter speaker notes, back into clean English language.")}
                        disabled={aiWorking}
                        className="w-full text-left p-2 rounded-lg border border-stone-200 hover:border-stone-400 bg-stone-50/50 hover:bg-stone-50 font-mono text-[10px] font-semibold text-stone-800 flex items-center justify-between group transition-all"
                      >
                        <span>Translate to English</span>
                        <Sparkle className="w-3 h-3 text-stone-400 group-hover:text-stone-800" />
                      </button>
                    </div>
                  )}

                  {/* Custom Command Prompt box */}
                  {activeSlide && (
                    <div className="space-y-1.5 pt-4 border-t border-stone-100">
                      <label className="font-mono text-[9px] uppercase font-bold text-stone-400 block tracking-wider">
                        Custom AI Command Instruction
                      </label>
                      <textarea
                        value={aiCommand}
                        onChange={(e) => setAiCommand(e.target.value)}
                        placeholder="e.g., 'Rewrite bullet 2 to focus on memory scaling limitations O(n^2)...'"
                        className="w-full h-20 text-xs bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-stone-500 text-stone-700 leading-normal"
                        disabled={aiWorking}
                      />
                      
                      <button
                        onClick={() => handleApplyAICommand()}
                        disabled={aiWorking || !aiCommand.trim()}
                        className="w-full bg-stone-900 hover:bg-stone-800 text-white font-mono text-[10px] font-bold uppercase py-2.5 rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm disabled:opacity-40"
                      >
                        <span>{aiWorking ? "AI is rewriting slide..." : "APPLY MODIFICATION"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Start over or regenerate all slides */}
              <div className="p-4 border-t border-stone-100 bg-stone-50/50 space-y-2 shrink-0">
                <button
                  onClick={handleGenerateDeck}
                  disabled={isLoading}
                  className="w-full bg-white text-stone-700 border border-stone-200 hover:border-stone-300 font-mono text-[10px] font-bold uppercase py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3 text-stone-400" />
                  <span>Regenerate Entire Deck</span>
                </button>
              </div>

            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
