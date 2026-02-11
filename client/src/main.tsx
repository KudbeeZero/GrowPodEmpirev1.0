// Ensure polyfills are available before any library code runs
import { Buffer } from 'buffer';
import process from 'process';

if (typeof globalThis.global === 'undefined') {
  (globalThis as any).global = globalThis;
}
if (typeof globalThis.Buffer === 'undefined') {
  (globalThis as any).Buffer = Buffer;
}
if (typeof globalThis.process === 'undefined') {
  (globalThis as any).process = process;
}

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize GrowPod Monitor for error tracking and performance monitoring
import { monitor } from "@/lib/growpod-monitor";

monitor.init({
  endpoint: '/api/monitor',
  enabled: true,
  sampleRate: 1.0,
  maxBreadcrumbs: 50,
  flushInterval: 5000,
  debug: import.meta.env.DEV,
});

// Wrap fetch for automatic API tracking
monitor.wrapFetch();

createRoot(document.getElementById("root")!).render(<App />);
