import React from 'react';

export default function Profile({ user }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
      <p className="mt-2 text-slate-600">Name: {user?.name || 'N/A'}</p>
      <p className="text-slate-600">Email: {user?.email || 'N/A'}</p>
      <p className="text-slate-600">Role: {user?.role || 'N/A'}</p>
    </div>
  );
}
