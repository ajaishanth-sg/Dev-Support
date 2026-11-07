const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { getMediaDuration, chunkAudioForWhisper } = require('./ffmpegHelper');

const DEFAULT_GROQ_KEY = process.env.GROQ_API_KEY || '';

// Preferred LLM model for analysis on Groq (high intelligence + reasoning)
const ANALYSIS_MODEL = 'openai/gpt-oss-120b';
const FALLBACK_MODELS = ['openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];

/**
 * Run local Python OpenAI Whisper via child process
 */
function runPythonWhisperLocal(audioPath, model = 'base', task = 'transcribe', language = 'auto') {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'whisper_engine.py');
    const args = [scriptPath, '--audio', audioPath, '--model', model, '--task', task];
    
    if (language && language !== 'auto') {
      args.push('--language', language);
    }

    console.log(`[Python Whisper Local] Executing: python ${args.join(' ')}`);
    const proc = spawn('python', args);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });

    proc.on('close', (code) => {
      try {
        const parsed = JSON.parse(stdout.trim());
        if (parsed.success) {
          resolve(parsed);
        } else {
          reject(new Error(parsed.error || `Python whisper exited with code ${code}`));
        }
      } catch (err) {
        if (code === 0 && stdout.trim()) {
          resolve({ success: true, text: stdout.trim(), language: language || 'en', segments: [] });
        } else {
          reject(new Error(`Failed to parse Python Whisper output: ${stderr || stdout}`));
        }
      }
    });

    proc.on('error', reject);
  });
}

/**
 * Transcribe single audio chunk with Groq Whisper Large v3 (with retry & rate-limit handling)
 */
async function transcribeSingleChunkGroq(chunkPath, task = 'transcribe', language = 'auto', apiKey, retries = 3) {
  const effectiveKey = (apiKey && typeof apiKey === 'string' && apiKey.trim().length > 5)
    ? apiKey.trim()
    : DEFAULT_GROQ_KEY;

  const fileBuffer = fs.readFileSync(chunkPath);
  const ext = path.extname(chunkPath).toLowerCase();
  const mimeType = ext === '.wav' ? 'audio/wav' : 'audio/mp3';

  const endpoint = task === 'translate'
    ? 'https://api.groq.com/openai/v1/audio/translations'
    : 'https://api.groq.com/openai/v1/audio/transcriptions';

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const blob = new Blob([fileBuffer], { type: mimeType });
      const form = new FormData();
      form.append('file', blob, path.basename(chunkPath));
      form.append('model', 'whisper-large-v3');
      form.append('response_format', 'text');

      if (task === 'transcribe' && language && language !== 'auto') {
        form.append('language', language);
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${effectiveKey}` },
        body: form
      });

      if (res.status === 429) {
        console.warn(`[Groq Whisper] Rate limit reached (429) on attempt ${attempt}. Waiting 4s before retry...`);
        await new Promise(r => setTimeout(r, 4000));
        continue;
      }

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Groq Whisper error (${res.status}): ${errText}`);
      }

      const rawText = await res.text();
      return {
        text: rawText.trim(),
        language: task === 'translate' ? 'English (Translated)' : (language !== 'auto' ? language : 'Detected'),
        duration: 0
      };
    } catch (err) {
      console.warn(`[Groq Whisper] Attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 2000 * attempt));
      } else {
        throw err;
      }
    }
  }
}

/**
 * Full Audio Transcriber with Long-Audio Segmenter & Deep Comprehension Analysis
 */
async function transcribeAudio(audioPath, originalFilename, options = {}) {
  const {
    language = 'auto',
    engine = 'groq',
    model = 'large-v3',
    task = 'transcribe',
    apiKey,
    onProgress
  } = options;

  const effectiveKey = (apiKey && typeof apiKey === 'string' && apiKey.trim().length > 5)
    ? apiKey.trim()
    : DEFAULT_GROQ_KEY;

  let combinedTranscript = '';
  let detectedLang = language;
  
  // 1. Analyze media duration and size
  const totalDuration = await getMediaDuration(audioPath);
  const fileSizeBytes = fs.existsSync(audioPath) ? fs.statSync(audioPath).size : 0;
  const fileSizeMb = (fileSizeBytes / (1024 * 1024)).toFixed(1);
  const durationMins = Math.floor(totalDuration / 60);
  const durationSecs = Math.floor(totalDuration % 60);
  const durationFormatted = `${durationMins}m ${durationSecs}s`;

  if (onProgress) {
    onProgress({
      percentage: 12,
      stage: `Analyzed audio stream (${durationFormatted}, ${fileSizeMb} MB). Preparing segmenter...`,
      totalDuration,
      durationFormatted,
      fileSizeMb
    });
  }

  // 2. Local Python OpenAI Whisper execution if requested
  if (engine === 'local') {
    try {
      console.log(`[AI Transcriber] Running Local Python OpenAI Whisper (${model}, task=${task}, lang=${language})...`);
      if (onProgress) {
        onProgress({
          percentage: 25,
          stage: `Running Local Python OpenAI Whisper (${model}, multilingual speech recognition)...`,
          totalDuration,
          durationFormatted,
          fileSizeMb
        });
      }
      const pyResult = await runPythonWhisperLocal(audioPath, model, task, language);
      combinedTranscript = pyResult.text;
      detectedLang = pyResult.language;
      if (onProgress) {
        onProgress({
          percentage: 75,
          stage: 'Local Whisper finished. Proceeding to AI analysis...',
          totalDuration,
          durationFormatted,
          fileSizeMb
        });
      }
    } catch (err) {
      console.warn('[AI Transcriber] Local Python whisper notice, falling back to Groq Cloud Whisper Large-v3:', err.message);
    }
  }

  // 3. Groq Cloud Whisper Large-v3 execution
  if (!combinedTranscript) {
    try {
      const uploadsDir = path.dirname(audioPath);
      console.log(`[AI Transcriber] Processing audio through Groq Whisper Large v3 (Task: ${task})... File: ${originalFilename}`);
      
      const chunks = await chunkAudioForWhisper(audioPath, uploadsDir, 600);
      const chunksTotal = chunks.length;

      if (onProgress) {
        onProgress({
          percentage: 18,
          stage: `Audio segmented into ${chunksTotal} segment${chunksTotal > 1 ? 's' : ''} for high-speed transcription...`,
          chunksTotal,
          chunkCurrent: 0,
          totalDuration,
          durationFormatted,
          fileSizeMb
        });
      }

      const chunkTexts = [];

      for (let i = 0; i < chunksTotal; i++) {
        const c = chunks[i];
        const startChunkPct = Math.round(18 + (i / chunksTotal) * 58);
        if (onProgress) {
          onProgress({
            percentage: startChunkPct,
            stage: `Transcribing segment ${i + 1} of ${chunksTotal} with OpenAI Whisper Large v3...`,
            chunksTotal,
            chunkCurrent: i + 1,
            totalDuration,
            durationFormatted,
            fileSizeMb
          });
        }

        try {
          console.log(`[AI Transcriber] Transcribing chunk ${i + 1}/${chunksTotal}...`);
          const result = await transcribeSingleChunkGroq(c, task, language, effectiveKey);
          if (result.text && result.text.trim().length > 0) {
            chunkTexts.push(result.text.trim());
          }
          if (result.language) detectedLang = result.language;
          // Pacing pause between chunks to respect API rate limits
          if (i < chunksTotal - 1) {
            await new Promise(r => setTimeout(r, 600));
          }
        } catch (err) {
          console.warn(`[AI Transcriber] Chunk ${i + 1} notice:`, err.message);
        }

        const endChunkPct = Math.round(18 + ((i + 1) / chunksTotal) * 58);
        if (onProgress) {
          onProgress({
            percentage: endChunkPct,
            stage: `Completed segment ${i + 1} of ${chunksTotal} (${endChunkPct}% finished)...`,
            chunksTotal,
            chunkCurrent: i + 1,
            totalDuration,
            durationFormatted,
            fileSizeMb
          });
        }
      }

      combinedTranscript = chunkTexts.join('\n\n');
      console.log(`[AI Transcriber] Completed transcribing all chunks! Total text length: ${combinedTranscript.length} chars`);
    } catch (err) {
      console.warn('[AI Transcriber] Whisper pipeline error:', err.message);
    }
  }

  if (!combinedTranscript || combinedTranscript.trim().length < 5) {
    throw new Error('Audio transcription yielded empty text. Please ensure the audio file contains audible speech.');
  }

  // 4. AI-Powered Intelligent Analysis
  if (onProgress) {
    onProgress({
      percentage: 80,
      stage: `Running intelligent content analysis with AI (understanding context, topics, and key information)...`,
      totalDuration,
      durationFormatted,
      fileSizeMb
    });
  }

  console.log(`[AI Analysis] Analyzing transcript with LLM (${combinedTranscript.length} chars)...`);
  const notebookData = await generateNotebookLMStructure(combinedTranscript, originalFilename, effectiveKey, task);

  if (onProgress) {
    onProgress({
      percentage: 90,
      stage: 'AI analysis complete. Preparing documents...',
      totalDuration,
      durationFormatted,
      fileSizeMb
    });
  }

  return {
    originalFilename,
    engine,
    task,
    language: detectedLang,
    duration: Math.round(totalDuration || 180),
    rawTranscript: combinedTranscript,
    notebookLM: notebookData
  };
}

/**
 * Intelligent Audio/Document Analysis Engine
 * Uses LLM to understand content, determine topic/domain, generate dynamic titles,
 * and produce structured contextual analysis — works with any language input.
 */
async function generateNotebookLMStructure(text, filename, apiKey = DEFAULT_GROQ_KEY, task = 'transcribe') {
  const key = apiKey || DEFAULT_GROQ_KEY;
  const isTranslation = task === 'translate';
  const cleanTitle = path.parse(filename || 'Recording').name.replace(/_converted.*$/i, '').replace(/[-_]/g, ' ').trim();

  // Filter out any initial Whisper hallucination noise (e.g. Gurmukhi/strange script bursts at start)
  let cleanTranscript = (text || '').replace(/^[\u0A00-\u0A7F\u0A80-\u0AFF\s\.\,\?\!\:\;]{10,}/, '').trim();
  if (!cleanTranscript) cleanTranscript = text;

  // Groq's 128k context window easily supports up to 90,000 characters
  let contentSample = cleanTranscript;
  if (cleanTranscript.length > 90000) {
    const p1 = cleanTranscript.substring(0, 45000);
    const p2 = cleanTranscript.substring(cleanTranscript.length - 45000);
    contentSample = `${p1}\n\n[... continuing core discussion ...]\n\n${p2}`;
  }

  const prompt = `You are an elite business analyst and audio intelligence engine (similar to Google NotebookLM).
You receive a transcript from an audio recording.

CRITICAL INSTRUCTIONS:
1. The transcript may be spoken in ANY language (Tamil, Hindi, English, Tanglish, etc.). You must UNDERSTAND THE SUBSTANCE, MEANING, AND CONTEXT of what the speakers are discussing.
2. DO NOT output random or raw non-English words. Translate, rephrase, and synthesize EVERYTHING into clear, professional, articulate English.
3. Ignore microphone noise, audio glitches, or hallucinated characters at the start.
4. Provide a deep, comprehensive report with extensive detail (equivalent to a multi-page executive briefing).
5. Generate a relevant, descriptive title based on the ACTUAL TOPIC discussed — never generic titles or raw filenames.
6. The executive summary must be thorough (3 to 5 comprehensive paragraphs) explaining who the speakers are, the organization/business setting, the core problem, the technical debate, and the outcomes.
7. Detail all technical workflows, calculations, balance reconciliations, business rules, and decisions.

The audio file was named: "${cleanTitle}"

Analyze the transcript thoroughly and return a JSON object with this EXACT schema:
{
  "detectedDomain": "Specific Industry or Domain (e.g. 'Accounting & ERP – Receivables Management for Garment Manufacturing')",
  "detectedLanguage": "Primary language(s) spoken (e.g. 'Tamil & English (Mixed)')",
  "sourceTitle": "A descriptive, professional title reflecting the actual discussion",
  "sourceType": "${isTranslation ? 'Translated Audio Recording' : 'Transcribed Audio Recording'}",
  "briefingDoc": {
    "title": "Comprehensive Title for Executive Briefing",
    "executiveAbstract": "Comprehensive 3-5 paragraph deep executive synthesis explaining: (1) Who the participants are and the company/factory setting, (2) The core business/technical challenge, system screens, or module requirements, (3) Key technical and operational details, workflows, and calculations discussed, (4) Agreements finalized, action directives, and strategic outcomes. Write in articulate, professional English.",
    "keyTakeaways": [
      "Key takeaway 1 — specific operational or business rule discussed",
      "Key takeaway 2 — technical specification or workflow requirement",
      "Key takeaway 3 — financial reconciliation, variance, or accounting rule",
      "Key takeaway 4 — vendor, partner, or site-visit decision",
      "Key takeaway 5 — timeline, milestone, or next-step commitment",
      "Key takeaway 6 — operational optimization or process change"
    ]
  },
  "chronologicalFlow": {
    "beginning": "In-depth multi-paragraph narrative of how the session opens: the participants, context setting, initial problem scope, and the primary agenda introduced.",
    "middle": "In-depth multi-paragraph narrative of the core discussion: specific working requirements, system screens, debit note workflows, TDS postings, balance calculations, variances analyzed, and debates between participants.",
    "conclusion": "In-depth multi-paragraph narrative of how the recording concludes: agreements reached, task assignments, site visits scheduled, deadlines set, and next steps."
  },
  "thematicInformation": [
    {
      "topic": "Theme 1 (e.g. Receivables & Balance Reconciliation)",
      "summary": "Detailed multi-sentence explanation of what the speakers discussed regarding this theme, why it matters, and how it works.",
      "keyInsights": ["Specific technical insight 1", "Specific operational insight 2"]
    },
    {
      "topic": "Theme 2 (e.g. Debit-Note Creation & Workflow)",
      "summary": "Detailed multi-sentence explanation of this theme.",
      "keyInsights": ["Specific insight 1", "Specific insight 2"]
    },
    {
      "topic": "Theme 3 (e.g. TDS Management & Accounting Rules)",
      "summary": "Detailed multi-sentence explanation of this theme.",
      "keyInsights": ["Specific insight 1", "Specific insight 2"]
    },
    {
      "topic": "Theme 4 (e.g. Excel Export & Dashboard Functionality)",
      "summary": "Detailed multi-sentence explanation of this theme.",
      "keyInsights": ["Specific insight 1", "Specific insight 2"]
    },
    {
      "topic": "Theme 5 (e.g. On-Site Factory Verification & Operations)",
      "summary": "Detailed multi-sentence explanation of this theme.",
      "keyInsights": ["Specific insight 1", "Specific insight 2"]
    }
  ],
  "structuredTranscript": [
    {
      "chapterNumber": 1,
      "chapterTitle": "Chapter I: Opening Context, Stakeholders & Agenda",
      "speaker": "Discussion Lead & Participants",
      "paragraphs": [
        "First comprehensive English paragraph detailing the opening discussion.",
        "Second comprehensive English paragraph detailing initial scope and problem definition."
      ]
    },
    {
      "chapterNumber": 2,
      "chapterTitle": "Chapter II: Core Operational Specifications & Workflow Walkthrough",
      "speaker": "Finance & Technical Team",
      "paragraphs": [
        "Comprehensive English paragraph detailing system screens and data entry.",
        "Comprehensive English paragraph detailing workflow handoffs and business rules."
      ]
    },
    {
      "chapterNumber": 3,
      "chapterTitle": "Chapter III: Accounting Reconciliations, Variances & Field Validations",
      "speaker": "Accounting Specialists",
      "paragraphs": [
        "Comprehensive English paragraph detailing calculations and discrepancies identified.",
        "Comprehensive English paragraph explaining resolution mechanisms."
      ]
    },
    {
      "chapterNumber": 4,
      "chapterTitle": "Chapter IV: Concluding Directives, Factory Visits & Delivery Roadmap",
      "speaker": "Project Leadership",
      "paragraphs": [
        "Comprehensive English paragraph detailing final agreements, task assignments, and next milestones."
      ]
    }
  ],
  "groundedFAQ": [
    {
      "question": "What is the primary business problem addressed in this recording?",
      "answer": "Detailed answer explaining the background, context, and core issue.",
      "sourceQuote": "Contextual English reference from the discussion."
    },
    {
      "question": "What specific workflow or technical requirements were established?",
      "answer": "Detailed answer outlining the system features and operational rules.",
      "sourceQuote": "Contextual English reference from the discussion."
    },
    {
      "question": "What financial discrepancies or calculations were reconciled?",
      "answer": "Detailed answer explaining figures, variances, and accounting logic.",
      "sourceQuote": "Contextual English reference from the discussion."
    },
    {
      "question": "What are the immediate next steps and commitments agreed by the team?",
      "answer": "Detailed answer covering tasks, deadlines, and ownership.",
      "sourceQuote": "Contextual English reference from the discussion."
    }
  ],
  "actionPlan": [
    "Execute primary requirement or technical spec identified in the discussion.",
    "Standardize workflow and eliminate redundant or duplicate entries.",
    "Implement automated validation rules and reporting templates.",
    "Conduct field verification, audit, or on-site user training.",
    "Track milestone progress and report in follow-up review."
  ],
  "metricsTable": [
    {"item": "Key Figure / Metric", "value": "Recorded Value", "context": "Detailed explanation of what this figure represents", "status": "Reconciled / In Progress"}
  ]
}

IMPORTANT: 
- Return ONLY valid JSON. No markdown code blocks, no text before or after the JSON.
- Every field must contain fluent, professional English that demonstrates deep understanding.
- Never echo raw non-English words or garbled phonetics.`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: ANALYSIS_MODEL,
          messages: [
            { role: 'system', content: 'You are an expert multilingual content analyst. You understand audio transcripts in any language and produce clear, well-structured English analysis. Output pure JSON only — no markdown, no code blocks.' },
            { role: 'user', content: `${prompt}\n\nTRANSCRIPT:\n${contentSample}` }
          ],
          temperature: 0.2,
          max_tokens: 4000
        })
      });

      if (res.status === 429) {
        console.warn(`[AI Analysis] Rate limited (429), pausing 4s... (attempt ${attempt})`);
        await new Promise(r => setTimeout(r, 4000));
        continue;
      }

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          let cleaned = content.replace(/```json/gi, '').replace(/```/g, '').trim();
          // Handle potential <think> tags from some models
          const thinkEnd = cleaned.indexOf('</think>');
          if (thinkEnd !== -1) {
            cleaned = cleaned.substring(thinkEnd + 8).trim();
          }
          const firstBrace = cleaned.indexOf('{');
          const lastBrace = cleaned.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
          }
          const parsed = JSON.parse(cleaned);

          // Normalize the response — ensure all required fields exist
          return normalizeAnalysisResult(parsed, cleanTitle, isTranslation);
        }
      } else {
        const errText = await res.text();
        console.warn(`[AI Analysis] Groq API error (${res.status}):`, errText);
      }
    } catch (err) {
      console.warn(`[AI Analysis] Attempt ${attempt}/3 failed:`, err.message);
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }
    }
  }

  // If LLM completely fails, try a simpler/smaller model as last resort
  console.warn('[AI Analysis] Primary model failed. Trying fallback model...');
  try {
    return await generateAnalysisWithFallbackModel(text, cleanTitle, key, isTranslation);
  } catch (fallbackErr) {
    console.warn('[AI Analysis] Fallback model also failed:', fallbackErr.message);
  }

  // Ultimate fallback: return a structured placeholder that acknowledges the content
  return buildMinimalPlaceholder(cleanTitle, text, isTranslation);
}

/**
 * Normalize and ensure all fields exist in the analysis result
 */
function normalizeAnalysisResult(parsed, cleanTitle, isTranslation) {
  const result = { ...parsed };

  // Ensure sourceTitle
  if (!result.sourceTitle || result.sourceTitle.length < 3) {
    result.sourceTitle = cleanTitle;
  }

  // Ensure sourceType
  if (!result.sourceType) {
    result.sourceType = isTranslation ? 'Translated Recording' : 'Transcribed Recording';
  }

  // Ensure briefingDoc
  if (!result.briefingDoc) {
    result.briefingDoc = {
      title: result.sourceTitle,
      executiveAbstract: 'Analysis of the provided content.',
      keyTakeaways: ['Content analysis completed.']
    };
  }
  if (!result.briefingDoc.title) {
    result.briefingDoc.title = result.sourceTitle;
  }
  if (!result.briefingDoc.keyTakeaways || !Array.isArray(result.briefingDoc.keyTakeaways)) {
    result.briefingDoc.keyTakeaways = ['Content analysis completed.'];
  }

  // Ensure chronologicalFlow
  if (!result.chronologicalFlow || !result.chronologicalFlow.beginning) {
    result.chronologicalFlow = {
      beginning: 'The recording opens with introductory context.',
      middle: 'The main discussion covers the core topics.',
      conclusion: 'The recording concludes with summary points.'
    };
  }

  // Ensure thematicInformation
  if (!result.thematicInformation || !Array.isArray(result.thematicInformation) || result.thematicInformation.length === 0) {
    result.thematicInformation = [{
      topic: 'Main Discussion',
      summary: result.briefingDoc.executiveAbstract || 'Content analysis.',
      keyInsights: result.briefingDoc.keyTakeaways || ['Analysis completed.']
    }];
  }

  // Ensure structuredTranscript
  if (!result.structuredTranscript || !Array.isArray(result.structuredTranscript) || result.structuredTranscript.length === 0) {
    result.structuredTranscript = [
      { chapterNumber: 1, chapterTitle: 'Opening', speaker: 'Participants', paragraphs: [result.chronologicalFlow.beginning] },
      { chapterNumber: 2, chapterTitle: 'Main Discussion', speaker: 'Participants', paragraphs: [result.chronologicalFlow.middle] },
      { chapterNumber: 3, chapterTitle: 'Conclusion', speaker: 'Participants', paragraphs: [result.chronologicalFlow.conclusion] }
    ];
  }

  // Ensure groundedFAQ
  if (!result.groundedFAQ || !Array.isArray(result.groundedFAQ) || result.groundedFAQ.length === 0) {
    result.groundedFAQ = [{
      question: 'What is this recording about?',
      answer: result.briefingDoc.executiveAbstract || 'Content analysis of the provided recording.',
      sourceQuote: 'Based on the full recording analysis.'
    }];
  }

  // Ensure actionPlan
  if (!result.actionPlan || !Array.isArray(result.actionPlan) || result.actionPlan.length === 0) {
    result.actionPlan = ['Review the key findings from this analysis.'];
  }

  // Normalize metricsTable -> financialTable for backward compatibility
  if (result.metricsTable && !result.financialTable) {
    result.financialTable = result.metricsTable.map(m => ({
      category: m.item || m.category || 'Metric',
      budgeted: m.value || m.budgeted || '-',
      actual: m.context || m.actual || '-',
      variance: m.status || m.variance || '-',
      status: m.status || 'Noted'
    }));
  }

  // Ensure financialTable exists
  if (!result.financialTable || !Array.isArray(result.financialTable) || result.financialTable.length === 0) {
    result.financialTable = [];
  }

  return result;
}

/**
 * Fallback: use a smaller/different model if the primary one fails
 */
async function generateAnalysisWithFallbackModel(text, cleanTitle, apiKey, isTranslation) {
  let contentSample = text;
  if (text.length > 4000) {
    contentSample = text.substring(0, 2000) + '\n...\n' + text.substring(text.length - 2000);
  }

  const simplePrompt = `Analyze this transcript and explain what it's about in English. The transcript may be in any language.

File: "${cleanTitle}"

Return JSON with:
{
  "sourceTitle": "descriptive title based on content",
  "sourceType": "${isTranslation ? 'Translated Recording' : 'Transcribed Recording'}",
  "briefingDoc": {
    "title": "analysis title",
    "executiveAbstract": "2-3 paragraph English summary of the content",
    "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3"]
  },
  "chronologicalFlow": {
    "beginning": "what happens at the start",
    "middle": "main discussion topics",
    "conclusion": "how it ends"
  },
  "thematicInformation": [{"topic": "theme", "summary": "explanation", "keyInsights": ["insight"]}],
  "structuredTranscript": [{"chapterNumber": 1, "chapterTitle": "title", "speaker": "speaker", "paragraphs": ["text"]}],
  "groundedFAQ": [{"question": "q", "answer": "a", "sourceQuote": "quote"}],
  "actionPlan": ["action 1", "action 2"],
  "financialTable": []
}

Return ONLY valid JSON.

TRANSCRIPT:
${contentSample}`;

  const fallbackModels = ['openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];

  for (const model of fallbackModels) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'Analyze transcripts and output JSON only. Understand any language and explain in English.' },
            { role: 'user', content: simplePrompt }
          ],
          temperature: 0.2,
          max_tokens: 3000
        })
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          let cleaned = content.replace(/```json/gi, '').replace(/```/g, '').trim();
          const thinkEnd = cleaned.indexOf('</think>');
          if (thinkEnd !== -1) cleaned = cleaned.substring(thinkEnd + 8).trim();
          const firstBrace = cleaned.indexOf('{');
          const lastBrace = cleaned.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
          }
          const parsed = JSON.parse(cleaned);
          return normalizeAnalysisResult(parsed, cleanTitle, isTranslation);
        }
      }
    } catch (e) {
      console.warn(`[AI Analysis] Fallback model ${model} failed:`, e.message);
    }
  }

  throw new Error('All fallback models failed');
}

/**
 * Ultimate fallback: minimal placeholder when all LLM calls fail
 */
function buildMinimalPlaceholder(cleanTitle, text, isTranslation) {
  const wordCount = (text || '').split(/\s+/).length;

  return {
    detectedDomain: 'Unknown',
    detectedLanguage: 'Unknown',
    sourceTitle: cleanTitle,
    sourceType: isTranslation ? 'Translated Recording' : 'Transcribed Recording',
    briefingDoc: {
      title: `Analysis: ${cleanTitle}`,
      executiveAbstract: `This recording titled "${cleanTitle}" contains approximately ${wordCount} words of transcribed content. The AI analysis service was temporarily unavailable, so a detailed contextual analysis could not be generated at this time. Please try the AI Context Studio to run a custom analysis on the raw transcript.`,
      keyTakeaways: [
        `Recording "${cleanTitle}" has been successfully transcribed (${wordCount} words).`,
        'The raw transcript is available for review and manual analysis.',
        'Use the AI Context Studio tab to generate a detailed analysis with custom prompts.'
      ]
    },
    chronologicalFlow: {
      beginning: 'The recording begins with initial context. (Detailed AI analysis was unavailable — use the Context Studio for manual analysis.)',
      middle: 'The main discussion covers the core topics of the recording.',
      conclusion: 'The recording concludes with final remarks.'
    },
    thematicInformation: [{
      topic: cleanTitle,
      summary: `Transcription of "${cleanTitle}" completed. Use the AI Context Studio for in-depth analysis.`,
      keyInsights: ['Transcript available for review', 'Custom AI analysis available in Context Studio']
    }],
    structuredTranscript: [{
      chapterNumber: 1,
      chapterTitle: `Full Recording: ${cleanTitle}`,
      speaker: 'Participants',
      paragraphs: [`Transcription completed. ${wordCount} words captured. For detailed chapter-by-chapter analysis, use the AI Context Studio.`]
    }],
    groundedFAQ: [{
      question: 'What is this recording about?',
      answer: `This is a transcription of "${cleanTitle}". For detailed content analysis, use the AI Context Studio tab.`,
      sourceQuote: 'Full transcript available in the raw transcript section.'
    }],
    actionPlan: [
      'Review the raw transcript for key information.',
      'Use the AI Context Studio to generate detailed analysis with custom prompts.',
      'Export documents once analysis is complete.'
    ],
    financialTable: []
  };
}

/**
 * AI Context & Prompt Analyzer — used by the Context Studio tab
 */
async function analyzeContextAndGenerateReport(inputData, userPrompt = '', reportTemplate = 'general', apiKey = DEFAULT_GROQ_KEY) {
  const content = typeof inputData === 'string' ? inputData : JSON.stringify(inputData);
  const key = apiKey || DEFAULT_GROQ_KEY;

  if (key && userPrompt && userPrompt.trim().length > 0) {
    try {
      const prompt = `You are an intelligent content analyst. Analyze the provided content based on the user's request.

User's Request: "${userPrompt}"

CRITICAL RULES:
1. The content may be in ANY language. UNDERSTAND IT and respond in clear English.
2. Do NOT copy raw non-English text into your output. Translate and explain it.
3. Generate a title and analysis that matches the ACTUAL content — not generic templates.
4. Extract real data, figures, and specifics from the content. Do not make up numbers.
5. If the content doesn't contain financial data, don't create fake financial tables.

Return a JSON object:
{
  "title": "Descriptive title based on actual content and user's request",
  "subtitle": "Brief subtitle describing the analysis scope",
  "organization": "Identified organization or context from content, or 'Content Analysis'",
  "preparedBy": "AI Analysis Engine",
  "date": "${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}",
  "executiveSummary": "Comprehensive multi-paragraph summary addressing the user's request, explaining what the content is about in clear English",
  "chronologicalFlow": {
    "beginning": "How the content/discussion starts",
    "middle": "Main topics and details covered",
    "conclusion": "How it concludes — decisions, outcomes, next steps"
  },
  "dataTable": [
    {"item": "Key data point from content", "value": "Extracted value", "context": "Why it matters", "status": "Status"}
  ],
  "contextAndUseCases": [
    {"title": "Key Topic 1", "description": "Detailed explanation"},
    {"title": "Key Topic 2", "description": "Detailed explanation"},
    {"title": "Key Topic 3", "description": "Detailed explanation"}
  ],
  "keyFindings": ["Finding 1 based on actual content", "Finding 2", "Finding 3"],
  "recommendations": ["Actionable recommendation 1", "Recommendation 2", "Recommendation 3"],
  "slides": [
    {"slideNumber": 1, "title": "Overview", "bullets": ["Point 1", "Point 2"]},
    {"slideNumber": 2, "title": "Key Analysis", "bullets": ["Point 1", "Point 2"]},
    {"slideNumber": 3, "title": "Findings & Next Steps", "bullets": ["Point 1", "Point 2"]}
  ]
}
Return raw JSON only — no markdown, no code blocks.`;

      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: ANALYSIS_MODEL,
          messages: [
            { role: 'system', content: 'You are an expert multilingual content analyst. Understand any language and output clear English analysis as valid JSON only.' },
            { role: 'user', content: `${prompt}\n\nCONTENT TO ANALYZE:\n${content.substring(0, 12000)}` }
          ],
          temperature: 0.2,
          max_tokens: 4000
        })
      });

      if (resp.ok) {
        const jsonResp = await resp.json();
        const textResp = jsonResp.choices?.[0]?.message?.content;
        if (textResp) {
          let cleaned = textResp.replace(/```json/gi, '').replace(/```/g, '').trim();
          const thinkEnd = cleaned.indexOf('</think>');
          if (thinkEnd !== -1) cleaned = cleaned.substring(thinkEnd + 8).trim();
          const firstBrace = cleaned.indexOf('{');
          const lastBrace = cleaned.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
          }
          const parsed = JSON.parse(cleaned);

          // Normalize: ensure financialTable exists for backward compat
          if (!parsed.financialTable && parsed.dataTable) {
            parsed.financialTable = parsed.dataTable.map(d => ({
              category: d.item || d.category || 'Item',
              budgeted: d.value || d.budgeted || '-',
              actual: d.context || d.actual || '-',
              variance: d.status || d.variance || '-',
              status: d.status || 'Noted'
            }));
          }
          if (!parsed.financialTable) {
            parsed.financialTable = [];
          }

          return parsed;
        }
      }
    } catch (e) {
      console.warn('[AI Engine] Context analysis error:', e.message);
    }
  }

  // Fallback: return a minimal but honest report
  return {
    title: 'Content Analysis',
    subtitle: 'AI-Generated Analysis Report',
    organization: 'Dev Supporter Analysis',
    preparedBy: 'AI Analysis Engine',
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    userQuery: userPrompt || 'General Analysis',
    executiveSummary: 'The AI analysis service was temporarily unavailable. The content has been captured and is available for review. Please try again or use a different prompt.',
    chronologicalFlow: {
      beginning: 'Content begins with introductory context.',
      middle: 'Main topics are discussed in detail.',
      conclusion: 'Content concludes with summary points.'
    },
    financialTable: [],
    contextAndUseCases: [
      { title: 'Content Review', description: 'Review the raw content for key information.' },
      { title: 'Re-analyze', description: 'Try running the analysis again with a specific prompt.' }
    ],
    keyFindings: [
      'Content has been captured and is available for review.',
      'Re-run the analysis for detailed insights.'
    ],
    recommendations: [
      'Review the raw transcript/content directly.',
      'Try the analysis again with a more specific prompt.'
    ],
    slides: [
      { slideNumber: 1, title: 'Overview', bullets: ['Content captured', 'Analysis pending'] },
      { slideNumber: 2, title: 'Next Steps', bullets: ['Re-run analysis', 'Review raw content'] }
    ]
  };
}

module.exports = {
  transcribeAudio,
  analyzeContextAndGenerateReport,
  generateNotebookLMStructure,
  runPythonWhisperLocal
};
