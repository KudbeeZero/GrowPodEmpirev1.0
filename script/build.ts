import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";
import path from "path";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

// Node.js built-in modules that Workers provides via nodejs_compat
const NODE_BUILTINS = [
  "assert", "async_hooks", "buffer", "child_process", "cluster", "console",
  "constants", "crypto", "dgram", "diagnostics_channel", "dns", "domain",
  "events", "fs", "http", "http2", "https", "inspector", "module", "net",
  "os", "path", "perf_hooks", "process", "punycode", "querystring",
  "readline", "repl", "stream", "string_decoder", "sys", "timers",
  "tls", "trace_events", "tty", "url", "util", "v8", "vm",
  "worker_threads", "zlib",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  // Check if we're building for Cloudflare Workers
  const isWorkerBuild = process.env.BUILD_TARGET === "worker";
  const entryPoint = isWorkerBuild ? "server/worker.ts" : "server/index.ts";

  console.log(`Building server for ${isWorkerBuild ? "Cloudflare Workers" : "Node.js"}...`);

  // Shared path aliases for resolving @shared/* imports
  const sharedAlias: Record<string, string> = {
    "@shared": path.resolve("shared"),
  };

  if (isWorkerBuild) {
    // Cloudflare Workers build:
    // - platform "neutral" prevents esbuild from auto-externalizing Node builtins
    // - Alias bare builtins (e.g. "path") to "node:path" so Workers' nodejs_compat resolves them
    // - Externalize only node:* protocols (provided by Workers runtime)
    // - Bundle ALL npm dependencies (Workers has no node_modules)
    // - createRequire banner handles CJS require() calls from bundled dependencies
    const builtinAlias: Record<string, string> = {};
    for (const mod of NODE_BUILTINS) {
      builtinAlias[mod] = `node:${mod}`;
    }

    await esbuild({
      entryPoints: [entryPoint],
      platform: "neutral",
      bundle: true,
      format: "esm",
      outfile: "dist/index.js",
      target: "es2022",
      conditions: ["workerd", "worker", "browser", "import", "default"],
      mainFields: ["browser", "module", "main"],
      external: NODE_BUILTINS.map((mod) => `node:${mod}`),
      alias: { ...builtinAlias, ...sharedAlias },
      banner: {
        js: [
          'import { createRequire as __cf_cjsRequire } from "node:module";',
          "const require = __cf_cjsRequire(import.meta.url);",
        ].join("\n"),
      },
      define: {
        "process.env.NODE_ENV": '"production"',
      },
      minify: true,
      logLevel: "info",
    });
  } else {
    // Standard Node.js build
    await esbuild({
      entryPoints: [entryPoint],
      platform: "node",
      bundle: true,
      format: "cjs",
      outfile: "dist/index.cjs",
      alias: sharedAlias,
      define: {
        "process.env.NODE_ENV": '"production"',
      },
      minify: true,
      external: externals,
      logLevel: "info",
    });
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
