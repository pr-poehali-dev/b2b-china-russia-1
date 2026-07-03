import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supplierApi, type CatalogProduct, type CatalogCategory } from '@/lib/supplierApi';
import { buyerApi, isBuyerAuthed } from '@/lib/buyerApi';
import { toast } from '@/hooks/use-toast';

const PLAN_BADGE: Record<string, string> = {
  Gold: 'bg-gold text-gold-foreground',
  Platinum: 'bg-navy text-white',
  Premium: 'bg-secondary text-navy border border-border',
  Verified: 'bg-secondary text-navy border border-border',
};

const ProductFavoriteIcon = ({ productId }: { productId: number }) => {
  const [liked, setLiked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isBuyerAuthed()) return;
    buyerApi.checkFavorites('product').then((d) => setLiked(d.ids.includes(productId))).catch(() => {});
  }, [productId]);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isBuyerAuthed()) {
      navigate('/account');
      return;
    }
    try {
      if (liked) {
        await buyerApi.removeFavorite('product', productId);
        setLiked(false);
      } else {
        await buyerApi.addFavorite('product', productId);
        setLiked(true);
      }
    } catch (err) {
      toast({ title: 'Ошибка', description: (err as Error).message, variant: 'destructive' });
    }
  };

  return (
    <button
      onClick={toggle}
      className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white transition-colors"
    >
      <Icon name="Heart" size={15} className={liked ? 'fill-red-400 text-red-400' : 'text-navy'} />
    </button>
  );
};

const ProductCard = ({ product }: { product: CatalogProduct }) => {
  const navigate = useNavigate();
  return (
    <Card
      className="hover-lift cursor-pointer border-border overflow-hidden group"
      onClick={() => navigate(`/supplier/${product.seller_id}`)}
    >
      <div className="relative flex h-40 items-center justify-center overflow-hidden bg-secondary sm:h-48">
        <ProductFavoriteIcon productId={product.id} />
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover transition-transform group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <Icon name="Package" size={36} className="text-muted-foreground" />
        )}
      </div>
      <CardContent className="p-4">
        <div className="font-600 text-navy line-clamp-1">{product.name}</div>
        {product.category && <div className="text-sm text-muted-foreground">{product.category}</div>}
        {product.price && <div className="mt-1 font-600 text-gold">{product.price}</div>}
        <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <Badge className={`${PLAN_BADGE[product.plan] || PLAN_BADGE.Verified} shrink-0`}>
              {product.plan === 'Verified' ? <Icon name="BadgeCheck" size={11} /> : product.plan}
            </Badge>
            <span className="truncate text-xs text-muted-foreground">{product.company_name}</span>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground flex items-center gap-1">
            <Icon name="Eye" size={12} />{product.views}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

const Products = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const load = (q: string, cat: string) => {
    setLoading(true);
    const filters: Record<string, string> = {};
    if (q) filters.q = q;
    if (cat) filters.category = cat;

    const sp: Record<string, string> = {};
    if (q) sp.q = q;
    if (cat) sp.category = cat;
    setSearchParams(sp);

    supplierApi.listProducts(filters)
      .then((d) => { setProducts(d.products); setCategories(d.categories); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(query, category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const onQueryChange = (v: string) => {
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(v, category), 400);
  };

  const reset = () => {
    setQuery(''); setCategory('');
    load('', '');
  };

  const hasFilters = query || category;

  const FilterList = ({ onApply }: { onApply?: () => void }) => (
    <div>
      <p className="mb-2 text-xs font-600 uppercase tracking-wide text-muted-foreground">Категория</p>
      <div className="space-y-1">
        {categories.map((c) => (
          <button
            key={c.category}
            onClick={() => { setCategory(category === c.category ? '' : c.category); onApply?.(); }}
            className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm text-left transition-colors ${
              category === c.category ? 'bg-navy text-white' : 'hover:bg-secondary text-foreground'
            }`}
          >
            <span className="flex items-center gap-2"><Icon name="Tag" size={14} />{c.category}</span>
            <span className={category === c.category ? 'text-white/70' : 'text-muted-foreground'}>{c.count}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between gap-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-navy text-white">
              <Icon name="Container" size={20} />
            </div>
            <span className="font-display text-xl font-700 text-navy hidden sm:block">
              Chinese<span className="text-gold">Cart</span>
            </span>
          </button>
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск товаров..."
                className="pl-9 h-10"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
              />
            </div>
            <button
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border lg:hidden relative"
              onClick={() => setFiltersOpen(o => !o)}
            >
              <Icon name="SlidersHorizontal" size={18} className="text-navy" />
              {hasFilters && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-gold" />}
            </button>
          </div>
          <Button className="hidden sm:flex bg-gold text-gold-foreground hover:bg-gold/90 shrink-0" onClick={() => navigate('/account')}>
            Кабинет
          </Button>
        </div>
      </header>

      {/* Mobile filters drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setFiltersOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-background p-5 shadow-xl"
            onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display font-600 text-navy">Фильтры</span>
              <div className="flex gap-2">
                {hasFilters && <button className="text-xs text-gold hover:underline" onClick={() => { reset(); setFiltersOpen(false); }}>Сбросить</button>}
                <button onClick={() => setFiltersOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border">
                  <Icon name="X" size={16} />
                </button>
              </div>
            </div>
            <FilterList onApply={() => setFiltersOpen(false)} />
          </div>
        </div>
      )}

      <div className="container py-6 md:py-8">
        <div className="mb-5">
          <p className="font-500 text-gold">Каталог</p>
          <h1 className="font-display text-2xl font-700 text-navy sm:text-3xl md:text-4xl">Товары из Китая</h1>
          <p className="mt-1 text-sm text-muted-foreground">Товары от верифицированных поставщиков — напрямую к вашему бизнесу</p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="rounded-xl border border-border bg-background p-5 space-y-5 sticky top-24">
              <div className="flex items-center justify-between">
                <span className="font-600 text-navy">Фильтры</span>
                {hasFilters && <button className="text-xs text-gold hover:underline" onClick={reset}>Сбросить</button>}
              </div>
              <FilterList />
            </div>
          </aside>

          <main className="flex-1">
            {hasFilters && (
              <div className="mb-4 flex flex-wrap gap-2">
                {query && <Badge variant="secondary" className="gap-1">{query} <button onClick={() => onQueryChange('')}><Icon name="X" size={11} /></button></Badge>}
                {category && <Badge variant="secondary" className="gap-1">{category} <button onClick={() => setCategory('')}><Icon name="X" size={11} /></button></Badge>}
              </div>
            )}

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-64 animate-pulse rounded-xl bg-secondary" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-20 text-center">
                <Icon name="SearchX" size={48} className="text-muted-foreground" />
                <p className="font-600 text-navy">Товары не найдены</p>
                <p className="text-sm text-muted-foreground">Попробуйте изменить фильтры или поисковый запрос</p>
                <Button variant="outline" className="mt-2 border-navy text-navy" onClick={reset}>Сбросить фильтры</Button>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  Найдено: <span className="font-600 text-navy">{products.length}</span> товаров
                </p>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {products.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Products;
