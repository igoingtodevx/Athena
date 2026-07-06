import pptxgen from "pptxgenjs";
import { Presentation, Slide, PresentationTemplate } from "../types";

/**
 * Utility to export a custom Presentation deck into a real PPTX file.
 * Handles background colors, title fonts, custom uploaded logos, 
 * multiple paragraph indentations, equations, and speaker notes.
 */
export async function exportToPPTX(presentation: Presentation, template: PresentationTemplate) {
  const pptx = new pptxgen();

  // Define Presentation Metadata
  pptx.title = presentation.title;
  pptx.subject = "Scientific Manuscript Deconstruction";
  pptx.author = presentation.author || "Athena Workbench";
  pptx.layout = "LAYOUT_16x9"; // 16:9 widescreen layout

  // Colors must omit the "#" symbol in pptxgenjs
  const cleanHex = (color: string) => color.replace("#", "");
  
  const bgClean = cleanHex(template.backgroundColor);
  const titleClean = cleanHex(template.titleColor);
  const textClean = cleanHex(template.textColor);
  const accentClean = cleanHex(template.accentColor);

  const fontTitle = template.fontTitle || "Georgia";
  const fontBody = template.fontBody || "Calibri";

  // Process slide by slide
  presentation.slides.forEach((slide, idx) => {
    const pptxSlide = pptx.addSlide();

    // 1. Set background color
    pptxSlide.background = { fill: bgClean };

    // 2. Insert Custom Logo if uploaded & active
    if (template.logoUrl && template.showLogo !== false) {
      // In pptxgenjs, we can pass a base64 Data URL directly to the 'data' option
      try {
        pptxSlide.addImage({
          data: template.logoUrl,
          x: 11.8, // Align to top right (standard width is 13.33 inches)
          y: 0.3,
          w: 1.1,
          h: 0.7,
          sizing: { type: "contain", w: 1.1, h: 0.7 }
        });
      } catch (err) {
        console.error("Failed to add custom logo to slide", err);
      }
    }

    // 3. Render slide layouts based on type
    if (slide.type === "title" || idx === 0) {
      // --- TITLE SLIDE ---
      // Accent vertical column or block to look highly custom
      pptxSlide.addShape("rect", {
        x: 0,
        y: 0,
        w: 0.4,
        h: 7.5,
        fill: { color: accentClean }
      });

      // Title
      pptxSlide.addText(slide.title || presentation.title, {
        x: 1.2,
        y: 1.8,
        w: 11.0,
        h: 2.0,
        fontSize: 38,
        color: titleClean,
        fontFace: fontTitle,
        bold: true,
        valign: "middle"
      });

      // Decorative separator line
      pptxSlide.addShape("rect", {
        x: 1.2,
        y: 4.0,
        w: 3.5,
        h: 0.05,
        fill: { color: accentClean }
      });

      // Subtitle
      const subtitleText = slide.highlightedText || presentation.subtitle || "Scientific Presentation";
      pptxSlide.addText(subtitleText, {
        x: 1.2,
        y: 4.3,
        w: 11.0,
        h: 1.0,
        fontSize: 18,
        color: textClean,
        fontFace: fontBody,
        italic: true,
        valign: "top"
      });

      // Author / Presenter info
      const authorText = presentation.author ? `Presented by: ${presentation.author}` : "Athena Academic Workbench";
      pptxSlide.addText(authorText, {
        x: 1.2,
        y: 5.6,
        w: 11.0,
        h: 0.8,
        fontSize: 12,
        color: textClean,
        fontFace: fontBody,
        bold: true
      });

    } else if (slide.type === "equation") {
      // --- EQUATION FOCUS SLIDE ---
      // Slide title
      pptxSlide.addText(slide.title, {
        x: 0.8,
        y: 0.5,
        w: 11.5,
        h: 0.8,
        fontSize: 22,
        color: titleClean,
        fontFace: fontTitle,
        bold: true
      });

      // Thin separator line
      pptxSlide.addShape("rect", {
        x: 0.8,
        y: 1.3,
        w: 11.7,
        h: 0.02,
        fill: { color: accentClean }
      });

      // Gray mathematical box
      pptxSlide.addShape("rect", {
        x: 1.5,
        y: 1.8,
        w: 10.3,
        h: 1.8,
        fill: { color: template.backgroundColor === "#FFFFFF" || template.backgroundColor === "#FAF9F6" ? "F1F5F9" : "1E293B" },
        line: { color: accentClean, width: 1 }
      });

      // LaTeX / Equation String in the center
      const equationText = slide.equation || "E = m c^2";
      pptxSlide.addText(equationText, {
        x: 1.8,
        y: 2.0,
        w: 9.7,
        h: 1.4,
        align: "center",
        fontSize: 18,
        color: accentClean,
        fontFace: "Courier New",
        bold: true,
        valign: "middle"
      });

      // Technical explanation bullet points underneath
      if (slide.bullets && slide.bullets.length > 0) {
        const textParts = slide.bullets.map(b => ({
          text: b.text,
          options: {
            bullet: true,
            indentLevel: b.indent || 0,
            fontSize: (b.indent || 0) > 0 ? 12 : 14,
            color: textClean,
            fontFace: fontBody,
            bold: b.isBold || false,
            paraSpaceAfter: 8
          }
        }));

        pptxSlide.addText(textParts, {
          x: 1.5,
          y: 3.9,
          w: 10.3,
          h: 2.8,
          valign: "top"
        });
      }

    } else if (slide.type === "comparison") {
      // --- COMPARATIVE / TWO-COLUMN SLIDE ---
      pptxSlide.addText(slide.title, {
        x: 0.8,
        y: 0.5,
        w: 11.5,
        h: 0.8,
        fontSize: 22,
        color: titleClean,
        fontFace: fontTitle,
        bold: true
      });

      pptxSlide.addShape("rect", {
        x: 0.8,
        y: 1.3,
        w: 11.7,
        h: 0.02,
        fill: { color: accentClean }
      });

      // Split bullets into 2 columns (even / odd, or left / right half)
      const halfCount = Math.ceil(slide.bullets.length / 2);
      const leftBullets = slide.bullets.slice(0, halfCount);
      const rightBullets = slide.bullets.slice(halfCount);

      // Left Column
      if (leftBullets.length > 0) {
        const leftParts = leftBullets.map(b => ({
          text: b.text,
          options: {
            bullet: true,
            indentLevel: b.indent || 0,
            fontSize: (b.indent || 0) > 0 ? 12 : 14,
            color: textClean,
            fontFace: fontBody,
            bold: b.isBold || false,
            paraSpaceAfter: 10
          }
        }));

        pptxSlide.addText(leftParts, {
          x: 0.8,
          y: 1.8,
          w: 5.5,
          h: 4.8,
          valign: "top"
        });
      }

      // Divider vertical line
      pptxSlide.addShape("rect", {
        x: 6.6,
        y: 1.8,
        w: 0.01,
        h: 4.8,
        fill: { color: "CBD5E1" }
      });

      // Right Column
      if (rightBullets.length > 0) {
        const rightParts = rightBullets.map(b => ({
          text: b.text,
          options: {
            bullet: true,
            indentLevel: b.indent || 0,
            fontSize: (b.indent || 0) > 0 ? 12 : 14,
            color: textClean,
            fontFace: fontBody,
            bold: b.isBold || false,
            paraSpaceAfter: 10
          }
        }));

        pptxSlide.addText(rightParts, {
          x: 7.0,
          y: 1.8,
          w: 5.5,
          h: 4.8,
          valign: "top"
        });
      }

    } else {
      // --- STANDARD CONTENT SLIDE ---
      // Title
      pptxSlide.addText(slide.title, {
        x: 0.8,
        y: 0.5,
        w: 11.5,
        h: 0.8,
        fontSize: 22,
        color: titleClean,
        fontFace: fontTitle,
        bold: true
      });

      // Thin separator line
      pptxSlide.addShape("rect", {
        x: 0.8,
        y: 1.3,
        w: 11.7,
        h: 0.02,
        fill: { color: accentClean }
      });

      // Slide Bullet Points
      if (slide.bullets && slide.bullets.length > 0) {
        const textParts = slide.bullets.map(b => ({
          text: b.text,
          options: {
            bullet: true,
            indentLevel: b.indent || 0,
            fontSize: (b.indent || 0) > 0 ? 12 : 14,
            color: textClean,
            fontFace: fontBody,
            bold: b.isBold || false,
            paraSpaceAfter: 12
          }
        }));

        pptxSlide.addText(textParts, {
          x: 0.8,
          y: 1.8,
          w: 11.7,
          h: 4.8,
          valign: "top"
        });
      }

      // Highlighted Text (Callout at bottom if available)
      if (slide.highlightedText) {
        pptxSlide.addText(`Note: ${slide.highlightedText}`, {
          x: 0.8,
          y: 5.8,
          w: 11.7,
          h: 0.8,
          fontSize: 11,
          color: accentClean,
          fontFace: fontBody,
          italic: true
        });
      }
    }

    // 4. Slide Footer (Title of paper + page number)
    const footerText = `${presentation.title} | Slide ${idx + 1}`;
    pptxSlide.addText(footerText, {
      x: 0.8,
      y: 6.9,
      w: 11.7,
      h: 0.4,
      fontSize: 9,
      color: "94A3B8", // slate-400
      fontFace: fontBody,
      align: "left"
    });

    // 5. Speaker Notes (Presenter transcripts)
    if (slide.speakerNotes) {
      pptxSlide.addNotes(slide.speakerNotes);
    }
  });

  // Save the PPTX file to user's browser
  const sanitizedTitle = presentation.title.toLowerCase().replace(/[^a-z0-9]+/g, "_").substring(0, 30);
  await pptx.writeFile({ fileName: `presentation_${sanitizedTitle}.pptx` });
}
