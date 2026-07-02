const BASE = 'https://functions.poehali.dev/3abdcf15-d2d3-4125-9186-385a2e3ce351';

const TOKEN_KEY = 'sb_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export interface Seller {
  id: number;
  company_name: string;
  email: string;
  plan: string;
}

export interface Product {
  id: number;
  name: string;
  category?: string;
  price?: string;
  description?: string;
  image_url?: string;
  status: string;
  views: number;
  created_at: string;
}

export interface Lead {
  id: number;
  buyer_name: string;
  buyer_contact?: string;
  message?: string;
  status: string;
  created_at: string;
}

export interface Stats {
  views: number;
  leads: number;
  products: number;
}

async function call(action: string, method: string, body?: unknown) {
  const res = await fetch(`${BASE}?action=${action}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': getToken(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
  return data;
}

export const api = {
  register: (b: { company_name: string; email: string; password: string; province?: string; category?: string }) =>
    call('register', 'POST', b),
  login: (b: { email: string; password: string }) => call('login', 'POST', b),
  dashboard: () => call('dashboard', 'GET'),
  addProduct: (b: { name: string; category?: string; price?: string; description?: string; image_url?: string }) =>
    call('add_product', 'POST', b),
  deleteProduct: (id: number) => call('delete_product', 'POST', { id }),
  leadStatus: (id: number, status: string) => call('lead_status', 'POST', { id, status }),
};
