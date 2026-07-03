const BASE = 'https://functions.poehali.dev/1b85e126-0ab3-47e0-a56f-ca0ee8685ddb';

const TOKEN_KEY = 'buyer_token';

export const getBuyerToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const setBuyerToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearBuyerToken = () => localStorage.removeItem(TOKEN_KEY);
export const isBuyerAuthed = () => !!getBuyerToken();

export interface Buyer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  created_at?: string;
}

export interface FavCompany {
  id: number;
  company_name: string;
  province?: string;
  category?: string;
  plan: string;
  rating: number;
  logo_url?: string;
}

export interface FavProduct {
  id: number;
  name: string;
  category?: string;
  price?: string;
  image_url?: string;
  seller_id: number;
  company_name: string;
}

export interface FavVideo {
  id: number;
  url: string;
  caption?: string;
  likes_count: number;
  views_count: number;
  seller_id: number;
  company_name: string;
}

export interface BuyerLead {
  id: number;
  seller_id: number;
  company_name: string;
  buyer_name: string;
  buyer_contact?: string;
  message?: string;
  status: string;
  product_interest?: string;
  budget?: string;
  quantity?: string;
  created_at: string;
}

export interface BuyerNotification {
  id: number;
  type: string;
  title: string;
  message?: string;
  seller_id?: number;
  is_read: boolean;
  created_at: string;
}

export interface BuyerChat {
  id: number;
  seller_id: number;
  company_name: string;
  logo_url?: string;
  last_message_at: string;
  buyer_unread: number;
  last_message?: string;
}

export interface BuyerChatMessage {
  id: number;
  sender: 'buyer' | 'seller';
  text: string;
  created_at: string;
}

async function call(action: string, method: string, body?: unknown, extraParams?: string) {
  const url = `${BASE}?action=${action}${extraParams ? `&${extraParams}` : ''}`;
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Buyer-Token': getBuyerToken() },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
  return data;
}

export const buyerApi = {
  register: (b: { name: string; email: string; password: string; phone?: string; company?: string }) =>
    call('register', 'POST', b),
  login: (b: { email: string; password: string }) => call('login', 'POST', b),
  profile: (): Promise<{ buyer: Buyer }> => call('profile', 'GET'),
  updateProfile: (b: Partial<Buyer>) => call('update_profile', 'POST', b),

  favorites: (type?: string): Promise<{ companies: FavCompany[]; products: FavProduct[]; videos: FavVideo[] }> =>
    call('favorites', 'GET', undefined, type ? `type=${type}` : undefined),
  addFavorite: (item_type: 'company' | 'product' | 'video', item_id: number) =>
    call('add_favorite', 'POST', { item_type, item_id }),
  removeFavorite: (item_type: 'company' | 'product' | 'video', item_id: number) =>
    call('remove_favorite', 'POST', { item_type, item_id }),
  checkFavorites: (type: string): Promise<{ ids: number[] }> => call('check_favorites', 'GET', undefined, `type=${type}`),

  addView: (item_type: 'company' | 'product', item_id: number) => call('add_view', 'POST', { item_type, item_id }),
  history: (): Promise<{ companies: FavCompany[]; products: FavProduct[] }> => call('history', 'GET'),

  leads: (status?: string): Promise<{ leads: BuyerLead[] }> => call('leads', 'GET', undefined, status ? `status=${encodeURIComponent(status)}` : undefined),
  sendLead: (b: { seller_id: number; message?: string; product_id?: number; product_interest?: string; budget?: string; quantity?: string }) =>
    call('send_lead', 'POST', b),

  notifications: (): Promise<{ notifications: BuyerNotification[]; unread: number }> => call('notifications', 'GET'),
  markNotificationRead: (id: number) => call('mark_notification_read', 'POST', { id }),
  markAllRead: () => call('mark_all_read', 'POST', {}),

  chats: (): Promise<{ chats: BuyerChat[] }> => call('chats', 'GET'),
  chatStart: (seller_id: number): Promise<{ chat_id: number }> => call('chat_start', 'POST', { seller_id }),
  chatMessages: (chat_id: number): Promise<{ messages: BuyerChatMessage[] }> => call('chat_messages', 'GET', undefined, `chat_id=${chat_id}`),
  chatSend: (chat_id: number, text: string) => call('chat_send', 'POST', { chat_id, text }),
};
