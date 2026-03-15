import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, Inventory, Product } from '../../services/api';

const ManagementInventory: React.FC = () => {
  const { selectedProfile } = useAuth();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockForm, setStockForm] = useState({ product_id: 0, quantity: 1, notes: '' });
  const [stockSubmitting, setStockSubmitting] = useState(false);

  const branchId = selectedProfile?.branch_id;

  useEffect(() => {
    if (!branchId) return;
    setLoading(true);
    // Inventory is branch-specific
    apiService.getInventory({ branch_id: branchId })
      .then((r) => {
        const data = (r.data as any);
        setInventory(Array.isArray(data) ? data : data.results || []);
      })
      .catch(() => setInventory([]))
      .finally(() => setLoading(false));
      
    // Products are global, fetch all for the dropdown
    apiService.getProducts({})
      .then((r) => {
        const data = (r.data as any);
        setProducts(data.results || data.data || []);
      })
      .catch(() => setProducts([]));
  }, [branchId]);

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockForm.product_id || stockForm.quantity < 1) return;
    setStockSubmitting(true);
    try {
      await apiService.stockIn({
        product_id: stockForm.product_id,
        quantity: stockForm.quantity,
        notes: stockForm.notes || undefined,
      });
      setStockForm({ product_id: 0, quantity: 1, notes: '' });
      if (branchId) {
        apiService.getInventory({ branch_id: branchId }).then((r) => {
          const data = (r.data as any);
          setInventory(Array.isArray(data) ? data : data.results || []);
        });
      }
    } finally {
      setStockSubmitting(false);
    }
  };

  if (!branchId) {
    return <p className="text-gray-500">Select a branch to manage inventory.</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Inventory & Stock In</h2>
      <form onSubmit={handleStockIn} className="bg-gray-50 p-4 rounded-lg space-y-3 max-w-md">
        <h3 className="font-medium">Stock In</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700">Product *</label>
          <select
            value={stockForm.product_id}
            onChange={(e) => setStockForm((f) => ({ ...f, product_id: Number(e.target.value) }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            required
          >
            <option value={0}>Select product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.barcode})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Quantity *</label>
          <input
            type="number"
            min={1}
            value={stockForm.quantity}
            onChange={(e) => setStockForm((f) => ({ ...f, quantity: Number(e.target.value) || 1 }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <input
            type="text"
            value={stockForm.notes}
            onChange={(e) => setStockForm((f) => ({ ...f, notes: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        <button type="submit" disabled={stockSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">Record Stock In</button>
      </form>
      <div>
        <h3 className="font-medium text-gray-900 mb-2">Current inventory (this branch)</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Min</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{inv.product_name || inv.product_barcode}</td>
                    <td className="px-4 py-2 text-sm text-right">{inv.quantity}</td>
                    <td className="px-4 py-2 text-sm text-right">{inv.minimum_stock}</td>
                    <td className="px-4 py-2">
                      {inv.is_low_stock ? <span className="text-red-600 font-medium">Low stock</span> : <span className="text-green-600">OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {inventory.length === 0 && <p className="text-gray-500 py-4">No inventory for this branch.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagementInventory;
