import type { SupabaseClient } from '@supabase/supabase-js';
import type { Theme } from '../types/supabase';

// --- Theme Functions ---

export const getAllThemes = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from('themes')
    .select('*');
  if (error) throw error;
  return data as Theme[];
};

export const getThemeById = async (supabase: SupabaseClient, themeId: string) => {
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .eq('id', themeId)
    .single();
  if (error) throw error;
  return data as Theme | null;
};

// CUD for Themes typically admin restricted. 