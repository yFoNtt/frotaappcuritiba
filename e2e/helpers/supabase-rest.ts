import { expect } from '@playwright/test';

export const SUPABASE_URL = 'https://bohycsldnskyuwsdxrqt.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvaHljc2xkbnNreXV3c2R4cnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1ODQ1OTIsImV4cCI6MjA4NDE2MDU5Mn0.6Op1rKmqr8bmfXlM_iCPC1yP36DaZ1TnRwKQqXc4jZQ';

export async function loginViaApi(email: string, password: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const text = await res.text();
  expect(res.ok, `Login failed for ${email}: ${text}`).toBeTruthy();
  const data = JSON.parse(text);
  return { accessToken: data.access_token as string, userId: data.user.id as string };
}

function headers(token?: string) {
  const h: Record<string, string> = { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function restGet(table: string, query: string, token?: string) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, { headers: headers(token) });
  const text = await res.text();
  let body: unknown = text;
  try { body = JSON.parse(text); } catch { /* keep raw */ }
  return { status: res.status, ok: res.ok, body, raw: text };
}

export async function restPatch(table: string, query: string, token: string, payload: unknown) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { ...headers(token), Prefer: 'return=representation' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let body: unknown = text;
  try { body = JSON.parse(text); } catch { /* keep raw */ }
  return { status: res.status, ok: res.ok, body, raw: text };
}

export async function restDelete(table: string, query: string, token: string) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { ...headers(token), Prefer: 'return=representation' },
  });
  const text = await res.text();
  let body: unknown = text;
  try { body = JSON.parse(text); } catch { /* keep raw */ }
  return { status: res.status, ok: res.ok, body, raw: text };
}

export async function restInsert(table: string, token: string, payload: unknown) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...headers(token), Prefer: 'return=representation' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let body: unknown = text;
  try { body = JSON.parse(text); } catch { /* keep raw */ }
  return { status: res.status, ok: res.ok, body, raw: text };
}

export async function rpc(name: string, token: string | undefined, payload: unknown = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let body: unknown = text;
  try { body = JSON.parse(text); } catch { /* keep raw */ }
  return { status: res.status, ok: res.ok, body, raw: text };
}
