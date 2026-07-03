import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { blogApi, type Article } from '@/lib/blogApi';
import { supplierApi } from '@/lib/supplierApi';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const FACTORY_IMG =
  'https://cdn.poehali.dev/projects/a67ff9c5-8157-472c-832f-296b77b78a02/files/2049d829-79a7-4c2f-a5d6-2d4802b8c55d.jpg';

const NAV = [
  { label: 'Главная', href: '/' },
  { label: 'Поставщики', href: '/suppliers' },
  { label: '🎬 Видео', href: '/feed' },
  { label: 'Логистика', href: '/logistics' },
  { label: 'Новости', href: '/blog' },
  { label: 'Контакты', href: '#contacts' },
];

const STATS = [
  { value: '12 400+', label: 'Поставщиков' },
  { value: '860 000+', label: 'Товаров' },
  { value: '31', label: 'Провинция' },
  { value: '4 200+', label: 'Сделок в месяц' },
];

const PROVINCES = [
  'Гуандун',
  'Чжэцзян',
  'Цзянсу',
  'Шаньдун',
  'Фуцзянь',
  'Хэбэй',
];

const SUPPLIERS = [
  {
    id: 1,
    name: 'Shenzhen TechCore Ltd.',
    category: 'Электроника',
    province: 'Гуандун',
    rating: 4.9,
    reviews: 218,
    years: 12,
    verified: true,
    tag: 'Gold',
  },
  {
    id: 2,
    name: 'Ningbo HomeStyle Mfg.',
    category: 'Товары для дома',
    province: 'Чжэцзян',
    rating: 4.8,
    reviews: 156,
    years: 9,
    verified: true,
    tag: 'Premium',
  },
  {
    id: 3,
    name: 'Suzhou TextilePro',
    category: 'Текстиль',
    province: 'Цзянсу',
    rating: 4.7,
    reviews: 132,
    years: 7,
    verified: true,
    tag: 'Verified',
  },
  {
    id: 4,
    name: 'Foshan AutoParts Co.',
    category: 'Автозапчасти',
    province: 'Гуандун',
    rating: 4.9,
    reviews: 301,
    years: 15,
    verified: true,
    tag: 'Gold',
  },
];

const CATEGORIES = [
  { icon: 'Cpu', name: 'Электроника', count: '142 000' },
  { icon: 'Shirt', name: 'Текстиль и одежда', count: '98 400' },
  { icon: 'Home', name: 'Товары для дома', count: '76 200' },
  { icon: 'Car', name: 'Автозапчасти', count: '54 800' },
  { icon: 'Wrench', name: 'Промоборудование', count: '41 300' },
  { icon: 'Package', name: 'Упаковка', count: '33 900' },
  { icon: 'Sparkles', name: 'Красота и здоровье', count: '29 600' },
  { icon: 'Gamepad2', name: 'Игрушки и хобби', count: '22 100' },
];

const LOGISTICS = [
  {
    icon: 'Ship',
    name: 'Морские перевозки',
    desc: 'Контейнеры FCL/LCL из портов Шанхай, Нинбо, Шэньчжэнь',
    time: '18–35 дней',
  },
  {
    icon: 'Train',
    name: 'Ж/д доставка',
    desc: 'Прямые составы Китай — Россия через погранпереходы',
    time: '12–20 дней',
  },
  {
    icon: 'Plane',
    name: 'Авиадоставка',
    desc: 'Срочные грузы и образцы под ключ с таможней',
    time: '3–7 дней',
  },
];

const TAG_BADGE: Record<string, string> = {
  'Торговля': 'bg-navy text-white',
  'Логистика': 'bg-gold text-gold-foreground',
  'Регулирование': 'bg-secondary text-navy border border-border',
  'Новости': 'bg-secondary text-navy border border-border',
};

const tagColor: Record<string, string> = {
  Gold: 'bg-gold text-gold-foreground',
  Premium: 'bg-navy text-white',
  Verified: 'bg-secondary text-navy',
};

const Index = () => {
  const [activeProvince, setActiveProvince] = useState('Все провинции');
  const [news, setNews] = useState<Article[]>([]);
  const [contactForm, setContactForm] = useState({ name: '', company: '', email: '', phone: '', product_interest: '', budget: '', message: '' });
  const [contactSent, setContactSent] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    blogApi.list().then((d) => setNews((d.articles || []).slice(0, 3)));
  }, []);

  const setContact = (k: string, v: string) => setContactForm((f) => ({ ...f, [k]: v }));

  const submitContact = async () => {
    if (!contactForm.name.trim() || (!contactForm.email.trim() && !contactForm.phone.trim())) {
      return;
    }
    setContactLoading(true);
    try {
      await supplierApi.contact(contactForm);
      setContactSent(true);
    } catch {
      // silent
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-navy text-white">
              <Icon name="Container" size={20} />
            </div>
            <span className="font-display text-xl font-700 text-navy">
              Chinese<span className="text-gold">Bridge</span>
            </span>
          </div>
          <nav className="hidden items-center gap-5 lg:flex">
            {NAV.map((item, i) => (
              <a
                key={item.label}
                href={item.href}
                onClick={item.href.startsWith('/') ? (e) => { e.preventDefault(); navigate(item.href); } : undefined}
                className={`text-sm font-500 transition-colors hover:text-gold ${i === 0 ? 'text-navy' : 'text-muted-foreground'}`}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button
              className="hidden sm:inline-flex bg-gold text-gold-foreground hover:bg-gold/90"
              onClick={() => navigate('/cabinet')}
            >
              Кабинет продавца
            </Button>
            {/* Mobile hamburger */}
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border lg:hidden"
              onClick={() => setMobileMenuOpen(o => !o)}
            >
              <Icon name={mobileMenuOpen ? 'X' : 'Menu'} size={20} className="text-navy" />
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border bg-background px-4 pb-4 pt-2 lg:hidden">
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => {
                    if (item.href.startsWith('/')) { e.preventDefault(); navigate(item.href); }
                    setMobileMenuOpen(false);
                  }}
                  className="rounded-lg px-3 py-2.5 text-sm font-500 text-foreground hover:bg-secondary hover:text-navy transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <Button
                className="mt-2 w-full bg-gold text-gold-foreground hover:bg-gold/90"
                onClick={() => { navigate('/cabinet'); setMobileMenuOpen(false); }}
              >
                Кабинет продавца
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-deep text-white">
        <div className="absolute inset-0 grid-texture opacity-40" />
        <img
          src={FACTORY_IMG}
          alt="Производство в Китае"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/85 to-transparent" />
        <div className="container relative py-14 md:py-32">
          <div className="max-w-2xl animate-fade-in">
            <Badge className="mb-4 bg-gold/15 text-gold hover:bg-gold/15">
              B2B платформа Китай — Россия
            </Badge>
            <h1 className="font-display text-3xl font-700 leading-tight sm:text-4xl md:text-6xl">
              Проверенные поставщики из Китая — напрямую к вашему бизнесу
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/70 sm:text-lg">
              Тысячи верифицированных производителей, каталог товаров,
              логистика и переводы. Всё для безопасного выхода на рынок.
            </p>

            <div className="mt-6 flex flex-col gap-2 rounded-xl bg-white/10 p-2 backdrop-blur-sm sm:flex-row">
              <div className="flex flex-1 items-center gap-2 px-3">
                <Icon name="Search" size={20} className="text-white/60 shrink-0" />
                <Input
                  placeholder="Найти поставщика или товар..."
                  className="border-0 bg-transparent text-white placeholder:text-white/50 focus-visible:ring-0 h-11 text-base"
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate('/suppliers'); }}
                />
              </div>
              <Button
                size="lg"
                className="h-11 bg-gold text-gold-foreground hover:bg-gold/90"
                onClick={() => navigate('/suppliers')}
              >
                Искать
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="font-display text-2xl font-700 text-gold md:text-3xl">
                    {s.value}
                  </div>
                  <div className="text-sm text-white/60">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-12 md:py-20">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-500 text-gold">Каталог товаров</p>
            <h2 className="font-display text-2xl font-700 text-navy sm:text-3xl md:text-4xl">
              Поиск по категориям
            </h2>
          </div>
          <Button variant="outline" className="border-navy text-navy" onClick={() => navigate('/suppliers')}>
            Все категории
            <Icon name="ArrowRight" size={16} className="ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Card
              key={c.name}
              className="hover-lift cursor-pointer border-border"
              onClick={() => navigate(`/suppliers?category=${encodeURIComponent(c.name)}`)}
            >
              <CardContent className="flex flex-col gap-2 p-3 sm:gap-3 sm:p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-navy sm:h-12 sm:w-12">
                  <Icon name={c.icon} size={20} />
                </div>
                <div>
                  <div className="text-sm font-600 text-navy sm:text-base">{c.name}</div>
                  <div className="text-xs text-muted-foreground sm:text-sm">
                    {c.count} товаров
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Suppliers */}
      <section className="bg-secondary/50 py-12 md:py-20">
        <div className="container">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-500 text-gold">Каталог поставщиков</p>
              <h2 className="font-display text-2xl font-700 text-navy sm:text-3xl md:text-4xl">
                Проверенные производители
              </h2>
            </div>
            <Button variant="outline" className="border-navy text-navy" onClick={() => navigate('/suppliers')}>
              Все поставщики
              <Icon name="ArrowRight" size={16} className="ml-1" />
            </Button>
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            {['Все провинции', ...PROVINCES].map((p) => (
              <button
                key={p}
                onClick={() => setActiveProvince(p)}
                className={`rounded-full border px-4 py-1.5 text-sm font-500 transition-colors ${
                  activeProvince === p
                    ? 'border-navy bg-navy text-white'
                    : 'border-border bg-background text-muted-foreground hover:border-navy'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {SUPPLIERS.map((s) => (
              <Card key={s.name} className="hover-lift border-border">
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy font-display text-lg font-700 text-white">
                      {s.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-600 text-navy">{s.name}</span>
                        {s.verified && (
                          <Icon
                            name="BadgeCheck"
                            size={16}
                            className="text-gold"
                          />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {s.category} · {s.province}
                      </div>
                    </div>
                  </div>
                  <Badge className={tagColor[s.tag]}>{s.tag}</Badge>
                </CardHeader>
                <CardContent className="flex items-center justify-between pt-0">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 font-600 text-navy">
                      <Icon name="Star" size={15} className="text-gold" />
                      {s.rating}
                    </span>
                    <span className="text-muted-foreground">
                      {s.reviews} отзывов
                    </span>
                    <span className="text-muted-foreground">
                      {s.years} лет на рынке
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-navy text-navy"
                    onClick={() => navigate(`/supplier/${s.id || 1}`)}
                  >
                    Профиль
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Seller dashboard preview */}
      <section className="container py-12 md:py-20">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="font-500 text-gold">Личный кабинет</p>
            <h2 className="font-display text-2xl font-700 text-navy sm:text-3xl md:text-4xl">
              Управляйте бизнесом на российском рынке
            </h2>
            <p className="mt-4 text-muted-foreground">
              Загружайте товары, отслеживайте статистику просмотров и заявок,
              общайтесь с покупателями и продвигайте компанию в топ.
            </p>
            <div className="mt-6 space-y-4">
              {[
                { icon: 'Upload', t: 'Загрузка товаров', d: 'Фото, видео производства, сертификаты' },
                { icon: 'BarChart3', t: 'Статистика', d: 'Просмотры, заявки и конверсия в реальном времени' },
                { icon: 'MessagesSquare', t: 'Управление заявками', d: 'Все входящие запросы в одном окне' },
              ].map((f) => (
                <div key={f.t} className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
                    <Icon name={f.icon} size={20} />
                  </div>
                  <div>
                    <div className="font-600 text-navy">{f.t}</div>
                    <div className="text-sm text-muted-foreground">{f.d}</div>
                  </div>
                </div>
              ))}
            </div>
            <Button
              className="mt-8 bg-navy text-white hover:bg-navy-deep"
              onClick={() => navigate('/cabinet')}
            >
              Открыть кабинет продавца
            </Button>
          </div>

          <Card className="border-border shadow-xl">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <span className="font-display font-600 text-navy">
                  Панель продавца
                </span>
                <Badge className="bg-gold text-gold-foreground">Gold</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-6 grid grid-cols-3 gap-3">
                {[
                  { v: '18 240', l: 'Просмотры' },
                  { v: '342', l: 'Заявки' },
                  { v: '4.9', l: 'Рейтинг' },
                ].map((m) => (
                  <div
                    key={m.l}
                    className="rounded-lg bg-secondary/70 p-3 text-center"
                  >
                    <div className="font-display text-xl font-700 text-navy">
                      {m.v}
                    </div>
                    <div className="text-xs text-muted-foreground">{m.l}</div>
                  </div>
                ))}
              </div>
              <Tabs defaultValue="items">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="items">Товары</TabsTrigger>
                  <TabsTrigger value="leads">Заявки</TabsTrigger>
                </TabsList>
                <TabsContent value="items" className="mt-4 space-y-2">
                  {['LED-модуль X200', 'Смарт-датчик S9', 'Контроллер C4'].map(
                    (p) => (
                      <div
                        key={p}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <span className="text-sm font-500 text-navy">{p}</span>
                        <Badge variant="secondary">Активен</Badge>
                      </div>
                    ),
                  )}
                </TabsContent>
                <TabsContent value="leads" className="mt-4 space-y-2">
                  {['ООО «Ростек» — 500 шт.', 'ИП Смирнов — образцы'].map(
                    (l) => (
                      <div
                        key={l}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <span className="text-sm font-500 text-navy">{l}</span>
                        <Icon
                          name="ArrowRight"
                          size={16}
                          className="text-gold"
                        />
                      </div>
                    ),
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Logistics */}
      <section className="bg-navy-deep py-12 text-white md:py-20">
        <div className="container">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-500 text-gold">Логистика</p>
              <h2 className="font-display text-2xl font-700 sm:text-3xl md:text-4xl">
                Доставка из Китая под ключ
              </h2>
            </div>
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 hover:text-white"
              onClick={() => navigate('/logistics')}
            >
              Все компании
              <Icon name="ArrowRight" size={16} className="ml-1" />
            </Button>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {LOGISTICS.map((l) => (
              <div
                key={l.name}
                className="cursor-pointer rounded-xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-gold/40"
                onClick={() => navigate('/logistics')}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gold text-gold-foreground">
                  <Icon name={l.icon} size={24} />
                </div>
                <h3 className="font-display text-xl font-600">{l.name}</h3>
                <p className="mt-2 text-sm text-white/60">{l.desc}</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-gold">
                  <Icon name="Clock" size={15} />
                  {l.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Feed promo */}
      <section className="container py-12 md:py-20">
        <div className="overflow-hidden rounded-3xl bg-navy-deep text-white">
          <div className="grid md:grid-cols-2 items-center">
            <div className="p-8 md:p-12">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gold/20 px-3 py-1.5">
                <span className="text-sm">🎬</span>
                <span className="text-sm font-600 text-gold">Новинка платформы</span>
              </div>
              <h2 className="font-display text-2xl font-700 sm:text-3xl md:text-4xl">
                Видео с реальных заводов Китая
              </h2>
              <p className="mt-4 text-white/70 leading-relaxed">
                Смотрите производство, упаковку, контроль качества и отгрузку в Россию. Оценивайте поставщиков до переговоров — как в TikTok, но для B2B.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['🏭 Производство', '📦 Упаковка', '✅ Качество', '🚢 Отгрузка', '⚙️ Оборудование'].map(tag => (
                  <span key={tag} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/80">{tag}</span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  className="bg-gold text-gold-foreground hover:bg-gold/90 h-12 px-6"
                  onClick={() => navigate('/feed')}
                >
                  <Icon name="Play" size={18} className="mr-2" />
                  Смотреть видео
                </Button>
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 h-12 px-6"
                  onClick={() => navigate('/cabinet')}
                >
                  Загрузить своё видео
                </Button>
              </div>
            </div>
            <div className="hidden md:flex items-center justify-center gap-3 p-8">
              {['Factory', 'Package', 'Settings'].map((iconName, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-end rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 overflow-hidden"
                  style={{ width: 100, height: 178, transform: i === 1 ? 'translateY(-16px)' : 'none' }}
                >
                  <div className="flex-1 flex items-center justify-center">
                    <Icon name={iconName} size={36} className="text-white/90" />
                  </div>
                  <div className="w-full bg-black/40 p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="h-4 w-4 rounded-full bg-gold/60" />
                      <div className="h-1.5 w-12 rounded bg-white/30" />
                    </div>
                    <div className="h-1 w-full rounded bg-white/20 mb-0.5" />
                    <div className="h-1 w-2/3 rounded bg-white/20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* News */}
      <section className="container py-12 md:py-20">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-500 text-gold">Блог и новости</p>
            <h2 className="font-display text-2xl font-700 text-navy sm:text-3xl md:text-4xl">
              Торговля Китай — Россия
            </h2>
          </div>
          <Button variant="outline" className="border-navy text-navy" onClick={() => navigate('/blog')}>
            Все статьи
          </Button>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {news.map((n) => (
            <Card
              key={n.id}
              className="hover-lift cursor-pointer border-border"
              onClick={() => navigate(`/blog/${n.slug}`)}
            >
              <CardContent className="p-6">
                <Badge className={`mb-3 ${TAG_BADGE[n.tag] || TAG_BADGE['Новости']}`}>
                  {n.tag}
                </Badge>
                <h3 className="font-600 leading-snug text-navy">{n.title}</h3>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon name="Calendar" size={14} />
                  {n.published_at ? new Date(n.published_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : ''}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact form */}
      <section className="bg-secondary/50 py-12 md:py-20" id="contacts">
        <div className="container grid gap-8 lg:grid-cols-2">
          <div>
            <p className="font-500 text-gold">Контакты</p>
            <h2 className="font-display text-2xl font-700 text-navy sm:text-3xl md:text-4xl">
              Отправьте заявку — мы найдём поставщика
            </h2>
            <p className="mt-4 text-muted-foreground">
              Опишите, что вы ищете — мы подберём проверенных производителей и
              поможем с переговорами, проверкой и логистикой.
            </p>
            <div className="mt-8 space-y-4">
              {[
                { icon: 'Mail', t: 'info@chinesebridge.ru' },
                { icon: 'Phone', t: '+7 495 000-00-00' },
                { icon: 'MapPin', t: 'Москва · Гуанчжоу · Шэньчжэнь' },
              ].map((c) => (
                <div key={c.t} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy text-white">
                    <Icon name={c.icon} size={18} />
                  </div>
                  <span className="font-500 text-navy">{c.t}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-xl border border-border bg-background p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/15 text-gold">
                  <Icon name="Clock" size={20} />
                </div>
                <div>
                  <div className="font-600 text-navy">Ответим за 24 часа</div>
                  <div className="text-sm text-muted-foreground">Подберём поставщиков под ваш запрос</div>
                </div>
              </div>
            </div>
          </div>

          <Card className="border-border shadow-sm">
            <CardContent className="p-6">
              {contactSent ? (
                <div className="flex flex-col items-center gap-4 py-10 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/15">
                    <Icon name="CheckCircle2" size={36} className="text-gold" />
                  </div>
                  <h3 className="font-display text-xl font-700 text-navy">Заявка отправлена!</h3>
                  <p className="text-muted-foreground">Мы свяжемся с вами в течение 24 часов и предложим подходящих поставщиков.</p>
                  <Button variant="outline" className="border-navy text-navy mt-2" onClick={() => setContactSent(false)}>
                    Отправить ещё одну
                  </Button>
                </div>
              ) : (
                <>
                  <h3 className="font-display text-lg font-600 text-navy mb-4">Оставьте заявку</h3>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    <Input placeholder="Имя *" value={contactForm.name} onChange={(e) => setContact('name', e.target.value)} className="h-11" />
                    <Input placeholder="Компания" value={contactForm.company} onChange={(e) => setContact('company', e.target.value)} className="h-11" />
                  </div>
                  <div className="mt-3 grid gap-3 grid-cols-1 sm:grid-cols-2">
                    <Input placeholder="Email" type="email" value={contactForm.email} onChange={(e) => setContact('email', e.target.value)} className="h-11" />
                    <Input placeholder="Телефон" value={contactForm.phone} onChange={(e) => setContact('phone', e.target.value)} className="h-11" />
                  </div>
                  <div className="mt-3 grid gap-3 grid-cols-1 sm:grid-cols-2">
                    <Input placeholder="Какой товар ищете?" value={contactForm.product_interest} onChange={(e) => setContact('product_interest', e.target.value)} className="h-11" />
                    <Input placeholder="Бюджет (напр. $5 000)" value={contactForm.budget} onChange={(e) => setContact('budget', e.target.value)} className="h-11" />
                  </div>
                  <Textarea
                    placeholder="Дополнительные требования: объём, упаковка, сертификаты..."
                    className="mt-3 min-h-24"
                    value={contactForm.message}
                    onChange={(e) => setContact('message', e.target.value)}
                  />
                  <Button
                    className="mt-4 w-full bg-gold text-gold-foreground hover:bg-gold/90"
                    disabled={contactLoading || !contactForm.name.trim() || (!contactForm.email.trim() && !contactForm.phone.trim())}
                    onClick={submitContact}
                  >
                    {contactLoading ? (
                      <><Icon name="Loader2" size={16} className="mr-2 animate-spin" />Отправка...</>
                    ) : (
                      <><Icon name="Send" size={16} className="mr-2" />Отправить заявку</>
                    )}
                  </Button>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    * Обязательные поля: имя и email или телефон
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-deep py-12 text-white/70">
        <div className="container">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gold text-gold-foreground">
                <Icon name="Container" size={20} />
              </div>
              <span className="font-display text-xl font-700 text-white">
                Chinese<span className="text-gold">Bridge</span>
              </span>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {NAV.map((n) => (
                <a
                  key={n.label}
                  href={n.href}
                  onClick={n.href.startsWith('/') ? (e) => { e.preventDefault(); navigate(n.href); } : undefined}
                  className="hover:text-gold"
                >
                  {n.label}
                </a>
              ))}
            </nav>
          </div>
          <div className="mt-8 border-t border-white/10 pt-6 text-sm">© 2026 ChineseBridge.ru — B2B платформа поставщиков Китай — Россия</div>
        </div>
      </footer>
    </div>
  );
};

export default Index;