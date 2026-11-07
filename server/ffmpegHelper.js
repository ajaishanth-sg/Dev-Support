const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');

// Verify FFmpeg availability
function checkFFmpeg() {
  return new Promise((resolve) => {
    exec('ffmpeg -version', (error, stdout) => {
      if (error) {
        resolve({ available: false, version: null });
      } else {
        const firstLine = stdout.split('\n')[0];
        resolve({ available: true, version: firstLine });
      }
    });
  });
}

// Get media duration in seconds
function getMediaDuration(inputPath) {
  return new Promise((resolve) => {
    const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`;
    exec(cmd, (err, stdout) => {
      if (err || !stdout.trim()) {
        resolve(0);
      } else {
        const dur = parseFloat(stdout.trim());
        resolve(isNaN(dur) ? 0 : dur);
      }
    });
  });
}

// Convert media
function convertMedia(inputPath, outputPath, options = {}, onProgress = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const duration = await getMediaDuration(inputPath);
      const args = ['-y', '-i', inputPath];

      if (options.trimStart && options.trimStart !== '00:00:00') {
        args.push('-ss', options.trimStart);
      }
      if (options.trimEnd && options.trimEnd !== '00:00:00') {
        args.push('-to', options.trimEnd);
      }

      const ext = path.extname(outputPath).toLowerCase();
      const audioExts = ['.mp3', '.wav', '.aac', '.m4a', '.flac', '.ogg', '.opus', '.wma'];
      
      if (audioExts.includes(ext)) {
        args.push('-vn');

        if (ext === '.mp3') args.push('-c:a', 'libmp3lame');
        else if (ext === '.aac' || ext === '.m4a') args.push('-c:a', 'aac');
        else if (ext === '.ogg') args.push('-c:a', 'libvorbis');
        else if (ext === '.opus') args.push('-c:a', 'libopus');
        else if (ext === '.flac') args.push('-c:a', 'flac');
        else if (ext === '.wav') args.push('-c:a', 'pcm_s16le');

        if (options.audioBitrate) {
          args.push('-b:a', options.audioBitrate);
        } else if (ext === '.mp3') {
          args.push('-b:a', '192k');
        }

        if (options.sampleRate) {
          args.push('-ar', options.sampleRate.toString());
        }

        if (options.channels) {
          args.push('-ac', options.channels.toString());
        }

        if (options.volume && options.volume !== 1.0 && options.volume !== '1.0') {
          args.push('-filter:a', `volume=${options.volume}`);
        }
      } else {
        if (ext === '.mp4') {
          args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-c:a', 'aac', '-b:a', '192k');
        } else if (ext === '.webm') {
          args.push('-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0', '-c:a', 'libopus');
        }
      }

      args.push(outputPath);

      console.log(`[FFmpeg] Executing: ffmpeg ${args.join(' ')}`);
      const proc = spawn('ffmpeg', args);

      let stderrData = '';
      proc.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        stderrData += text;

        if (onProgress && duration > 0) {
          const match = text.match(/time=(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/);
          if (match) {
            const hours = parseFloat(match[1]);
            const minutes = parseFloat(match[2]);
            const seconds = parseFloat(match[3]);
            const currentTime = hours * 3600 + minutes * 60 + seconds;
            const percent = Math.min(100, Math.round((currentTime / duration) * 100));
            onProgress(percent);
          }
        }
      });

      proc.on('close', (code) => {
        if (code === 0) {
          if (onProgress) onProgress(100);
          resolve(outputPath);
        } else {
          reject(new Error(`FFmpeg exited with code ${code}: ${stderrData}`));
        }
      });

      proc.on('error', reject);
    } catch (e) {
      reject(e);
    }
  });
}

// Extract lightweight audio for transcription (16kHz mono)
function extractAudioForSpeech(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i', inputPath,
      '-vn',
      '-ar', '16000',
      '-ac', '1',
      '-b:a', '64k',
      outputPath
    ];

    console.log(`[FFmpeg Speech Extract]: ffmpeg ${args.join(' ')}`);
    const proc = spawn('ffmpeg', args);
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`Failed to extract audio: ${stderr}`));
      }
    });
    proc.on('error', reject);
  });
}

// Reliable Chunker for long audio files (>20MB or >10 minutes)
async function chunkAudioForWhisper(inputPath, outputDir, segmentSeconds = 600) {
  const duration = await getMediaDuration(inputPath);
  const fileSize = fs.existsSync(inputPath) ? fs.statSync(inputPath).size : 0;

  // If under 20MB and under 10 minutes, no chunking needed
  if (fileSize < 20 * 1024 * 1024 && duration < 600) {
    return [inputPath];
  }

  return new Promise((resolve, reject) => {
    const chunkPrefix = `chunk_${Date.now()}`;
    const chunkPattern = path.join(outputDir, `${chunkPrefix}_%03d.mp3`);
    const args = [
      '-y',
      '-i', inputPath,
      '-vn',
      '-f', 'segment',
      '-segment_time', segmentSeconds.toString(),
      '-ar', '16000',
      '-ac', '1',
      '-b:a', '64k',
      chunkPattern
    ];

    console.log(`[FFmpeg Chunker]: Splitting long audio (Duration: ${duration}s, Size: ${(fileSize / (1024 * 1024)).toFixed(1)}MB)...`);
    const proc = spawn('ffmpeg', args);
    proc.on('close', (code) => {
      if (code === 0) {
        const files = fs.readdirSync(outputDir)
          .filter(f => f.startsWith(chunkPrefix) && f.endsWith('.mp3'))
          .map(f => path.join(outputDir, f))
          .sort();
        console.log(`[FFmpeg Chunker]: Created ${files.length} chunks for deep Whisper processing.`);
        resolve(files);
      } else {
        resolve([inputPath]);
      }
    });
    proc.on('error', () => resolve([inputPath]));
  });
}

// Document text extractor (PDF, TXT, MD)
async function extractDocumentContent(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text || '';
  }

  if (['.txt', '.md', '.json', '.csv', '.vtt', '.srt'].includes(ext)) {
    return fs.readFileSync(filePath, 'utf-8');
  }

  return '';
}

module.exports = {
  checkFFmpeg,
  getMediaDuration,
  convertMedia,
  extractAudioForSpeech,
  chunkAudioForWhisper,
  extractDocumentContent
};
