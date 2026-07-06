/**
 * High-performance browser-based PDF text parser using the PDF.js library.
 * Leverages background workers to parse and extract text without blocking the main UI thread.
 */

export interface ParsedPDF {
  title: string;
  totalPages: number;
  pages: string[];
}

export async function extractPDFText(file: File): Promise<ParsedPDF> {
  return new Promise(async (resolve, reject) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Get the pdfJS instance loaded via CDN in index.html
      const pdfjsLib = (window as any).pdfjsLib;
      if (!pdfjsLib) {
        throw new Error("PDF.js library is not loaded. Please verify CDN bindings.");
      }

      // Configure Worker URL
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

      // Load Document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;
      const pages: string[] = [];

      // Loop page-by-page and extract text
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Assemble text in correct layout lines
        let lastY = -1;
        let pageText = "";

        for (const item of textContent.items) {
          // Detect simple block structures or line returns based on Y coordinates
          if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) {
            pageText += "\n";
          }
          pageText += item.str + " ";
          lastY = item.transform[5];
        }

        pages.push(pageText.trim());
      }

      // Infer clean titles from first line elements on page 1
      const titleCandidate = pages[0]
        ? pages[0].split("\n").slice(0, 3).join(" ").trim().slice(0, 80)
        : file.name.replace(".pdf", "");

      resolve({
        title: titleCandidate,
        totalPages,
        pages,
      });
    } catch (err) {
      console.error("PDF Parsing Failure:", err);
      reject(err);
    }
  });
}
