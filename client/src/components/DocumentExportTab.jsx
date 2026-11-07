import React, { useState } from 'react';
import { 
  FileText, 
  Presentation, 
  FileType, 
  Download, 
  Check, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink,
  Laptop,
  CheckCircle2,
  Loader2,
  Sparkles
} from 'lucide-react';
import axios from 'axios';

export default function DocumentExportTab({ reportData }) {
  const [selectedFormat, setSelectedFormat] = useState('docx'); // docx, pptx, pdf
  const [isExporting, setIsExporting] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [downloadHistory, setDownloadHistory] = useState([]);

  if (!reportData) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">No Report Generated Yet</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          Upload and convert media or transcript in the previous tabs, then run the AI Context Analyzer to view and export the professional reporting package.
        </p>
      </div>
    );
  }

  const handleExport = async (formatToExport = selectedFormat) => {
    setIsExporting(true);
    try {
      const res = await axios.post('/api/export-report', {
        reportData,
        format: formatToExport
      });

      if (res.data && res.data.success) {
        // Trigger download
        const a = document.createElement('a');
        a.href = res.data.downloadUrl;
        a.download = res.data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setDownloadHistory(prev => [
          {
            format: formatToExport.toUpperCase(),
            filename: res.data.filename,
            size: (res.data.fileSize / 1024).toFixed(1) + ' KB',
            time: new Date().toLocaleTimeString(),
            url: res.data.downloadUrl
          },
          ...prev
        ]);
      } else {
        throw new Error(res.data?.error || 'Export failed');
      }
    } catch (err) {
      console.error('Export error:', err);
      alert(`Export error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const slides = reportData.slides || [
    { slideNumber: 1, title: reportData.title || "Overview", bullets: [reportData.subtitle || "Executive Assessment", `Prepared by ${reportData.preparedBy || "AI"}`, reportData.date || ""] },
    { slideNumber: 2, title: "Executive Summary", bullets: [(reportData.executiveSummary?.substring(0, 160) || "Summary") + '...'] },
    { slideNumber: 3, title: "Key Findings", bullets: reportData.keyFindings?.slice(0, 3) || ["Content analysis completed"] },
    { slideNumber: 4, title: "Strategic Directives", bullets: reportData.contextAndUseCases?.map(u => u.title) || ["Implementation roadmap"] },
    { slideNumber: 5, title: "Action Plan", bullets: reportData.recommendations?.slice(0, 3) || ["Next steps aligned"] }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-xs font-semibold text-emerald-700 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Multi-Format Publication Ready</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Corporate Document Exporter
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Select your preferred export document type: Microsoft Word (.docx), PowerPoint (.pptx), or Adobe PDF.
            </p>
          </div>

          {/* Format Selector Pills */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            {[
              { id: 'docx', label: 'Word (.docx)', icon: FileText, color: 'text-blue-600' },
              { id: 'pptx', label: 'PowerPoint (.pptx)', icon: Presentation, color: 'text-amber-600' },
              { id: 'pdf', label: 'PDF (.pdf)', icon: FileType, color: 'text-rose-600' }
            ].map(fmt => {
              const Icon = fmt.icon;
              const isSelected = selectedFormat === fmt.id;
              return (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                    isSelected 
                      ? 'bg-white text-slate-900 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${fmt.color}`} />
                  <span>{fmt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Big Export Action Bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ready to Export:</span>
            <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-3 py-1 rounded-md">
              {reportData.title}
            </span>
            <span className="text-xs text-slate-400">by {reportData.preparedBy}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleExport(selectedFormat)}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#d9383a] hover:bg-[#b82d2f] text-white text-xs font-bold shadow-md shadow-red-500/20 disabled:opacity-60 transition-all"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Document...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download {selectedFormat.toUpperCase()}</span>
                </>
              )}
            </button>

            {/* Quick Export All 3 Formats */}
            <button
              onClick={async () => {
                await handleExport('docx');
                await handleExport('pptx');
                await handleExport('pdf');
              }}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors"
            >
              <Layers className="w-4 h-4 text-slate-500" />
              <span>Download All (DOCX + PPT + PDF)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Live Document Previews */}
      {selectedFormat === 'docx' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Word Ribbon Mockup Header */}
          <div className="bg-[#2B579A] text-white px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <FileText className="w-4 h-4" />
              <span>Microsoft Word Document Layout Preview (Modeled after template)</span>
            </div>
            <div className="text-[11px] bg-white/10 px-2.5 py-0.5 rounded text-blue-100">
              Print Layout View • 100%
            </div>
          </div>

          {/* Word Document Canvas */}
          <div className="bg-slate-200/70 p-6 sm:p-10 flex justify-center">
            <div className="w-full max-w-3xl bg-white shadow-xl rounded-sm p-8 sm:p-14 font-sans text-slate-800 space-y-6 border border-slate-300">
              {/* Organization Header */}
              <div className="text-center pb-4 border-b border-slate-200">
                <div className="text-base font-bold text-[#2C5E8A] tracking-wider uppercase font-serif">
                  {reportData.organization || 'Workspace Analysis'}
                </div>
                <div className="text-xs text-slate-500 italic mt-2">
                  Prepared by: <span className="font-semibold text-slate-700">{reportData.preparedBy || 'AI Engine'}</span> • {reportData.date}
                </div>
                <h1 className="text-2xl font-bold text-[#1E3A8A] mt-2 font-serif">
                  {reportData.title}
                </h1>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-1">
                  {reportData.subtitle}
                </p>
              </div>

              {/* Section I */}
              <div>
                <h2 className="text-sm font-bold text-[#1E3A8A] font-serif uppercase tracking-wide border-b border-slate-200 pb-1 mb-2">
                  I. Executive Summary
                </h2>
                <p className="text-xs text-slate-700 leading-relaxed text-justify">
                  {reportData.executiveSummary}
                </p>
              </div>

              {/* Section II */}
              <div>
                <h2 className="text-sm font-bold text-[#1E3A8A] font-serif uppercase tracking-wide border-b border-slate-200 pb-1 mb-2">
                  II. Purpose of the Analysis
                </h2>
                <p className="text-xs text-slate-700 leading-relaxed text-justify">
                  {reportData.purposeOfAnalysis}
                </p>
              </div>

              {/* Section III: Table */}
              <div>
                <h2 className="text-sm font-bold text-[#1E3A8A] font-serif uppercase tracking-wide border-b border-slate-200 pb-1 mb-2">
                  III. Budgeted Revenue and Actual Revenue
                </h2>
                <table className="w-full text-left text-xs border border-slate-300 mt-2">
                  <thead className="bg-[#2C5E8A] text-white">
                    <tr>
                      <th className="p-2 border border-slate-300">Category</th>
                      <th className="p-2 border border-slate-300">Budgeted Amount</th>
                      <th className="p-2 border border-slate-300">Actual Amount</th>
                      <th className="p-2 border border-slate-300">Variance</th>
                      <th className="p-2 border border-slate-300">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.financialTable?.map((row, idx) => {
                      const isTot = row.category.toLowerCase().includes('total');
                      return (
                        <tr key={idx} className={isTot ? 'bg-slate-200 font-bold' : (idx % 2 === 0 ? 'bg-slate-50' : 'bg-white')}>
                          <td className="p-2 border border-slate-300">{row.category}</td>
                          <td className="p-2 border border-slate-300">{row.budgeted}</td>
                          <td className="p-2 border border-slate-300">{row.actual}</td>
                          <td className={`p-2 border border-slate-300 font-semibold ${row.variance.startsWith('+') ? 'text-emerald-700' : (row.variance.startsWith('-') ? 'text-blue-700' : '')}`}>
                            {row.variance}
                          </td>
                          <td className="p-2 border border-slate-300 text-slate-600">{row.status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer Indicator */}
              <div className="pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400">
                Dev Supporter Workspace — Comprehensive Synthesis & Assessment
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedFormat === 'pptx' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* PowerPoint Header */}
          <div className="bg-[#D24726] text-white px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Presentation className="w-4 h-4" />
              <span>Microsoft PowerPoint Deck Preview (16:9 Widescreen)</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveSlide(prev => Math.max(0, prev - 1))}
                disabled={activeSlide === 0}
                className="p-1 rounded hover:bg-white/20 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono">
                Slide {activeSlide + 1} of {slides.length}
              </span>
              <button 
                onClick={() => setActiveSlide(prev => Math.min(slides.length - 1, prev + 1))}
                disabled={activeSlide === slides.length - 1}
                className="p-1 rounded hover:bg-white/20 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Slide Canvas */}
          <div className="bg-slate-900/90 p-8 sm:p-12 flex justify-center items-center">
            <div className="w-full max-w-3xl aspect-[16/9] bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-2xl p-8 sm:p-10 flex flex-col justify-between text-white border border-slate-700 relative overflow-hidden">
              {/* Slide Content */}
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-blue-400">
                  {reportData.organization} • {reportData.date}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                  {slides[activeSlide]?.title}
                </h2>
              </div>

              <div className="space-y-3 my-auto">
                {slides[activeSlide]?.bullets?.map((b, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0"></span>
                    <span className="text-sm text-slate-200 leading-relaxed">{b}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-3">
                <span>Prepared by: {reportData.preparedBy}</span>
                <span>Executive Presentation Deck</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedFormat === 'pdf' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="bg-[#E53935] text-white px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <FileType className="w-4 h-4" />
              <span>Adobe PDF Document Preview (Vector Printable)</span>
            </div>
            <div className="text-[11px] bg-white/15 px-2.5 py-0.5 rounded text-white">
              Vector PDFKit Engine Active
            </div>
          </div>

          <div className="p-8 bg-slate-100 flex justify-center">
            <div className="w-full max-w-2xl bg-white shadow-lg p-8 rounded border border-slate-200 space-y-4">
              <div className="bg-[#2C5E8A] text-white p-4 rounded flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">{reportData.organization}</h3>
                  <div className="text-xs text-blue-100">Financial Reporting Suite • {reportData.date}</div>
                </div>
                <div className="text-right text-xs text-blue-200">
                  Prepared by {reportData.preparedBy}
                </div>
              </div>

              <div className="text-center py-4">
                <h2 className="text-xl font-bold text-slate-900">{reportData.title}</h2>
                <div className="text-xs text-slate-500">{reportData.subtitle}</div>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed border p-3 rounded bg-slate-50">
                <strong className="text-slate-900">Executive Summary: </strong>
                {reportData.executiveSummary}
              </div>

              <div className="border border-slate-300 rounded overflow-hidden">
                <div className="bg-[#2C5E8A] text-white font-bold text-[11px] p-2 flex justify-between">
                  <span>Category</span>
                  <span>Budgeted</span>
                  <span>Actual</span>
                  <span>Variance</span>
                </div>
                {reportData.financialTable?.slice(0, 4).map((row, i) => (
                  <div key={i} className="p-2 text-xs flex justify-between border-t border-slate-200">
                    <span className="font-medium">{row.category}</span>
                    <span>{row.budgeted}</span>
                    <span>{row.actual}</span>
                    <span className="font-bold text-blue-700">{row.variance}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Download History List */}
      {downloadHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Generated Downloads
          </h4>
          <div className="divide-y divide-slate-100">
            {downloadHistory.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {item.format}
                  </span>
                  <span className="text-slate-800 font-medium">{item.filename}</span>
                  <span className="text-slate-400">({item.size})</span>
                </div>
                <a
                  href={item.url}
                  download={item.filename}
                  className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Again</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

