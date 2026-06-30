"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface Bill {
  id: number;
  num: string;
  vend: string;
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

export default function APAgingPage() {
  const searchParams = useSearchParams();
  const [bills, setBills] = useState<Bill[]>([]);
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
          setBills(data.bills || []);
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

    const outstandingBills = bills.filter(bill => bill.st !== "Paid");
    
    outstandingBills.forEach(bill => {
      const dueDate = new Date(bill.due);
      const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const balance = bill.amt - (bill.pd || 0);

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
  }, [bills]);

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

  // Get aging bucket for a bill
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

  // Calculate potential late payment penalties
  const calculateLatePenalties = () => {
    const { days31to60, days61to90, over90 } = agingStats;
    
    // Typical supplier penalties:
    // - 31-60 days: 2% penalty
    // - 61-90 days: 5% penalty  
    // - Over 90 days: 10% penalty + potential legal action
    const penalties = 
      (days31to60 * 0.02) + 
      (days61to90 * 0.05) + 
      (over90 * 0.10);
    
    return penalties;
  };

  const latePenalties = calculateLatePenalties();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🕐 AP Aging Report</h1>
        <p className="text-gray-600 mt-1">Accounts Payable aging analysis with supplier payment risk assessment</p>
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
            2% penalty: {formatCurrency(agingStats.days31to60 * 0.02)}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">61-90 Days</div>
          <div className="mt-1 text-2xl font-semibold text-red-600">
            {formatCurrency(agingStats.days61to90)}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            5% penalty: {formatCurrency(agingStats.days61to90 * 0.05)}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Over 90 Days</div>
          <div className="mt-1 text-2xl font-semibold text-red-800">
            {formatCurrency(agingStats.over90)}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            10% penalty: {formatCurrency(agingStats.over90 * 0.10)}
          </div>
        </div>
      </div>

      {/* Late Payment Risk Assessment */}
      <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Late Payment Risk Assessment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-red-700 mb-1">Total Outstanding Payables:</div>
            <div className="text-xl font-bold text-red-900">{formatCurrency(agingStats.total)}</div>
          </div>
          <div>
            <div className="text-sm text-red-700 mb-1">Potential Late Payment Penalties:</div>
            <div className="text-xl font-bold text-red-600">{formatCurrency(latePenalties)}</div>
            <div className="text-xs text-red-600 mt-1">
              ({((latePenalties / agingStats.total) * 100).toFixed(2)}% of outstanding)
            </div>
          </div>
        </div>
        <div className="mt-3 text-sm text-red-700">
          <p>
            <strong>Risk Factors:</strong> Late payments can damage supplier relationships, 
            affect credit ratings, and lead to supply chain disruptions. 
            Consider prioritizing payments to critical suppliers.
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
                  Vendor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bill #
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
              {bills.filter(bill => bill.st !== "Paid").length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    No outstanding bills
                  </td>
                </tr>
              ) : (
                bills
                  .filter(bill => bill.st !== "Paid")
                  .map((bill) => {
                    const balance = bill.amt - (bill.pd || 0);
                    const agingBucket = getAgingBucket(bill.due);
                    const daysDiff = daysBetween(bill.due, new Date().toISOString().split('T')[0]);
                    
                    return (
                      <tr key={bill.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {bill.vend}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {bill.num}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {bill.dt}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {bill.due}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {formatCurrency(bill.amt)}
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
                  {formatCurrency(bills.filter(bill => bill.st !== "Paid").reduce((sum, bill) => sum + bill.amt, 0))}
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

      {/* Payment Prioritization Recommendations */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Payment Prioritization Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="text-xs font-medium text-blue-700 mb-1">High Priority (&gt;90 days)</div>
            <div className="text-lg font-bold text-red-700">{formatCurrency(agingStats.over90)}</div>
            <div className="text-xs text-gray-600 mt-1">Immediate payment to avoid legal action</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="text-xs font-medium text-blue-700 mb-1">Medium Priority (61-90 days)</div>
            <div className="text-lg font-bold text-orange-600">{formatCurrency(agingStats.days61to90)}</div>
            <div className="text-xs text-gray-600 mt-1">Schedule within 1-2 weeks</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="text-xs font-medium text-blue-700 mb-1">Low Priority (31-60 days)</div>
            <div className="text-lg font-bold text-yellow-600">{formatCurrency(agingStats.days31to60)}</div>
            <div className="text-xs text-gray-600 mt-1">Schedule within 30 days</div>
          </div>
        </div>
      </div>

      {/* Supplier Relationship Management Notes */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Supplier Relationship Management</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Maintain open communication with suppliers regarding payment timelines</li>
          <li>• Consider early payment discounts where available (typically 2% for payment within 10 days)</li>
          <li>• Monitor supplier performance and payment terms regularly</li>
          <li>• Establish a payment approval workflow to ensure timely processing</li>
          <li>• Keep accurate records of all payment commitments and actual payments</li>
        </ul>
      </div>
    </div>
  );
}