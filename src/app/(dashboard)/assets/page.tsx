"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface FixedAsset {
  id: number;
  name: string;
  category: string;
  date: string;
  cost: number;
  pool: string; // "A" (30%), "B" (20%), "C" (10%)
  life: number; // years
  residual: number;
  status: string;
}

interface IRDPool {
  code: string;
  name: string;
  rate: number;
  assets: FixedAsset[];
  totalCost: number;
  initialAllowance: number;
  annualAllowance: number;
  taxWDV: number;
}

export default function FixedAssetsPage() {
  const searchParams = useSearchParams();
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: "",
    category: "Computer Equipment",
    date: new Date().toISOString().split('T')[0],
    cost: 0,
    pool: "A",
    life: 5,
    residual: 0,
    status: "Active"
  });

  // Load data from localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        const saved = localStorage.getItem("hkpro3_next");
        if (saved) {
          const data = JSON.parse(saved);
          setAssets(data.assets || []);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    loadData();
    window.addEventListener("storage", loadData);
    return () => window.removeEventListener("storage", loadData);
  }, []);

  // Format currency for HK
  const formatCurrency = (amount: number) => {
    return `HK$${amount.toLocaleString("en-HK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Calculate book depreciation
  const calculateBookDepreciation = (asset: FixedAsset) => {
    const today = new Date();
    const purchaseDate = new Date(asset.date);
    const yearsSincePurchase = (today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    
    const annualDepreciation = (asset.cost - asset.residual) / asset.life;
    const accumulatedDepreciation = Math.min(annualDepreciation * yearsSincePurchase, asset.cost - asset.residual);
    const bookWDV = asset.cost - accumulatedDepreciation;
    
    return {
      annual: annualDepreciation,
      accumulated: accumulatedDepreciation,
      bookWDV: bookWDV
    };
  };

  // Calculate tax allowances (IRD rules)
  const calculateTaxAllowances = (asset: FixedAsset) => {
    const poolRate = asset.pool === "A" ? 0.30 : asset.pool === "B" ? 0.20 : 0.10;
    
    // Initial allowance: 60% for qualifying plant/machinery purchased on or after specific dates
    // Standard initial allowance: 20% for most assets
    const initialAllowanceRate = 0.20; // Standard rate
    const initialAllowance = asset.cost * initialAllowanceRate;
    
    // Annual allowance on reducing balance
    const afterInitial = asset.cost - initialAllowance;
    const annualAllowance = afterInitial * poolRate;
    
    // Tax written down value
    const taxWDV = afterInitial - annualAllowance;
    
    return {
      initialAllowance,
      annualAllowance,
      taxWDV
    };
  };

  // Group assets by IRD pool
  const groupAssetsByPool = (): IRDPool[] => {
    const pools: Record<string, IRDPool> = {
      "A": { code: "A", name: "Pool A (30%) - Computers & Plant", rate: 0.30, assets: [], totalCost: 0, initialAllowance: 0, annualAllowance: 0, taxWDV: 0 },
      "B": { code: "B", name: "Pool B (20%) - Vehicles & Furniture", rate: 0.20, assets: [], totalCost: 0, initialAllowance: 0, annualAllowance: 0, taxWDV: 0 },
      "C": { code: "C", name: "Pool C (10%) - Buildings", rate: 0.10, assets: [], totalCost: 0, initialAllowance: 0, annualAllowance: 0, taxWDV: 0 }
    };

    assets.forEach(asset => {
      const pool = pools[asset.pool];
      if (pool) {
        pool.assets.push(asset);
        pool.totalCost += asset.cost;
        
        const taxAllowances = calculateTaxAllowances(asset);
        pool.initialAllowance += taxAllowances.initialAllowance;
        pool.annualAllowance += taxAllowances.annualAllowance;
        pool.taxWDV += taxAllowances.taxWDV;
      }
    });

    return Object.values(pools);
  };

  const irpPools = groupAssetsByPool();

  // Calculate totals
  const totalCost = assets.reduce((sum, asset) => sum + asset.cost, 0);
  const totalBookDepreciation = assets.reduce((sum, asset) => {
    const dep = calculateBookDepreciation(asset);
    return sum + dep.accumulated;
  }, 0);
  const totalTaxAllowances = irpPools.reduce((sum, pool) => sum + pool.initialAllowance + pool.annualAllowance, 0);

  // Handle adding new asset
  const handleAddAsset = () => {
    if (!newAsset.name || newAsset.cost <= 0) {
      alert("Please fill in all required fields");
      return;
    }

    const newAssetWithId = {
      ...newAsset,
      id: Date.now()
    };

    const updatedAssets = [...assets, newAssetWithId];
    setAssets(updatedAssets);
    
    // Update localStorage
    try {
      const saved = localStorage.getItem("hkpro3_next");
      const data = saved ? JSON.parse(saved) : {};
      data.assets = updatedAssets;
      localStorage.setItem("hkpro3_next", JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save asset:", error);
    }

    // Reset form
    setNewAsset({
      name: "",
      category: "Computer Equipment",
      date: new Date().toISOString().split('T')[0],
      cost: 0,
      pool: "A",
      life: 5,
      residual: 0,
      status: "Active"
    });
    
    setShowAddModal(false);
  };

  // Handle asset status change
  const handleStatusChange = (id: number, newStatus: string) => {
    const updatedAssets = assets.map(asset => 
      asset.id === id ? { ...asset, status: newStatus } : asset
    );
    
    setAssets(updatedAssets);
    
    // Update localStorage
    try {
      const saved = localStorage.getItem("hkpro3_next");
      const data = saved ? JSON.parse(saved) : {};
      data.assets = updatedAssets;
      localStorage.setItem("hkpro3_next", JSON.stringify(data));
    } catch (error) {
      console.error("Failed to update asset:", error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🏗 Fixed Asset Register & IRD Pools</h1>
        <p className="text-gray-600 mt-1">Track fixed assets with HK IRD pool calculations for tax allowances</p>
      </div>

      {/* IRD Information */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">IRD Pooling Rules for Hong Kong</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="text-sm font-medium text-blue-700 mb-1">Pool A (30%)</div>
            <div className="text-xs text-gray-600">Computers, plant & machinery, qualifying equipment</div>
            <div className="mt-2 text-sm text-gray-700">
              Initial allowance: 60% for qualifying plant/machinery purchased on or after specific dates (standard 20%)
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="text-sm font-medium text-blue-700 mb-1">Pool B (20%)</div>
            <div className="text-xs text-gray-600">Motor vehicles, furniture, fixtures & fittings</div>
            <div className="mt-2 text-sm text-gray-700">
              Standard initial allowance: 20% for most assets
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="text-sm font-medium text-blue-700 mb-1">Pool C (10%)</div>
            <div className="text-xs text-gray-600">Buildings, structures, land improvements</div>
            <div className="mt-2 text-sm text-gray-700">
              Lower rate for long-lived assets with extended useful lives
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Total Asset Cost</div>
          <div className="mt-1 text-2xl font-semibold text-blue-600">
            {formatCurrency(totalCost)}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {assets.length} asset{assets.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Book Depreciation</div>
          <div className="mt-1 text-2xl font-semibold text-purple-600">
            {formatCurrency(totalBookDepreciation)}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Net book value: {formatCurrency(totalCost - totalBookDepreciation)}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Tax Allowances</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">
            {formatCurrency(totalTaxAllowances)}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Timing difference: {formatCurrency(totalBookDepreciation - totalTaxAllowances)}
          </div>
        </div>
      </div>

      {/* Add Asset Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>+</span> Add New Asset
        </button>
      </div>

      {/* IRD Pool Summary */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">IRD Pool Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {irpPools.map(pool => (
            <div key={pool.code} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-sm font-medium text-gray-900">{pool.name}</div>
                  <div className="text-xs text-gray-500">{pool.assets.length} asset{pool.assets.length !== 1 ? 's' : ''}</div>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                  {pool.rate * 100}%
                </span>
              </div>
              <div className="space-y-1 mt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Cost:</span>
                  <span className="font-medium">{formatCurrency(pool.totalCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Initial Allowance:</span>
                  <span className="font-medium text-green-600">{formatCurrency(pool.initialAllowance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Annual Allowance:</span>
                  <span className="font-medium text-green-600">{formatCurrency(pool.annualAllowance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax WDV:</span>
                  <span className="font-medium text-blue-600">{formatCurrency(pool.taxWDV)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Asset Register Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Fixed Asset Register</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pool
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Init.Allow
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ann.Allow
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Book WDV
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tax WDV
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                    No assets registered. Click "Add New Asset" to get started.
                  </td>
                </tr>
              ) : (
                assets.map((asset) => {
                  const bookDep = calculateBookDepreciation(asset);
                  const taxAllow = calculateTaxAllowances(asset);
                  
                  return (
                    <tr key={asset.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {asset.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {asset.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {asset.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatCurrency(asset.cost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          asset.pool === "A" ? "bg-blue-100 text-blue-800" :
                          asset.pool === "B" ? "bg-green-100 text-green-800" :
                          "bg-purple-100 text-purple-800"
                        }`}>
                          {asset.pool} ({asset.pool === "A" ? "30%" : asset.pool === "B" ? "20%" : "10%"})
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {formatCurrency(taxAllow.initialAllowance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {formatCurrency(taxAllow.annualAllowance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {formatCurrency(bookDep.bookWDV)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                        {formatCurrency(taxAllow.taxWDV)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          asset.status === "Active" ? "bg-green-100 text-green-800" :
                          asset.status === "Disposed" ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <select
                          value={asset.status}
                          onChange={(e) => handleStatusChange(asset.id, e.target.value)}
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Disposed">Disposed</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-6 py-3 text-sm font-medium text-gray-900">
                  <strong>TOTALS</strong>
                </td>
                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                  {formatCurrency(totalCost)}
                </td>
                <td className="px-6 py-3"></td>
                <td className="px-6 py-3 text-sm font-medium text-green-600">
                  {formatCurrency(irpPools.reduce((sum, pool) => sum + pool.initialAllowance, 0))}
                </td>
                <td className="px-6 py-3 text-sm font-medium text-green-600">
                  {formatCurrency(irpPools.reduce((sum, pool) => sum + pool.annualAllowance, 0))}
                </td>
                <td className="px-6 py-3 text-sm font-medium text-blue-600">
                  {formatCurrency(totalCost - totalBookDepreciation)}
                </td>
                <td className="px-6 py-3 text-sm font-medium text-purple-600">
                  {formatCurrency(irpPools.reduce((sum, pool) => sum + pool.taxWDV, 0))}
                </td>
                <td colSpan={2} className="px-6 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Add New Fixed Asset</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name</label>
                  <input
                    type="text"
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({...newAsset, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., Dell Laptop, Office Furniture"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newAsset.category}
                    onChange={(e) => setNewAsset({...newAsset, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="Computer Equipment">Computer Equipment</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Motor Vehicle">Motor Vehicle</option>
                    <option value="Machinery">Machinery</option>
                    <option value="Leasehold Improvement">Leasehold Improvement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={newAsset.date}
                    onChange={(e) => setNewAsset({...newAsset, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost (HK$)</label>
                  <input
                    type="number"
                    value={newAsset.cost}
                    onChange={(e) => setNewAsset({...newAsset, cost: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IRD Pool</label>
                  <select
                    value={newAsset.pool}
                    onChange={(e) => setNewAsset({...newAsset, pool: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="A">Pool A (30%) - Computers & Plant</option>
                    <option value="B">Pool B (20%) - Vehicles & Furniture</option>
                    <option value="C">Pool C (10%) - Buildings</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Useful Life (years)</label>
                  <input
                    type="number"
                    value={newAsset.life}
                    onChange={(e) => setNewAsset({...newAsset, life: parseInt(e.target.value) || 5})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Residual Value (HK$)</label>
                  <input
                    type="number"
                    value={newAsset.residual}
                    onChange={(e) => setNewAsset({...newAsset, residual: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAsset}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Add Asset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IRD Compliance Notes */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">IRD Tax Allowance Compliance Notes</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Initial allowance: 60% for qualifying plant/machinery purchased on or after specific dates (standard 20%)</li>
          <li>• Annual allowance: Calculated on reducing balance basis after deducting initial allowance</li>
          <li>• Pool A (30%): Computers, plant & machinery, qualifying equipment</li>
          <li>• Pool B (20%): Motor vehicles, furniture, fixtures & fittings</li>
          <li>• Pool C (10%): Buildings, structures, land improvements</li>
          <li>• Timing differences between book depreciation and tax allowances create deferred tax assets/liabilities</li>
          <li>• Assets must be used in the production of assessable profits to qualify for tax allowances</li>
        </ul>
      </div>
    </div>
  );
}