import React, { useEffect, useState } from 'react';
import { apiService, Category } from '../../services/api';

const ManagementCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    apiService.getCategories()
      .then((r) => {
        const data = r.data as any;
        setCategories(data.results || data || []);
      })
      .catch((err) => {
        console.error('Failed to load categories:', err);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editing) {
        await apiService.updateCategory(editing.id, form);
      } else {
        await apiService.createCategory(form);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', description: '' });
      load();
    } catch (err: any) {
      setError(err.response?.data?.name?.[0] || 'Failed to save.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
        <button
          type="button"
          onClick={() => { setEditing(null); setForm({ name: '', description: '' }); setShowForm(true); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Add category
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg space-y-3 max-w-md">
          <h3 className="font-medium">{editing ? 'Edit category' : 'New category'}</h3>
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
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              rows={2}
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
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{c.description || '-'}</td>
                  <td className="px-4 py-2">
                    <button type="button" onClick={() => { setEditing(c); setForm({ name: c.name, description: c.description || '' }); setShowForm(true); }} className="text-indigo-600 hover:text-indigo-800 text-sm">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {categories.length === 0 && <p className="text-gray-500 py-4">No categories yet. Add one above.</p>}
        </div>
      )}
    </div>
  );
};

export default ManagementCategories;
