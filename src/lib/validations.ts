import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  orgName: z.string().min(2, "Organization name is required"),
});

export const billSchema = z.object({
  vendorId: z.string().cuid(),
  vendorBillRef: z.string().optional(),
  issueDate: z.string(),
  dueDate: z.string(),
  currency: z.string(),
  exchangeRate: z.number(),
  subtotal: z.number(),
  taxAmount: z.number().default(0),
  totalAmount: z.number(),
  notes: z.string().optional(),
  lines: z.array(
    z.object({
      description: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
      amount: z.number(),
      taxRate: z.number().default(0),
      category: z.string().optional(),
    })
  ),
});

export const invoiceSchema = z.object({
  customerId: z.string().cuid(),
  issueDate: z.string(),
  dueDate: z.string(),
  currency: z.string(),
  exchangeRate: z.number(),
  subtotal: z.number(),
  taxAmount: z.number().default(0),
  totalAmount: z.number(),
  notes: z.string().optional(),
  lines: z.array(
    z.object({
      description: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
      amount: z.number(),
      taxRate: z.number().default(0),
      category: z.string().optional(),
    })
  ),
});
