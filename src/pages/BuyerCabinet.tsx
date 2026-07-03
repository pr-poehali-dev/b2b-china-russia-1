import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  buyerApi, getBuyerToken, setBuyerToken, clearBuyerToken,
  type Buyer, type FavCompany, type FavProduct, type FavVideo,
  type BuyerLead, type BuyerNotification, type BuyerChat, type BuyerChatMessage,
} from '@/lib/buyerApi';

type Section = 'favorites' | 'history' | 'messages' | 'requests' | 'sellers' | 'orders' | 'notifications';

const MENU: { key: Section; label: string; icon: string }[] = [
  { key: 'favorites', label: 'Избранное', icon: 'Heart' },
  { key: 'history', label: 'История просмотров', icon: 'Clock' },
  { key: 'messages', label: 'Сообщения', icon: 'MessageCircle' },
  { key: 'requests', label: 'Запросы', icon: 'Send' },
  { key: 'sellers', label: 'Мои поставщики', icon: 'Building2' },
  { key: 'orders', label: 'Заказы', icon: 'Package' },
  { key: 'notifications', label: 'Уведомления', icon: 'Bell' },
];

// ---------- AUTH ----------
const AuthScreen = ({ onAuth }: { onAuth: () => void }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', company: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setLoading(true);
    try {
      const res = mode === 'login'
        ? await buyerApi.login({ email: form.email, password: form.password })
        : await buyerApi.register(form);
      setBuyerToken(res.token);
      toast({ title: mode === 'login' ? 'Вход выполнен' : 'Аккаунт создан' });
      onAuth();
    } catch (e) {
      toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-deep px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <button onClick={() => navigate('/')} className="flex items-center gap-2 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-navy text-white">
              <Icon name="Container" size={20} />
            </div>
            <span className="font-display text-xl font-700 text-navy">Chinese<span className="text-gold">Cart</span></span>
          </button>
          <h1 className="font-display text-2xl font-700 text-navy">
            {mode === 'login' ? 'Вход в личный кабинет' : 'Регистрация покупателя'}
          </h1>
        </CardHeader>
        <CardContent className="space-y-3">
          {mode === 'register' && (
            <>
              <Input placeholder="Ваше имя" value={form.name} onChange={(e) => set('name', e.target.value)} />
              <Input placeholder="Компания (необязательно)" value={form.company} onChange={(e) => set('company', e.target.value)} />
              <Input placeholder="Телефон (необязательно)" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </>
          )}
          <Input placeholder="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          <Input placeholder="Пароль" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} />
          <Button className="w-full bg-gold text-gold-foreground hover:bg-gold/90" disabled={loading} onClick={submit}>
            {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </Button>
          <button className="w-full text-sm text-muted-foreground hover:text-navy" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

// ---------- FAVORITES ----------
const FavoritesTab = () => {
  const [companies, setCompanies] = useState<FavCompany[]>([]);
  const [products, setProducts] = useState<FavProduct[]>([]);
  const [videos, setVideos] = useState<FavVideo[]>([]);
  const [tab, setTab] = useState<'companies' | 'products' | 'videos'>('companies');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    buyerApi.favorites().then((d) => {
      setCompanies(d.companies); setProducts(d.products); setVideos(d.videos);
    }).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async (type: 'company' | 'product' | 'video', id: number) => {
    await buyerApi.removeFavorite(type, id);
    if (type === 'company') setCompanies((c) => c.filter((x) => x.id !== id));
    if (type === 'product') setProducts((p) => p.filter((x) => x.id !== id));
    if (type === 'video') setVideos((v) => v.filter((x) => x.id !== id));
    toast({ title: 'Убрано из избранного' });
  };

  if (loading) return <div className="flex justify-center py-16"><Icon name="Loader2" size={28} className="animate-spin text-gold" /></div>;

  const counts = { companies: companies.length, products: products.length, videos: videos.length };

  return (
    <div>
      <div className="mb-5 flex gap-2">
        {(['companies', 'products', 'videos'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-500 transition-colors ${tab === t ? 'bg-navy text-white' : 'bg-secondary text-navy hover:bg-secondary/70'}`}
          >
            {t === 'companies' ? 'Компании' : t === 'products' ? 'Товары' : 'Видео'} ({counts[t]})
          </button>
        ))}
      </div>

      {tab === 'companies' && (
        companies.length === 0 ? <EmptyState icon="Building2" text="Нет избранных компаний" /> : (
          <div className="space-y-3">
            {companies.map((c) => (
              <Card key={c.id} className="cursor-pointer hover:border-gold transition-colors" onClick={() => navigate(`/supplier/${c.id}`)}>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-navy font-display font-700 text-white shrink-0">
                      {c.company_name[0]}
                    </div>
                    <div>
                      <div className="font-600 text-navy">{c.company_name}</div>
                      <div className="text-sm text-muted-foreground">{c.province || '—'} · {c.category || '—'}</div>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); remove('company', c.id); }} className="shrink-0 text-red-400 hover:text-red-600">
                    <Icon name="Heart" size={20} className="fill-red-400" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === 'products' && (
        products.length === 0 ? <EmptyState icon="Package" text="Нет избранных товаров" /> : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <Card key={p.id} className="cursor-pointer hover:border-gold transition-colors" onClick={() => navigate(`/supplier/${p.seller_id}`)}>
                <div className="relative aspect-square overflow-hidden rounded-t-lg bg-secondary">
                  {p.image_url ? <img src={p.image_url} className="h-full w-full object-cover" /> : (
                    <div className="flex h-full items-center justify-center"><Icon name="Package" size={32} className="text-muted-foreground" /></div>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); remove('product', p.id); }} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-400 hover:text-red-600">
                    <Icon name="Heart" size={16} className="fill-red-400" />
                  </button>
                </div>
                <CardContent className="p-3">
                  <div className="font-600 text-navy line-clamp-1">{p.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{p.company_name}</div>
                  {p.price && <div className="mt-1 font-600 text-gold">{p.price}</div>}
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === 'videos' && (
        videos.length === 0 ? <EmptyState icon="Clapperboard" text="Нет избранных видео" /> : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {videos.map((v) => (
              <div key={v.id} className="relative cursor-pointer overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: '9/16' }} onClick={() => navigate(`/supplier/${v.seller_id}`)}>
                <video src={v.url} className="h-full w-full object-cover" muted preload="metadata" />
                <button onClick={(e) => { e.stopPropagation(); remove('video', v.id); }} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white">
                  <Icon name="Heart" size={14} className="fill-red-400 text-red-400" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-2">
                  <p className="text-[11px] text-white line-clamp-1">{v.company_name}</p>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

// ---------- HISTORY ----------
const HistoryTab = () => {
  const [companies, setCompanies] = useState<FavCompany[]>([]);
  const [products, setProducts] = useState<FavProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    buyerApi.history().then((d) => { setCompanies(d.companies); setProducts(d.products); }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Icon name="Loader2" size={28} className="animate-spin text-gold" /></div>;
  if (companies.length === 0 && products.length === 0) return <EmptyState icon="Clock" text="История просмотров пуста" />;

  return (
    <div className="space-y-6">
      {companies.length > 0 && (
        <div>
          <h3 className="mb-3 font-display font-700 text-navy">Компании</h3>
          <div className="space-y-2">
            {companies.map((c) => (
              <Card key={c.id} className="cursor-pointer hover:border-gold transition-colors" onClick={() => navigate(`/supplier/${c.id}`)}>
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy font-display font-700 text-white shrink-0 text-sm">
                    {c.company_name[0]}
                  </div>
                  <div className="font-600 text-navy text-sm">{c.company_name}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      {products.length > 0 && (
        <div>
          <h3 className="mb-3 font-display font-700 text-navy">Товары</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <Card key={p.id} className="cursor-pointer hover:border-gold transition-colors" onClick={() => navigate(`/supplier/${p.seller_id}`)}>
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                    {p.image_url ? <img src={p.image_url} className="h-full w-full object-cover" /> : <Icon name="Package" size={18} />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-600 text-navy text-sm truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.company_name}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- MESSAGES (CHAT) ----------
const MessagesTab = () => {
  const [chats, setChats] = useState<BuyerChat[]>([]);
  const [activeChat, setActiveChat] = useState<BuyerChat | null>(null);
  const [messages, setMessages] = useState<BuyerChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadChats = () => {
    buyerApi.chats().then((d) => setChats(d.chats)).finally(() => setLoading(false));
  };

  useEffect(loadChats, []);

  const openChat = async (chat: BuyerChat) => {
    setActiveChat(chat);
    const d = await buyerApi.chatMessages(chat.id);
    setMessages(d.messages);
    setChats((cs) => cs.map((c) => c.id === chat.id ? { ...c, buyer_unread: 0 } : c));
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !activeChat) return;
    setSending(true);
    try {
      const res = await buyerApi.chatSend(activeChat.id, text.trim());
      setMessages((m) => [...m, res.message]);
      setText('');
    } catch (e) {
      toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Icon name="Loader2" size={28} className="animate-spin text-gold" /></div>;
  if (chats.length === 0) return <EmptyState icon="MessageCircle" text="У вас пока нет переписок с поставщиками" />;

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr] h-[560px]">
      <div className="overflow-y-auto rounded-xl border border-border">
        {chats.map((c) => (
          <button
            key={c.id}
            onClick={() => openChat(c)}
            className={`flex w-full items-center gap-3 border-b border-border p-3 text-left hover:bg-secondary/50 transition-colors ${activeChat?.id === c.id ? 'bg-secondary' : ''}`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy font-display font-700 text-white text-sm">
              {c.company_name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-600 text-navy text-sm truncate">{c.company_name}</span>
                {c.buyer_unread > 0 && <Badge className="bg-gold text-gold-foreground shrink-0 h-5 px-1.5">{c.buyer_unread}</Badge>}
              </div>
              {c.last_message && <p className="text-xs text-muted-foreground truncate">{c.last_message}</p>}
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-col rounded-xl border border-border">
        {!activeChat ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">Выберите переписку</div>
        ) : (
          <>
            <div className="border-b border-border p-3 font-600 text-navy">{activeChat.company_name}</div>
            <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === 'buyer' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.sender === 'buyer' ? 'bg-gold text-gold-foreground' : 'bg-secondary text-navy'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t border-border p-3">
              <Input placeholder="Напишите сообщение..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
              <Button className="bg-gold text-gold-foreground hover:bg-gold/90" disabled={sending} onClick={send}>
                <Icon name="Send" size={16} />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ---------- REQUESTS ----------
const RequestsTab = () => {
  const [leads, setLeads] = useState<BuyerLead[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    buyerApi.leads().then((d) => setLeads(d.leads)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Icon name="Loader2" size={28} className="animate-spin text-gold" /></div>;
  if (leads.length === 0) return <EmptyState icon="Send" text="Вы ещё не отправляли запросы поставщикам" />;

  return (
    <div className="space-y-3">
      {leads.map((l) => (
        <Card key={l.id}>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button className="font-600 text-navy hover:text-gold transition-colors" onClick={() => navigate(`/supplier/${l.seller_id}`)}>
                {l.company_name}
              </button>
              <LeadStatusBadge status={l.status} />
            </div>
            {l.message && <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{l.message}</p>}
            <div className="mt-2 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString('ru-RU')}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const LeadStatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    'Новая': 'bg-secondary text-navy',
    'В работе': 'bg-gold text-gold-foreground',
    'Закрыта': 'bg-green-100 text-green-700',
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-500 ${colors[status] || 'bg-secondary text-navy'}`}>{status}</span>;
};

// ---------- MY SELLERS ----------
const SellersTab = () => {
  const [companies, setCompanies] = useState<FavCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    buyerApi.favorites('company').then((d) => setCompanies(d.companies)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Icon name="Loader2" size={28} className="animate-spin text-gold" /></div>;
  if (companies.length === 0) return <EmptyState icon="Building2" text="Добавьте поставщиков в избранное, чтобы видеть их здесь" />;

  return (
    <div className="space-y-3">
      {companies.map((c) => (
        <Card key={c.id} className="cursor-pointer hover:border-gold transition-colors" onClick={() => navigate(`/supplier/${c.id}`)}>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-navy font-display font-700 text-white shrink-0">
                {c.company_name[0]}
              </div>
              <div>
                <div className="font-600 text-navy">{c.company_name}</div>
                <div className="text-sm text-muted-foreground">{c.province || '—'} · {c.category || '—'}</div>
              </div>
            </div>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-500 text-navy shrink-0">{c.plan}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ---------- ORDERS ----------
const OrdersTab = () => {
  const [leads, setLeads] = useState<BuyerLead[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([buyerApi.leads('В работе'), buyerApi.leads('Закрыта')])
      .then(([a, b]) => setLeads([...a.leads, ...b.leads]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Icon name="Loader2" size={28} className="animate-spin text-gold" /></div>;
  if (leads.length === 0) return <EmptyState icon="Package" text="Заказов пока нет. Как только поставщик подтвердит сделку по вашей заявке, она появится здесь." />;

  return (
    <div className="space-y-3">
      {leads.map((l) => (
        <Card key={l.id}>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button className="font-600 text-navy hover:text-gold transition-colors" onClick={() => navigate(`/supplier/${l.seller_id}`)}>
                {l.company_name}
              </button>
              <LeadStatusBadge status={l.status} />
            </div>
            {l.message && <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{l.message}</p>}
            <div className="mt-2 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString('ru-RU')}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ---------- NOTIFICATIONS ----------
const NotificationsTab = () => {
  const [notifs, setNotifs] = useState<BuyerNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    buyerApi.notifications().then((d) => setNotifs(d.notifications)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const markRead = async (id: number) => {
    await buyerApi.markNotificationRead(id);
    setNotifs((ns) => ns.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAll = async () => {
    await buyerApi.markAllRead();
    setNotifs((ns) => ns.map((n) => ({ ...n, is_read: true })));
  };

  if (loading) return <div className="flex justify-center py-16"><Icon name="Loader2" size={28} className="animate-spin text-gold" /></div>;
  if (notifs.length === 0) return <EmptyState icon="Bell" text="Уведомлений пока нет" />;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="outline" size="sm" onClick={markAll}>Отметить всё прочитанным</Button>
      </div>
      <div className="space-y-2">
        {notifs.map((n) => (
          <Card key={n.id} className={n.is_read ? 'opacity-60' : 'border-gold'} onClick={() => !n.is_read && markRead(n.id)}>
            <CardContent className="flex items-start gap-3 p-4 cursor-pointer">
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${n.is_read ? 'bg-secondary' : 'bg-gold/20'}`}>
                <Icon name={n.type === 'chat_message' ? 'MessageCircle' : 'Bell'} size={15} className={n.is_read ? 'text-muted-foreground' : 'text-gold'} />
              </div>
              <div className="flex-1">
                <div className="font-600 text-navy text-sm">{n.title}</div>
                {n.message && <p className="text-sm text-muted-foreground">{n.message}</p>}
                <div className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString('ru-RU')}</div>
              </div>
              {!n.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold" />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const EmptyState = ({ icon, text }: { icon: string; text: string }) => (
  <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border py-16 text-center">
    <Icon name={icon} size={40} className="text-muted-foreground" />
    <p className="max-w-xs text-muted-foreground">{text}</p>
  </div>
);

// ---------- MAIN ----------
const BuyerCabinet = () => {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(!!getBuyerToken());
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [section, setSection] = useState<Section>('favorites');
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!authed) return;
    buyerApi.profile().then((d) => setBuyer(d.buyer)).catch(() => { clearBuyerToken(); setAuthed(false); });
    buyerApi.notifications().then((d) => setUnreadNotifs(d.unread));
  }, [authed]);

  const logout = () => {
    clearBuyerToken();
    setAuthed(false);
  };

  if (!authed) return <AuthScreen onAuth={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setMenuOpen((v) => !v)}>
              <Icon name="Menu" size={22} className="text-navy" />
            </button>
            <button onClick={() => navigate('/')} className="flex items-center gap-2 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-navy text-white">
                <Icon name="Container" size={20} />
              </div>
              <span className="font-display text-xl font-700 text-navy hidden sm:block">Chinese<span className="text-gold">Cart</span></span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            {buyer && <span className="hidden sm:block text-sm text-muted-foreground">{buyer.name}</span>}
            <Button variant="outline" onClick={logout}>
              <Icon name="LogOut" size={15} className="mr-1" />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          {/* SIDEBAR MENU */}
          <aside className={`${menuOpen ? 'block' : 'hidden'} md:block`}>
            <nav className="space-y-1 rounded-xl border border-border p-2">
              {MENU.map((item) => (
                <button
                  key={item.key}
                  onClick={() => { setSection(item.key); setMenuOpen(false); }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-500 transition-colors ${
                    section === item.key ? 'bg-navy text-white' : 'text-navy hover:bg-secondary'
                  }`}
                >
                  <Icon name={item.icon} size={17} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.key === 'notifications' && unreadNotifs > 0 && (
                    <Badge className="bg-gold text-gold-foreground h-5 px-1.5">{unreadNotifs}</Badge>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* CONTENT */}
          <main>
            <h1 className="mb-5 font-display text-2xl font-700 text-navy">
              {MENU.find((m) => m.key === section)?.label}
            </h1>
            {section === 'favorites' && <FavoritesTab />}
            {section === 'history' && <HistoryTab />}
            {section === 'messages' && <MessagesTab />}
            {section === 'requests' && <RequestsTab />}
            {section === 'sellers' && <SellersTab />}
            {section === 'orders' && <OrdersTab />}
            {section === 'notifications' && <NotificationsTab />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default BuyerCabinet;
