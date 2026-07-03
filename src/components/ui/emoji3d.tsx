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
  Cpu: 'https://cdn.poehali.dev/projects/a67ff9c5-8157-472c-832f-296b77b78a02/files/2077e84e-0fcb-412a-830f-4034b231e6c0.jpg',
  Shirt: 'https://cdn.poehali.dev/projects/a67ff9c5-8157-472c-832f-296b77b78a02/files/661e78ea-739f-43cd-ac5c-b651efe3b8b3.jpg',
  Home: 'https://cdn.poehali.dev/projects/a67ff9c5-8157-472c-832f-296b77b78a02/files/67f845f0-de8a-46d2-9f93-37cb2dd7e7d9.jpg',
  Car: 'https://cdn.poehali.dev/projects/a67ff9c5-8157-472c-832f-296b77b78a02/files/f606fe05-243e-442e-b9d8-3fc0d4a43b1b.jpg',
  Wrench: 'https://cdn.poehali.dev/projects/a67ff9c5-8157-472c-832f-296b77b78a02/files/d211ba6d-8c8d-4c49-8821-86af8df42e4e.jpg',
  Sparkles: 'https://cdn.poehali.dev/projects/a67ff9c5-8157-472c-832f-296b77b78a02/files/e99eb09f-8332-4058-921a-21193dfe5cca.jpg',
  Gamepad2: 'https://cdn.poehali.dev/projects/a67ff9c5-8157-472c-832f-296b77b78a02/files/05b74823-ae59-416a-87b0-d84daa2b4be5.jpg',
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