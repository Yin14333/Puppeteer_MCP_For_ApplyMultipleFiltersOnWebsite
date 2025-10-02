# Puppeteer_MCP_For_ApplyMultipleFiltersOnWebsite
Puppeteer MCP to filter and scrape events from React-based websites (Work In Progress)
# Complete Guide: MCP Puppeteer Server for macOS

## 🎯 What You'll Build

A custom tool that lets Claude control a real Chrome browser using Puppeteer to automate complex websites like KCLS.

**Before:** Claude struggles with React sites, timing issues, can't verify actions  
**After:** Claude uses Puppeteer for reliable, intelligent browser automation

---

## 📋 Prerequisites

### Check Your System

Open **Terminal** (Cmd + Space, type "Terminal"):

```bash
# Check if Node.js is installed
node --version
# Should show: v18.0.0 or higher

# Check if npm is installed  
npm --version
# Should show: 9.0.0 or higher

# Check your macOS version
sw_vers
# Should show: macOS 13 (Ventura) or higher
```

### If Node.js is NOT Installed:

**Option 1: Using Homebrew (Recommended)**
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Verify installation
node --version
npm --version
```

**Option 2: Download from nodejs.org**
1. Go to https://nodejs.org
2. Download the macOS installer (LTS version)
3. Run the installer
4. Restart Terminal

---

## 📁 Step 1: Create Project Directory

```bash
# Create a directory for your MCP server
mkdir -p ~/mcp-servers/puppeteer-server
cd ~/mcp-servers/puppeteer-server

# Verify you're in the right place
pwd
# Should show: /Users/YourUsername/mcp-servers/puppeteer-server
```

---

## 📦 Step 2: Initialize Node.js Project

```bash
# Create package.json
npm init -y

# This creates a basic package.json file
# You should see: "Wrote to /Users/YourUsername/mcp-servers/puppeteer-server/package.json"
```

---

## 🔧 Step 3: Install Dependencies

```bash
# Install Puppeteer (browser automation)
npm install puppeteer

# Install MCP SDK (to communicate with Claude)
npm install @modelcontextprotocol/sdk

# This will take 2-3 minutes (Puppeteer downloads Chromium)
# You'll see progress bars and "added X packages"
```

**Verify installation:**
```bash
ls node_modules/
# You should see folders including: puppeteer, @modelcontextprotocol
```

---

## 📝 Step 4: Create the MCP Server Code

Create the main server file:

```bash
# Create the server file
touch puppeteer-server.js

# Open it in your default text editor
open -a TextEdit puppeteer-server.js
```

**Or use VS Code if you have it:**
```bash
code puppeteer-server.js
```
// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Puppeteer MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
```

**Save the file** (Cmd + S if in TextEdit, or just close and confirm save)

---

## ⚙️ Step 5: Update package.json

Edit your `package.json` file:

```bash
open -a TextEdit package.json
```
**Replace the entire contents with:**

```json
{
  "name": "puppeteer-mcp-server",
  "version": "1.0.0",
  "description": "MCP server that provides Puppeteer browser automation tools",
  "type": "module",
  "main": "puppeteer-server.js",
  "bin": {
    "puppeteer-mcp-server": "./puppeteer-server.js"
  },
  "scripts": {
    "start": "node puppeteer-server.js"
  },
  "keywords": ["mcp", "puppeteer", "browser-automation"],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "puppeteer": "^22.0.0"
  }
}
```

**Save and close**

---

## 🧪 Step 6: Test Your MCP Server

Before connecting to Claude, let's make sure it works:

```bash
# Make the script executable
chmod +x puppeteer-server.js

# Test run the server
node puppeteer-server.js
```

**Expected output:**
```
Puppeteer MCP Server running on stdio
```

**Good sign!** If you see this, the server is working.

Press **Ctrl + C** to stop it.

---

## 🔗 Step 7: Connect to Claude Desktop

### Find Claude's Config File

```bash
# Navigate to Claude config directory
cd ~/Library/Application\ Support/Claude

# Check if config file exists
ls -la
# Look for: claude_desktop_config.json
```

### Create or Edit Config File

```bash
# If file doesn't exist, create it:
touch claude_desktop_config.json

# Open in TextEdit
open -a TextEdit claude_desktop_config.json
```

### Add Your MCP Server Configuration

**If the file is empty, paste this:**

```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "node",
      "args": [
        "/Users/YOUR_USERNAME/mcp-servers/puppeteer-server/puppeteer-server.js"
      ]
    }
  }
}
```

**⚠️ IMPORTANT:** Replace `YOUR_USERNAME` with your actual macOS username!

**To find your username:**
```bash
whoami
```

**Example - if your username is "john", the path would be:**
```json
"/Users/john/mcp-servers/puppeteer-server/puppeteer-server.js"
```

**If the file already has other MCP servers, add puppeteer to the list:**

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/files"]
    },
    "puppeteer": {
      "command": "node",
      "args": [
        "/Users/YOUR_USERNAME/mcp-servers/puppeteer-server/puppeteer-server.js"
      ]
    }
  }
}
```

**Save the file** (Cmd + S)

---

## 🔄 Step 8: Restart Claude Desktop

1. **Quit Claude Desktop completely:**
   - Click "Claude" in menu bar → "Quit Claude"
   - OR press Cmd + Q

2. **Relaunch Claude Desktop:**
   - Open from Applications folder
   - OR press Cmd + Space, type "Claude", press Enter

3. **Wait for Claude to fully load** (you'll see the chat interface)

---

## ✅ Step 9: Verify It Works

### Test 1: Check if Tools Are Available

In Claude Desktop, type:

```
What Puppeteer tools do you have available?
```

**Expected response:**
Claude should list all the tools:
- puppeteer_launch
- puppeteer_navigate
- puppeteer_click
- puppeteer_type
- puppeteer_wait_for_selector
- puppeteer_wait_for_response
- puppeteer_evaluate
- puppeteer_get_content
- puppeteer_screenshot
- puppeteer_wait_for_timeout
- puppeteer_close

### Test 2: Simple Automation

```
Use Puppeteer to:
1. Launch a visible browser
2. Navigate to https://example.com
3. Get the page title
4. Take a screenshot and save it to ~/Desktop/test.png
5. Close the browser
```

**What should happen:**
1. A Chrome browser window opens
2. It navigates to example.com
3. Claude reports the page title
4. A screenshot appears on your Desktop
5. The browser closes

---

## 🎉 Step 10: Use It for KCLS Automation

Now for the real test! Ask Claude:

```
Use Puppeteer to filter events from the KCLS library events website:

1. Launch browser (visible so I can see what's happening)
2. Navigate to https://kcls.bibliocommons.com/v2/events
3. Click the "Filter" button
4. Wait for the filter overlay to appear
5. Select these locations by clicking their checkboxes:
   - Kenmore
   - Kingsgate
   - Kirkland
   - Lake Forest Park
   - Shoreline
6. Select audience: "Kids (Ages 6 to 8)"
7. Click "Done" to apply filters
8. Wait for the API response
9. Extract all Saturday and Sunday events
10. Format the results as a table
11. Take a screenshot
12. Close the browser

Be careful to wait for elements and network responses at each step.
```

**Claude will:**
- Execute each step methodically
- Wait for elements to load
- Wait for network responses
- Handle timing automatically
- Extract and format the weekend events
- Show you the results

---

## 🐛 Troubleshooting

### Issue: "Browser not launched"

**Solution:**
```bash
# Check if Puppeteer installed Chromium correctly
ls ~/mcp-servers/puppeteer-server/node_modules/puppeteer/.local-chromium/

# If empty, reinstall:
cd ~/mcp-servers/puppeteer-server
rm -rf node_modules
npm install
```

### Issue: "Command not found: node"

**Solution:**
```bash
# Find where node is installed
which node
# Example output: /usr/local/bin/node or /opt/homebrew/bin/node

# Update claude_desktop_config.json to use full path:
{
  "mcpServers": {
    "puppeteer": {
      "command": "/usr/local/bin/node",
      "args": ["/Users/YOUR_USERNAME/mcp-servers/puppeteer-server/puppeteer-server.js"]
    }
  }
}
```

### Issue: Claude doesn't see the tools

**Solution:**
```bash
# Check config file syntax
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python3 -m json.tool

# If you see errors, your JSON is malformed
# Use an online JSON validator: https://jsonlint.com
```

### Issue: "Permission denied"

**Solution:**
```bash
# Make script executable
chmod +x ~/mcp-servers/puppeteer-server/puppeteer-server.js

# Check permissions
ls -la ~/mcp-servers/puppeteer-server/puppeteer-server.js
# Should show: -rwxr-xr-x (the x means executable)
```

### Issue: Browser opens but crashes

**Solution:**
```bash
# Give Terminal/Claude full disk access:
# 1. Open System Settings
# 2. Privacy & Security
# 3. Full Disk Access
# 4. Add Claude.app
# 5. Restart Claude
```

### View Logs

```bash
# Claude Desktop logs location
tail -f ~/Library/Logs/Claude/mcp*.log

# This shows real-time MCP server output
# Keep this open while testing
```

---

## 📚 Usage Examples

### Example 1: Simple Web Scraping

```
Use Puppeteer to:
1. Go to https://news.ycombinator.com
2. Extract the titles of the top 10 posts
3. Format as a numbered list
```

### Example 2: Form Automation

```
Use Puppeteer to:
1. Go to https://www.google.com
2. Type "puppeteer tutorial" in the search box
3. Click the search button
4. Wait for results to load
5. Get the titles of the first 5 results
```

### Example 3: Screenshot Comparison

```
Use Puppeteer to:
1. Go to https://example.com
2. Take a screenshot of the full page
3. Navigate to https://example.org
4. Take another screenshot
Save both to my Desktop
```

### Example 4: Dynamic Content

```
Use Puppeteer to automate a website with React:
1. Launch browser
2. Go to the site
3. Click a button that loads content via API
4. Wait for the API response
5. Extract the new content
6. Close browser
```

---

## 🎓 Advanced Tips

### Tip 1: Headless Mode

```
Launch browser in headless mode (invisible) for faster automation
```

### Tip 2: Custom Wait Times

```
Wait for the loading spinner to disappear before proceeding
```

### Tip 3: Multiple Pages

```
Extract all events by navigating through pagination:
1. Get total pages
2. For each page, extract events
3. Compile into single list
```

### Tip 4: Error Handling

```
If any step fails, take a screenshot for debugging before closing
```

---

## 📖 Next Steps

### 1. Create More Tools

Add custom tools to your MCP server:
- Form submission tool
- Login automation tool
- Data extraction tool
- PDF download tool

### 2. Share Your Server

```bash
# Create a GitHub repo
cd ~/mcp-servers/puppeteer-server
git init
git add .
git commit -m "Initial commit"
# Push to GitHub and share with others!
```

### 3. Improve Error Handling

Add retry logic, better error messages, and recovery mechanisms.

### 4. Add Logging

Track what Claude is doing:
```javascript
import fs from 'fs';

function log(message) {
  fs.appendFileSync('/tmp/puppeteer-mcp.log', `${new Date().toISOString()} - ${message}\n`);
}
```

---

## 🎯 Summary

You now have:
- ✅ A working MCP server with Puppeteer
- ✅ Claude can control a real Chrome browser
- ✅ Reliable automation for React-heavy sites
- ✅ Tools for complex web interactions
- ✅ A foundation for future automation projects

**Your KCLS automation is now possible!** Claude can:
- Apply filters reliably
- Wait for network requests
- Extract weekend events
- Handle timing automatically

**Next:** Try automating other complex websites and see how powerful this combination is!

---

## 📞 Getting Help

**If you get stuck:**

1. Check the troubleshooting section above
2. View logs: `tail -f ~/Library/Logs/Claude/mcp*.log`
3. Test the server directly: `node puppeteer-server.js`
4. Verify Node.js works: `node --version`
5. Check Claude config: `cat ~/Library/Application\ Support/Claude/claude_desktop_config.json`

**Common Issues Quick Reference:**
- Can't find config file → Create it at `~/Library/Application Support/Claude/claude_desktop_config.json`
- Tools not showing → Restart Claude Desktop completely
- Browser won't launch → Reinstall puppeteer: `npm install puppeteer`
- Permission errors → Run `chmod +x puppeteer-server.js`

Good luck! 🚀
