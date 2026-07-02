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

export async function uploadVideo(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  // 1. Get presigned URL from backend
  const res = await fetch(`${BASE}?action=presign_video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken() },
    body: JSON.stringify({ filename: file.name, content_type: file.type || 'video/mp4' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка получения URL');
  const { upload_url, cdn_url } = data;

  // 2. Upload file directly to S3 with XHR (to track progress)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', upload_url);
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Ошибка загрузки: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('Ошибка сети'));
    xhr.send(file);
  });

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