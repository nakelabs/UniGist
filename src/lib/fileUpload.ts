import { supabase } from './supabase';

export const uploadFile = async (file: Blob, fileName: string, bucket: string = 'confessions'): Promise<string> => {
  try {
    // Generate a unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = getFileExtension(file);
    const uniqueFileName = `${timestamp}_${randomString}_${fileName}${fileExtension}`;

    console.log(`Uploading file: ${uniqueFileName} to bucket: ${bucket}`);

    // Try to create bucket if it doesn't exist (will fail silently if it exists)
    try {
      await supabase.storage.createBucket(bucket, {
        public: true,
        allowedMimeTypes: ['audio/*', 'video/*', 'image/*'],
        fileSizeLimit: 50 * 1024 * 1024 // 50MB limit
      });
      console.log(`Bucket ${bucket} created or already exists`);
    } catch (bucketError) {
      // Bucket probably already exists, continue
      console.log(`Bucket ${bucket} already exists or creation failed:`, bucketError);
    }

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(uniqueFileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    console.log('File uploaded successfully:', data);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(uniqueFileName);

    console.log('Public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

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

export const deleteFile = async (url: string, bucket: string = 'confessions'): Promise<void> => {
  try {
    // Extract filename from URL
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];

    console.log(`Deleting file: ${fileName} from bucket: ${bucket}`);

    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName]);

    if (error) {
      console.error('Delete error:', error);
      throw error;
    }

    console.log('File deleted successfully');
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};
