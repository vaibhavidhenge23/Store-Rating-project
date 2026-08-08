import { useEffect, useState, useCallback } from 'react';
import request from '../api/request';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import ChangePassword from '../components/ChangePassword';
import StarRating from '../components/StarRating';
import SortHeader from '../components/SortHeader';

export default function UserStores() {
  const { token } = useAuth();
  const [stores, setStores] = useState([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [loading, setLoading] = useState(true);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ sortBy, order });
    if (name) params.set('name', name);
    if (address) params.set('address', address);
    try {
      const data = await request(`/user/stores?${params.toString()}`, { token });
      setStores(data);
    } finally {
      setLoading(false);
    }
  }, [token, name, address, sortBy, order]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  function handleSort(field) {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('asc');
    }
  }

  async function submitRating(storeId, rating) {
    await request(`/user/ratings/${storeId}`, { method: 'POST', token, body: { rating } });
    fetchStores();
  }

  return (
    <Layout title="Browse stores">
      <div className="mb-6">
        <ChangePassword />
      </div>

      <div className="flex gap-3 mb-4">
        <input
          placeholder="Search by name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm w-64"
        />
        <input
          placeholder="Search by address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm w-64"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <SortHeader label="Name" field="name" sortBy={sortBy} order={order} onSort={handleSort} />
              <SortHeader label="Address" field="address" sortBy={sortBy} order={order} onSort={handleSort} />
              <SortHeader label="Overall rating" field="rating" sortBy={sortBy} order={order} onSort={handleSort} />
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Your rating</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr key={store.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-sm text-slate-900">{store.name}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{store.address}</td>
                <td className="px-4 py-3 text-sm text-slate-900">{Number(store.overall_rating).toFixed(1)}</td>
                <td className="px-4 py-3">
                  <StarRating value={store.my_rating || 0} onChange={(r) => submitRating(store.id, r)} />
                </td>
              </tr>
            ))}
            {!loading && stores.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                  No stores found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
