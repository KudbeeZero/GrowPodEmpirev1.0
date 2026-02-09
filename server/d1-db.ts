import { drizzle } from "drizzle-orm/d1";
import * as schema from "@shared/schema";

// D1 database connection for Cloudflare Workers
// This is lazily initialized when the first request comes in with the D1 binding
let _db: ReturnType<typeof drizzle> | null = null;

export function getD1Db(d1: D1Database) {
  if (!_db) {
    _db = drizzle(d1, { schema });
  }
  return _db;
}

// Export a proxy that will throw an error if accessed before initialization
// This matches the pattern from db.ts for consistency
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get() {
    throw new Error(
      "D1 database not initialized. Call getD1Db(env.DB) first in your worker fetch handler.",
    );
  },
});
