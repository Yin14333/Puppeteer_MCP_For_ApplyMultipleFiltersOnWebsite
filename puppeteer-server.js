#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import puppeteer from "puppeteer";

// Global browser and page instances
let browser = null;
let page = null;

// Create MCP server
const server = new Server(
  {
    name: "puppeteer-automation",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List all available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "puppeteer_launch",
        description: "Launch a new browser instance. Must be called before any other operations.",
        inputSchema: {
          type: "object",
          properties: {
            headless: {
              type: "boolean",
              description: "Run in headless mode (true) or with visible browser (false)",
              default: false
            },
            url: {
              type: "string",
              description: "Optional initial URL to navigate to after launch"
            }
          }
        }
      },
      {
        name: "puppeteer_navigate",
        description: "Navigate to a specific URL",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "URL to navigate to"
            },
            waitUntil: {
              type: "string",
              description: "When to consider navigation succeeded: load, domcontentloaded, networkidle0, networkidle2",
              default: "networkidle2"
            }
          },
          required: ["url"]
        }
      },
      {
        name: "puppeteer_click",
        description: "Click an element on the page. Automatically waits for element to be visible and clickable.",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "CSS selector for the element to click (e.g., 'button.submit', '#login-btn')"
            },
            timeout: {
              type: "number",
              description: "Maximum time to wait for element in milliseconds",
              default: 30000
            }
          },
          required: ["selector"]
        }
      },
      {
        name: "puppeteer_type",
        description: "Type text into an input field",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "CSS selector for the input field"
            },
            text: {
              type: "string",
              description: "Text to type"
            },
            delay: {
              type: "number",
              description: "Delay between keystrokes in milliseconds (to simulate human typing)",
              default: 50
            }
          },
          required: ["selector", "text"]
        }
      },
      {
        name: "puppeteer_wait_for_selector",
        description: "Wait for an element to appear on the page",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "CSS selector to wait for"
            },
            visible: {
              type: "boolean",
              description: "Wait for element to be visible (not just in DOM)",
              default: true
            },
            timeout: {
              type: "number",
              description: "Maximum time to wait in milliseconds",
              default: 30000
            }
          },
          required: ["selector"]
        }
      },
      {
        name: "puppeteer_wait_for_response",
        description: "Wait for a network response matching a URL pattern. Useful for waiting for API calls.",
        inputSchema: {
          type: "object",
          properties: {
            urlPattern: {
              type: "string",
              description: "URL pattern to match (can be partial, e.g., '/api/events')"
            },
            timeout: {
              type: "number",
              description: "Maximum time to wait in milliseconds",
              default: 30000
            }
          },
          required: ["urlPattern"]
        }
      },
      {
        name: "puppeteer_evaluate",
        description: "Execute JavaScript code in the browser context and return the result",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "JavaScript code to execute. Can return values that will be serialized."
            }
          },
          required: ["code"]
        }
      },
      {
        name: "puppeteer_get_content",
        description: "Get the current page content as text",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "Optional CSS selector to get content from specific element. If not provided, gets entire body text."
            }
          }
        }
      },
      {
        name: "puppeteer_screenshot",
        description: "Take a screenshot of the current page",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "File path where screenshot will be saved (e.g., '/Users/username/Desktop/screenshot.png')"
            },
            fullPage: {
              type: "boolean",
              description: "Capture the full scrollable page",
              default: false
            }
          },
          required: ["path"]
        }
      },
      {
        name: "puppeteer_wait_for_timeout",
        description: "Wait for a specified amount of time. Use sparingly - prefer waiting for specific conditions.",
        inputSchema: {
          type: "object",
          properties: {
            timeout: {
              type: "number",
              description: "Time to wait in milliseconds"
            }
          },
          required: ["timeout"]
        }
      },
      {
        name: "puppeteer_close",
        description: "Close the browser and clean up resources",
        inputSchema: {
          type: "object",
          properties: {}
        }
      }
    ]
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "puppeteer_launch": {
        // Close existing browser if any
        if (browser) {
          await browser.close();
          browser = null;
          page = null;
        }

        // Launch new browser
        browser = await puppeteer.launch({
          headless: args.headless ?? false,
          defaultViewport: { width: 1920, height: 1080 },
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'
          ]
        });

        // Create new page
        page = await browser.newPage();

        // Set user agent to look more human
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Navigate to URL if provided
        if (args.url) {
          await page.goto(args.url, { waitUntil: 'networkidle2' });
        }

        return {
          content: [
            {
              type: "text",
              text: `✅ Browser launched successfully${args.url ? ` and navigated to ${args.url}` : ''}\nBrowser is ${args.headless ? 'headless (invisible)' : 'visible'}`
            }
          ]
        };
      }

      case "puppeteer_navigate": {
        if (!page) {
          throw new Error("Browser not launched. Call puppeteer_launch first.");
        }

        await page.goto(args.url, {
          waitUntil: args.waitUntil || 'networkidle2',
          timeout: 60000
        });

        const title = await page.title();

        return {
          content: [
            {
              type: "text",
              text: `✅ Navigated to ${args.url}\nPage title: ${title}`
            }
          ]
        };
      }

      case "puppeteer_click": {
        if (!page) {
          throw new Error("Browser not launched. Call puppeteer_launch first.");
        }

        // Wait for element to be visible and clickable
        await page.waitForSelector(args.selector, {
          visible: true,
          timeout: args.timeout || 30000
        });

        // Click the element
        await page.click(args.selector);

        return {
          content: [
            {
              type: "text",
              text: `✅ Clicked element: ${args.selector}`
            }
          ]
        };
      }

      case "puppeteer_type": {
        if (!page) {
          throw new Error("Browser not launched. Call puppeteer_launch first.");
        }

        // Wait for input field
        await page.waitForSelector(args.selector);

        // Clear existing text
        await page.click(args.selector, { clickCount: 3 });

        // Type new text
        await page.type(args.selector, args.text, {
          delay: args.delay || 50
        });

        return {
          content: [
            {
              type: "text",
              text: `✅ Typed "${args.text}" into ${args.selector}`
            }
          ]
        };
      }

      case "puppeteer_wait_for_selector": {
        if (!page) {
          throw new Error("Browser not launched. Call puppeteer_launch first.");
        }

        await page.waitForSelector(args.selector, {
          visible: args.visible !== false,
          timeout: args.timeout || 30000
        });

        return {
          content: [
            {
              type: "text",
              text: `✅ Element appeared: ${args.selector}`
            }
          ]
        };
      }

      case "puppeteer_wait_for_response": {
        if (!page) {
          throw new Error("Browser not launched. Call puppeteer_launch first.");
        }

        const response = await page.waitForResponse(
          (response) => response.url().includes(args.urlPattern),
          { timeout: args.timeout || 30000 }
        );

        const status = response.status();
        const url = response.url();

        return {
          content: [
            {
              type: "text",
              text: `✅ Received response: ${status} from ${url}`
            }
          ]
        };
      }

      case "puppeteer_evaluate": {
        if (!page) {
          throw new Error("Browser not launched. Call puppeteer_launch first.");
        }

        const result = await page.evaluate((code) => {
          try {
            // eslint-disable-next-line no-eval
            return eval(code);
          } catch (error) {
            return { error: error.message };
          }
        }, args.code);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case "puppeteer_get_content": {
        if (!page) {
          throw new Error("Browser not launched. Call puppeteer_launch first.");
        }

        let content;
        if (args.selector) {
          content = await page.$eval(args.selector, el => el.innerText);
        } else {
          content = await page.evaluate(() => document.body.innerText);
        }

        return {
          content: [
            {
              type: "text",
              text: content
            }
          ]
        };
      }

      case "puppeteer_screenshot": {
        if (!page) {
          throw new Error("Browser not launched. Call puppeteer_launch first.");
        }

        await page.screenshot({
          path: args.path,
          fullPage: args.fullPage || false
        });

        return {
          content: [
            {
              type: "text",
              text: `✅ Screenshot saved to: ${args.path}`
            }
          ]
        };
      }

      case "puppeteer_wait_for_timeout": {
        if (!page) {
          throw new Error("Browser not launched. Call puppeteer_launch first.");
        }

        await page.waitForTimeout(args.timeout);

        return {
          content: [
            {
              type: "text",
              text: `✅ Waited ${args.timeout}ms`
            }
          ]
        };
      }

      case "puppeteer_close": {
        if (browser) {
          await browser.close();
          browser = null;
          page = null;
        }

        return {
          content: [
            {
              type: "text",
              text: "✅ Browser closed"
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

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