import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import request from '../api/request';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    request('/admin/dashboard', { token }).then(setStats);
  }, [token]);

  return (
    <Layout title="Admin dashboard">
      <div className="grid grid-cols-3 gap-4 mb-8 max-w-2xl">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <p className="text-xs text-slate-500 mb-1">Total users</p>
          <p className="text-2xl font-semibold text-slate-900">{stats?.totalUsers ?? '—'}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <p className="text-xs text-slate-500 mb-1">Total stores</p>
          <p className="text-2xl font-semibold text-slate-900">{stats?.totalStores ?? '—'}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <p className="text-xs text-slate-500 mb-1">Total ratings</p>
          <p className="text-2xl font-semibold text-slate-900">{stats?.totalRatings ?? '—'}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Link to="/admin/users" className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-indigo-700">
          Manage users
        </Link>
        <Link to="/admin/stores" className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-indigo-700">
          Manage stores
        </Link>
      </div>
    </Layout>
  );
}
