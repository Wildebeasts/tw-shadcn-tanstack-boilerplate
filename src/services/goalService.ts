import type { SupabaseClient } from '@supabase/supabase-js';
import type { Goal, JournalGoalLink, JournalEntry } from '../types/supabase';

// --- Goal Functions ---

export const getGoalsByUserId = async (supabase: SupabaseClient, userId: string) => {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data as Goal[];
};

export const getGoalById = async (supabase: SupabaseClient, goalId: string) => {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .single();
  if (error) throw error;
  return data as Goal | null;
};

export const createGoal = async (supabase: SupabaseClient, goalData: Partial<Goal>) => {
  const { data, error } = await supabase
    .from('goals')
    .insert([goalData])
    .select()
    .single();
  if (error) throw error;
  return data as Goal | null;
};

export const updateGoal = async (supabase: SupabaseClient, goalId: string, updates: Partial<Goal>) => {
  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', goalId)
    .select()
    .single();
  if (error) throw error;
  return data as Goal | null;
};

export const deleteGoal = async (supabase: SupabaseClient, goalId: string) => {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId);
  if (error) throw error;
  return true;
};

// --- JournalGoalLink Functions ---

export const getGoalLinksByEntryId = async (supabase: SupabaseClient, entryId: string) => {
  const { data, error } = await supabase
    .from('journal_goal_links')
    .select('*, goals(*)')
    .eq('entry_id', entryId);
  if (error) throw error;
  return data as (JournalGoalLink & { goals: Goal })[];
};

export const getGoalLinksByGoalId = async (supabase: SupabaseClient, goalId: string) => {
  const { data, error } = await supabase
    .from('journal_goal_links')
    .select('*, journal_entries(*)')
    .eq('goal_id', goalId);
  if (error) throw error;
  return data as (JournalGoalLink & { journal_entries: JournalEntry })[];
};

export const linkEntryToGoal = async (supabase: SupabaseClient, linkData: JournalGoalLink) => {
  const { data, error } = await supabase
    .from('journal_goal_links')
    .insert([linkData])
    .select()
    .single();
  if (error) throw error;
  return data as JournalGoalLink | null;
};

export const unlinkEntryFromGoal = async (supabase: SupabaseClient, entryId: string, goalId: string) => {
  const { error } = await supabase
    .from('journal_goal_links')
    .delete()
    .eq('entry_id', entryId)
    .eq('goal_id', goalId);
  if (error) throw error;
  return true;
}; 