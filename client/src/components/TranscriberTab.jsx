import React, { useState, useRef } from 'react';
import { 
  FileText, 
  FolderTree, 
  Sparkles, 
  Upload, 
  BookOpen, 
  HelpCircle, 
  CheckCircle2, 
  Layers, 
  Copy, 
  Check, 
  Download, 
  ArrowRight, 
  Loader2, 
  Languages, 
  Mic, 
  FileCode2, 
  FileCheck2, 
  ChevronRight,
  ChevronDown,
  Quote,
  Lightbulb,
  Info,
  ListOrdered,
  Cpu,
  Globe,
  Zap,
  Presentation,
  FileType,
  Timer,
  Hourglass,
  Activity,
  BarChart3
} from 'lucide-react';
import axios from 'axios';

const SUPPORTED_LANGUAGES = [
  { code: 'auto', label: '🌐 Auto-Detect Language (Multilingual)' },
  { code: 'ta', label: '🇮🇳 Tamil (தமிழ்) — Transcribe or Translate' },
  { code: 'en', label: '🇺🇸 English (US/UK)' },
  { code: 'hi', label: '🇮🇳 Hindi (हिन्दी)' },
  { code: 'es', label: '🇪🇸 Spanish (Español)' },
  { code: 'fr', label: '🇫🇷 French (Français)' },
  { code: 'de', label: '🇩🇪 German (Deutsch)' },
  { code: 'zh', label: '🇨🇳 Mandarin (中文)' },
  { code: 'ja', label: '🇯🇵 Japanese (日本語)' },
  { code: 'ar', label: '🇸🇦 Arabic (العربية)' },
  { code: 'pt', label: '🇧🇷 Portuguese (Português)' }
];

export default function TranscriberTab({ 
  onSendToAnalysis, 
  preloadedFile,
  apiKey 
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [language, setLanguage] = useState('auto');
  const [task, setTask] = useState('transcribe');
  const [engine, setEngine] = useState('groq');
  const [model, setModel] = useState('large-v3');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressInfo, setProgressInfo] = useState({
    percentage: 0,
    remainingPercentage: 100,
    stage: '',
    elapsedSeconds: 0,
    estimatedRemainingSeconds: 0,
    durationFormatted: '',
    fileSizeMb: '',
    chunksTotal: 1,
    chunkCurrent: 0,
    phase: 1
  });
  const [resultData, setResultData] = useState(null);
  const [activeFileSection, setActiveFileSection] = useState('comprehension');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    if (preloadedFile) {
      setSelectedFile({
        name: preloadedFile.originalName,
        existingFileName: preloadedFile.outputFileName,
        isPreloaded: true
      });
    }
  }, [preloadedFile]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResultData(null);
    }
  };

  const handleStartTranscribeAndAnalyze = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    const initialSizeMb = selectedFile.size ? (selectedFile.size / (1024 * 1024)).toFixed(1) : '0';

    // Initial Progress state
    setProgressInfo({
      percentage: 3,
      remainingPercentage: 97,
      stage: 'Initializing workspace and analyzing audio stream format...',
      elapsedSeconds: 0,
      estimatedRemainingSeconds: 30,
      durationFormatted: 'Analyzing duration...',
      fileSizeMb: initialSizeMb,
      chunksTotal: 1,
      chunkCurrent: 0,
      phase: 1
    });

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    let pollInterval = null;
    let timerInterval = null;
    let localSeconds = 0;

    // Start local timer ticker
    timerInterval = setInterval(() => {
      localSeconds += 1;
      setProgressInfo(prev => ({
        ...prev,
        elapsedSeconds: localSeconds
      }));
    }, 1000);

    // Polling server for real-time progress updates
    const startPolling = () => {
      if (pollInterval) return;
      pollInterval = setInterval(async () => {
        try {
          const pollRes = await axios.get(`/api/transcribe/progress/${jobId}`);
          if (pollRes.data) {
            const data = pollRes.data;
            const pct = Math.min(99, Math.max(10, data.percentage || 10));

            let phase = 1;
            if (pct >= 18 && pct < 78) phase = 2; // Whisper
            else if (pct >= 78 && pct < 90) phase = 3; // Cognitive
            else if (pct >= 90) phase = 4; // Document

            setProgressInfo(prev => ({
              ...prev,
              percentage: pct,
              remainingPercentage: Math.max(1, 100 - pct),
              stage: data.currentStage || prev.stage,
              estimatedRemainingSeconds: data.estimatedRemainingSeconds !== undefined ? data.estimatedRemainingSeconds : prev.estimatedRemainingSeconds,
              durationFormatted: data.durationFormatted || prev.durationFormatted,
              fileSizeMb: data.fileSizeMb || prev.fileSizeMb,
              chunksTotal: data.chunksTotal || prev.chunksTotal,
              chunkCurrent: data.chunkCurrent || prev.chunkCurrent,
              phase
            }));

            if (data.status === 'completed' && data.result) {
              clearInterval(pollInterval);
              clearInterval(timerInterval);
              setProgressInfo(prev => ({ ...prev, percentage: 100, remainingPercentage: 0, stage: 'Complete! All documents ready.' }));
              setResultData(data.result);
              setIsProcessing(false);
            }
          }
        } catch (pollErr) {
          // ignore transient poll drops
        }
      }, 700);
    };

    try {
      const formData = new FormData();
      if (selectedFile.isPreloaded) {
        formData.append('existingFileName', selectedFile.existingFileName);
      } else {
        formData.append('file', selectedFile);
      }
      formData.append('jobId', jobId);
      formData.append('language', language);
      formData.append('task', task);
      formData.append('engine', engine);
      formData.append('model', model);
      if (apiKey) formData.append('apiKey', apiKey);

      // Start progress poller
      startPolling();

      const res = await axios.post('/api/transcribe', formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const uploadPct = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            if (uploadPct < 100) {
              const mappedPct = Math.round((uploadPct / 100) * 12);
              setProgressInfo(prev => ({
                ...prev,
                percentage: Math.max(prev.percentage, mappedPct),
                remainingPercentage: 100 - mappedPct,
                stage: `Uploading media file to workspace: ${uploadPct}% (${(progressEvent.loaded / (1024 * 1024)).toFixed(1)} / ${(progressEvent.total / (1024 * 1024)).toFixed(1)} MB)...`,
                phase: 1
              }));
            }
          }
        }
      });

      clearInterval(pollInterval);
      clearInterval(timerInterval);

      if (res.data && res.data.success) {
        setProgressInfo(prev => ({
          ...prev,
          percentage: 100,
          remainingPercentage: 0,
          stage: 'Complete! All documents generated and ready for download.',
          phase: 4
        }));
        setResultData(res.data);
      } else {
        throw new Error(res.data?.error || 'Transcription and analysis failed');
      }
    } catch (err) {
      clearInterval(pollInterval);
      clearInterval(timerInterval);
      console.error('Transcription error:', err);
      alert(`Transcription error: ${err.response?.data?.error || err.message}`);
    } finally {
      clearInterval(pollInterval);
      clearInterval(timerInterval);
      setIsProcessing(false);
    }
  };

  const notebook = resultData?.notebookLM;
  const docs = resultData?.documents;

  const copyStructuredDoc = () => {
    if (!notebook) return;
    const textToCopy = `
# ${notebook.sourceTitle || 'NotebookLM Source Document'}
Source Type: ${notebook.sourceType}

## 1. Chronological Audio Flow (Start to End Explanation)
### Beginning Context & Problem Scope:
${notebook.chronologicalFlow?.beginning || 'Opening context and background.'}

### Core Body, Discussions & Workflows (Middle):
${notebook.chronologicalFlow?.middle || 'Detailed analysis, calculations, and operational specifications.'}

### Concluding Agreements, Decisions & Next Steps (End):
${notebook.chronologicalFlow?.conclusion || 'Final agreements, outcomes, and resolutions.'}

## 2. Executive Synthesis & Big Picture Context
${notebook.briefingDoc?.executiveAbstract}

### Key Takeaways:
${notebook.briefingDoc?.keyTakeaways?.map(t => `- ${t}`).join('\n')}

## 3. Thematic Information Breakdown
${notebook.thematicInformation?.map(info => `
### ${info.topic}
${info.summary}
${info.keyInsights?.map(i => `* ${i}`).join('\n')}
`).join('\n')}

## 4. Reconciled Metrics & Quantitative Overview
${(notebook.financialTable || []).map(r => `* ${r.category}: Budgeted ${r.budgeted} | Actual ${r.actual} | Variance ${r.variance} (${r.status})`).join('\n')}

## 5. Chaptered Structured Transcript
${notebook.structuredTranscript?.map(ch => `
### ${ch.chapterTitle}
**Participants**: ${ch.speaker}
${ch.paragraphs?.join('\n\n')}
`).join('\n')}

## 6. Core Grounded Q&A
${notebook.groundedFAQ?.map(f => `
**Q: ${f.question}**
A: ${f.answer}
*Evidence Citation*: "${f.sourceQuote}"
`).join('\n\n')}

## 7. Action Plan & Next Steps
${notebook.actionPlan?.map((a, i) => `${i + 1}. ${a}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdownDoc = () => {
    if (!notebook) return;
    const textToCopy = `
# ${notebook.sourceTitle || 'NotebookLM Source Document'}

## 1. Chronological Audio Flow (Start to End Explanation)
### Beginning Context & Problem Scope:
${notebook.chronologicalFlow?.beginning || 'Opening context and background.'}

### Core Body, Discussions & Workflows (Middle):
${notebook.chronologicalFlow?.middle || 'Detailed analysis, calculations, and operational specifications.'}

### Concluding Agreements, Decisions & Next Steps (End):
${notebook.chronologicalFlow?.conclusion || 'Final agreements, outcomes, and resolutions.'}

## 2. Executive Synthesis
${notebook.briefingDoc?.executiveAbstract}

### Key Takeaways
${notebook.briefingDoc?.keyTakeaways?.map(t => `- ${t}`).join('\n')}

## 3. Thematic Information Breakdown
${notebook.thematicInformation?.map(info => `
### ${info.topic}
${info.summary}
${info.keyInsights?.map(i => `* ${i}`).join('\n')}
`).join('\n')}

## 4. Reconciled Metrics & Quantitative Overview
${(notebook.financialTable || []).map(r => `* ${r.category}: Budgeted ${r.budgeted} | Actual ${r.actual} | Variance ${r.variance} (${r.status})`).join('\n')}

## 5. Structured Transcript (Organized by Chapters)
${notebook.structuredTranscript?.map(ch => `
### ${ch.chapterTitle}
**${ch.speaker}**
${ch.paragraphs?.join('\n\n')}
`).join('\n')}

## 6. Grounded FAQ
${notebook.groundedFAQ?.map(f => `
#### ${f.question}
${f.answer}
> "${f.sourceQuote}"
`).join('\n')}

## 7. Action Plan & Strategic Decisions
${notebook.actionPlan?.map((a, i) => `${i + 1}. ${a}`).join('\n')}
    `.trim();

    const blob = new Blob([textToCopy], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(selectedFile?.name || 'NotebookLM_Source').replace(/\.[^/.]+$/, "")}_Structured_Doc.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-xs font-semibold text-blue-700">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>OpenAI Whisper & NotebookLM REA Platform</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Multilingual Speech & Direct Tamil-to-English Translation</span>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          OpenAI Whisper & NotebookLM Semantic Workspace
        </h2>
        <p className="mt-2 text-sm text-slate-600 max-w-3xl leading-relaxed">
          Powered by <strong>OpenAI Whisper</strong> (multilingual speech recognition) and <strong>Google NotebookLM</strong> semantic grounding. Transcribe native speech (including Tamil to Tamil text) or translate foreign audio directly into English, organized into an executive briefing and chaptered document outline with instant Word, PowerPoint, and PDF generation.
        </p>

        {/* Configuration Bar */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              Audio Spoken Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-hidden"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>Whisper Task Mode</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setTask('transcribe')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                  task === 'transcribe'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🗣️ Transcribe
              </button>
              <button
                type="button"
                onClick={() => setTask('translate')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                  task === 'translate'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Translate non-English audio (e.g. Tamil) directly into English text"
              >
                🌐 Translate to EN
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              <span>Whisper Engine & Model</span>
            </label>
            <div className="flex gap-2">
              <select
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                className="w-1/2 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800"
              >
                <option value="groq">⚡ Groq Cloud (Fast)</option>
                <option value="local">💻 Local Python</option>
              </select>

              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-1/2 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800"
              >
                <option value="large-v3">large-v3 (Best)</option>
                <option value="medium">medium (Balanced)</option>
                <option value="small">small (Fast)</option>
                <option value="base">base (Lightweight)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <input 
          ref={fileInputRef} 
          type="file" 
          onChange={handleFileChange} 
          className="hidden" 
          accept="audio/*,video/*,.mp4,.mp3,.wav,.m4a,.aac,.flac,.mkv,.webm,.pdf,.txt,.md,.json,.csv" 
        />

        {!selectedFile ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center transition-all bg-slate-50/50 hover:bg-blue-50/20"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-800">
              Drop or click to upload any Audio, Video, or Document
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Supports Tamil speech, English, and multilingual recordings (any file size or length like 50+ min recordings)
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">{selectedFile.name}</div>
                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <span>{selectedFile.isPreloaded ? 'Imported from Converter' : `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`}</span>
                  <span>•</span>
                  <span className="font-semibold text-indigo-600 uppercase text-[10px]">
                    Task: {task === 'translate' ? 'Translate to English' : 'Native Transcription'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
              >
                Change File
              </button>
              <button
                onClick={handleStartTranscribeAndAnalyze}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-60 transition-all"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Whisper...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{task === 'translate' ? 'Translate to English & Structure' : 'Transcribe & Structure'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="mt-5 p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white shadow-xl space-y-5 animate-fade-in">
            {/* Header with Title and File Metadata */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>AI Transcription & Cognitive Structuring</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  </div>
                  <div className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                    <span className="font-medium truncate max-w-[200px] sm:max-w-[320px]">{selectedFile.name}</span>
                    <span>•</span>
                    <span className="text-blue-300">{progressInfo.fileSizeMb || (selectedFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                    <span>•</span>
                    <span className="text-emerald-300 font-semibold">{progressInfo.durationFormatted || 'Analyzing length...'}</span>
                  </div>
                </div>
              </div>

              {/* Percentage Badges (Completed & Remaining) */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
                    {progressInfo.percentage}%
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Completed
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-700/60"></div>

                <div className="text-left">
                  <div className="text-lg font-bold text-amber-300">
                    {progressInfo.remainingPercentage}%
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Remaining
                  </div>
                </div>
              </div>
            </div>

            {/* Glowing Active Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-200 flex items-center gap-2 truncate">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400 shrink-0" />
                  <span className="truncate">{progressInfo.stage || 'Processing audio stream...'}</span>
                </span>
                <span className="text-blue-300 shrink-0 ml-2 font-mono">
                  {progressInfo.percentage}% / 100%
                </span>
              </div>

              <div className="w-full h-3.5 bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-indigo-500/30 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-500 relative"
                  style={{ width: `${Math.max(4, Math.min(100, progressInfo.percentage))}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Live Metric Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2.5">
                <Timer className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Elapsed Time</div>
                  <div className="text-xs font-mono font-bold text-white">
                    {Math.floor(progressInfo.elapsedSeconds / 60)}m {progressInfo.elapsedSeconds % 60}s
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2.5">
                <Hourglass className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Estimated Left</div>
                  <div className="text-xs font-mono font-bold text-amber-300">
                    {progressInfo.estimatedRemainingSeconds > 0 
                      ? `~${progressInfo.estimatedRemainingSeconds}s remaining` 
                      : 'Finalizing...'}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Audio Segments</div>
                  <div className="text-xs font-bold text-purple-200">
                    {progressInfo.chunksTotal > 1 
                      ? `Chunk ${progressInfo.chunkCurrent || 1} of ${progressInfo.chunksTotal}`
                      : 'Single Stream'}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Whisper Engine</div>
                  <div className="text-xs font-bold text-emerald-300 uppercase">
                    {engine === 'groq' ? 'Cloud Large-v3' : 'Local Python'}
                  </div>
                </div>
              </div>
            </div>

            {/* 4-Step Visual Progress Checklist */}
            <div className="pt-2 border-t border-indigo-900/40 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${progressInfo.phase >= 1 ? 'bg-blue-600/20 text-blue-200 border border-blue-500/30' : 'text-slate-500'}`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${progressInfo.phase > 1 ? 'bg-emerald-500 text-white' : (progressInfo.phase === 1 ? 'bg-blue-500 text-white animate-spin' : 'bg-slate-700 text-slate-400')}`}>
                  {progressInfo.phase > 1 ? '✓' : '1'}
                </span>
                <span className="font-semibold truncate">1. Audio Prep</span>
              </div>

              <div className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${progressInfo.phase >= 2 ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'text-slate-500'}`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${progressInfo.phase > 2 ? 'bg-emerald-500 text-white' : (progressInfo.phase === 2 ? 'bg-purple-500 text-white animate-spin' : 'bg-slate-700 text-slate-400')}`}>
                  {progressInfo.phase > 2 ? '✓' : '2'}
                </span>
                <span className="font-semibold truncate">2. Whisper Speech</span>
              </div>

              <div className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${progressInfo.phase >= 3 ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30' : 'text-slate-500'}`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${progressInfo.phase > 3 ? 'bg-emerald-500 text-white' : (progressInfo.phase === 3 ? 'bg-indigo-500 text-white animate-spin' : 'bg-slate-700 text-slate-400')}`}>
                  {progressInfo.phase > 3 ? '✓' : '3'}
                </span>
                <span className="font-semibold truncate">3. Start-to-End AI</span>
              </div>

              <div className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${progressInfo.phase >= 4 ? 'bg-emerald-600/20 text-emerald-200 border border-emerald-500/30' : 'text-slate-500'}`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${progressInfo.percentage >= 100 ? 'bg-emerald-500 text-white' : (progressInfo.phase === 4 ? 'bg-emerald-500 text-white animate-spin' : 'bg-slate-700 text-slate-400')}`}>
                  {progressInfo.percentage >= 100 ? '✓' : '4'}
                </span>
                <span className="font-semibold truncate">4. DOCX / PPT / PDF</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* INSTANT DOWNLOAD BAR (DOCUMENTS GENERATED AUTOMATICALLY!) */}
      {docs && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Documents Automatically Generated & Ready</span>
              </div>
              <h3 className="text-lg font-bold text-white">
                Download Your Complete Report Package
              </h3>
              <p className="text-xs text-slate-300">
                Complete Executive Synthesis, Chronological Flow, and Actionable Briefing.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {docs.docx && (
                <a
                  href={docs.docx}
                  download={docs.docxName || 'Report.docx'}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download Word (.DOCX)</span>
                </a>
              )}

              {docs.pptx && (
                <a
                  href={docs.pptx}
                  download={docs.pptxName || 'Report.pptx'}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition-all"
                >
                  <Presentation className="w-4 h-4" />
                  <span>Download PPT (.PPTX)</span>
                </a>
              )}

              {docs.pdf && (
                <a
                  href={docs.pdf}
                  download={docs.pdfName || 'Report.pdf'}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all"
                >
                  <FileType className="w-4 h-4" />
                  <span>Download PDF (.PDF)</span>
                </a>
              )}

              {docs.txt && (
                <a
                  href={docs.txt}
                  download={docs.txtName || 'Transcript.txt'}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Transcript (.TXT)</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NotebookLM File Structure & Structured Document Workspace */}
      {notebook && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Top Bar */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-blue-600" />
              <div>
                <span className="text-sm font-bold text-slate-900">{notebook.sourceTitle}</span>
                <span className="text-xs text-slate-500 ml-2">({notebook.sourceType})</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyStructuredDoc}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Document'}</span>
              </button>

              <button
                onClick={downloadMarkdownDoc}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Markdown (.MD)</span>
              </button>

              <button
                onClick={() => onSendToAnalysis(
                  `${notebook.briefingDoc?.executiveAbstract}\n\n${notebook.structuredTranscript?.map(s => s.paragraphs?.join(' ')).join('\n\n')}`,
                  notebook.sourceTitle
                )}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#d9383a] hover:bg-[#b82d2f] text-white text-xs font-bold shadow-md shadow-red-500/20 transition-all"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Open in Report Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Main 2-Column NotebookLM Layout */}
          <div className="flex flex-col md:flex-row min-h-[580px]">
            {/* Left Column: Proper File Structure Tree View */}
            <div className="w-full md:w-72 bg-slate-50/80 border-r border-slate-200 p-4 shrink-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 px-2 flex items-center justify-between">
                <span>Document Outline Tree</span>
                <FolderTree className="w-3.5 h-3.5" />
              </div>

              <div className="space-y-1 text-xs">
                <button
                  onClick={() => setActiveFileSection('comprehension')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeFileSection === 'comprehension'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200/60'
                  }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
                  <span className="truncate">1. Audio Explanation (Start to End)</span>
                </button>

                <button
                  onClick={() => setActiveFileSection('thematic')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeFileSection === 'thematic'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200/60'
                  }`}
                >
                  <Lightbulb className="w-4 h-4 shrink-0" />
                  <span className="truncate">2. Thematic Deep Insights</span>
                </button>

                <button
                  onClick={() => setActiveFileSection('metrics')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeFileSection === 'metrics'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200/60'
                  }`}
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span className="truncate">3. Reconciled Metrics Table</span>
                </button>

                <button
                  onClick={() => setActiveFileSection('transcript')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeFileSection === 'transcript'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200/60'
                  }`}
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span className="truncate">4. Chaptered Transcript</span>
                </button>

                <button
                  onClick={() => setActiveFileSection('faq')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeFileSection === 'faq'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200/60'
                  }`}
                >
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span className="truncate">5. Grounded Q&A / Study Guide</span>
                </button>

                <button
                  onClick={() => setActiveFileSection('actions')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeFileSection === 'actions'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200/60'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">6. Action Plan & Decisions</span>
                </button>
              </div>

              {/* Source Stats Box */}
              <div className="mt-8 p-3 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-500 space-y-1.5">
                <div className="font-semibold text-slate-800">Whisper Pipeline:</div>
                <div className="flex justify-between">
                  <span>Engine:</span>
                  <span className="font-semibold text-blue-700 uppercase">{resultData?.engine || engine}</span>
                </div>
                <div className="flex justify-between">
                  <span>Task:</span>
                  <span className="font-semibold text-indigo-700 uppercase">{resultData?.task || task}</span>
                </div>
                <div className="flex justify-between">
                  <span>Language:</span>
                  <span className="font-medium text-slate-700">{resultData?.language || language}</span>
                </div>
                <div className="flex justify-between">
                  <span>Chapters:</span>
                  <span className="font-medium text-slate-700">{notebook.structuredTranscript?.length || 3} sections</span>
                </div>
              </div>
            </div>

            {/* Right Column: Structured Content Pane */}
            <div className="flex-1 p-6 md:p-8 max-h-[700px] overflow-y-auto">
              {/* SECTION 1: Start-to-End Audio Comprehension & Explanation */}
              {activeFileSection === 'comprehension' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        <span>Cognitive Speech Explanation • Start to End</span>
                      </span>
                      <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                        {notebook.briefingDoc?.title || 'Executive Synthesis & Chronological Audio Comprehension'}
                      </h3>
                    </div>
                  </div>

                  {/* 3 Chronological Progression Cards (Start -> Middle -> End) */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <ListOrdered className="w-4 h-4 text-blue-600" />
                      <span>Chronological Flow: Understanding From Beginning to Conclusion</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {/* Beginning Card */}
                      <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 shadow-2xs space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            1
                          </span>
                          <span className="text-xs font-bold text-blue-900">
                            Beginning (Context & Scope)
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-normal">
                          {notebook.chronologicalFlow?.beginning || 'Opening remarks, problem definition, and initial context setting.'}
                        </p>
                      </div>

                      {/* Middle Card */}
                      <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/80 shadow-2xs space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            2
                          </span>
                          <span className="text-xs font-bold text-purple-900">
                            Middle (Core Discussion)
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-normal">
                          {notebook.chronologicalFlow?.middle || 'In-depth review of operational workflows, balance reconciliations, and calculations.'}
                        </p>
                      </div>

                      {/* Conclusion Card */}
                      <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 shadow-2xs space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            3
                          </span>
                          <span className="text-xs font-bold text-emerald-900">
                            Ending (Outcomes & Next Steps)
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-normal">
                          {notebook.chronologicalFlow?.conclusion || 'Agreements finalized, operational directives approved, and roadmap committed.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Executive Abstract / Overview */}
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Audio Summary & Core Purpose:
                    </span>
                    <div className="leading-relaxed text-xs sm:text-sm text-slate-700 whitespace-pre-line">
                      {notebook.briefingDoc?.executiveAbstract}
                    </div>
                  </div>

                  {/* Key Grounded Takeaways & Real Figures */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2 uppercase tracking-wide">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Key Facts, Figures & Decisions From Audio:</span>
                    </h4>
                    <div className="space-y-2">
                      {notebook.briefingDoc?.keyTakeaways?.map((takeaway, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-xs text-slate-800 leading-relaxed font-medium">
                            {takeaway}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: Thematic Deep Insights & Conceptual Framework */}
              {activeFileSection === 'thematic' && (
                <div className="space-y-6">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                      Thematic Conceptual Framework
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                      Deep Knowledge Extraction & Concept Analysis
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {notebook.thematicInformation?.map((item, idx) => (
                      <div key={idx} className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                            {idx + 1}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900">{item.topic}</h4>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg">
                          {item.summary}
                        </p>
                        <div className="space-y-1.5 pt-1">
                          {item.keyInsights?.map((insight, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                              <span className="text-blue-500 font-bold">•</span>
                              <span>{insight}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 3: Quantitative & Reconciled Metrics Table */}
              {activeFileSection === 'metrics' && (
                <div className="space-y-6">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                      Grounded Quantitative Overview
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                      Reconciled Metrics & Quantitative Overview
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Tabular balance sheet and operational numbers reconciled directly from audio discourse.
                    </p>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#1E3A8A] text-white uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-4 font-bold">Category / Item</th>
                          <th className="py-3 px-4 font-bold">Budgeted / Quote</th>
                          <th className="py-3 px-4 font-bold">Actual / Recorded</th>
                          <th className="py-3 px-4 font-bold">Variance</th>
                          <th className="py-3 px-4 font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {(notebook.financialTable || []).map((row, idx) => {
                          const isTot = row.category?.toLowerCase().includes('total');
                          const varColor = row.variance?.startsWith('+') ? 'text-emerald-600' : (row.variance?.startsWith('-') ? 'text-blue-600' : 'text-slate-700');
                          return (
                            <tr key={idx} className={isTot ? 'bg-slate-100 font-bold' : (idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white')}>
                              <td className="py-3 px-4 font-medium text-slate-900">{row.category}</td>
                              <td className="py-3 px-4 text-slate-700">{row.budgeted}</td>
                              <td className="py-3 px-4 text-slate-700">{row.actual}</td>
                              <td className={`py-3 px-4 font-bold ${varColor}`}>{row.variance}</td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                                  {row.status || 'Reconciled'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SECTION 4: Chaptered Structured Transcript */}
              {activeFileSection === 'transcript' && (
                <div className="space-y-6">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                      Discourse & Dialogue Record
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                      Chaptered Transcript Layout (Readable Paragraphs)
                    </h3>
                  </div>

                  <div className="space-y-6">
                    {notebook.structuredTranscript?.map((chapter, cIdx) => (
                      <div key={cIdx} className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                        <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-100 gap-2">
                          <h4 className="text-sm font-extrabold text-[#1E3A8A]">
                            {chapter.chapterTitle}
                          </h4>
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                            Speaker: {chapter.speaker}
                          </span>
                        </div>

                        <div className="space-y-3 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
                          {chapter.paragraphs?.map((p, pIdx) => (
                            <p key={pIdx} className="leading-relaxed">
                              {p}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 5: Grounded Q&A / Study Guide */}
              {activeFileSection === 'faq' && (
                <div className="space-y-6">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                      NotebookLM Grounded Study Guide
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                      Frequently Asked Questions & Evidence Citations
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {notebook.groundedFAQ?.map((faq, idx) => (
                      <div key={idx} className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                        <div className="flex items-start gap-2.5">
                          <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">{faq.question}</h4>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed pl-6.5">
                          {faq.answer}
                        </p>
                        {faq.sourceQuote && (
                          <div className="ml-6.5 p-2.5 rounded-lg bg-blue-50/60 border border-blue-200/60 text-[11px] text-blue-900 italic flex items-start gap-2">
                            <Quote className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                            <span>"{faq.sourceQuote}"</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 6: Action Plan & Next Steps */}
              {activeFileSection === 'actions' && (
                <div className="space-y-6">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                      Action Matrix & Decisions
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                      Strategic Execution Roadmap
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {notebook.actionPlan?.map((action, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="text-xs sm:text-sm font-semibold text-slate-800">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
