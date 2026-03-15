import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';

interface CustomerRow {
  id: number;
  name: string;
  phone_number: string;
  email?: string;
  total_points: number;
  points_redeemed: number;
  available_points?: number;
  is_active: boolean;
}

const ManagementCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone_number: '', email: '' });
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    apiService.getCustomers()
      .then((r) => {
        const data = (r.data as any);
        setCustomers(Array.isArray(data) ? data : data.results || data.customers || []);
      })
      .catch((err) => {
        console.error('Failed to load customers:', err);
        setCustomers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiService.registerCustomer(form);
      setShowForm(false);
      setForm({ name: '', phone_number: '', email: '' });
      load();
    } catch (err: any) {
      const msg = err.response?.data?.phone_number?.[0] || err.response?.data?.error || 'Failed to register.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Loyalty customers</h2>
        <button
          type="button"
          onClick={() => { setForm({ name: '', phone_number: '', email: '' }); setShowForm(true); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Register customer
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg space-y-3 max-w-md">
          <h3 className="font-medium">New customer</h3>
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
            <label className="block text-sm font-medium text-gray-700">Phone *</label>
            <input
              type="text"
              value={form.phone_number}
              onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Register</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-md">Cancel</button>
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
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Points</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{c.phone_number}</td>
                  <td className="px-4 py-2 text-sm text-right">{c.available_points ?? (c.total_points - c.points_redeemed)}</td>
                  <td className="px-4 py-2 text-sm">{c.is_active ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length === 0 && <p className="text-gray-500 py-4">No customers yet.</p>}
        </div>
      )}
    </div>
  );
};

export default ManagementCustomers;
