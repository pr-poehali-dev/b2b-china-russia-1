import React from 'react';

const EMOJI_MAP: Record<string, string> = {
  Film: 'https://cdn.poehali.dev/projects/a67ff9c5-8157-472c-832f-296b77b78a02/files/5b5bdb96-b327-4929-aeec-5567695c9e96.jpg',
  Clapperboard: 'https://cdn.poehali.dev/projects/a67ff9c5-8157-472c-832f-296b77b78a02/files/5b5bdb96-b327-4929-aeec-5567695c9e96.jpg',
  Eye: 'https://cdn.poehali.dev/projects/a67ff9c5-8157-472c-832f-296b77b78a02/files/14f4088e-74c4-4a28-a9cf-72b1e83ee8c2.jpg',
  Heart: 'https://cdn.poehali.dev/projects/a67ff9c5-8157-472c-832f-296b77b78a02/files/e36c8b04-f2f7-4db4-8e8f-3a9633e18f75.jpg',
  Package: 'https://cdn.poehali.dev/projects/a67ff9c5-8157-472c-832f-296b77b78a02/files/4c94bc38-1ffc-4b7f-b663-3f5f7d167b05.jpg',
  PackagePlus: 'https://cdn.poehali.dev/projects/a67ff9c5-8157-472c-832f-296b77b78a02/files/4c94bc38-1ffc-4b7f-b663-3f5f7d167b05.jpg',
  ImagePlus: 'https://cdn.poehali.dev/projects/a67ff9c5-8157-472c-832f-296b77b78a02/files/7b81c2ab-7e12-46f0-b7f8-db0f4eca59af.jpg',
  Image: 'https://cdn.poehali.dev/projects/a67ff9c5-8157-472c-832f-296b77b78a02/files/7b81c2ab-7e12-46f0-b7f8-db0f4eca59af.jpg',
  PlayCircle: 'https://cdn.poehali.dev/projects/a67ff9c5-8157-472c-832f-296b77b78a02/files/39105245-2865-4257-949f-a7673fe707d3.jpg',
  Truck: 'https://cdn.poehali.dev/projects/a67ff9c5-8157-472c-832f-296b77b78a02/files/aad37bc2-11e9-4c14-a396-3819f72954bd.jpg',
};

interface Emoji3DProps {
  name: keyof typeof EMOJI_MAP | string;
  size?: number;
  className?: string;
}

/**
 * Объёмная 3D-эмодзи иконка (для статусов, статистики и пустых состояний).
 * Если иконки нет в наборе — возвращает null (используй Icon как fallback).
 */
const Emoji3D: React.FC<Emoji3DProps> = ({ name, size = 32, className = '' }) => {
  const src = EMOJI_MAP[name];
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={`inline-block rounded-md object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
};

export default Emoji3D;
