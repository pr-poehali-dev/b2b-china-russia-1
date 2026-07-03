import { useEffect, useState } from 'react';
import { feedApi } from '@/lib/feedApi';
import Icon from '@/components/ui/icon';

export default function OnlineVisitors() {
  const [online, setOnline] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    const tick = async () => {
      try {
        const data = await feedApi.ping();
        if (active) setOnline(data.online);
      } catch {
        // silent
      }
    };

    tick();
    const interval = setInterval(tick, 30000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  if (online === null) return null;

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-500 text-muted-foreground">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
      </span>
      <Icon name="Users" size={13} />
      <span className="text-navy font-600">{online}</span>
      <span className="hidden sm:inline">онлайн</span>
    </div>
  );
}
