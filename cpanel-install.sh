#!/bin/bash
# ==============================================================================
# Business HUB Australia - Automated cPanel Installation & Build Script
# ==============================================================================
# Usage:
#   chmod +x cpanel-install.sh
#   ./cpanel-install.sh
# ==============================================================================

set -e

echo "===================================================================="
echo "    BUSINESS HUB AUSTRALIA - cPanel Installation & Deployment Engine"
echo "===================================================================="
echo ""
CURRENT_DIR=$(pwd)
echo "[+] Current Working Directory: ${CURRENT_DIR}"
echo ""

# Check if package.json and app.js exist in this directory
if [ ! -f "package.json" ]; then
  echo "[-] CRITICAL ERROR: package.json not found in $(pwd)!"
  echo "    You are running this script in the wrong folder."
  echo "    Please cd into the exact folder where package.json and app.js were extracted."
  exit 1
fi

# 1. Environment & Node.js Verification
echo "[Step 1/5] Verifying Node.js and NPM runtime environment..."

if ! command -v node >/dev/null 2>&1; then
  echo "[-] ERROR: Node.js is not found in PATH."
  echo "    If using cPanel CloudLinux 'Setup Node.js App', ensure you activated"
  echo "    the virtual environment command provided at the top of your cPanel page:"
  echo "    e.g.: source /home/YOUR_USER/nodevenv/YOUR_APP_ROOT/20/bin/activate"
  exit 1
fi

NODE_VERSION=$(node -v)
echo "[+] Detected Node.js version: ${NODE_VERSION}"

# Check Node version >= 18
MAJOR_VERSION=$(node -e "console.log(process.versions.node.split('.')[0])")
if [ "$MAJOR_VERSION" -lt 18 ]; then
  echo "[-] WARNING: Node.js version is ${NODE_VERSION}. Version 18.x or 20.x+ is required."
  echo "    Please switch the Node.js version to 20.x in cPanel -> 'Setup Node.js App'."
fi

# 2. Environment Variables (.env) Setup
echo ""
echo "[Step 2/5] Checking environment configuration (.env)..."
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    echo "[*] Creating .env from .env.example template..."
    cp .env.example .env
    echo "[+] Created default .env file. Please edit .env to insert your GEMINI_API_KEY if desired."
  else
    echo "[*] Creating default .env..."
    cat <<EOT > .env
NODE_ENV=production
GEMINI_API_KEY=
PORT=3000
APP_URL=
EOT
    echo "[+] Created .env file."
  fi
else
  echo "[+] Found existing .env configuration file."
fi

# 3. Installing Dependencies
echo ""
echo "[Step 3/5] Installing package dependencies (Client & Backend)..."
echo "    Running npm install (with dev dependencies for Vite & esbuild)..."
npm install --no-audit --prefer-offline || npm install --no-audit

# 4. Building Production Assets & Bundling Server
echo ""
echo "[Step 4/5] Compiling React Vite frontend & bundling Express backend..."
echo "    Executing: npm run build"
npm run build

# 5. Verifying Deployment Artifacts
echo ""
echo "[Step 5/5] Verifying compiled build outputs..."
if [ -f "dist/server.cjs" ] && [ -f "dist/index.html" ]; then
  echo "[+] SUCCESS: Production bundle compiled successfully!"
  echo "    - Frontend Entrypoint: dist/index.html"
  echo "    - Backend Server Bundle: dist/server.cjs"
  echo "    - cPanel Passenger Entry: app.js"
else
  echo "[-] ERROR: Build outputs were not found in ./dist/."
  echo "    Please review build logs above for compilation errors."
  exit 1
fi

echo ""
echo "===================================================================="
echo "                   INSTALLATION COMPLETED SUCCESSFULLY!             "
echo "===================================================================="
echo ""
echo "NEXT STEPS TO LAUNCH ON cPANEL:"
echo ""
echo "Option A (cPanel 'Setup Node.js App' GUI - Recommended):"
echo "  1. In cPanel, navigate to 'Setup Node.js App'."
echo "  2. Ensure 'Application root' is the folder containing app.js and dist/."
echo "     (Current absolute folder: ${CURRENT_DIR})"
echo "  3. Set 'Application startup file' to: app.js"
echo "  4. Set 'Application mode' to: Production"
echo "  5. Click 'Restart' (or Stop and Start) to launch."
echo "  6. Verify server health: curl -I http://127.0.0.1:3000/api/health"
echo ""
echo "Option B (PM2 Process Manager via SSH):"
echo "  pm2 start app.js --name \"business-hub\""
echo "  pm2 save"
echo ""
echo "Option C (Direct test in terminal):"
echo "  node app.js"
echo "===================================================================="
