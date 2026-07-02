const BASE = 'https://functions.poehali.dev/3d7ea980-051c-4259-839b-3fb25c820b4c';

export interface PublicSeller {
  id: number;
  company_name: string;
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
  rating: number;
  reviews_count: number;
  created_at: string;
}

export interface PublicProduct {
  id: number;
  name: string;
  category?: string;
  price?: string;
  description?: string;
  image_url?: string;
  views: number;
}

export interface PublicCert {
  id: number;
  name: string;
  issued_by?: string;
  valid_until?: string;
}

export interface PublicMedia {
  id: number;
  type: string;
  url: string;
  caption?: string;
}

async function get(action: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams({ action, ...params }).toString();
  const res = await fetch(`${BASE}?${qs}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка');
  return data;
}

async function post(action: string, body: unknown) {
  const res = await fetch(`${BASE}?action=${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка');
  return data;
}

export const supplierApi = {
  getProfile: (id: string) => get('profile', { id }),
  listSuppliers: (filters: Record<string, string> = {}) => get('list', filters),
  sendLead: (b: { seller_id: number; buyer_name: string; buyer_contact: string; message?: string }) =>
    post('send_lead', b),
};
