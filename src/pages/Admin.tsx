import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import {
  adminApi, getAdminToken, setAdminToken, clearAdminToken,
  type AdminSeller, type AdminProduct, type AdminLogistics,
} from '@/lib/adminApi';

const CATEGORIES = ['Электроника', 'Текстиль и одежда', 'Товары для дома', 'Автозапчасти', 'Промоборудование', 'Упаковка'];
const PROVINCES = ['Гуандун', 'Чжэцзян', 'Цзянсу', 'Шаньдун', 'Фуцзянь', 'Хэбэй', 'Шанхай', 'Пекин'];
const LOGISTICS_TYPES = ['Морские перевозки', 'Ж/д перевозки', 'Авиаперевозки', 'Автоперевозки'];

// ---------- AUTH ----------
const AuthScreen = ({ onAuth }: { onAuth: () => void }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!password) return;
    setLoading(true);
    try {
      const res = await adminApi.login(password);
      setAdminToken(res.token);
      toast({ title: 'Вход выполнен' });
      onAuth();
    } catch (e) {
      toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-deep px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-navy text-white">
              <Icon name="ShieldCheck" size={20} />
            </div>
            <span className="font-display text-xl font-700 text-navy">Админ-панель</span>
          </div>
          <h1 className="font-display text-xl font-700 text-navy">Вход для администратора</h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="password"
            placeholder="Пароль администратора"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <Button className="w-full bg-navy hover:bg-navy-deep" disabled={loading} onClick={submit}>
            {loading ? 'Проверка...' : 'Войти'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// ---------- ADD SELLER DIALOG ----------
const AddSellerDialog = ({ onAdded }: { onAdded: (s: AdminSeller) => void }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ company_name: '', email: '', password: '', province: '', category: '', plan: 'Verified' });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.company_name.trim() || !form.email.trim()) {
      toast({ title: 'Укажите название компании и email', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await adminApi.addSeller(form);
      onAdded(res.seller);
      toast({
        title: 'Поставщик добавлен',
        description: res.seller.generated_password ? `Пароль для входа: ${res.seller.generated_password}` : undefined,
      });
      setForm({ company_name: '', email: '', password: '', province: '', category: '', plan: 'Verified' });
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
          Добавить поставщика
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-navy">Новый поставщик</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Название компании *" value={form.company_name} onChange={(e) => set('company_name', e.target.value)} />
          <Input placeholder="Email *" value={form.email} onChange={(e) => set('email', e.target.value)} />
          <Input placeholder="Пароль (оставьте пустым — сгенерируется)" value={form.password} onChange={(e) => set('password', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.province} onChange={(e) => set('province', e.target.value)}>
              <option value="">Провинция</option>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">Категория</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button className="w-full bg-gold text-gold-foreground hover:bg-gold/90" disabled={loading} onClick={submit}>
            {loading ? 'Добавление...' : 'Добавить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ---------- ADD PRODUCT DIALOG ----------
const AddProductDialog = ({ sellers, onAdded }: { sellers: AdminSeller[]; onAdded: (p: AdminProduct) => void }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ seller_id: '', name: '', category: '', price: '', description: '' });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.seller_id || !form.name.trim()) {
      toast({ title: 'Выберите поставщика и укажите название товара', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await adminApi.addProduct({ ...form, seller_id: Number(form.seller_id) });
      const seller = sellers.find((s) => s.id === Number(form.seller_id));
      onAdded({ ...res.product, seller_id: Number(form.seller_id), company_name: seller?.company_name || '' });
      toast({ title: 'Товар добавлен' });
      setForm({ seller_id: '', name: '', category: '', price: '', description: '' });
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
          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.seller_id} onChange={(e) => set('seller_id', e.target.value)}>
            <option value="">Выберите поставщика *</option>
            {sellers.map((s) => <option key={s.id} value={s.id}>{s.company_name}</option>)}
          </select>
          <Input placeholder="Название товара *" value={form.name} onChange={(e) => set('name', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">Категория</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Input placeholder="Цена" value={form.price} onChange={(e) => set('price', e.target.value)} />
          </div>
          <Input placeholder="Описание" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <DialogFooter>
          <Button className="w-full bg-gold text-gold-foreground hover:bg-gold/90" disabled={loading} onClick={submit}>
            {loading ? 'Добавление...' : 'Добавить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ---------- ADD LOGISTICS DIALOG ----------
const AddLogisticsDialog = ({ onAdded }: { onAdded: (l: AdminLogistics) => void }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    company_name: '', type: '', description: '', routes: '', transit_time: '', min_weight: '',
    phone: '', email: '', website: '', telegram: '', wechat: '', logo_url: '', featured: false,
  });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.company_name.trim() || !form.type) {
      toast({ title: 'Укажите название компании и тип перевозок', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await adminApi.addLogistics(form);
      onAdded(res.logistics);
      toast({ title: 'Карго-компания добавлена' });
      setForm({ company_name: '', type: '', description: '', routes: '', transit_time: '', min_weight: '', phone: '', email: '', website: '', telegram: '', wechat: '', logo_url: '', featured: false });
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
          Добавить карго
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-navy">Новая карго-компания</DialogTitle>
        </DialogHeader>
        <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
          <Input placeholder="Название компании *" value={form.company_name} onChange={(e) => set('company_name', e.target.value)} />
          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.type} onChange={(e) => set('type', e.target.value)}>
            <option value="">Тип перевозок *</option>
            {LOGISTICS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <Textarea placeholder="Описание" value={form.description} onChange={(e) => set('description', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Маршруты" value={form.routes} onChange={(e) => set('routes', e.target.value)} />
            <Input placeholder="Срок доставки" value={form.transit_time} onChange={(e) => set('transit_time', e.target.value)} />
          </div>
          <Input placeholder="Мин. вес партии" value={form.min_weight} onChange={(e) => set('min_weight', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Телефон" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            <Input placeholder="Email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Telegram" value={form.telegram} onChange={(e) => set('telegram', e.target.value)} />
            <Input placeholder="WeChat" value={form.wechat} onChange={(e) => set('wechat', e.target.value)} />
          </div>
          <Input placeholder="Сайт" value={form.website} onChange={(e) => set('website', e.target.value)} />
          <Input placeholder="Ссылка на логотип" value={form.logo_url} onChange={(e) => set('logo_url', e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-navy">
            <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
            Показывать как топ-компанию
          </label>
        </div>
        <DialogFooter>
          <Button className="w-full bg-gold text-gold-foreground hover:bg-gold/90" disabled={loading} onClick={submit}>
            {loading ? 'Добавление...' : 'Добавить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ---------- MAIN ----------
const Admin = () => {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(!!getAdminToken());
  const [sellers, setSellers] = useState<AdminSeller[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [logistics, setLogistics] = useState<AdminLogistics[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, p, l] = await Promise.all([adminApi.sellers(), adminApi.products(), adminApi.logistics()]);
      setSellers(s.sellers);
      setProducts(p.products);
      setLogistics(l.logistics);
    } catch (e) {
      if ((e as Error).message.includes('авторизац')) {
        clearAdminToken();
        setAuthed(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) loadData();
  }, [authed]);

  const deleteSeller = async (id: number) => {
    try {
      await adminApi.deleteSeller(id);
      setSellers((s) => s.filter((x) => x.id !== id));
      setProducts((p) => p.filter((x) => x.seller_id !== id));
      toast({ title: 'Поставщик удалён' });
    } catch (e) {
      toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const deleteProduct = async (id: number) => {
    try {
      await adminApi.deleteProduct(id);
      setProducts((p) => p.filter((x) => x.id !== id));
      toast({ title: 'Товар удалён' });
    } catch (e) {
      toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const deleteLogistics = async (id: number) => {
    try {
      await adminApi.deleteLogistics(id);
      setLogistics((l) => l.filter((x) => x.id !== id));
      toast({ title: 'Карго-компания удалена' });
    } catch (e) {
      toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const logout = () => {
    clearAdminToken();
    setAuthed(false);
  };

  if (!authed) return <AuthScreen onAuth={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-navy text-white">
              <Icon name="ShieldCheck" size={20} />
            </div>
            <span className="font-display text-xl font-700 text-navy hidden sm:block">Админ-панель</span>
          </button>
          <Button variant="outline" onClick={logout}>
            <Icon name="LogOut" size={15} className="mr-1" />
            Выйти
          </Button>
        </div>
      </header>

      <div className="container py-8">
        <Tabs defaultValue="sellers">
          <TabsList className="mb-6">
            <TabsTrigger value="sellers">Поставщики ({sellers.length})</TabsTrigger>
            <TabsTrigger value="products">Товары ({products.length})</TabsTrigger>
            <TabsTrigger value="logistics">Карго ({logistics.length})</TabsTrigger>
          </TabsList>

          {/* SELLERS */}
          <TabsContent value="sellers">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-700 text-navy">Все поставщики</h2>
              <AddSellerDialog onAdded={(s) => setSellers((prev) => [s, ...prev])} />
            </div>
            {loading ? (
              <div className="flex justify-center py-16"><Icon name="Loader2" size={32} className="animate-spin text-gold" /></div>
            ) : sellers.length === 0 ? (
              <Card className="border-dashed"><CardContent className="py-10 text-center text-muted-foreground">Поставщиков пока нет</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {sellers.map((s) => (
                  <Card key={s.id} className="border-border">
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      <div>
                        <div className="font-600 text-navy">{s.company_name}</div>
                        <div className="text-sm text-muted-foreground">{s.email} · {s.province || '—'} · {s.category || '—'}</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-500 text-navy">{s.plan}</span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600">
                              <Icon name="Trash2" size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Удалить поставщика?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Компания «{s.company_name}» и все её товары будут удалены безвозвратно.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteSeller(s.id)}>
                                Удалить
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* PRODUCTS */}
          <TabsContent value="products">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-700 text-navy">Все товары</h2>
              <AddProductDialog sellers={sellers} onAdded={(p) => setProducts((prev) => [p, ...prev])} />
            </div>
            {loading ? (
              <div className="flex justify-center py-16"><Icon name="Loader2" size={32} className="animate-spin text-gold" /></div>
            ) : products.length === 0 ? (
              <Card className="border-dashed"><CardContent className="py-10 text-center text-muted-foreground">Товаров пока нет</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {products.map((p) => (
                  <Card key={p.id} className="border-border">
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary">
                          {p.image_url
                            ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                            : <Icon name="Package" size={20} className="text-muted-foreground" />
                          }
                        </div>
                        <div>
                          <div className="font-600 text-navy">{p.name}</div>
                          <div className="text-sm text-muted-foreground">{p.company_name} · {p.category || '—'} · {p.price || '—'}</div>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600 shrink-0">
                            <Icon name="Trash2" size={16} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Удалить товар?</AlertDialogTitle>
                            <AlertDialogDescription>Товар «{p.name}» будет удалён безвозвратно.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteProduct(p.id)}>
                              Удалить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* LOGISTICS (КАРГО) */}
          <TabsContent value="logistics">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-700 text-navy">Все карго-компании</h2>
              <AddLogisticsDialog onAdded={(l) => setLogistics((prev) => [l, ...prev])} />
            </div>
            {loading ? (
              <div className="flex justify-center py-16"><Icon name="Loader2" size={32} className="animate-spin text-gold" /></div>
            ) : logistics.length === 0 ? (
              <Card className="border-dashed"><CardContent className="py-10 text-center text-muted-foreground">Карго-компаний пока нет</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {logistics.map((l) => (
                  <Card key={l.id} className="border-border">
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary">
                          {l.logo_url
                            ? <img src={l.logo_url} alt={l.company_name} className="h-full w-full object-cover" />
                            : <Icon name="Truck" size={20} className="text-muted-foreground" />
                          }
                        </div>
                        <div>
                          <div className="font-600 text-navy">{l.company_name}</div>
                          <div className="text-sm text-muted-foreground">{l.type} · {l.transit_time || '—'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {l.featured && <span className="rounded-full bg-gold px-2.5 py-1 text-xs font-500 text-gold-foreground">Топ</span>}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600">
                              <Icon name="Trash2" size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Удалить карго-компанию?</AlertDialogTitle>
                              <AlertDialogDescription>Компания «{l.company_name}» будет удалена безвозвратно, вместе с отзывами.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteLogistics(l.id)}>
                                Удалить
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;