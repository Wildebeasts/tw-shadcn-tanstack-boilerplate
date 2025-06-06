import type { SupabaseClient } from '@supabase/supabase-js';
import type { MediaAttachment } from '../types/supabase';
import { toast } from 'sonner';

// --- MediaAttachment Functions ---

export const getMediaAttachmentsByEntryId = async (supabase: SupabaseClient, entryId: string) => {
  try {
    const { data } = await supabase
      .from('media_attachments')
      .select('*')
      .eq('entry_id', entryId)
      .throwOnError();
    return data as MediaAttachment[];
  } catch (error) {
    toast.error('Failed to fetch media attachments.');
    throw error;
  }
};

export const getMediaAttachmentById = async (supabase: SupabaseClient, attachmentId: string) => {
  try {
    const { data } = await supabase
      .from('media_attachments')
      .select('*')
      .eq('id', attachmentId)
      .single()
      .throwOnError();
    return data as MediaAttachment | null;
  } catch (error) {
    toast.error('Failed to fetch media attachment.');
    throw error;
  }
};

export const createMediaAttachment = async (supabase: SupabaseClient, attachmentData: Partial<MediaAttachment>) => {
  try {
    const { data } = await supabase
      .from('media_attachments')
      .insert([attachmentData])
      .select()
      .single()
      .throwOnError();
    toast.success('Media attachment created successfully.');
    return data as MediaAttachment | null;
  } catch (error) {
    toast.error('Failed to create media attachment.');
    throw error;
  }
};

// Note: Supabase Storage handles uploads directly, this is for metadata.
// For actual file upload, use supabase.storage.from('bucket-name').upload(...)

export const deleteMediaAttachment = async (supabase: SupabaseClient, attachmentId: string) => {
    // Remember to also delete the file from Supabase Storage
  try {
    await supabase
      .from('media_attachments')
      .delete()
      .eq('id', attachmentId)
      .throwOnError();
    toast.success('Media attachment deleted successfully.');
    return true;
  } catch (error) {
    toast.error('Failed to delete media attachment.');
    throw error;
  }
}; 