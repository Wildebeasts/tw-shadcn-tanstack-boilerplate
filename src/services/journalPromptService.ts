import type { SupabaseClient } from '@supabase/supabase-js';
import type { JournalPrompt } from '../types/supabase';
import { toast } from 'sonner';

// --- JournalPrompt Functions ---

export const getPredefinedJournalPrompts = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from('journal_prompts')
    .select('*')
    .eq('is_predefined', true);
  if (error) {
    toast.error('Failed to fetch predefined journal prompts.');
    throw error;
  }
  return data as JournalPrompt[];
};

export const getUserCreatedJournalPrompts = async (supabase: SupabaseClient, userId: string) => {
  const { data, error } = await supabase
    .from('journal_prompts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_predefined', false);
  if (error) {
    toast.error('Failed to fetch user-created journal prompts.');
    throw error;
  }
  return data as JournalPrompt[];
};

export const createJournalPrompt = async (supabase: SupabaseClient, promptData: Partial<JournalPrompt>) => {
  const { data, error } = await supabase
    .from('journal_prompts')
    .insert([{ ...promptData, is_predefined: false }]) // User created are not predefined
    .select()
    .single();
  if (error) {
    toast.error('Failed to create journal prompt.');
    throw error;
  }
  toast.success('Journal prompt created successfully.');
  return data as JournalPrompt | null;
};

export const updateJournalPrompt = async (supabase: SupabaseClient, promptId: string, updates: Partial<JournalPrompt>) => {
  const { data, error } = await supabase
    .from('journal_prompts')
    .update(updates)
    .eq('id', promptId)
    .eq('is_predefined', false) // Can only update user-created ones
    .select()
    .single();
  if (error) {
    toast.error('Failed to update journal prompt.');
    throw error;
  }
  toast.success('Journal prompt updated successfully.');
  return data as JournalPrompt | null;
};

export const deleteJournalPrompt = async (supabase: SupabaseClient, promptId: string) => {
  const { error } = await supabase
    .from('journal_prompts')
    .delete()
    .eq('id', promptId)
    .eq('is_predefined', false); // Can only delete user-created ones
  if (error) {
    toast.error('Failed to delete journal prompt.');
    throw error;
  }
  toast.success('Journal prompt deleted successfully.');
  return true;
}; 