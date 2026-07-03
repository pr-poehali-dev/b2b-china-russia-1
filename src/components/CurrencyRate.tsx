import { useEffect, useState } from 'react';
import { logisticsApi } from '@/lib/logisticsApi';
import Icon from '@/components/ui/icon';

export default function CurrencyRate() {
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    logisticsApi.rate()
      .then((data) => { if (active) setRate(data.rate); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  if (rate === null) return null;

  return (
    <div className="hidden md:flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-500 text-muted-foreground">
      <Icon name="ArrowRightLeft" size={13} className="text-gold" />
      <span>¥1 =</span>
      <span className="text-navy font-600">{rate.toFixed(2)} ₽</span>
    </div>
  );
}