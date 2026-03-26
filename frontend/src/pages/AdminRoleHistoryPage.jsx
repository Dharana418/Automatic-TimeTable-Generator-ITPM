import React from 'react';

const AdminRoleHistoryPage = ({ user }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-slate-800">Admin Role History</h2>
      <p className="mt-2 text-slate-600">
        Role assignment history view is available for {user?.name || 'Admin'}.
      </p>
    </div>
  );
};

export default AdminRoleHistoryPage;
