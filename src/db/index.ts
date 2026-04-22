import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// ── lazy singleton: DATABASE_URL 미설정 시에도 빌드가 통과되도록 지연 초기화
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getClient() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. .env.local 또는 Vercel 환경변수에 Neon 연결 문자열을 추가하세요."
    );
  }
  const client = postgres(url, { prepare: false });
  _db = drizzle(client, { schema });
  return _db;
}

// 기존 코드 호환성: `import { db } from "@/db"` 형태 유지
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
