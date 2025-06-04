import type { SupabaseClient } from '@supabase/supabase-js';
import type { Project } from '@/types/supabase';

const TABLE_NAME = 'projects';

/**
 * Creates a new project.
 * @param supabase - The Supabase client instance.
 * @param projectData - The data for the new project. `user_id` and `name` are required.
 * @returns The created project object or null if an error occurred.
 */
export const createProject = async (
  supabase: SupabaseClient,
  projectData: Pick<Project, 'user_id' | 'name' | 'description' | 'color_hex'>
): Promise<Project | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(projectData)
    .select()
    .single();
  if (error) {
    console.error('Error creating project:', error.message);
    return null;
  }
  return data;
};

/**
 * Fetches all projects for a given user.
 * @param supabase - The Supabase client instance.
 * @param userId - The ID of the user whose projects to fetch.
 * @returns An array of project objects or null if an error occurred.
 */
export const getProjectsByUserId = async (
  supabase: SupabaseClient,
  userId: string
): Promise<Project[] | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('user_id', userId);
  if (error) {
    console.error('Error fetching projects by user ID:', error.message);
    return null;
  }
  return data;
};

/**
 * Fetches a single project by its ID.
 * @param supabase - The Supabase client instance.
 * @param projectId - The ID of the project to fetch.
 * @returns The project object or null if not found or an error occurred.
 */
export const getProjectById = async (
  supabase: SupabaseClient,
  projectId: string
): Promise<Project | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', projectId)
    .single();
  if (error) {
    console.error('Error fetching project by ID:', error.message);
    // It's common for .single() to error if no row is found, handle this gracefully or check error.code
    return null;
  }
  return data;
};

/**
 * Updates an existing project.
 * @param supabase - The Supabase client instance.
 * @param projectId - The ID of the project to update.
 * @param updates - An object containing the fields to update.
 * @returns The updated project object or null if an error occurred.
 */
export const updateProject = async (
  supabase: SupabaseClient,
  projectId: string,
  updates: Partial<Omit<Project, 'id' | 'user_id' | 'created_at'>>
): Promise<Project | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();
  if (error) {
    console.error('Error updating project:', error.message);
    return null;
  }
  return data;
};

/**
 * Deletes a project by its ID.
 * @param supabase - The Supabase client instance.
 * @param projectId - The ID of the project to delete.
 * @returns True if the deletion was successful, false otherwise.
 */
export const deleteProject = async (
  supabase: SupabaseClient,
  projectId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', projectId);
  if (error) {
    console.error('Error deleting project:', error.message);
    return false;
  }
  return true;
}; 