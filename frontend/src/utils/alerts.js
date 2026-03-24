let swalPromise;

async function getSwal() {
  if (!swalPromise) {
    swalPromise = import('https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm')
      .then((mod) => mod.default || mod)
      .catch(() => null);
  }
  return swalPromise;
}

// Beautiful base styling for modals
const getBeautifulModalConfig = () => ({
  customClass: {
    container: 'swal-beautiful-container',
    popup: 'swal-beautiful-popup',
    title: 'swal-beautiful-title',
    htmlContainer: 'swal-beautiful-html',
    confirmButton: 'swal-beautiful-confirm',
    cancelButton: 'swal-beautiful-cancel',
    input: 'swal-beautiful-input',
  },
  didOpen: (modal) => {
    modal.style.borderRadius = '16px';
    modal.style.boxShadow = '0 10px 50px rgba(0,0,0,0.2)';
    modal.style.border = '1px solid rgba(255,255,255,0.1)';
    modal.style.backdropFilter = 'blur(10px)';
    modal.style.animation = 'slideInDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
  },
  allowOutsideClick: false,
  allowEscapeKey: false,
  showClass: {
    popup: 'animate__animated animate__fadeInScale',
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOutScale',
  },
});

async function showToast(icon, title, text = '') {
  const Swal = await getSwal();
  if (!Swal) {
    window.alert([title, text].filter(Boolean).join('\n'));
    return;
  }

  const iconColors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };

  const toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
    customClass: {
      popup: 'swal-beautiful-toast',
      timerProgressBar: 'swal-beautiful-timer',
    },
    didOpen: (modal) => {
      modal.style.borderRadius = '12px';
      modal.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
      modal.style.border = `2px solid ${iconColors[icon] || '#3b82f6'}`;
      modal.style.backdropFilter = 'blur(10px)';
      modal.style.animation = 'slideInRight 0.3s ease-out';
    },
  });

  return toast.fire({ icon, title, text });
}

export const showSuccess = (title, text = '') => showToast('success', title, text);
export const showError = (title, text = '') => showToast('error', title, text);
export const showWarning = (title, text = '') => showToast('warning', title, text);
export const showInfo = (title, text = '') => showToast('info', title, text);

// Beautiful success modal
export const showSuccessModal = async (title, text = '') => {
  const Swal = await getSwal();
  if (!Swal) {
    window.alert([title, text].filter(Boolean).join('\n'));
    return;
  }

  return Swal.fire({
    ...getBeautifulModalConfig(),
    icon: 'success',
    title,
    html: text,
    confirmButtonText: 'Great!',
    confirmButtonColor: '#10b981',
    allowOutsideClick: true,
    allowEscapeKey: true,
  });
};

// Beautiful error modal
export const showErrorModal = async (title, text = '') => {
  const Swal = await getSwal();
  if (!Swal) {
    window.alert([title, text].filter(Boolean).join('\n'));
    return;
  }

  return Swal.fire({
    ...getBeautifulModalConfig(),
    icon: 'error',
    title,
    html: text,
    confirmButtonText: 'Okay',
    confirmButtonColor: '#ef4444',
    allowOutsideClick: true,
    allowEscapeKey: true,
  });
};

// Beautiful confirmation with custom text
export const confirmDelete = async ({
  title = 'Delete Item?',
  text = 'This action cannot be undone. Are you sure?',
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel',
} = {}) => {
  const Swal = await getSwal();
  if (!Swal) {
    return window.confirm([title, text].filter(Boolean).join('\n'));
  }

  const result = await Swal.fire({
    ...getBeautifulModalConfig(),
    icon: 'warning',
    title,
    html: text,
    showCancelButton: true,
    confirmButtonText,
    confirmButtonColor: '#ef4444',
    cancelButtonText,
    cancelButtonColor: '#6b7280',
    reverseButtons: true,
    buttonsStyling: true,
  });

  return result.isConfirmed;
};

// Beautiful text input prompt
export const askForText = async ({
  title = 'Enter Information',
  inputLabel = '',
  confirmButtonText = 'Submit',
  inputPlaceholder = '',
  validationMessage = 'This field is required',
  required = true,
  inputValue = '',
} = {}) => {
  const Swal = await getSwal();
  if (!Swal) {
    const value = window.prompt(`${title || 'Input'}\n${inputLabel || ''}`, inputValue) || '';
    const trimmed = value.trim();
    if (!required) return trimmed;
    return trimmed || null;
  }

  const result = await Swal.fire({
    ...getBeautifulModalConfig(),
    title,
    input: 'textarea',
    inputLabel,
    inputPlaceholder,
    inputValue,
    inputAttributes: {
      'aria-label': inputLabel || title,
      style: 'border-radius: 8px; padding: 12px; border: 2px solid #e5e7eb; font-family: inherit;',
    },
    showCancelButton: true,
    confirmButtonText,
    confirmButtonColor: '#3b82f6',
    cancelButtonText: 'Cancel',
    cancelButtonColor: '#6b7280',
    preConfirm: (value) => {
      const trimmed = String(value || '').trim();
      if (required && !trimmed) {
        Swal.showValidationMessage(validationMessage);
        return false;
      }
      return trimmed;
    },
  });

  if (!result.isConfirmed) return null;
  return result.value;
};

// Beautiful email input prompt
export const askForEmail = async ({
  title = 'Enter Email Address',
  confirmButtonText = 'Submit',
  inputPlaceholder = 'user@example.com',
  validationMessage = 'Please enter a valid email address',
} = {}) => {
  const Swal = await getSwal();
  if (!Swal) {
    return window.prompt(title, '') || null;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const result = await Swal.fire({
    ...getBeautifulModalConfig(),
    title,
    input: 'email',
    inputPlaceholder,
    inputAttributes: {
      style: 'border-radius: 8px; padding: 12px; border: 2px solid #e5e7eb;',
    },
    showCancelButton: true,
    confirmButtonText,
    confirmButtonColor: '#3b82f6',
    cancelButtonText: 'Cancel',
    cancelButtonColor: '#6b7280',
    preConfirm: (value) => {
      const trimmed = String(value || '').trim();
      if (!emailRegex.test(trimmed)) {
        Swal.showValidationMessage(validationMessage);
        return false;
      }
      return trimmed;
    },
  });

  return result.isConfirmed ? result.value : null;
};

// Beautiful number input prompt
export const askForNumber = async ({
  title = 'Enter a Number',
  confirmButtonText = 'Submit',
  inputPlaceholder = '0',
  min = 0,
  max = 100,
  validationMessage = 'Please enter a valid number',
} = {}) => {
  const Swal = await getSwal();
  if (!Swal) {
    const value = window.prompt(title, '');
    return value ? parseInt(value, 10) : null;
  }

  const result = await Swal.fire({
    ...getBeautifulModalConfig(),
    title,
    input: 'number',
    inputPlaceholder,
    inputAttributes: {
      min,
      max,
      style: 'border-radius: 8px; padding: 12px; border: 2px solid #e5e7eb;',
    },
    showCancelButton: true,
    confirmButtonText,
    confirmButtonColor: '#3b82f6',
    cancelButtonText: 'Cancel',
    cancelButtonColor: '#6b7280',
    preConfirm: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num) || num < min || num > max) {
        Swal.showValidationMessage(`${validationMessage} (${min}-${max})`);
        return false;
      }
      return num;
    },
  });

  return result.isConfirmed ? result.value : null;
};

// Beautiful select/choice prompt
export const askForChoice = async ({
  title = 'Select an Option',
  options = [],
  confirmButtonText = 'Select',
} = {}) => {
  const Swal = await getSwal();
  if (!Swal) {
    const optionStr = options.map((o, i) => `${i + 1}. ${o.label}`).join('\n');
    const choice = window.prompt(`${title}\n\n${optionStr}`, '1');
    const idx = parseInt(choice, 10) - 1;
    return idx >= 0 && idx < options.length ? options[idx].value : null;
  }

  const optionsHtml = options
    .map((o) => `<option value="${o.value}">${o.label}</option>`)
    .join('');

  const result = await Swal.fire({
    ...getBeautifulModalConfig(),
    title,
    html: `<select id="selectChoice" style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid #e5e7eb; font-family: inherit; font-size: 16px;">${optionsHtml}</select>`,
    showCancelButton: true,
    confirmButtonText,
    confirmButtonColor: '#3b82f6',
    cancelButtonText: 'Cancel',
    cancelButtonColor: '#6b7280',
    didOpen: (modal) => {
      const baseConfig = getBeautifulModalConfig();
      if (baseConfig.didOpen) baseConfig.didOpen(modal);
      const select = document.getElementById('selectChoice');
      if (select) select.focus();
    },
    preConfirm: () => {
      const select = document.getElementById('selectChoice');
      return select?.value || null;
    },
  });

  return result.isConfirmed ? result.value : null;
};
