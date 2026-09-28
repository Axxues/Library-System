// Shared fetch: token attach, 401 -> back to login, network failure -> Error('unreachable').
// ponytail: one helper instead of try/catch copied across pages.
export async function api(path, opts = {}) {
  const token = localStorage.getItem('token');
  let res;
  try {
    res = await fetch('http://localhost:4000' + path, {
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
  return res.json();
}
