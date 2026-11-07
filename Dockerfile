# Multi-stage / Production Dockerfile for Dev Supporter
FROM node:22-bookworm-slim

# Install system dependencies: FFmpeg (essential for audio/video processing) and Python 3
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    python3-pip \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Enable corepack and prepare pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy root dependency manifests
COPY package.json pnpm-lock.yaml* ./

# Copy client dependency manifests
COPY client/package.json client/pnpm-lock.yaml* ./client/

# Install root dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Install client dependencies
RUN cd client && (pnpm install --frozen-lockfile || pnpm install)

# Copy the rest of the application source code
COPY . .

# Build the client production bundle
RUN cd client && pnpm run build

# Ensure uploads and outputs directories exist
RUN mkdir -p uploads outputs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose server port
EXPOSE 5000

# Start server
CMD ["node", "server/index.js"]
