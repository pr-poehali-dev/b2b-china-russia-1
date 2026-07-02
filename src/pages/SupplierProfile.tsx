import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supplierApi, type PublicSeller, type PublicProduct, type PublicCert, type PublicMedia } from '@/lib/supplierApi';

// ---------- PRODUCT MODAL ----------
const ProductModal = ({ product, seller, onClose }: {
  product: PublicProduct;
  seller: PublicSeller;
  onClose: () => void;
}) => {
  const [activePhoto, setActivePhoto] = useState(0);
  const [leadOpen, setLeadOpen] = useState(false);
  const [form, setForm] = useState({ buyer_name: '', buyer_contact: '', message: '' });
  const [loading, setLoading] = useState(false);

  const photos = (product as PublicProduct & { photos?: string[] }).photos?.length
    ? (product as PublicProduct & { photos?: string[] }).photos!
    : product.image_url ? [product.image_url] : [];

  const submit = async () => {
    if (!form.buyer_name.trim() || !form.buyer_contact.trim()) {
      toast({ title: 'Заполните имя и контакт', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await supplierApi.sendLead({
        seller_id: seller.id,
        buyer_name: form.buyer_name,
        buyer_contact: form.buyer_contact,
        message: `Товар: ${product.name}\n${form.message}`,
      });
      toast({ title: 'Заявка отправлена!', description: 'Поставщик свяжется с вами в ближайшее время.' });
      setLeadOpen(false);
      setForm({ buyer_name: '', buyer_contact: '', message: '' });
    } catch (e) {
      toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 border border-border shadow hover:bg-secondary transition-colors"
        >
          <Icon name="X" size={16} className="text-navy" />
        </button>

        {/* Photo gallery */}
        <div className="relative bg-secondary">
          {photos.length > 0 ? (
            <>
              <div className="flex h-64 items-center justify-center overflow-hidden sm:h-80">
                <img
                  src={photos[activePhoto]}
                  alt={product.name}
                  className="h-full w-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              {photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-3">
                  {photos.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePhoto(i)}
                      className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${i === activePhoto ? 'border-gold' : 'border-transparent'}`}
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-48 items-center justify-center">
              <Icon name="Package" size={56} className="text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              {product.category && (
                <Badge variant="secondary" className="mb-2">{product.category}</Badge>
              )}
              <h2 className="font-display text-2xl font-700 text-navy">{product.name}</h2>
            </div>
            {product.price && (
              <div className="font-display text-2xl font-700 text-gold shrink-0">{product.price}</div>
            )}
          </div>

          {product.description && (
            <p className="mt-4 text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          {/* Supplier mini */}
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-navy font-display font-700 text-white">
              {seller.company_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-600 text-navy truncate">{seller.company_name}</div>
              <div className="text-xs text-muted-foreground">{seller.province || ''} {seller.category || ''}</div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Icon name="Star" size={13} className="text-gold" />
              <span className="font-600 text-navy">{Number(seller.rating).toFixed(1)}</span>
            </div>
          </div>

          {/* Actions */}
          {!leadOpen ? (
            <div className="mt-5 flex gap-3">
              <Button
                className="flex-1 bg-gold text-gold-foreground hover:bg-gold/90"
                onClick={() => setLeadOpen(true)}
              >
                <Icon name="Send" size={16} className="mr-2" />
                Запросить цену
              </Button>
              <Button variant="outline" className="border-navy text-navy" onClick={onClose}>
                Закрыть
              </Button>
            </div>
          ) : (
            <div className="mt-5 space-y-3 rounded-xl border border-border p-4">
              <p className="font-600 text-navy text-sm">Заявка на товар: {product.name}</p>
              <Input placeholder="Ваше имя / компания *" value={form.buyer_name} onChange={(e) => setForm(f => ({ ...f, buyer_name: e.target.value }))} />
              <Input placeholder="Email или телефон *" value={form.buyer_contact} onChange={(e) => setForm(f => ({ ...f, buyer_contact: e.target.value }))} />
              <Textarea
                placeholder="Количество, требования, вопросы..."
                className="min-h-20"
                value={form.message}
                onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
              />
              <div className="flex gap-2">
                <Button className="flex-1 bg-gold text-gold-foreground hover:bg-gold/90" disabled={loading} onClick={submit}>
                  {loading ? 'Отправка...' : 'Отправить заявку'}
                </Button>
                <Button variant="outline" onClick={() => setLeadOpen(false)}>Отмена</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PLAN_BADGE: Record<string, string> = {
  Gold: 'bg-gold text-gold-foreground',
  Platinum: 'bg-navy text-white',
  Premium: 'bg-secondary text-navy',
  Verified: 'bg-secondary text-navy',
};

const LeadDialog = ({ seller }: { seller: PublicSeller }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ buyer_name: '', buyer_contact: '', message: '' });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.buyer_name.trim() || !form.buyer_contact.trim()) {
      toast({ title: 'Заполните имя и контакт', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await supplierApi.sendLead({ seller_id: seller.id, ...form });
      toast({ title: 'Заявка отправлена!', description: 'Поставщик свяжется с вами в ближайшее время.' });
      setForm({ buyer_name: '', buyer_contact: '', message: '' });
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
        <Button className="bg-gold text-gold-foreground hover:bg-gold/90 w-full" size="lg">
          <Icon name="Send" size={18} className="mr-2" />
          Отправить заявку
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-navy">Заявка поставщику</DialogTitle>
          <p className="text-sm text-muted-foreground">{seller.company_name}</p>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Ваше имя / компания *" value={form.buyer_name} onChange={(e) => set('buyer_name', e.target.value)} />
          <Input placeholder="Email или телефон *" value={form.buyer_contact} onChange={(e) => set('buyer_contact', e.target.value)} />
          <Textarea
            placeholder="Опишите, что вас интересует: товар, объём, сроки..."
            className="min-h-28"
            value={form.message}
            onChange={(e) => set('message', e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button className="bg-gold text-gold-foreground hover:bg-gold/90 w-full" disabled={loading} onClick={submit}>
            {loading ? 'Отправка...' : 'Отправить заявку'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const SupplierProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [seller, setSeller] = useState<PublicSeller | null>(null);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [certs, setCerts] = useState<PublicCert[]>([]);
  const [media, setMedia] = useState<PublicMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<PublicProduct | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supplierApi.getProfile(id)
      .then((d) => {
        setSeller(d.seller);
        setProducts(d.products);
        setCerts(d.certificates);
        setMedia(d.media);
      })
      .catch(() => toast({ title: 'Поставщик не найден', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" size={36} className="mx-auto animate-spin text-gold" />
          <p className="mt-3 text-muted-foreground">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Icon name="AlertCircle" size={40} className="mx-auto text-muted-foreground" />
          <p className="mt-3 text-navy font-600">Поставщик не найден</p>
          <Button className="mt-4" onClick={() => navigate('/')}>На главную</Button>
        </div>
      </div>
    );
  }

  const photos = media.filter((m) => m.type === 'photo');
  const videos = media.filter((m) => m.type === 'video');

  return (
    <div className="min-h-screen bg-background">
      {/* Product modal */}
      {selectedProduct && seller && (
        <ProductModal
          product={selectedProduct}
          seller={seller}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain" />
          <button className="absolute right-4 top-4 text-white" onClick={() => setLightbox(null)}>
            <Icon name="X" size={28} />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container flex h-16 items-center gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-navy text-white">
              <Icon name="Container" size={20} />
            </div>
            <span className="font-display text-xl font-700 text-navy">Chinese<span className="text-gold">Bridge</span></span>
          </button>
          <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground truncate">{seller.company_name}</span>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border bg-secondary/30">
        <div className="container py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
                {seller.logo_url ? (
                  <img src={seller.logo_url} alt={seller.company_name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <span className="font-display text-3xl font-700 text-navy">{seller.company_name[0]}</span>
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-700 text-navy md:text-3xl">{seller.company_name}</h1>
                  <Badge className={PLAN_BADGE[seller.plan] || PLAN_BADGE.Verified}>
                    {seller.plan === 'Verified' ? (
                      <><Icon name="BadgeCheck" size={13} className="mr-1" />Проверен</>
                    ) : seller.plan}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {seller.province && <span className="flex items-center gap-1"><Icon name="MapPin" size={14} />{seller.province}, Китай</span>}
                  {seller.category && <span className="flex items-center gap-1"><Icon name="Tag" size={14} />{seller.category}</span>}
                  {seller.founded_year && <span className="flex items-center gap-1"><Icon name="Calendar" size={14} />с {seller.founded_year} г.</span>}
                  {seller.employees && <span className="flex items-center gap-1"><Icon name="Users" size={14} />{seller.employees} сотр.</span>}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map((s) => (
                      <Icon key={s} name="Star" size={15} className={s <= Math.round(Number(seller.rating)) ? 'text-gold' : 'text-border'} />
                    ))}
                  </div>
                  <span className="font-600 text-navy">{Number(seller.rating).toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({seller.reviews_count} отзывов)</span>
                </div>
                {seller.description && (
                  <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{seller.description}</p>
                )}
              </div>
            </div>

            {/* Sidebar contacts */}
            <div className="w-full md:w-72 shrink-0">
              <Card className="border-border">
                <CardContent className="space-y-3 p-5">
                  <LeadDialog seller={seller} />
                  <div className="space-y-2 pt-1">
                    {seller.wechat && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-base">💬</span>
                        <span className="text-muted-foreground">WeChat:</span>
                        <span className="font-500 text-navy">{seller.wechat}</span>
                      </div>
                    )}
                    {seller.whatsapp && (
                      <a href={`https://wa.me/${seller.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 text-sm hover:text-gold transition-colors">
                        <span className="text-base">📱</span>
                        <span className="text-muted-foreground">WhatsApp:</span>
                        <span className="font-500">{seller.whatsapp}</span>
                      </a>
                    )}
                    {seller.telegram && (
                      <a href={`https://t.me/${seller.telegram.replace('@', '')}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 text-sm hover:text-gold transition-colors">
                        <span className="text-base">✈️</span>
                        <span className="text-muted-foreground">Telegram:</span>
                        <span className="font-500">{seller.telegram}</span>
                      </a>
                    )}
                    {seller.website && (
                      <a href={seller.website} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 text-sm hover:text-gold transition-colors">
                        <Icon name="Globe" size={16} className="text-muted-foreground" />
                        <span className="font-500 truncate">{seller.website}</span>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-10 space-y-12">
        {/* Products */}
        {products.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-700 text-navy mb-5">
              <Icon name="Package" size={22} className="inline mr-2 text-gold" />
              Каталог товаров
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {products.map((p) => (
                <Card
                  key={p.id}
                  className="border-border hover-lift overflow-hidden cursor-pointer group"
                  onClick={() => setSelectedProduct(p)}
                >
                  <div className="relative flex h-40 items-center justify-center overflow-hidden bg-secondary">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <Icon name="Package" size={36} className="text-muted-foreground" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-navy/0 group-hover:bg-navy/20 transition-colors">
                      <span className="translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all rounded-full bg-white/90 px-3 py-1 text-xs font-600 text-navy shadow">
                        Подробнее
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="font-600 text-navy">{p.name}</div>
                    {p.category && <div className="text-sm text-muted-foreground">{p.category}</div>}
                    {p.price && <div className="mt-1 font-600 text-gold">{p.price}</div>}
                    {p.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Icon name="Eye" size={12} />{p.views}
                      </span>
                      <span className="text-xs font-500 text-gold">Запросить цену →</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Media gallery */}
        {(photos.length > 0 || videos.length > 0) && (
          <section>
            <h2 className="font-display text-2xl font-700 text-navy mb-5">
              <Icon name="Image" size={22} className="inline mr-2 text-gold" />
              Производство
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {photos.map((m) => (
                <div key={m.id} className="group cursor-pointer overflow-hidden rounded-xl border border-border"
                  onClick={() => setLightbox(m.url)}>
                  <img src={m.url} alt={m.caption || ''} className="h-36 w-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                  {m.caption && <p className="px-2 py-1 text-xs text-muted-foreground">{m.caption}</p>}
                </div>
              ))}
              {videos.map((m) => (
                <a key={m.id} href={m.url} target="_blank" rel="noreferrer"
                  className="flex h-36 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-border bg-secondary hover:border-gold transition-colors">
                  <Icon name="PlayCircle" size={36} className="text-navy" />
                  <span className="text-xs text-muted-foreground">{m.caption || 'Видео'}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Certificates */}
        {certs.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-700 text-navy mb-5">
              <Icon name="ShieldCheck" size={22} className="inline mr-2 text-gold" />
              Сертификаты и лицензии
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {certs.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
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
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="rounded-2xl bg-navy-deep p-8 text-center text-white">
          <h2 className="font-display text-2xl font-700 md:text-3xl">Готовы сотрудничать?</h2>
          <p className="mt-2 text-white/70">Отправьте заявку и получите коммерческое предложение в течение 24 часов</p>
          <div className="mt-6 flex justify-center">
            <LeadDialog seller={seller} />
          </div>
        </section>
      </div>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        <button onClick={() => navigate('/')} className="hover:text-gold transition-colors">
          ← Вернуться в каталог ChineseBridge
        </button>
      </footer>
    </div>
  );
};

export default SupplierProfile;