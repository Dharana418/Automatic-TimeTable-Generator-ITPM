import React from 'react';

const FacultyBatchesPage = ({ user }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-slate-800">Faculty Batches</h2>
      <p className="mt-2 text-slate-600">
        Batch management UI is not configured yet for {user?.name || 'this account'}.
      </p>
    </div>
  );
};

export default FacultyBatchesPage;
