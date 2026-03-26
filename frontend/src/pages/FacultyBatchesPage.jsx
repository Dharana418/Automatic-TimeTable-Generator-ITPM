import React from 'react';

export default function FacultyBatchesPage({ user }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Faculty Batches</h1>
      <p className="mt-2 text-slate-600">
        Batch management is not available yet for {user?.name || 'this account'}.
      </p>
    </div>
  );
}
