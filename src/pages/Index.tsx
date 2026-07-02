import { useState } from 'react';
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
  'Главная',
  'Поставщики',
  'Товары',
  'Производители',
  'Логистика',
  'Новости',
  'Контакты',
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

const NEWS = [
  {
    tag: 'Торговля',
    title: 'Товарооборот России и Китая вырос на 21% за квартал',
    date: '28 июня 2026',
  },
  {
    tag: 'Логистика',
    title: 'Новый ж/д маршрут сократил доставку из Гуандуна на 5 дней',
    date: '24 июня 2026',
  },
  {
    tag: 'Регулирование',
    title: 'Упрощён порядок сертификации электроники EAC',
    date: '19 июня 2026',
  },
];

const tagColor: Record<string, string> = {
  Gold: 'bg-gold text-gold-foreground',
  Premium: 'bg-navy text-white',
  Verified: 'bg-secondary text-navy',
};

const Index = () => {
  const [activeProvince, setActiveProvince] = useState('Все провинции');

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-navy text-white">
              <Icon name="Container" size={20} />
            </div>
            <span className="font-display text-xl font-700 text-navy">
              Sino<span className="text-gold">Bridge</span>
            </span>
          </div>
          <nav className="hidden items-center gap-6 lg:flex">
            {NAV.map((item, i) => (
              <a
                key={item}
                href="#"
                className={`text-sm font-500 transition-colors hover:text-gold ${
                  i === 0 ? 'text-navy' : 'text-muted-foreground'
                }`}
              >
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden sm:inline-flex">
              Войти
            </Button>
            <Button className="bg-gold text-gold-foreground hover:bg-gold/90">
              Кабинет продавца
            </Button>
          </div>
        </div>
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
        <div className="container relative py-24 md:py-32">
          <div className="max-w-2xl animate-fade-in">
            <Badge className="mb-5 bg-gold/15 text-gold hover:bg-gold/15">
              B2B платформа Китай — Россия
            </Badge>
            <h1 className="font-display text-4xl font-700 leading-tight md:text-6xl">
              Проверенные поставщики из Китая — напрямую к вашему бизнесу
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/70">
              Тысячи верифицированных производителей, каталог товаров,
              логистика и переводы. Всё для безопасного выхода на рынок.
            </p>

            <div className="mt-8 flex flex-col gap-2 rounded-xl bg-white/10 p-2 backdrop-blur-sm sm:flex-row">
              <div className="flex flex-1 items-center gap-2 px-3">
                <Icon name="Search" size={20} className="text-white/60" />
                <Input
                  placeholder="Найти поставщика или товар..."
                  className="border-0 bg-transparent text-white placeholder:text-white/50 focus-visible:ring-0"
                />
              </div>
              <Button
                size="lg"
                className="bg-gold text-gold-foreground hover:bg-gold/90"
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
      <section className="container py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-500 text-gold">Каталог товаров</p>
            <h2 className="font-display text-3xl font-700 text-navy md:text-4xl">
              Поиск по категориям
            </h2>
          </div>
          <Button variant="outline" className="border-navy text-navy">
            Все категории
            <Icon name="ArrowRight" size={16} className="ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Card
              key={c.name}
              className="hover-lift cursor-pointer border-border"
            >
              <CardContent className="flex flex-col gap-3 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-navy">
                  <Icon name={c.icon} size={24} />
                </div>
                <div>
                  <div className="font-600 text-navy">{c.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {c.count} товаров
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Suppliers */}
      <section className="bg-secondary/50 py-20">
        <div className="container">
          <div className="mb-8">
            <p className="font-500 text-gold">Каталог поставщиков</p>
            <h2 className="font-display text-3xl font-700 text-navy md:text-4xl">
              Проверенные производители
            </h2>
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
      <section className="container py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="font-500 text-gold">Личный кабинет</p>
            <h2 className="font-display text-3xl font-700 text-navy md:text-4xl">
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
            <Button className="mt-8 bg-navy text-white hover:bg-navy-deep">
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
      <section className="bg-navy-deep py-20 text-white">
        <div className="container">
          <div className="mb-10">
            <p className="font-500 text-gold">Логистика</p>
            <h2 className="font-display text-3xl font-700 md:text-4xl">
              Доставка из Китая под ключ
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {LOGISTICS.map((l) => (
              <div
                key={l.name}
                className="rounded-xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-gold/40"
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

      {/* News */}
      <section className="container py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-500 text-gold">Блог и новости</p>
            <h2 className="font-display text-3xl font-700 text-navy md:text-4xl">
              Торговля Китай — Россия
            </h2>
          </div>
          <Button variant="outline" className="border-navy text-navy">
            Все статьи
          </Button>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {NEWS.map((n) => (
            <Card key={n.title} className="hover-lift border-border">
              <CardContent className="p-6">
                <Badge variant="secondary" className="mb-3">
                  {n.tag}
                </Badge>
                <h3 className="font-600 leading-snug text-navy">{n.title}</h3>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon name="Calendar" size={14} />
                  {n.date}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact form */}
      <section className="bg-secondary/50 py-20">
        <div className="container grid gap-10 lg:grid-cols-2">
          <div>
            <p className="font-500 text-gold">Контакты</p>
            <h2 className="font-display text-3xl font-700 text-navy md:text-4xl">
              Отправьте заявку поставщикам
            </h2>
            <p className="mt-4 text-muted-foreground">
              Опишите, что вы ищете — мы подберём проверенных производителей и
              поможем с переговорами, проверкой и логистикой.
            </p>
            <div className="mt-8 space-y-4">
              {[
                { icon: 'Mail', t: 'info@sinobridge.ru' },
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
          </div>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input placeholder="Имя" />
                <Input placeholder="Компания" />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Input placeholder="Email" type="email" />
                <Input placeholder="Телефон" />
              </div>
              <Textarea
                placeholder="Опишите нужные товары или услуги..."
                className="mt-4 min-h-28"
              />
              <Button className="mt-4 w-full bg-gold text-gold-foreground hover:bg-gold/90">
                Отправить заявку
              </Button>
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
                Sino<span className="text-gold">Bridge</span>
              </span>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {NAV.map((n) => (
                <a key={n} href="#" className="hover:text-gold">
                  {n}
                </a>
              ))}
            </nav>
          </div>
          <div className="mt-8 border-t border-white/10 pt-6 text-sm">
            © 2026 SinoBridge — B2B платформа поставщиков Китай — Россия
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
