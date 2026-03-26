import React from 'react';

const toastStyles = {
  success: 'border-green-200 bg-green-50 text-green-700',
  error: 'border-red-200 bg-red-50 text-red-700',
};

const ToastMessage = ({ message, type = 'success', onClose }) => {
  if (!message) return null;

  return (
    <div className={`mb-4 flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${toastStyles[type] || toastStyles.success}`}>
      <span>{message}</span>
      <button
        type="button"
        className="ml-3 rounded px-2 py-1 text-xs font-semibold hover:bg-black/10"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
};

export default ToastMessage;
