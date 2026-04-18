/**
 * Shared REST API helpers for the admin screens.
 */
declare const ChurnStopAdmin: {
  apiUrl: string;
  nonce: string;
  page: string;
  entitlements: Record<string, unknown>;
};

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${ChurnStopAdmin.apiUrl}${path}`, {
    headers: { 'X-WP-Nonce': ChurnStopAdmin.nonce },
  });

  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status}`);
  }

  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${ChurnStopAdmin.apiUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-WP-Nonce': ChurnStopAdmin.nonce,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw Object.assign(new Error(`POST ${path} failed: ${res.status}`), { data });
  }

  return data;
}
