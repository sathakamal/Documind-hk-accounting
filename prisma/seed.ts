import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Decimal } from "decimal.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create organization
  const org = await prisma.organization.create({
    data: {
      name: "TST Gems & Jewellery Ltd",
      legalName: "TST Gems & Jewellery Limited",
      brNumber: "12345678",
      address: "1 Queen's Road Central, Hong Kong",
      baseCurrency: "HKD",
      plan: "PROFESSIONAL",
    },
  });

  // Create admin user with hashed password
  const hashedPassword = await bcrypt.hash("Admin@123", 10);
  const adminUser = await prisma.user.create({
    data: {
      name: "Arumugam OmSathasivam",
      email: "admin@tstgems.com",
      password: hashedPassword,
      role: "ADMIN",
      organizationId: org.id,
    },
  });

  // Create default currencies
  await prisma.orgCurrency.createMany({
    data: [
      {
        code: "HKD",
        name: "Hong Kong Dollar",
        symbol: "$",
        isBase: true,
        organizationId: org.id,
      },
      {
        code: "USD",
        name: "US Dollar",
        symbol: "$",
        isBase: false,
        organizationId: org.id,
      },
      {
        code: "CNY",
        name: "Chinese Yuan",
        symbol: "¥",
        isBase: false,
        organizationId: org.id,
      },
      {
        code: "INR",
        name: "Indian Rupee",
        symbol: "₹",
        isBase: false,
        organizationId: org.id,
      },
    ],
  });

  // Create exchange rates
  await prisma.exchangeRate.createMany({
    data: [
      {
        fromCurrency: "USD",
        toCurrency: "HKD",
        rate: new Decimal(7.8),
        organizationId: org.id,
      },
      {
        fromCurrency: "CNY",
        toCurrency: "HKD",
        rate: new Decimal(1.07),
        organizationId: org.id,
      },
      {
        fromCurrency: "INR",
        toCurrency: "HKD",
        rate: new Decimal(0.094),
        organizationId: org.id,
      },
    ],
  });

  // Create demo vendors
  await prisma.vendor.createMany({
    data: [
      {
        code: "V-001",
        name: "Raj Diamond Co",
        country: "India",
        currency: "USD",
        email: "contact@rajdiamond.com",
        phone: "+91-98765-43210",
        paymentTerms: 30,
        organizationId: org.id,
      },
      {
        code: "V-002",
        name: "GIA Antwerp BVBA",
        country: "Belgium",
        currency: "USD",
        email: "info@gia-antwerp.be",
        phone: "+32-3-123-4567",
        paymentTerms: 45,
        organizationId: org.id,
      },
      {
        code: "V-003",
        name: "HK Supplies Ltd",
        country: "Hong Kong",
        currency: "HKD",
        email: "sales@hksupplies.com.hk",
        phone: "+852-1234-5678",
        paymentTerms: 15,
        organizationId: org.id,
      },
    ],
  });

  // Create demo customers
  await prisma.customer.createMany({
    data: [
      {
        code: "C-001",
        name: "Chow Tai Fook HK",
        country: "Hong Kong",
        currency: "HKD",
        email: "orders@chowtaifook.com",
        phone: "+852-2123-4567",
        paymentTerms: 30,
        organizationId: org.id,
      },
      {
        code: "C-002",
        name: "Tiffany & Co Singapore",
        country: "Singapore",
        currency: "USD",
        email: "sg-purchase@tiffany.com",
        phone: "+65-6-123-4567",
        paymentTerms: 45,
        organizationId: org.id,
      },
      {
        code: "C-003",
        name: "Fancy Jewels Mumbai",
        country: "India",
        currency: "INR",
        email: "buy@fancyjewels.in",
        phone: "+91-22-1234-5678",
        paymentTerms: 30,
        organizationId: org.id,
      },
    ],
  });

  // Get vendor and customer data to create invoices/bills
  const [vendor1, vendor2, vendor3] = await prisma.vendor.findMany({
    where: { organizationId: org.id },
  });

  const [customer1, customer2, customer3] = await prisma.customer.findMany({
    where: { organizationId: org.id },
  });

  // Create demo bills
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(today.getMonth() - 1);
  const dueDateOverdue = new Date();
  dueDateOverdue.setDate(today.getDate() - 10);
  const dueDateUpcoming = new Date();
  dueDateUpcoming.setDate(today.getDate() + 15);

  await prisma.bill.create({
    data: {
      billNumber: "BILL-2025-001",
      vendorId: vendor1!.id,
      issueDate: lastMonth,
      dueDate: dueDateOverdue,
      status: "OVERDUE",
      currency: "USD",
      exchangeRate: new Decimal(7.8),
      subtotal: new Decimal(5000),
      taxAmount: new Decimal(0),
      totalAmount: new Decimal(5000),
      paidAmount: new Decimal(0),
      balanceDue: new Decimal(5000),
      totalHkd: new Decimal(39000),
      lines: {
        create: [
          {
            description: "Round Brilliant 1ct Diamonds",
            quantity: new Decimal(1),
            unitPrice: new Decimal(3500),
            amount: new Decimal(3500),
            taxRate: new Decimal(0),
            sortOrder: 0,
          },
          {
            description: "Pear Shape 0.5ct Diamonds",
            quantity: new Decimal(2),
            unitPrice: new Decimal(750),
            amount: new Decimal(1500),
            taxRate: new Decimal(0),
            sortOrder: 1,
          },
        ],
      },
      organizationId: org.id,
    },
  });

  await prisma.bill.create({
    data: {
      billNumber: "BILL-2025-002",
      vendorId: vendor3!.id,
      issueDate: new Date(),
      dueDate: dueDateUpcoming,
      status: "APPROVED",
      currency: "HKD",
      exchangeRate: new Decimal(1),
      subtotal: new Decimal(8500),
      taxAmount: new Decimal(0),
      totalAmount: new Decimal(8500),
      paidAmount: new Decimal(0),
      balanceDue: new Decimal(8500),
      totalHkd: new Decimal(8500),
      lines: {
        create: [
          {
            description: "Office Supplies & Equipment",
            quantity: new Decimal(1),
            unitPrice: new Decimal(8500),
            amount: new Decimal(8500),
            taxRate: new Decimal(0),
            sortOrder: 0,
          },
        ],
      },
      organizationId: org.id,
    },
  });

  // Create demo invoices
  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2025-001",
      customerId: customer1!.id,
      issueDate: lastMonth,
      dueDate: dueDateOverdue,
      status: "OVERDUE",
      currency: "HKD",
      exchangeRate: new Decimal(1),
      subtotal: new Decimal(25000),
      taxAmount: new Decimal(0),
      totalAmount: new Decimal(25000),
      paidAmount: new Decimal(0),
      balanceDue: new Decimal(25000),
      totalHkd: new Decimal(25000),
      lines: {
        create: [
          {
            description: "Diamond Necklace Set 18K Gold",
            quantity: new Decimal(1),
            unitPrice: new Decimal(25000),
            amount: new Decimal(25000),
            taxRate: new Decimal(0),
            sortOrder: 0,
          },
        ],
      },
      organizationId: org.id,
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2025-002",
      customerId: customer2!.id,
      issueDate: new Date(),
      dueDate: dueDateUpcoming,
      status: "SENT",
      currency: "USD",
      exchangeRate: new Decimal(7.8),
      subtotal: new Decimal(12000),
      taxAmount: new Decimal(0),
      totalAmount: new Decimal(12000),
      paidAmount: new Decimal(0),
      balanceDue: new Decimal(12000),
      totalHkd: new Decimal(93600),
      lines: {
        create: [
          {
            description: "Princess Cut Diamond Earrings",
            quantity: new Decimal(1),
            unitPrice: new Decimal(12000),
            amount: new Decimal(12000),
            taxRate: new Decimal(0),
            sortOrder: 0,
          },
        ],
      },
      organizationId: org.id,
    },
  });

  console.log("✅ Seeding complete!");
  console.log("\n📧 Test login:");
  console.log("   Email: admin@tstgems.com");
  console.log("   Password: Admin@123");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
