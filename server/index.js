const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const { checkFFmpeg, convertMedia, extractAudioForSpeech, getMediaDuration, extractDocumentContent } = require('./ffmpegHelper');
const { transcribeAudio, analyzeContextAndGenerateReport, generateNotebookLMStructure } = require('./aiEngine');
const { generateWordDocx, generatePowerPointPptx, generatePdfReport } = require('./documentExporter');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Directories
const uploadsDir = path.join(__dirname, '..', 'uploads');
const outputsDir = path.join(__dirname, '..', 'outputs');
const clientDistDir = path.join(__dirname, '..', 'client', 'dist');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir, { recursive: true });

// Serve client production build if available
if (fs.existsSync(clientDistDir)) {
  app.use(express.static(clientDistDir));
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const cleanExt = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueId}${cleanExt}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 } // Up to 2GB files
});

// In-memory conversion job status tracker
const conversionJobs = new Map();

// --- ROUTES ---

// 1. Health & Capabilities Check
app.get('/api/status', async (req, res) => {
  const ffmpegInfo = await checkFFmpeg();
  res.json({
    status: 'online',
    ffmpeg: ffmpegInfo,
    supportedFormats: {
      audio: ['mp3', 'wav', 'aac', 'm4a', 'flac', 'ogg', 'opus', 'wma'],
      video: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv'],
      document: ['docx', 'pptx', 'pdf', 'txt', 'md']
    }
  });
});

// 2. Conversion Endpoint (e.g. MP4 to MP3, or any format)
app.post('/api/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { targetFormat = 'mp3', audioBitrate, sampleRate, channels, volume, trimStart, trimEnd } = req.body;
    const inputPath = req.file.path;
    const originalName = req.file.originalname;
    const baseName = path.parse(originalName).name;
    const cleanTargetExt = targetFormat.startsWith('.') ? targetFormat.toLowerCase() : `.${targetFormat.toLowerCase()}`;
    const outputFileName = `${baseName}_converted_${Date.now()}${cleanTargetExt}`;
    const outputPath = path.join(outputsDir, outputFileName);

    const jobId = uuidv4();
    conversionJobs.set(jobId, { progress: 0, status: 'processing', filename: outputFileName });

    // Perform conversion
    await convertMedia(inputPath, outputPath, {
      audioBitrate,
      sampleRate,
      channels,
      volume,
      trimStart,
      trimEnd
    }, (progress) => {
      const job = conversionJobs.get(jobId);
      if (job) job.progress = progress;
    });

    const outputStats = fs.existsSync(outputPath) ? fs.statSync(outputPath) : null;
    conversionJobs.set(jobId, { progress: 100, status: 'completed', filename: outputFileName });

    res.json({
      success: true,
      jobId,
      originalName,
      targetFormat,
      outputFileName,
      downloadUrl: `/api/download/${outputFileName}`,
      fileSize: outputStats ? outputStats.size : 0,
      outputPath
    });
  } catch (error) {
    console.error('[API /convert Error]:', error);
    res.status(500).json({ error: error.message || 'Conversion failed' });
  }
});

// 2.5 Real-Time Job Progress Tracking Store
const transcriptionJobs = new Map();

function calculateJobMetrics(job) {
  const elapsedSeconds = Math.max(1, Math.round((Date.now() - job.startTime) / 1000));
  const remainingPercentage = Math.max(0, 100 - job.percentage);

  let estimatedTotalSeconds = job.estimatedTotalSeconds;
  if (!estimatedTotalSeconds) {
    if (job.totalDuration && job.totalDuration > 0) {
      const numChunks = Math.max(1, Math.ceil(job.totalDuration / 600));
      estimatedTotalSeconds = Math.round(numChunks * 7 + 10);
    } else {
      estimatedTotalSeconds = 30;
    }
    job.estimatedTotalSeconds = estimatedTotalSeconds;
  }

  let estimatedRemainingSeconds;
  if (job.percentage >= 100) {
    estimatedRemainingSeconds = 0;
  } else if (job.percentage >= 15) {
    const secondsPerPercent = elapsedSeconds / job.percentage;
    estimatedRemainingSeconds = Math.max(1, Math.round(secondsPerPercent * remainingPercentage));
  } else {
    estimatedRemainingSeconds = Math.max(1, estimatedTotalSeconds - elapsedSeconds);
  }

  return {
    elapsedSeconds,
    remainingPercentage,
    estimatedTotalSeconds,
    estimatedRemainingSeconds
  };
}

// Progress Polling Endpoint
app.get('/api/transcribe/progress/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = transcriptionJobs.get(jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found or expired' });
  }

  const metrics = calculateJobMetrics(job);

  res.json({
    jobId,
    status: job.status,
    percentage: job.percentage,
    remainingPercentage: metrics.remainingPercentage,
    currentStage: job.currentStage,
    elapsedSeconds: metrics.elapsedSeconds,
    estimatedRemainingSeconds: metrics.estimatedRemainingSeconds,
    estimatedTotalSeconds: metrics.estimatedTotalSeconds,
    totalDuration: job.totalDuration || 0,
    durationFormatted: job.durationFormatted || '00:00',
    fileSizeMb: job.fileSizeMb || '0',
    chunksTotal: job.chunksTotal || 1,
    chunkCurrent: job.chunkCurrent || 0,
    result: job.result || null,
    error: job.error || null
  });
});

// 3. Transcription & NotebookLM Document Ingestion Endpoint (Supports any file size, documents & audio)
app.post('/api/transcribe', upload.single('file'), async (req, res) => {
  const jobId = req.body.jobId || `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const startTime = Date.now();

  const jobRecord = {
    id: jobId,
    status: 'processing',
    percentage: 5,
    currentStage: 'Ingesting file into workspace and verifying stream...',
    startTime,
    totalDuration: 0,
    durationFormatted: '00:00',
    fileSizeMb: req.file ? (req.file.size / (1024 * 1024)).toFixed(1) : '0',
    chunksTotal: 1,
    chunkCurrent: 0,
    result: null,
    error: null
  };
  transcriptionJobs.set(jobId, jobRecord);

  const updateProgress = (data) => {
    if (data.percentage !== undefined) jobRecord.percentage = data.percentage;
    if (data.stage) jobRecord.currentStage = data.stage;
    if (data.totalDuration) {
      jobRecord.totalDuration = data.totalDuration;
      const m = Math.floor(data.totalDuration / 60);
      const s = Math.floor(data.totalDuration % 60);
      jobRecord.durationFormatted = `${m}m ${s}s`;
    }
    if (data.chunksTotal) jobRecord.chunksTotal = data.chunksTotal;
    if (data.chunkCurrent) jobRecord.chunkCurrent = data.chunkCurrent;
    if (data.fileSizeMb) jobRecord.fileSizeMb = data.fileSizeMb;
  };

  try {
    let filePath = req.file ? req.file.path : null;
    let originalName = req.file ? req.file.originalname : 'audio.mp3';

    // If referencing an already converted file
    if (!filePath && req.body.existingFileName) {
      const cleanName = req.body.existingFileName.trim();
      const directPath = path.join(outputsDir, cleanName);
      if (fs.existsSync(directPath)) {
        filePath = directPath;
      } else {
        const outFiles = fs.readdirSync(outputsDir);
        const match = outFiles.find(f => f.replace(/\s+/g, '') === cleanName.replace(/\s+/g, ''));
        if (match) filePath = path.join(outputsDir, match);
      }
      originalName = cleanName;
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(400).json({ error: 'No valid file found for transcription. Please re-select the file.' });
    }

    const { language = 'auto', engine = 'groq', model = 'large-v3', task = 'transcribe', apiKey } = req.body;
    const effectiveApiKey = (apiKey && typeof apiKey === 'string' && apiKey.trim().length > 5)
      ? apiKey.trim()
      : (process.env.GROQ_API_KEY || '');
    const ext = path.extname(filePath).toLowerCase();

    // Check if uploaded file is a document (PDF, TXT, MD, etc.)
    const docExtensions = ['.pdf', '.txt', '.md', '.json', '.csv', '.vtt', '.srt'];
    if (docExtensions.includes(ext)) {
      console.log(`[Document Ingestion] Extracting content from ${originalName}...`);
      updateProgress({ percentage: 20, stage: `Extracting text and structure from ${originalName}...` });
      const docText = await extractDocumentContent(filePath);
      
      updateProgress({ percentage: 50, stage: 'Synthesizing Start-to-End Cognitive Comprehension...' });
      const notebookData = await generateNotebookLMStructure(docText, originalName, apiKey, task);

      const timeId = Date.now();
      const docxName = `Document_Report_${timeId}.docx`;
      const pptxName = `Document_Report_${timeId}.pptx`;
      const pdfName = `Document_Report_${timeId}.pdf`;
      const txtName = `Document_Text_${timeId}.txt`;

      const reportData = {
        title: notebookData.briefingDoc?.title || notebookData.sourceTitle,
        subtitle: `${notebookData.sourceTitle} — Analysis Report`,
        organization: notebookData.detectedDomain || 'Content Analysis',
        preparedBy: 'Dev Supporter AI Engine',
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        executiveSummary: notebookData.briefingDoc?.executiveAbstract || '',
        purposeOfAnalysis: `Intelligent analysis of "${notebookData.sourceTitle}".`,
        chronologicalFlow: notebookData.chronologicalFlow || {
          beginning: `Analysis opens with initial context and problem scope for ${notebookData.sourceTitle}.`,
          middle: `Detailed review of requirements, specifications, and operational workflows.`,
          conclusion: `Final synthesis of strategic decisions, action items, and next steps.`
        },
        thematicExplanations: notebookData.thematicInformation || [],
        financialTable: notebookData.financialTable || [],
        contextAndUseCases: (notebookData.thematicInformation || []).map(t => ({ title: t.topic || t.theme || t.title, description: t.summary || t.explanation || t.description })),
        keyFindings: notebookData.briefingDoc?.keyTakeaways || [],
        recommendations: notebookData.actionPlan || [],
        structuredTranscript: notebookData.structuredTranscript || [],
        groundedFAQ: notebookData.groundedFAQ || [],
        slides: (notebookData.structuredTranscript || []).map((ch, idx) => ({
          slideNumber: idx + 1,
          title: ch.chapterTitle,
          bullets: ch.paragraphs || []
        }))
      };

      updateProgress({ percentage: 85, stage: 'Generating Word, PowerPoint, and PDF document package...' });
      await generateWordDocx(reportData, path.join(outputsDir, docxName));
      await generatePowerPointPptx(reportData, path.join(outputsDir, pptxName));
      await generatePdfReport(reportData, path.join(outputsDir, pdfName));
      fs.writeFileSync(path.join(outputsDir, txtName), docText || '', 'utf8');

      updateProgress({ percentage: 100, stage: 'Document analysis and report package complete!' });
      const docResponsePayload = {
        success: true,
        jobId,
        sourceType: 'document',
        originalName,
        language: 'Document Ingested (Multilingual)',
        task,
        duration: 0,
        rawTranscript: docText,
        notebookLM: notebookData,
        reportData,
        documents: {
          docx: `/api/download/${docxName}`,
          pptx: `/api/download/${pptxName}`,
          pdf: `/api/download/${pdfName}`,
          txt: `/api/download/${txtName}`,
          docxName,
          pptxName,
          pdfName,
          txtName
        }
      };

      jobRecord.status = 'completed';
      jobRecord.percentage = 100;
      jobRecord.result = docResponsePayload;

      return res.json(docResponsePayload);
    }

    // Audio or Video media file
    let speechAudioPath = filePath;
    if (['.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv'].includes(ext)) {
      updateProgress({ percentage: 8, stage: 'Extracting 16kHz audio stream from video...' });
      const extractedSpeechName = `speech_${uuidv4()}.mp3`;
      speechAudioPath = path.join(uploadsDir, extractedSpeechName);
      await extractAudioForSpeech(filePath, speechAudioPath);
    }

    const result = await transcribeAudio(speechAudioPath, originalName, {
      language,
      engine,
      model,
      task,
      apiKey: effectiveApiKey,
      onProgress: updateProgress
    });

    updateProgress({ percentage: 92, stage: 'Generating Word (.docx), PowerPoint (.pptx), and PDF reports...' });

    // Automatically build corporate report and export all 3 documents
    const timeId = Date.now();
    const docxName = `Meeting_Report_${timeId}.docx`;
    const pptxName = `Meeting_Report_${timeId}.pptx`;
    const pdfName = `Meeting_Report_${timeId}.pdf`;
    const txtName = `Transcript_${timeId}.txt`;

    const reportData = {
      title: result.notebookLM?.briefingDoc?.title || result.notebookLM?.sourceTitle || 'Audio Synthesis & Executive Briefing',
      subtitle: `${result.notebookLM?.sourceTitle || 'Source'} — Executive Assessment`,
      organization: result.notebookLM?.detectedDomain || 'Workspace Intelligence',
      preparedBy: 'Dev Supporter AI Engine',
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      executiveSummary: result.notebookLM?.briefingDoc?.executiveAbstract || '',
      purposeOfAnalysis: `Comprehensive context synthesis, specifications, and actionable directives for "${result.notebookLM?.sourceTitle || originalName}".`,
      chronologicalFlow: result.notebookLM?.chronologicalFlow || {
        beginning: `Discussion opens with context setting for ${result.notebookLM?.sourceTitle || 'the session'}.`,
        middle: `Core operational and technical specifications reviewed.`,
        conclusion: `Final agreements, decisions, and roadmap confirmed.`
      },
      thematicExplanations: result.notebookLM?.thematicInformation || [],
      financialTable: (result.notebookLM?.financialTable && result.notebookLM.financialTable.length > 0)
        ? result.notebookLM.financialTable
        : [],
      contextAndUseCases: (result.notebookLM?.thematicInformation || []).map(t => ({ title: t.topic || t.theme || t.title, description: t.summary || t.explanation || t.description })),
      keyFindings: result.notebookLM?.briefingDoc?.keyTakeaways || [],
      recommendations: result.notebookLM?.actionPlan || [],
      structuredTranscript: result.notebookLM?.structuredTranscript || [],
      groundedFAQ: result.notebookLM?.groundedFAQ || [],
      slides: (result.notebookLM?.structuredTranscript || []).map((ch, idx) => ({
        slideNumber: idx + 1,
        title: ch.chapterTitle,
        bullets: (ch.paragraphs || []).map(p => p.length > 150 ? p.substring(0, 147) + '...' : p)
      }))
    };

    try {
      await generateWordDocx(reportData, path.join(outputsDir, docxName));
      await generatePowerPointPptx(reportData, path.join(outputsDir, pptxName));
      await generatePdfReport(reportData, path.join(outputsDir, pdfName));
      fs.writeFileSync(path.join(outputsDir, txtName), result.rawTranscript || '', 'utf8');
    } catch (genErr) {
      console.warn('[Document Auto-Generation Notice]:', genErr.message);
    }

    updateProgress({ percentage: 100, stage: 'Complete! All documents and Start-to-End analysis ready.' });

    const mediaResponsePayload = {
      success: true,
      jobId,
      sourceType: 'media',
      originalName,
      engine: result.engine,
      task: result.task,
      language: result.language,
      duration: result.duration,
      rawTranscript: result.rawTranscript,
      notebookLM: result.notebookLM,
      reportData,
      documents: {
        docx: `/api/download/${docxName}`,
        pptx: `/api/download/${pptxName}`,
        pdf: `/api/download/${pdfName}`,
        txt: `/api/download/${txtName}`,
        docxName,
        pptxName,
        pdfName,
        txtName
      }
    };

    jobRecord.status = 'completed';
    jobRecord.percentage = 100;
    jobRecord.currentStage = 'Complete! All documents and Start-to-End analysis ready.';
    jobRecord.result = mediaResponsePayload;

    res.json(mediaResponsePayload);
  } catch (error) {
    console.error('[API /transcribe Error]:', error);
    jobRecord.status = 'error';
    jobRecord.error = error.message;
    res.status(500).json({ error: error.message || 'Transcription and analysis failed' });
  }
});

// 4. AI Prompt Analysis & Context Extractor
app.post('/api/analyze', async (req, res) => {
  try {
    const { content, userPrompt, reportTemplate = 'financial', apiKey } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content or transcript is required' });
    }

    const report = await analyzeContextAndGenerateReport(content, userPrompt, reportTemplate, apiKey);
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('[API /analyze Error]:', error);
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

// 5. Document Exporter (Word DOCX, PowerPoint PPTX, PDF)
app.post('/api/export-report', async (req, res) => {
  try {
    const { reportData, format = 'docx' } = req.body;
    if (!reportData) {
      return res.status(400).json({ error: 'Report data is required' });
    }

    const cleanTitleSlug = (reportData.title || 'Executive_Report').replace(/[^a-zA-Z0-9_-]/g, '_').replace(/__+/g, '_').substring(0, 40);
    const fileBase = `${cleanTitleSlug}_${Date.now()}`;
    const cleanFormat = format.toLowerCase().replace('.', '');
    let outputFileName = `${fileBase}.${cleanFormat}`;
    let targetPath = path.join(outputsDir, outputFileName);

    if (cleanFormat === 'docx' || cleanFormat === 'word') {
      outputFileName = `${fileBase}.docx`;
      targetPath = path.join(outputsDir, outputFileName);
      await generateWordDocx(reportData, targetPath);
    } else if (cleanFormat === 'pptx' || cleanFormat === 'ppt' || cleanFormat === 'powerpoint') {
      outputFileName = `${fileBase}.pptx`;
      targetPath = path.join(outputsDir, outputFileName);
      await generatePowerPointPptx(reportData, targetPath);
    } else if (cleanFormat === 'pdf') {
      outputFileName = `${fileBase}.pdf`;
      targetPath = path.join(outputsDir, outputFileName);
      await generatePdfReport(reportData, targetPath);
    } else {
      return res.status(400).json({ error: `Unsupported format: ${format}. Use docx, pptx, or pdf` });
    }

    const stats = fs.statSync(targetPath);

    res.json({
      success: true,
      format: cleanFormat,
      filename: outputFileName,
      fileSize: stats.size,
      downloadUrl: `/api/download/${outputFileName}`
    });
  } catch (error) {
    console.error('[API /export-report Error]:', error);
    res.status(500).json({ error: error.message || 'Document export failed' });
  }
});

// 6. Direct File Download (Searches outputs and uploads)
app.get('/api/download/:filename', (req, res) => {
  const filename = decodeURIComponent(path.basename(req.params.filename));
  let filePath = path.join(outputsDir, filename);

  if (!fs.existsSync(filePath)) {
    filePath = path.join(uploadsDir, filename);
  }

  // Loose space matching fallback
  if (!fs.existsSync(filePath)) {
    const allFiles = [...fs.readdirSync(outputsDir).map(f => ({ f, dir: outputsDir })), ...fs.readdirSync(uploadsDir).map(f => ({ f, dir: uploadsDir }))];
    const match = allFiles.find(item => item.f.replace(/\s+/g, '') === filename.replace(/\s+/g, ''));
    if (match) {
      filePath = path.join(match.dir, match.f);
    }
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found or expired' });
  }

  res.download(filePath, filename);
});

// 7. Complete Activity & File History (Uploaded Audio, Video, and Generated Documents)
app.get('/api/history', (req, res) => {
  try {
    const historyItems = [];
    const seenFiles = new Set();

    const formatBytes = (bytes) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    // 1. Scan Generated Outputs (Documents and Converted Media)
    if (fs.existsSync(outputsDir)) {
      const files = fs.readdirSync(outputsDir);
      for (const f of files) {
        if (f.startsWith('chunk_') || f.startsWith('.')) continue;
        const fullPath = path.join(outputsDir, f);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) continue;

        const ext = path.extname(f).toLowerCase().replace('.', '');
        const isDoc = ['docx', 'pptx', 'pdf', 'txt', 'md'].includes(ext);
        const isVideo = ['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext);

        seenFiles.add(f.toLowerCase());
        historyItems.push({
          id: `out_${f}`,
          filename: f,
          displayName: f.replace(/_\d{13}/g, ''),
          bytes: stats.size,
          size: formatBytes(stats.size),
          createdAt: stats.mtime,
          format: ext.toUpperCase(),
          type: isDoc ? 'document' : (isVideo ? 'video' : 'audio'),
          category: isDoc ? 'generated_document' : 'converted_media',
          downloadUrl: `/api/download/${encodeURIComponent(f)}`
        });
      }
    }

    // 2. Scan Uploaded Media Files
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const f of files) {
        if (f.startsWith('chunk_') || f.startsWith('speech_') || f.startsWith('.')) continue;
        if (seenFiles.has(f.toLowerCase())) continue;

        const fullPath = path.join(uploadsDir, f);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) continue;

        const ext = path.extname(f).toLowerCase().replace('.', '');
        const isDoc = ['docx', 'pptx', 'pdf', 'txt', 'md'].includes(ext);
        const isVideo = ['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext);

        historyItems.push({
          id: `up_${f}`,
          filename: f,
          displayName: f.replace(/_\d{13}/g, ''),
          bytes: stats.size,
          size: formatBytes(stats.size),
          createdAt: stats.mtime,
          format: ext.toUpperCase(),
          type: isDoc ? 'document' : (isVideo ? 'video' : 'audio'),
          category: 'uploaded_media',
          downloadUrl: `/api/download/${encodeURIComponent(f)}`
        });
      }
    }

    // Sort newest first
    historyItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      count: historyItems.length,
      items: historyItems
    });
  } catch (err) {
    console.error('[API /history Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve history' });
  }
});

// 8. Delete History File
app.delete('/api/history/:filename', (req, res) => {
  try {
    const filename = decodeURIComponent(path.basename(req.params.filename));
    let target = path.join(outputsDir, filename);
    if (!fs.existsSync(target)) {
      target = path.join(uploadsDir, filename);
    }

    if (fs.existsSync(target)) {
      fs.unlinkSync(target);
      return res.json({ success: true, message: 'File removed from history' });
    }

    res.status(404).json({ error: 'File not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Single Page Application Fallback
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && fs.existsSync(path.join(clientDistDir, 'index.html'))) {
    return res.sendFile(path.join(clientDistDir, 'index.html'));
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Dev Supporter Media & AI Server running on http://localhost:${PORT}`);
});
