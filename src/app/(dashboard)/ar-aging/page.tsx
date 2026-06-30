"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface Invoice {
  id: number;
  num: string;
  cust: string;
  dt: string;
  due: string;
  amt: number;
  pd: number;
  st: string;
}

interface AgingStats {
  current: number;
  days31to60: number;
  days61to90: number;
  over90: number;
  total: number;
}

export default function ARAgingPage() {
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [agingStats, setAgingStats] = useState<AgingStats>({
    current: 0,
    days31to60: 0,
    days61to90: 0,
    over90: 0,
    total: 0
  });

  // Load data from localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        const saved = localStorage.getItem("hkpro3_next");
        if (saved) {
          const data = JSON.parse(saved);
          setInvoices(data.invoices || []);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    loadData();
    // Listen for storage changes (in case data is updated in another tab)
    window.addEventListener("storage", loadData);
    return () => window.removeEventListener("storage", loadData);
  }, []);

  // Calculate aging statistics
  useEffect(() => {
    const today = new Date();
    let current = 0;
    let days31to60 = 0;
    let days61to90 = 0;
    let over90 = 0;
    let total = 0;

    const outstandingInvoices = invoices.filter(inv => inv.st !== "Paid");
    
    outstandingInvoices.forEach(inv => {
      const dueDate = new Date(inv.due);
      const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const balance = inv.amt - (inv.pd || 0);

      if (daysDiff <= 0) {
        current += balance;
      } else if (daysDiff <= 30) {
        current += balance; // Still considered current if within 30 days past due
      } else if (daysDiff <= 60) {
        days31to60 += balance;
      } else if (daysDiff <= 90) {
        days61to90 += balance;
      } else {
        over90 += balance;
      }
      
      total += balance;
    });

    setAgingStats({
      current,
      days31to60,
      days61to90,
      over90,
      total
    });
  }, [invoices]);

  // Format currency for HK
  const formatCurrency = (amount: number) => {
    return `HK$${amount.toLocaleString("en-HK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Calculate days between dates
  const daysBetween = (date1: string, date2: string) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Get aging bucket for an invoice
  const getAgingBucket = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const daysDiff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 0) return "Current";
    if (daysDiff <= 30) return "Current"; // Within 30 days past due
    if (daysDiff <= 60) return "31-60";
    if (daysDiff <= 90) return "61-90";
    return ">90";
  };

  // Get status badge color
  const getStatusBadge = (daysDiff: number) => {
    if (daysDiff <= 0) return "bg-green-100 text-green-800";
    if (daysDiff <= 30) return "bg-yellow-100 text-yellow-800";
    if (daysDiff <= 60) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  // Calculate expected credit loss (HKFRS 9)
  const calculateExpectedCreditLoss = () => {
    const { days31to60, days61to90, over90 } = agingStats;
    
    // HKFRS 9 simplified approach:
    // - 31-60 days: 10% provision
    // - 61-90 days: 25% provision  
    // - Over 90 days: 50% provision
    const provision = 
      (days31to60 * 0.10) + 
      (days61to90 * 0.25) + 
      (over90 * 0.50);
    
    return provision;
  };

  const expectedCreditLoss = calculateExpectedCreditLoss();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">⏳ AR Aging Report</h1>
        <p className="text-gray-600 mt-1">Accounts Receivable aging analysis with HKFRS 9 expected credit loss provisions</p>
      </div>

      {/* HKFRS 9 Warning */}
      <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">HKFRS 9 Compliance Required</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Under HKFRS 9, entities must recognize expected credit losses (ECL) on financial assets, 
                including trade receivables. The simplified approach requires lifetime ECL to be recognized 
                from initial recognition.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Aging Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Current</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">
            {formatCurrency(agingStats.current)}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {agingStats.total > 0 ? `${((agingStats.current / agingStats.total) * 100).toFixed(1)}% of total` : "No outstanding"}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">31-60 Days</div>
          <div className="mt-1 text-2xl font-semibold text-orange-600">
            {formatCurrency(agingStats.days31to60)}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            10% ECL: {formatCurrency(agingStats.days31to60 * 0.10)}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">61-90 Days</div>
          <div className="mt-1 text-2xl font-semibold text-red-600">
            {formatCurrency(agingStats.days61to90)}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            25% ECL: {formatCurrency(agingStats.days61to90 * 0.25)}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Over 90 Days</div>
          <div className="mt-1 text-2xl font-semibold text-red-800">
            {formatCurrency(agingStats.over90)}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            50% ECL: {formatCurrency(agingStats.over90 * 0.50)}
          </div>
        </div>
      </div>

      {/* Expected Credit Loss Summary */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Expected Credit Loss (ECL) Calculation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-blue-700 mb-1">Total Outstanding Receivables:</div>
            <div className="text-xl font-bold text-blue-900">{formatCurrency(agingStats.total)}</div>
          </div>
          <div>
            <div className="text-sm text-blue-700 mb-1">Total Expected Credit Loss:</div>
            <div className="text-xl font-bold text-red-600">{formatCurrency(expectedCreditLoss)}</div>
            <div className="text-xs text-blue-600 mt-1">
              ({((expectedCreditLoss / agingStats.total) * 100).toFixed(2)}% of outstanding)
            </div>
          </div>
        </div>
        <div className="mt-3 text-sm text-blue-700">
          <p>
            <strong>Journal Entry Required:</strong> DR Bad Debt Expense {formatCurrency(expectedCreditLoss)} / 
            CR Allowance for Doubtful Debts {formatCurrency(expectedCreditLoss)}
          </p>
        </div>
      </div>

      {/* Aging Report Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Aging Analysis Details</h2>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  31-60
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  61-90
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  &gt;90
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.filter(inv => inv.st !== "Paid").length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    No outstanding invoices
                  </td>
                </tr>
              ) : (
                invoices
                  .filter(inv => inv.st !== "Paid")
                  .map((invoice) => {
                    const balance = invoice.amt - (invoice.pd || 0);
                    const agingBucket = getAgingBucket(invoice.due);
                    const daysDiff = daysBetween(invoice.due, new Date().toISOString().split('T')[0]);
                    
                    return (
                      <tr key={invoice.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.cust}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invoice.num}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invoice.dt}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invoice.due}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {formatCurrency(invoice.amt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {agingBucket === "Current" ? formatCurrency(balance) : ""}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {agingBucket === "31-60" ? formatCurrency(balance) : ""}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {agingBucket === "61-90" ? formatCurrency(balance) : ""}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {agingBucket === ">90" ? formatCurrency(balance) : ""}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(daysDiff)}`}>
                            {daysDiff <= 0 ? "Current" : `${daysDiff}d`}
                          </span>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={4} className="px-6 py-3 text-sm font-medium text-gray-900">
                  <strong>TOTALS</strong>
                </td>
                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                  {formatCurrency(invoices.filter(inv => inv.st !== "Paid").reduce((sum, inv) => sum + inv.amt, 0))}
                </td>
                <td className="px-6 py-3 text-sm font-medium text-green-600">
                  {formatCurrency(agingStats.current)}
                </td>
                <td className="px-6 py-3 text-sm font-medium text-orange-600">
                  {formatCurrency(agingStats.days31to60)}
                </td>
                <td className="px-6 py-3 text-sm font-medium text-red-600">
                  {formatCurrency(agingStats.days61to90)}
                </td>
                <td className="px-6 py-3 text-sm font-medium text-red-800">
                  {formatCurrency(agingStats.over90)}
                </td>
                <td className="px-6 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Compliance Notes */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">HKFRS 9 Compliance Notes</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Expected Credit Loss (ECL) must be recognized from initial recognition of the receivable</li>
          <li>• The simplified approach applies to trade receivables that do not contain a significant financing component</li>
          <li>• Lifetime ECL should be estimated using historical credit loss experience adjusted for forward-looking information</li>
          <li>• The allowance for doubtful debts account (1110) should be used to record the ECL provision</li>
          <li>• Regular review and update of ECL estimates is required at each reporting date</li>
        </ul>
      </div>
    </div>
  );
}