import React, { useState } from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  Code2, 
  Zap, 
  ShieldCheck, 
  Play, 
  Pause,
  FileText, 
  FileCheck2, 
  Mic, 
  ArrowRightLeft, 
  Layers, 
  CheckCircle2, 
  Globe, 
  Download, 
  FileType, 
  Presentation, 
  SlidersHorizontal, 
  Cpu,
  Check,
  TrendingUp,
  History,
  Building,
  Search,
  ChevronRight,
  Terminal,
  Clock,
  Volume2,
  Lock,
  Boxes,
  Database,
  Briefcase,
  Users,
  BarChart3
} from 'lucide-react';

export default function LandingPage({ onNavigate }) {
  // Glean-style Interactive Search / Prompt Simulator
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [activeTeamTab, setActiveTeamTab] = useState('developers');
  const [isPlayingDemoAudio, setIsPlayingDemoAudio] = useState(false);

  const heroSearchPrompts = [
    {
      query: "Extract 320kbps MP3 from board_meeting_recording.mp4 and boost audio volume +3dB",
      module: "Media Converter",
      badge: "FFmpeg 8.1 Active",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
      thought: "Ingesting MP4 container ➔ Demuxing AAC/H.264 stream ➔ Normalizing sample rate to 44.1kHz ➔ Encoding lossless 320kbps MP3.",
      resultTitle: "board_meeting_recording.mp3",
      resultMeta: "Audio Layer 3 • 320 kbps • Stereo • 48.2 MB",
      actionText: "Ready in Workspace"
    },
    {
      query: "Transcribe Tamil technical lecture and translate directly into English text",
      module: "AI Transcriber",
      badge: "Whisper Large-v3",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      thought: "Audio ingested ➔ Language recognized: Tamil (ta) ➔ Task: translate ➔ OpenAI Whisper large-v3 stream translates to structured English outline.",
      resultTitle: "Tamil_Lecture_Translated_Notes.txt",
      resultMeta: "1,420 words translated • 99.4% accuracy • Timestamps aligned",
      actionText: "Ready in Workspace"
    },
    {
      query: "Analyze operational transcript, highlight cost variances, and structure strategic recommendations",
      module: "Context Studio",
      badge: "NotebookLM Grounding",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      thought: "Semantic grounding engaged ➔ Identifying revenue, facilities variances, and 5 core executive decisions ➔ Formatting into action matrix.",
      resultTitle: "Corporate_Operations_Brief.json",
      resultMeta: "5 Key Decisions • Financial Variance Audit Table • Implementation Plan",
      actionText: "Ready in Workspace"
    },
    {
      query: "Export synthesized report into synchronized Word DOCX, PowerPoint PPTX, and Adobe PDF bundle",
      module: "Report Studio",
      badge: "Corporate 3-in-1 Bundle",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      thought: "Generating native document structures ➔ Assembling 5-slide PPTX deck ➔ Building formatted DOCX ➔ Rendering vector Adobe PDF.",
      resultTitle: "Executive_Report_Bundle (DOCX + PPTX + PDF)",
      resultMeta: "3 Document Formats Generated • Education Financial Template Standards",
      actionText: "Ready in Workspace"
    }
  ];

  const currentPrompt = heroSearchPrompts[activePromptIndex];

  // Glean-style "Built for Every Team" tabbed workflows
  const teamWorkflows = {
    developers: {
      title: "For Developers & Engineering Teams",
      subtitle: "Strip media, transcode streaming formats, and feed clean audio to AI models without third-party rate limits or ad trackers.",
      points: [
        "Local multi-threaded FFmpeg 8.1 pipeline with zero external API fees",
        "Supports huge files: multi-gigabyte 4K MP4, MKV, MOV, and high-fidelity FLAC",
        "Direct Python Whisper large-v3 or ultra-fast Groq LPU API execution",
        "Fine-grain audio options: bitrates up to 320k, sample rates to 96kHz, and volume gain"
      ],
      previewSnippet: "$ dev-supporter convert --input tech_talk.mp4 --codec libmp3lame --bitrate 320k\n> [FFmpeg] 100% extracted in 3.2s with zero loss.\n> [Whisper] Language detected: en (100% certainty).\n> [Output] Synchronized transcript and audio artifact ready."
    },
    executives: {
      title: "For Executives & Leadership",
      subtitle: "Turn 60-minute recorded board meetings into concise decision matrices, corporate presentation decks, and executive briefs.",
      points: [
        "Executive Summary automatically structured into 5 strategic priorities",
        "One-click export directly into a ready-to-present PowerPoint (.pptx) slide deck",
        "Chronological discussion flow from start to conclusion without fluff",
        "Print-ready Adobe PDF formatted to corporate reporting standards"
      ],
      previewSnippet: "1. Executive Summary & Market Position\n2. Key Operational Decision Matrix (Actions & Owners)\n3. Strategic Risk Assessment & Governance Recommendations\n> Exported to: Board_Review_Deck.pptx & Executive_Brief.pdf"
    },
    finance: {
      title: "For Finance & Operations Auditors",
      subtitle: "Audit expenditures, compare budget vs. actual figures, and generate variance summaries from financial review recordings.",
      points: [
        "Built-in Education Financial Reporting Template Bundle alignment",
        "Tabular variance analysis identifying favorable vs unfavorable line items",
        "Surplus & deficit breakdown with fiscal governance recommendations",
        "Structured Word (.docx) tables with native typography and branding"
      ],
      previewSnippet: "Line Item               Budget        Actual        Variance\n--------------------------------------------------------------\nFacilities Expansion    $1,200,000    $1,230,000    +$30,000 (U)\nEquipment Modernize     $800,000      $750,000      -$50,000 (F)\nTotal Revenue Target    $9,500,000    $9,420,000    -$80,000 (U)"
    },
    education: {
      title: "For Educators & Multilingual Researchers",
      subtitle: "Capture multilingual speech—such as Tamil technical lectures—and translate directly into English documents in real time.",
      points: [
        "Direct speech-to-text transcription in native script (Tamil, Hindi, Spanish, etc.)",
        "Simultaneous Whisper `task='translate'` mode: non-English audio straight to English text",
        "Structured chapter outlines and timestamped key takeaways",
        "Export study guides and lecture summaries for students and researchers"
      ],
      previewSnippet: "[00:01:14] Tamil Speech Input: செயற்கை நுண்ணறிவு மற்றும் ஆட்டோமேஷன்...\n[Output] Direct English Translation: Artificial Intelligence and Automation are transforming modern software development pipelines...\n> Chapter 1: Introduction to Semantic Synthesis"
    }
  };

  const currentTeam = teamWorkflows[activeTeamTab];

  return (
    <div className="space-y-24 py-4 animate-in fade-in duration-300">
      {/* 1. Glean-Style Announcement Pill & Hero Header */}
      <section className="relative text-center max-w-5xl mx-auto px-4 pt-6">
        {/* Subtle Ambient Radial Backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[340px] bg-gradient-to-tr from-red-500/8 via-indigo-500/8 to-rose-500/8 rounded-full blur-3xl pointer-events-none -z-10"></div>

        {/* Top Announcement Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs text-xs font-semibold text-slate-700 mb-6 select-none">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d9383a]"></span>
          </span>
          <span className="font-bold text-[#d9383a]">Dev Supporter 2.0</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600">The Modern Work AI Suite for Media, Speech & Reports</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
          Media, Speech & Reports. <br />
          <span className="bg-gradient-to-r from-[#d9383a] via-[#e53935] to-[#f43f5e] bg-clip-text text-transparent">
            Intelligently Connected.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          The unified developer platform to strip lossless audio with multi-threaded FFmpeg, transcribe multilingual speech with OpenAI Whisper, distill insights, and export board-ready Word, PowerPoint, and PDF bundles.
        </p>

        {/* Primary Action Button: Only this transitions to the workspace */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => onNavigate('converter')}
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#d9383a] to-[#c82333] hover:from-[#c82333] hover:to-[#b8202f] text-white font-bold text-sm sm:text-base shadow-lg shadow-red-500/25 hover:shadow-xl transition-all scale-100 hover:scale-[1.02]"
          >
            <ArrowRightLeft className="w-5 h-5" />
            <span>Open Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => document.getElementById('glean-interactive-demo')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm sm:text-base border border-slate-300 shadow-2xs hover:shadow-xs transition-all"
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Explore Live Demo</span>
          </button>
        </div>

        {/* Glean-Style Trust / Engine Capabilities Bar */}
        <div className="mt-14 pt-8 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-rose-600" />
            <span>FFmpeg 8.1 Engine</span>
          </div>
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-amber-500" />
            <span>Whisper Large-v3</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>NotebookLM Grounding</span>
          </div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
            <span>DOCX • PPTX • PDF</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>100% Private & Local</span>
          </div>
        </div>
      </section>

      {/* 2. Glean's Signature Interactive Search & Work Assistant Simulator */}
      <section id="glean-interactive-demo" className="max-w-5xl mx-auto px-4 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#d9383a] bg-red-50 px-3 py-1 rounded-full border border-red-200/60">
            Interactive AI Workspace
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2.5">
            Ask Dev Supporter anything. <br className="hidden sm:inline" />
            Execute multi-step workflows.
          </h2>
          <p className="text-sm text-slate-500 mt-1.5">
            Click any query below to see how Dev Supporter connects media extraction, speech models, and document compilers.
          </p>
        </div>

        {/* Glean-style Floating Search Bar with suggestions */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-4 sm:p-6 space-y-5">
          {/* Mock Search Input */}
          <div className="relative flex items-center bg-slate-50 rounded-2xl border border-slate-200/80 p-2 sm:p-3 shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs mr-3">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 font-sans text-sm sm:text-base font-semibold text-slate-900 truncate">
              {currentPrompt.query}
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-white border border-slate-200 px-2.5 py-1 rounded-lg mr-2">
              <span>Enter</span>
            </div>
          </div>

          {/* Prompt Selector Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mr-1">Examples:</span>
            {heroSearchPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActivePromptIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activePromptIndex === idx
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {p.module}
              </button>
            ))}
          </div>

          {/* Glean AI Reasoning & Execution Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-2xl p-6 text-white shadow-lg space-y-4 border border-slate-800 font-sans">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  Dev Supporter AI Execution Pipeline
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${currentPrompt.badgeColor}`}>
                {currentPrompt.badge}
              </span>
            </div>

            {/* Simulated Thought Process */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1.5 font-mono text-xs">
              <div className="text-slate-400 flex items-center gap-2">
                <span className="text-[#d9383a]">▶</span>
                <span className="text-slate-200 font-bold">Execution Trace:</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed pl-4">
                {currentPrompt.thought}
              </p>
            </div>

            {/* Generated Artifact Card Preview */}
            <div className="bg-white/10 border border-white/15 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#d9383a] text-white flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">
                    {currentPrompt.resultTitle}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {currentPrompt.resultMeta}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Pipeline Succeeded</span>
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-400 text-center font-medium pt-1">
              Click <strong>"Open Workspace"</strong> in the header or below to process your actual files.
            </div>
          </div>
        </div>
      </section>

      {/* 3. The Glean-Style Bento Grid: Core Product Pillars */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#d9383a] bg-red-50 px-3 py-1 rounded-full border border-red-200/60">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2.5">
            Four specialized engines. <br />
            One cohesive enterprise workflow.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            No fragmented single-purpose tools. Seamlessly pass outputs from media extraction directly into speech models and corporate document builders.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Card 1: Universal Media Extractor (Large 7 Cols) */}
          <div className="md:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-[#d9383a] flex items-center justify-center mb-5">
                <ArrowRightLeft className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#d9383a]">01. Media Engine</span>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                Universal Audio & Video Extraction
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Powered by multi-threaded FFmpeg 8.1. Convert any container (MP4, MKV, MOV, WEBM) to 320 kbps studio-grade MP3, WAV, AAC, or FLAC. Includes in-browser audio preview, audio trimming, and volume boost up to +6dB.
              </p>
            </div>

            {/* Visual Micro-Card */}
            <div className="mt-6 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>MP4 ➔ MP3 Lossless Extraction</span>
                <span className="text-[#d9383a]">320 kbps Studio</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-[#d9383a] to-[#ff5252] h-2 rounded-full w-full"></div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Normalized Gain: 100% (+3dB)</span>
                <span>Sample Rate: 44,100 Hz</span>
              </div>
            </div>
          </div>

          {/* Card 2: OpenAI Whisper & Speech AI (5 Cols) */}
          <div className="md:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-5">
                <Mic className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">02. Speech AI</span>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                Whisper Large-v3 & Tamil Translation
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Full multilingual speech-to-text. Directly translates non-English audio (including spoken Tamil) into English text as it transcribes, running on local PyTorch or Groq LPUs.
              </p>
            </div>

            <div className="mt-6 bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                <span>Task: Direct Translation</span>
                <span className="px-2 py-0.5 rounded bg-amber-200/70 text-amber-800 text-[10px]">ta ➔ en</span>
              </div>
              <p className="text-[11px] text-amber-800/80 font-mono italic">
                "Spoken audio translated into fluent English text with timestamp alignment."
              </p>
            </div>
          </div>

          {/* Card 3: Context & Custom Prompts (5 Cols) */}
          <div className="md:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mb-5">
                <Sparkles className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">03. Context Grounding</span>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                NotebookLM Semantic Analyzer
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Extract chronological narrative flow, strategic use cases, and budget variance metrics from your raw transcripts with customized prompt templates.
              </p>
            </div>

            <div className="mt-6 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-4 space-y-1.5 text-xs text-indigo-950 font-medium">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Executive Decision Matrices</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Financial Variance & Audit Tables</span>
              </div>
            </div>
          </div>

          {/* Card 4: Document Report Studio (Large 7 Cols) */}
          <div className="md:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-5">
                <FileCheck2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">04. Corporate Bundle</span>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                Instant Word, PowerPoint & PDF Bundle
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Download synchronized publication packages matching the Education Financial Reporting Template Bundle standard: complete Word (.docx) documents, presentation slide decks (.pptx), and print-ready Adobe PDFs (.pdf).
              </p>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div className="text-xs font-bold text-slate-800">Word (DOCX)</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Corporate Style</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div className="text-xs font-bold text-slate-800">Slides (PPTX)</div>
                <div className="text-[10px] text-slate-500 mt-0.5">5-Slide Deck</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div className="text-xs font-bold text-slate-800">Print (PDF)</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Vector Sharp</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Glean-Style "Built for Every Team" Tabbed Workflows */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#d9383a] bg-red-50 px-3 py-1 rounded-full border border-red-200/60">
            Workflows by Role
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2.5">
            Tailored to how your team works
          </h2>
          <p className="text-sm text-slate-600 mt-1.5">
            Select your discipline to see how Dev Supporter streamlines specialized tasks.
          </p>
        </div>

        {/* Team Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {[
            { id: 'developers', label: 'Developers & Engineers', icon: Code2 },
            { id: 'executives', label: 'Executives & Board', icon: Briefcase },
            { id: 'finance', label: 'Finance & Operations', icon: BarChart3 },
            { id: 'education', label: 'Educators & Researchers', icon: Globe }
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTeamTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTeamTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-[#d9383a]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Showcase Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {currentTeam.title}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {currentTeam.subtitle}
            </p>

            <ul className="space-y-2.5 pt-2">
              {currentTeam.points.map((pt, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-6 bg-slate-950 rounded-2xl p-5 border border-slate-800 text-white font-mono text-xs shadow-xl space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-[11px] text-slate-400">role-simulation.sh</span>
              <span className="text-[10px] text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20 font-bold">LIVE PREVIEW</span>
            </div>
            <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed text-[11px] font-mono">
              {currentTeam.previewSnippet}
            </pre>
          </div>
        </div>
      </section>

      {/* 5. Enterprise Security & Local Privacy Standard */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-3.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-800/80 text-xs font-bold text-red-400">
              <Lock className="w-3.5 h-3.5" />
              <span>Zero-Trust Local Architecture</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Enterprise Security Without Compromise
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Unlike public file conversion websites that upload your confidential recordings to unknown servers, Dev Supporter executes media extraction and AI speech pipelines locally on your machine with zero data leakage.
            </p>
          </div>

          <div className="md:col-span-5 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="font-bold text-emerald-400 text-base">100% Local</div>
              <div className="text-slate-400 text-[11px]">Private disk processing</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="font-bold text-indigo-400 text-base">No Limits</div>
              <div className="text-slate-400 text-[11px]">Any file size container</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="font-bold text-amber-400 text-base">Zero Ads</div>
              <div className="text-slate-400 text-[11px]">No malicious popups</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="font-bold text-rose-400 text-base">Enterprise</div>
              <div className="text-slate-400 text-[11px]">DOCX/PPTX/PDF standards</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Glean-Style Bottom Call-to-Action Card */}
      <section className="max-w-4xl mx-auto px-4 text-center">
        <div className="bg-gradient-to-tr from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-8 sm:p-14 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative max-w-xl mx-auto space-y-4">
            <div className="mx-auto flex items-center justify-center">
              <img src="/logo-white.png" alt="Dev Supporter Logo" className="h-10 w-auto object-contain" />
            </div>

            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Work reimagined with Dev Supporter.
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Step into the workspace now to convert files, transcribe speech, and produce professional corporate reports.
            </p>

            <div className="pt-3 flex justify-center">
              <button
                onClick={() => onNavigate('converter')}
                className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#d9383a] to-[#c82333] hover:from-[#c82333] hover:to-[#b8202f] text-white font-bold text-base shadow-lg shadow-red-500/30 hover:shadow-xl transition-all scale-100 hover:scale-[1.02]"
              >
                <ArrowRightLeft className="w-5 h-5" />
                <span>Open Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Glean-Style Multi-Column Enterprise Footer */}
      <footer className="border-t border-slate-200/80 pt-12 pb-8 max-w-5xl mx-auto px-4 text-slate-600 text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pb-8 border-b border-slate-200/80">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <img src="/logo-dark.png" alt="Dev Supporter Logo" className="h-5 w-auto object-contain" />
              <span>Dev Supporter</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Universal media conversion, multilingual speech intelligence, and corporate report synthesis.
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Platform Engines</div>
            <div className="text-slate-500">FFmpeg 8.1 Codec Pipeline</div>
            <div className="text-slate-500">OpenAI Whisper Large-v3</div>
            <div className="text-slate-500">NotebookLM REA Architecture</div>
            <div className="text-slate-500">Groq Cloud LPU Acceleration</div>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Supported Formats</div>
            <div className="text-slate-500">Video: MP4, MKV, MOV, WEBM</div>
            <div className="text-slate-500">Audio: MP3, WAV, AAC, FLAC</div>
            <div className="text-slate-500">Documents: Word DOCX, PPTX, PDF</div>
            <div className="text-slate-500">Transcripts: Multilingual & Tamil</div>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Security & Status</div>
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>All Systems Operational</span>
            </div>
            <div className="text-slate-500">Local Zero-Leakage Disk I/O</div>
            <div className="text-slate-500">Version: 2.0.0 Pro</div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400">
          <div>© {new Date().getFullYear()} Dev Supporter AI Suite. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span>Enterprise Media & AI Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
