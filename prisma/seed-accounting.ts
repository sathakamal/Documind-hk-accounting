import { PrismaClient } from "@prisma/client";
import { seedAccountsForOrg } from "../src/lib/initialAccounts";
import { Decimal } from "decimal.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Double-Entry Ledger and Bank Reconciliation...");

  // Find the first organization (TST Gems & Jewellery Ltd)
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.error("❌ No Organization found! Run the primary seed first.");
    process.exit(1);
  }

  console.log(`Using Organization: ${org.name} (${org.id})`);

  // 1. Seed accounts
  await seedAccountsForOrg(prisma, org.id);

  // Retrieve accounts to use their IDs
  const accounts = await prisma.account.findMany({
    where: { organizationId: org.id },
  });

  const getAccount = (code: string) => accounts.find((a) => a.code === code);

  const bankHkd = getAccount("1010");
  const bankUsd = getAccount("1020");
  const arAccount = getAccount("1200");
  const apAccount = getAccount("2000");
  const salesAccount = getAccount("4000");
  const rentAccount = getAccount("6000");
  const officeExpenses = getAccount("6060");

  if (!bankHkd || !bankUsd || !arAccount || !apAccount || !salesAccount || !rentAccount || !officeExpenses) {
    console.error("❌ Missing seeded accounts!");
    process.exit(1);
  }

  // 2. Clear old JournalEntries to start clean
  await prisma.journalEntry.deleteMany({
    where: { organizationId: org.id }
  });

  console.log("Deleted old journal entries.");

  // 3. Seed initial journal entries
  console.log("Creating demo journal entries...");

  // Journal Entry 1: Starting Capital (Debit Bank, Credit Share Capital)
  const shareCapital = getAccount("3000");
  if (shareCapital) {
    await prisma.journalEntry.create({
      data: {
        description: "Initial share capital injection",
        reference: "CAP-001",
        organizationId: org.id,
        lines: {
          create: [
            { accountId: bankHkd.id, debit: new Decimal(500000), credit: new Decimal(0) },
            { accountId: shareCapital.id, debit: new Decimal(0), credit: new Decimal(500000) },
          ],
        },
      },
    });
  }

  // Journal Entry 2: Paying Rent (Debit Rent, Credit Bank)
  await prisma.journalEntry.create({
    data: {
      description: "Office rent for Jan 2025",
      reference: "RENT-2025-01",
      organizationId: org.id,
      lines: {
        create: [
          { accountId: rentAccount.id, debit: new Decimal(12000), credit: new Decimal(0) },
          { accountId: bankHkd.id, debit: new Decimal(0), credit: new Decimal(12000) },
        ],
      },
    },
  });

  // Journal Entry 3: Invoice INV-2025-001 AR Posting
  // In reality, this is posted when Invoice is created: Debit AR, Credit Sales
  await prisma.journalEntry.create({
    data: {
      description: "Post Sales Invoice INV-2025-001",
      reference: "INV-2025-001",
      organizationId: org.id,
      lines: {
        create: [
          { accountId: arAccount.id, debit: new Decimal(25000), credit: new Decimal(0) },
          { accountId: salesAccount.id, debit: new Decimal(0), credit: new Decimal(25000) },
        ],
      },
    },
  });

  // Journal Entry 4: Bill BILL-2025-002 Office Supplies AP Posting
  // Debit Office Expenses, Credit AP
  await prisma.journalEntry.create({
    data: {
      description: "Post Supplier Bill BILL-2025-002",
      reference: "BILL-2025-002",
      organizationId: org.id,
      lines: {
        create: [
          { accountId: officeExpenses.id, debit: new Decimal(8500), credit: new Decimal(0) },
          { accountId: apAccount.id, debit: new Decimal(0), credit: new Decimal(8500) },
        ],
      },
    },
  });

  // 4. Seed demo Bank Transactions for Reconciliation
  await prisma.bankTransaction.deleteMany({
    where: { organizationId: org.id }
  });

  console.log("Creating demo bank transactions...");
  await prisma.bankTransaction.createMany({
    data: [
      {
        date: new Date("2025-01-01"),
        description: "SHARE CAPITAL INJECTION",
        amount: new Decimal(500000),
        status: "RECONCILED",
        reference: "CAP-001",
        organizationId: org.id,
      },
      {
        date: new Date("2025-01-03"),
        description: "LANDLORD HK RENT",
        amount: new Decimal(-12000),
        status: "RECONCILED",
        reference: "RENT-2025-01",
        organizationId: org.id,
      },
      {
        date: new Date("2025-01-10"),
        description: "CHOW TAI FOOK HK TRANSFER",
        amount: new Decimal(25000),
        status: "UNRECONCILED",
        organizationId: org.id,
      },
      {
        date: new Date("2025-01-15"),
        description: "HK SUPPLIES LTD EPAY",
        amount: new Decimal(-8500),
        status: "UNRECONCILED",
        organizationId: org.id,
      },
      {
        date: new Date("2025-01-20"),
        description: "COFFEE SHOP CENTRAL",
        amount: new Decimal(-180),
        status: "UNRECONCILED",
        organizationId: org.id,
      },
    ],
  });

  // Helper function to update account balances based on ledger lines
  console.log("Calculating account balances...");
  const allLines = await prisma.journalLine.findMany({
    include: { account: true },
  });

  for (const acc of accounts) {
    const accLines = allLines.filter((l) => l.accountId === acc.id);
    let balance = new Decimal(0);
    for (const line of accLines) {
      if (acc.type === "ASSET" || acc.type === "EXPENSE") {
        balance = balance.plus(line.debit).minus(line.credit);
      } else {
        balance = balance.plus(line.credit).minus(line.debit);
      }
    }
    await prisma.account.update({
      where: { id: acc.id },
      data: { balance },
    });
  }

  console.log("✅ Seeding double-entry accounting done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
