import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { Readable } from "stream";
import { EventEmitter } from "events";
import { getD1Db } from "./d1-db";
import { initializeSeedBank } from "./storage";

// Create Express app
const app = express();

app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// CORS middleware for API routes
app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  next();
});

// Request logging middleware
app.use((req, res, next) => {
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

      log(logLine);
    }
  });

  next();
});

// Defer route initialization until first request (after env is available)
let routesInitialized = false;
let initPromise: Promise<void> | null = null;

function initRoutes(d1Database: D1Database) {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const d1Db = getD1Db(d1Database);
        await registerRoutes(null, app, d1Db);
        await initializeSeedBank(d1Db);
        routesInitialized = true;
      } catch (err) {
        console.error('Failed to initialize routes:', err);
        // Routes failed but worker can still serve static assets
      }
    })();
  }
  return initPromise;
}

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  console.error(err);
});

// Convert Web Request to Node.js IncomingMessage-like object
function createNodeRequest(request: globalThis.Request, url: URL) {
  const headers: Record<string, string | string[]> = {};
  request.headers.forEach((value, key) => {
    const existing = headers[key.toLowerCase()];
    if (existing) {
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        headers[key.toLowerCase()] = [existing, value];
      }
    } else {
      headers[key.toLowerCase()] = value;
    }
  });

  // Create a readable stream from the request body
  const bodyStream = request.body
    ? Readable.from(request.body as any)
    : new Readable({ read() { this.push(null); } });

  return Object.assign(bodyStream, {
    method: request.method,
    url: url.pathname + url.search,
    headers,
    httpVersion: '1.1',
    httpVersionMajor: 1,
    httpVersionMinor: 1,
    rawHeaders: Array.from(request.headers.entries()).flat(),
  });
}

// Convert Node.js ServerResponse to Web Response
function createNodeResponse(resolve: (response: globalThis.Response) => void): EventEmitter & any {
  const chunks: Buffer[] = [];
  let statusCode = 200;
  let statusMessage = 'OK';
  const headers: Record<string, string | string[]> = {};
  let headersSent = false;

  const response = Object.assign(new EventEmitter(), {
    statusCode,
    statusMessage,
    headersSent: false,

    writeHead(code: number, message?: string | any, hdrs?: any) {
      statusCode = code;
      if (typeof message === 'string') {
        statusMessage = message;
        if (hdrs) Object.assign(headers, hdrs);
      } else if (message) {
        Object.assign(headers, message);
      }
      this.headersSent = true;
      headersSent = true;
      return this;
    },

    setHeader(name: string, value: string | string[]) {
      headers[name.toLowerCase()] = value;
    },

    getHeader(name: string) {
      return headers[name.toLowerCase()];
    },

    getHeaders() {
      return { ...headers };
    },

    hasHeader(name: string) {
      return name.toLowerCase() in headers;
    },

    removeHeader(name: string) {
      delete headers[name.toLowerCase()];
    },

    write(chunk: any, encoding?: any, callback?: any) {
      if (typeof encoding === 'function') {
        callback = encoding;
        encoding = undefined;
      }

      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      }

      if (callback) callback();
      return true;
    },

    end(chunk?: any, encoding?: any, callback?: any) {
      if (typeof chunk === 'function') {
        callback = chunk;
        chunk = undefined;
      } else if (typeof encoding === 'function') {
        callback = encoding;
        encoding = undefined;
      }

      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      }

      // Build response headers
      const responseHeaders = new Headers();
      Object.entries(headers).forEach(([name, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => responseHeaders.append(name, v));
        } else {
          responseHeaders.set(name, value);
        }
      });

      // Combine chunks
      const body = chunks.length > 0 ? Buffer.concat(chunks) : null;

      // Create and resolve Web Response
      const webResponse = new globalThis.Response(body, {
        status: statusCode,
        statusText: statusMessage,
        headers: responseHeaders,
      });

      response.emit('finish');
      if (callback) callback();
      resolve(webResponse);
    },
  });

  return response;
}

// Populate process.env from Workers env bindings so libraries (db, etc.) can find secrets
function populateProcessEnv(env: any) {
  if (!env || typeof env !== 'object') return;
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === 'string' && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

// Cloudflare Workers fetch handler
export default {
  async fetch(request: globalThis.Request, env: any, ctx: any): Promise<globalThis.Response> {
    // Make Worker env secrets available via process.env for Node.js libraries
    populateProcessEnv(env);

    const url = new URL(request.url);

    // Try to serve from ASSETS binding first for static files
    if (env.ASSETS && !url.pathname.startsWith('/api')) {
      try {
        const assetResponse = await env.ASSETS.fetch(request);
        if (assetResponse.status !== 404) {
          return assetResponse;
        }
      } catch (e) {
        console.error('Error fetching asset:', e);
      }
    }

    // Check if D1 database is available
    if (!env.DB) {
      console.error('D1 database binding (env.DB) is not available');
      if (url.pathname.startsWith('/api')) {
        return new globalThis.Response(
          JSON.stringify({ message: 'Database not configured' }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Initialize routes on first API request (after env is populated)
    if (!routesInitialized && env.DB) {
      await initRoutes(env.DB);
    }

    // If routes failed to init and this is an API request, return a useful error
    if (!routesInitialized && url.pathname.startsWith('/api')) {
      return new globalThis.Response(
        JSON.stringify({ message: 'API temporarily unavailable - database connection failed' }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // For API routes and fallback, use Express
    return new Promise((resolve) => {
      const nodeReq = createNodeRequest(request, url);
      const nodeRes = createNodeResponse(resolve);

      // Handle the request with Express
      app(nodeReq as any, nodeRes as any, () => {
        // If no route handled it, serve index.html for SPA fallback
        if (env.ASSETS) {
          const indexUrl = new URL(request.url);
          indexUrl.pathname = '/index.html';
          env.ASSETS.fetch(indexUrl.toString())
            .then((response: globalThis.Response) => resolve(response))
            .catch(() => resolve(new globalThis.Response('Not Found', { status: 404 })));
        } else {
          resolve(new globalThis.Response('Not Found', { status: 404 }));
        }
      });
    });
  },
};
