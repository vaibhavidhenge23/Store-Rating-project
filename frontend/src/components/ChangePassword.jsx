import { useState } from 'react';
import request from '../api/request';
import { useAuth } from '../context/AuthContext';

export default function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { token } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword.length < 8 || newPassword.length > 16 || !/[A-Z]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      return setError('Password must be 8-16 characters with an uppercase letter and a special character');
    }

    try {
      await request('/auth/password', { method: 'PUT', token, body: { oldPassword, newPassword } });
      setMessage('Password updated');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm text-indigo-600 font-medium">
        Change password
      </button>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Change password</h3>
        <button onClick={() => setOpen(false)} className="text-slate-400 text-sm">✕</button>
      </div>
      {error && <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-2 py-1.5">{error}</div>}
      {message && <div className="mb-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-1.5">{message}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          placeholder="Current password"
          required
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        <input
          type="password"
          placeholder="New password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        <button type="submit" className="w-full bg-indigo-600 text-white rounded-md py-1.5 text-sm font-medium hover:bg-indigo-700">
          Update
        </button>
      </form>
    </div>
  );
}
