import React, { useState, useRef, useEffect } from "react";
import { Message, AnalysisMode, GroundedQuote } from "../types";
import { LaTeXRenderer } from "./LaTeXRenderer";
import { 
  Send, 
  Sparkles, 
  CheckCircle2, 
  BookOpen, 
  Flame, 
  Cpu, 
  HelpCircle,
  Clock,
  User,
  ShieldCheck
} from "lucide-react";

interface ChatContainerProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  activeMode: AnalysisMode;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  onSendMessage,
  isLoading,
  activeMode,
}) => {
  const [inputText, setInputText] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText("");
  };

  // Pre-configured deep-scholarly query templates to guide high-level analysis
  const getQuickPrompts = () => {
    switch (activeMode) {
      case AnalysisMode.DEEP_SYNTHESIS:
        return [
          "Expose the core conceptual breakthrough of this architecture.",
          "Draft a comprehensive 3-paragraph executive summary for senior director review.",
          "Identify the underlying theoretical precursors of this approach."
        ];
      case AnalysisMode.METHODOLOGY_AUDIT:
        return [
          "Scrutinize the experimental controls and potential selection biases.",
          "Audit the baseline comparisons—did they cherry-pick models or tasks?",
          "Are there unstated, high-risk assumptions in their setup?"
        ];
      case AnalysisMode.PROOF_CHECKER:
        return [
          "Step through the mathematical logic of the main equations.",
          "Explain the variables and statistical significance values.",
          "Identify any potential math hand-waving or unproven transitions."
        ];
      case AnalysisMode.PEER_REVIEW_GRIP:
        return [
          "Act as Reviewer #2 and ruthlessly grill this paper's core claims.",
          "What are the hardest questions the authors must answer to defend this?",
          "Draft an official rebuttal letter to a major methodology critique."
        ];
      case AnalysisMode.CITATIONAL_NETWORK:
        return [
          "Detail how this paper contrasts with the classical architectures.",
          "Trace the scientific lineage of the core mechanism.",
          "Provide a map of alternative works proposing opposite solutions."
        ];
    }
  };

  /**
   * Separates the text of the message from any <quotes_audit> JSON block
   * so we can render the verified quotes as a separate visual element.
   */
  const parseMessageContent = (msgText: string) => {
    const quotesRegex = /<quotes_audit>([\s\S]*?)<\/quotes_audit>/i;
    const match = msgText.match(quotesRegex);
    
    let cleanText = msgText;
    let quotes: GroundedQuote[] = [];

    if (match) {
      cleanText = msgText.replace(quotesRegex, "").trim();
      try {
        quotes = JSON.parse(match[1]);
      } catch (e) {
        console.warn("Failed to parse grounding quotes JSON", e);
      }
    }

    return { cleanText, quotes };
  };

  const getModeLabelAndDesc = () => {
    switch (activeMode) {
      case AnalysisMode.DEEP_SYNTHESIS:
        return { label: "Theory Synthesis", desc: "Formulating high-level conceptual breakthroughs and theoretical lineages." };
      case AnalysisMode.METHODOLOGY_AUDIT:
        return { label: "Methodology Audit", desc: "Rigorous critique of controls, assumptions, biases, and empirical gaps." };
      case AnalysisMode.PROOF_CHECKER:
        return { label: "Proof Inspector", desc: "Step-by-step mathematical validation, derivation checking, and variables glossary." };
      case AnalysisMode.PEER_REVIEW_GRIP:
        return { label: "Debate & Defense Core", desc: "Constructive doctoral-level sparring. Challenge claims or defend theorems." };
      case AnalysisMode.CITATIONAL_NETWORK:
        return { label: "Citation Lineage", desc: "Tracing predecessor mechanisms, alternative approaches, and literature graphs." };
    }
  };

  const modeInfo = getModeLabelAndDesc();

  return (
    <div className="h-full flex flex-col bg-[#faf9f6]">
      {/* Header Banner */}
      <div className="px-6 py-4 bg-white border-b border-stone-200/80 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-serif text-sm">
            α
          </div>
          <div>
            <h3 className="font-serif text-sm font-semibold text-stone-900 flex items-center gap-1.5">
              Professor Athena Workbench 
              <span className="text-[10px] font-mono text-stone-400 font-medium px-1.5 py-0.5 bg-stone-100 rounded border border-stone-200/30">
                SOTA RAG v3.5
              </span>
            </h3>
            <p className="text-[11px] text-stone-500 font-sans leading-normal">
              {modeInfo.desc}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Scrollbox */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 select-none py-12">
            <Cpu className="w-10 h-10 stroke-[1] mb-3 text-stone-300 animate-pulse" />
            <h4 className="font-serif text-sm text-stone-700 font-medium">Research Terminal Initiated</h4>
            <p className="text-xs max-w-sm leading-relaxed mt-1.5">
              Load an academic paper and select an analytical pipeline, or click one of the quick scholarly prompts below to begin.
            </p>
            
            {/* Quick Prompts Container */}
            <div className="grid grid-cols-1 gap-2 max-w-md w-full mt-6">
              {getQuickPrompts().map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => onSendMessage(prompt)}
                  className="text-left text-xs p-3 bg-white hover:bg-stone-50 text-stone-700 rounded-xl border border-stone-200/60 shadow-sm hover:border-stone-300 transition-all font-sans leading-snug"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => {
              const isAssistant = msg.role === "assistant";
              const { cleanText, quotes } = parseMessageContent(msg.text);

              return (
                <div
                  key={msg.id}
                  className={`flex gap-4 ${isAssistant ? "items-start" : "items-start flex-row-reverse"}`}
                >
                  {/* Icon Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border font-mono text-xs ${
                      isAssistant
                        ? "bg-stone-900 text-stone-100 border-stone-800"
                        : "bg-white text-stone-700 border-stone-300"
                    }`}
                  >
                    {isAssistant ? "A" : <User className="w-3.5 h-3.5" />}
                  </div>

                  {/* Bubble Container */}
                  <div className={`max-w-[85%] space-y-2`}>
                    {/* Timestamp & Meta */}
                    <div
                      className={`flex items-center gap-2 text-[10px] font-mono text-stone-400 ${
                        isAssistant ? "justify-start" : "justify-end"
                      }`}
                    >
                      <span className="font-medium">
                        {isAssistant ? "Professor Athena" : "Scholar Request"}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {msg.timestamp}
                      </span>
                    </div>

                    {/* Text Bubble */}
                    <div
                      className={`p-5 rounded-2xl border text-sm leading-relaxed ${
                        isAssistant
                          ? "bg-white border-stone-200/80 shadow-sm"
                          : "bg-stone-800 text-stone-50 border-stone-900 shadow-sm font-sans"
                      }`}
                    >
                      {/* Render text with Latex support */}
                      {isAssistant ? (
                        <div className="font-serif text-stone-800 space-y-4">
                          <LaTeXRenderer text={cleanText} />
                        </div>
                      ) : (
                        <p className="font-sans text-stone-100 whitespace-pre-wrap">{cleanText}</p>
                      )}
                    </div>

                    {/* Multi-Pass page references */}
                    {isAssistant && msg.pageReferences && msg.pageReferences.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-stone-500 pl-1">
                        <span className="font-medium">Direct Grounding Pages:</span>
                        {msg.pageReferences.map((page) => (
                          <span
                            key={page}
                            className="bg-stone-100 hover:bg-stone-200 border border-stone-200/30 text-stone-700 px-2 py-0.5 rounded transition-all cursor-pointer"
                          >
                            Page {page}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* EXPANDABLE CLAIMS/QUOTES AUDIT VERIFICATION */}
                    {isAssistant && quotes && quotes.length > 0 && (
                      <div className="bg-emerald-50/30 hover:bg-emerald-50/50 border border-emerald-100/60 rounded-xl p-4 transition-all mt-3">
                        <h5 className="text-[10px] uppercase tracking-widest text-emerald-800 font-mono font-bold flex items-center gap-1.5 mb-2 border-b border-emerald-100/30 pb-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Scholarly Grounding Audit
                        </h5>
                        <div className="space-y-2">
                          {quotes.map((q, idx) => (
                            <div key={idx} className="text-xs space-y-1">
                              <div className="flex items-center justify-between font-mono text-[9px] text-emerald-700 font-semibold">
                                <span>Verified Quotation #{idx + 1}</span>
                                <span>Page {q.page}</span>
                              </div>
                              <p className="text-stone-700 leading-normal bg-white/70 p-2 rounded-lg border border-emerald-100/20 italic font-serif">
                                "{q.text}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Simulated/Thinking indicator */}
            {isLoading && (
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center border font-mono text-xs bg-stone-900 text-stone-100 border-stone-800 animate-spin">
                  α
                </div>
                <div className="max-w-[85%] space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-stone-400">
                    <span className="font-semibold">Professor Athena is analyzing verified text...</span>
                  </div>
                  <div className="p-4 bg-white border border-stone-200/80 shadow-sm rounded-2xl flex items-center gap-2 text-xs text-stone-500 italic font-serif">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-100" />
                      <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-200" />
                      <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-300" />
                    </div>
                    Verifying derivations, citations, and formulating Ivy League peer feedback...
                  </div>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>
        )}
      </div>

      {/* Input Box Area */}
      <div className="p-4 bg-white border-t border-stone-200/80 shadow-inner shrink-0">
        {messages.length > 0 && (
          <div className="flex gap-2 justify-center mb-3">
            {getQuickPrompts().slice(0, 2).map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => onSendMessage(prompt)}
                className="text-[10px] bg-stone-50 hover:bg-stone-100 border border-stone-200/60 px-2.5 py-1 text-stone-600 rounded-lg font-medium transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder={
              isLoading
                ? "Deep-grounding reasoning engine active..."
                : "Ask Professor Athena about theorems, p-values, or methods..."
            }
            className="flex-1 text-sm px-4 py-3 bg-stone-50 hover:bg-stone-100/50 focus:bg-white rounded-xl border border-stone-200 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all font-serif"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="px-4 py-3 bg-stone-950 hover:bg-stone-850 text-white rounded-xl font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
