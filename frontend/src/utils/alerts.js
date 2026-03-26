import Swal from 'sweetalert2';

const buildText = (title, text) => {
  if (typeof text === 'string' && text.trim().length > 0) return text;
  return '';
};

export async function showSuccess(title = 'Success', text = '') {
  await Swal.fire({
    icon: 'success',
    title,
    text: buildText(title, text),
    confirmButtonText: 'OK',
  });
}

export async function showError(title = 'Error', text = '') {
  await Swal.fire({
    icon: 'error',
    title,
    text: buildText(title, text),
    confirmButtonText: 'OK',
  });
}

export async function showWarning(title = 'Warning', text = '') {
  await Swal.fire({
    icon: 'warning',
    title,
    text: buildText(title, text),
    confirmButtonText: 'OK',
  });
}

export async function confirmDelete(options = {}) {
  const {
    title = 'Are you sure?',
    text = 'This action cannot be undone.',
    confirmButtonText = 'Delete',
    cancelButtonText = 'Cancel',
  } = options;

  const result = await Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    focusCancel: true,
  });

  return Boolean(result.isConfirmed);
}

export async function askForText(options = {}) {
  const {
    title = 'Enter value',
    text = '',
    inputLabel = '',
    inputPlaceholder = '',
    confirmButtonText = 'Submit',
    cancelButtonText = 'Cancel',
    inputValue = '',
    validator,
  } = options;

  const result = await Swal.fire({
    title,
    text,
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
      if (!value || !String(value).trim()) {
        return 'Please enter a value';
      }
      return undefined;
    },
  });

  if (!result.isConfirmed) return null;
  return String(result.value ?? '').trim();
}
