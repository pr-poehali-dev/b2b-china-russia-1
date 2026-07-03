const BASE = 'https://functions.poehali.dev/360fa583-08c0-4c4a-a620-da6007dd1f5f';

const VID_KEY = 'cb_visitor_id';
export function getVid(): string {
  let v = localStorage.getItem(VID_KEY);
  if (!v) { v = crypto.randomUUID().replace(/-/g, ''); localStorage.setItem(VID_KEY, v); }
  return v;
}

export interface FeedVideo {
  id: number;
  url: string;
  caption?: string;
  hashtags: string[];
  category?: string;
  likes_count: number;
  views_count: number;
  duration_sec: number;
  created_at: string;
  liked: boolean;
  seller_id: number;
  company_name: string;
  plan: string;
  logo_url?: string;
  province?: string;
}

export interface HashtagStat {
  tag: string;
  cnt: number;
}

async function get(action: string, p: Record<string, string> = {}) {
  const qs = new URLSearchParams({ action, ...p, vid: getVid() }).toString();
  const res = await fetch(`${BASE}?${qs}`, { headers: { 'X-Visitor-Id': getVid() } });
  return res.json();
}

async function post(action: string, body: unknown) {
  const res = await fetch(`${BASE}?action=${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Visitor-Id': getVid() },
    body: JSON.stringify(body),
  });
  return res.json();
}

export const feedApi = {
  getFeed: (tab = 'new', offset = 0, hashtag?: string, category?: string) => {
    const p: Record<string, string> = { tab, offset: String(offset) };
    if (hashtag) p.hashtag = hashtag;
    if (category) p.category = category;
    return get('feed', p);
  },
  like: (media_id: number) => post('like', { media_id }),
  view: (media_id: number, seller_id: number) => post('view', { media_id, seller_id }),
  sellerVideos: (seller_id: string) => get('seller_videos', { seller_id }),
  analytics: (seller_id: string) => get('analytics', { seller_id }),
  updateVideo: (token: string, media_id: number, caption: string, hashtags: string[], category: string) =>
    fetch(`${BASE}?action=update_video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Visitor-Id': getVid(), 'X-Auth-Token': token },
      body: JSON.stringify({ media_id, caption, hashtags, category }),
    }).then(r => r.json()),
  ping: (): Promise<{ online: number }> => post('ping', {}),
  onlineCount: (): Promise<{ online: number }> => get('online_count'),
};