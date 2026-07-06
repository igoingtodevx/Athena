import React, { useState } from "react";
import { Paper, AnalysisMode } from "../types";
import { LaTeXRenderer } from "./LaTeXRenderer";
import { 
  BookOpen, 
  Award, 
  Percent, 
  GitBranch, 
  FileText, 
  Flame, 
  HelpCircle,
  Play,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Layers
} from "lucide-react";

interface SidebarProps {
  paper: Paper | null;
  activeMode: AnalysisMode;
  onSelectMode: (mode: AnalysisMode) => void;
  onAskQuestionAboutSection: (prompt: string, mode: AnalysisMode) => void;
  onSelectPageRange: (range: [number, number] | null) => void;
  selectedPageRange: [number, number] | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  paper,
  activeMode,
  onSelectMode,
  onAskQuestionAboutSection,
  onSelectPageRange,
  selectedPageRange
}) => {
  const [activeTab, setActiveTab] = useState<"structure" | "audit" | "formulas" | "citations">("structure");

  if (!paper) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-stone-400 select-none">
        <Layers className="w-12 h-12 stroke-[1] mb-4 text-stone-300 animate-pulse" />
        <h3 className="font-serif text-lg text-stone-700 font-medium mb-1">No Manuscript Loaded</h3>
        <p className="text-xs max-w-xs leading-normal">
          Upload an academic PDF to activate the Athena multi-pass parser and build your structural workspace.
        </p>
      </div>
    );
  }

  // Helper to color-code evidence strength
  const getEvidenceBadge = (evidence: "High" | "Medium" | "Low") => {
    switch (evidence) {
      case "High":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-mono font-medium px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
            <CheckCircle className="w-3 h-3" /> High Rigor
          </span>
        );
      case "Medium":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-mono font-medium px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
            <AlertTriangle className="w-3 h-3" /> Medium Rigor
          </span>
        );
      case "Low":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-mono font-medium px-2 py-0.5 bg-red-50 text-red-800 border border-red-200 rounded-full">
            <XCircle className="w-3 h-3" /> Low Rigor
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-stone-200/80">
      {/* Paper Title Header */}
      <div className="p-6 border-b border-stone-100 bg-stone-50/50">
        <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-medium block mb-1">
          Manuscript Workspace
        </span>
        <h2 className="font-serif text-lg font-medium text-stone-900 leading-snug line-clamp-2">
          {paper.title}
        </h2>
        <p className="text-xs text-stone-500 font-sans mt-1 line-clamp-1">
          {paper.authors || "Unknown Scholars"}
        </p>
        <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-stone-400">
          <span className="px-2 py-0.5 bg-stone-100 rounded text-stone-600 font-medium">
            {paper.totalPages} Pages
          </span>
          <span>•</span>
          <span>{paper.fileSize}</span>
        </div>
      </div>

      {/* Analytical Pipeline Selectors */}
      <div className="p-4 bg-stone-50 border-b border-stone-100">
        <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-medium block mb-2">
          Select Review Core
        </span>
        <div className="grid grid-cols-2 gap-1">
          {[
            { mode: AnalysisMode.DEEP_SYNTHESIS, icon: BookOpen, label: "Theory Synthesis" },
            { mode: AnalysisMode.METHODOLOGY_AUDIT, icon: Award, label: "Methodology Audit" },
            { mode: AnalysisMode.PROOF_CHECKER, icon: Percent, label: "Proof Inspector" },
            { mode: AnalysisMode.PEER_REVIEW_GRIP, icon: Flame, label: "Debate & Defense" },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeMode === item.mode;
            return (
              <button
                key={item.mode}
                id={`btn-sidebar-mode-${item.mode}`}
                onClick={() => onSelectMode(item.mode)}
                className={`flex items-center gap-2 p-2 rounded text-left transition-all ${
                  isActive
                    ? "bg-stone-900 text-white shadow-sm"
                    : "bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-stone-300" : "text-stone-500"}`} />
                <span className="text-xs font-medium truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-stone-100 text-xs font-medium">
        <button
          id="sidebar-tab-structure"
          onClick={() => setActiveTab("structure")}
          className={`flex-1 py-3 text-center transition-all border-b-2 ${
            activeTab === "structure"
              ? "border-stone-900 text-stone-900 font-semibold"
              : "border-transparent text-stone-400 hover:text-stone-600"
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Map
          </div>
        </button>
        <button
          id="sidebar-tab-audit"
          onClick={() => setActiveTab("audit")}
          className={`flex-1 py-3 text-center transition-all border-b-2 ${
            activeTab === "audit"
              ? "border-stone-900 text-stone-900 font-semibold"
              : "border-transparent text-stone-400 hover:text-stone-600"
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Award className="w-3.5 h-3.5" /> Claims Audit
          </div>
        </button>
        <button
          id="sidebar-tab-formulas"
          onClick={() => setActiveTab("formulas")}
          className={`flex-1 py-3 text-center transition-all border-b-2 ${
            activeTab === "formulas"
              ? "border-stone-900 text-stone-900 font-semibold"
              : "border-transparent text-stone-400 hover:text-stone-600"
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Percent className="w-3.5 h-3.5" /> Formulas
          </div>
        </button>
        <button
          id="sidebar-tab-citations"
          onClick={() => setActiveTab("citations")}
          className={`flex-1 py-3 text-center transition-all border-b-2 ${
            activeTab === "citations"
              ? "border-stone-900 text-stone-900 font-semibold"
              : "border-transparent text-stone-400 hover:text-stone-600"
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5" /> Lineage
          </div>
        </button>
      </div>

      {/* Tab Contents Area */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {/* TAB 1: STRUCTURE MAP */}
        {activeTab === "structure" && (
          <div className="space-y-6">
            {/* Scope filter page range selector */}
            <div className="bg-stone-50 border border-stone-200/60 rounded-lg p-3">
              <h4 className="text-[11px] font-mono uppercase text-stone-500 font-medium mb-1.5 flex items-center justify-between">
                <span>Active Research Scope</span>
                {selectedPageRange && (
                  <button
                    onClick={() => onSelectPageRange(null)}
                    className="text-[10px] text-red-600 hover:underline capitalize"
                  >
                    Clear Focus
                  </button>
                )}
              </h4>
              <p className="text-xs text-stone-600 leading-normal mb-2.5">
                {selectedPageRange 
                  ? `Currently focusing deep review exclusively on pages ${selectedPageRange[0]} to ${selectedPageRange[1]}.`
                  : "Assessing full manuscript. Grounding context will pull dynamically via layout scoring."
                }
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onSelectPageRange([1, Math.min(3, paper.totalPages)])}
                  className={`text-[11px] px-2.5 py-1 rounded border transition-all ${
                    selectedPageRange && selectedPageRange[0] === 1
                      ? "bg-stone-900 text-white border-stone-900"
                      : "bg-white hover:bg-stone-50 text-stone-700 border-stone-200"
                  }`}
                >
                  Intro & Methods
                </button>
                {paper.totalPages > 4 && (
                  <button
                    onClick={() => onSelectPageRange([Math.max(1, paper.totalPages - 3), paper.totalPages])}
                    className={`text-[11px] px-2.5 py-1 rounded border transition-all ${
                      selectedPageRange && selectedPageRange[1] === paper.totalPages
                        ? "bg-stone-900 text-white border-stone-900"
                        : "bg-white hover:bg-stone-50 text-stone-700 border-stone-200"
                    }`}
                  >
                    Discussion & Refs
                  </button>
                )}
              </div>
            </div>

            {/* Abstract */}
            <div>
              <h3 className="font-serif font-medium text-stone-900 mb-2 border-b border-stone-100 pb-1 flex items-center gap-2">
                <FileText className="w-4 h-4 text-stone-500" /> Abstract Analysis
              </h3>
              <p className="font-serif italic text-xs leading-relaxed text-stone-600 bg-[#faf9f6] p-4 rounded-lg border border-stone-100">
                {paper.abstract || "Extraction in progress..."}
              </p>
            </div>

            {/* Outline list */}
            <div>
              <h3 className="font-serif font-medium text-stone-900 mb-2 border-b border-stone-100 pb-1 flex items-center gap-2">
                <Layers className="w-4 h-4 text-stone-500" /> Manuscript Map
              </h3>
              <div className="space-y-1.5">
                {paper.outline.map((item, idx) => (
                  <div
                    key={idx}
                    className={`group flex items-center justify-between p-2 rounded hover:bg-stone-50 transition-all border border-transparent hover:border-stone-100 ${
                      item.level === 2 ? "ml-4 text-[11px]" : "font-medium text-xs text-stone-800"
                    }`}
                  >
                    <span className="truncate pr-4">{item.title}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-stone-400">Page {item.page}</span>
                      <button
                        onClick={() => {
                          onSelectPageRange([item.page, Math.min(item.page + 2, paper.totalPages)]);
                          onAskQuestionAboutSection(
                            `Analyze and explain the methodology and core findings in '${item.title}' located around Page ${item.page}.`,
                            activeMode
                          );
                        }}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-mono text-stone-600 hover:text-stone-900 bg-stone-200/50 px-1.5 py-0.5 rounded transition-all"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" /> Analyze
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AUDIT */}
        {activeTab === "audit" && (
          <div className="space-y-4">
            <div className="bg-stone-50 border border-stone-100 p-3 rounded-lg mb-4">
              <span className="text-[10px] font-mono text-stone-500 font-medium uppercase tracking-wider block mb-1">
                Peer Review Core
              </span>
              <p className="text-[11px] text-stone-600 leading-normal">
                Athena has scanned key assertions in the paper. Click any claim to audit its logic, examine underlying assumptions, or test validity.
              </p>
            </div>

            {paper.audit?.map((item) => (
              <div
                key={item.id}
                className="group p-4 bg-white border border-stone-200/80 rounded-lg hover:shadow-sm hover:border-stone-300 transition-all flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-mono text-stone-400 font-medium">Page {item.page}</span>
                  {getEvidenceBadge(item.evidence)}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-stone-800 leading-snug font-sans group-hover:text-stone-950">
                    "{item.assertion}"
                  </h4>
                  <p className="text-xs text-stone-600 mt-2 italic font-serif leading-relaxed border-l-2 border-stone-200 pl-2">
                    {item.critique}
                  </p>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      onSelectPageRange([item.page, item.page]);
                      onAskQuestionAboutSection(
                        `Audit the claim: "${item.assertion}". The critique notes: "${item.critique}". Let's deep-dive into the underlying datasets, assumptions, and mathematical soundness on page ${item.page}.`,
                        AnalysisMode.METHODOLOGY_AUDIT
                      );
                    }}
                    className="inline-flex items-center gap-1.5 text-[10px] font-mono font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/85 px-2.5 py-1 rounded transition-all border border-stone-200/30"
                  >
                    <HelpCircle className="w-3 h-3" /> Scrutinize Claim
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: FORMULAS */}
        {activeTab === "formulas" && (
          <div className="space-y-4">
            <div className="bg-stone-50 border border-stone-100 p-3 rounded-lg mb-4">
              <span className="text-[10px] font-mono text-stone-500 font-medium uppercase tracking-wider block mb-1">
                LaTeX Formula Glossary
              </span>
              <p className="text-[11px] text-stone-600 leading-normal">
                Extracted mathematical derivations. Click "Check Proof" to verify the proof flow, variables definition, and potential transitions.
              </p>
            </div>

            {paper.formulas?.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-white border border-stone-200/80 rounded-lg hover:shadow-sm hover:border-stone-300 transition-all"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 mb-2">
                  <span className="font-semibold text-stone-600">{item.name}</span>
                  <span>Page {item.page}</span>
                </div>
                
                {/* Equation box with Katex */}
                <div className="bg-stone-50 p-2.5 rounded border border-stone-100 flex items-center justify-center my-2 overflow-x-auto">
                  <LaTeXRenderer text={item.latex} block={true} />
                </div>

                <p className="text-xs text-stone-600 leading-normal mt-2.5 font-sans">
                  {item.description}
                </p>

                <div className="flex justify-end mt-3 pt-2 border-t border-stone-50">
                  <button
                    onClick={() => {
                      onSelectPageRange([item.page, item.page]);
                      onAskQuestionAboutSection(
                        `Analyze the math formula '${item.name}' ($${item.latex}$) on Page ${item.page}. Please check the derivation logic, explain variables, and audit for mathematical correctness or unstated assumptions.`,
                        AnalysisMode.PROOF_CHECKER
                      );
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-mono text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded transition-all"
                  >
                    Check Proof
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: CITATIONS LINEAGE */}
        {activeTab === "citations" && (
          <div className="space-y-4">
            <div className="bg-stone-50 border border-stone-100 p-3 rounded-lg mb-4">
              <span className="text-[10px] font-mono text-stone-500 font-medium uppercase tracking-wider block mb-1">
                Literature Lineage
              </span>
              <p className="text-[11px] text-stone-600 leading-normal">
                Mapping foundational precursor literature. Unpack the scientific lineage to contextualize where ideas arose.
              </p>
            </div>

            {paper.literatureLineage?.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-white border border-stone-200/80 rounded-lg hover:shadow-sm hover:border-stone-300 transition-all flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2 border-b border-stone-50 pb-1.5">
                  <span className="text-xs font-semibold text-stone-800 font-serif">
                    {item.citation}
                  </span>
                  <span className="text-[9px] uppercase font-mono tracking-wider bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                    {item.relation}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <p className="text-stone-700 leading-relaxed font-sans">
                    <span className="font-semibold text-stone-500">Mechanism: </span>
                    {item.context}
                  </p>
                  <p className="text-stone-600 leading-normal italic font-serif">
                    <span className="font-semibold text-stone-400 not-italic font-sans">Impact: </span>
                    {item.impact}
                  </p>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      onAskQuestionAboutSection(
                        `How does this paper build upon, contrast, or modify the mechanisms presented in ${item.citation}? Address: "${item.context}" and how it directly impacts this manuscript's methodology.`,
                        AnalysisMode.CITATIONAL_NETWORK
                      );
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-mono text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded transition-all"
                  >
                    Trace Precursor Link
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
