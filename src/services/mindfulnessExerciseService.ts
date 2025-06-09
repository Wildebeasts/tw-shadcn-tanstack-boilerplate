import type { SupabaseClient } from '@supabase/supabase-js';
import type { MindfulnessExercise } from '../types/supabase';
import { toast } from 'sonner';

// --- MindfulnessExercise Functions ---

export const getAllMindfulnessExercises = async (supabase: SupabaseClient) => {
  try {
    const { data } = await supabase
      .from('mindfulness_exercises')
      .select('*')
      .throwOnError();
    return data as MindfulnessExercise[];
  } catch (error) {
    toast.error('Failed to fetch mindfulness exercises.');
    throw error;
  }
};

export const getMindfulnessExerciseById = async (supabase: SupabaseClient, exerciseId: string) => {
  try {
    const { data } = await supabase
      .from('mindfulness_exercises')
      .select('*')
      .eq('id', exerciseId)
      .single()
      .throwOnError();
    return data as MindfulnessExercise | null;
  } catch (error) {
    toast.error('Failed to fetch mindfulness exercise.');
    throw error;
  }
};

// CUD for MindfulnessExercises would typically be admin restricted.
// For simplicity, assuming they are managed via Supabase Studio or specific admin interface. 