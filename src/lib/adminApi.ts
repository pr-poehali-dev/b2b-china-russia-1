const BASE = 'https://functions.poehali.dev/02481138-c031-47af-a41f-cabec8acc37d';

const TOKEN_KEY = 'admin_token';

export const getAdminToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const setAdminToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearAdminToken = () => localStorage.removeItem(TOKEN_KEY);

export interface AdminSeller {
  id: number;
  company_name: string;
  email: string;
  province?: string;
  category?: string;
  plan: string;
  rating: number;
  reviews_count: number;
  created_at: string;
}

export interface AdminProduct {
  id: number;
  name: string;
  category?: string;
  price?: string;
  image_url?: string;
  status: string;
  views: number;
  created_at: string;
  seller_id: number;
  company_name: string;
}

export interface AdminLogistics {
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
  created_at: string;
}

async function call(action: string, method: string, body?: unknown) {
  const res = await fetch(`${BASE}?action=${action}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': getAdminToken() },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
  return data;
}

export const adminApi = {
  login: (password: string) => call('login', 'POST', { password }),
  sellers: (): Promise<{ sellers: AdminSeller[] }> => call('sellers', 'GET'),
  addSeller: (b: { company_name: string; email: string; password?: string; province?: string; category?: string; plan?: string }) =>
    call('add_seller', 'POST', b),
  deleteSeller: (id: number) => call('delete_seller', 'POST', { id }),
  products: (): Promise<{ products: AdminProduct[] }> => call('products', 'GET'),
  addProduct: (b: { name: string; category?: string; price?: string; description?: string; image_url?: string; photos?: string[]; sku?: string; min_order?: string; quantity?: string }) =>
    call('add_product', 'POST', b),
  deleteProduct: (id: number) => call('delete_product', 'POST', { id }),
  uploadPhoto: (file: string, content_type: string): Promise<{ url: string }> =>
    call('upload_photo', 'POST', { file, content_type }),
  importExcel: (file: string, filename: string): Promise<{ imported: AdminProduct[]; count: number; errors: string[] }> =>
    call('import_excel', 'POST', { file, filename }),
  logistics: (): Promise<{ logistics: AdminLogistics[] }> => call('logistics', 'GET'),
  addLogistics: (b: { company_name: string; type: string; logo_url?: string; description?: string; routes?: string; transit_time?: string; min_weight?: string; phone?: string; email?: string; website?: string; telegram?: string; wechat?: string; featured?: boolean }) =>
    call('add_logistics', 'POST', b),
  deleteLogistics: (id: number) => call('delete_logistics', 'POST', { id }),
};