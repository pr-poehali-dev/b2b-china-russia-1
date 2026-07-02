import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supplierApi, type PublicSeller } from '@/lib/supplierApi';

const PROVINCES = ['Гуандун', 'Чжэцзян', 'Цзянсу', 'Шаньдун', 'Фуцзянь', 'Хэбэй', 'Шанхай', 'Пекин'];
const CATEGORIES = ['Электроника', 'Текстиль и одежда', 'Товары для дома', 'Автозапчасти', 'Промоборудование', 'Упаковка', 'Красота и здоровье', 'Игрушки и хобби'];
const PLANS = ['Gold', 'Platinum', 'Premium'];

const PLAN_BADGE: Record<string, string> = {
  Gold: 'bg-gold text-gold-foreground',
  Platinum: 'bg-navy text-white',
  Premium: 'bg-secondary text-navy border border-border',
  Verified: 'bg-secondary text-navy border border-border',
};

const SupplierCard = ({ seller }: { seller: PublicSeller }) => {
  const navigate = useNavigate();
  return (
    <Card
      className="hover-lift cursor-pointer border-border transition-shadow"
      onClick={() => navigate(`/supplier/${seller.id}`)}
    >
      <CardContent className="p-5">
        <div className="flex gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary">
            {seller.logo_url ? (
              <img src={seller.logo_url} alt={seller.company_name} className="h-full w-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <span className="font-display text-2xl font-700 text-navy">{seller.company_name[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-600 text-navy truncate">{seller.company_name}</span>
              <Badge className={PLAN_BADGE[seller.plan] || PLAN_BADGE.Verified}>
                {seller.plan === 'Verified' ? <><Icon name="BadgeCheck" size={11} className="mr-0.5" />Проверен</> : seller.plan}
              </Badge>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {seller.province && <span className="flex items-center gap-0.5"><Icon name="MapPin" size={12} />{seller.province}</span>}
              {seller.category && <span className="flex items-center gap-0.5"><Icon name="Tag" size={12} />{seller.category}</span>}
            </div>
            {seller.description && (
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{seller.description}</p>
            )}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 font-600 text-navy">
              <Icon name="Star" size={14} className="text-gold" />
              {Number(seller.rating).toFixed(1)}
            </span>
            <span className="text-muted-foreground">{seller.reviews_count} отзывов</span>
          </div>
          <span className="text-sm font-500 text-gold hover:underline">Открыть профиль →</span>
        </div>
      </CardContent>
    </Card>
  );
};

const Suppliers = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sellers, setSellers] = useState<PublicSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [province, setProvince] = useState(searchParams.get('province') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [plan, setPlan] = useState(searchParams.get('plan') || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = (q: string, prov: string, cat: string, pl: string) => {
    setLoading(true);
    const filters: Record<string, string> = {};
    if (q) filters.q = q;
    if (prov) filters.province = prov;
    if (cat) filters.category = cat;
    if (pl) filters.plan = pl;

    const sp: Record<string, string> = {};
    if (q) sp.q = q;
    if (prov) sp.province = prov;
    if (cat) sp.category = cat;
    if (pl) sp.plan = pl;
    setSearchParams(sp);

    supplierApi.listSuppliers(filters)
      .then((d) => setSellers(d.sellers))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(query, province, category, plan);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [province, category, plan]);

  const onQueryChange = (v: string) => {
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(v, province, category, plan), 400);
  };

  const reset = () => {
    setQuery(''); setProvince(''); setCategory(''); setPlan('');
    load('', '', '', '');
  };

  const hasFilters = query || province || category || plan;

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
          <div className="flex flex-1 items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск поставщиков..."
                className="pl-9"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
              />
            </div>
          </div>
          <Button className="bg-gold text-gold-foreground hover:bg-gold/90 shrink-0" onClick={() => navigate('/cabinet')}>
            Кабинет продавца
          </Button>
        </div>
      </header>

      <div className="container py-8">
        {/* Page title */}
        <div className="mb-6">
          <p className="font-500 text-gold">Каталог</p>
          <h1 className="font-display text-3xl font-700 text-navy md:text-4xl">Поставщики из Китая</h1>
          <p className="mt-1 text-muted-foreground">Верифицированные производители — напрямую к вашему бизнесу</p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar filters */}
          <aside className="w-full shrink-0 lg:w-60">
            <div className="rounded-xl border border-border bg-background p-5 space-y-5 sticky top-24">
              <div className="flex items-center justify-between">
                <span className="font-600 text-navy">Фильтры</span>
                {hasFilters && (
                  <button className="text-xs text-gold hover:underline" onClick={reset}>Сбросить</button>
                )}
              </div>

              {/* Plan */}
              <div>
                <p className="mb-2 text-xs font-600 uppercase tracking-wide text-muted-foreground">Статус</p>
                <div className="space-y-1">
                  {PLANS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlan(plan === p ? '' : p)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${plan === p ? 'bg-navy text-white' : 'hover:bg-secondary text-foreground'}`}
                    >
                      <Icon name="Sparkles" size={14} />
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Province */}
              <div>
                <p className="mb-2 text-xs font-600 uppercase tracking-wide text-muted-foreground">Провинция</p>
                <div className="space-y-1">
                  {PROVINCES.map((p) => (
                    <button
                      key={p}
                      onClick={() => setProvince(province === p ? '' : p)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${province === p ? 'bg-navy text-white' : 'hover:bg-secondary text-foreground'}`}
                    >
                      <Icon name="MapPin" size={14} />
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <p className="mb-2 text-xs font-600 uppercase tracking-wide text-muted-foreground">Категория</p>
                <div className="space-y-1">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(category === c ? '' : c)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition-colors ${category === c ? 'bg-navy text-white' : 'hover:bg-secondary text-foreground'}`}
                    >
                      <Icon name="Tag" size={14} />
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main list */}
          <main className="flex-1">
            {/* Active filters */}
            {hasFilters && (
              <div className="mb-4 flex flex-wrap gap-2">
                {query && <Badge variant="secondary" className="gap-1">{query} <button onClick={() => onQueryChange('')}><Icon name="X" size={11} /></button></Badge>}
                {province && <Badge variant="secondary" className="gap-1">{province} <button onClick={() => setProvince('')}><Icon name="X" size={11} /></button></Badge>}
                {category && <Badge variant="secondary" className="gap-1">{category} <button onClick={() => setCategory('')}><Icon name="X" size={11} /></button></Badge>}
                {plan && <Badge className="gap-1 bg-gold text-gold-foreground">{plan} <button onClick={() => setPlan('')}><Icon name="X" size={11} /></button></Badge>}
              </div>
            )}

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-40 animate-pulse rounded-xl bg-secondary" />
                ))}
              </div>
            ) : sellers.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-20 text-center">
                <Icon name="SearchX" size={48} className="text-muted-foreground" />
                <p className="font-600 text-navy">Поставщики не найдены</p>
                <p className="text-sm text-muted-foreground">Попробуйте изменить фильтры или поисковый запрос</p>
                <Button variant="outline" className="mt-2 border-navy text-navy" onClick={reset}>Сбросить фильтры</Button>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  Найдено: <span className="font-600 text-navy">{sellers.length}</span> поставщиков
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  {sellers.map((s) => <SupplierCard key={s.id} seller={s} />)}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Suppliers;
