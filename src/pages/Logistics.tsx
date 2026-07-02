import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { logisticsApi, type LogisticsCompany, type LogisticsReview } from '@/lib/logisticsApi';

const TYPE_ICON: Record<string, string> = {
  'Морские перевозки': 'Ship',
  'Ж/д перевозки': 'Train',
  'Авиаперевозки': 'Plane',
  'Автоперевозки': 'Truck',
};

const TYPE_COLOR: Record<string, string> = {
  'Морские перевозки': 'bg-blue-100 text-blue-800',
  'Ж/д перевозки': 'bg-amber-100 text-amber-800',
  'Авиаперевозки': 'bg-sky-100 text-sky-800',
  'Автоперевозки': 'bg-green-100 text-green-800',
};

const StarRating = ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <button
        key={s}
        type="button"
        onClick={() => onChange?.(s)}
        className={onChange ? 'cursor-pointer' : 'cursor-default'}
      >
        <Icon name="Star" size={18} className={s <= value ? 'text-gold' : 'text-border'} />
      </button>
    ))}
  </div>
);

const ReviewDialog = ({ company, onAdded }: { company: LogisticsCompany; onAdded: (r: LogisticsReview) => void }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ author: '', company: '', rating: 5, text: '' });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.author.trim() || !form.text.trim()) {
      toast({ title: 'Заполните имя и текст отзыва', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await logisticsApi.addReview({ logistics_id: company.id, ...form });
      onAdded(res.review);
      toast({ title: 'Отзыв добавлен!' });
      setForm({ author: '', company: '', rating: 5, text: '' });
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
        <Button variant="outline" size="sm" className="border-navy text-navy">
          <Icon name="MessageSquarePlus" size={15} className="mr-1" />
          Оставить отзыв
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-navy">Отзыв о {company.company_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Ваше имя *" value={form.author} onChange={(e) => setForm(f => ({ ...f, author: e.target.value }))} />
            <Input placeholder="Компания" value={form.company} onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))} />
          </div>
          <div>
            <p className="mb-1.5 text-sm text-muted-foreground">Оценка</p>
            <StarRating value={form.rating} onChange={(v) => setForm(f => ({ ...f, rating: v }))} />
          </div>
          <Textarea
            placeholder="Расскажите о вашем опыте работы с компанией *"
            className="min-h-28"
            value={form.text}
            onChange={(e) => setForm(f => ({ ...f, text: e.target.value }))}
          />
        </div>
        <DialogFooter>
          <Button className="bg-gold text-gold-foreground hover:bg-gold/90 w-full" disabled={loading} onClick={submit}>
            {loading ? 'Отправка...' : 'Отправить отзыв'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const CompanyCard = ({ c, onSelect }: { c: LogisticsCompany; onSelect: (c: LogisticsCompany) => void }) => (
  <Card
    className="hover-lift cursor-pointer border-border"
    onClick={() => onSelect(c)}
  >
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary">
            {c.logo_url
              ? <img src={c.logo_url} alt={c.company_name} className="h-full w-full object-cover" />
              : <Icon name={TYPE_ICON[c.type] || 'Truck'} size={26} className="text-navy" />
            }
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-600 text-navy">{c.company_name}</span>
              {c.featured && <Icon name="BadgeCheck" size={16} className="text-gold" />}
            </div>
            <Badge className={`mt-1 text-xs ${TYPE_COLOR[c.type] || 'bg-secondary text-navy'}`}>
              <Icon name={TYPE_ICON[c.type] || 'Truck'} size={12} className="mr-1" />
              {c.type}
            </Badge>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 justify-end">
            <Icon name="Star" size={14} className="text-gold" />
            <span className="font-700 text-navy">{Number(c.rating).toFixed(1)}</span>
          </div>
          <span className="text-xs text-muted-foreground">{c.reviews_count} отзывов</span>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-3 pt-0">
      {c.description && (
        <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {c.transit_time && (
          <div className="flex items-center gap-1.5 rounded-lg bg-secondary/70 px-3 py-2 text-sm">
            <Icon name="Clock" size={14} className="text-gold shrink-0" />
            <span className="text-navy font-500">{c.transit_time}</span>
          </div>
        )}
        {c.min_weight && (
          <div className="flex items-center gap-1.5 rounded-lg bg-secondary/70 px-3 py-2 text-sm">
            <Icon name="Weight" size={14} className="text-gold shrink-0" />
            <span className="text-navy font-500">от {c.min_weight}</span>
          </div>
        )}
      </div>
      {c.routes && (
        <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <Icon name="Route" size={14} className="mt-0.5 shrink-0 text-gold" />
          <span className="line-clamp-1">{c.routes}</span>
        </div>
      )}
      <div className="flex items-center justify-between border-t border-border pt-2">
        <div className="flex gap-2">
          {c.telegram && (
            <a href={`https://t.me/${c.telegram.replace('@', '')}`} target="_blank" rel="noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary hover:bg-gold/10 transition-colors"
              onClick={(e) => e.stopPropagation()}>
              ✈️
            </a>
          )}
          {c.phone && (
            <a href={`tel:${c.phone}`} className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary hover:bg-gold/10 transition-colors"
              onClick={(e) => e.stopPropagation()}>
              <Icon name="Phone" size={14} className="text-navy" />
            </a>
          )}
          {c.email && (
            <a href={`mailto:${c.email}`} className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary hover:bg-gold/10 transition-colors"
              onClick={(e) => e.stopPropagation()}>
              <Icon name="Mail" size={14} className="text-navy" />
            </a>
          )}
        </div>
        <span className="text-sm font-500 text-gold">Подробнее →</span>
      </div>
    </CardContent>
  </Card>
);

const CompanyDetail = ({ c, reviews, onReviewAdded, onClose }: {
  c: LogisticsCompany;
  reviews: LogisticsReview[];
  onReviewAdded: (r: LogisticsReview) => void;
  onClose: () => void;
}) => (
  <div>
    <button onClick={onClose} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-navy transition-colors">
      <Icon name="ArrowLeft" size={16} />
      Назад к списку
    </button>

    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-secondary">
            {c.logo_url
              ? <img src={c.logo_url} alt={c.company_name} className="h-full w-full object-cover" />
              : <Icon name={TYPE_ICON[c.type] || 'Truck'} size={32} className="text-navy" />
            }
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl font-700 text-navy">{c.company_name}</h2>
              {c.featured && <Badge className="bg-gold text-gold-foreground">Проверен</Badge>}
            </div>
            <Badge className={`mt-1 ${TYPE_COLOR[c.type] || 'bg-secondary text-navy'}`}>
              <Icon name={TYPE_ICON[c.type] || 'Truck'} size={13} className="mr-1" />
              {c.type}
            </Badge>
            <div className="mt-2 flex items-center gap-2">
              <StarRating value={Math.round(c.rating)} />
              <span className="font-700 text-navy">{Number(c.rating).toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({c.reviews_count} отзывов)</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {c.description && (
          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="font-display font-600 text-navy mb-2">О компании</h3>
              <p className="text-muted-foreground leading-relaxed">{c.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Routes */}
        {c.routes && (
          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="font-display font-600 text-navy mb-3">Маршруты</h3>
              <div className="space-y-2">
                {c.routes.split(',').map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Icon name="Route" size={14} className="text-gold shrink-0" />
                    <span className="text-muted-foreground">{r.trim()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-xl font-700 text-navy">
              Отзывы <span className="text-muted-foreground font-400">({reviews.length})</span>
            </h3>
            <ReviewDialog company={c} onAdded={onReviewAdded} />
          </div>

          {reviews.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                <Icon name="MessageSquare" size={36} className="text-muted-foreground" />
                <p className="text-muted-foreground">Пока нет отзывов. Будьте первым!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <Card key={r.id} className="border-border">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy font-display font-700 text-white">
                          {r.author[0]}
                        </div>
                        <div>
                          <div className="font-600 text-navy">{r.author}</div>
                          {r.company && <div className="text-xs text-muted-foreground">{r.company}</div>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StarRating value={r.rating} />
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{r.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <Card className="border-border">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-display font-600 text-navy">Условия</h3>
            {c.transit_time && (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/15 text-gold">
                  <Icon name="Clock" size={16} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Срок доставки</div>
                  <div className="font-600 text-navy">{c.transit_time}</div>
                </div>
              </div>
            )}
            {c.min_weight && (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/15 text-gold">
                  <Icon name="Weight" size={16} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Минимальный вес</div>
                  <div className="font-600 text-navy">{c.min_weight}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-display font-600 text-navy">Контакты</h3>
            {c.phone && (
              <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-sm hover:text-gold transition-colors">
                <Icon name="Phone" size={15} className="text-gold" />
                <span>{c.phone}</span>
              </a>
            )}
            {c.email && (
              <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-sm hover:text-gold transition-colors">
                <Icon name="Mail" size={15} className="text-gold" />
                <span>{c.email}</span>
              </a>
            )}
            {c.telegram && (
              <a href={`https://t.me/${c.telegram.replace('@', '')}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-sm hover:text-gold transition-colors">
                <span className="text-base">✈️</span>
                <span>{c.telegram}</span>
              </a>
            )}
            {c.wechat && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-base">💬</span>
                <span>{c.wechat}</span>
              </div>
            )}
            {c.website && (
              <a href={c.website} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-sm hover:text-gold transition-colors">
                <Icon name="Globe" size={15} className="text-gold" />
                <span className="truncate">{c.website}</span>
              </a>
            )}
            <Button className="w-full bg-gold text-gold-foreground hover:bg-gold/90 mt-2" asChild>
              <a href={`mailto:${c.email}`}>Запросить расчёт</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

const Logistics = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<LogisticsCompany[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [activeType, setActiveType] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LogisticsCompany | null>(null);
  const [reviews, setReviews] = useState<LogisticsReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    logisticsApi.list(activeType || undefined)
      .then((d) => { setCompanies(d.companies); setTypes(d.types); })
      .finally(() => setLoading(false));
  }, [activeType]);

  const openCompany = async (c: LogisticsCompany) => {
    setSelected(c);
    setReviewsLoading(true);
    try {
      const d = await logisticsApi.get(String(c.id));
      setReviews(d.reviews);
    } finally {
      setReviewsLoading(false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeCompany = () => { setSelected(null); setReviews([]); };

  const onReviewAdded = (r: LogisticsReview) => {
    setReviews((rs) => [r, ...rs]);
    setCompanies((cs) => cs.map((c) => c.id === selected?.id
      ? { ...c, reviews_count: c.reviews_count + 1 }
      : c
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-navy text-white">
              <Icon name="Container" size={20} />
            </div>
            <span className="font-display text-xl font-700 text-navy hidden sm:block">
              Chinese<span className="text-gold">Bridge</span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-muted-foreground" onClick={() => navigate('/suppliers')}>Поставщики</Button>
            <Button variant="ghost" className="text-muted-foreground" onClick={() => navigate('/blog')}>Новости</Button>
            <Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => navigate('/cabinet')}>Кабинет</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border bg-navy-deep py-16 text-white">
        <div className="container">
          <p className="font-500 text-gold">Логистика</p>
          <h1 className="font-display text-4xl font-700 md:text-5xl">Доставка из Китая в Россию</h1>
          <p className="mt-3 max-w-xl text-white/70">Проверенные логистические компании — море, ж/д, авиа и авто. Реальные отзывы клиентов.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { icon: 'Ship', label: 'Море', time: '18–35 дней' },
              { icon: 'Train', label: 'Ж/д', time: '12–20 дней' },
              { icon: 'Plane', label: 'Авиа', time: '3–7 дней' },
              { icon: 'Truck', label: 'Авто', time: '15–25 дней' },
            ].map((m) => (
              <div key={m.label} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
                <Icon name={m.icon} size={18} className="text-gold" />
                <div>
                  <div className="text-sm font-600">{m.label}</div>
                  <div className="text-xs text-white/60">{m.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container py-10">
        {selected ? (
          reviewsLoading
            ? <div className="flex items-center justify-center py-20"><Icon name="Loader2" size={32} className="animate-spin text-gold" /></div>
            : <CompanyDetail c={selected} reviews={reviews} onReviewAdded={onReviewAdded} onClose={closeCompany} />
        ) : (
          <>
            {/* Type filter */}
            <div className="mb-6 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveType('')}
                className={`rounded-full border px-4 py-1.5 text-sm font-500 transition-colors ${!activeType ? 'border-navy bg-navy text-white' : 'border-border text-muted-foreground hover:border-navy'}`}
              >
                Все виды
              </button>
              {types.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveType(activeType === t ? '' : t)}
                  className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-500 transition-colors ${activeType === t ? 'border-navy bg-navy text-white' : 'border-border text-muted-foreground hover:border-navy'}`}
                >
                  <Icon name={TYPE_ICON[t] || 'Truck'} size={14} />
                  {t}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="grid gap-5 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-64 animate-pulse rounded-xl bg-secondary" />)}
              </div>
            ) : (
              <>
                {companies.filter(c => c.featured).length > 0 && (
                  <div className="mb-8">
                    <div className="mb-3 flex items-center gap-2">
                      <Icon name="BadgeCheck" size={18} className="text-gold" />
                      <span className="font-600 text-navy">Проверенные партнёры</span>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                      {companies.filter(c => c.featured).map(c => <CompanyCard key={c.id} c={c} onSelect={openCompany} />)}
                    </div>
                  </div>
                )}
                {companies.filter(c => !c.featured).length > 0 && (
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <Icon name="Building2" size={18} className="text-muted-foreground" />
                      <span className="font-600 text-navy">Другие компании</span>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                      {companies.filter(c => !c.featured).map(c => <CompanyCard key={c.id} c={c} onSelect={openCompany} />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Logistics;
