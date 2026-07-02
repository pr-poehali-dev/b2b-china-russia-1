import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  type Stats,
} from '@/lib/cabinetApi';

const CATEGORIES = [
  'Электроника',
  'Текстиль и одежда',
  'Товары для дома',
  'Автозапчасти',
  'Промоборудование',
  'Упаковка',
];

const AuthScreen = ({ onAuth }: { onAuth: () => void }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ company_name: '', email: '', password: '', province: '', category: '' });
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setLoading(true);
    try {
      const res =
        mode === 'login'
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
      <Card className="w-full max-w-md border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-navy text-white">
              <Icon name="Container" size={20} />
            </div>
            <span className="font-display text-xl font-700 text-navy">
              Sino<span className="text-gold">Bridge</span>
            </span>
          </div>
          <h1 className="mt-4 font-display text-2xl font-700 text-navy">
            {mode === 'login' ? 'Вход в кабинет продавца' : 'Регистрация продавца'}
          </h1>
        </CardHeader>
        <CardContent className="space-y-3">
          {mode === 'register' && (
            <>
              <Input placeholder="Название компании" value={form.company_name} onChange={(e) => set('company_name', e.target.value)} />
              <Input placeholder="Провинция (напр. Гуандун)" value={form.province} onChange={(e) => set('province', e.target.value)} />
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
              >
                <option value="">Категория</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </>
          )}
          <Input placeholder="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          <Input placeholder="Пароль" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} />
          <Button
            className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
            disabled={loading}
            onClick={submit}
          >
            {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </Button>
          <button
            className="w-full text-sm text-muted-foreground hover:text-navy"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

const AddProductDialog = ({ onAdded }: { onAdded: (p: Product) => void }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', price: '', description: '', image_url: '' });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Укажите название товара', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await api.addProduct(form);
      onAdded(res.product);
      toast({ title: 'Товар добавлен' });
      setForm({ name: '', category: '', price: '', description: '', image_url: '' });
      setOpen(false);
    } catch (e) {
      toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gold text-gold-foreground hover:bg-gold/90">
          <Icon name="Plus" size={16} className="mr-1" />
          Добавить товар
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-navy">Новый товар</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Название товара" value={form.name} onChange={(e) => set('name', e.target.value)} />
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
          >
            <option value="">Категория</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <Input placeholder="Цена (напр. от $5 / шт.)" value={form.price} onChange={(e) => set('price', e.target.value)} />
          <Input placeholder="Ссылка на фото (необязательно)" value={form.image_url} onChange={(e) => set('image_url', e.target.value)} />
          <Textarea placeholder="Описание товара" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <DialogFooter>
          <Button className="bg-gold text-gold-foreground hover:bg-gold/90" disabled={loading} onClick={submit}>
            {loading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const LEAD_STATUSES = ['Новая', 'В работе', 'Закрыта'];

const Cabinet = () => {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(!!getToken());
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats>({ views: 0, leads: 0, products: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.dashboard();
      setSeller(d.seller);
      setProducts(d.products);
      setLeads(d.leads);
      setStats(d.stats);
    } catch (e) {
      clearToken();
      setAuthed(false);
      toast({ title: 'Сессия истекла', description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  const logout = () => {
    clearToken();
    setAuthed(false);
  };

  const removeProduct = async (id: number) => {
    try {
      await api.deleteProduct(id);
      setProducts((ps) => ps.filter((p) => p.id !== id));
      toast({ title: 'Товар удалён' });
    } catch (e) {
      toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const changeLead = async (id: number, status: string) => {
    try {
      await api.leadStatus(id, status);
      setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
    } catch (e) {
      toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' });
    }
  };

  if (!authed) return <AuthScreen onAuth={() => setAuthed(true)} />;

  const activeProducts = products.filter((p) => p.status !== 'Удалён');

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-background">
        <div className="container flex h-16 items-center justify-between">
          <button className="flex items-center gap-2" onClick={() => navigate('/')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-navy text-white">
              <Icon name="Container" size={20} />
            </div>
            <span className="font-display text-xl font-700 text-navy">
              Sino<span className="text-gold">Bridge</span>
            </span>
          </button>
          <div className="flex items-center gap-3">
            {seller && (
              <div className="hidden items-center gap-2 sm:flex">
                <span className="text-sm font-500 text-navy">{seller.company_name}</span>
                <Badge className="bg-gold text-gold-foreground">{seller.plan}</Badge>
              </div>
            )}
            <Button variant="outline" size="sm" className="border-navy text-navy" onClick={logout}>
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <h1 className="font-display text-3xl font-700 text-navy">Личный кабинет</h1>
        <p className="text-muted-foreground">Управляйте товарами, заявками и статистикой</p>

        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { v: stats.views, l: 'Просмотры', icon: 'Eye' },
            { v: stats.leads, l: 'Заявки', icon: 'MessageSquare' },
            { v: stats.products, l: 'Товары', icon: 'Package' },
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

        <Tabs defaultValue="products" className="mt-8">
          <TabsList>
            <TabsTrigger value="products">Товары</TabsTrigger>
            <TabsTrigger value="leads">Заявки</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-4">
            <div className="mb-4 flex justify-end">
              <AddProductDialog onAdded={(p) => { setProducts((ps) => [p, ...ps]); setStats((s) => ({ ...s, products: s.products + 1 })); }} />
            </div>
            {loading ? (
              <p className="text-muted-foreground">Загрузка...</p>
            ) : activeProducts.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                  <Icon name="PackagePlus" size={40} className="text-muted-foreground" />
                  <p className="text-muted-foreground">Пока нет товаров. Добавьте первый!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeProducts.map((p) => (
                  <Card key={p.id} className="border-border">
                    <CardContent className="flex gap-4 p-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <Icon name="Package" size={24} className="text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-600 text-navy">{p.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {p.category || 'Без категории'} · {p.price || 'Цена по запросу'}
                            </div>
                          </div>
                          <Badge variant="secondary">{p.status}</Badge>
                        </div>
                        {p.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Icon name="Eye" size={14} /> {p.views}
                          </span>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeProduct(p.id)}>
                            <Icon name="Trash2" size={16} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="leads" className="mt-4">
            {loading ? (
              <p className="text-muted-foreground">Загрузка...</p>
            ) : leads.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                  <Icon name="Inbox" size={40} className="text-muted-foreground" />
                  <p className="text-muted-foreground">Заявок пока нет</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {leads.map((l) => (
                  <Card key={l.id} className="border-border">
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div>
                        <div className="font-600 text-navy">{l.buyer_name}</div>
                        <div className="text-sm text-muted-foreground">{l.buyer_contact}</div>
                        {l.message && <p className="mt-1 text-sm text-muted-foreground">{l.message}</p>}
                      </div>
                      <div className="flex gap-1">
                        {LEAD_STATUSES.map((s) => (
                          <button
                            key={s}
                            onClick={() => changeLead(l.id, s)}
                            className={`rounded-full border px-3 py-1 text-xs font-500 transition-colors ${
                              l.status === s
                                ? 'border-navy bg-navy text-white'
                                : 'border-border text-muted-foreground hover:border-navy'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Cabinet;
