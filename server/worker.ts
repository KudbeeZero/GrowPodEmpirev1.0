/**
 * Cloudflare Workers entry point with ES Module default export
 * This wraps an Express.js application to work with Cloudflare Workers
 */

import express, { type Request as ExpressRequest, type Response as ExpressResponse, type NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";

// Create Express app
const app = express();

// JSON parsing middleware
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      console.log(logLine);
    }
  });

  next();
});

// Initialize routes
let initialized = false;
async function initialize() {
  if (!initialized) {
    // Create a mock httpServer for registerRoutes (Workers don't have http.Server)
    const mockServer = null as any;
    await registerRoutes(mockServer, app);
    
    // Error handler
    app.use((err: any, _req: ExpressRequest, res: ExpressResponse, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error(err);
    });
    
    // Serve static files
    serveStatic(app);
    
    initialized = true;
  }
}

// Initialize immediately
initialize().catch(console.error);

// Default export for Cloudflare Workers
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    // Ensure initialization is complete
    await initialize();
    
    // For Cloudflare Workers with nodejs_compat, we can use a library to adapt
    // However, for now, let's return a simple response to test the export
    try {
      // Note: Full Express integration with Workers requires additional setup
      // This is a minimal implementation to satisfy the export requirement
      return new Response(JSON.stringify({ 
        status: "ok", 
        message: "GrowPod Empire API",
        note: "Full Express integration requires additional Workers adapter setup"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response("Internal Server Error", {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });
    }
  },
};
