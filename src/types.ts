/**
 * Athena Scholar-Grade Academic Types
 */

export enum AnalysisMode {
  DEEP_SYNTHESIS = "DEEP_SYNTHESIS",
  METHODOLOGY_AUDIT = "METHODOLOGY_AUDIT",
  PROOF_CHECKER = "PROOF_CHECKER",
  PEER_REVIEW_GRIP = "PEER_REVIEW_GRIP",
  CITATIONAL_NETWORK = "CITATIONAL_NETWORK"
}

export interface OutlineItem {
  title: string;
  page: number;
  level: number;
}

export interface AuditItem {
  id: string;
  assertion: string;
  evidence: "High" | "Medium" | "Low";
  critique: string;
  page: number;
}

export interface FormulaItem {
  id: string;
  latex: string;
  name: string;
  description: string;
  page: number;
}

export interface LiteratureItem {
  id: string;
  citation: string;
  relation: string; // e.g. "Precursor", "Foundational", "Alternative Approach"
  impact: string; // e.g. "Extends this work", "Direct contrast", "Provides base proof"
  context: string;
}

export interface Paper {
  id: string;
  title: string;
  authors: string;
  abstract: string;
  totalPages: number;
  fileName: string;
  fileSize: string;
  pages: string[]; // Page-by-page text content
  outline: OutlineItem[];
  audit?: AuditItem[];
  formulas?: FormulaItem[];
  literatureLineage?: LiteratureItem[];
}

export interface GroundedQuote {
  text: string;
  page: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  mode?: AnalysisMode;
  pageReferences?: number[];
  groundedQuotes?: GroundedQuote[];
  isThinking?: boolean;
}

export interface ComparisonMatrix {
  papers: {
    title: string;
    methodology: string;
    contributions: string;
    limitations: string;
    datasets: string;
  }[];
}

export interface SlideBullet {
  text: string;
  isBold?: boolean;
  indent?: number; // 0 for main bullet, 1 for sub-bullet
}

export interface Slide {
  id: string;
  title: string;
  type: "title" | "content" | "comparison" | "conclusion" | "methods" | "equation";
  bullets: SlideBullet[];
  footer?: string;
  speakerNotes?: string;
  equation?: string; // Standard mathematical display if type === "equation" or "methods"
  highlightedText?: string; // Large central block or callout
}

export interface PresentationTemplate {
  id: string;
  name: string;
  backgroundColor: string;
  titleColor: string;
  textColor: string;
  accentColor: string;
  fontTitle: string;
  fontBody: string;
  logoUrl?: string; // Base64 or local image URL for custom logo
  showLogo?: boolean;
  headerBarColor?: string;
}

export interface Presentation {
  title: string;
  subtitle: string;
  author: string;
  slides: Slide[];
  templateId: string;
  customTemplate?: PresentationTemplate;
}

