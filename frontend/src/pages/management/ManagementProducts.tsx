import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, Product, Category } from '../../services/api';

const ManagementProducts: React.FC = () => {
  const { selectedProfile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: '',
    barcode: '',
    category: '',
    price: '',
    buying_price: '',
    brand: '',
    size: '',
    age: '',
    is_active: true,
  });
  const [error, setError] = useState<string | null>(null);

  const branchId = selectedProfile?.branch_id;

  const load = () => {
    // Products are global now, so we don't strictly need branchId to fetch them,
    // but we might want to keep the check if the user shouldn't see anything without a branch.
    // For now, let's allow fetching global products even if branchId is missing, 
    // or keep it if we want to enforce branch context. 
    // The user asked to remove branch filtering for product list.
    
    setLoading(true);
    // Fetch all products (global)
    apiService.getProducts({}).then((r) => {
      setProducts(Array.isArray(r.data.results) ? r.data.results : (r.data as any).data || []);
      setLoading(false);
    }).catch(() => {
      setProducts([]);
      setLoading(false);
    });
    apiService.getCategories().then((r) => {
      setCategories(Array.isArray(r.data.results) ? r.data.results : (r.data as any).data || []);
    }).catch(() => setCategories([]));
  };

  useEffect(() => {
    load();
  }, []); // Load once on mount, products are global

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = {
      name: form.name.trim(),
      barcode: form.barcode.trim(),
      category: Number(form.category),
      price: form.price || '0',
      buying_price: form.buying_price || '0',
      brand: form.brand.trim(),
      size: form.size.trim(),
      age: form.age.trim(),
      is_active: form.is_active,
      branch: branchId,
    };
    try {
      if (editing) {
        await apiService.updateProduct(editing.id, payload);
      } else {
        await apiService.createProduct(payload);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', barcode: '', category: '', price: '', buying_price: '', brand: '', size: '', age: '', is_active: true });
      load();
    } catch (err: any) {
      setError(err.response?.data?.barcode?.[0] || err.response?.data?.name?.[0] || 'Failed to save.');
    }
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      barcode: p.barcode,
      category: String(p.category),
      price: p.price,
      buying_price: (p as any).buying_price || '',
      brand: p.brand || '',
      size: p.size || '',
      age: p.age || '',
      is_active: p.is_active,
    });
    setShowForm(true);
  };

  if (!branchId) {
    return <p className="text-gray-500">Select a branch to manage products.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Products</h2>
        <button
          type="button"
          onClick={() => { setEditing(null); setForm({ name: '', barcode: '', category: '', price: '', buying_price: '', brand: '', size: '', age: '', is_active: true }); setShowForm(true); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Add product
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg space-y-3 max-w-lg">
          <h3 className="font-medium">{editing ? 'Edit product' : 'New product'}</h3>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Barcode *</label>
            <input
              type="text"
              value={form.barcode}
              onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
              disabled={!!editing}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category *</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            >
              <option value="">Select...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Selling price</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Buying price</label>
              <input
                type="number"
                step="0.01"
                value={form.buying_price}
                onChange={(e) => setForm((f) => ({ ...f, buying_price: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Brand</label>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 border border-gray-300 rounded-md">Cancel</button>
          </div>
        </form>
      )}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Barcode</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2 text-sm text-gray-900">{p.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{p.barcode}</td>
                  <td className="px-4 py-2 text-sm">{p.category_name || '-'}</td>
                  <td className="px-4 py-2 text-sm text-right">{p.price}</td>
                  <td className="px-4 py-2 text-sm text-right">{p.current_stock ?? '-'}</td>
                  <td className="px-4 py-2">
                    <button type="button" onClick={() => openEdit(p)} className="text-indigo-600 hover:text-indigo-800 text-sm">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && <p className="text-gray-500 py-4">No products for this branch yet. Add one above.</p>}
        </div>
      )}
    </div>
  );
};

export default ManagementProducts;
