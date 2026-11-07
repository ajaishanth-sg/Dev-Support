import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LandingPage from './components/LandingPage';
import ConverterTab from './components/ConverterTab';
import TranscriberTab from './components/TranscriberTab';
import AIAnalysisTab from './components/AIAnalysisTab';
import DocumentExportTab from './components/DocumentExportTab';
import HistoryTab from './components/HistoryTab';
import SettingsModal from './components/SettingsModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [systemStatus, setSystemStatus] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');

  // Audio & Conversion Options
  const [conversionOptions, setConversionOptions] = useState({
    audioBitrate: '192k',
    sampleRate: '44100',
    channels: '2',
    volume: '1.0',
    trimStart: '00:00:00',
    trimEnd: '00:00:00'
  });

  // Data Pipeline State
  const [preloadedTranscriberFile, setPreloadedTranscriberFile] = useState(null);
  const [transcriptForAnalysis, setTranscriptForAnalysis] = useState('');
  const [reportData, setReportData] = useState(null);

  // Stats / Counts
  const [counts, setCounts] = useState({
    converted: 0,
    transcribed: false,
    reportReady: false
  });

  // Check system status on mount
  useEffect(() => {
    axios.get('/api/status')
      .then(res => setSystemStatus(res.data))
      .catch(err => console.warn('Status check warning:', err.message));
  }, []);

  // Save API key
  useEffect(() => {
    if (apiKey) localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  // Workflow transitions:
  // 1. Converter -> Transcriber
  const handleSendToTranscriber = (outputFileName, originalName) => {
    setPreloadedTranscriberFile({ outputFileName, originalName });
    setCounts(prev => ({ ...prev, converted: prev.converted + 1 }));
    setActiveTab('transcriber');
  };

  // 2. Transcriber -> AI Analysis Studio
  const handleSendToAnalysis = (transcript, filename) => {
    setTranscriptForAnalysis(transcript);
    setCounts(prev => ({ ...prev, transcribed: true }));
    setActiveTab('analysis');
  };

  // 3. AI Analysis -> Document Exporter
  const handleSendToExport = (data) => {
    setReportData(data);
    setCounts(prev => ({ ...prev, reportReady: true }));
    setActiveTab('export');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800 antialiased selection:bg-red-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        systemStatus={systemStatus} 
        openSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Layout: Either Full-Width Landing Page or 2-Column Dashboard Workspace */}
      {activeTab === 'landing' ? (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <LandingPage onNavigate={setActiveTab} />
        </main>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 gap-6">
          {/* Sidebar */}
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={(tab) => {
              if (tab === 'settings') {
                setIsSettingsOpen(true);
              } else {
                setActiveTab(tab);
              }
            }} 
            counts={counts}
          />

          {/* Tab Content Panel */}
          <main className="flex-1 min-w-0">
            {activeTab === 'converter' && (
              <ConverterTab 
                onSendToTranscriber={handleSendToTranscriber}
                openSettingsModal={() => setIsSettingsOpen(true)}
                conversionOptions={conversionOptions}
              />
            )}

            {activeTab === 'transcriber' && (
              <TranscriberTab 
                preloadedFile={preloadedTranscriberFile}
                onSendToAnalysis={handleSendToAnalysis}
                apiKey={apiKey}
              />
            )}

            {activeTab === 'analysis' && (
              <AIAnalysisTab 
                initialContent={transcriptForAnalysis}
                onSendToExport={handleSendToExport}
                apiKey={apiKey}
              />
            )}

            {activeTab === 'export' && (
              <DocumentExportTab 
                reportData={reportData} 
              />
            )}

            {activeTab === 'history' && (
              <HistoryTab 
                onSendToTranscriber={handleSendToTranscriber}
              />
            )}
          </main>
        </div>
      )}

      {/* Conversion & Audio Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        options={conversionOptions}
        setOptions={setConversionOptions}
        apiKey={apiKey}
        setApiKey={setApiKey}
      />
    </div>
  );
}
