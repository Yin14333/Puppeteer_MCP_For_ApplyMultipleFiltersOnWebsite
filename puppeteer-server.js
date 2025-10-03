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
              default: "domcontentloaded"
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
              default: 15000
            }
          },
          required: ["selector"]
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
              default: 15000
            }
          },
          required: ["selector"]
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
        name: "puppeteer_inspect_elements",
        description: "Inspect interactive elements. Identifies date pickers, checkboxes, dropdowns, and buttons for filters like Date, Location, Audience, Event Type.",
        inputSchema: {
        type: "object",
        properties: {
            searchTerm: {
              type: "string",
              description: "Text to search for (e.g., 'Date', 'Location', 'Audience', 'Event Type'). Leave empty to get all interactive elements."
            },
            elementTypes: {
              type: "array",
              items: { type: "string" },
              description: "Element types to search",
              default: ["button", "input", "select", "a", "label", "div[role='checkbox']", "div[role='button']", "div[class*='picker']", "div[class*='calendar']"]
            },
            limit: {
              type: "number",
              description: "Max elements to return",
              default: 30
            }
          }
        }
      },

      {
        name: "puppeteer_get_content",
        description: "Get text content from the page or a specific element",
        inputSchema: {
          type: "object",
          properties: {
            selector: { 
              type: "string",
              description: "Optional CSS selector for specific element"
            },
            limit: { 
              type: "number", 
              description: "Max characters to return",
              default: 2000 
            }
          }
        }
      },

      {
        name: "puppeteer_get_events",
        description: "Extract event titles and times from filtered results",
        inputSchema: {
          type: "object",
          properties: {
            containerSelector: {
              type: "string",
              description: "CSS selector for event container",
              default: "[class*='event'], [class*='card'], [data-testid*='event']"
            },
            limit: {
              type: "number",
              description: "Max events to return",
              default: 10
            }
          }
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
              '--disable-blink-features=AutomationControlled',
              '--disable-images', 
              '--disable-css', 
              '--disable-plugins',
              '--disable-extensions',
              '--disable-dev-shm-usage',
              '--no-first-run',
              '--no-zygote'
            ]
          });

          // Create new page
          page = await browser.newPage();

          // Set user agent
          await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

          // Block unnecessary resources
          await page.setRequestInterception(true);
          page.on('request', (req) => {
            if(['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())){
              req.abort();
            } else {
              req.continue();
            }
          });

          // Navigate to URL if provided
          if (args.url) {
            await page.goto(args.url, { 
              waitUntil: 'domcontentloaded',
              timeout: 60000 
            });
          }

          return {
            content: [{
              type: "text",
              text: `✅ Launched${args.url ? ` at ${args.url}` : ''}`
            }]
          };
        }

      case "puppeteer_navigate": {
        if (!page) {
          throw new Error("Browser not launched. Call puppeteer_launch first.");
        }

        await page.goto(args.url, {
          waitUntil: args.waitUntil || 'domcontentloaded',
          timeout: 60000
        });

        return {
          content: [{ type: "text", text: `✅ Navigated` }]
        };
      }

      case "puppeteer_click": {
        if (!page) {
          throw new Error("Browser not launched. Call puppeteer_launch first.");
        }

        // Wait for element to be visible and clickable
        await page.waitForSelector(args.selector, {
          visible: true,
          timeout: args.timeout || 15000
        });

        // Click the element
        await page.click(args.selector, { delay: 0 });

        return {
          content: [{
            type: "text",
            text: `✅ Clicked`
          }]
        };
      }

     case "puppeteer_inspect_elements": {
      if (!page) {
        throw new Error("Browser not launched. Call puppeteer_launch first.");
      }

      const elements = await page.evaluate((searchTerm, types, limit) => {
        const selector = types.join(', ');
        const allElements = [...document.querySelectorAll(selector)].slice(0, 100);
        
        const filtered = searchTerm 
          ? allElements.filter(el => {
              const text = el.textContent?.toLowerCase() || '';
              const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
              const className = String(el.className || '').toLowerCase();
              const id = el.id?.toLowerCase() || '';
              const term = searchTerm.toLowerCase();
              return text.includes(term) || ariaLabel.includes(term) || 
                    className.includes(term) || id.includes(term);
            }).slice(0, limit)
          : allElements.slice(0, limit);

        return filtered.map(el => {
          const isCheckbox = el.type === 'checkbox' || el.getAttribute('role') === 'checkbox';
          const text = el.textContent?.trim().substring(0, 50) || 
                      (isCheckbox && el.id ? document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim().substring(0, 50) : '');
          const type = el.type || el.getAttribute('role') || el.tagName.toLowerCase();
          const checked = isCheckbox ? el.checked || el.getAttribute('aria-checked') === 'true' : undefined;
          const className = String(el.className || '');
          const id = el.id || '';
          const selector = el.id 
            ? `#${el.id}` 
            : el.getAttribute('aria-label')
              ? `[aria-label="${el.getAttribute('aria-label')}"]`
              : className
                ? `.${className.split(' ').filter(c => c)[0]}`
                : el.tagName.toLowerCase();
          
          const result = { text, type, selector, className, id };
          if (isCheckbox) result.isCheckbox = true;
          if (checked !== undefined) result.checked = checked;
          return result;
        });
      }, args.searchTerm || "", args.elementTypes || ["button", "input", "select"], args.limit || 30);

      return {
        content: [{
          type: "text",
          text: `Found ${elements.length}:\n${JSON.stringify(elements, null, 2)}`
        }]
      };
    }
      case "puppeteer_wait_for_selector": {
        if (!page) {
          throw new Error("Browser not launched. Call puppeteer_launch first.");
        }

        await page.waitForSelector(args.selector, {
          visible: args.visible !== false,
          timeout: args.timeout || 15000
        });

        return {
          content: [{
            type: "text",
            text: `✅ Found`
          }]
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
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }]
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

        // Apply limit
        const limit = args.limit || 2000;
        const truncated = content.substring(0, limit);

        return {
          content: [{
            type: "text",
            text: truncated
          }]
        };
      }
      
      case "puppeteer_get_events": {
        if (!page) {
          throw new Error("Browser not launched. Call puppeteer_launch first.");
        }

        const events = await page.evaluate((selector, limit) => {
          const containers = [...document.querySelectorAll(selector)].slice(0, limit);
          
          return containers.map(container => {
            // Find title
            const title = container.querySelector('h1, h2, h3, h4, [class*="title"], [class*="name"]')?.textContent?.trim();
            
            // Find time
            const time = container.querySelector('[class*="time"], [class*="date"], time, [datetime]')?.textContent?.trim();
            
            if (!title || !time) return null;
            
            return `**${title}**\n**${time}**`;
          }).filter(e => e);
          
        }, args.containerSelector || "[class*='event'], [class*='card']", args.limit || 10);

        return {
          content: [{
            type: "text",
            text: events.join('\n\n')
          }]
        };
      }

      case "puppeteer_close": {
        if (browser) {
          await browser.close();
          browser = null;
          page = null;
        }

        return {
          content: [{
            type: "text",
            text: "✅ Closed"
          }]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ ${error.message}`
      }],
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