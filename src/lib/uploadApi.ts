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
