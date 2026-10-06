export const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

// Shared fetch: token attach, 401 -> back to login, network failure -> Error('unreachable').
// ponytail: one helper instead of try/catch copied across pages.
export async function api(path, opts = {}) {
  const token = localStorage.getItem('token');
  let res;
  try {
    res = await fetch(API_BASE + path, {
      ...opts,
      headers: { ...(opts.headers || {}), ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    });
  } catch {
    throw new Error('unreachable');
  }
  if (res.status === 401) {
    localStorage.removeItem('token');
    location.href = '/login';
    throw new Error('unauthorized');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'request failed');
  return data;
}
