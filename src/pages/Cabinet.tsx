import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadPhoto, uploadVideo, importExcel } from '@/lib/uploadApi';
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
const EMPTY_FORM = { name: '', category: '', price: '', description: '', sku: '', min_order: '', quantity: '' };

const ProductsTab = ({ products, onAdded, onDeleted }: { products: Product[]; onAdded: (p: Product) => void; onDeleted: (id: number) => void }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handlePhotoFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < Math.min(files.length, 8); i++) {
        const url = await uploadPhoto(files[i]);
        urls.push(url);
      }
      setPhotos((prev) => [...prev, ...urls].slice(0, 8));
    } catch (e) { toast({ title: 'Ошибка загрузки фото', description: (e as Error).message, variant: 'destructive' }); }
    finally { setUploading(false); }
  };

  const submit = async () => {
    if (!form.name.trim()) { toast({ title: 'Укажите название', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const res = await api.addProduct({ ...form, photos, image_url: photos[0] });
      onAdded(res.product);
      toast({ title: 'Товар добавлен' });
      setForm(EMPTY_FORM); setPhotos([]); setOpen(false);
    } catch (e) { toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const handleExcel = async (files: FileList | null) => {
    if (!files?.[0]) return;
    setImporting(true);
    try {
      const result = await importExcel(files[0]);
      (result.imported as Product[]).forEach((p) => onAdded(p));
      toast({
        title: `Импортировано ${result.count} товаров`,
        description: result.errors.length ? `Пропущено: ${result.errors.slice(0, 3).join('; ')}` : undefined,
      });
      setImportMode(false);
    } catch (e) { toast({ title: 'Ошибка импорта', description: (e as Error).message, variant: 'destructive' }); }
    finally { setImporting(false); if (excelInputRef.current) excelInputRef.current.value = ''; }
  };

  const del = async (id: number) => {
    try { await api.deleteProduct(id); onDeleted(id); toast({ title: 'Товар удалён' }); }
    catch (e) { toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' }); }
  };

  return (
    <div>
      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain" />
          <button className="absolute right-4 top-4 text-white"><Icon name="X" size={28} /></button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Добавляйте товары вручную или загружайте из Excel/CSV</p>
        <div className="flex gap-2">
          {/* Excel import */}
          <input ref={excelInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
            onChange={(e) => handleExcel(e.target.files)} />
          <Button variant="outline" className="border-navy text-navy" disabled={importing}
            onClick={() => excelInputRef.current?.click()}>
            {importing
              ? <><Icon name="Loader2" size={15} className="mr-1 animate-spin" />Импорт...</>
              : <><Icon name="FileSpreadsheet" size={15} className="mr-1" />Excel / CSV</>}
          </Button>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(EMPTY_FORM); setPhotos([]); } }}>
            <DialogTrigger asChild>
              <Button className="bg-gold text-gold-foreground hover:bg-gold/90">
                <Icon name="Plus" size={16} className="mr-1" />Добавить товар
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle className="font-display text-navy">Новый товар</DialogTitle></DialogHeader>
              <div className="max-h-[65vh] overflow-y-auto space-y-3 pr-1">

                {/* Photos upload */}
                <div>
                  <p className="mb-2 text-sm font-500 text-navy">Фотографии товара (до 8 шт.)</p>
                  <div className="grid grid-cols-4 gap-2">
                    {photos.map((url, i) => (
                      <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary cursor-pointer"
                        onClick={() => setLightbox(url)}>
                        <img src={url} className="h-full w-full object-cover" />
                        {i === 0 && <span className="absolute left-1 top-1 rounded bg-gold px-1 text-[10px] font-600 text-gold-foreground">Главное</span>}
                        <button className="absolute right-1 top-1 hidden rounded-full bg-black/60 p-0.5 group-hover:block"
                          onClick={(e) => { e.stopPropagation(); setPhotos((ps) => ps.filter((_, j) => j !== i)); }}>
                          <Icon name="X" size={12} className="text-white" />
                        </button>
                      </div>
                    ))}
                    {photos.length < 8 && (
                      <button
                        className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-gold transition-colors text-muted-foreground hover:text-gold"
                        onClick={() => photoInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading
                          ? <Icon name="Loader2" size={20} className="animate-spin" />
                          : <><Icon name="ImagePlus" size={20} /><span className="text-[10px]">Добавить</span></>}
                      </button>
                    )}
                  </div>
                  <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => handlePhotoFiles(e.target.files)} />
                  {photos.length === 0 && (
                    <button
                      className="mt-2 w-full rounded-lg border-2 border-dashed border-border py-6 text-center hover:border-gold transition-colors"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading
                        ? <><Icon name="Loader2" size={18} className="inline animate-spin mr-2" />Загрузка...</>
                        : <><Icon name="Upload" size={18} className="inline mr-2 text-gold" />Перетащите фото или нажмите для выбора</>}
                    </button>
                  )}
                </div>

                <Input placeholder="Название товара *" value={form.name} onChange={(e) => set('name', e.target.value)} />
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.category} onChange={(e) => set('category', e.target.value)}>
                  <option value="">Категория</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Цена (напр. от $5/шт.)" value={form.price} onChange={(e) => set('price', e.target.value)} />
                  <Input placeholder="Артикул / SKU" value={form.sku} onChange={(e) => set('sku', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Мин. заказ (напр. 100 шт.)" value={form.min_order} onChange={(e) => set('min_order', e.target.value)} />
                  <Input placeholder="Остаток на складе" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
                </div>
                <Textarea placeholder="Описание товара" value={form.description} onChange={(e) => set('description', e.target.value)} className="min-h-24" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
                <Button className="bg-gold text-gold-foreground hover:bg-gold/90" disabled={loading || uploading} onClick={submit}>
                  {loading ? <><Icon name="Loader2" size={15} className="mr-1 animate-spin" />Сохранение...</> : 'Сохранить товар'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Excel format hint */}
      <div className="mb-4 rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
        <Icon name="Info" size={14} className="inline mr-1.5 text-gold" />
        Для импорта из Excel колонки: <span className="font-500 text-navy">название, категория, цена, описание, артикул, мин. заказ, фото</span>
        <a href="#" className="ml-2 text-gold hover:underline" onClick={(e) => { e.preventDefault(); }}>Скачать шаблон</a>
      </div>

      {products.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <Icon name="PackagePlus" size={44} className="text-muted-foreground" />
          <p className="font-600 text-navy">Пока нет товаров</p>
          <p className="text-sm text-muted-foreground">Добавьте вручную или загрузите из Excel</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {products.map((p) => {
            const allPhotos = (p.photos?.length ? p.photos : p.image_url ? [p.image_url] : []);
            return (
              <Card key={p.id} className="border-border overflow-hidden">
                {/* Photo strip */}
                {allPhotos.length > 0 && (
                  <div className="flex gap-1 bg-secondary p-2">
                    {allPhotos.slice(0, 5).map((url, i) => (
                      <div key={i} className="relative h-20 flex-1 cursor-pointer overflow-hidden rounded-md"
                        onClick={() => setLightbox(url)}>
                        <img src={url} alt="" className="h-full w-full object-cover hover:scale-105 transition-transform" />
                        {i === 0 && allPhotos.length > 1 && (
                          <span className="absolute bottom-1 right-1 rounded bg-black/50 px-1 text-[10px] text-white">+{allPhotos.length - 1}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-600 text-navy truncate">{p.name}</div>
                      <div className="text-sm text-muted-foreground">{p.category || 'Без категории'} · {p.price || 'Цена по запросу'}</div>
                      {(p.sku || p.min_order) && (
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {p.sku && <span>Арт.: {p.sku}</span>}
                          {p.min_order && <span>Мин.: {p.min_order}</span>}
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary" className="shrink-0">{p.status}</Badge>
                  </div>
                  {p.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Icon name="Eye" size={14} />{p.views}
                      {allPhotos.length > 0 && <><Icon name="Image" size={14} className="ml-2" />{allPhotos.length}</>}
                    </span>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => del(p.id)}>
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------- MEDIA TAB ----------
const MediaTab = ({ media, onAdded, onDeleted }: { media: Media[]; onAdded: (m: Media) => void; onDeleted: (id: number) => void }) => {
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const handlePhoto = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const url = await uploadPhoto(files[i]);
        const res = await api.addMedia({ url, type: 'photo', caption });
        onAdded(res.media);
      }
      toast({ title: `Загружено ${files.length} фото` });
      setCaption('');
    } catch (e) { toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' }); }
    finally { setUploading(false); if (photoRef.current) photoRef.current.value = ''; }
  };

  const handleVideo = async (files: FileList | null) => {
    if (!files?.[0]) return;
    const file = files[0];
    setUploading(true);
    setVideoProgress(0);
    try {
      const url = await uploadVideo(file, (pct) => setVideoProgress(pct));
      const res = await api.addMedia({ url, type: 'video', caption });
      onAdded(res.media);
      toast({ title: 'Видео загружено!' });
      setCaption('');
    } catch (e) { toast({ title: 'Ошибка загрузки', description: (e as Error).message, variant: 'destructive' }); }
    finally { setUploading(false); setVideoProgress(null); if (videoRef.current) videoRef.current.value = ''; }
  };

  const del = async (id: number) => {
    try { await api.deleteMedia(id); onDeleted(id); }
    catch (e) { toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' }); }
  };

  return (
    <div>
      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain" />
          <button className="absolute right-4 top-4 text-white"><Icon name="X" size={28} /></button>
        </div>
      )}

      <p className="mb-4 text-sm text-muted-foreground">Фото и видео производства повышают доверие покупателей</p>

      {/* Upload zones */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {/* Photo upload */}
        <div className="rounded-xl border-2 border-dashed border-border p-5 hover:border-gold transition-colors">
          <div className="mb-3 flex items-center gap-2">
            <Icon name="Image" size={20} className="text-gold" />
            <span className="font-600 text-navy">Фотографии</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">JPG, PNG, WEBP · несколько файлов сразу</p>
          <input
            placeholder="Подпись (необязательно)"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            className="mb-3 h-8 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <input ref={photoRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => handlePhoto(e.target.files)} />
          <Button
            className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
            disabled={uploading}
            onClick={() => photoRef.current?.click()}
          >
            {uploading && videoProgress === null
              ? <><Icon name="Loader2" size={15} className="mr-1 animate-spin" />Загрузка...</>
              : <><Icon name="Upload" size={15} className="mr-1" />Выбрать фото</>}
          </Button>
        </div>

        {/* Video upload */}
        <div className="rounded-xl border-2 border-dashed border-border p-5 hover:border-gold transition-colors">
          <div className="mb-3 flex items-center gap-2">
            <Icon name="Video" size={20} className="text-gold" />
            <span className="font-600 text-navy">Видео производства</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">MP4, MOV, AVI, WEBM · любой размер</p>

          {videoProgress !== null ? (
            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Загружается...</span>
                <span className="font-600 text-navy">{videoProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-gold transition-all duration-300"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <input
              placeholder="Подпись (необязательно)"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className="mb-3 h-8 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          )}

          <input ref={videoRef} type="file" accept="video/*" className="hidden"
            onChange={e => handleVideo(e.target.files)} />
          <Button
            className="w-full bg-navy text-white hover:bg-navy-deep"
            disabled={uploading}
            onClick={() => videoRef.current?.click()}
          >
            {videoProgress !== null
              ? <><Icon name="Loader2" size={15} className="mr-1 animate-spin" />Загрузка {videoProgress}%</>
              : <><Icon name="Film" size={15} className="mr-1" />Выбрать видео</>}
          </Button>
        </div>
      </div>

      {/* Gallery */}
      {media.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <Icon name="ImagePlus" size={40} className="text-muted-foreground" />
          <p className="text-muted-foreground">Загруженные фото и видео появятся здесь</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {media.map((m) => (
            <div key={m.id} className="group relative overflow-hidden rounded-xl border border-border bg-secondary">
              {m.type === 'photo' ? (
                <div className="cursor-pointer" onClick={() => setLightbox(m.url)}>
                  <img src={m.url} alt={m.caption || ''} className="h-40 w-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                </div>
              ) : (
                <div className="flex h-40 flex-col items-center justify-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy/10">
                    <Icon name="PlayCircle" size={36} className="text-navy" />
                  </div>
                  <a href={m.url} target="_blank" rel="noreferrer" className="text-xs text-gold hover:underline">
                    Открыть видео
                  </a>
                </div>
              )}
              {m.caption && <p className="px-2 pb-2 pt-1 text-xs text-muted-foreground">{m.caption}</p>}
              {/* Type badge */}
              <span className="absolute left-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white">
                {m.type === 'video' ? '🎬 Видео' : '📷 Фото'}
              </span>
              <button
                className="absolute right-2 top-2 rounded-full bg-white/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => del(m.id)}
              >
                <Icon name="X" size={14} className="text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------- REELS TAB ----------
const VIDEO_CATEGORIES = ['Производство', 'Упаковка', 'Контроль качества', 'Отгрузка', 'Склад', 'Новинки', 'Акции'];

const ReelsTab = ({ media, onAdded, onDeleted, seller }: {
  media: Media[];
  onAdded: (m: Media) => void;
  onDeleted: (id: number) => void;
  seller: Seller | null;
}) => {
  const navigate = useNavigate();
  const [caption, setCaption] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [videoCategory, setVideoCategory] = useState('');
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<{ total_videos: number; total_views: number; total_likes: number } | null>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const videos = media.filter(m => m.type === 'video');

  useEffect(() => {
    if (seller?.id) {
      import('@/lib/feedApi').then(({ feedApi }) => {
        feedApi.analytics(String(seller.id)).then(d => {
          if (d.totals) setAnalytics(d.totals);
        });
      });
    }
  }, [seller?.id]);

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '').replace(/\s+/g, '');
    if (tag && !hashtags.includes(tag) && hashtags.length < 8) {
      setHashtags(h => [...h, tag]);
      setHashtagInput('');
    }
  };

  const handleVideo = async (files: FileList | null) => {
    if (!files?.[0]) return;
    setUploading(true);
    setVideoProgress(0);
    try {
      const url = await uploadVideo(files[0], pct => setVideoProgress(pct));
      const res = await api.addMedia({ url, type: 'video', caption });
      // update meta with hashtags & category
      if (hashtags.length > 0 || videoCategory) {
        import('@/lib/feedApi').then(({ feedApi }) => {
          import('@/lib/cabinetApi').then(({ getToken }) => {
            feedApi.updateVideo(getToken(), res.media.id, caption, hashtags, videoCategory);
          });
        });
      }
      onAdded(res.media);
      toast({ title: 'Видео загружено и появилось в ленте!' });
      setCaption(''); setHashtags([]); setVideoCategory('');
    } catch (e) { toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' }); }
    finally { setUploading(false); setVideoProgress(null); if (videoRef.current) videoRef.current.value = ''; }
  };

  const del = async (id: number) => {
    try { await api.deleteMedia(id); onDeleted(id); }
    catch (e) { toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' }); }
  };

  return (
    <div className="space-y-5">

      {/* Analytics strip */}
      {analytics && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { v: analytics.total_videos, l: 'Видео', icon: 'Film' },
            { v: analytics.total_views, l: 'Просмотров', icon: 'Eye' },
            { v: analytics.total_likes, l: 'Лайков', icon: 'Heart' },
          ].map(m => (
            <div key={m.l} className="rounded-xl border border-border bg-background p-3 text-center">
              <Icon name={m.icon} size={18} className="mx-auto mb-1 text-gold" />
              <div className="font-display text-xl font-700 text-navy">{m.v}</div>
              <div className="text-xs text-muted-foreground">{m.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Link to public feed */}
      <div className="flex items-center justify-between rounded-xl border border-gold/30 bg-gold/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon name="Clapperboard" size={18} className="text-gold" />
          <div>
            <div className="text-sm font-600 text-navy">Публичная лента видео</div>
            <div className="text-xs text-muted-foreground">Ваши видео видят все покупатели</div>
          </div>
        </div>
        <Button size="sm" className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => navigate('/feed')}>
          Открыть
        </Button>
      </div>

      {/* Upload zone */}
      <div className="rounded-2xl border-2 border-dashed border-border bg-secondary/30 p-5 hover:border-gold transition-colors">
        <p className="mb-4 font-600 text-navy flex items-center gap-2">
          <Icon name="Upload" size={18} className="text-gold" />
          Загрузить новое видео
        </p>
        <div className="space-y-3">
          <Textarea
            placeholder="Описание видео — что показано, какой товар или процесс..."
            value={caption}
            onChange={e => setCaption(e.target.value)}
            className="min-h-20 resize-none"
          />
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={videoCategory}
            onChange={e => setVideoCategory(e.target.value)}
          >
            <option value="">Категория видео</option>
            {VIDEO_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>

          {/* Hashtags */}
          <div>
            <div className="flex gap-2">
              <Input
                placeholder="Хэштег (без #) — нажмите Enter"
                value={hashtagInput}
                onChange={e => setHashtagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addHashtag(); } }}
                className="flex-1"
              />
              <Button variant="outline" className="border-navy text-navy shrink-0" onClick={addHashtag}>
                + Добавить
              </Button>
            </div>
            {hashtags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {hashtags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-500 text-gold">
                    #{tag}
                    <button onClick={() => setHashtags(h => h.filter(t => t !== tag))}>
                      <Icon name="X" size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">#станки #одежда #мебель #производство — помогают покупателям найти вас</p>
          </div>

          <div className="rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground flex items-center gap-1.5">
            <Icon name="Info" size={13} />
            Максимальный размер видео — 200 МБ.
          </div>

          {videoProgress !== null && (
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Загружается в ленту...</span>
                <span className="font-600 text-navy">{videoProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-gold transition-all duration-300" style={{ width: `${videoProgress}%` }} />
              </div>
            </div>
          )}

          <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => handleVideo(e.target.files)} />
          <Button
            className="w-full bg-gold text-gold-foreground hover:bg-gold/90 h-11"
            disabled={uploading}
            onClick={() => videoRef.current?.click()}
          >
            {videoProgress !== null
              ? <><Icon name="Loader2" size={16} className="mr-2 animate-spin" />Загрузка {videoProgress}%</>
              : <><Icon name="Upload" size={16} className="mr-2" />Выбрать видео</>}
          </Button>
        </div>
      </div>

      {/* Videos grid */}
      {videos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Icon name="Clapperboard" size={40} className="text-muted-foreground" />
            <p className="font-600 text-navy">Видео ещё не загружены</p>
            <p className="text-sm text-muted-foreground">Покажите производство, упаковку, контроль качества</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {videos.map((m) => (
            <div key={m.id} className="group relative overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: '9/16' }}>
              {playing === m.id ? (
                <video src={m.url} className="h-full w-full object-cover" controls autoPlay onEnded={() => setPlaying(null)} />
              ) : (
                <>
                  <video src={m.url + '#t=0.5'} className="h-full w-full object-cover opacity-70" preload="metadata" muted />
                  <div className="absolute inset-0 flex items-center justify-center" onClick={() => setPlaying(m.id)}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm border border-white/40">
                      <Icon name="Play" size={20} className="text-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 p-2">
                    {m.caption && <p className="text-[11px] text-white line-clamp-2 mb-1">{m.caption}</p>}
                    <div className="flex items-center gap-2 text-[10px] text-white/70">
                      <span className="flex items-center gap-0.5"><Icon name="Eye" size={10} />{(m as Media & { views_count?: number }).views_count || 0}</span>
                      <span className="flex items-center gap-0.5"><Icon name="Heart" size={10} />{(m as Media & { likes_count?: number }).likes_count || 0}</span>
                    </div>
                  </div>
                  <button
                    className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => del(m.id)}
                  >
                    <Icon name="Trash2" size={12} className="text-white" />
                  </button>
                </>
              )}
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
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const handleLogoFile = async (files: FileList | null) => {
    if (!files?.[0]) return;
    setLogoUploading(true);
    try {
      const url = await uploadPhoto(files[0]);
      set('logo_url', url);
      toast({ title: 'Логотип загружен' });
    } catch (e) { toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' }); }
    finally { setLogoUploading(false); }
  };

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
        <CardHeader><CardTitle className="font-display text-lg text-navy">Логотип компании</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-border bg-secondary">
              {form.logo_url
                ? <img src={form.logo_url} alt="Лого" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                : <Icon name="Building2" size={32} className="text-muted-foreground" />}
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">JPG, PNG · рекомендуется квадрат</p>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleLogoFile(e.target.files)} />
              <Button
                variant="outline"
                className="border-navy text-navy"
                disabled={logoUploading}
                onClick={() => logoInputRef.current?.click()}
              >
                {logoUploading
                  ? <><Icon name="Loader2" size={15} className="mr-1 animate-spin" />Загрузка...</>
                  : <><Icon name="Upload" size={15} className="mr-1" />Загрузить файлом</>}
              </Button>
              {form.logo_url && (
                <button className="block text-xs text-muted-foreground hover:text-destructive" onClick={() => set('logo_url', '')}>
                  Удалить лого
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader><CardTitle className="font-display text-lg text-navy">Описание компании</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea placeholder="Расскажите о компании: специализация, опыт, преимущества..." value={form.description || ''} onChange={(e) => set('description', e.target.value)} className="min-h-32" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.province || ''} onChange={(e) => set('province', e.target.value)}>
              <option value="">Провинция Китая</option>
              {PROVINCES.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.category || ''} onChange={(e) => set('category', e.target.value)}>
              <option value="">Категория товаров</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input placeholder="Год основания" type="number" value={form.founded_year || ''} onChange={(e) => set('founded_year', parseInt(e.target.value) || 0)} className="h-11" />
            <Input placeholder="Сотрудников (напр. 50–200)" value={form.employees || ''} onChange={(e) => set('employees', e.target.value)} className="h-11" />
          </div>
          <Input placeholder="Сайт компании" value={form.website || ''} onChange={(e) => set('website', e.target.value)} />
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader><CardTitle className="font-display text-lg text-navy">Контакты для покупателей</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <span className="text-2xl">💬</span>
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">WeChat ID</div>
              <Input placeholder="Ваш WeChat" value={form.wechat || ''} onChange={(e) => set('wechat', e.target.value)} className="border-0 p-0 h-auto focus-visible:ring-0" />
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <span className="text-2xl">📱</span>
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">WhatsApp</div>
              <Input placeholder="+86 xxx xxxx xxxx" value={form.whatsapp || ''} onChange={(e) => set('whatsapp', e.target.value)} className="border-0 p-0 h-auto focus-visible:ring-0" />
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <span className="text-2xl">✈️</span>
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">Telegram</div>
              <Input placeholder="@username" value={form.telegram || ''} onChange={(e) => set('telegram', e.target.value)} className="border-0 p-0 h-auto focus-visible:ring-0" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button className="bg-gold text-gold-foreground hover:bg-gold/90 w-full sm:w-auto" disabled={loading} onClick={save}>
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

      <main className="container py-5 md:py-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h1 className="font-display text-2xl font-700 text-navy sm:text-3xl">Личный кабинет</h1>
            <p className="text-sm text-muted-foreground">{seller?.company_name}</p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4">
          {[
            { v: loading ? '—' : stats.views, l: 'Просмотры', icon: 'Eye' },
            { v: loading ? '—' : stats.leads, l: 'Заявки', icon: 'MessageSquare' },
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

        <Tabs defaultValue="profile">
          <div className="overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="flex h-auto w-max gap-1 sm:flex-wrap sm:w-auto">
              <TabsTrigger value="profile" className="shrink-0"><Icon name="Building2" size={15} className="mr-1" />Профиль</TabsTrigger>
              <TabsTrigger value="reels" className="shrink-0"><Icon name="Clapperboard" size={15} className="mr-1" />Рилсы</TabsTrigger>
              <TabsTrigger value="certs" className="shrink-0"><Icon name="Award" size={15} className="mr-1" />Сертификаты</TabsTrigger>
              <TabsTrigger value="leads" className="shrink-0"><Icon name="Inbox" size={15} className="mr-1" />Заявки {stats.leads > 0 && <span className="ml-1 rounded-full bg-gold text-gold-foreground text-xs px-1.5">{stats.leads}</span>}</TabsTrigger>
              <TabsTrigger value="premium" className="shrink-0"><Icon name="Sparkles" size={15} className="mr-1" />Премиум</TabsTrigger>
              <TabsTrigger value="blog" className="shrink-0"><Icon name="Newspaper" size={15} className="mr-1" />Блог</TabsTrigger>
              <TabsTrigger value="contacts" className="shrink-0"><Icon name="MessageCircle" size={15} className="mr-1" />Заявки с сайта</TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-6">
            <TabsContent value="profile">
              {seller && <ProfileTab seller={seller} onSaved={setSeller} />}
            </TabsContent>
            <TabsContent value="reels">
              <ReelsTab
                media={media}
                seller={seller}
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