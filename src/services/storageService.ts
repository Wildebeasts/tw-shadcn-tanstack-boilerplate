import type { SupabaseClient } from '@supabase/supabase-js';

// --- Storage Functions ---
/**
 * Uploads a file to Supabase Storage.
 * @param supabase The SupabaseClient instance.
 * @param bucketName The name of the storage bucket.
 * @param filePath The path within the bucket where the file will be stored.
 * @param file The file object to upload.
 * @param fileOptions Optional file options for the upload.
 * @returns The path of the uploaded file or null if an error occurred.
 */
export const uploadFile = async (
  supabase: SupabaseClient,
  bucketName: string,
  filePath: string,
  file: File,
  fileOptions?: { upsert?: boolean; contentType?: string }
) => {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: fileOptions?.upsert || false,
      contentType: fileOptions?.contentType || file.type,
    });
  if (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
  return data?.path ?? null;
};

/**
 * Downloads a file from Supabase Storage.
 * @param supabase The SupabaseClient instance.
 * @param bucketName The name of the storage bucket.
 * @param filePath The path of the file to download.
 * @returns A Blob containing the file data or null if an error occurred.
 */
export const downloadFile = async (
  supabase: SupabaseClient,
  bucketName: string,
  filePath: string
) => {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .download(filePath);
  if (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
  return data;
};

/**
 * Deletes a file from Supabase Storage.
 * @param supabase The SupabaseClient instance.
 * @param bucketName The name of the storage bucket.
 * @param filePaths An array of file paths to delete.
 * @returns True if successful, false otherwise.
 */
export const deleteFiles = async (
  supabase: SupabaseClient,
  bucketName: string,
  filePaths: string[]
) => {
  console.log(
    `[storageService] Attempting to delete files from bucket: ${bucketName}`,
    filePaths
  );
  const { data, error } = await supabase.storage
    .from(bucketName)
    .remove(filePaths);
  if (error) {
    console.error('Error deleting files:', error);
    throw error;
  }
  return data !== null;
};

/**
 * Gets the public URL for a file in Supabase Storage.
 * @param supabase The SupabaseClient instance.
 * @param bucketName The name of the storage bucket.
 * @param filePath The path of the file.
 * @returns The public URL string.
 */
export const getPublicUrl = (
  supabase: SupabaseClient,
  bucketName: string,
  filePath: string
) => {
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);
  return data.publicUrl;
};

/**
 * Lists files in a Supabase Storage bucket path.
 * @param supabase The SupabaseClient instance.
 * @param bucketName The name of the storage bucket.
 * @param path The path within the bucket to list files from.
 * @param options Optional listing options.
 * @returns An array of file objects or null if an error occurred.
 */
export const listFiles = async (
  supabase: SupabaseClient,
  bucketName: string,
  path?: string,
  options?: { limit?: number; offset?: number; search?: string }
) => {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .list(path, options);
  if (error) {
    console.error('Error listing files:', error);
    throw error;
  }
  return data;
}; 