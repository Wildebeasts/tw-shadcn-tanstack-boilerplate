import type { SupabaseClient } from '@supabase/supabase-js';
import type { Profile } from '../types/supabase';
import { toast } from 'sonner';

// --- Profile Functions ---

export const getProfileByUserId = async (supabase: SupabaseClient, userId: string) => {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .throwOnError();
    return data as Profile | null;
  } catch (error) {
    toast.error('Failed to fetch profile.');
    throw error;
  }
};

export const createProfile = async (supabase: SupabaseClient, profileData: Partial<Profile>) => {
  try {
    const { data } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single()
      .throwOnError();
    toast.success('Profile created successfully.');
    return data as Profile | null;
  } catch (error) {
    toast.error('Failed to create profile.');
    throw error;
  }
};

export const updateProfile = async (supabase: SupabaseClient, userId: string, updates: Partial<Profile>) => {
  try {
    const { data } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
      .throwOnError();
    toast.success('Profile updated successfully.');
    return data as Profile | null;
  } catch (error) {
    toast.error('Failed to update profile.');
    throw error;
  }
}; 