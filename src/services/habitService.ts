import type { SupabaseClient } from '@supabase/supabase-js';
import type { Habit, HabitLog } from '../types/supabase';
import { toast } from 'sonner';

// --- Habit Functions ---

export const getHabitsByUserId = async (supabase: SupabaseClient, userId: string) => {
  try {
    const { data } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .throwOnError();
    return data as Habit[];
  } catch (error) {
    toast.error('Failed to fetch habits.');
    throw error;
  }
};

export const getHabitById = async (supabase: SupabaseClient, habitId: string) => {
  try {
    const { data } = await supabase
      .from('habits')
      .select('*')
      .eq('id', habitId)
      .single()
      .throwOnError();
    return data as Habit | null;
  } catch (error) {
    toast.error('Failed to fetch habit.');
    throw error;
  }
};

export const createHabit = async (supabase: SupabaseClient, habitData: Partial<Habit>) => {
  try {
    const { data } = await supabase
      .from('habits')
      .insert([habitData])
      .select()
      .single()
      .throwOnError();
    toast.success('Habit created successfully.');
    return data as Habit | null;
  } catch (error) {
    toast.error('Failed to create habit.');
    throw error;
  }
};

export const updateHabit = async (supabase: SupabaseClient, habitId: string, updates: Partial<Habit>) => {
  try {
    const { data } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', habitId)
      .select()
      .single()
      .throwOnError();
    toast.success('Habit updated successfully.');
    return data as Habit | null;
  } catch (error) {
    toast.error('Failed to update habit.');
    throw error;
  }
};

export const deleteHabit = async (supabase: SupabaseClient, habitId: string) => {
  try {
    await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)
      .throwOnError();
    toast.success('Habit deleted successfully.');
    return true;
  } catch (error) {
    toast.error('Failed to delete habit.');
    throw error;
  }
};

// --- HabitLog Functions ---

export const getHabitLogsByHabitId = async (supabase: SupabaseClient, habitId: string) => {
  try {
    const { data } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .throwOnError();
    return data as HabitLog[];
  } catch (error) {
    toast.error('Failed to fetch habit logs.');
    throw error;
  }
};

export const getHabitLogsByUserIdAndDate = async (supabase: SupabaseClient, userId: string, logDate: string) => {
  try {
    const { data } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', logDate)
      .throwOnError();
    return data as HabitLog[];
  } catch (error) {
    toast.error('Failed to fetch habit logs.');
    throw error;
  }
};


export const createHabitLog = async (supabase: SupabaseClient, logData: Partial<HabitLog>) => {
  try {
    const { data } = await supabase
      .from('habit_logs')
      .insert([logData])
      .select()
      .single()
      .throwOnError();
    toast.success('Habit log created successfully.');
    return data as HabitLog | null;
  } catch (error) {
    toast.error('Failed to create habit log.');
    throw error;
  }
};

export const updateHabitLog = async (supabase: SupabaseClient, logId: string, updates: Partial<HabitLog>) => {
  try {
    const { data } = await supabase
      .from('habit_logs')
      .update(updates)
      .eq('id', logId)
      .select()
      .single()
      .throwOnError();
    toast.success('Habit log updated successfully.');
    return data as HabitLog | null;
  } catch (error) {
    toast.error('Failed to update habit log.');
    throw error;
  }
};

export const deleteHabitLog = async (supabase: SupabaseClient, logId: string) => {
  try {
    await supabase
      .from('habit_logs')
      .delete()
      .eq('id', logId)
      .throwOnError();
    toast.success('Habit log deleted successfully.');
    return true;
  } catch (error) {
    toast.error('Failed to delete habit log.');
    throw error;
  }
};