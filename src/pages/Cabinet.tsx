import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import {
  api,
  getToken,
  setToken,
  clearToken,
  type Seller,
  type Product,
  type Lead,
  type ContactRequest,
  type Certificate,
  type Media,
  type Stats,
} from '@/lib/cabinetApi';
import { blogApi, type Article } from '@/lib/blogApi';

const CATEGORIES = ['Электроника', 'Текстиль и одежда', 'Товары для дома', 'Автозапчасти', 'Промоборудование', 'Упаковка'];
const PROVINCES = ['Гуандун', 'Чжэцзян', 'Цзянсу', 'Шаньдун', 'Фуцзянь', 'Хэбэй', 'Шанхай', 'Пекин'];
const LEAD_STATUSES = ['Новая', 'В работе', 'Закрыта'];

const PREMIUM_PLANS = [
  { name: 'Premium', price: 99, color: 'bg-secondary text-navy', features: ['Верификация компании', 'Приоритет в поиске', 'До 50 товаров', 'Статистика'] },
  { name: 'Gold', price: 199, color: 'bg-gold text-gold-foreground', features: ['Всё из Premium', 'Топ-позиции в каталоге', 'До 200 товаров', 'Баннер на главной', 'Приоритет заявок'] },
  { name: 'Platinum', price: 349, color: 'bg-navy text-white', features: ['Всё из Gold', 'Менеджер-переводчик', 'Безлимит товаров', 'Проверка инспектором', 'Лид-генерация'] },
];

// ---------- AUTH ----------
const AuthScreen = ({ onAuth }: { onAuth: () => void }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ company_name: '', email: '', password: '', province: '', category: '' });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setLoading(true);
    try {
      const res = mode === 'login'
        ? await api.login({ email: form.email, password: form.password })
        : await api.register(form);
      setToken(res.token);
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
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-navy text-white">
              <Icon name="Container" size={20} />
            </div>
            <span className="font-display text-xl font-700 text-navy">Chinese<span className="text-gold">Bridge</span></span>
          </div>
          <h1 className="font-display text-2xl font-700 text-navy">
            {mode === 'login' ? 'Вход в кабинет продавца' : 'Регистрация компании'}
          </h1>
        </CardHeader>
        <CardContent className="space-y-3">
          {mode === 'register' && (
            <>
              <Input placeholder="Название компании" value={form.company_name} onChange={(e) => set('company_name', e.target.value)} />
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.province} onChange={(e) => set('province', e.target.value)}>
                <option value="">Провинция</option>
                {PROVINCES.map((p) => <option key={p}>{p}</option>)}
              </select>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.category} onChange={(e) => set('category', e.target.value)}>
                <option value="">Категория</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
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

// ---------- PRODUCTS TAB ----------
const ProductsTab = ({ products, onAdded, onDeleted }: { products: Product[]; onAdded: (p: Product) => void; onDeleted: (id: number) => void }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', price: '', description: '', image_url: '' });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) { toast({ title: 'Укажите название', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const res = await api.addProduct(form);
      onAdded(res.product);
      toast({ title: 'Товар добавлен' });
      setForm({ name: '', category: '', price: '', description: '', image_url: '' });
      setOpen(false);
    } catch (e) { toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const del = async (id: number) => {
    try { await api.deleteProduct(id); onDeleted(id); toast({ title: 'Товар удалён' }); }
    catch (e) { toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' }); }
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gold text-gold-foreground hover:bg-gold/90"><Icon name="Plus" size={16} className="mr-1" />Добавить товар</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display text-navy">Новый товар</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Название товара *" value={form.name} onChange={(e) => set('name', e.target.value)} />
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.category} onChange={(e) => set('category', e.target.value)}>
                <option value="">Категория</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <Input placeholder="Цена (напр. от $5/шт.)" value={form.price} onChange={(e) => set('price', e.target.value)} />
              <Input placeholder="Ссылка на фото" value={form.image_url} onChange={(e) => set('image_url', e.target.value)} />
              <Textarea placeholder="Описание" value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
            <DialogFooter>
              <Button className="bg-gold text-gold-foreground hover:bg-gold/90" disabled={loading} onClick={submit}>
                {loading ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {products.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <Icon name="PackagePlus" size={40} className="text-muted-foreground" />
          <p className="text-muted-foreground">Пока нет товаров. Добавьте первый!</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {products.map((p) => (
            <Card key={p.id} className="border-border">
              <CardContent className="flex gap-4 p-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                  {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" /> : <Icon name="Package" size={24} className="text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-600 text-navy truncate">{p.name}</div>
                      <div className="text-sm text-muted-foreground">{p.category || 'Без категории'} · {p.price || 'Цена по запросу'}</div>
                    </div>
                    <Badge variant="secondary">{p.status}</Badge>
                  </div>
                  {p.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-sm text-muted-foreground"><Icon name="Eye" size={14} />{p.views}</span>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => del(p.id)}><Icon name="Trash2" size={16} /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------- MEDIA TAB ----------
const MediaTab = ({ media, onAdded, onDeleted }: { media: Media[]; onAdded: (m: Media) => void; onDeleted: (id: number) => void }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ url: '', type: 'photo', caption: '' });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.url.trim()) { toast({ title: 'Укажите ссылку', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const res = await api.addMedia(form);
      onAdded(res.media);
      toast({ title: 'Медиа добавлено' });
      setForm({ url: '', type: 'photo', caption: '' });
      setOpen(false);
    } catch (e) { toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const del = async (id: number) => {
    try { await api.deleteMedia(id); onDeleted(id); } catch (e) { toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' }); }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Добавьте фото и видео производства, чтобы повысить доверие покупателей</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gold text-gold-foreground hover:bg-gold/90"><Icon name="Plus" size={16} className="mr-1" />Добавить</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display text-navy">Фото / видео производства</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="photo">📷 Фото</option>
                <option value="video">🎬 Видео</option>
              </select>
              <Input placeholder="URL фото или видео" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
              <Input placeholder="Подпись (необязательно)" value={form.caption} onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button className="bg-gold text-gold-foreground hover:bg-gold/90" disabled={loading} onClick={submit}>
                {loading ? 'Сохранение...' : 'Добавить'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {media.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <Icon name="ImagePlus" size={40} className="text-muted-foreground" />
          <p className="text-muted-foreground">Загрузите фото и видео производства</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {media.map((m) => (
            <div key={m.id} className="group relative overflow-hidden rounded-xl border border-border bg-secondary">
              {m.type === 'photo' ? (
                <img src={m.url} alt={m.caption || ''} className="h-40 w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
              ) : (
                <div className="flex h-40 items-center justify-center flex-col gap-2">
                  <Icon name="PlayCircle" size={36} className="text-navy" />
                  <span className="text-xs text-muted-foreground">Видео</span>
                </div>
              )}
              {m.caption && <p className="p-2 text-xs text-muted-foreground">{m.caption}</p>}
              <button className="absolute right-2 top-2 rounded-full bg-white/80 p-1 opacity-0 transition-opacity group-hover:opacity-100" onClick={() => del(m.id)}>
                <Icon name="X" size={14} className="text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------- CERTS TAB ----------
const CertsTab = ({ certs, onAdded, onDeleted }: { certs: Certificate[]; onAdded: (c: Certificate) => void; onDeleted: (id: number) => void }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', issued_by: '', valid_until: '', file_url: '' });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) { toast({ title: 'Укажите название', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const res = await api.addCert(form);
      onAdded(res.cert);
      toast({ title: 'Сертификат добавлен' });
      setForm({ name: '', issued_by: '', valid_until: '', file_url: '' });
      setOpen(false);
    } catch (e) { toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const del = async (id: number) => {
    try { await api.deleteCert(id); onDeleted(id); } catch (e) { toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' }); }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">ISO, CE, SGS и другие подтверждения качества повышают доверие к компании</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gold text-gold-foreground hover:bg-gold/90"><Icon name="Plus" size={16} className="mr-1" />Добавить</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display text-navy">Новый сертификат</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Название (напр. ISO 9001:2015) *" value={form.name} onChange={(e) => set('name', e.target.value)} />
              <Input placeholder="Выдан (напр. SGS Group)" value={form.issued_by} onChange={(e) => set('issued_by', e.target.value)} />
              <Input placeholder="Действителен до" type="date" value={form.valid_until} onChange={(e) => set('valid_until', e.target.value)} />
              <Input placeholder="Ссылка на скан (необязательно)" value={form.file_url} onChange={(e) => set('file_url', e.target.value)} />
            </div>
            <DialogFooter>
              <Button className="bg-gold text-gold-foreground hover:bg-gold/90" disabled={loading} onClick={submit}>
                {loading ? 'Сохранение...' : 'Добавить'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {certs.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <Icon name="ShieldCheck" size={40} className="text-muted-foreground" />
          <p className="text-muted-foreground">Добавьте сертификаты ISO, CE, SGS и другие</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {certs.map((c) => (
            <Card key={c.id} className="border-border">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/15 text-gold">
                    <Icon name="Award" size={20} />
                  </div>
                  <div>
                    <div className="font-600 text-navy">{c.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {c.issued_by && `${c.issued_by} · `}
                      {c.valid_until ? `до ${c.valid_until}` : 'Бессрочный'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c.file_url && <a href={c.file_url} target="_blank" rel="noreferrer" className="text-sm text-gold hover:underline">Скан</a>}
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => del(c.id)}><Icon name="Trash2" size={16} /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------- LEADS TAB ----------
const LeadsTab = ({ leads, onChange }: { leads: Lead[]; onChange: (id: number, status: string) => void }) => (
  <div>
    {leads.length === 0 ? (
      <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-2 py-12 text-center">
        <Icon name="Inbox" size={40} className="text-muted-foreground" />
        <p className="text-muted-foreground">Заявок пока нет</p>
      </CardContent></Card>
    ) : (
      <div className="space-y-3">
        {leads.map((l) => (
          <Card key={l.id} className="border-border">
            <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div>
                <div className="font-600 text-navy">{l.buyer_name}</div>
                {l.buyer_contact && <div className="text-sm text-muted-foreground">{l.buyer_contact}</div>}
                {l.message && <p className="mt-1 text-sm text-muted-foreground">{l.message}</p>}
                <div className="mt-1 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString('ru-RU')}</div>
              </div>
              <div className="flex flex-wrap gap-1">
                {LEAD_STATUSES.map((s) => (
                  <button key={s} onClick={() => onChange(l.id, s)}
                    className={`rounded-full border px-3 py-1 text-xs font-500 transition-colors ${l.status === s ? 'border-navy bg-navy text-white' : 'border-border text-muted-foreground hover:border-navy'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )}
  </div>
);

// ---------- PROFILE TAB ----------
const ProfileTab = ({ seller, onSaved }: { seller: Seller; onSaved: (s: Seller) => void }) => {
  const [form, setForm] = useState<Partial<Seller>>({
    description: seller.description || '',
    province: seller.province || '',
    category: seller.category || '',
    wechat: seller.wechat || '',
    whatsapp: seller.whatsapp || '',
    telegram: seller.telegram || '',
    website: seller.website || '',
    logo_url: seller.logo_url || '',
    founded_year: seller.founded_year,
    employees: seller.employees || '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setLoading(true);
    try {
      await api.updateProfile(form);
      onSaved({ ...seller, ...form });
      toast({ title: 'Профиль сохранён' });
    } catch (e) { toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="border-border">
        <CardHeader><CardTitle className="font-display text-lg text-navy">Информация о компании</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Ссылка на логотип" value={form.logo_url || ''} onChange={(e) => set('logo_url', e.target.value)} />
          <Textarea placeholder="Описание компании" value={form.description || ''} onChange={(e) => set('description', e.target.value)} className="min-h-24" />
          <div className="grid grid-cols-2 gap-3">
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.province || ''} onChange={(e) => set('province', e.target.value)}>
              <option value="">Провинция</option>
              {PROVINCES.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.category || ''} onChange={(e) => set('category', e.target.value)}>
              <option value="">Категория</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Год основания" type="number" value={form.founded_year || ''} onChange={(e) => set('founded_year', parseInt(e.target.value) || 0)} />
            <Input placeholder="Сотрудников (напр. 50–200)" value={form.employees || ''} onChange={(e) => set('employees', e.target.value)} />
          </div>
          <Input placeholder="Сайт" value={form.website || ''} onChange={(e) => set('website', e.target.value)} />
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader><CardTitle className="font-display text-lg text-navy">Контакты для покупателей</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <Input placeholder="WeChat ID" value={form.wechat || ''} onChange={(e) => set('wechat', e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📱</span>
            <Input placeholder="WhatsApp (с кодом страны, напр. +86...)" value={form.whatsapp || ''} onChange={(e) => set('whatsapp', e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">✈️</span>
            <Input placeholder="Telegram (@username)" value={form.telegram || ''} onChange={(e) => set('telegram', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Button className="bg-gold text-gold-foreground hover:bg-gold/90" disabled={loading} onClick={save}>
        {loading ? 'Сохранение...' : 'Сохранить профиль'}
      </Button>
    </div>
  );
};

// ---------- PREMIUM TAB ----------
const PremiumTab = ({ currentPlan, premium, onBuy }: { currentPlan: string; premium: { plan: string; status: string } | null; onBuy: (plan: string) => void }) => {
  const [loading, setLoading] = useState('');

  const buy = async (plan: string) => {
    setLoading(plan);
    try {
      await api.buyPremium(plan);
      onBuy(plan);
      toast({ title: 'Заявка принята!', description: 'Менеджер свяжется с вами в течение 24 часов.' });
    } catch (e) { toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' }); }
    finally { setLoading(''); }
  };

  return (
    <div>
      {premium && (
        <Card className="mb-6 border-gold bg-gold/5">
          <CardContent className="flex items-center gap-3 p-4">
            <Icon name="Clock" size={20} className="text-gold" />
            <div>
              <div className="font-600 text-navy">Заявка на {premium.plan} отправлена</div>
              <div className="text-sm text-muted-foreground">Статус: {premium.status === 'pending' ? 'Ожидает обработки' : premium.status}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        {PREMIUM_PLANS.map((plan) => {
          const active = currentPlan === plan.name;
          return (
            <Card key={plan.name} className={`border-2 ${active ? 'border-gold' : 'border-border'} relative overflow-hidden`}>
              {active && <div className="absolute right-3 top-3"><Badge className="bg-gold text-gold-foreground">Текущий</Badge></div>}
              <CardContent className="p-6">
                <Badge className={plan.color + ' mb-3'}>{plan.name}</Badge>
                <div className="font-display text-3xl font-700 text-navy">${plan.price}<span className="text-base font-400 text-muted-foreground">/мес</span></div>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Icon name="Check" size={15} className="text-gold shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-5 w-full"
                  variant={active ? 'outline' : 'default'}
                  disabled={active || loading === plan.name}
                  onClick={() => buy(plan.name)}
                  style={!active ? { backgroundColor: 'hsl(218 62% 18%)', color: 'white' } : {}}
                >
                  {loading === plan.name ? 'Отправка...' : active ? 'Активен' : 'Подключить'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 border-border bg-secondary/50">
        <CardContent className="p-5 text-sm text-muted-foreground">
          <p><strong className="text-navy">Как подключить:</strong> нажмите «Подключить», менеджер свяжется с вами для оплаты и активации в течение 24 часов.</p>
        </CardContent>
      </Card>
    </div>
  );
};

// ---------- CONTACT REQUESTS TAB ----------
const CONTACT_STATUSES = ['Новая', 'В работе', 'Закрыта'];

const ContactRequestsTab = () => {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    api.getContactRequests()
      .then((d) => setRequests(d.requests || []))
      .finally(() => setLoading(false));
  }, []);

  const changeStatus = async (id: number, status: string) => {
    try {
      await api.contactStatus(id, status);
      setRequests((rs) => rs.map((r) => r.id === id ? { ...r, status } : r));
    } catch (e) { toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' }); }
  };

  const statusColor: Record<string, string> = {
    'Новая': 'bg-gold/15 text-gold border-gold/30',
    'В работе': 'bg-navy/10 text-navy border-navy/20',
    'Закрыта': 'bg-secondary text-muted-foreground border-border',
  };

  if (loading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary" />)}</div>;

  if (requests.length === 0) return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
        <Icon name="Inbox" size={40} className="text-muted-foreground" />
        <p className="font-600 text-navy">Заявок с сайта пока нет</p>
        <p className="text-sm text-muted-foreground">Они появятся, когда кто-то заполнит форму на главной странице</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <Card key={r.id} className="border-border">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              {/* Left: info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-600 text-navy">{r.name}</span>
                  {r.company && <span className="text-sm text-muted-foreground">· {r.company}</span>}
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-500 ${statusColor[r.status] || statusColor['Новая']}`}>
                    {r.status}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {r.email && (
                    <a href={`mailto:${r.email}`} className="flex items-center gap-1 hover:text-gold transition-colors">
                      <Icon name="Mail" size={13} />{r.email}
                    </a>
                  )}
                  {r.phone && (
                    <a href={`tel:${r.phone}`} className="flex items-center gap-1 hover:text-gold transition-colors">
                      <Icon name="Phone" size={13} />{r.phone}
                    </a>
                  )}
                </div>
                {r.product_interest && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-sm">
                    <Icon name="Package" size={13} className="text-gold shrink-0" />
                    <span className="font-500 text-navy">{r.product_interest}</span>
                    {r.budget && <span className="text-muted-foreground">· {r.budget}</span>}
                  </div>
                )}
                {expanded === r.id && r.message && (
                  <p className="mt-2 rounded-lg bg-secondary/70 p-3 text-sm text-muted-foreground">{r.message}</p>
                )}
                {r.message && (
                  <button
                    className="mt-1 text-xs text-gold hover:underline"
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  >
                    {expanded === r.id ? 'Свернуть' : 'Показать сообщение'}
                  </button>
                )}
                <div className="mt-1 text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString('ru-RU')}
                </div>
              </div>

              {/* Right: status buttons */}
              <div className="flex flex-wrap gap-1 shrink-0">
                {CONTACT_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => changeStatus(r.id, s)}
                    className={`rounded-full border px-3 py-1 text-xs font-500 transition-colors ${
                      r.status === s ? 'border-navy bg-navy text-white' : 'border-border text-muted-foreground hover:border-navy'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ---------- BLOG TAB ----------
const ARTICLE_TAGS = ['Новости', 'Торговля', 'Логистика', 'Регулирование', 'Аналитика'];

const BlogTab = ({ navigate }: { navigate: (p: string) => void }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [form, setForm] = useState({ title: '', excerpt: '', content: '', cover_url: '', tag: 'Новости', author: 'Редакция ChineseBridge', published: false });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const load = () => {
    setLoading(true);
    blogApi.listAll()
      .then((d) => setArticles(d.articles || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', excerpt: '', content: '', cover_url: '', tag: 'Новости', author: 'Редакция ChineseBridge', published: false });
    setOpen(true);
  };

  const openEdit = (a: Article) => {
    setEditing(a);
    setForm({ title: a.title, excerpt: a.excerpt || '', content: a.content || '', cover_url: a.cover_url || '', tag: a.tag, author: a.author, published: !!a.published });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) { toast({ title: 'Укажите заголовок', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (editing) {
        await blogApi.update({ id: editing.id, ...form });
        toast({ title: 'Статья обновлена' });
      } else {
        await blogApi.create(form);
        toast({ title: 'Статья создана' });
      }
      setOpen(false);
      load();
    } catch (e) { toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const toggle = async (id: number) => {
    try {
      await blogApi.togglePublish(id);
      setArticles((as) => as.map((a) => a.id === id ? { ...a, published: !a.published } : a));
    } catch (e) { toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' }); }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Управляйте новостями и статьями платформы</p>
        <Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={openNew}>
          <Icon name="Plus" size={16} className="mr-1" />Новая статья
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-navy">{editing ? 'Редактировать статью' : 'Новая статья'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <Input placeholder="Заголовок *" value={form.title} onChange={(e) => set('title', e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.tag} onChange={(e) => set('tag', e.target.value)}>
                {ARTICLE_TAGS.map((t) => <option key={t}>{t}</option>)}
              </select>
              <Input placeholder="Автор" value={form.author} onChange={(e) => set('author', e.target.value)} />
            </div>
            <Input placeholder="Ссылка на обложку (URL)" value={form.cover_url} onChange={(e) => set('cover_url', e.target.value)} />
            <Textarea placeholder="Краткое описание (анонс)" value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} className="min-h-16" />
            <Textarea placeholder="Текст статьи (поддерживается HTML: <p>, <h2>, <ul>, <strong>)" value={form.content} onChange={(e) => set('content', e.target.value)} className="min-h-40 font-mono text-sm" />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} className="h-4 w-4 rounded" />
              <span className="text-sm font-500 text-navy">Опубликовать сразу</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
            <Button className="bg-gold text-gold-foreground hover:bg-gold/90" disabled={saving} onClick={save}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary" />)}</div>
      ) : articles.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <Icon name="Newspaper" size={40} className="text-muted-foreground" />
          <p className="text-muted-foreground">Статей пока нет. Создайте первую!</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {articles.map((a) => (
            <Card key={a.id} className="border-border">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-600 text-navy truncate">{a.title}</span>
                    <Badge variant={a.published ? 'default' : 'secondary'} className={a.published ? 'bg-green-600 text-white' : ''}>
                      {a.published ? 'Опубликована' : 'Черновик'}
                    </Badge>
                    <Badge variant="outline">{a.tag}</Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Icon name="Eye" size={11} />{a.views}</span>
                    {a.published_at && <span>{new Date(a.published_at).toLocaleDateString('ru-RU')}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {a.published && (
                    <Button variant="ghost" size="sm" className="text-gold" onClick={() => navigate(`/blog/${a.slug}`)}>
                      <Icon name="ExternalLink" size={15} />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-navy" onClick={() => openEdit(a)}>
                    <Icon name="Pencil" size={15} />
                  </Button>
                  <button
                    onClick={() => toggle(a.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-500 transition-colors ${a.published ? 'border-border text-muted-foreground hover:border-red-300' : 'border-green-500 text-green-600 hover:bg-green-50'}`}
                  >
                    {a.published ? 'Снять' : 'Опубликовать'}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------- MAIN CABINET ----------
const Cabinet = () => {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(!!getToken());
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [premium, setPremium] = useState<{ plan: string; status: string } | null>(null);
  const [stats, setStats] = useState<Stats>({ views: 0, leads: 0, products: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.dashboard();
      setSeller(d.seller);
      setProducts(d.products);
      setLeads(d.leads);
      setCerts(d.certificates);
      setMedia(d.media);
      setPremium(d.premium);
      setStats(d.stats);
    } catch (e) {
      clearToken();
      setAuthed(false);
      toast({ title: 'Сессия истекла', description: (e as Error).message });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  const logout = () => { clearToken(); setAuthed(false); };

  const changeLead = async (id: number, status: string) => {
    try {
      await api.leadStatus(id, status);
      setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
    } catch (e) { toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' }); }
  };

  if (!authed) return <AuthScreen onAuth={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-background sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between">
          <button className="flex items-center gap-2" onClick={() => navigate('/')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-navy text-white">
              <Icon name="Container" size={20} />
            </div>
            <span className="font-display text-xl font-700 text-navy">Chinese<span className="text-gold">Bridge</span></span>
          </button>
          <div className="flex items-center gap-3">
            {seller && (
              <div className="hidden sm:flex items-center gap-2">
                {seller.logo_url && <img src={seller.logo_url} alt="" className="h-7 w-7 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                <span className="text-sm font-500 text-navy">{seller.company_name}</span>
                <Badge className="bg-gold text-gold-foreground">{seller.plan}</Badge>
              </div>
            )}
            <Button variant="outline" size="sm" className="border-navy text-navy" onClick={logout}>Выйти</Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl font-700 text-navy">Личный кабинет</h1>
            <p className="text-muted-foreground">{seller?.company_name}</p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-3 gap-4">
          {[
            { v: loading ? '—' : stats.views, l: 'Просмотры', icon: 'Eye' },
            { v: loading ? '—' : stats.leads, l: 'Заявки', icon: 'MessageSquare' },
            { v: loading ? '—' : stats.products, l: 'Товары', icon: 'Package' },
          ].map((m) => (
            <Card key={m.l} className="border-border">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gold/15 text-gold">
                  <Icon name={m.icon} size={22} />
                </div>
                <div>
                  <div className="font-display text-2xl font-700 text-navy">{m.v}</div>
                  <div className="text-sm text-muted-foreground">{m.l}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="products">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="products"><Icon name="Package" size={15} className="mr-1" />Товары</TabsTrigger>
            <TabsTrigger value="media"><Icon name="Image" size={15} className="mr-1" />Фото и видео</TabsTrigger>
            <TabsTrigger value="certs"><Icon name="Award" size={15} className="mr-1" />Сертификаты</TabsTrigger>
            <TabsTrigger value="leads"><Icon name="Inbox" size={15} className="mr-1" />Заявки {stats.leads > 0 && <span className="ml-1 rounded-full bg-gold text-gold-foreground text-xs px-1.5">{stats.leads}</span>}</TabsTrigger>
            <TabsTrigger value="profile"><Icon name="Building2" size={15} className="mr-1" />Профиль компании</TabsTrigger>
            <TabsTrigger value="premium"><Icon name="Sparkles" size={15} className="mr-1" />Премиум</TabsTrigger>
            <TabsTrigger value="blog"><Icon name="Newspaper" size={15} className="mr-1" />Блог</TabsTrigger>
            <TabsTrigger value="contacts"><Icon name="MessageCircle" size={15} className="mr-1" />Заявки с сайта</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="products">
              <ProductsTab
                products={products}
                onAdded={(p) => { setProducts((ps) => [p, ...ps]); setStats((s) => ({ ...s, products: s.products + 1 })); }}
                onDeleted={(id) => { setProducts((ps) => ps.filter((p) => p.id !== id)); setStats((s) => ({ ...s, products: Math.max(0, s.products - 1) })); }}
              />
            </TabsContent>
            <TabsContent value="media">
              <MediaTab
                media={media}
                onAdded={(m) => setMedia((ms) => [m, ...ms])}
                onDeleted={(id) => setMedia((ms) => ms.filter((m) => m.id !== id))}
              />
            </TabsContent>
            <TabsContent value="certs">
              <CertsTab
                certs={certs}
                onAdded={(c) => setCerts((cs) => [c, ...cs])}
                onDeleted={(id) => setCerts((cs) => cs.filter((c) => c.id !== id))}
              />
            </TabsContent>
            <TabsContent value="leads">
              <LeadsTab leads={leads} onChange={changeLead} />
            </TabsContent>
            <TabsContent value="profile">
              {seller && <ProfileTab seller={seller} onSaved={setSeller} />}
            </TabsContent>
            <TabsContent value="premium">
              <PremiumTab
                currentPlan={seller?.plan || 'Verified'}
                premium={premium}
                onBuy={(plan) => { setPremium({ plan, status: 'pending' }); }}
              />
            </TabsContent>
            <TabsContent value="blog">
              <BlogTab navigate={navigate} />
            </TabsContent>
            <TabsContent value="contacts">
              <ContactRequestsTab />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default Cabinet;