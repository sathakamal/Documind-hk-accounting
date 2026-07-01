"use client";

import { useState, useEffect } from "react";

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
    <div className="hk-page">
      <div className="hk-card">
        <div className="hk-card-h">
          <h3>🏗 Fixed Asset Register & IRD Pools</h3>
          <button onClick={() => setShowAddModal(true)} className="hk-btn hk-btn-n hk-btn-s">+ Asset</button>
        </div>

        <div className="hk-alert hk-a-info">
          IRD Pooling: Pool A (30% - computers), Pool B (20% - vehicles/furniture), Pool C (10% - buildings). Initial allowance = 60% for qualifying plant/machinery purchased on or after specific dates (standard 20%).
        </div>

        <div className="hk-grid hk-g3" style={{ marginBottom: "14px" }}>
          <div className="hk-stat" style={{ "--c": "var(--blue)" } as React.CSSProperties}>
            <div className="lb">Total Asset Cost</div>
            <div className="vl">{formatCurrency(totalCost)}</div>
            <div className="sub">{assets.length} asset{assets.length !== 1 ? "s" : ""}</div>
          </div>
          <div className="hk-stat" style={{ "--c": "var(--purple)" } as React.CSSProperties}>
            <div className="lb">Book Depreciation</div>
            <div className="vl">{formatCurrency(totalBookDepreciation)}</div>
            <div className="sub">Net book value: {formatCurrency(totalCost - totalBookDepreciation)}</div>
          </div>
          <div className="hk-stat" style={{ "--c": "var(--green)" } as React.CSSProperties}>
            <div className="lb">Tax Allowances</div>
            <div className="vl">{formatCurrency(totalTaxAllowances)}</div>
            <div className="sub">Timing difference: {formatCurrency(totalBookDepreciation - totalTaxAllowances)}</div>
          </div>
        </div>

        <div className="hk-tw">
          <table className="hk-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Category</th>
                <th>Date</th>
                <th className="hk-nm">Cost</th>
                <th>Pool</th>
                <th className="hk-nm">Init.Allow</th>
                <th className="hk-nm">Ann.Allow</th>
                <th className="hk-nm">Book WDV</th>
                <th className="hk-nm">Tax WDV</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center text-muted-foreground py-8">
                    No assets registered. Click "+ Asset" to get started.
                  </td>
                </tr>
              ) : (
                assets.map((asset) => {
                  const bookDep = calculateBookDepreciation(asset);
                  const taxAllow = calculateTaxAllowances(asset);
                  
                  return (
                    <tr key={asset.id}>
                      <td>{asset.name}</td>
                      <td>{asset.category}</td>
                      <td>{asset.date}</td>
                      <td className="hk-nm">{formatCurrency(asset.cost)}</td>
                      <td>
                        <span className={`hk-badge ${
                          asset.pool === "A" ? "hk-b-blue" :
                          asset.pool === "B" ? "hk-b-green" :
                          "hk-b-purple"
                        }`}>
                          {asset.pool} ({asset.pool === "A" ? "30%" : asset.pool === "B" ? "20%" : "10%"})
                        </span>
                      </td>
                      <td className="hk-nm">{formatCurrency(taxAllow.initialAllowance)}</td>
                      <td className="hk-nm">{formatCurrency(taxAllow.annualAllowance)}</td>
                      <td className="hk-nm">{formatCurrency(bookDep.bookWDV)}</td>
                      <td className="hk-nm">{formatCurrency(taxAllow.taxWDV)}</td>
                      <td>
                        <select
                          value={asset.status}
                          onChange={(e) => handleStatusChange(asset.id, e.target.value)}
                          className="hk-input"
                          style={{ minWidth: "110px", padding: "6px 8px" }}
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
            <tfoot>
              <tr>
                <td colSpan={3}><strong>Totals</strong></td>
                <td className="hk-nm">{formatCurrency(totalCost)}</td>
                <td></td>
                <td className="hk-nm">{formatCurrency(irpPools.reduce((sum, pool) => sum + pool.initialAllowance, 0))}</td>
                <td className="hk-nm">{formatCurrency(irpPools.reduce((sum, pool) => sum + pool.annualAllowance, 0))}</td>
                <td className="hk-nm">{formatCurrency(totalCost - totalBookDepreciation)}</td>
                <td className="hk-nm">{formatCurrency(irpPools.reduce((sum, pool) => sum + pool.taxWDV, 0))}</td>
                <td></td>
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

      <div className="hk-card">
        <div className="hk-card-h">
          <h3>📊 IRD Pool Summary</h3>
        </div>
        <div className="hk-grid hk-g3">
          {irpPools.map(pool => (
            <div key={pool.code} className="hk-notes-box">
              <h4>{pool.name}</h4>
              <ul>
                <li>Total Cost: {formatCurrency(pool.totalCost)}</li>
                <li>Initial Allowance: {formatCurrency(pool.initialAllowance)}</li>
                <li>Annual Allowance: {formatCurrency(pool.annualAllowance)}</li>
                <li>Tax WDV: {formatCurrency(pool.taxWDV)}</li>
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="hk-notes-box">
        <h4>IRD Tax Allowance Compliance Notes</h4>
        <ul>
          <li>Initial allowance may be 60% for qualifying plant and machinery on applicable purchases, otherwise standard 20%.</li>
          <li>Annual allowance is calculated on reducing balance after deducting initial allowance.</li>
          <li>Pool A (30%): computers, plant & machinery, qualifying equipment.</li>
          <li>Pool B (20%): motor vehicles, furniture, fixtures & fittings.</li>
          <li>Pool C (10%): buildings, structures, land improvements.</li>
          <li>Timing differences between book depreciation and tax allowances create deferred tax balances.</li>
        </ul>
      </div>
    </div>
  );
}
