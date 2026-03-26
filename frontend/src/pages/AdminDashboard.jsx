import React from 'react';

const AdminDashboard = ({ user }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-slate-800">Admin Dashboard</h2>
      <p className="mt-2 text-slate-600">
        Welcome {user?.name || 'Admin'}. Admin controls are ready to be connected.
      </p>
    </div>
  );
};

export default AdminDashboard;
