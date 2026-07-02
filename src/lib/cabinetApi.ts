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
  description?: string;
  province?: string;
  category?: string;
  wechat?: string;
  whatsapp?: string;
  telegram?: string;
  website?: string;
  logo_url?: string;
  founded_year?: number;
  employees?: string;
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

export interface Certificate {
  id: number;
  name: string;
  file_url?: string;
  issued_by?: string;
  valid_until?: string;
  created_at: string;
}

export interface Media {
  id: number;
  type: string;
  url: string;
  caption?: string;
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
  updateProfile: (b: Partial<Seller>) => call('update_profile', 'POST', b),
  addProduct: (b: { name: string; category?: string; price?: string; description?: string; image_url?: string }) =>
    call('add_product', 'POST', b),
  deleteProduct: (id: number) => call('delete_product', 'POST', { id }),
  addMedia: (b: { url: string; type: string; caption?: string }) => call('add_media', 'POST', b),
  deleteMedia: (id: number) => call('delete_media', 'POST', { id }),
  addCert: (b: { name: string; file_url?: string; issued_by?: string; valid_until?: string }) =>
    call('add_cert', 'POST', b),
  deleteCert: (id: number) => call('delete_cert', 'POST', { id }),
  leadStatus: (id: number, status: string) => call('lead_status', 'POST', { id, status }),
  buyPremium: (plan: string) => call('buy_premium', 'POST', { plan }),
  getContactRequests: () => call('contact_requests', 'GET'),
  contactStatus: (id: number, status: string) => call('contact_status', 'POST', { id, status }),
};

export interface ContactRequest {
  id: number;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  product_interest?: string;
  budget?: string;
  quantity?: string;
  message?: string;
  status: string;
  created_at: string;
}