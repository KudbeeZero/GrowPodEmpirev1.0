/**
 * Cloudflare Workers Entry Point
 * 
 * This is a dedicated entry point for Cloudflare Workers that exports
 * the required ES Module default export with a fetch handler.
 * 
 * For now, this returns a simple response. Full Express.js integration
 * with Cloudflare Workers requires using an adapter library.
 */

// ES Module default export for Cloudflare Workers
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    try {
      const url = new URL(request.url);
      
      // Return a simple JSON response
      return new Response(JSON.stringify({
        status: "ok",
        message: "GrowPod Empire API - Cloudflare Workers",
        url: url.pathname,
        method: request.method,
        timestamp: new Date().toISOString(),
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      console.error("Worker fetch error:", error);
      return new Response(JSON.stringify({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
