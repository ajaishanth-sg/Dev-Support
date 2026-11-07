import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  FileCheck2, 
  TrendingUp, 
  HelpCircle, 
  ArrowRight, 
  Lightbulb,
  Building,
  DollarSign,
  PieChart,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import axios from 'axios';

const PRESET_PROMPTS = [
  {
    title: 'Executive Summary & Context Brief',
    prompt: 'Provide a comprehensive executive briefing explaining the core discussion, why it took place, background context, and what the speakers concluded.'
  },
  {
    title: 'Key Requirements & Specifications',
    prompt: 'Extract all specific requirements, operational specifications, technical parameters, and working guidelines mentioned in this content.'
  },
  {
    title: 'Chronological Flow & Topic Deep-Dive',
    prompt: 'Break down the discussion chronologically from start to end, detailing what was raised at each stage and analyzing the underlying concepts.'
  },
  {
    title: 'Actionable Next Steps & Decision Matrix',
    prompt: 'Summarize all agreed-upon decisions, assign clear action items, and outline the delivery milestones and strategic roadmap.'
  }
];

export default function AIAnalysisTab({ 
  initialContent = '', 
  onSendToExport, 
  apiKey 
}) {
  const [content, setContent] = useState(initialContent);
  const [userPrompt, setUserPrompt] = useState('Analyze the uploaded recording or document. Extract key operational topics, chronological flow from start to end, core figures and metrics, and strategic recommendations.');
  const [isLoading, setIsLoading] = useState(false);
  const [reportResult, setReportResult] = useState(null);

  React.useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
    }
  }, [initialContent]);

  const handleGenerateReport = async () => {
    if (!content.trim()) {
      alert('Please provide transcript or text content to analyze.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post('/api/analyze', {
        content,
        userPrompt,
        reportTemplate: 'financial',
        apiKey
      });

      if (res.data && res.data.success) {
        setReportResult(res.data.report);
      } else {
        throw new Error(res.data?.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      alert(`AI Analysis error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-xs font-semibold text-indigo-700 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Context & Prompt Intelligence</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          AI Context & Custom Prompt Analyzer
        </h2>
        <p className="mt-2 text-sm text-slate-600 max-w-3xl leading-relaxed">
          Ask Antigravity AI to extract specific context, build business use cases, audit financial variances, or structure executive briefs from your uploaded audio, video, or data. The resulting report is formatted to seamlessly export into Word, PowerPoint, or PDF.
        </p>

        {/* User Prompt Input Box */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>What would you like the report to focus on? (Your Custom Prompt)</span>
            </label>
            <span className="text-[11px] text-indigo-600 font-medium">Adapts to any custom inquiry</span>
          </div>

          <div className="relative">
            <textarea
              rows={3}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="e.g. Give me a proper use case, financial context, budget vs actual tables, and strategic recommendations..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-sm text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-hidden leading-relaxed"
            />
          </div>

          {/* Quick Preset Prompts */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-400">Prompt Presets:</span>
            {PRESET_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setUserPrompt(p.prompt)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-transparent text-xs font-medium text-slate-600 transition-colors"
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        {/* Source Text / Transcript Box */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Source Data / Audio Transcript Input
            </label>
            <span className="text-xs text-slate-400">
              {content ? `${content.split(/\s+/).length} words` : 'Empty'}
            </span>
          </div>
          <textarea
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste transcript, meeting audio text, financial figures, or data here..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs text-slate-700 font-mono focus:border-indigo-500 focus:outline-hidden"
          />
        </div>

        {/* Action Button */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={handleGenerateReport}
            disabled={isLoading || !content.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing Context & Financial Report...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Corporate Analysis Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Report Preview */}
      {reportResult && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Header Bar */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-bold text-slate-900">
                {reportResult.organization} — {reportResult.title}
              </span>
            </div>

            <button
              onClick={() => onSendToExport(reportResult)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#d9383a] hover:bg-[#b82d2f] text-white text-xs font-bold shadow-md shadow-red-500/20 transition-all"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Export to PPT, Word (DOCX), or PDF</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Document Content formatted matching the user's uploaded Financial Template Bundle */}
          <div className="p-6 md:p-8 space-y-8 font-sans">
            {/* Title Block */}
            <div className="text-center pb-6 border-b border-slate-200">
              <div className="text-sm font-bold tracking-widest text-[#2C5E8A] uppercase">
                {reportResult.organization || 'Workspace Analysis'}
              </div>
              <div className="text-xs text-slate-500 italic mt-2">
                Prepared by: <span className="font-semibold text-slate-700">{reportResult.preparedBy || 'AI Engine'}</span> • {reportResult.date}
              </div>
              <h1 className="text-2xl font-extrabold text-[#1E3A8A] mt-2">
                {reportResult.title}
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                {reportResult.subtitle}
              </p>
            </div>

            {/* Section I: Executive Summary */}
            <div>
              <h3 className="text-base font-bold text-[#1E3A8A] mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1E3A8A]"></span>
                I. Executive Summary
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-200/70">
                {reportResult.executiveSummary}
              </p>
            </div>

            {/* Section II: Purpose of Analysis */}
            <div>
              <h3 className="text-base font-bold text-[#1E3A8A] mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1E3A8A]"></span>
                II. Purpose of the Analysis
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-200/70">
                {reportResult.purposeOfAnalysis}
              </p>
            </div>

            {/* Section III: Financial Table */}
            <div>
              <h3 className="text-base font-bold text-[#1E3A8A] mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                III. Budgeted Revenue and Actual Revenue Table
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#2C5E8A] text-white font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4">Budgeted Amount</th>
                      <th className="py-2.5 px-4">Actual Amount</th>
                      <th className="py-2.5 px-4">Variance</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportResult.financialTable?.map((row, idx) => {
                      const isTot = row.category.toLowerCase().includes('total');
                      return (
                        <tr key={idx} className={isTot ? 'bg-slate-100 font-bold' : (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60')}>
                          <td className="py-2.5 px-4 font-medium text-slate-900">{row.category}</td>
                          <td className="py-2.5 px-4 text-slate-600">{row.budgeted}</td>
                          <td className="py-2.5 px-4 text-slate-600">{row.actual}</td>
                          <td className={`py-2.5 px-4 font-semibold ${row.variance.startsWith('+') ? 'text-emerald-600' : (row.variance.startsWith('-') ? 'text-blue-600' : 'text-slate-700')}`}>
                            {row.variance}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500">{row.status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section IV: Context & Strategic Use Cases */}
            <div>
              <h3 className="text-base font-bold text-[#1E3A8A] mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                IV. Context & Specific Use Cases (Fulfilling Your Request)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reportResult.contextAndUseCases?.map((uc, i) => (
                  <div key={i} className="p-4 rounded-xl bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/80 shadow-2xs">
                    <div className="text-xs font-bold text-[#1E3A8A] mb-1.5 uppercase tracking-wide">
                      {uc.title}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {uc.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section V: Key Findings & Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Key Findings
                </h4>
                <ul className="space-y-2 text-xs text-slate-700">
                  {reportResult.keyFindings?.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✔</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  Strategic Recommendations
                </h4>
                <ul className="space-y-2 text-xs text-slate-700">
                  {reportResult.recommendations?.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="font-bold text-indigo-600">{i + 1}.</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

