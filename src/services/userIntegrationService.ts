import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserIntegration } from '../types/supabase';
import { toast } from 'sonner';

// --- UserIntegration Functions ---

export const getUserIntegrationsByUserId = async (supabase: SupabaseClient, userId: string) => {
  try {
    const { data } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .throwOnError();
    return data as UserIntegration[];
  } catch (error) {
    toast.error('Failed to fetch user integrations.');
    throw error;
  }
};

export const getUserIntegrationById = async (supabase: SupabaseClient, integrationId: string) => {
  try {
    const { data } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('id', integrationId)
      .single()
      .throwOnError();
    return data as UserIntegration | null;
  } catch (error) {
    toast.error('Failed to fetch user integration.');
    throw error;
  }
};

export const createUserIntegration = async (supabase: SupabaseClient, integrationData: Partial<UserIntegration>) => {
  try {
    const { data } = await supabase
      .from('user_integrations')
      .insert([integrationData])
      .select()
      .single()
      .throwOnError();
    toast.success('User integration created successfully.');
    return data as UserIntegration | null;
  } catch (error) {
    toast.error('Failed to create user integration.');
    throw error;
  }
};

export const updateUserIntegration = async (supabase: SupabaseClient, integrationId: string, updates: Partial<UserIntegration>) => {
  try {
    const { data } = await supabase
      .from('user_integrations')
      .update(updates)
      .eq('id', integrationId)
      .select()
      .single()
      .throwOnError();
    toast.success('User integration updated successfully.');
    return data as UserIntegration | null;
  } catch (error) {
    toast.error('Failed to update user integration.');
    throw error;
  }
};

export const deleteUserIntegration = async (supabase: SupabaseClient, integrationId: string) => {
  try {
    await supabase
      .from('user_integrations')
      .delete()
      .eq('id', integrationId)
      .throwOnError();
    toast.success('User integration deleted successfully.');
    return true;
  } catch (error) {
    toast.error('Failed to delete user integration.');
    throw error;
  }
}; 