const BASE = 'https://functions.poehali.dev/92348994-f438-4ffb-83d7-393c007ce0aa';
export const ADMIN_TOKEN = 'chinabridge-admin-2026';

export interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  cover_url?: string;
  tag: string;
  author: string;
  views: number;
  published?: boolean;
  published_at?: string;
  created_at?: string;
}

async function get(action: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams({ action, ...params }).toString();
  const res = await fetch(`${BASE}?${qs}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка');
  return data;
}

async function post(action: string, body: unknown, admin = false) {
  const res = await fetch(`${BASE}?action=${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(admin ? { 'X-Auth-Token': ADMIN_TOKEN } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка');
  return data;
}

export const blogApi = {
  list: (params: Record<string, string> = {}) => get('list', params),
  get: (slug: string) => get('get', { slug }),
  listAll: () => fetch(`${BASE}?action=list_all`, { headers: { 'X-Auth-Token': ADMIN_TOKEN } }).then(r => r.json()),
  create: (b: Partial<Article>) => post('create', b, true),
  update: (b: Partial<Article> & { id: number }) => post('update', b, true),
  togglePublish: (id: number) => post('toggle_publish', { id }, true),
};
