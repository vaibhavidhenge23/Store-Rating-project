import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import request from '../api/request';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import SortHeader from '../components/SortHeader';

export default function AdminStores() {
  const { token } = useAuth();
  const [stores, setStores] = useState([]);
  const [owners, setOwners] = useState([]);
  const [filters, setFilters] = useState({ name: '', email: '', address: '' });
  const [sortBy, setSortBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', address: '', ownerId: '' });
  const [error, setError] = useState('');

  const fetchStores = useCallback(async () => {
    const params = new URLSearchParams({ sortBy, order });
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    const data = await request(`/admin/stores?${params.toString()}`, { token });
    setStores(data);
  }, [token, filters, sortBy, order]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  useEffect(() => {
    request(`/admin/users?role=store_owner`, { token }).then(setOwners);
  }, [token]);

  function handleSort(field) {
    if (sortBy === field) setOrder(order === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(field);
      setOrder('asc');
    }
  }

  async function handleAddStore(e) {
    e.preventDefault();
    setError('');
    try {
      await request('/admin/stores', {
        method: 'POST',
        token,
        body: { ...form, ownerId: form.ownerId ? Number(form.ownerId) : null },
      });
      setShowForm(false);
      setForm({ name: '', email: '', address: '', ownerId: '' });
      fetchStores();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout title="Manage stores">
      <Link to="/admin" className="text-sm text-indigo-600 mb-4 inline-block">← Back to dashboard</Link>

      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 flex-wrap">
          <input
            placeholder="Name"
            value={filters.name}
            onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm w-40"
          />
          <input
            placeholder="Email"
            value={filters.email}
            onChange={(e) => setFilters((f) => ({ ...f, email: e.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm w-40"
          />
          <input
            placeholder="Address"
            value={filters.address}
            onChange={(e) => setFilters((f) => ({ ...f, address: e.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm w-40"
          />
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-indigo-700 whitespace-nowrap"
        >
          {showForm ? 'Cancel' : '+ Add store'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddStore} className="bg-white border border-slate-200 rounded-lg p-5 mb-6 grid grid-cols-2 gap-3 max-w-2xl">
          {error && <div className="col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}
          <input
            placeholder="Store name (20-60 chars)"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Store email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={form.ownerId}
            onChange={(e) => setForm((f) => ({ ...f, ownerId: e.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm col-span-2"
          >
            <option value="">No owner assigned</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>{o.name} ({o.email})</option>
            ))}
          </select>
          <textarea
            placeholder="Address"
            required
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm col-span-2"
            rows={2}
          />
          <button type="submit" className="bg-indigo-600 text-white rounded-md py-2 text-sm font-medium hover:bg-indigo-700 col-span-2">
            Create store
          </button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <SortHeader label="Name" field="name" sortBy={sortBy} order={order} onSort={handleSort} />
              <SortHeader label="Email" field="email" sortBy={sortBy} order={order} onSort={handleSort} />
              <SortHeader label="Address" field="address" sortBy={sortBy} order={order} onSort={handleSort} />
              <SortHeader label="Rating" field="rating" sortBy={sortBy} order={order} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {stores.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-sm text-slate-900">{s.name}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{s.email}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{s.address}</td>
                <td className="px-4 py-3 text-sm text-slate-900">{Number(s.rating).toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
