import type { SupabaseClient } from '@supabase/supabase-js';
import type { JournalEntry } from '../types/supabase';
import { toast } from 'sonner';

// --- JournalEntry Functions ---

export const getJournalEntriesByUserId = async (supabase: SupabaseClient, userId: string) => {
  try {
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .throwOnError();
    return data as JournalEntry[];
  } catch (error) {
    toast.error('Failed to fetch journal entries.');
    throw error;
  }
};

export const getJournalEntriesByProjectId = async (supabase: SupabaseClient, projectId: string) => {
  try {
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('project_id', projectId)
      .order('entry_timestamp', { ascending: false })
      .throwOnError();
    return data as JournalEntry[];
  } catch (error) {
    toast.error('Failed to fetch journal entries for the project.');
    throw error;
  }
};

export const getJournalEntryById = async (supabase: SupabaseClient, entryId: string) => {
  try {
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', entryId)
      .single()
      .throwOnError();
    return data as JournalEntry | null;
  } catch (error) {
    toast.error('Failed to fetch journal entry.');
    throw error;
  }
};

export const createJournalEntry = async (supabase: SupabaseClient, entryData: Partial<JournalEntry>) => {
  try {
    const { data } = await supabase
      .from('journal_entries')
      .insert([entryData])
      .select()
      .single()
      .throwOnError();
    toast.success('Journal entry created successfully.');
    return data as JournalEntry | null;
  } catch (error) {
    toast.error('Failed to create journal entry.');
    throw error;
  }
};

export const updateJournalEntry = async (supabase: SupabaseClient, entryId: string, updates: Partial<JournalEntry>) => {
  try {
    const { data } = await supabase
      .from('journal_entries')
      .update(updates)
      .eq('id', entryId)
      .select()
      .single()
      .throwOnError();
    toast.success('Journal entry updated successfully.');
    return data as JournalEntry | null;
  } catch (error) {
    toast.error('Failed to update journal entry.');
    throw error;
  }
};

export const deleteJournalEntry = async (supabase: SupabaseClient, entryId: string) => {
  try {
    await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId)
      .throwOnError();
    toast.success('Journal entry deleted successfully.');
    return true;
  } catch (error) {
    toast.error('Failed to delete journal entry.');
    throw error;
  }
};