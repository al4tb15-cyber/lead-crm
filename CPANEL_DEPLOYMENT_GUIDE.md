# Business HUB Australia - cPanel Deployment & Installation Guide

This guide provides step-by-step instructions to install, build, and run the **Business HUB Australia** platform on any cPanel hosting environment supporting Node.js.

---

## Architecture Overview

Business HUB Australia is a full-stack web application:
- **Frontend**: React 19 + Vite + Tailwind CSS + Lucide Icons (compiled to `dist/`)
- **Backend API**: Express + Node.js (bundled with `esbuild` to CommonJS `dist/server.cjs`)
- **cPanel Startup Entry**: `app.js` (delegates to `dist/server.cjs` under Phusion Passenger or PM2)

Because the platform includes full REST APIs (CRM pipelines, compliance scrubbers, legal signature generators, and AI agents), **a Node.js runtime is required on cPanel**.

---

## Server Requirements

| Requirement | Minimum | Recommended |
|---|---|---|
| **Node.js Version** | `v18.18.0+` | `v20.x LTS` or `v22.x LTS` |
| **cPanel Feature** | *Setup Node.js App* (CloudLinux Passenger) OR *SSH Terminal* | Both available |
| **RAM** | 1 GB | 2 GB+ (for Vite compilation) |
| **Disk Space** | 500 MB free | 1 GB free |

---

## Included Deployment Files

The following files are pre-configured in this repository for cPanel:

1. **`app.js`**: The production startup file designed specifically for cPanel's Phusion Passenger application manager.
2. **`cpanel-install.sh`**: An automated, 1-command shell script that checks Node.js, installs dependencies, builds the client, bundles the backend, and validates files.
3. **`.htaccess.example`**: Reverse proxy rewrite rules for Apache/LiteSpeed when running Node.js behind a port proxy.

---

## Method 1: Using cPanel GUI "Setup Node.js App" (Recommended)

This is the standard and easiest method available on shared and managed cPanel hosting with CloudLinux.

### Step 1: Export and Upload the Project Files

1. Export or download the project ZIP from the AI Studio **Export / GitHub** menu.
2. Log in to your **cPanel** account.
3. Open **File Manager** (`public_html` or root directory).
4. Create a dedicated folder for your application outside or inside `public_html` (e.g. `/home/username/businesshub`).
   > **Note**: If deploying to a primary domain, you can also place it in `/home/username/businesshub` and map the domain in Step 2.
5. Upload the ZIP file and click **Extract**.

---

### Step 2: Create the Node.js Application in cPanel

1. In cPanel, navigate to the **Software** section and click **Setup Node.js App**.
2. Click the blue **Create Application** button.
3. Fill in the application settings:
   - **Node.js version**: Choose `20.x` (or `18.x` if 20 is not listed).
   - **Application mode**: Select **Production**.
   - **Application root**: Enter the folder path (e.g. `businesshub`).
   - **Application URL**: Select your domain or subdomain (e.g. `portal.yourdomain.com` or `yourdomain.com`).
   - **Application startup file**: Enter `app.js`.
4. Under **Environment variables**, click **Add Variable** to set:
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
   - `GEMINI_API_KEY` = *(Your Gemini API key if utilizing AI features, optional)*
5. Click **Create** at the top right.

---

### Step 3: Run the Automated Build

At the top of the **Setup Node.js App** page, cPanel will display a command to activate your virtual environment:
```bash
# Example provided by cPanel:
source /home/YOUR_USERNAME/nodevenv/businesshub/20/bin/activate && cd /home/YOUR_USERNAME/businesshub
```

1. Open **cPanel Terminal** (under the *Advanced* section in cPanel) or connect via SSH.
2. Paste the `source ...` activation command from cPanel and press Enter.
3. Run the automated installer script:
   ```bash
   chmod +x cpanel-install.sh
   ./cpanel-install.sh
   ```
   *Alternatively, if you prefer manual commands:*
   ```bash
   npm install
   npm run build
   ```
4. Verify that the `dist/` directory was generated containing:
   - `dist/index.html` (Compiled React UI)
   - `dist/server.cjs` (Bundled Express API)

---

### Step 4: Restart the Application

1. Return to cPanel **Setup Node.js App**.
2. Click the **Restart** button on your application.
3. Open your domain in the browser (e.g. `https://yourdomain.com`).
4. You should see the Business HUB dashboard loading live!

---

## Method 2: Terminal / SSH + PM2 (For VPS or Dedicated Hosting)

If you have SSH access and your host does not use CloudLinux Phusion Passenger, you can run the app using **PM2** process manager and Apache reverse proxy.

### Step 1: Connect via SSH
```bash
ssh username@your-server-ip -p 22
cd /home/username/businesshub
```

### Step 2: Run the Installer
```bash
chmod +x cpanel-install.sh
./cpanel-install.sh
```

### Step 3: Start with PM2
```bash
# Install PM2 globally if not already installed
npm install -g pm2

# Start the application
pm2 start app.js --name "business-hub"

# Set PM2 to restart on server reboot
pm2 save
pm2 startup
```

### Step 4: Setup Apache / LiteSpeed Reverse Proxy
If your domain's document root points to `public_html`, place the `.htaccess.example` file as `.htaccess` in your domain's document root:

```bash
cp .htaccess.example /home/username/public_html/.htaccess
```

This proxies all incoming requests on ports 80/443 directly to `http://127.0.0.1:3000/`.

---

## Method 3: Build Locally & Upload `dist/` (Low-Memory Shared Hosting)

If your shared hosting has strict memory limits (e.g. less than 1GB RAM) causing `npm run build` to run out of memory:

1. Clone or extract the project on your local computer.
2. In your local terminal, run:
   ```bash
   npm install
   npm run build
   ```
3. Upload the entire project **including** the newly generated `dist/` folder and `node_modules` (or install production dependencies only on server with `npm install --omit=dev`).
4. Set **Application startup file** to `app.js` in cPanel.
5. Click **Restart**.

---

## Configuration & Environment Variables

The server dynamically reads the `PORT` environment variable (`process.env.PORT`) and defaults to `3000` only if unspecified. You can change this to any port your hosting environment requires (e.g., `3001`, `8080`, `4000`, or whatever port cPanel/PM2 allocates).

> **Important Note for cPanel Phusion Passenger ("Setup Node.js App")**:
> When using cPanel's built-in **Setup Node.js App** (Passenger), Passenger manages the internal socket/port routing automatically through Apache/LiteSpeed. You do not even need to worry about port conflicts because Passenger routes traffic internally through a UNIX domain socket or dynamic port directly to `app.js`.
> If running manually with **PM2** or direct `node`, set `PORT` in `.env` to any available port, and match that port in your `.htaccess` reverse proxy rules.

Edit or create the `.env` file in the application root directory:

```env
# Application Runtime Mode
NODE_ENV=production

# Server Listen Port (Change to any available port: 3001, 8080, 5000, etc.)
PORT=3000

# Google Gemini API Key (Optional, for autonomous AI lead qualification)
GEMINI_API_KEY=your_gemini_api_key_here

# Public URL of your installation
APP_URL=https://portal.yourdomain.com
```

---

## Troubleshooting & FAQ

### 1. Blank White Page on Subdomain / Subfolder (Most Common Issue)
If you extracted the files into a subfolder or subdomain and see a blank white page:

- **Check A: Nested Unzip Folder vs. "Application root"**
  - When cPanel File Manager extracts a ZIP, it often creates an extra nested folder (e.g., `/home/username/portal.businesshub.app/app-name/` instead of `/home/username/portal.businesshub.app/`).
  - Look inside your folder in File Manager. Do you see `package.json` and `app.js` directly there, or inside another folder?
  - In cPanel **Setup Node.js App**, the **Application root** field MUST match the exact folder containing `app.js` and `package.json`. If they are nested, either move the files up one level or change **Application root** to point to the nested folder.

- **Check B: Test the Diagnostic Route**
  - Open: `https://portal.businesshub.app/api/diagnostics` (or `/api/health`) in your browser.
  - If you get JSON back with `"status": "operational"`, the Express backend is running.
  - Look at the `locatedDistPath` field in that JSON. If it says `"distExists": true`, your frontend build is active.

- **Check C: Browser Console for Asset 404s**
  - Press `F12` on the blank page and open the **Console** tab.
  - If you see `404 Not Found` for `/assets/index-xxx.js`, update `vite.config.ts` with `base: './'` (already configured in the latest update), run `npm run build`, and click **Restart** in cPanel.

### 2. "503 Service Unavailable" or "Application failed to start"
- **Cause**: The application startup file was executed before running `npm run build`, meaning `dist/server.cjs` does not exist yet.
- **Fix**: Open cPanel Terminal, activate the Node virtual environment, and run `npm run build`. Then click **Restart** in cPanel.

### 3. Check Application Error Logs
- In cPanel File Manager, check for the log file generated in your app root:
  - `stderr.log`
  - `stdout.log`
- Or via terminal:
  ```bash
  cat stderr.log
  ```

### 4. Node.js Version Error
- **Error**: `SyntaxError: Unexpected token ...` or Vite build failure.
- **Fix**: Verify your active Node version by running `node -v`. Ensure you selected **Node 20.x** in cPanel "Setup Node.js App". Node 14 or 16 is too old for modern React 19 / Vite 6.

### 5. Memory / Timeout During `npm install`
- Run `npm install --no-audit --prefer-offline` to conserve server resources.

---

## Summary of Commands Quick Reference

```bash
# 1. Activate environment (copy the exact line shown in your cPanel UI)
source ~/nodevenv/businesshub/20/bin/activate && cd ~/businesshub

# 2. Run automated installer
chmod +x cpanel-install.sh
./cpanel-install.sh

# 3. Test running manually (Ctrl+C to stop)
node app.js
```
