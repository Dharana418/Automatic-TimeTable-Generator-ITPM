import React, { useEffect } from 'react';
import { motion as Motion } from 'framer-motion';

const toastStyles = {
  success: 'border-green-200 bg-green-50 text-green-700 shadow-lg shadow-green-500/20',
  error: 'border-red-200 bg-red-50 text-red-700 shadow-lg shadow-red-500/20',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-700 shadow-lg shadow-yellow-500/20',
  info: 'border-blue-200 bg-blue-50 text-blue-700 shadow-lg shadow-blue-500/20',
};

const toastPopInVariant = {
  hidden: {
    opacity: 0,
    scale: 0.3,
    y: -20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
      duration: 0.5,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    x: 400,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

const ToastMessage = ({ message, type = 'success', onClose, autoClose = 3000 }) => {
  useEffect(() => {
    if (autoClose && message) {
      const timer = setTimeout(() => {
        onClose?.();
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, message, onClose]);

  if (!message) return null;

  return (
    <Motion.div
      className={`mb-4 flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium ${toastStyles[type] || toastStyles.success}`}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={toastPopInVariant}
    >
      <span>{message}</span>
      <Motion.button
        type="button"
        className="ml-3 rounded px-2 py-1 text-xs font-semibold hover:bg-black/10 transition-colors"
        onClick={onClose}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Close
      </Motion.button>
    </Motion.div>
  );
};

export default ToastMessage;
