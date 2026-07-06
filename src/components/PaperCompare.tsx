import React, { useState } from "react";
import { Paper, ComparisonMatrix } from "../types";
import { 
  GitMerge, 
  Plus, 
  Sparkles, 
  HelpCircle,
  TrendingUp,
  FileText,
  Trash2
} from "lucide-react";

interface PaperCompareProps {
  currentPaper: Paper;
}

interface ExternalPaperInput {
  title: string;
  abstract: string;
}

export const PaperCompare: React.FC<PaperCompareProps> = ({ currentPaper }) => {
  const [comparisonPapers, setComparisonPapers] = useState<ExternalPaperInput[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newAbstract, setNewAbstract] = useState("");
  const [matrix, setMatrix] = useState<ComparisonMatrix | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Template suggestions for comparison
  const addTemplatePaper = (title: string, abstract: string) => {
    setComparisonPapers([...comparisonPapers, { title, abstract }]);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAbstract.trim()) return;
    setComparisonPapers([...comparisonPapers, { title: newTitle, abstract: newAbstract }]);
    setNewTitle("");
    setNewAbstract("");
  };

  const handleRemove = (index: number) => {
    const updated = [...comparisonPapers];
    updated.splice(index, 1);
    setComparisonPapers(updated);
  };

  const generateMatrix = async () => {
    setIsLoading(true);
    setError(null);
    setMatrix(null);

    // Collect all papers to contrast (Active Paper + comparison papers)
    const papersPayload = [
      { title: currentPaper.title, abstract: currentPaper.abstract },
      ...comparisonPapers,
    ];

    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ papers: papersPayload }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate comparative metrics.");
      }

      const data = await response.json();
      setMatrix(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred compiling the literature matrix.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Introduction Banner */}
      <div className="bg-white border border-stone-200/80 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="font-serif text-xl font-medium text-stone-900 flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-stone-600" /> Literature Synthesis Matrix
          </h2>
          <p className="text-xs text-stone-500 leading-relaxed font-sans max-w-xl">
            Synthesize differences between your current loaded manuscript and competitor baselines or foundational literature. Build an instant, multi-dimensional academic critique grid.
          </p>
        </div>
        {comparisonPapers.length > 0 && (
          <button
            onClick={generateMatrix}
            disabled={isLoading}
            className="px-5 py-2.5 bg-stone-900 hover:bg-stone-850 text-white rounded-xl text-xs font-semibold font-sans flex items-center gap-1.5 shadow-sm transition-all shrink-0 disabled:opacity-40"
          >
            <Sparkles className="w-4 h-4" /> 
            {isLoading ? "Synthesizing Literature..." : "Compile Matrix"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 1/3: Control Panel for comparison models */}
        <div className="lg:col-span-1 space-y-6">
          {/* Active Manuscript Card */}
          <div className="bg-[#faf9f6] border border-stone-200/40 p-4 rounded-xl space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 font-semibold block">
              Primary Loaded Manuscript
            </span>
            <h4 className="text-xs font-semibold text-stone-800 line-clamp-2 leading-relaxed">
              {currentPaper.title}
            </h4>
            <p className="text-[11px] text-stone-500 line-clamp-3 italic font-serif">
              "{currentPaper.abstract}"
            </p>
          </div>

          {/* List of Contrastive Papers */}
          <div className="bg-white border border-stone-200/60 p-5 rounded-xl space-y-4 shadow-sm">
            <h3 className="font-serif text-xs font-bold text-stone-800 border-b border-stone-100 pb-1.5 uppercase tracking-wider">
              Contrastive Papers ({comparisonPapers.length})
            </h3>

            {comparisonPapers.length === 0 ? (
              <p className="text-[11px] text-stone-400 leading-relaxed py-4 text-center">
                Add standard academic baseline papers, or choose from the templates below to construct comparisons.
              </p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                {comparisonPapers.map((paper, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-[#faf9f6] border border-stone-100 rounded-lg group hover:border-stone-200 transition-all"
                  >
                    <div className="truncate pr-4">
                      <h5 className="text-xs font-semibold text-stone-700 truncate">{paper.title}</h5>
                      <span className="text-[9px] font-mono text-stone-400">External Paper Reference</span>
                    </div>
                    <button
                      onClick={() => handleRemove(idx)}
                      className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-600 p-1 rounded hover:bg-stone-100 transition-all shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Template Papers Quick Add */}
            <div className="space-y-2 pt-2 border-t border-stone-50">
              <span className="text-[10px] font-mono font-semibold text-stone-400 uppercase tracking-widest block">
                Quick Template Baselines
              </span>
              <div className="space-y-1">
                <button
                  onClick={() =>
                    addTemplatePaper(
                      "Attention Is All You Need (Vaswani et al.)",
                      "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks, including an encoder and a decoder. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely."
                    )
                  }
                  className="w-full text-left text-[11px] text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 p-2 rounded transition-all truncate block"
                >
                  + Transformer Baselines (Vaswani et al.)
                </button>
                <button
                  onClick={() =>
                    addTemplatePaper(
                      "Deep Residual Learning for Image Recognition (He et al.)",
                      "Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those previously used. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions."
                    )
                  }
                  className="w-full text-left text-[11px] text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 p-2 rounded transition-all truncate block"
                >
                  + ResNet Convolutional Proofs (He et al.)
                </button>
              </div>
            </div>
          </div>

          {/* Form to Add Custom Abstract */}
          <form
            onSubmit={handleAddCustom}
            className="bg-white border border-stone-200/60 p-5 rounded-xl space-y-3 shadow-sm"
          >
            <h3 className="font-serif text-xs font-bold text-stone-800 border-b border-stone-100 pb-1.5 uppercase tracking-wider">
              Add Custom Paper Abstract
            </h3>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-stone-400 font-semibold block">Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. BERT: Pre-training of Deep Bidirectional..."
                className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 focus:bg-white transition-all font-serif"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-stone-400 font-semibold block">Abstract / Key Claims Text</label>
              <textarea
                value={newAbstract}
                onChange={(e) => setNewAbstract(e.target.value)}
                placeholder="Paste abstract or summary paragraphs here..."
                rows={3}
                className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 focus:bg-white transition-all font-serif resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={!newTitle.trim() || !newAbstract.trim()}
              className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 rounded-lg text-xs font-semibold font-sans flex items-center justify-center gap-1 transition-all disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" /> Add Paper Reference
            </button>
          </form>
        </div>

        {/* Right 2/3: Comparison Grid */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white border border-stone-200/60 rounded-2xl shadow-sm">
              <Sparkles className="w-10 h-10 stroke-[1] text-stone-800 animate-spin mb-4" />
              <h4 className="font-serif text-base font-semibold text-stone-800">Compiling Literature Matrix</h4>
              <p className="text-xs text-stone-500 max-w-sm mt-1.5 font-sans leading-relaxed">
                Gemini is cross-referencing claims, analyzing methodologies, inspecting experimental controls, and synthesizing core limitations. This takes a few seconds...
              </p>
            </div>
          ) : error ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white border border-stone-200/60 rounded-2xl shadow-sm text-red-800 gap-3">
              <HelpCircle className="w-10 h-10 stroke-[1] text-red-500" />
              <div>
                <h4 className="font-serif text-base font-semibold">Synthesis Pipeline Interrupted</h4>
                <p className="text-xs text-red-600 max-w-md mx-auto mt-1 leading-normal font-mono">
                  {error}
                </p>
              </div>
            </div>
          ) : matrix ? (
            <div className="bg-white border border-stone-200/60 rounded-2xl shadow-sm overflow-hidden divide-y divide-stone-100">
              <div className="px-6 py-4 bg-stone-50/50 flex items-center justify-between border-b border-stone-100">
                <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">
                  Synthesized Evaluation Grid
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 border border-emerald-100 rounded-full font-semibold">
                  ✓ Verified Grounding
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50 text-stone-500 border-b border-stone-200 font-mono text-[10px] uppercase tracking-wider">
                      <th className="p-4 font-semibold w-1/4">Paper Identifier</th>
                      <th className="p-4 font-semibold w-1/4">Core Methodology</th>
                      <th className="p-4 font-semibold w-1/4">Claimed Breakthrough</th>
                      <th className="p-4 font-semibold w-1/4">Assumptions & Gaps</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {matrix.papers.map((p, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/30 transition-all">
                        <td className="p-4 font-serif font-semibold text-stone-900 align-top">
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-stone-400 uppercase">Paper #{idx + 1}</span>
                            <p className="leading-snug">{p.title}</p>
                          </div>
                        </td>
                        <td className="p-4 text-stone-600 font-sans leading-relaxed align-top">
                          <p>{p.methodology}</p>
                          <div className="mt-2 text-[10px] font-mono text-stone-400">
                            <span className="font-semibold">Datasets:</span> {p.datasets}
                          </div>
                        </td>
                        <td className="p-4 text-stone-600 font-sans leading-relaxed align-top">
                          {p.contributions}
                        </td>
                        <td className="p-4 text-stone-600 font-serif leading-relaxed italic align-top border-l border-stone-50">
                          {p.limitations}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white border border-stone-200/60 rounded-2xl shadow-sm border-dashed">
              <TrendingUp className="w-10 h-10 stroke-[1] text-stone-300 mb-3" />
              <h4 className="font-serif text-sm text-stone-600 font-medium">Literature Matrix Empty</h4>
              <p className="text-xs text-stone-400 max-w-sm mt-1 leading-normal">
                Add at least one contrastive reference paper or click our template baselines on the left, then click "Compile Matrix" to generate structured peer matrix benchmarks.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
