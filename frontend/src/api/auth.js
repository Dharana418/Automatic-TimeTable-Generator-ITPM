const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || data?.message || 'Request failed');
  }
  return data;
}

export async function requestPasswordReset(email) {
  const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  return parseJson(response);
}

export async function resetPassword(token, password) {
  const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });

  return parseJson(response);
}
