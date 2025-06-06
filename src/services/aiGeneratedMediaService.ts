import type { SupabaseClient } from '@supabase/supabase-js';
import type { AiGeneratedMedia } from '../types/supabase';
import { toast } from 'sonner';

// --- AiGeneratedMedia Functions ---

export const getAiGeneratedMediaByUserId = async (supabase: SupabaseClient, userId: string) => {
  try {
    const { data } = await supabase
      .from('ai_generated_media')
      .select('*')
      .eq('user_id', userId)
      .throwOnError();
    return data as AiGeneratedMedia[];
  } catch (error) {
    toast.error('Failed to fetch AI generated media.');
    throw error;
  }
};

export const getAiGeneratedMediaById = async (supabase: SupabaseClient, mediaId: string) => {
  try {
    const { data } = await supabase
      .from('ai_generated_media')
      .select('*')
      .eq('id', mediaId)
      .single()
      .throwOnError();
    return data as AiGeneratedMedia | null;
  } catch (error) {
    toast.error('Failed to fetch AI generated media.');
    throw error;
  }
};

export const createAiGeneratedMedia = async (supabase: SupabaseClient, mediaData: Partial<AiGeneratedMedia>) => {
  try {
    const { data } = await supabase
      .from('ai_generated_media')
      .insert([mediaData])
      .select()
      .single()
      .throwOnError();
    toast.success('AI generated media created successfully.');
    return data as AiGeneratedMedia | null;
  } catch (error) {
    toast.error('Failed to create AI generated media.');
    throw error;
  }
};

// Note: Supabase Storage handles uploads directly, this is for metadata.

export const deleteAiGeneratedMedia = async (supabase: SupabaseClient, mediaId: string) => {
    // Remember to also delete the file from Supabase Storage
  try {
    await supabase
      .from('ai_generated_media')
      .delete()
      .eq('id', mediaId)
      .throwOnError();
    toast.success('AI generated media deleted successfully.');
    return true;
  } catch (error) {
    toast.error('Failed to delete AI generated media.');
    throw error;
  }
}; 