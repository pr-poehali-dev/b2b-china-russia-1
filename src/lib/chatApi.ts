const BASE = 'https://functions.poehali.dev/a0a06192-0472-4dd0-8c12-c158a3219e18';
export const CHAT_ADMIN_TOKEN = 'chinabridge-admin-2026';

export interface ChatMessage {
  id: number;
  sender: 'visitor' | 'operator' | 'bot';
  text?: string;
  photo_url?: string;
  created_at: string;
}

export interface ChatSession {
  id: number;
  visitor_id: string;
  visitor_name: string;
  visitor_email?: string;
  status: string;
  last_message_at: string;
  visitor_count: number;
  last_text?: string;
}

const VID_KEY = 'cb_visitor_id';
const SID_KEY = 'cb_session_id';

export function getVisitorId(): string {
  let vid = localStorage.getItem(VID_KEY);
  if (!vid) { vid = crypto.randomUUID().replace(/-/g, ''); localStorage.setItem(VID_KEY, vid); }
  return vid;
}
export const getSessionId = () => localStorage.getItem(SID_KEY);
export const setSessionId = (id: number) => localStorage.setItem(SID_KEY, String(id));

async function req(action: string, method: string, body?: unknown, extraHeaders: Record<string, string> = {}) {
  const res = await fetch(`${BASE}?action=${action}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Visitor-Id': getVisitorId(), ...extraHeaders },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export const chatApi = {
  init: (name: string, email?: string) =>
    req('init', 'POST', { visitor_id: getVisitorId(), name, email }),

  send: async (session_id: number, text: string, photo?: File) => {
    let photo_b64: string | undefined;
    if (photo) photo_b64 = await fileToBase64(photo);
    return req('send', 'POST', { session_id, text: text || undefined, photo: photo_b64 });
  },

  poll: (session_id: number, since_id: number) =>
    fetch(`${BASE}?action=poll&session_id=${session_id}&since_id=${since_id}`, {
      headers: { 'X-Visitor-Id': getVisitorId() },
    }).then(r => r.json()),

  // admin
  getSessions: () => req('sessions', 'GET', undefined, { 'X-Auth-Token': CHAT_ADMIN_TOKEN }),
  getSessionMessages: (session_id: number) =>
    fetch(`${BASE}?action=session_messages&session_id=${session_id}`, {
      headers: { 'X-Auth-Token': CHAT_ADMIN_TOKEN },
    }).then(r => r.json()),
  reply: (session_id: number, text: string) =>
    req('reply', 'POST', { session_id, text }, { 'X-Auth-Token': CHAT_ADMIN_TOKEN }),
  close: (session_id: number) =>
    req('close', 'POST', { session_id }, { 'X-Auth-Token': CHAT_ADMIN_TOKEN }),
};
