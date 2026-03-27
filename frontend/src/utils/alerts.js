import Swal from 'sweetalert2';

const base = {
  confirmButtonColor: '#2563eb',
};

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

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

export const editBatchPrompt = async ({
  batchId = '',
  batchName = '',
  capacity = '',
  specializationKey = '',
  specializationSize = '',
  specializations = [],
} = {}) => {
  const optionsHtml = specializations
    .map(
      (s) =>
        `<option value="${escapeHtml(s.key)}" ${s.key === specializationKey ? 'selected' : ''}>${escapeHtml(s.label)}</option>`,
    )
    .join('');

  const html = `
    <div style="text-align: left; display: flex; flex-direction: column; gap: 12px;">
      <div>
        <label style="display: block; font-weight: 600; margin-bottom: 4px; color: #1f2937; font-size: 14px;">Batch Name</label>
        <input 
          id="edit-batch-name" 
          class="swal2-input" 
          placeholder="Batch Name" 
          value="${escapeHtml(batchName)}"
          style="width: 100%;"
        />
      </div>
      <div>
        <label style="display: block; font-weight: 600; margin-bottom: 4px; color: #1f2937; font-size: 14px;">Batch Size</label>
        <input 
          id="edit-batch-capacity" 
          class="swal2-input" 
          type="number" 
          min="0" 
          placeholder="Batch Size" 
          value="${escapeHtml(capacity)}"
          style="width: 100%;"
        />
      </div>
      <div>
        <label style="display: block; font-weight: 600; margin-bottom: 4px; color: #1f2937; font-size: 14px;">Specialization</label>
        <select 
          id="edit-specialization-key"
          style="width: 100%; padding: 8px; border: 1px solid #E2E8F0; border-radius: 4px; font-size: 14px;"
        >
          ${optionsHtml}
        </select>
      </div>
      <div>
        <label style="display: block; font-weight: 600; margin-bottom: 4px; color: #1f2937; font-size: 14px;">Specialization Size</label>
        <input 
          id="edit-specialization-size" 
          class="swal2-input" 
          type="number" 
          min="0" 
          placeholder="Specialization Size" 
          value="${escapeHtml(specializationSize)}"
          style="width: 100%;"
        />
      </div>
    </div>
  `;

  const result = await Swal.fire({
    ...base,
    title: `Edit Batch: ${batchId}`,
    html,
    showCancelButton: true,
    confirmButtonText: 'Update Batch',
    cancelButtonText: 'Cancel',
    preConfirm: () => {
      const nameEl = document.getElementById('edit-batch-name');
      const capacityEl = document.getElementById('edit-batch-capacity');
      const specializationKeyEl = document.getElementById('edit-specialization-key');
      const specializationSizeEl = document.getElementById('edit-specialization-size');

      return {
        name: nameEl?.value || '',
        capacity: capacityEl?.value || '',
        specialization_key: specializationKeyEl?.value || '',
        specialization_size: specializationSizeEl?.value || '',
      };
    },
    didOpen: () => {
      // Focus first input
      document.getElementById('edit-batch-name').focus();
    },
  });

  if (!result.isConfirmed) {
    return null;
  }

  return result.value;
};
