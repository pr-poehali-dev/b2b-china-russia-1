const BASE = 'https://functions.poehali.dev/7d502659-b0d9-491e-b2b0-8c25cfef0320';

export interface LogisticsCompany {
  id: number;
  company_name: string;
  logo_url?: string;
  type: string;
  description?: string;
  routes?: string;
  transit_time?: string;
  min_weight?: string;
  phone?: string;
  email?: string;
  website?: string;
  telegram?: string;
  wechat?: string;
  rating: number;
  reviews_count: number;
  featured: boolean;
}

export interface LogisticsReview {
  id: number;
  author: string;
  company?: string;
  rating: number;
  text: string;
  created_at: string;
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

export const logisticsApi = {
  list: (type?: string) => get('list', type ? { type } : {}),
  get: (id: string) => get('get', { id }),
  addReview: (b: { logistics_id: number; author: string; company?: string; rating: number; text: string }) =>
    post('add_review', b),
  rate: (): Promise<{ rate: number; updated_at: string; cached: boolean }> => get('rate'),
};