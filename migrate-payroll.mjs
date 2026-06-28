/**
 * migrate-payroll.mjs
 * Adds payroll and employee tables to Neon via HTTP driver.
 * Run: node migrate-payroll.mjs
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

  // Test connection
  const test = await sql`SELECT version()`;
  console.log("✅ Connected! DB version:", test[0]?.version?.slice(0, 40) || "unknown");

  // Add financial year columns to Organization if they don't exist
  console.log("\n📝 Adding financial year columns to Organization...");
  await sql`ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "financialYearStartMonth" INTEGER NOT NULL DEFAULT 4`;
  await sql`ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "financialYearStartDay" INTEGER NOT NULL DEFAULT 1`;
  console.log("   ✅ Financial year columns added to Organization");

  // Create Employee table if it doesn't exist
  console.log("\n📝 Creating Employee table...");
  await sql`
    CREATE TABLE IF NOT EXISTS "Employee" (
      "id" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "hkid" TEXT,
      "position" TEXT,
      "department" TEXT,
      "startDate" TIMESTAMP(3) NOT NULL,
      "basicSalary" DECIMAL(65,30) NOT NULL,
      "housingAllowance" DECIMAL(65,30) NOT NULL DEFAULT 0,
      "mpfExempt" BOOLEAN NOT NULL DEFAULT false,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "notes" TEXT,
      "organizationId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "Employee_organizationId_code_key" ON "Employee"("organizationId", "code")`;
  await sql`CREATE INDEX IF NOT EXISTS "Employee_organizationId_idx" ON "Employee"("organizationId")`;
  console.log("   ✅ Employee table created");

  // Create PayrollRun table if it doesn't exist
  console.log("\n📝 Creating PayrollRun table...");
  await sql`
    CREATE TABLE IF NOT EXISTS "PayrollRun" (
      "id" TEXT NOT NULL,
      "runNumber" TEXT NOT NULL,
      "periodStart" TIMESTAMP(3) NOT NULL,
      "periodEnd" TIMESTAMP(3) NOT NULL,
      "paymentDate" TIMESTAMP(3) NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'DRAFT',
      "totalGrossPay" DECIMAL(65,30) NOT NULL DEFAULT 0,
      "totalEmployeeMpf" DECIMAL(65,30) NOT NULL DEFAULT 0,
      "totalEmployerMpf" DECIMAL(65,30) NOT NULL DEFAULT 0,
      "totalNetPay" DECIMAL(65,30) NOT NULL DEFAULT 0,
      "totalCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
      "notes" TEXT,
      "organizationId" TEXT NOT NULL,
      "journalEntryId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "PayrollRun_organizationId_runNumber_key" ON "PayrollRun"("organizationId", "runNumber")`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "PayrollRun_journalEntryId_key" ON "PayrollRun"("journalEntryId")`;
  await sql`CREATE INDEX IF NOT EXISTS "PayrollRun_organizationId_idx" ON "PayrollRun"("organizationId")`;
  console.log("   ✅ PayrollRun table created");

  // Create PayrollLine table if it doesn't exist
  console.log("\n📝 Creating PayrollLine table...");
  await sql`
    CREATE TABLE IF NOT EXISTS "PayrollLine" (
      "id" TEXT NOT NULL,
      "payrollRunId" TEXT NOT NULL,
      "employeeId" TEXT NOT NULL,
      "basicSalary" DECIMAL(65,30) NOT NULL,
      "housingAllowance" DECIMAL(65,30) NOT NULL,
      "grossPay" DECIMAL(65,30) NOT NULL,
      "employeeMpf" DECIMAL(65,30) NOT NULL,
      "netPay" DECIMAL(65,30) NOT NULL,
      "employerMpf" DECIMAL(65,30) NOT NULL,
      "totalCost" DECIMAL(65,30) NOT NULL,
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "PayrollLine_pkey" PRIMARY KEY ("id")
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS "PayrollLine_payrollRunId_idx" ON "PayrollLine"("payrollRunId")`;
  await sql`CREATE INDEX IF NOT EXISTS "PayrollLine_employeeId_idx" ON "PayrollLine"("employeeId")`;
  console.log("   ✅ PayrollLine table created");

  // Add foreign keys if they don't exist (using DO block to handle errors)
  console.log("\n📝 Adding foreign key constraints...");
  try {
    await sql`
      DO $$
      BEGIN
        BEGIN
          ALTER TABLE "Employee"
          ADD CONSTRAINT "Employee_organizationId_fkey"
          FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
          ALTER TABLE "PayrollRun"
          ADD CONSTRAINT "PayrollRun_organizationId_fkey"
          FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
          ALTER TABLE "PayrollRun"
          ADD CONSTRAINT "PayrollRun_journalEntryId_fkey"
          FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL;
        EXCEPTION
          WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
          ALTER TABLE "PayrollLine"
          ADD CONSTRAINT "PayrollLine_payrollRunId_fkey"
          FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
          ALTER TABLE "PayrollLine"
          ADD CONSTRAINT "PayrollLine_employeeId_fkey"
          FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN NULL;
        END;
      END $$;
    `;
    console.log("   ✅ Foreign keys added");
  } catch (e) {
    console.log("   ⚠️ Foreign keys may already exist, skipping");
  }

  // List all tables to confirm
  const tables = await sql`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `;
  console.log("\n📋 Tables in DB:", tables.map(t => t.tablename).join(", "));

  console.log("\n🎉 Migration complete! Payroll schema is ready!");
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  console.error(err.stack);
  process.exit(1);
});
