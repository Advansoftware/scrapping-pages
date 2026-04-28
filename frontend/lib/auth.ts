export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5003";

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  const tokenCookie = cookies.find((c) =>
    c.trim().startsWith("auth_token=")
  );
  return tokenCookie ? tokenCookie.split("=")[1].trim() : null;
}

export async function login(username: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) throw new Error("Credenciais inválidas");

  const data = await res.json();
  document.cookie = `auth_token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;
  return data;
}

export function logout() {
  document.cookie = "auth_token=; path=/; max-age=0";
  window.location.href = "/login";
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    document.cookie = "auth_token=; path=/; max-age=0";
    window.location.href = "/login";
    throw new Error("Não autorizado");
  }

  return res;
}
