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

createRoot(document.getElementById("root")!).render(<App />);
