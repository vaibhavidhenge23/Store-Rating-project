import { useEffect, useState } from 'react';
import request from '../api/request';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import ChangePassword from '../components/ChangePassword';

export default function StoreOwnerDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    request('/store-owner/dashboard', { token })
      .then(setData)
      .catch((err) => setError(err.message));
  }, [token]);

  return (
    <Layout title="Your store">
      <div className="mb-6">
        <ChangePassword />
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <p className="text-xs text-slate-500 mb-1">Store</p>
              <p className="text-lg font-semibold text-slate-900">{data.store.name}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <p className="text-xs text-slate-500 mb-1">Average rating</p>
              <p className="text-lg font-semibold text-slate-900">{data.averageRating} / 5</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-900">Ratings received</h2>
            </div>
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">User</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Rating</th>
                </tr>
              </thead>
              <tbody>
                {data.raters.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-sm text-slate-900">{r.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{r.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-900">{r.rating}</td>
                  </tr>
                ))}
                {data.raters.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-400">
                      No ratings yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Layout>
  );
}
