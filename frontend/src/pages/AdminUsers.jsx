import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import request from '../api/request';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import SortHeader from '../components/SortHeader';

export default function AdminUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ name: '', email: '', address: '', role: '' });
  const [sortBy, setSortBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', address: '', role: 'user' });
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    const params = new URLSearchParams({ sortBy, order });
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    const data = await request(`/admin/users?${params.toString()}`, { token });
    setUsers(data);
  }, [token, filters, sortBy, order]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleSort(field) {
    if (sortBy === field) setOrder(order === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(field);
      setOrder('asc');
    }
  }

  async function handleAddUser(e) {
    e.preventDefault();
    setError('');
    try {
      await request('/admin/users', { method: 'POST', token, body: form });
      setShowForm(false);
      setForm({ name: '', email: '', password: '', address: '', role: 'user' });
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function viewDetails(id) {
    const data = await request(`/admin/users/${id}`, { token });
    setSelected(data);
  }

  return (
    <Layout title="Manage users">
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
          <select
            value={filters.role}
            onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="user">Normal user</option>
            <option value="store_owner">Store owner</option>
          </select>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-indigo-700 whitespace-nowrap"
        >
          {showForm ? 'Cancel' : '+ Add user'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddUser} className="bg-white border border-slate-200 rounded-lg p-5 mb-6 grid grid-cols-2 gap-3 max-w-2xl">
          {error && <div className="col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}
          <input
            placeholder="Name (20-60 chars)"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="user">Normal user</option>
            <option value="admin">Admin</option>
            <option value="store_owner">Store owner</option>
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
            Create user
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
              <SortHeader label="Role" field="role" sortBy={sortBy} order={order} onSort={handleSort} />
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-sm text-slate-900">{u.name}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{u.email}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{u.address}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{u.role.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => viewDetails(u.id)} className="text-sm text-indigo-600">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">{selected.name}</h3>
            <p className="text-sm text-slate-600 mb-1"><strong>Email:</strong> {selected.email}</p>
            <p className="text-sm text-slate-600 mb-1"><strong>Address:</strong> {selected.address}</p>
            <p className="text-sm text-slate-600 mb-1"><strong>Role:</strong> {selected.role.replace('_', ' ')}</p>
            {selected.role === 'store_owner' && (
              <p className="text-sm text-slate-600 mb-1"><strong>Rating:</strong> {selected.rating ?? 'No ratings yet'}</p>
            )}
            <button onClick={() => setSelected(null)} className="mt-4 text-sm text-indigo-600">Close</button>
          </div>
        </div>
      )}
    </Layout>
  );
}
