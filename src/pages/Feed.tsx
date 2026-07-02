import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { feedApi, type FeedVideo, type HashtagStat } from '@/lib/feedApi';

const TABS = [
  { id: 'new', label: '🆕 Новые' },
  { id: 'hot', label: '🔥 Популярные' },
  { id: 'verified', label: '✅ Проверенные' },
];

const CATEGORIES = [
  { id: 'Электроника', label: '⚡ Электроника' },
  { id: 'Текстиль и одежда', label: '👗 Одежда' },
  { id: 'Товары для дома', label: '🏠 Дом' },
  { id: 'Автозапчасти', label: '🚗 Авто' },
  { id: 'Промоборудование', label: '⚙️ Оборудование' },
  { id: 'Упаковка', label: '📦 Упаковка' },
];

const PLAN_BADGE: Record<string, string> = {
  Gold: 'bg-gold text-gold-foreground',
  Platinum: 'bg-navy text-white',
  Premium: 'bg-white/20 text-white',
  Verified: 'bg-white/20 text-white',
};

function formatViews(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

const VideoCard = ({
  video, active, onLike, onView, onContact,
}: {
  video: FeedVideo;
  active: boolean;
  onLike: (id: number) => void;
  onView: (id: number, sid: number) => void;
  onContact: (video: FeedVideo) => void;
}) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [liked, setLiked] = useState(video.liked);
  const [likes, setLikes] = useState(video.likes_count);
  const [viewed, setViewed] = useState(false);

  useEffect(() => {
    if (active && videoRef.current) {
      videoRef.current.play().catch(() => {});
      setPlaying(true);
      if (!viewed) { onView(video.id, video.seller_id); setViewed(true); }
    } else {
      videoRef.current?.pause();
      setPlaying(false);
    }
  }, [active]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikes(l => next ? l + 1 : Math.max(0, l - 1));
    onLike(video.id);
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-black">
      {/* Video */}
      <video
        ref={videoRef}
        src={video.url}
        className="h-full w-full object-cover"
        loop
        playsInline
        muted={false}
        preload={active ? 'auto' : 'metadata'}
        onClick={togglePlay}
      />

      {/* Play/pause overlay */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center" onClick={togglePlay}>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
            <Icon name="Play" size={32} className="text-white ml-1" />
          </div>
        </div>
      )}

      {/* Gradient overlay bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 pb-6">
        {/* Seller info */}
        <button
          className="flex items-center gap-2 mb-3"
          onClick={() => navigate(`/supplier/${video.seller_id}`)}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-navy">
            {video.logo_url
              ? <img src={video.logo_url} alt="" className="h-full w-full object-cover" />
              : <span className="font-display text-sm font-700 text-white">{video.company_name[0]}</span>}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-600 text-white">{video.company_name}</span>
              {(video.plan === 'Gold' || video.plan === 'Platinum') && (
                <Badge className={`text-[10px] px-1.5 py-0 ${PLAN_BADGE[video.plan]}`}>{video.plan}</Badge>
              )}
            </div>
            {video.province && <div className="text-xs text-white/70">📍 {video.province}</div>}
          </div>
        </button>

        {/* Caption */}
        {video.caption && (
          <p className="mb-2 text-sm text-white leading-snug line-clamp-2">{video.caption}</p>
        )}

        {/* Hashtags */}
        {video.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-1">
            {video.hashtags.slice(0, 4).map(tag => (
              <span key={tag} className="text-xs text-gold font-500">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Right action bar */}
      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5">
        {/* Like */}
        <button className="flex flex-col items-center gap-1" onClick={handleLike}>
          <div className={`flex h-11 w-11 items-center justify-center rounded-full transition-all ${liked ? 'bg-red-500 scale-110' : 'bg-black/40 backdrop-blur-sm'}`}>
            <Icon name="Heart" size={22} className="text-white" />
          </div>
          <span className="text-xs font-600 text-white drop-shadow">{formatViews(likes)}</span>
        </button>

        {/* Views */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
            <Icon name="Eye" size={20} className="text-white" />
          </div>
          <span className="text-xs font-600 text-white drop-shadow">{formatViews(video.views_count)}</span>
        </div>

        {/* Contact */}
        <button className="flex flex-col items-center gap-1" onClick={() => onContact(video)}>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
            <Icon name="MessageCircle" size={20} className="text-white" />
          </div>
          <span className="text-xs font-600 text-white drop-shadow">Написать</span>
        </button>

        {/* Profile */}
        <button
          className="flex flex-col items-center gap-1"
          onClick={() => navigate(`/supplier/${video.seller_id}`)}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
            <Icon name="Store" size={20} className="text-white" />
          </div>
          <span className="text-xs font-600 text-white drop-shadow">Профиль</span>
        </button>
      </div>
    </div>
  );
};

// Contact modal
const ContactModal = ({ video, onClose }: { video: FeedVideo | null; onClose: () => void }) => {
  const navigate = useNavigate();
  if (!video) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-2xl bg-background p-5 pb-8 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-navy">
              {video.logo_url
                ? <img src={video.logo_url} alt="" className="h-full w-full object-cover" />
                : <span className="font-display font-700 text-white">{video.company_name[0]}</span>}
            </div>
            <div>
              <div className="font-600 text-navy">{video.company_name}</div>
              {video.province && <div className="text-xs text-muted-foreground">{video.province}</div>}
            </div>
          </div>
          <button onClick={onClose}><Icon name="X" size={20} className="text-muted-foreground" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            className="h-12 bg-navy text-white hover:bg-navy-deep"
            onClick={() => navigate(`/supplier/${video.seller_id}`)}
          >
            <Icon name="Store" size={18} className="mr-2" />
            Профиль
          </Button>
          <Button
            className="h-12 bg-gold text-gold-foreground hover:bg-gold/90"
            onClick={() => { navigate(`/supplier/${video.seller_id}`); onClose(); }}
          >
            <Icon name="Send" size={18} className="mr-2" />
            Заявка
          </Button>
        </div>
      </div>
    </div>
  );
};

const Feed = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || 'new');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [hashtag, setHashtag] = useState(searchParams.get('hashtag') || '');
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [hashtags, setHashtags] = useState<HashtagStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [contactVideo, setContactVideo] = useState<FeedVideo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const likedRef = useRef(new Set<number>());

  const load = useCallback(async (reset = true) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);
    try {
      const offset = reset ? 0 : videos.length;
      const d = await feedApi.getFeed(tab, offset, hashtag || undefined, category || undefined);
      if (reset) setVideos(d.videos || []);
      else setVideos(prev => [...prev, ...(d.videos || [])]);
      setHashtags(d.hashtags || []);
      setHasMore(d.has_more);
      if (reset) setActiveIdx(0);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [tab, hashtag, category]);

  useEffect(() => { load(true); }, [tab, hashtag, category]);

  // Intersection Observer for each video
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const items = container.querySelectorAll('[data-video-idx]');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const idx = Number((e.target as HTMLElement).dataset.videoIdx);
          setActiveIdx(idx);
          // load more when near end
          if (idx >= videos.length - 3 && hasMore && !loadingMore) load(false);
        }
      });
    }, { threshold: 0.6 });
    items.forEach(i => obs.observe(i));
    return () => obs.disconnect();
  }, [videos, hasMore, loadingMore]);

  const handleLike = (id: number) => {
    if (!likedRef.current.has(id)) likedRef.current.add(id);
    feedApi.like(id);
    setVideos(vs => vs.map(v => v.id === id
      ? { ...v, liked: !v.liked, likes_count: v.liked ? Math.max(0, v.likes_count - 1) : v.likes_count + 1 }
      : v
    ));
  };

  const handleView = (id: number, sid: number) => { feedApi.view(id, sid); };

  const setFilter = (key: string, val: string) => {
    const sp: Record<string, string> = { tab };
    if (key !== 'hashtag' && hashtag) sp.hashtag = hashtag;
    if (key !== 'category' && category) sp.category = category;
    if (val) sp[key] = val;
    setSearchParams(sp);
    if (key === 'tab') setTab(val);
    if (key === 'hashtag') setHashtag(val);
    if (key === 'category') setCategory(val);
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-black">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-safe pt-3">
        <button onClick={() => navigate('/')} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
          <Icon name="ArrowLeft" size={20} className="text-white" />
        </button>
        <div className="flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-sm px-1 py-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setFilter('tab', t.id)}
              className={`rounded-full px-3 py-1 text-xs font-600 transition-colors ${tab === t.id ? 'bg-white text-black' : 'text-white/70'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => navigate('/cabinet')} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
          <Icon name="User" size={18} className="text-white" />
        </button>
      </div>

      {/* Category filter */}
      <div className="absolute top-14 left-0 right-0 z-30 overflow-x-auto px-4 pb-1">
        <div className="flex gap-2 w-max">
          <button
            onClick={() => setFilter('category', '')}
            className={`rounded-full border px-3 py-1 text-xs font-500 transition-colors shrink-0 ${!category ? 'bg-white text-black border-white' : 'border-white/30 text-white/80'}`}
          >
            Все
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setFilter('category', category === c.id ? '' : c.id)}
              className={`rounded-full border px-3 py-1 text-xs font-500 transition-colors shrink-0 ${category === c.id ? 'bg-white text-black border-white' : 'border-white/30 text-white/80'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hashtag filter */}
      {hashtag && (
        <div className="absolute top-24 left-4 z-30">
          <button
            onClick={() => setFilter('hashtag', '')}
            className="flex items-center gap-1 rounded-full bg-gold px-3 py-1 text-xs font-600 text-gold-foreground"
          >
            #{hashtag} <Icon name="X" size={12} />
          </button>
        </div>
      )}

      {/* Video feed */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Icon name="Loader2" size={36} className="animate-spin text-gold mx-auto" />
            <p className="mt-3 text-white/60 text-sm">Загружаем видео...</p>
          </div>
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-8">
          <Icon name="VideoOff" size={48} className="text-white/30" />
          <p className="text-white/70 font-600">Видео пока нет</p>
          <p className="text-white/40 text-sm">Поставщики ещё не загрузили видео в этой категории</p>
          <Button variant="outline" className="border-white/30 text-white mt-2" onClick={() => { setFilter('category', ''); setFilter('hashtag', ''); }}>
            Смотреть все
          </Button>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="flex-1 overflow-y-scroll snap-y snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {videos.map((v, i) => (
            <div
              key={v.id}
              data-video-idx={i}
              className="relative h-[100dvh] w-full snap-start snap-always"
            >
              <VideoCard
                video={v}
                active={activeIdx === i}
                onLike={handleLike}
                onView={handleView}
                onContact={setContactVideo}
              />
            </div>
          ))}
          {loadingMore && (
            <div className="flex h-32 items-center justify-center">
              <Icon name="Loader2" size={24} className="animate-spin text-white/50" />
            </div>
          )}
        </div>
      )}

      {/* Trending hashtags bottom strip */}
      {!loading && hashtags.length > 0 && activeIdx === 0 && (
        <div className="absolute bottom-4 left-0 right-0 z-20 overflow-x-auto px-4">
          <div className="flex gap-2 w-max">
            {hashtags.slice(0, 10).map(t => (
              <button
                key={t.tag}
                onClick={() => setFilter('hashtag', hashtag === t.tag ? '' : t.tag)}
                className={`rounded-full border px-3 py-1 text-xs shrink-0 transition-colors ${hashtag === t.tag ? 'bg-gold text-gold-foreground border-gold' : 'border-white/30 text-white/70 bg-black/30 backdrop-blur-sm'}`}
              >
                #{t.tag} <span className="opacity-60">{t.cnt}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contact modal */}
      <ContactModal video={contactVideo} onClose={() => setContactVideo(null)} />
    </div>
  );
};

export default Feed;
