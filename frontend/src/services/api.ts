const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export async function apiFetch<T>(
  path: string,
  token?: string,
  options?: { method?: string; body?: string },
): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (options?.body) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options?.method ?? "GET",
    headers,
    body: options?.body,
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Request failed: ${res.status}${errBody ? ` — ${errBody}` : ""}`);
  }
  return res.json() as Promise<T>;
}