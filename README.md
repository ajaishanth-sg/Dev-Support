# Dev Supporter — Universal Media Extractor, AI Transcriber & Corporate Reporting Suite

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-purple.svg)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)
[![Render](https://img.shields.io/badge/Deploy%20to-Render-46E3B7.svg)](https://render.com/)

An enterprise-grade media extraction, audio transcription, AI context analysis, and multi-format corporate document generation platform. Modeled after the **CloudConvert** workflow and UI with reverse-engineered architecture (REA), featuring full sidebar navigation, multi-lingual audio/video processing, and automated report generation matching the **Education Financial Reporting Template Bundle** (Word DOCX, PowerPoint PPTX, and Adobe PDF).

---

## 📑 Table of Contents

- [Core Features](#-core-features)
  - [1. Cloud Media Converter](#1-cloud-media-converter-mp4-to-mp3--universal-formats)
  - [2. OpenAI Whisper & Google NotebookLM Workspace](#2-openai-whisper--google-notebooklm-semantic-workspace)
  - [3. AI Context & Custom Prompt Analyzer](#3-ai-context--custom-prompt-analyzer)
  - [4. Multi-Format Corporate Document Exporter](#4-multi-format-corporate-document-exporter)
  - [5. Unified Activity & Workspace History](#5-activity--workspace-history)
- [System Architecture](#-system-architecture)
- [Project Directory Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Local Installation & Setup](#-local-installation--setup)
- [Environment Variables](#-environment-variables)
- [Deployment on Render](#-deployment-on-render)
  - [Method 1: Render Blueprint (render.yaml) — Recommended](#method-1-render-blueprint-renderyaml--recommended)
  - [Method 2: Render Docker Web Service (Manual)](#method-2-render-docker-web-service-manual)
- [REST API Reference](#-rest-api-reference)
- [Technologies Used](#-technologies-used)
- [Contributing & License](#-license)

---

## 🌟 Core Features

### 1. Cloud Media Converter (MP4 to MP3 & Universal Formats)
- **High-Fidelity Audio Extraction**: Extract crystal-clear MP3, WAV, AAC, M4A, FLAC, OGG, OPUS from MP4, MOV, MKV, AVI, WEBM, and other video/audio containers.
- **Audio Tuning Modal (CloudConvert Wrench Options)**:
  - **Bitrate Selection**: `128 kbps`, `192 kbps` (Standard), `256 kbps`, `320 kbps` (Studio Lossless).
  - **Sample Rate**: `44,100 Hz` (CD Audio), `48,000 Hz` (Broadcast / Studio), `96,000 Hz`.
  - **Audio Channels**: Stereo (2 channels) or Mono Speech (1 channel).
  - **Volume Multiplier**: 0.8x, 1.0x (Original), 1.5x (+3dB), 2.0x (+6dB boost).
  - **Audio Trimming**: Precision start (`HH:MM:SS`) and end time controls.
- **In-Browser Audio Player**: Preview converted audio tracks instantly before downloading.
- **Batch Processing & Live Progress**: Multi-file queue with real-time percentage progress indicators.

### 2. OpenAI Whisper & Google NotebookLM Semantic Workspace
- **Dual Whisper Engine (Local & Cloud)**:
  - **Groq Cloud Whisper Large-v3**: Runs the OpenAI Whisper `large-v3` architecture on ultra-fast LPUs in seconds with zero local GPU requirements.
  - **Local Python OpenAI Whisper**: Powered by PyTorch and the official [`openai-whisper`](https://github.com/openai/whisper) package (`whisper.load_model(...)`).
- **Multilingual Transcription & Direct Tamil Translation**:
  - **`task="transcribe"`**: Converts spoken speech into its native language script (e.g. Tamil speech -> Tamil Unicode text, English -> English).
  - **`task="translate"`**: Directly translates non-English audio (such as Tamil speech) into English text as it transcribes!
  - **Model Hierarchy**: Select between `large-v3` (highest quality), `medium` (balanced), `small`, or `base` (ultra-lightweight).
- **Google NotebookLM Reverse-Engineered Architecture (REA)**:
  - Ingests audio or documents and generates a **Structured Source Guide**:
    1. **Document Outline Tree**: Interactive file structure navigation.
    2. **Executive Briefing Document**: Concise synthesis with bulleted key takeaways and verified facts.
    3. **Thematic Information Breakdown**: Deep-dive conceptual analysis extracting facts, figures, and operational implications.
    4. **Thematic Structured Transcript**: Clean, book-formatted chapters (`Chapter I: Executive Overview`, `Chapter II: Departmental Variances`) with designated speaker roles and continuous readable paragraphs.
    5. **Source Grounded Q&A (Study Guide)**: Frequently Asked Questions paired with direct evidence quotes from the source.
    6. **Action Matrix**: Decision tracking and strategic roadmap.
- **Long Audio Chunking**: Automatically segments long recordings (20 min, 1 hr, 2+ hrs) into 10-minute slices using FFmpeg to reliably bypass API payload limits.

### 3. AI Context & Custom Prompt Analyzer ("Ask Anything")
- **Prompt-Driven Intelligence**: Upload any video, audio, or document, and ask AI to extract:
  - Specific business use cases and operational context
  - Budget vs. Actual financial variances
  - Strategic executive summaries and action items
- **Preset Prompt Chips**: Includes 1-click prompts for *Educational Financial Analysis*, *Executive Briefings*, *Risk Audits*, and *Next-Step Decision Matrices*.
- **Out-of-the-Box Functionality**: Runs with Groq Cloud LLMs (e.g. `openai/gpt-oss-120b`, `qwen/qwen3.8-27b`) or user-supplied custom API keys.

### 4. Multi-Format Corporate Document Exporter (Word DOCX, PPTX, PDF)
Modeled directly on the **Education Financial Reporting Template Bundle**:
- **Microsoft Word (.docx)**:
  - Native `.docx` document with styled headers (`EDUCATION CORP`), author block (`Prepared by: Emily Jacobs`), numbered sections (`I. Executive Summary`, `II. Purpose of the Analysis`), color-coded variance tables (`Category`, `Budgeted`, `Actual`, `Variance`, `Status`), and alternating zebra striping.
- **Microsoft PowerPoint (.pptx)**:
  - High-resolution 16:9 widescreen presentation deck with dark navy title slide, executive summary cards, embedded budget comparison data table, operational use-case cards, and strategic recommendation slides.
- **Adobe PDF (.pdf)**:
  - Publication-ready vector PDF document with corporate banners, clean typography hierarchy, and structured tables.
- **1-Click Multi-Export**: Download individual formats or trigger **Download All (DOCX + PPT + PDF)** simultaneously.

### 5. Unified Activity & Workspace History
- **Unified Media & Document Tracking**:
  - Automatically catalogs all uploaded video files, audio streams, and generated documents.
  - **Inline Media Player**: Play any uploaded or converted audio/video track directly inside the history viewer.
  - **Quick Handoff**: 1-click **"Transcribe"** button to load any past audio or video file straight into the OpenAI Whisper & NotebookLM engine.
  - **1-Click Downloads**: Direct download links for Word (`.docx`), PowerPoint (`.pptx`), Adobe (`.pdf`), and Text (`.txt`).
  - **Search & Filters**: Filter by `All Files`, `Media (Audio/Video)`, or `Documents (DOCX/PPT/PDF)`.

---

## 🏗️ System Architecture

```
                                  ┌───────────────────────────────┐
                                  │      Client (React 19)        │
                                  │   Vite + Tailwind CSS v4      │
                                  └──────────────┬────────────────┘
                                                 │ HTTP / REST / Multipart
                                                 ▼
                                  ┌───────────────────────────────┐
                                  │     Node.js Express Server    │
                                  │         (Port 5000)           │
                                  └───────┬──────────────┬────────┘
                                          │              │
                   ┌──────────────────────┴──────┐       └──────────────────────┐
                   ▼                             ▼                              ▼
        ┌─────────────────────┐       ┌─────────────────────┐        ┌─────────────────────┐
        │   FFmpeg Pipeline   │       │   Groq Cloud LPU    │        │  Document Exporters │
        │  Audio Extraction,  │       │  Whisper Large-v3   │        │   • docx (Word)     │
        │  Bitrate, Chunking  │       │  & LLM Synthesizer  │        │   • pptxgenjs (PPT) │
        └─────────────────────┘       └─────────────────────┘        │   • pdfkit (PDF)    │
                                                                     └─────────────────────┘
```

---

## 📂 Project Structure

```
Dev Supporter/
├── client/                     # Modern React + Vite + Tailwind CSS Frontend
│   ├── public/                 # Static assets & logos
│   ├── src/
│   │   ├── assets/             # Brand illustrations & icons
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # CloudConvert header & status indicator
│   │   │   ├── Sidebar.jsx         # Sidebar navigation across modules
│   │   │   ├── ConverterTab.jsx    # MP4 to MP3 & Media conversion engine
│   │   │   ├── TranscriberTab.jsx  # Multi-lingual speech transcriber
│   │   │   ├── AIAnalysisTab.jsx   # Custom prompt & use case analyzer
│   │   │   ├── DocumentExportTab.jsx # Word DOCX, PPTX, PDF exporter & preview
│   │   │   ├── HistoryTab.jsx      # Activity workspace & playback history
│   │   │   ├── LandingPage.jsx     # Overview showcase landing page
│   │   │   └── SettingsModal.jsx   # Wrench audio options & API key settings
│   │   ├── App.jsx                 # Application state controller
│   │   ├── main.jsx                # React root mount
│   │   └── index.css               # Tailwind CSS styling
│   ├── index.html
│   ├── vite.config.js          # Vite build & proxy configuration
│   └── package.json
├── server/                     # High-Performance Node.js & FFmpeg Backend
│   ├── ffmpegHelper.js         # Media transcoding, bitrate, chunking & duration parser
│   ├── aiEngine.js             # Speech transcription & report synthesizer
│   ├── documentExporter.js     # Native DOCX, PPTX, and PDF generators
│   ├── whisper_engine.py       # Optional local Python Whisper fallback script
│   └── index.js                # Express REST API & SPA static server
├── uploads/                    # Temporary working directory for uploaded files (.gitkeep)
├── outputs/                    # Output directory for converted files & reports (.gitkeep)
├── Dockerfile                  # Production Docker container definition (with FFmpeg)
├── .dockerignore               # Files excluded from Docker builds
├── render.yaml                 # Render Blueprint configuration for zero-config deploy
├── .env.example                # Example environment variables template
├── .gitignore                  # Git tracking exclusion rules
├── start.bat                   # 1-click Windows launcher
└── package.json                # Project root configuration & automation scripts
```

---

## ⚙️ Prerequisites

Before running locally, ensure you have:
1. **Node.js**: `v20.0.0` or higher ([Download Node.js](https://nodejs.org/))
2. **pnpm**: `v9.0.0` or higher (`npm install -g pnpm`)
3. **FFmpeg**: Installed and available in your system `PATH` ([Download FFmpeg](https://ffmpeg.org/download.html))
4. **Groq API Key**: Free API key from [Groq Console](https://console.groq.com/keys) (for Whisper Large-v3 cloud transcription and fast AI analysis)

---

## 🚀 Local Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/ajaishanth-sg/Dev-Support.git
cd Dev-Support
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your Groq API key:
```env
PORT=5000
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### 3. Install Dependencies
```bash
# Install root backend dependencies
pnpm install

# Install client frontend dependencies
cd client && pnpm install && cd ..
```

### 4. Run in Development Mode (Vite HMR + Express)
```bash
pnpm dev
```
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:5000](http://localhost:5000)

### 5. Run in Production Mode (All-in-One)
```bash
# Build the client bundle
pnpm run build

# Start the unified server
pnpm start
```
Open your browser at 👉 **[http://localhost:5000](http://localhost:5000)**

---

## 🌐 Deployment on Render

This project includes pre-configured **Docker** and **Render Blueprint (`render.yaml`)** support. Deploying via Docker is strongly recommended because it bundles `ffmpeg` directly in the container.

### Method 1: Render Blueprint (`render.yaml`) — Recommended

1. Push this repository to your GitHub account (`main` or `deploy` branch).
2. Log in to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** and select **Blueprint**.
4. Connect your `Dev-Support` GitHub repository.
5. Render will detect the `render.yaml` file automatically.
6. Under **Environment Variables**, supply your `GROQ_API_KEY`.
7. Click **Apply**. Render will automatically build the Docker container and deploy the web service!

### Method 2: Render Docker Web Service (Manual)

If you prefer to configure manually:
1. In the [Render Dashboard](https://dashboard.render.com/), click **New +** -> **Web Service**.
2. Connect your GitHub repository `https://github.com/ajaishanth-sg/Dev-Support`.
3. Choose the **`deploy`** or **`main`** branch.
4. Set **Runtime** to **`Docker`**.
5. Set **Instance Type** to **`Free`** (or higher).
6. Under **Environment Variables**, add:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `GROQ_API_KEY`: `your_groq_api_key_here`
7. Click **Create Web Service**.

Render will build the image, start the service, and provide you with a live HTTPS URL (e.g. `https://dev-support.onrender.com`).

---

## 📡 REST API Reference

| Endpoint | Method | Payload / Form-Data | Description |
|---|---|---|---|
| `/api/status` | `GET` | — | Checks backend status, FFmpeg installation, and supported media codecs |
| `/api/convert` | `POST` | `multipart/form-data` (`file`, `targetFormat`, `audioBitrate`, `sampleRate`, `channels`, `volume`, `trimStart`, `trimEnd`) | Converts video/audio into target format (MP3, WAV, AAC, FLAC, etc.) |
| `/api/conversion-status/:jobId` | `GET` | — | Returns conversion progress percentage and current stage |
| `/api/transcribe` | `POST` | `multipart/form-data` (`file`, `language`, `task`, `model`, `engine`, `apiKey`) | Transcribes or translates audio using Whisper Large-v3 & NotebookLM synthesizer |
| `/api/analyze-context` | `POST` | `multipart/form-data` (`file`, `customPrompt`, `analysisType`, `apiKey`) | Extracts custom operational insights and business summaries |
| `/api/export-documents` | `POST` | JSON (`reportData`, `metadata`) | Generates Word DOCX, PowerPoint PPTX, and Adobe PDF reports |
| `/api/download/:filename` | `GET` | — | Downloads converted media tracks, transcripts, and generated reports |
| `/api/history` | `GET` | — | Retrieves all active media conversions and generated documents |
| `/api/history/:filename` | `DELETE` | — | Deletes an item from the history registry |

---

## 🛠️ Technologies Used

### Frontend
- **React 19**: Modern declarative UI
- **Vite 8**: Next-generation lightning-fast frontend tooling
- **Tailwind CSS v4**: Utility-first responsive design
- **Lucide React**: Clean vector iconography
- **Axios**: HTTP client for API and multipart file transfers

### Backend
- **Node.js & Express 5**: Asynchronous REST API routing
- **Multer**: Streaming multipart file uploads with up to 2GB payload support
- **FFmpeg 8 / child_process**: Low-level audio extraction, bitrate conversion, and audio slicing
- **Groq Cloud API**: Ultra-fast Whisper Large-v3 speech recognition & LLM structuring
- **docx**: Programmatic Microsoft Word document generation
- **pptxgenjs**: 16:9 widescreen Microsoft PowerPoint deck generation
- **pdfkit**: Publication-quality Adobe PDF rendering

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
