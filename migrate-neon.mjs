/**
 * migrate-neon.mjs
 * Adds the 2 new columns to Document table via Neon HTTP driver.
 * Run: node migrate-neon.mjs
 */
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

// Load .env manually
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, ".env");
const envContent = readFileSync(envPath, "utf-8");
envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx < 0) return;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  process.env[key] = val;
});

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in .env");
  process.exit(1);
}

console.log("🔗 Using DATABASE_URL:", DATABASE_URL.replace(/:[^:@]+@/, ":***@"));

const sql = neon(DATABASE_URL);

async function migrate() {
  console.log("🔄 Connecting to Neon via HTTP driver...");

  // Test connection - neon() uses tagged template literals
  const test = await sql`SELECT version()`;
  console.log("✅ Connected! DB version:", test[0]?.version?.slice(0, 40) || "unknown");

  // Add fileHash column if not exists
  console.log('\n📝 Adding "fileHash" column...');
  await sql`ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "fileHash" TEXT`;
  console.log('   ✅ "fileHash" ready');

  // Add processingError column if not exists
  console.log('\n📝 Adding "processingError" column...');
  await sql`ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "processingError" TEXT`;
  console.log('   ✅ "processingError" ready');

  // Verify - check what tables exist
  const tables = await sql`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `;
  console.log("\n📋 Tables in DB:", tables.map(t => t.tablename).join(", "));

  // Check Document columns
  const docCols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Document'
    ORDER BY ordinal_position
  `;
  
  if (docCols.length > 0) {
    console.log("\n✅ Document columns:", docCols.map(c => c.column_name).join(", "));
  } else {
    // Try lowercase
    const docCols2 = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'document'
      ORDER BY ordinal_position
    `;
    console.log("\n✅ Document columns:", docCols2.map(c => c.column_name).join(", ") || "none found");
  }

  console.log("\n🎉 Migration complete! Schema is up to date.");
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  console.error(err.stack);
  process.exit(1);
});
