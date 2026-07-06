import React from "react";

interface LaTeXRendererProps {
  text: string;
  block?: boolean;
}

/**
 * High-performance KaTeX renderer that dynamically parses mixed Markdown, standard prose,
 * and mathematical expressions (block $$ and inline $) and styles them via KaTeX CSS/JS.
 */
export const LaTeXRenderer: React.FC<LaTeXRendererProps> = ({ text, block = false }) => {
  // If explicitly requested as a block equation, render it entirely inside KaTeX
  if (block) {
    try {
      const html = (window as any).katex.renderToString(text, {
        displayMode: true,
        throwOnError: false,
      });
      return <div className="katex-block-wrapper my-2" dangerouslySetInnerHTML={{ __html: html }} />;
    } catch (e) {
      return <code className="font-mono text-xs text-stone-500 bg-stone-100 px-1 py-0.5 rounded">{text}</code>;
    }
  }

  // Parse text for inline ($...$) and block ($$...$$) segments
  // Matches "$$...$$" first, then "$...$"
  const regex = /(\$\{[\s\S]*?\}|\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g;
  const parts = text.split(regex);

  return (
    <span className="font-serif leading-relaxed text-stone-800">
      {parts.map((part, idx) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          // Block Equation
          const rawMath = part.slice(2, -2).trim();
          try {
            const html = (window as any).katex.renderToString(rawMath, {
              displayMode: true,
              throwOnError: false,
            });
            return (
              <span
                key={idx}
                className="block my-3 text-center overflow-x-auto select-all"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            return (
              <span key={idx} className="block my-2 text-center font-mono text-stone-500 bg-stone-100 p-2 rounded">
                {rawMath}
              </span>
            );
          }
        } else if (part.startsWith("$") && part.endsWith("$")) {
          // Inline Equation
          const rawMath = part.slice(1, -1).trim();
          try {
            const html = (window as any).katex.renderToString(rawMath, {
              displayMode: false,
              throwOnError: false,
            });
            return (
              <span
                key={idx}
                className="inline-block px-1 select-all align-middle"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            return (
              <code key={idx} className="font-mono text-[11px] text-stone-500 bg-stone-100 px-1 rounded">
                {rawMath}
              </code>
            );
          }
        } else {
          // Standard Markdown/Prose
          // Let's do simple paragraph splitting or render directly
          return <span key={idx}>{part}</span>;
        }
      })}
    </span>
  );
};
