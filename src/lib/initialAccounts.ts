import { PrismaClient } from "@prisma/client";

export const initialAccounts = [
  // --- ASSETS ---
  { code: "1000", name: "Cash on Hand", type: "ASSET", classification: "CURRENT_ASSET" },
  { code: "1010", name: "HSBC HKD Account", type: "ASSET", classification: "CURRENT_ASSET" },
  { code: "1020", name: "HSBC USD Account", type: "ASSET", classification: "CURRENT_ASSET" },
  { code: "1200", name: "Accounts Receivable", type: "ASSET", classification: "CURRENT_ASSET" },
  { code: "1500", name: "Inventory", type: "ASSET", classification: "CURRENT_ASSET" },
  { code: "1800", name: "Office Equipment", type: "ASSET", classification: "FIXED_ASSET" },
  { code: "1810", name: "Accumulated Depreciation", type: "ASSET", classification: "FIXED_ASSET" },

  // --- LIABILITIES ---
  { code: "2000", name: "Accounts Payable", type: "LIABILITY", classification: "CURRENT_LIABILITY" },
  { code: "2200", name: "Salaries Payable", type: "LIABILITY", classification: "CURRENT_LIABILITY" },
  { code: "2400", name: "Directors' Loan", type: "LIABILITY", classification: "LONG_TERM_LIABILITY" },

  // --- EQUITY ---
  { code: "3000", name: "Share Capital", type: "EQUITY", classification: "EQUITY" },
  { code: "3100", name: "Retained Earnings", type: "EQUITY", classification: "EQUITY" },

  // --- REVENUE ---
  { code: "4000", name: "Sales Revenue", type: "REVENUE", classification: "REVENUE" },
  { code: "4100", name: "Interest Income", type: "REVENUE", classification: "REVENUE" },

  // --- EXPENSES ---
  { code: "5000", name: "Cost of Goods Sold (COGS)", type: "EXPENSE", classification: "COST_OF_GOODS_SOLD" },
  { code: "6000", name: "Rent and Rates", type: "EXPENSE", classification: "OPERATING_EXPENSE" },
  { code: "6010", name: "Salaries & Wages", type: "EXPENSE", classification: "OPERATING_EXPENSE" },
  { code: "6020", name: "MPF Contributions", type: "EXPENSE", classification: "OPERATING_EXPENSE" },
  { code: "6030", name: "Utilities & Comm", type: "EXPENSE", classification: "OPERATING_EXPENSE" },
  { code: "6040", name: "Auditor Fees & Legal", type: "EXPENSE", classification: "OPERATING_EXPENSE" },
  { code: "6050", name: "Travel & Entertainment", type: "EXPENSE", classification: "OPERATING_EXPENSE" },
  { code: "6060", name: "Office Expenses", type: "EXPENSE", classification: "OPERATING_EXPENSE" },
  { code: "6070", name: "Foreign Exchange Variance", type: "EXPENSE", classification: "OPERATING_EXPENSE" },
  { code: "6900", name: "Depreciation Expense", type: "EXPENSE", classification: "OPERATING_EXPENSE" },
];

export async function seedAccountsForOrg(prisma: PrismaClient, orgId: string) {
  console.log(`Seeding Chart of Accounts for Organization: ${orgId}`);
  for (const acc of initialAccounts) {
    await prisma.account.upsert({
      where: {
        organizationId_code: {
          organizationId: orgId,
          code: acc.code,
        },
      },
      update: {},
      create: {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        classification: acc.classification,
        balance: 0,
        organizationId: orgId,
      },
    });
  }
}
