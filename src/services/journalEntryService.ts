import type { SupabaseClient } from '@supabase/supabase-js';
import type { JournalEntry } from '../types/supabase';

// --- JournalEntry Functions ---

export const getJournalEntriesByUserId = async (supabase: SupabaseClient, userId: string) => {
  const { data } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .throwOnError();
  return data as JournalEntry[];
};

export const getJournalEntriesByProjectId = async (supabase: SupabaseClient, projectId: string) => {
  const { data } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('project_id', projectId)
    .order('entry_timestamp', { ascending: false })
    .throwOnError();
  return data as JournalEntry[];
};

export const getJournalEntryById = async (supabase: SupabaseClient, entryId: string) => {
  const { data } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', entryId)
    .single()
    .throwOnError();
  return data as JournalEntry | null;
};

export const createJournalEntry = async (supabase: SupabaseClient, entryData: Partial<JournalEntry>) => {
  const { data } = await supabase
    .from('journal_entries')
    .insert([entryData])
    .select()
    .single()
    .throwOnError();
  return data as JournalEntry | null;
};

export const updateJournalEntry = async (supabase: SupabaseClient, entryId: string, updates: Partial<JournalEntry>) => {
  const { data } = await supabase
    .from('journal_entries')
    .update(updates)
    .eq('id', entryId)
    .select()
    .single()
    .throwOnError();
  return data as JournalEntry | null;
};

export const deleteJournalEntry = async (supabase: SupabaseClient, entryId: string) => {
  await supabase
    .from('journal_entries')
    .delete()
    .eq('id', entryId)
    .throwOnError();
  return true;
};