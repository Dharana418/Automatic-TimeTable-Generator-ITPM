export function normalizeRoleKey(role) {
  return String(role || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[_-]+/g, '');
}

export function getDashboardPathByRole(role) {
  const roleKey = normalizeRoleKey(role);

  if (roleKey === 'admin') return '/dashboard/admin';
  if (roleKey === 'facultycoordinator') return '/dashboard/faculty-coordinator';
  if (roleKey === 'academiccoordinator') return '/dashboard/academic-coordinator';
  if (roleKey === 'lic') return '/dashboard/lic';
  if (roleKey === 'instructor') return '/dashboard/instructor';
  if (["lecturerseniorlecturer", "lecturer", "seniorlecturer", "assistantlecturer", "professor"].includes(roleKey)) {
    return '/dashboard/lecturer';
  }

  return '/dashboard/common';
}
