import React, { useState, useEffect, useRef } from 'react';
import { 
  History, 
  FileText, 
  FileAudio, 
  FileVideo, 
  Presentation, 
  FileType, 
  Download, 
  Trash2, 
  Play, 
  Pause, 
  RotateCw, 
  Search, 
  Sparkles, 
  Filter,
  CheckCircle2,
  Clock,
  HardDrive
} from 'lucide-react';
import axios from 'axios';

export default function HistoryTab({ onSendToTranscriber }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, media, documents
  const [playingId, setPlayingId] = useState(null);
  const audioPlayerRef = useRef(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/history');
      if (res.data && res.data.success) {
        setItems(res.data.items || []);
      }
    } catch (err) {
      console.warn('Failed to load history:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (filename) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;
    try {
      await axios.delete(`/api/history/${encodeURIComponent(filename)}`);
      setItems(prev => prev.filter(item => item.filename !== filename));
      if (playingId === filename) setPlayingId(null);
    } catch (err) {
      alert(`Delete failed: ${err.response?.data?.error || err.message}`);
    }
  };

  const togglePlay = (item) => {
    if (playingId === item.id) {
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      setPlayingId(null);
    } else {
      setPlayingId(item.id);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = item.downloadUrl;
        audioPlayerRef.current.play().catch(e => console.warn('Playback error:', e.message));
      }
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeFilter === 'media') return item.type === 'audio' || item.type === 'video';
    if (activeFilter === 'documents') return item.type === 'document';
    return true;
  });

  const mediaCount = items.filter(i => i.type === 'audio' || i.type === 'video').length;
  const docCount = items.filter(i => i.type === 'document').length;

  return (
    <div className="space-y-6">
      {/* Hidden audio element for preview */}
      <audio ref={audioPlayerRef} onEnded={() => setPlayingId(null)} className="hidden" />

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-700 mb-2">
              <History className="w-3.5 h-3.5 text-slate-600" />
              <span>Workspace Activity Log</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              File & Document History
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Access all your uploaded audio, video files, converted media, and generated reports (Word, PowerPoint, PDF).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold uppercase text-slate-400">Total Tracked</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">{items.length} files</div>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200">
            <div className="text-[11px] font-bold uppercase text-blue-600">Media (Audio/Video)</div>
            <div className="text-xl font-extrabold text-blue-900 mt-0.5">{mediaCount} items</div>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <div className="text-[11px] font-bold uppercase text-emerald-600">Generated Reports</div>
            <div className="text-xl font-extrabold text-emerald-900 mt-0.5">{docCount} documents</div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by filename or title..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-stretch sm:self-auto">
            {[
              { id: 'all', label: 'All Files' },
              { id: 'media', label: 'Media (Audio/Video)' },
              { id: 'documents', label: 'Documents (DOCX/PPT/PDF)' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* File List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RotateCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading history...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <HardDrive className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No matching files found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery ? 'Try adjusting your search criteria.' : 'Uploaded media and generated documents will automatically appear here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredItems.map((item) => {
              const isPlaying = playingId === item.id;
              const isMedia = item.type === 'audio' || item.type === 'video';
              const isDocx = item.format === 'DOCX';
              const isPptx = item.format === 'PPTX';
              const isPdf = item.format === 'PDF';

              let IconComponent = FileText;
              let iconBg = 'bg-slate-100 text-slate-600';
              if (item.type === 'video') {
                IconComponent = FileVideo;
                iconBg = 'bg-indigo-100 text-indigo-600';
              } else if (item.type === 'audio') {
                IconComponent = FileAudio;
                iconBg = 'bg-amber-100 text-amber-600';
              } else if (isDocx) {
                IconComponent = FileText;
                iconBg = 'bg-blue-100 text-blue-600';
              } else if (isPptx) {
                IconComponent = Presentation;
                iconBg = 'bg-amber-100 text-amber-600';
              } else if (isPdf) {
                IconComponent = FileType;
                iconBg = 'bg-rose-100 text-rose-600';
              }

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  {/* File Icon & Info */}
                  <div className="flex items-center gap-3.5 min-w-0 max-w-md">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate" title={item.filename}>
                        {item.displayName || item.filename}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                          {item.format}
                        </span>
                        <span>•</span>
                        <span>{item.size}</span>
                        <span>•</span>
                        <span className="text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Category Pill */}
                  <div className="shrink-0">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      item.category === 'generated_document'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : (item.category === 'converted_media'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600')
                    }`}>
                      {item.category.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Audio Playback */}
                    {item.type === 'audio' && (
                      <button
                        onClick={() => togglePlay(item)}
                        className={`p-2 rounded-lg border transition-colors ${
                          isPlaying
                            ? 'bg-red-600 border-red-600 text-white'
                            : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                        title={isPlaying ? 'Pause' : 'Play audio'}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                      </button>
                    )}

                    {/* Send to Transcriber if media */}
                    {isMedia && onSendToTranscriber && (
                      <button
                        onClick={() => onSendToTranscriber(item.filename, item.displayName)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-2xs"
                        title="Transcribe & Analyze this media file"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Transcribe</span>
                      </button>
                    )}

                    {/* Direct Download Link */}
                    <a
                      href={item.downloadUrl}
                      download={item.filename}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(item.filename)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

