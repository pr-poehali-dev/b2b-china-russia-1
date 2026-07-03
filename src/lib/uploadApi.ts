import { getToken } from './cabinetApi';

const BASE = 'https://functions.poehali.dev/1c91fd4c-f79b-46d4-8c8a-66952a6bb3e0';

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadPhoto(file: File): Promise<string> {
  const b64 = await toBase64(file);
  const res = await fetch(`${BASE}?action=photo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken() },
    body: JSON.stringify({ file: b64, content_type: file.type }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка загрузки');
  return data.url as string;
}

const MAX_VIDEO_MB = 200;
const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;
const SMALL_UPLOAD_LIMIT = 6 * 1024 * 1024; // до 6 МБ — простой base64-путь

export async function uploadVideo(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error(`Файл ${(file.size / 1024 / 1024).toFixed(1)} МБ превышает лимит ${MAX_VIDEO_MB} МБ. Сожмите видео или выберите файл меньшего размера.`);
  }

  // Маленькие файлы — быстрый путь через base64
  if (file.size <= SMALL_UPLOAD_LIMIT) {
    if (onProgress) onProgress(10);
    const b64 = await toBase64(file);
    if (onProgress) onProgress(50);

    const res = await fetch(`${BASE}?action=video_upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken() },
      body: JSON.stringify({ file: b64, content_type: file.type || 'video/mp4' }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка загрузки видео');

    if (onProgress) onProgress(100);
    return data.url as string;
  }

  // Большие файлы — прямая загрузка в S3 по presigned URL
  if (onProgress) onProgress(2);
  const presignRes = await fetch(`${BASE}?action=video_presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken() },
    body: JSON.stringify({ content_type: file.type || 'video/mp4', size: file.size }),
  });
  const presignData = await presignRes.json();
  if (!presignRes.ok) throw new Error(presignData.error || 'Не удалось подготовить загрузку');

  const { put_url, cdn_url } = presignData;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', put_url);
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(2 + Math.round((e.loaded / e.total) * 96));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error('Ошибка загрузки видео в хранилище'));
    };
    xhr.onerror = () => reject(new Error('Ошибка сети при загрузке видео'));
    xhr.send(file);
  });

  if (onProgress) onProgress(100);
  return cdn_url as string;
}

export async function importExcel(file: File): Promise<{ imported: unknown[]; count: number; errors: string[] }> {
  const b64 = await toBase64(file);
  const res = await fetch(`${BASE}?action=import_excel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken() },
    body: JSON.stringify({ file: b64, filename: file.name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка импорта');
  return data;
}