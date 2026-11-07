import React from 'react';
import { 
  Home,
  ArrowRightLeft, 
  Settings, 
  CheckCircle2,
  Zap,
  Cpu
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, systemStatus, openSettings }) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer shrink-0 group select-none" 
          onClick={() => setActiveTab('landing')}
          title="Return to Home Overview"
        >
          {/* Transparent <.dev/> logo without background */}
          <img 
            src="/logo-dark.png" 
            alt="Dev Supporter Logo" 
            className="h-8 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform" 
          />
          <span className="text-xl font-extrabold tracking-tight text-slate-900 font-sans whitespace-nowrap">
            Dev <span className="text-[#d9383a]">Supporter</span>
          </span>
        </div>

        {/* Right Section: System Status, Settings & Action Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* FFmpeg Status Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-medium text-slate-700 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-800">FFmpeg 8.1</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">All Formats</span>
          </div>

          {/* Settings Button */}
          {openSettings && (
            <button
              onClick={openSettings}
              className="p-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-2xs transition-all hover:border-slate-300"
              title="Conversion & Audio Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Quick Action Button */}
          <button
            onClick={() => setActiveTab(activeTab === 'landing' ? 'converter' : 'landing')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d9383a] to-[#c82333] hover:from-[#c82333] hover:to-[#b8202f] text-white shadow-xs shadow-red-500/20 transition-all hover:shadow-md"
          >
            {activeTab === 'landing' ? (
              <>
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Open Workspace</span>
              </>
            ) : (
              <>
                <Home className="w-3.5 h-3.5" />
                <span>Home Tour</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
