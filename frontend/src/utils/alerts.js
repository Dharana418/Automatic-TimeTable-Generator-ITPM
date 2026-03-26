import Swal from 'sweetalert2';

const base = {
  confirmButtonColor: '#2563eb',
};

export const showSuccess = (title, text = '') => {
  return Swal.fire({
    ...base,
    icon: 'success',
    title,
    text,
    timer: 2200,
    showConfirmButton: false,
  });
};

export const showError = (title, text = '') => {
  return Swal.fire({
    ...base,
    icon: 'error',
    title,
    text,
  });
};

export const showWarning = (title, text = '') => {
  return Swal.fire({
    ...base,
    icon: 'warning',
    title,
    text,
  });
};

export const confirmDelete = async ({
  title = 'Are you sure?',
  text = 'This action cannot be undone.',
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel',
} = {}) => {
  const result = await Swal.fire({
    ...base,
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
    confirmButtonText,
    cancelButtonText,
  });

  return result.isConfirmed;
};

export const askForText = async ({
  title = 'Enter value',
  inputLabel = '',
  inputPlaceholder = '',
  confirmButtonText = 'Submit',
  cancelButtonText = 'Cancel',
  inputValue = '',
  validator,
} = {}) => {
  const result = await Swal.fire({
    ...base,
    title,
    input: 'text',
    inputLabel,
    inputPlaceholder,
    inputValue,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    inputValidator: (value) => {
      if (typeof validator === 'function') {
        return validator(value);
      }
      return !value ? 'This field is required' : null;
    },
  });

  return result.isConfirmed ? result.value : null;
};
