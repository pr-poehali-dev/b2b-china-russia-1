import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
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

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    blogApi.get(slug)
      .then((d) => { setArticle(d.article); setRelated(d.related); })
      .catch(() => navigate('/blog'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Icon name="Loader2" size={36} className="animate-spin text-gold" />
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container flex h-16 items-center gap-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-navy text-white">
              <Icon name="Container" size={20} />
            </div>
            <span className="font-display text-xl font-700 text-navy hidden sm:block">
              Chinese<span className="text-gold">Bridge</span>
            </span>
          </button>
          <Icon name="ChevronRight" size={14} className="text-muted-foreground" />
          <button onClick={() => navigate('/blog')} className="text-sm text-muted-foreground hover:text-navy">Новости</button>
          <Icon name="ChevronRight" size={14} className="text-muted-foreground" />
          <span className="truncate text-sm text-navy font-500 max-w-xs">{article.title}</span>
        </div>
      </header>

      <div className="container max-w-3xl py-10">
        {/* Meta */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Badge className={TAG_COLORS[article.tag] || TAG_COLORS['Новости']}>{article.tag}</Badge>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Icon name="Calendar" size={14} />
            {article.published_at ? new Date(article.published_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
          </span>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Icon name="Eye" size={14} />{article.views} просмотров
          </span>
        </div>

        <h1 className="font-display text-3xl font-700 leading-tight text-navy md:text-4xl">{article.title}</h1>

        {article.excerpt && (
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed border-l-4 border-gold pl-4">{article.excerpt}</p>
        )}

        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Icon name="User" size={14} />
          <span>{article.author}</span>
        </div>

        {/* Cover */}
        {article.cover_url && (
          <div className="mt-6 overflow-hidden rounded-2xl">
            <img src={article.cover_url} alt={article.title} className="w-full object-cover max-h-80"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        )}

        {/* Content */}
        <div
          className="prose-article mt-8"
          dangerouslySetInnerHTML={{ __html: article.content || '' }}
        />

        {/* Share / back */}
        <div className="mt-10 flex items-center gap-3 border-t border-border pt-6">
          <Button variant="outline" className="border-navy text-navy" onClick={() => navigate('/blog')}>
            <Icon name="ArrowLeft" size={16} className="mr-1" /> Все статьи
          </Button>
          <Button variant="outline" className="border-border text-muted-foreground" onClick={() => navigator.clipboard?.writeText(window.location.href).then(() => {})}>
            <Icon name="Copy" size={16} className="mr-1" /> Скопировать ссылку
          </Button>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-border bg-secondary/30 py-12">
          <div className="container max-w-3xl">
            <h2 className="font-display text-xl font-700 text-navy mb-5">Читайте также</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {related.map((r) => (
                <Card key={r.id} className="hover-lift cursor-pointer border-border" onClick={() => navigate(`/blog/${r.slug}`)}>
                  <CardContent className="p-4">
                    <Badge className={`mb-2 ${TAG_COLORS[r.tag] || TAG_COLORS['Новости']}`}>{r.tag}</Badge>
                    <p className="text-sm font-600 leading-snug text-navy line-clamp-3">{r.title}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {r.published_at ? new Date(r.published_at).toLocaleDateString('ru-RU') : ''}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default BlogArticle;
