#!/bin/bash

set -e

echo "Building New API Electron App..."
SITE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="${BACKEND_DIR:-$SITE_DIR/../apiporter-backend}"

if [[ ! -f "$BACKEND_DIR/go.mod" ]]; then
    echo "Backend repository not found at $BACKEND_DIR. Set BACKEND_DIR to its location."
    exit 1
fi

echo "Building the dashboard from $SITE_DIR..."
cd "$SITE_DIR"
VITE_API_BASE_URL="${VITE_API_BASE_URL:-http://127.0.0.1:3000}" bun run build

echo "Step 2: Building Go backend..."
cd "$BACKEND_DIR"

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Building for macOS..."
    CGO_ENABLED=1 go build -ldflags="-s -w" -o "$SITE_DIR/new-api"
    cd "$SITE_DIR/electron"
    npm install
    npm run build:mac
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Building for Linux..."
    CGO_ENABLED=1 go build -ldflags="-s -w" -o "$SITE_DIR/new-api"
    cd "$SITE_DIR/electron"
    npm install
    npm run build:linux
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    echo "Building for Windows..."
    CGO_ENABLED=1 go build -ldflags="-s -w" -o "$SITE_DIR/new-api.exe"
    cd "$SITE_DIR/electron"
    npm install
    npm run build:win
else
    echo "Unknown OS, building for current platform..."
    CGO_ENABLED=1 go build -ldflags="-s -w" -o "$SITE_DIR/new-api"
    cd "$SITE_DIR/electron"
    npm install
    npm run build
fi

echo "Step 3: Electron package complete. Check electron/dist/ for output."
