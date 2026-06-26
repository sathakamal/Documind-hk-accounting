import { Bill, Invoice, Vendor, Customer, Document } from "@prisma/client";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DashboardMetrics {
  totalAR: number;
  totalAP: number;
  netPosition: number;
  overdueBillsCount: number;
  overdueBillsAmount: number;
  pendingDocsCount: number;
  cashFlow: { month: string; bills: number; invoices: number }[];
  agingAP: { current: number; days1to30: number; days31to60: number; days61to90: number; days90plus: number };
  agingAR: { current: number; days1to30: number; days31to60: number; days61to90: number; days90plus: number };
  currencyExposure: { currency: string; owedToYou: number; youOwe: number }[];
}
