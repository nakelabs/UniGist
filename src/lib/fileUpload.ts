// File upload utilities — uses FastAPI multipart upload endpoint.
// Change this URL when deploying to production.
const BASE_URL = 'http://localhost:8000';

/**
 * Upload a Blob/File to POST /upload.
 * The server returns { url: string } with the public URL of the stored file.
 *
 * @param file       The Blob or File to upload.
 * @param fileName   Base name hint (extension will be inferred from MIME type).
 * @param _bucket    Kept for API compatibility – ignored; FastAPI handles routing.
 */
export const uploadFile = async (
  file: Blob,
  fileName: string,
  _bucket: string = 'confessions'
): Promise<string> => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = getFileExtension(file);
  const uniqueFileName = `${timestamp}_${randomString}_${fileName}${fileExtension}`;

  console.log(`Uploading file: ${uniqueFileName}`);

  const formData = new FormData();
  formData.append('file', file, uniqueFileName);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
    // Do NOT set Content-Type here — let the browser set the multipart boundary.
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Upload error:', errorText);
    throw new Error(`Upload failed (${res.status}): ${errorText}`);
  }

  const data: { url: string } = await res.json();
  console.log('Upload success, public URL:', data.url);
  return data.url;
};

/**
 * Delete a previously uploaded file via DELETE /upload.
 * The server accepts { url: string } in the request body.
 */
export const deleteFile = async (
  url: string,
  _bucket: string = 'confessions'
): Promise<void> => {
  console.log(`Deleting file: ${url}`);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Delete error:', errorText);
    throw new Error(`Delete failed (${res.status}): ${errorText}`);
  }

  console.log('File deleted successfully');
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getFileExtension = (file: Blob): string => {
  if (file.type.startsWith('audio/')) {
    if (file.type.includes('webm')) return '.webm';
    if (file.type.includes('mp3')) return '.mp3';
    if (file.type.includes('wav')) return '.wav';
    if (file.type.includes('ogg')) return '.ogg';
    return '.audio';
  }
  if (file.type.startsWith('video/')) {
    if (file.type.includes('webm')) return '.webm';
    if (file.type.includes('mp4')) return '.mp4';
    if (file.type.includes('avi')) return '.avi';
    return '.video';
  }
  if (file.type.startsWith('image/')) {
    if (file.type.includes('png')) return '.png';
    if (file.type.includes('jpg') || file.type.includes('jpeg')) return '.jpg';
    if (file.type.includes('gif')) return '.gif';
    if (file.type.includes('webp')) return '.webp';
    return '.image';
  }
  return '';
};
