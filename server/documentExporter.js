const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType } = require('docx');
const PptxGenJS = require('pptxgenjs');
const PDFDocument = require('pdfkit');

/**
 * Generate Microsoft Word (.docx) document
 * Contains complete Start-to-End Audio Explanation, Chronological Flow, Thematic Insights, and Tables
 */
async function generateWordDocx(reportData, outputPath) {
  // Build data table rows
  const tableRows = [
    new TableRow({
      tableHeader: true,
      children: [
        createStyledCell("Category / Item", true, "2C5E8A", "FFFFFF", 2400),
        createStyledCell("Budgeted / Benchmark", true, "2C5E8A", "FFFFFF", 2200),
        createStyledCell("Actual / Recorded", true, "2C5E8A", "FFFFFF", 2200),
        createStyledCell("Variance / Difference", true, "2C5E8A", "FFFFFF", 1800),
        createStyledCell("Status", true, "2C5E8A", "FFFFFF", 1800),
      ]
    })
  ];

  (reportData.financialTable || []).forEach((row, i) => {
    const isTotal = row.category?.toLowerCase().includes('total');
    const bg = isTotal ? "E2E8F0" : (i % 2 === 0 ? "F8FAFC" : "FFFFFF");
    const bold = isTotal;
    const varColor = row.variance?.startsWith('+') ? "15803D" : (row.variance?.startsWith('-') ? "0369A1" : "334155");

    tableRows.push(
      new TableRow({
        children: [
          createStyledCell(row.category || "Item", bold, bg, "0F172A", 2400),
          createStyledCell(row.budgeted || "—", bold, bg, "0F172A", 2200),
          createStyledCell(row.actual || "—", bold, bg, "0F172A", 2200),
          createStyledCell(row.variance || "0", bold, bg, varColor, 1800),
          createStyledCell(row.status || "Reconciled", bold, bg, "475569", 1800),
        ]
      })
    );
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 }
        }
      },
      children: [
        // Organization header
        new Paragraph({
          children: [
            new TextRun({
              text: reportData.organization || "Dev Supporter Workspace",
              bold: true,
              size: 26,
              color: "2C5E8A",
              font: "Arial"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Comprehensive Audio Comprehension, Knowledge Digest & Actionable Roadmap",
              size: 16,
              color: "64748B",
              font: "Arial"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        // Author meta
        new Paragraph({
          children: [
            new TextRun({
              text: `Prepared by: ${reportData.preparedBy || "Speech Comprehension Intelligence"}   |   Date: ${reportData.date || "Fiscal Year 2026"}`,
              italics: true,
              size: 18,
              color: "334155",
              font: "Arial"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 150 }
        }),

        // Document Title
        new Paragraph({
          children: [
            new TextRun({
              text: reportData.title || "Audio Analysis & Intelligence Report",
              bold: true,
              size: 32,
              color: "1E3A8A",
              font: "Arial"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: reportData.subtitle || "Full In-Depth Explanation from Start to End",
              size: 20,
              color: "475569",
              font: "Arial"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 350 }
        }),

        // Section I: Executive Summary
        new Paragraph({
          text: "I. Executive Synthesis & Audio Overview",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: reportData.executiveSummary || "",
              size: 21,
              font: "Calibri",
              color: "1E293B"
            })
          ],
          spacing: { after: 200 }
        }),

        // Section II: Chronological Progression (Start to End)
        new Paragraph({
          text: "II. Chronological Audio Progression (Start to End)",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "A. Initial Context & Opening Discussion (Beginning): ", bold: true, size: 20, color: "1E3A8A", font: "Calibri" }),
            new TextRun({ text: reportData.chronologicalFlow?.beginning || "The session opens with context setting and identification of the primary agenda.", size: 20, font: "Calibri" })
          ],
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "B. Core Topics, Technical Details & Workflows (Middle): ", bold: true, size: 20, color: "1E3A8A", font: "Calibri" }),
            new TextRun({ text: reportData.chronologicalFlow?.middle || "The core discussion examines detailed requirements, technical calculations, balance reconciliations, and operational workflows.", size: 20, font: "Calibri" })
          ],
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "C. Final Decisions, Agreements & Next Steps (Conclusion): ", bold: true, size: 20, color: "1E3A8A", font: "Calibri" }),
            new TextRun({ text: reportData.chronologicalFlow?.conclusion || "The discussion concludes with formal agreements, task assignments, and software/operational directives.", size: 20, font: "Calibri" })
          ],
          spacing: { after: 250 }
        }),

        // Section III: Thematic Explanations (What the concepts mean)
        new Paragraph({
          text: "III. Deep Thematic Concepts & Meaning",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 100 }
        }),
        ...(reportData.thematicExplanations || reportData.contextAndUseCases || []).flatMap(theme => [
          new Paragraph({
            children: [
              new TextRun({ text: `• ${theme.topic || theme.theme || theme.title || 'Key Concept'}: `, bold: true, size: 20, font: "Calibri", color: "1E3A8A" }),
              new TextRun({ text: `${theme.summary || theme.explanation || theme.description || ''} `, size: 20, font: "Calibri" }),
              theme.practicalImpact ? new TextRun({ text: `[Impact: ${theme.practicalImpact}]`, italics: true, color: "0369A1", size: 19, font: "Calibri" }) : new TextRun({ text: "" })
            ],
            spacing: { after: 100 }
          })
        ]),
        new Paragraph({ spacing: { after: 200 } }),

        // Section IV: Financial & Metric Data Table
        new Paragraph({
          text: "IV. Reconciled Metrics & Quantitative Overview",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tableRows
        }),
        new Paragraph({ spacing: { after: 300 } }),

        // Section V: Key Takeaways & Strategic Action Items
        new Paragraph({
          text: "V. Key Takeaways & Facts",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        }),
        ...(reportData.keyFindings || []).map(f =>
          new Paragraph({
            children: [
              new TextRun({ text: "✔  ", bold: true, color: "15803D" }),
              new TextRun({ text: f, size: 20, font: "Calibri" })
            ],
            spacing: { after: 80 }
          })
        ),

        new Paragraph({
          text: "VI. Strategic Decisions & Execution Roadmap",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        }),
        ...(reportData.recommendations || []).map((r, idx) =>
          new Paragraph({
            children: [
              new TextRun({ text: `${idx + 1}. `, bold: true, color: "2C5E8A" }),
              new TextRun({ text: r, size: 20, font: "Calibri" })
            ],
            spacing: { after: 80 }
          })
        ),

        // Section VII: Chaptered Dialogue & Detailed Translation
        new Paragraph({
          text: "VII. Chaptered Discourse & In-Depth Translation",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 250, after: 100 }
        }),
        ...(reportData.structuredTranscript || []).flatMap(ch => [
          new Paragraph({
            children: [
              new TextRun({ text: ch.chapterTitle || "Chapter", bold: true, size: 22, color: "1E3A8A", font: "Calibri" }),
              new TextRun({ text: `  —  [Speaker: ${ch.speaker || "Participants"}]`, italics: true, size: 18, color: "64748B", font: "Calibri" })
            ],
            spacing: { before: 140, after: 60 }
          }),
          ...(ch.paragraphs || []).map(p =>
            new Paragraph({
              children: [
                new TextRun({ text: p, size: 20, font: "Calibri", color: "334155" })
              ],
              spacing: { after: 80 }
            })
          )
        ]),

        // Section VIII: Grounded Q&A
        new Paragraph({
          text: "VIII. Grounded Questions & Evidence Citations",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 250, after: 100 }
        }),
        ...(reportData.groundedFAQ || []).flatMap(f => [
          new Paragraph({
            children: [
              new TextRun({ text: `Q: ${f.question}`, bold: true, size: 20, color: "1E3A8A", font: "Calibri" })
            ],
            spacing: { before: 100, after: 40 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `A: ${f.answer}`, size: 20, font: "Calibri", color: "1E293B" })
            ],
            spacing: { after: 40 }
          }),
          f.sourceQuote ? new Paragraph({
            children: [
              new TextRun({ text: `Evidence Context: "${f.sourceQuote}"`, italics: true, size: 18, color: "475569", font: "Calibri" })
            ],
            spacing: { after: 100 }
          }) : new Paragraph({ spacing: { after: 40 } })
        ])
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

function createStyledCell(text, bold, bgColor, textColor, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { fill: bgColor, type: ShadingType.CLEAR },
    margins: { top: 120, bottom: 120, left: 140, right: 140 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text,
            bold: bold,
            size: 18,
            color: textColor,
            font: "Arial"
          })
        ],
        alignment: AlignmentType.LEFT
      })
    ]
  });
}

/**
 * Generate Microsoft PowerPoint (.pptx) presentation
 * Features 6 complete, comprehensive slides explaining the audio start to end
 */
async function generatePowerPointPptx(reportData, outputPath) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  const darkNavy = "1E293B";
  const primaryBlue = "2563EB";
  const lightBg = "F8FAFC";
  const textDark = "0F172A";

  // Slide 1: Cover Slide
  const slide1 = pptx.addSlide();
  slide1.background = { color: darkNavy };

  slide1.addText(reportData.organization || "Dev Supporter Workspace", {
    x: 0.8, y: 1.2, w: 10.0, h: 0.5,
    fontSize: 14, bold: true, color: "60A5FA", fontFace: "Arial"
  });

  slide1.addText(reportData.title || "Audio Analysis & Intelligence Report", {
    x: 0.8, y: 1.8, w: 11.5, h: 1.6,
    fontSize: 32, bold: true, color: "FFFFFF", fontFace: "Arial"
  });

  slide1.addText(reportData.subtitle || "Full In-Depth Explanation from Start to End", {
    x: 0.8, y: 3.6, w: 10.5, h: 0.8,
    fontSize: 18, color: "94A3B8", fontFace: "Calibri"
  });

  slide1.addText(`Prepared by: ${reportData.preparedBy || "Speech Intelligence Engine"}   |   ${reportData.date || "2026"}`, {
    x: 0.8, y: 5.6, w: 9.0, h: 0.5,
    fontSize: 13, color: "CBD5E1", fontFace: "Arial"
  });

  // Slide 2: Executive Summary & Overview
  const slide2 = pptx.addSlide();
  slide2.background = { color: lightBg };

  slide2.addText("I. Executive Summary & Audio Context", {
    x: 0.8, y: 0.5, w: 10.0, h: 0.6,
    fontSize: 24, bold: true, color: primaryBlue, fontFace: "Arial"
  });

  slide2.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 1.3, w: 11.5, h: 4.8,
    fill: { color: "FFFFFF" }, line: { color: "CBD5E1", width: 1.5 }
  });

  slide2.addText(reportData.executiveSummary || "Detailed executive synthesis of the recording.", {
    x: 1.2, y: 1.6, w: 10.7, h: 4.2,
    fontSize: 15, color: textDark, fontFace: "Calibri", lineSpacingMultiple: 1.2
  });

  // Slide 3: Chronological Flow (Start to End)
  const slide3 = pptx.addSlide();
  slide3.background = { color: lightBg };

  slide3.addText("II. Chronological Audio Flow (Start to End)", {
    x: 0.8, y: 0.5, w: 10.0, h: 0.6,
    fontSize: 24, bold: true, color: primaryBlue, fontFace: "Arial"
  });

  const flowCards = [
    {
      title: "1. Beginning (Context)",
      desc: reportData.chronologicalFlow?.beginning || "Initial opening and context setting.",
      color: "3B82F6",
      x: 0.8
    },
    {
      title: "2. Middle (Core Discussion)",
      desc: reportData.chronologicalFlow?.middle || "Core discussions, calculations, and debates.",
      color: "8B5CF6",
      x: 4.7
    },
    {
      title: "3. Conclusion (Outcomes)",
      desc: reportData.chronologicalFlow?.conclusion || "Final resolutions, decisions, and next steps.",
      color: "10B981",
      x: 8.6
    }
  ];

  flowCards.forEach(card => {
    slide3.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: card.x, y: 1.3, w: 3.7, h: 5.0,
      fill: { color: "FFFFFF" }, line: { color: "CBD5E1", width: 1.5 }
    });

    slide3.addShape(pptx.shapes.RECTANGLE, {
      x: card.x, y: 1.3, w: 3.7, h: 0.6,
      fill: { color: card.color }
    });

    slide3.addText(card.title, {
      x: card.x + 0.2, y: 1.4, w: 3.3, h: 0.4,
      fontSize: 14, bold: true, color: "FFFFFF", fontFace: "Arial"
    });

    slide3.addText(card.desc, {
      x: card.x + 0.25, y: 2.1, w: 3.2, h: 4.0,
      fontSize: 12, color: textDark, fontFace: "Calibri"
    });
  });

  // Slide 4: In-Depth Thematic Concepts
  const slide4 = pptx.addSlide();
  slide4.background = { color: lightBg };

  slide4.addText("III. In-Depth Thematic Concepts & Meaning", {
    x: 0.8, y: 0.5, w: 10.0, h: 0.6,
    fontSize: 24, bold: true, color: primaryBlue, fontFace: "Arial"
  });

  const themes = (reportData.thematicExplanations || reportData.contextAndUseCases || []).slice(0, 3);
  themes.forEach((t, i) => {
    const cardY = 1.3 + i * 1.7;
    slide4.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: cardY, w: 11.5, h: 1.5,
      fill: { color: "FFFFFF" }, line: { color: "93C5FD", width: 1 }
    });

    slide4.addText(t.topic || t.theme || t.title || `Concept ${i + 1}`, {
      x: 1.1, y: cardY + 0.15, w: 10.8, h: 0.35,
      fontSize: 15, bold: true, color: "1E3A8A", fontFace: "Arial"
    });

    slide4.addText(t.summary || t.explanation || t.description || "", {
      x: 1.1, y: cardY + 0.55, w: 10.8, h: 0.8,
      fontSize: 12, color: textDark, fontFace: "Calibri"
    });
  });

  // Slide 5: Data & Financial Table
  const slide5 = pptx.addSlide();
  slide5.background = { color: lightBg };

  slide5.addText("IV. Reconciled Metrics & Quantitative Data", {
    x: 0.8, y: 0.5, w: 10.0, h: 0.6,
    fontSize: 24, bold: true, color: primaryBlue, fontFace: "Arial"
  });

  const pptTable = [
    [
      { text: "Category / Item", options: { bold: true, fill: "2C5E8A", color: "FFFFFF" } },
      { text: "Budgeted / Quote", options: { bold: true, fill: "2C5E8A", color: "FFFFFF" } },
      { text: "Actual / Recorded", options: { bold: true, fill: "2C5E8A", color: "FFFFFF" } },
      { text: "Variance", options: { bold: true, fill: "2C5E8A", color: "FFFFFF" } },
      { text: "Status", options: { bold: true, fill: "2C5E8A", color: "FFFFFF" } },
    ]
  ];

  (reportData.financialTable || []).forEach((r, idx) => {
    const isTot = r.category?.toLowerCase().includes('total');
    const fill = isTot ? "E2E8F0" : (idx % 2 === 0 ? "F8FAFC" : "FFFFFF");
    pptTable.push([
      { text: r.category || "Item", options: { bold: isTot, fill } },
      { text: r.budgeted || "—", options: { bold: isTot, fill } },
      { text: r.actual || "—", options: { bold: isTot, fill } },
      { text: r.variance || "0", options: { bold: isTot, fill, color: r.variance?.startsWith('+') ? "15803D" : "0369A1" } },
      { text: r.status || "Reconciled", options: { bold: isTot, fill } },
    ]);
  });

  slide5.addTable(pptTable, {
    x: 0.8, y: 1.4, w: 11.5, h: 4.5,
    colW: [2.6, 2.2, 2.2, 2.2, 2.3],
    fontSize: 13,
    border: { pt: 0.5, color: "CBD5E1" }
  });

  // Slide 6: Strategic Decisions & Action Plan
  const slide6 = pptx.addSlide();
  slide6.background = { color: lightBg };

  slide6.addText("V. Strategic Decisions & Execution Roadmap", {
    x: 0.8, y: 0.5, w: 10.0, h: 0.6,
    fontSize: 24, bold: true, color: primaryBlue, fontFace: "Arial"
  });

  const actions = (reportData.recommendations || []).map((r, i) => ({
    text: `${i + 1}.  ${r}`,
    options: { fontSize: 14, color: textDark, bullet: false, spaceAfter: 14 }
  }));

  slide6.addText(actions, {
    x: 0.8, y: 1.5, w: 11.5, h: 4.5,
    fontFace: "Calibri"
  });

  await pptx.writeFile({ fileName: outputPath });
  return outputPath;
}

/**
 * Sanitize text for PDFKit standard fonts (WinAnsi/Latin-1)
 */
function cleanForPdf(text) {
  if (!text) return '';
  return String(text)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x00-\x7F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function drawSectionHeaderPdf(doc, title) {
  if (doc.y > 670) {
    doc.addPage();
  } else {
    doc.moveDown(0.8);
  }
  const y = doc.y;
  doc.rect(40, y, 515, 22).fill('#1E3A8A');
  doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold').text(cleanForPdf(title), 50, y + 5);
  doc.y = y + 30;
  doc.fillColor('#0F172A');
}

/**
 * Generate publication-ready, multi-page comprehensive PDF document
 */
function generatePdfReport(reportData, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Top Header Banner
      doc.rect(40, 40, 515, 55).fill('#2C5E8A');
      doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold').text(cleanForPdf(reportData.organization || 'Dev Supporter Executive Briefing'), 55, 50);
      doc.fillColor('#E2E8F0').fontSize(10).font('Helvetica').text('Comprehensive Audio Comprehension, Knowledge Digest & Actionable Roadmap', 55, 72);

      doc.moveDown(2.8);

      // Title & Subtitle Block
      doc.fillColor('#0F172A').fontSize(18).font('Helvetica-Bold').text(cleanForPdf(reportData.title || 'Audio Analysis Report'), { align: 'center' });
      doc.moveDown(0.2);
      doc.fillColor('#64748B').fontSize(11).font('Helvetica').text(cleanForPdf(reportData.subtitle || 'Start-to-End Comprehension & Analysis'), { align: 'center' });
      doc.moveDown(0.4);
      doc.fillColor('#475569').fontSize(9).font('Helvetica-Oblique').text(`Prepared by: ${cleanForPdf(reportData.preparedBy || 'AI Engine')}   |   Date: ${cleanForPdf(reportData.date || '2026')}`, { align: 'center' });
      doc.moveDown(1.0);

      // Section I: Executive Synthesis (Full multi-paragraph text)
      drawSectionHeaderPdf(doc, 'I. Executive Synthesis & Big Picture Context');
      const abstractText = reportData.executiveSummary || '';
      const paragraphs = abstractText.split(/\n+/).filter(p => p.trim().length > 0);
      paragraphs.forEach(p => {
        doc.fillColor('#1E293B').fontSize(9.5).font('Helvetica').text(cleanForPdf(p.trim()), { lineGap: 3, align: 'justify' });
        doc.moveDown(0.5);
      });

      // Section II: Key Facts, Strategic Directives & Takeaways
      if (reportData.keyFindings && reportData.keyFindings.length > 0) {
        drawSectionHeaderPdf(doc, 'II. Key Facts, Specific Figures & Critical Takeaways');
        reportData.keyFindings.forEach((f, idx) => {
          if (doc.y > 720) doc.addPage();
          doc.fillColor('#15803D').fontSize(9.5).font('Helvetica-Bold').text('✔  ', { continued: true });
          doc.fillColor('#1E293B').font('Helvetica').text(cleanForPdf(f), { lineGap: 2 });
          doc.moveDown(0.35);
        });
      }

      // Section III: Chronological Audio Progression (Start to End)
      if (reportData.chronologicalFlow) {
        drawSectionHeaderPdf(doc, 'III. Chronological Audio Flow & Progression (Start to End)');

        if (reportData.chronologicalFlow.beginning) {
          if (doc.y > 690) doc.addPage();
          doc.fillColor('#1E3A8A').fontSize(10).font('Helvetica-Bold').text('A. Opening Context & Problem Scope (Beginning):');
          doc.moveDown(0.2);
          doc.fillColor('#334155').fontSize(9.5).font('Helvetica').text(cleanForPdf(reportData.chronologicalFlow.beginning), { lineGap: 3, align: 'justify' });
          doc.moveDown(0.6);
        }

        if (reportData.chronologicalFlow.middle) {
          if (doc.y > 690) doc.addPage();
          doc.fillColor('#1E3A8A').fontSize(10).font('Helvetica-Bold').text('B. Core Discussions, Technical Walkthrough & Calculations (Middle):');
          doc.moveDown(0.2);
          doc.fillColor('#334155').fontSize(9.5).font('Helvetica').text(cleanForPdf(reportData.chronologicalFlow.middle), { lineGap: 3, align: 'justify' });
          doc.moveDown(0.6);
        }

        if (reportData.chronologicalFlow.conclusion) {
          if (doc.y > 690) doc.addPage();
          doc.fillColor('#1E3A8A').fontSize(10).font('Helvetica-Bold').text('C. Final Agreements, Decisions & Concluding Directives (End):');
          doc.moveDown(0.2);
          doc.fillColor('#334155').fontSize(9.5).font('Helvetica').text(cleanForPdf(reportData.chronologicalFlow.conclusion), { lineGap: 3, align: 'justify' });
          doc.moveDown(0.6);
        }
      }

      // Section IV: Reconciled Quantitative Metrics & Data Table
      if (reportData.financialTable && reportData.financialTable.length > 0) {
        drawSectionHeaderPdf(doc, 'IV. Reconciled Metrics & Quantitative Overview');
        
        const tableTop = doc.y;
        doc.rect(40, tableTop, 515, 20).fill('#2C5E8A');
        doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
        doc.text('Category / Item', 50, tableTop + 5, { width: 140 });
        doc.text('Benchmark / Target', 190, tableTop + 5, { width: 90 });
        doc.text('Actual / Observed', 280, tableTop + 5, { width: 90 });
        doc.text('Variance', 370, tableTop + 5, { width: 80 });
        doc.text('Status', 450, tableTop + 5, { width: 90 });

        let currentY = tableTop + 20;
        reportData.financialTable.forEach((row, i) => {
          if (currentY > 740) {
            doc.addPage();
            currentY = 45;
          }
          const isTot = row.category?.toLowerCase().includes('total');
          if (i % 2 === 0 || isTot) {
            doc.rect(40, currentY, 515, 20).fill(isTot ? '#E2E8F0' : '#F8FAFC');
          }
          doc.fillColor('#0F172A').fontSize(8.5).font(isTot ? 'Helvetica-Bold' : 'Helvetica');
          doc.text(cleanForPdf(row.category || 'Item'), 50, currentY + 5, { width: 135 });
          doc.text(cleanForPdf(row.budgeted || '—'), 190, currentY + 5, { width: 85 });
          doc.text(cleanForPdf(row.actual || '—'), 280, currentY + 5, { width: 85 });

          const varCol = row.variance?.startsWith('+') ? '#15803D' : (row.variance?.startsWith('-') ? '#0369A1' : '#0F172A');
          doc.fillColor(varCol).font('Helvetica-Bold').text(cleanForPdf(row.variance || '0'), 370, currentY + 5, { width: 75 });
          doc.fillColor('#475569').font('Helvetica').text(cleanForPdf(row.status || 'Met'), 450, currentY + 5, { width: 85 });

          currentY += 20;
        });

        doc.y = currentY + 15;
      }

      // Section V: In-Depth Thematic Concepts & Technical Architecture
      const themes = reportData.thematicExplanations || reportData.contextAndUseCases || [];
      if (themes.length > 0) {
        drawSectionHeaderPdf(doc, 'V. Deep Thematic Concepts & Technical Breakdown');
        themes.forEach((t, i) => {
          if (doc.y > 670) doc.addPage();
          const title = t.topic || t.theme || t.title || `Concept ${i + 1}`;
          const desc = t.summary || t.explanation || t.description || '';
          
          doc.fillColor('#1E3A8A').fontSize(10).font('Helvetica-Bold').text(`${i + 1}. ${cleanForPdf(title)}`);
          doc.moveDown(0.2);
          doc.fillColor('#334155').fontSize(9.5).font('Helvetica').text(cleanForPdf(desc), { indent: 10, lineGap: 2.5, align: 'justify' });
          doc.moveDown(0.3);

          if (t.keyInsights && Array.isArray(t.keyInsights) && t.keyInsights.length > 0) {
            t.keyInsights.forEach(insight => {
              if (doc.y > 730) doc.addPage();
              doc.fillColor('#2563EB').fontSize(9).font('Helvetica-Bold').text('    • ', { continued: true });
              doc.fillColor('#475569').font('Helvetica').text(cleanForPdf(insight), { lineGap: 2 });
              doc.moveDown(0.2);
            });
          }
          doc.moveDown(0.4);
        });
      }

      // Section VI: Chaptered Structured Discourse & Translation
      if (reportData.structuredTranscript && reportData.structuredTranscript.length > 0) {
        drawSectionHeaderPdf(doc, 'VI. Chaptered Discourse & Detailed Translation');
        reportData.structuredTranscript.forEach((ch, idx) => {
          if (doc.y > 660) doc.addPage();
          
          const chTitle = ch.chapterTitle || `Chapter ${idx + 1}`;
          const speaker = ch.speaker || 'Participants';
          
          doc.fillColor('#1E3A8A').fontSize(10.5).font('Helvetica-Bold').text(cleanForPdf(chTitle), { continued: true });
          doc.fillColor('#64748B').fontSize(9).font('Helvetica-Oblique').text(`  —  [Speaker: ${cleanForPdf(speaker)}]`);
          doc.moveDown(0.3);

          if (ch.paragraphs && Array.isArray(ch.paragraphs)) {
            ch.paragraphs.forEach(p => {
              if (doc.y > 720) doc.addPage();
              doc.fillColor('#334155').fontSize(9.5).font('Helvetica').text(cleanForPdf(p), { indent: 10, lineGap: 3, align: 'justify' });
              doc.moveDown(0.4);
            });
          }
          doc.moveDown(0.4);
        });
      }

      // Section VII: Grounded Questions & Evidence Citations (Study Guide)
      if (reportData.groundedFAQ && reportData.groundedFAQ.length > 0) {
        drawSectionHeaderPdf(doc, 'VII. Grounded Questions & Evidence Citations');
        reportData.groundedFAQ.forEach((faq, idx) => {
          if (doc.y > 670) doc.addPage();
          
          doc.fillColor('#1E3A8A').fontSize(10).font('Helvetica-Bold').text(`Q${idx + 1}: ${cleanForPdf(faq.question)}`);
          doc.moveDown(0.2);
          doc.fillColor('#1E293B').fontSize(9.5).font('Helvetica').text(`Answer: ${cleanForPdf(faq.answer)}`, { indent: 10, lineGap: 2.5, align: 'justify' });
          doc.moveDown(0.25);

          if (faq.sourceQuote) {
            if (doc.y > 720) doc.addPage();
            doc.fillColor('#475569').fontSize(8.5).font('Helvetica-Oblique').text(`Evidence Context: "${cleanForPdf(faq.sourceQuote)}"`, { indent: 15, lineGap: 2 });
            doc.moveDown(0.2);
          }
          doc.moveDown(0.4);
        });
      }

      // Section VIII: Strategic Action Plan & Execution Roadmap
      if (reportData.recommendations && reportData.recommendations.length > 0) {
        drawSectionHeaderPdf(doc, 'VIII. Strategic Action Plan & Execution Roadmap');
        reportData.recommendations.forEach((r, idx) => {
          if (doc.y > 720) doc.addPage();
          doc.fillColor('#2C5E8A').fontSize(9.5).font('Helvetica-Bold').text(`${idx + 1}. `, { continued: true });
          doc.fillColor('#1E293B').font('Helvetica').text(cleanForPdf(r), { lineGap: 2.5 });
          doc.moveDown(0.35);
        });
      }

      // Final Footer
      doc.moveDown(1.0);
      if (doc.y > 740) doc.addPage();
      doc.fontSize(8).fillColor('#94A3B8').text('Generated by Dev Supporter & OpenAI Whisper Intelligence Suite  —  Confidential Executive Digest', 40, doc.page.height - 35, { align: 'center', width: 515 });

      doc.end();
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = {
  generateWordDocx,
  generatePowerPointPptx,
  generatePdfReport
};
