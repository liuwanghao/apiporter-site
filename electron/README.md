# New API Electron Desktop App

This directory contains the Electron wrapper for New API, providing a native desktop application with system tray support for Windows, macOS, and Linux. It lives with the frontend because the desktop package bundles the `apiporter-site` dashboard and starts the API from the sibling `apiporter-backend` repository.

## Prerequisites

### 1. Go Binary (Required)

The Electron app requires the compiled Go binary to function. You have two options:

**Option A: Use existing binary (without Go installed)**

```bash
# If you have a pre-built binary (e.g., new-api-macos)
cp ../new-api-macos ../new-api
```

**Option B: Build from source (requires Go)**
TODO

### 2. Electron Dependencies

```bash
cd electron
npm install
```

## Development

Start the backend, the standalone frontend, and Electron in separate terminals:

```bash
# apiporter-backend repository
go run main.go

# apiporter-site repository
bun run dev

# electron/
npm run dev-app
```

This will:

- Use the Go backend on port 3000
- Use the Rsbuild frontend development server on port 5180
- Open an Electron window with DevTools enabled
- Create a system tray icon (menu bar on macOS)
- Store database in `../data/new-api.db`

## Building for Production

### Quick Build

```bash
# From apiporter-site/electron/, build the frontend, sibling Go backend, and desktop package.
# Set BACKEND_DIR if apiporter-backend is not next to apiporter-site.
./build.sh

# Or package an existing binary for the current platform
npm run build

# Platform-specific builds
npm run build:mac    # Creates .dmg and .zip
npm run build:win    # Creates .exe installer
npm run build:linux  # Creates .AppImage and .deb
```

### Build Output

- Built applications are in `electron/dist/`
- macOS: `.dmg` (installer) and `.zip` (portable)
- Windows: `.exe` (installer) and portable exe
- Linux: `.AppImage` and `.deb`

## Configuration

### Port

Default port is 3000. To change, edit `main.js`:

```javascript
const PORT = 3000 // Change to desired port
```

### Database Location

- **Development**: `../data/new-api.db` (project directory)
- **Production**:
  - macOS: `~/Library/Application Support/New API/data/`
  - Windows: `%APPDATA%/New API/data/`
  - Linux: `~/.config/New API/data/`
