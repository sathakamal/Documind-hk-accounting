# DocuMind HK — AI Accounting Assistant for Hong Kong Businesses

## Description
DocuMind HK is an AI-powered document and accounting platform built specifically for Hong Kong SMEs and diamond traders. It eliminates manual data entry by extracting data from invoices, receipts, and bank statements using AI.

## Tech Stack
- **Frontend**: Next.js 15 (App Router, TypeScript), Tailwind CSS 4, shadcn/ui
- **Backend**: Next.js 15 API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js 4
- **AI**: OpenAI GPT-4o with Vision
- **Other**: TanStack Query, TanStack Table, Zustand, React Hook Form + Zod, Recharts, ExcelJS, Decimal.js

## Setup Instructions

1. **Install Dependencies**
```bash
npm install
```

2. **Environment Variables**
Create `.env` file using `.env.example` as reference.

3. **Database Setup**
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

4. **Run Development Server**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## Default Login
- Email: `admin@tstgems.com`
- Password: `Admin@123`

## Features (Phase 1)
- ✅ Auth system (login, register, org setup)
- ✅ Document upload with AI data extraction
- ✅ Accounts Payable (bills from suppliers)
- ✅ Accounts Receivable (invoices to customers)
- ✅ Multi-currency support (HKD, USD, INR, CNY, EUR, GBP)
- ✅ Dashboard with key metrics
- ✅ Excel export of all records
- ✅ Clean UI (dark sidebar, white content area)

## Author
- **Arumugam OmSathasivam**
- GitHub: [sathakamal](https://github.com/sathakamal)
- LinkedIn: [omsathasivam-arumugam-3a0a5236](https://www.linkedin.com/in/omsathasivam-arumugam-3a0a5236)
- Email: sathasivam.om25@gmail.com
- WhatsApp: +852 5643 3247
- Location: Hong Kong
