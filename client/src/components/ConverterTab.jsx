import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Settings2, 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  CheckCircle, 
  AlertCircle,
  FileAudio,
  FileVideo,
  ChevronDown,
  Wrench,
  Loader2,
  Zap,
  ShieldCheck,
  Check
} from 'lucide-react';
import axios from 'axios';

const POPULAR_OUTPUT_FORMATS = [
  { ext: 'mp3', label: 'MP3', desc: 'MPEG Audio Layer 3 (Standard)' },
  { ext: 'wav', label: 'WAV', desc: 'Lossless PCM Waveform' },
  { ext: 'aac', label: 'AAC', desc: 'Advanced Audio Coding' },
  { ext: 'm4a', label: 'M4A', desc: 'Apple Lossless / AAC' },
  { ext: 'flac', label: 'FLAC', desc: 'Free Lossless Audio Codec' },
  { ext: 'ogg', label: 'OGG', desc: 'Ogg Vorbis Audio' },
  { ext: 'opus', label: 'OPUS', desc: 'Ultra-low latency codec' },
  { ext: 'mp4', label: 'MP4', desc: 'MPEG-4 Video' }
];

export default function ConverterTab({ 
  onSendToTranscriber, 
  openSettingsModal, 
  conversionOptions 
}) {
  const [files, setFiles] = useState([]);
  const [globalTargetFormat, setGlobalTargetFormat] = useState('mp3');
  const [isConvertingAll, setIsConvertingAll] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const audioPlayerRef = useRef(null);

  // Handle file selections
  const addFiles = (selected) => {
    if (!selected.length) return;

    const newItems = selected.map((file, idx) => ({
      id: `${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
      file,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      targetFormat: globalTargetFormat,
      status: 'ready', // ready, converting, finished, error
      progress: 0,
      convertedData: null,
      errorMsg: null,
      options: { ...conversionOptions }
    }));

    setFiles(prev => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (e) => {
    addFiles(Array.from(e.target.files || []));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Convert a single file
  const convertFile = async (item) => {
    setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'converting', progress: 15 } : f));

    try {
      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('targetFormat', item.targetFormat);
      formData.append('audioBitrate', item.options?.audioBitrate || '192k');
      formData.append('sampleRate', item.options?.sampleRate || '44100');
      formData.append('channels', item.options?.channels || '2');
      formData.append('volume', item.options?.volume || '1.0');
      if (item.options?.trimStart) formData.append('trimStart', item.options.trimStart);
      if (item.options?.trimEnd) formData.append('trimEnd', item.options.trimEnd);

      const progressTimer = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.id === item.id && f.status === 'converting' && f.progress < 90) {
            return { ...f, progress: f.progress + 15 };
          }
          return f;
        }));
      }, 350);

      const response = await axios.post('/api/convert', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      clearInterval(progressTimer);

      if (response.data && response.data.success) {
        setFiles(prev => prev.map(f => {
          if (f.id === item.id) {
            return {
              ...f,
              status: 'finished',
              progress: 100,
              convertedData: response.data
            };
          }
          return f;
        }));
      } else {
        throw new Error(response.data?.error || 'Conversion failed');
      }
    } catch (err) {
      console.error('Conversion error:', err);
      setFiles(prev => prev.map(f => {
        if (f.id === item.id) {
          return {
            ...f,
            status: 'error',
            errorMsg: err.response?.data?.error || err.message
          };
        }
        return f;
      }));
    }
  };

  // Convert all files
  const convertAllFiles = async () => {
    setIsConvertingAll(true);
    for (const item of files) {
      if (item.status === 'ready' || item.status === 'error') {
        await convertFile(item);
      }
    }
    setIsConvertingAll(false);
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (playingAudioId === id) {
      setPlayingAudioId(null);
    }
  };

  const togglePlayAudio = (id, downloadUrl) => {
    if (playingAudioId === id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(id);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = downloadUrl;
        audioPlayerRef.current.play();
      }
    }
  };

  const applyPreset = (targetFmt) => {
    const fmt = targetFmt.toLowerCase();
    setGlobalTargetFormat(fmt);
    setFiles(prev => prev.map(f => f.status === 'ready' ? { ...f, targetFormat: fmt } : f));
  };

  return (
    <div className="space-y-6">
      {/* Hidden audio player for live preview */}
      <audio 
        ref={audioPlayerRef} 
        onEnded={() => setPlayingAudioId(null)} 
        className="hidden" 
      />

      {/* Dev Supporter Header Showcase */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-red-500/5 to-indigo-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200/70 text-xs font-bold text-[#d9383a]">
              <Zap className="w-3.5 h-3.5 fill-[#d9383a]" />
              FFmpeg 8.1 Ultra-Fast Engine
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Lossless 320kbps Extraction
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Universal Media Extractor & Converter
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
            Extract studio-quality audio from any video container, adjust bitrates and gain amplification, preview the result in-browser, and instantly hand off to speech transcription and executive reporting.
          </p>

          {/* Quick Format Presets */}
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Presets:</span>
            {[
              { from: 'MP4', to: 'MP3' },
              { from: 'MOV', to: 'MP3' },
              { from: 'MKV', to: 'WAV' },
              { from: 'WAV', to: 'AAC' },
              { from: 'M4A', to: 'MP3' },
              { from: 'WEBM', to: 'MP3' }
            ].map(preset => {
              const isSelected = globalTargetFormat === preset.to.toLowerCase();
              return (
                <button
                  key={`${preset.from}-${preset.to}`}
                  onClick={() => applyPreset(preset.to)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{preset.from}</span>
                  <ArrowRight className={`w-3 h-3 ${isSelected ? 'text-red-400' : 'text-slate-400'}`} />
                  <span className={isSelected ? 'text-red-400' : 'text-[#d9383a]'}>{preset.to}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* File Upload Dropzone */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative group cursor-pointer border-2 border-dashed rounded-2xl bg-white p-8 sm:p-12 text-center transition-all ${
          isDragging 
            ? 'border-[#d9383a] bg-red-50/40 scale-[1.01] shadow-lg shadow-red-500/10' 
            : 'border-slate-300 hover:border-[#d9383a] hover:shadow-md'
        }`}
      >
        <input 
          ref={fileInputRef} 
          type="file" 
          multiple 
          onChange={handleFileSelect} 
          className="hidden" 
          accept="video/*,audio/*,.mp4,.mkv,.avi,.mov,.webm,.flv,.mp3,.wav,.aac,.m4a,.flac,.ogg" 
        />
        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-transform ${
          isDragging 
            ? 'bg-[#d9383a] text-white scale-110 shadow-md shadow-red-500/30' 
            : 'bg-red-50 text-[#d9383a] group-hover:scale-110 group-hover:bg-[#d9383a] group-hover:text-white shadow-xs'
        }`}>
          <Upload className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">
          Drop your files here, or <span className="text-[#d9383a] underline underline-offset-4">browse files</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Supports any file size (MP4, MKV, MOV, MP3, WAV, AAC, M4A, FLAC, WEBM, OGG)
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">Unlimited File Size</span>
          <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">Lossless Audio Extraction</span>
          <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">Automatic Normalization</span>
        </div>
      </div>

      {/* File Conversion Queue */}
      {files.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Header Bar */}
          <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold text-slate-900">Conversion Queue</span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-800 text-xs font-bold">
                {files.length} {files.length === 1 ? 'file' : 'files'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-semibold">Convert all to:</span>
              <div className="relative">
                <select
                  value={globalTargetFormat}
                  onChange={(e) => {
                    applyPreset(e.target.value);
                  }}
                  className="appearance-none bg-white border border-slate-300 rounded-xl px-3 py-1.5 pr-8 text-xs font-bold text-slate-800 shadow-2xs focus:outline-hidden focus:border-[#d9383a]"
                >
                  {POPULAR_OUTPUT_FORMATS.map(fmt => (
                    <option key={fmt.ext} value={fmt.ext}>{fmt.label.toUpperCase()} ({fmt.desc})</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                onClick={convertAllFiles}
                disabled={isConvertingAll}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#d9383a] to-[#c82333] hover:from-[#c82333] hover:to-[#b8202f] text-white text-xs font-bold shadow-md shadow-red-500/20 disabled:opacity-60 transition-all"
              >
                {isConvertingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Converting...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Convert All</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="divide-y divide-slate-100">
            {files.map((item) => {
              const isFinished = item.status === 'finished';
              const isConverting = item.status === 'converting';
              const isError = item.status === 'error';
              const isPlaying = playingAudioId === item.id;

              return (
                <div key={item.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  {/* File Info */}
                  <div className="flex items-center gap-3 min-w-0 max-w-md">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      {item.name.match(/\.(mp4|mkv|mov|webm)$/i) ? (
                        <FileVideo className="w-5 h-5 text-indigo-500" />
                      ) : (
                        <FileAudio className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate" title={item.name}>
                        {item.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-medium">{item.size}</span>
                        <span>•</span>
                        <span className="uppercase text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          To {item.targetFormat}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Target Format & Tuning Settings */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                      <select
                        value={item.targetFormat}
                        disabled={isConverting || isFinished}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFiles(prev => prev.map(f => f.id === item.id ? { ...f, targetFormat: val } : f));
                        }}
                        className="appearance-none bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 pr-7 text-xs font-bold text-slate-800 uppercase focus:outline-hidden disabled:opacity-50"
                      >
                        {POPULAR_OUTPUT_FORMATS.map(fmt => (
                          <option key={fmt.ext} value={fmt.ext}>{fmt.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <button
                      title="Audio Conversion Settings (Bitrate, Sample Rate, Trim)"
                      onClick={() => openSettingsModal(item.id)}
                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
                    >
                      <Wrench className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>

                  {/* Status & Progress Bar */}
                  <div className="flex-1 max-w-xs min-w-[140px]">
                    {isConverting && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-[#d9383a]">
                          <span>Converting...</span>
                          <span>{item.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                          <div 
                            className="bg-gradient-to-r from-[#d9383a] to-[#ff5252] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {isFinished && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>Ready for Download</span>
                      </div>
                    )}

                    {isError && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span className="truncate">{item.errorMsg || 'Failed'}</span>
                      </div>
                    )}

                    {item.status === 'ready' && (
                      <span className="inline-block text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                        Ready to convert
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'ready' && (
                      <button
                        onClick={() => convertFile(item)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d9383a] to-[#c82333] hover:from-[#c82333] hover:to-[#b8202f] text-white text-xs font-bold shadow-xs transition-all"
                      >
                        Convert
                      </button>
                    )}

                    {isFinished && item.convertedData && (
                      <>
                        <button
                          onClick={() => togglePlayAudio(item.id, item.convertedData.downloadUrl)}
                          title="Preview Audio"
                          className={`p-2 rounded-xl border transition-all ${
                            isPlaying 
                              ? 'bg-red-600 border-red-600 text-white shadow-xs' 
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {isPlaying ? (
                            <div className="flex items-center gap-1">
                              <Pause className="w-4 h-4" />
                              <span className="flex gap-0.5 items-center">
                                <span className="w-1 h-3 bg-white rounded-full animate-pulse"></span>
                                <span className="w-1 h-2 bg-white rounded-full animate-pulse delay-75"></span>
                                <span className="w-1 h-4 bg-white rounded-full animate-pulse delay-150"></span>
                              </span>
                            </div>
                          ) : (
                            <Play className="w-4 h-4 fill-current" />
                          )}
                        </button>

                        <a
                          href={item.convertedData.downloadUrl}
                          download={item.convertedData.outputFileName}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>

                        <button
                          onClick={() => onSendToTranscriber(item.convertedData.outputFileName, item.name)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                          title="Send to AI Transcriber & Context Report Generator"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Transcribe</span>
                        </button>
                      </>
                    )}

                    {/* Remove Item */}
                    <button
                      onClick={() => removeFile(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100 transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
