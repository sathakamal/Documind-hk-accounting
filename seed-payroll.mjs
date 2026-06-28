/**
 * seed-payroll.mjs
 * Seeds demo employees and payroll data using Neon HTTP driver.
 * Run: node seed-payroll.mjs
 */
import { neon } from "@neondatabase/serverless";
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

async function seedPayroll() {
  console.log("🌱 Starting payroll and employee seeding...");

  // Get organization ID
  const orgResult = await sql`SELECT id FROM "Organization" LIMIT 1`;
  if (!orgResult.length) {
    console.error("❌ No organization found! Run the main seed first.");
    process.exit(1);
  }
  const orgId = orgResult[0].id;

  console.log("Using organization ID:", orgId);

  // Demo employees to seed
  const employees = [
    {
      code: "EMP-0001",
      name: "Arumugam OmSathasivam",
      hkid: "A123456(7)",
      position: "Managing Director",
      department: "Management",
      startDate: new Date("2023-01-01").toISOString(),
      basicSalary: 60000,
      housingAllowance: 15000,
      mpfExempt: false,
      status: "ACTIVE",
    },
    {
      code: "EMP-0002",
      name: "Tan Mei Ling",
      hkid: "B987654(3)",
      position: "Senior Accountant",
      department: "Finance",
      startDate: new Date("2023-06-15").toISOString(),
      basicSalary: 45000,
      housingAllowance: 8000,
      mpfExempt: false,
      status: "ACTIVE",
    },
    {
      code: "EMP-0003",
      name: "Rajesh Kumar",
      hkid: null,
      position: "Operations Manager",
      department: "Operations",
      startDate: new Date("2024-01-01").toISOString(),
      basicSalary: 35000,
      housingAllowance: 5000,
      mpfExempt: false,
      status: "ACTIVE",
    },
    {
      code: "EMP-0004",
      name: "Sarah Johnson",
      hkid: null,
      position: "Marketing Executive",
      department: "Marketing",
      startDate: new Date("2024-03-01").toISOString(),
      basicSalary: 28000,
      housingAllowance: 3000,
      mpfExempt: true, // Expat
      status: "ACTIVE",
    },
    {
      code: "EMP-0005",
      name: "Chan Tai Man",
      hkid: "C555555(0)",
      position: "Admin Assistant",
      department: "Admin",
      startDate: new Date("2024-01-01").toISOString(),
      basicSalary: 18000,
      housingAllowance: 0,
      mpfExempt: false,
      status: "ACTIVE",
    },
  ];

  // Insert employees
  console.log("📝 Inserting demo employees...");
  for (const emp of employees) {
    await sql`
      INSERT INTO "Employee" (
        "id", "code", "name", "hkid", "position", "department",
        "startDate", "basicSalary", "housingAllowance", "mpfExempt",
        "status", "organizationId", "createdAt", "updatedAt"
      ) VALUES (
        ${crypto.randomUUID()},
        ${emp.code},
        ${emp.name},
        ${emp.hkid},
        ${emp.position},
        ${emp.department},
        ${emp.startDate},
        ${emp.basicSalary},
        ${emp.housingAllowance},
        ${emp.mpfExempt},
        ${emp.status},
        ${orgId},
        NOW(),
        NOW()
      )
      ON CONFLICT DO NOTHING
    `;
    console.log(`   Added: ${emp.name} (${emp.code})`);
  }

  console.log("\n✅ Employees seeded successfully!");
  console.log("\n💡 You can now add payroll runs in the Payroll Processing page!");
}

seedPayroll().catch((err) => {
  console.error("❌ Payroll seeding failed:", err);
  process.exit(1);
});