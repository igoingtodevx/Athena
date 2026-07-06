import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Configure body parsers for large payloads of parsed academic papers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize the SOTA Gemini API Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export enum AnalysisMode {
  DEEP_SYNTHESIS = "DEEP_SYNTHESIS",
  METHODOLOGY_AUDIT = "METHODOLOGY_AUDIT",
  PROOF_CHECKER = "PROOF_CHECKER",
  PEER_REVIEW_GRIP = "PEER_REVIEW_GRIP",
  CITATIONAL_NETWORK = "CITATIONAL_NETWORK"
}

/**
 * API Route: Analyze
 * Extracts structural metadata, high-fidelity outline, peer-review assertions audit,
 * math formulas dictionary, and citations network using strict JSON schemas.
 */
app.post("/api/analyze", async (req, res) => {
  try {
    const { pages } = req.body;
    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return res.status(400).json({ error: "Missing paper pages payload." });
    }

    const totalPages = pages.length;
    
    // Create an abbreviated text representation of the paper for dense schema analysis
    // We sample pages to fit well within extraction limits (First 5 pages + Last 5 pages + Middle pages)
    // This captures Title, Abstract, Intro, Methodology, and References perfectly.
    let textSample = "";
    pages.forEach((pageText, idx) => {
      const pageNum = idx + 1;
      if (pageNum <= 6 || pageNum > totalPages - 4 || pageNum % 3 === 0) {
        textSample += `--- [PAGE ${pageNum}] ---\n${pageText}\n\n`;
      }
    });

    const systemInstruction = `You are an elite, world-class academic peer reviewer (such as for Nature, Science, or NeurIPS) and an esteemed Ivy League professor. 
Your task is to comprehensively analyze the provided academic paper text sample and extract its structured metadata, structural outline (table of contents), critical methodology and claims audit, mathematical equations, and literature lineage.

Provide your feedback in a perfectly rigorous, mathematically precise, objective, and deeply scholarly tone. 
For mathematical formulas, extract critical core equations and format them in beautiful, valid LaTeX syntax (e.g. using standard symbol notations).`;

    const prompt = `Analyze this academic paper text. It contains ${totalPages} total pages.
Here is the sampled text content:
${textSample}

Extract the metadata, outline (with exact page numbers), a deep methodology/claims audit, core mathematical formulas, and literature lineage.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "The official academic title of the paper.",
            },
            authors: {
              type: Type.STRING,
              description: "Names and affiliations of authors.",
            },
            abstract: {
              type: Type.STRING,
              description: "The full abstract or a comprehensive 2-paragraph academic summary of the paper.",
            },
            outline: {
              type: Type.ARRAY,
              description: "Hierarchical structural outline of the paper's main sections and subsections.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Section name (e.g. '1. Introduction', '3.2 Proof of Lemma 1')." },
                  page: { type: Type.INTEGER, description: "Approximate or exact page number where this section begins (1-indexed)." },
                  level: { type: Type.INTEGER, description: "Indentation level (1 for main section, 2 for subsection)." },
                },
                required: ["title", "page", "level"],
              },
            },
            audit: {
              type: Type.ARRAY,
              description: "A critical peer-review audit of the paper's key claims, methodology assertions, and potential gaps.",
              items: {
                type: Type.OBJECT,
                properties: {
                  assertion: { type: Type.STRING, description: "The core claim or methodological assertion made by the authors." },
                  evidence: { 
                    type: Type.STRING, 
                    enum: ["High", "Medium", "Low"], 
                    description: "Strength/fidelity of the empirical evidence or proof provided in the paper." 
                  },
                  critique: { type: Type.STRING, description: "Rigorous scholarly critique, identifying limitations, biases, assumptions, or alternative explanations." },
                  page: { type: Type.INTEGER, description: "The specific page number where this assertion is stated (1-indexed)." },
                },
                required: ["assertion", "evidence", "critique", "page"],
              },
            },
            formulas: {
              type: Type.ARRAY,
              description: "Core mathematical equations, formulas, or theorems presented in the paper.",
              items: {
                type: Type.OBJECT,
                properties: {
                  latex: { type: Type.STRING, description: "The exact formula rendered in pristine LaTeX syntax (omit wrapping $, just write the raw math formula, e.g. 'E = mc^2' or '\\mathcal{L}_{GAN} = ...')." },
                  name: { type: Type.STRING, description: "The name of the formula or theorem (e.g. 'Loss Function', 'Eq. 4: Gaussian Density')." },
                  description: { type: Type.STRING, description: "Rigorous academic breakdown of what each variable represents and the physical or statistical meaning." },
                  page: { type: Type.INTEGER, description: "The page number where this formula is featured (1-indexed)." },
                },
                required: ["latex", "name", "description", "page"],
              },
            },
            literatureLineage: {
              type: Type.ARRAY,
              description: "Major academic references cited, mapping how this paper builds upon, contrasts, or links to precursor works.",
              items: {
                type: Type.OBJECT,
                properties: {
                  citation: { type: Type.STRING, description: "The scholarly citation (e.g. 'Vaswani et al. (2017)', 'Sutton & Barto (1998)')." },
                  relation: { type: Type.STRING, description: "The relationship type (e.g. 'Direct Foundation', 'Contrastive Model', 'Extension of Framework')." },
                  impact: { type: Type.STRING, description: "The specific impact of that citation on this paper's core methodology or experiments." },
                  context: { type: Type.STRING, description: "A high-level scholarly summary of the precursor paper's core mechanism." },
                },
                required: ["citation", "relation", "impact", "context"],
              },
            },
          },
          required: ["title", "authors", "abstract", "outline", "audit", "formulas", "literatureLineage"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("API Analyze Error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze paper." });
  }
});

/**
 * API Route: Chat
 * Double-Pass Grounding Verification Chat.
 * 1. Coarse retrieval: Identifies the exact pages matching the user's question.
 * 2. Fine-grained scholarly debate: Queries Gemini with exact page text, system prompt, and context to write high-fidelity academic feedback.
 */
app.post("/api/chat", async (req, res) => {
  try {
    const { paper, messages, mode, selectedPageRange } = req.body;

    if (!paper || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing paper payload or message history." });
    }

    const latestMessage = messages[messages.length - 1];
    const userQuery = latestMessage.text;

    // --- PASS 1: COARSE PAGE RETRIEVAL ---
    // We locate the exact pages to feed as deep context to the scholarly engine.
    // If user specifies a page range, we respect it. Otherwise, we do a semantic layout lookup.
    let targetPages: number[] = [];

    if (selectedPageRange && Array.isArray(selectedPageRange) && selectedPageRange.length === 2) {
      const [start, end] = selectedPageRange;
      for (let i = start; i <= end; i++) {
        if (i >= 1 && i <= paper.pages.length) {
          targetPages.push(i);
        }
      }
    } else {
      // Perform local quick keyword/semantic matching to rank pages
      const pageScores = paper.pages.map((text: string, index: number) => {
        const pageNum = index + 1;
        let score = 0;
        
        // Clean and tokenize the user query
        const tokens = userQuery.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
        const pageTextLower = text.toLowerCase();
        
        tokens.forEach((token: string) => {
          if (token.length > 3) {
            // Give higher weight to unique tokens
            const count = (pageTextLower.split(token).length - 1);
            score += count * 5;
          } else {
            const count = (pageTextLower.split(token).length - 1);
            score += count;
          }
        });

        // Boost introduction and conclusion if general keywords are found
        if (pageNum === 1 || pageNum === 2) {
          if (userQuery.match(/abstract|overview|summary|introduction|authors/i)) score += 15;
        }
        if (pageNum === paper.pages.length || pageNum === paper.pages.length - 1) {
          if (userQuery.match(/conclusion|future work|discussion|results/i)) score += 15;
        }

        return { pageNum, score };
      });

      // Sort by score and take the top 3-4 most relevant pages to create the dense grounding context
      const rankedPages = pageScores
        .filter((p: any) => p.score > 0)
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 4)
        .map((p: any) => p.pageNum);

      // Default to pages 1, 2, and 3 if nothing has a score
      targetPages = rankedPages.length > 0 ? rankedPages : [1, 2, Math.min(3, paper.pages.length)];
    }

    // Assemble the precise grounding context
    let groundingContext = "";
    targetPages.forEach((pageNum) => {
      const pageText = paper.pages[pageNum - 1] || "";
      groundingContext += `=== VERIFIED PAGE TEXT: PAGE ${pageNum} ===\n${pageText}\n\n`;
    });

    // --- PASS 2: DEEP SCHOLARLY INFERENCE ---
    // Tailor instructions based on selected analytical mode
    let modeInstruction = "";
    switch (mode) {
      case AnalysisMode.DEEP_SYNTHESIS:
        modeInstruction = `Focus on synthesizing this paper's core contributions, explaining its theoretical breakthrough, mapping its structural logic, and explaining high-level conceptual ideas in-depth. Outline what the authors did, why it works, and how it advances the state of the art.`;
        break;
      case AnalysisMode.METHODOLOGY_AUDIT:
        modeInstruction = `Act as an aggressive, highly skeptical peer reviewer. Audit the methodology on the target pages: scrutinize experimental controls, sample sizes, datasets, mathematical assumptions, baseline selections, and statistical significance (look for p-values, overfitting, or hand-waving). Expose potential conflicts of interest, unstated assumptions, or limitations.`;
        break;
      case AnalysisMode.PROOF_CHECKER:
        modeInstruction = `Focus intensely on the mathematical formulas, theorems, proofs, and equations present. Break down the mathematical logic step-by-step. Map the variable definitions, verify the transitions between lines of derivations, explain the proof techniques used (e.g. induction, contradiction), and call out any gaps, logical leaps, or unproved assertions.`;
        break;
      case AnalysisMode.PEER_REVIEW_GRIP:
        modeInstruction = `Initiate an interactive scholarly debate. Grill the paper's thesis or let the user defend their own thesis against rigorous criticism. Challenge claims aggressively but constructively. Push the boundaries of the discussion. Speak directly like a senior academic chair presiding over a dissertation defense.`;
        break;
      case AnalysisMode.CITATIONAL_NETWORK:
        modeInstruction = `Analyze the paper's literature positioning. Detail how it builds on foundational precursors, how it compares to alternative approaches, and how it differs from cited baseline architectures. Help the user trace where ideas originated and how they might branch off in future studies.`;
        break;
      default:
        modeInstruction = `Synthesize structural claims and answer the user's inquiry with professional precision.`;
    }

    const systemInstruction = `You are "Professor Athena", an exceptionally prestigious, world-renowned Ivy League professor, senior research director, and legendary peer reviewer. You are real-worldly, highly intelligent, brilliant in STEM, humanities, and critical research methodology.
You speak with precise, formal, sophisticated, yet clear academic prose. You never use sales-pitch wording, promotional hype, or superficial summaries.

Your objective is to answer the user's question regarding the academic paper with absolute rigor and fidelity.
You must adhere to these structural constraints:
1. Grounding: Rely strictly on the verified page texts provided in the context. Never make up details. If a claim is not found, state clearly what is missing from the texts.
2. Citations: Every single factual claim, mathematical theorem, or empirical result you mention MUST be paired with an explicit bracketed citation to the page (e.g. "[p. 4]" or "[p. 2, 5]"). 
3. Mathematical Formatting: For any formulas or equations, you MUST render them in pristine LaTeX syntax. Use standard double dollars "$$" on a new line for block math equations, and single dollar "$" for inline math expressions.
4. Grounded Quotes extraction: At the very end of your response, you must append a structured JSON list of EXACT direct quotes you referenced from the text and their page numbers, wrapped inside an HTML tag like <quotes_audit>[Array of {text: string, page: number}]</quotes_audit>.

Analytical Core Mode Guidance:
${modeInstruction}

Here is the paper metadata:
Title: ${paper.title}
Authors: ${paper.authors}
Abstract: ${paper.abstract}

Current Verified Context pages: ${targetPages.join(", ")}
${groundingContext}`;

    // Map conversation history into Gemini's format
    const contents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: msg.text }],
    }));

    // Generate output with high-level reasoning
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.1, // low temperature for strict grounding
      },
    });

    res.json({
      text: response.text,
      targetPages,
    });
  } catch (error: any) {
    console.error("API Chat Error:", error);
    res.status(500).json({ error: error.message || "Failed to process chat response." });
  }
});

/**
 * API Route: Compare Papers
 * Takes up to 3 papers / abstracts and generates a multi-dimensional comparative matrix.
 */
app.post("/api/compare", async (req, res) => {
  try {
    const { papers } = req.body;
    if (!papers || !Array.isArray(papers) || papers.length === 0) {
      return res.status(400).json({ error: "Missing paper objects to compare." });
    }

    const systemInstruction = `You are a distinguished senior editor of a top-tier journal. Create a deep, scholarly comparative matrix of the provided papers.
Examine and compare their core methodologies, key contributions, foundational datasets/benchmarks, underlying assumptions/limitations, and theoretical validity.`;

    const prompt = `Generate a dense, comparative evaluation matrix of these papers:
${papers.map((p: any, idx: number) => `\nPaper ${idx + 1}:\nTitle: ${p.title}\nAbstract/Content: ${p.abstract || p.text}`).join("\n")}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            papers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  methodology: { type: Type.STRING, description: "Detailed comparative breakdown of the architectural or analytical approach." },
                  contributions: { type: Type.STRING, description: "Core theoretical or experimental breakthroughs claimed." },
                  limitations: { type: Type.STRING, description: "Unstated assumptions, methodological biases, gaps, or dataset shortcomings." },
                  datasets: { type: Type.STRING, description: "The benchmarks, synthetic data, or empirical materials used." },
                },
                required: ["title", "methodology", "contributions", "limitations", "datasets"],
              },
            },
          },
          required: ["papers"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("API Compare Error:", error);
    res.status(500).json({ error: error.message || "Failed to compare papers." });
  }
});

/**
 * API Route: Generate Presentation
 * Deconstructs the full paper context into a professionally-structured 10-slide PowerPoint slide deck structure.
 * Restricts AI slop by feeding strict guidelines about math formalism, experimental parameters, and peer criticism.
 */
app.post("/api/generate-presentation", async (req, res) => {
  try {
    const { paper } = req.body;
    if (!paper) {
      return res.status(400).json({ error: "Missing paper object for presentation generation." });
    }

    const textSample = paper.pages ? paper.pages.slice(0, 8).join("\n\n") : "Paper abstract: " + paper.abstract;

    const systemInstruction = `You are a distinguished Ivy League professor, senior journal editor, and legendary research chair. 
Your task is to prepare an elite, scientifically deep, high-level presentation deck (exactly 8 to 10 slides) summarizing the provided academic manuscript.
You must treat this with the absolute highest standards of academic excellence. Reject all generalities and "AI slop" filler text. 

Your output MUST be a strict JSON payload complying with the specified schema. 

Guidelines for Slide Quality:
1. Every slide title must be explicit and academic (e.g. "Core Formalism: Scaled Dot-Product Attention", NOT "The Math").
2. Bullet points must contain precise parameters, exact data points, SOTA percentage improvements, dataset names, or baseline models mentioned in the paper.
3. Include at least 1-2 slides with complex mathematical equations formatted in clean LaTeX syntax.
4. Dedicate 1 slide specifically to a critical peer-review audit, outlining the unstated assumptions, experimental vulnerabilities, or quadratic scaling limitations of the methodology.
5. Dedicate 1 slide specifically to literature lineage, detailing foundations (like additive attention) and compare/contrast baselines.
6. Speaker Notes must be a fully cohesive, paragraph-length script explaining the slide's contents in elegant, formal academic prose as if speaking to a thesis committee.`;

    const prompt = `Based on the academic paper titled "${paper.title}" with authors "${paper.authors}", and abstract "${paper.abstract}".
Here is the extracted text content of the manuscript pages:
${textSample.substring(0, 15000)}

Deconstruct this paper into an elite 8 to 10 slide scientific presentation deck. All mathematical symbols must be written in standard LaTeX. Use structured bullet indentation for supporting details.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Overarching professional presentation title." },
            subtitle: { type: Type.STRING, description: "Rigorous scientific context subtitle (e.g., 'A Critical Architectural Deconstruction')." },
            author: { type: Type.STRING, description: "Presenter name and academic affiliation placeholder (e.g., 'Department of Computer Science')." },
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Explicit, focused slide title." },
                  type: { 
                    type: Type.STRING, 
                    enum: ["title", "content", "comparison", "conclusion", "methods", "equation"],
                    description: "Slide type representing layout." 
                  },
                  bullets: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        text: { type: Type.STRING, description: "Concrete bullet text containing precise data, metrics, or arguments." },
                        isBold: { type: Type.BOOLEAN, description: "True if key terms should be bolded." },
                        indent: { type: Type.INTEGER, description: "Indentation depth: 0 for primary, 1 for sub-point details." }
                      },
                      required: ["text"]
                    }
                  },
                  equation: { type: Type.STRING, description: "Valid LaTeX equation if slide relates to formulas." },
                  highlightedText: { type: Type.STRING, description: "Core takeaway or visual highlight callout." },
                  speakerNotes: { type: Type.STRING, description: "Detailed academic lecture script for this slide." }
                },
                required: ["title", "type", "bullets", "speakerNotes"]
              }
            }
          },
          required: ["title", "subtitle", "author", "slides"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("API Generate Presentation Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate presentation structure." });
  }
});

/**
 * API Route: Edit Slide
 * Allows the user to select an individual slide and co-author/update it using specific natural language commands.
 */
app.post("/api/edit-slide", async (req, res) => {
  try {
    const { slide, instruction, paper } = req.body;
    if (!slide || !instruction) {
      return res.status(400).json({ error: "Missing slide payload or editing instruction." });
    }

    const contextPaper = paper ? `Title: ${paper.title}\nAbstract: ${paper.abstract}` : "";

    const systemInstruction = `You are a SOTA Academic Presentation Assistant. Your task is to update, refine, or regenerate a single slide's JSON content based on the user's specific natural language command.
You must adhere strictly to the requested modification while retaining the professional, high-level scientific tone. 

Make sure all bullet points remain highly specific, containing precise technical details and parameters instead of fluff. 
All mathematical symbols must use LaTeX format.`;

    const prompt = `We are editing a slide in a scientific presentation deck.
Here is the paper context (if available):
${contextPaper}

Here is the CURRENT SLIDE JSON:
${JSON.stringify(slide, null, 2)}

USER COMMAND FOR MODIFICATION:
"${instruction}"

Generate the updated slide JSON matching the original schema. Modify the title, bullets, equation, highlightedText, or speakerNotes as requested.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["title", "content", "comparison", "conclusion", "methods", "equation"] },
            bullets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  isBold: { type: Type.BOOLEAN },
                  indent: { type: Type.INTEGER }
                },
                required: ["text"]
              }
            },
            equation: { type: Type.STRING },
            highlightedText: { type: Type.STRING },
            speakerNotes: { type: Type.STRING }
          },
          required: ["title", "type", "bullets", "speakerNotes"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("API Edit Slide Error:", error);
    res.status(500).json({ error: error.message || "Failed to edit slide." });
  }
});

// Configure Vite middleware or production build output serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Athena Academic server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
