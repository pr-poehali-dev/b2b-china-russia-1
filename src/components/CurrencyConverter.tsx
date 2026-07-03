import { useEffect, useState } from 'react';
import { logisticsApi } from '@/lib/logisticsApi';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

export default function CurrencyConverter() {
  const [rate, setRate] = useState<number | null>(null);
  const [cny, setCny] = useState('1000');

  useEffect(() => {
    logisticsApi.rate().then((data) => setRate(data.rate)).catch(() => {});
  }, []);

  const rub = rate && cny ? (parseFloat(cny) * rate).toLocaleString('ru-RU', { maximumFractionDigits: 0 }) : '—';

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-500 text-white/80">
        <Icon name="Calculator" size={16} className="text-gold" />
        Конвертер юань → рубль
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="mb-1 text-xs text-white/50">Юань, ¥</div>
          <Input
            type="number"
            value={cny}
            onChange={(e) => setCny(e.target.value)}
            className="border-white/20 bg-white/10 text-white placeholder:text-white/40"
          />
        </div>
        <Icon name="ArrowRight" size={16} className="mt-4 text-white/40 shrink-0" />
        <div className="flex-1">
          <div className="mb-1 text-xs text-white/50">Рубли, ₽</div>
          <div className="flex h-10 items-center rounded-md border border-white/20 bg-white/10 px-3 font-600 text-gold">
            {rub}
          </div>
        </div>
      </div>
      {rate && <div className="mt-2 text-xs text-white/40">Курс: ¥1 = {rate.toFixed(2)} ₽</div>}
    </div>
  );
}
