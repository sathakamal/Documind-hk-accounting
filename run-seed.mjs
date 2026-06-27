/**
 * run-seed.mjs
 * Seeds the Neon database using the HTTP driver.
 * Run: node run-seed.mjs
 */
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
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

const sql = neon(DATABASE_URL);

async function runSeed() {
  console.log("🌱 Starting Neon HTTP Database Seeding...");

  // 1. Create Organization
  console.log("Creating organization...");
  const orgResult = await sql`
    INSERT INTO "Organization" ("id", "name", "legalName", "brNumber", "address", "baseCurrency", "plan", "createdAt", "updatedAt")
    VALUES (
      'org_tst_gems',
      'TST Gems & Jewellery Ltd',
      'TST Gems & Jewellery Limited',
      '12345678',
      '1 Queen''s Road Central, Hong Kong',
      'HKD',
      'PROFESSIONAL',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `;
  const orgId = orgResult[0].id;
  console.log(`   Organization created with ID: ${orgId}`);

  // 2. Create Admin User
  console.log("Creating admin user...");
  const hashedPassword = await bcrypt.hash("Admin@123", 10);
  const userResult = await sql`
    INSERT INTO "User" ("id", "email", "password", "name", "role", "organizationId", "createdAt")
    VALUES (
      'usr_admin',
      'admin@tstgems.com',
      ${hashedPassword},
      'Arumugam OmSathasivam',
      'ADMIN',
      ${orgId},
      NOW()
    )
    ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password
    RETURNING id
  `;
  console.log(`   Admin user created with ID: ${userResult[0].id}`);

  // 3. Create Default Currencies
  console.log("Creating default currencies...");
  await sql`
    INSERT INTO "OrgCurrency" ("id", "code", "name", "symbol", "isBase", "isActive", "organizationId")
    VALUES 
      ('curr_hkd', 'HKD', 'Hong Kong Dollar', '$', true, true, ${orgId}),
      ('curr_usd', 'USD', 'US Dollar', '$', false, true, ${orgId}),
      ('curr_cny', 'CNY', 'Chinese Yuan', '¥', false, true, ${orgId}),
      ('curr_inr', 'INR', 'Indian Rupee', '₹', false, true, ${orgId})
    ON CONFLICT DO NOTHING
  `;

  // 4. Create Exchange Rates
  console.log("Creating exchange rates...");
  await sql`
    INSERT INTO "ExchangeRate" ("id", "fromCurrency", "toCurrency", "rate", "date", "source", "organizationId")
    VALUES
      ('rate_usd', 'USD', 'HKD', 7.8, NOW(), 'MANUAL', ${orgId}),
      ('rate_cny', 'CNY', 'HKD', 1.07, NOW(), 'MANUAL', ${orgId}),
      ('rate_inr', 'INR', 'HKD', 0.094, NOW(), 'MANUAL', ${orgId})
    ON CONFLICT DO NOTHING
  `;

  // 5. Create Demo Vendors
  console.log("Creating demo vendors...");
  await sql`
    INSERT INTO "Vendor" ("id", "code", "name", "email", "phone", "country", "currency", "paymentTerms", "organizationId", "createdAt", "updatedAt")
    VALUES
      ('ven_1', 'V-001', 'Raj Diamond Co', 'contact@rajdiamond.com', '+91-98765-43210', 'India', 'USD', 30, ${orgId}, NOW(), NOW()),
      ('ven_2', 'V-002', 'GIA Antwerp BVBA', 'info@gia-antwerp.be', '+32-3-123-4567', 'Belgium', 'USD', 45, ${orgId}, NOW(), NOW()),
      ('ven_3', 'V-003', 'HK Supplies Ltd', 'sales@hksupplies.com.hk', '+852-1234-5678', 'Hong Kong', 'HKD', 15, ${orgId}, NOW(), NOW())
    ON CONFLICT DO NOTHING
  `;

  // 6. Create Demo Customers
  console.log("Creating demo customers...");
  await sql`
    INSERT INTO "Customer" ("id", "code", "name", "email", "phone", "country", "currency", "paymentTerms", "organizationId", "createdAt", "updatedAt")
    VALUES
      ('cust_1', 'C-001', 'Chow Tai Fook HK', 'orders@chowtaifook.com', '+852-2123-4567', 'Hong Kong', 'HKD', 30, ${orgId}, NOW(), NOW()),
      ('cust_2', 'C-002', 'Tiffany & Co Singapore', 'sg-purchase@tiffany.com', '+65-6-123-4567', 'Singapore', 'USD', 45, ${orgId}, NOW(), NOW()),
      ('cust_3', 'C-003', 'Fancy Jewels Mumbai', 'buy@fancyjewels.in', '+91-22-1234-5678', 'India', 'INR', 30, ${orgId}, NOW(), NOW())
    ON CONFLICT DO NOTHING
  `;

  console.log("\n🎉 Database Seeding successful!");
  console.log("📧 Test Login details:");
  console.log("   Email: admin@tstgems.com");
  console.log("   Password: Admin@123");
}

runSeed().catch((err) => {
  console.error("❌ Seeding failed:", err.message);
  process.exit(1);
});
