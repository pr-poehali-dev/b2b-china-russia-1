import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { blogApi, type Article } from '@/lib/blogApi';

const TAG_COLORS: Record<string, string> = {
  'Торговля': 'bg-navy text-white',
  'Логистика': 'bg-gold text-gold-foreground',
  'Регулирование': 'bg-secondary text-navy border border-border',
  'Новости': 'bg-secondary text-navy border border-border',
};

const ArticleCard = ({ a, onClick }: { a: Article; onClick: () => void }) => (
  <Card className="hover-lift cursor-pointer border-border overflow-hidden" onClick={onClick}>
    <div className="h-44 overflow-hidden bg-secondary">
      {a.cover_url
        ? <img src={a.cover_url} alt={a.title} className="h-full w-full object-cover transition-transform hover:scale-105" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        : <div className="flex h-full items-center justify-center"><Icon name="Newspaper" size={40} className="text-muted-foreground" /></div>}
    </div>
    <CardContent className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <Badge className={TAG_COLORS[a.tag] || TAG_COLORS['Новости']}>{a.tag}</Badge>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Icon name="Eye" size={12} />{a.views}
        </span>
      </div>
      <h3 className="font-display text-lg font-600 leading-snug text-navy line-clamp-2">{a.title}</h3>
      {a.excerpt && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p>}
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Icon name="User" size={12} />{a.author}</span>
        <span className="flex items-center gap-1">
          <Icon name="Calendar" size={12} />
          {a.published_at ? new Date(a.published_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
        </span>
      </div>
    </CardContent>
  </Card>
);

const Blog = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [tag, setTag] = useState(searchParams.get('tag') || '');

  const load = (q: string, t: string) => {
    setLoading(true);
    const sp: Record<string, string> = {};
    if (q) sp.q = q;
    if (t) sp.tag = t;
    setSearchParams(sp);
    const params: Record<string, string> = {};
    if (q) params.q = q;
    if (t) params.tag = t;
    blogApi.list(params)
      .then((d) => { setArticles(d.articles); setTags(d.tags); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(query, tag); }, [tag]);

  let debounce: ReturnType<typeof setTimeout>;
  const onSearch = (v: string) => {
    setQuery(v);
    clearTimeout(debounce);
    debounce = setTimeout(() => load(v, tag), 400);
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
          <div className="relative flex-1 max-w-sm">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Поиск по статьям..." className="pl-9" value={query} onChange={(e) => onSearch(e.target.value)} />
          </div>
          <Button className="bg-gold text-gold-foreground hover:bg-gold/90 shrink-0" onClick={() => navigate('/suppliers')}>
            Каталог
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border bg-navy-deep py-16 text-white">
        <div className="container">
          <p className="font-500 text-gold">Медиа</p>
          <h1 className="font-display text-4xl font-700 md:text-5xl">Новости и аналитика</h1>
          <p className="mt-3 max-w-xl text-white/70">Торговля Китай — Россия: актуальные новости, изменения в регулировании, логистика и рынок</p>
        </div>
      </section>

      <div className="container py-10">
        {/* Tags filter */}
        {tags.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              onClick={() => setTag('')}
              className={`rounded-full border px-4 py-1.5 text-sm font-500 transition-colors ${!tag ? 'border-navy bg-navy text-white' : 'border-border text-muted-foreground hover:border-navy'}`}
            >
              Все темы
            </button>
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => setTag(tag === t ? '' : t)}
                className={`rounded-full border px-4 py-1.5 text-sm font-500 transition-colors ${tag === t ? 'border-navy bg-navy text-white' : 'border-border text-muted-foreground hover:border-navy'}`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 animate-pulse rounded-xl bg-secondary" />)}
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Icon name="Newspaper" size={48} className="text-muted-foreground" />
            <p className="font-600 text-navy">Статьи не найдены</p>
            <Button variant="outline" className="border-navy text-navy" onClick={() => { setQuery(''); setTag(''); load('', ''); }}>
              Сбросить фильтры
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">Найдено: <span className="font-600 text-navy">{articles.length}</span> материалов</p>
            {/* Featured — first article large */}
            {articles[0] && (
              <div
                className="hover-lift mb-6 cursor-pointer overflow-hidden rounded-2xl border border-border"
                onClick={() => navigate(`/blog/${articles[0].slug}`)}
              >
                <div className="grid md:grid-cols-2">
                  <div className="h-56 overflow-hidden bg-secondary md:h-auto">
                    {articles[0].cover_url
                      ? <img src={articles[0].cover_url} alt={articles[0].title} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                      : <div className="flex h-full items-center justify-center"><Icon name="Newspaper" size={48} className="text-muted-foreground" /></div>}
                  </div>
                  <div className="flex flex-col justify-center p-8">
                    <Badge className={TAG_COLORS[articles[0].tag] || TAG_COLORS['Новости']}>{articles[0].tag}</Badge>
                    <h2 className="mt-3 font-display text-2xl font-700 leading-snug text-navy">{articles[0].title}</h2>
                    {articles[0].excerpt && <p className="mt-2 text-muted-foreground">{articles[0].excerpt}</p>}
                    <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Icon name="User" size={13} />{articles[0].author}</span>
                      <span className="flex items-center gap-1"><Icon name="Eye" size={13} />{articles[0].views}</span>
                    </div>
                    <Button className="mt-5 w-fit bg-navy text-white hover:bg-navy-deep">
                      Читать статью <Icon name="ArrowRight" size={16} className="ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {/* Rest */}
            {articles.length > 1 && (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {articles.slice(1).map((a) => (
                  <ArticleCard key={a.id} a={a} onClick={() => navigate(`/blog/${a.slug}`)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Blog;
