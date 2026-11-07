import React from 'react';
import { 
  ArrowRightLeft, 
  Mic, 
  Sparkles, 
  FileCheck2, 
  Settings, 
  History,
  Activity,
  Cpu,
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, counts = {} }) {
  const navItems = [
    {
      id: 'converter',
      label: 'Media Converter',
      subtext: 'MP4 to MP3, Video, Audio',
      icon: ArrowRightLeft,
      badge: counts.converted ? `${counts.converted}` : null,
      color: 'text-rose-600 bg-rose-50 border-rose-200/60'
    },
    {
      id: 'transcriber',
      label: 'AI Audio Transcriber',
      subtext: 'Whisper Large-v3 & NotebookLM',
      icon: Mic,
      badge: counts.transcribed ? 'Ready' : null,
      color: 'text-amber-600 bg-amber-50 border-amber-200/60'
    },
    {
      id: 'analysis',
      label: 'Context & Prompt Studio',
      subtext: 'Executive briefs & use-cases',
      icon: Sparkles,
      badge: 'AI',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200/60'
    },
    {
      id: 'export',
      label: 'Document Report Studio',
      subtext: 'Export to Word, PPTX, PDF',
      icon: FileCheck2,
      badge: '3 Formats',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200/60'
    },
    {
      id: 'history',
      label: 'Activity & Files History',
      subtext: 'Outputs, recordings & logs',
      icon: History,
      badge: 'Files',
      color: 'text-purple-600 bg-purple-50 border-purple-200/60'
    }
  ];

  return (
    <aside className="w-full md:w-64 lg:w-72 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col shrink-0 overflow-hidden self-start">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Workflow Modules
          </span>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          High-performance conversion, AI speech models, and corporate reporting.
        </p>
      </div>

      {/* Navigation List */}
      <nav className="p-2.5 space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all group relative ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                    isActive ? 'bg-white/15 border-white/20 text-white' : item.color
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm truncate leading-snug">
                    {item.label}
                  </div>
                  <div className={`text-[11px] truncate ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                    {item.subtext}
                  </div>
                </div>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-1.5 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Settings & Engine Status Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-2">
        <button
          onClick={() => setActiveTab('settings')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 text-slate-700 text-xs font-semibold shadow-2xs hover:bg-slate-50 transition-all"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Audio & Codec Settings</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>

        <div className="px-3 py-2 rounded-xl bg-slate-100/70 border border-slate-200/50 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span>Engine: <strong>FFmpeg + Whisper</strong></span>
          </div>
          <span className="font-semibold text-slate-600">v2.0</span>
        </div>
      </div>
    </aside>
  );
}
