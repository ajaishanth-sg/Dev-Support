import React, { useState } from 'react';
import { 
  X, 
  Wrench, 
  Sliders, 
  Key, 
  ShieldCheck, 
  Check, 
  Volume2, 
  Clock, 
  Eye, 
  EyeOff,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  options, 
  setOptions, 
  apiKey, 
  setApiKey 
}) {
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const resetDefaults = () => {
    setOptions({
      audioBitrate: '192k',
      sampleRate: '44100',
      channels: '2',
      volume: '1.0',
      trimStart: '00:00:00',
      trimEnd: '00:00:00'
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-100 text-[#d9383a] flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Audio & Engine Settings</h3>
              <p className="text-[11px] text-slate-500">Fine-tune FFmpeg codecs, audio bitrates and AI keys</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Audio Bitrate */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Audio Bitrate
              </label>
              <span className="text-[11px] font-semibold text-slate-500">
                Selected: <strong>{options.audioBitrate}</strong>
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { val: '128k', label: '128 kbps', sub: 'Standard' },
                { val: '192k', label: '192 kbps', sub: 'High Quality' },
                { val: '256k', label: '256 kbps', sub: 'Studio' },
                { val: '320k', label: '320 kbps', sub: 'Lossless' }
              ].map(b => (
                <button
                  key={b.val}
                  type="button"
                  onClick={() => setOptions({ ...options, audioBitrate: b.val })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    options.audioBitrate === b.val 
                      ? 'border-[#d9383a] bg-red-50 text-[#d9383a] shadow-xs ring-1 ring-[#d9383a]' 
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">{b.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{b.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sample Rate & Channels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Sample Rate
              </label>
              <select
                value={options.sampleRate}
                onChange={(e) => setOptions({ ...options, sampleRate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-[#d9383a]"
              >
                <option value="44100">44,100 Hz (CD Audio)</option>
                <option value="48000">48,000 Hz (Broadcast/Studio)</option>
                <option value="96000">96,000 Hz (Hi-Res Audio)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Audio Channels
              </label>
              <select
                value={options.channels}
                onChange={(e) => setOptions({ ...options, channels: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-[#d9383a]"
              >
                <option value="2">2 Channels (Stereo)</option>
                <option value="1">1 Channel (Mono Speech)</option>
              </select>
            </div>
          </div>

          {/* Volume Multiplier */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Volume Gain Adjustment</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: '0.8', label: '80%', sub: '-2dB' },
                { val: '1.0', label: '100%', sub: 'Original' },
                { val: '1.5', label: '150%', sub: '+3dB' },
                { val: '2.0', label: '200%', sub: '+6dB Boost' }
              ].map(v => (
                <button
                  key={v.val}
                  type="button"
                  onClick={() => setOptions({ ...options, volume: v.val })}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    options.volume === v.val 
                      ? 'border-[#d9383a] bg-red-50 text-[#d9383a] shadow-xs ring-1 ring-[#d9383a]' 
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">{v.label}</div>
                  <div className="text-[10px] text-slate-500">{v.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Audio Trimming */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Trim Audio Segment</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-600">Start Time (HH:MM:SS)</span>
                <input
                  type="text"
                  value={options.trimStart || '00:00:00'}
                  onChange={(e) => setOptions({ ...options, trimStart: e.target.value })}
                  placeholder="00:00:00"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 mt-1 focus:outline-hidden focus:border-[#d9383a]"
                />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-600">End Time (HH:MM:SS)</span>
                <input
                  type="text"
                  value={options.trimEnd || '00:00:00'}
                  onChange={(e) => setOptions({ ...options, trimEnd: e.target.value })}
                  placeholder="00:00:00 (0 = full)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 mt-1 focus:outline-hidden focus:border-[#d9383a]"
                />
              </div>
            </div>
          </div>

          {/* AI API Configuration */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-1.5">
              <Key className="w-4 h-4 text-indigo-600" />
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Custom Gemini / OpenAI API Key (Optional)
              </label>
            </div>
            <p className="text-[11px] text-slate-500 mb-2.5">
              Dev Supporter includes built-in semantic analysis. Provide your personal API key if you prefer live cloud inference.
            </p>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy... (leave blank for built-in engine)"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 pr-10 text-xs font-mono text-slate-800 focus:outline-hidden focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={resetDefaults}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#d9383a] to-[#c82333] hover:from-[#c82333] hover:to-[#b8202f] text-white text-xs font-bold shadow-md shadow-red-500/20 transition-all"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
