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

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB — минимальный размер части для S3 multipart

function readChunkAsBase64(file: File, start: number, end: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const slice = file.slice(start, end);
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(slice);
  });
}

async function callUpload(action: string, body: unknown) {
  const res = await fetch(`${BASE}?action=${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken() },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Ошибка: ${action}`);
  return data;
}

export async function uploadVideo(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const contentType = file.type || 'video/mp4';

  // 1. Инициализируем multipart upload
  const { upload_id, key, cdn_url } = await callUpload('video_init', { content_type: contentType });

  const parts: { PartNumber: number; ETag: string }[] = [];
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  try {
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = await readChunkAsBase64(file, start, end);

      // 2. Загружаем каждый чанк через бэкенд
      const { etag } = await callUpload('video_chunk', {
        key,
        upload_id,
        part_number: i + 1,
        chunk,
      });

      parts.push({ PartNumber: i + 1, ETag: etag });
      if (onProgress) onProgress(Math.round(((i + 1) / totalChunks) * 95));
    }

    // 3. Завершаем multipart upload
    await callUpload('video_complete', { key, upload_id, parts });
    if (onProgress) onProgress(100);
    return cdn_url as string;

  } catch (err) {
    // Отменяем при ошибке
    await callUpload('video_abort', { key, upload_id }).catch(() => {});
    throw err;
  }
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