import type { SupabaseClient } from '@supabase/supabase-js';
import type { Tag, EntryTag } from '../types/supabase';
import { toast } from 'sonner';

// --- Tag Functions ---

export const getTagsByUserId = async (supabase: SupabaseClient, userId: string) => {
  try {
    const { data } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .throwOnError();
    return data as Tag[];
  } catch (error) {
    toast.error('Failed to fetch tags.');
    throw error;
  }
};

export const getTagById = async (supabase: SupabaseClient, tagId: string) => {
  try {
    const { data } = await supabase
      .from('tags')
      .select('*')
      .eq('id', tagId)
      .single()
      .throwOnError();
    return data as Tag | null;
  } catch (error) {
    toast.error('Failed to fetch tag.');
    throw error;
  }
};

export const createTag = async (supabase: SupabaseClient, tagData: Partial<Tag>) => {
  try {
    const { data } = await supabase
      .from('tags')
      .insert([tagData])
      .select()
      .single()
      .throwOnError();
    toast.success('Tag created successfully.');
    return data as Tag | null;
  } catch (error) {
    toast.error('Failed to create tag.');
    throw error;
  }
};

export const updateTag = async (supabase: SupabaseClient, tagId: string, updates: Partial<Tag>) => {
  try {
    const { data } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', tagId)
      .select()
      .single()
      .throwOnError();
    toast.success('Tag updated successfully.');
    return data as Tag | null;
  } catch (error) {
    toast.error('Failed to update tag.');
    throw error;
  }
};

export const deleteTag = async (supabase: SupabaseClient, tagId: string) => {
  try {
    await supabase
      .from('tags')
      .delete()
      .eq('id', tagId)
      .throwOnError();
    toast.success('Tag deleted successfully.');
    return true;
  } catch (error) {
    toast.error('Failed to delete tag.');
    throw error;
  }
};

// --- EntryTag Functions ---

export const getEntryTagsByEntryId = async (supabase: SupabaseClient, entryId: string) => {
  try {
    const { data } = await supabase
      .from('entry_tags')
      .select('*')
      .eq('entry_id', entryId)
      .throwOnError();
    return data as EntryTag[];
  } catch (error) {
    toast.error('Failed to fetch tags for the entry.');
    throw error;
  }
};

export const addTagToEntry = async (supabase: SupabaseClient, entryTagData: { user_id: string, entry_id: string, tag_id: string }) => {
  try {
    const { data } = await supabase
      .from('entry_tags')
      .insert([entryTagData])
      .select()
      .single()
      .throwOnError();
    toast.success('Tag added to entry successfully.');
    return data as EntryTag | null;
  } catch (error) {
    toast.error('Failed to add tag to entry.');
    throw error;
  }
};

export const removeTagFromEntry = async (supabase: SupabaseClient, entryId: string, tagId: string) => {
  try {
    await supabase
      .from('entry_tags')
      .delete()
      .eq('entry_id', entryId)
      .eq('tag_id', tagId)
      .throwOnError();
    toast.success('Tag removed from entry successfully.');
    return true;
  } catch (error) {
    toast.error('Failed to remove tag from entry.');
    throw error;
  }
};

export const getTagsForEntry = async (supabase: SupabaseClient, entryId: string): Promise<Tag[]> => {
  if (!entryId) return [];
  const { data: entryTags, error: entryTagsError } = await supabase
    .from('entry_tags')
    .select('tag_id')
    .eq('entry_id', entryId);

  if (entryTagsError) {
    console.error('Error fetching entry tags:', entryTagsError);
    toast.error('Failed to fetch tags for the entry.');
    throw entryTagsError;
  }

  if (!entryTags || entryTags.length === 0) {
    return [];
  }

  const tagIds = entryTags.map(et => et.tag_id);

  const { data: tags, error: tagsError } = await supabase
    .from('tags')
    .select('*')
    .in('id', tagIds);

  if (tagsError) {
    console.error('Error fetching tags:', tagsError);
    toast.error('Failed to fetch tags.');
    throw tagsError;
  }

  return (tags as Tag[]) || [];
};

export const updateEntryTags = async (
  supabase: SupabaseClient,
  userId: string,
  entryId: string,
  newTagIds: string[]
): Promise<void> => {
  try {
    const currentEntryTags = await getEntryTagsByEntryId(supabase, entryId);
    const currentTagIds = currentEntryTags.map(et => et.tag_id);

    const tagIdsToAdd = newTagIds.filter(id => !currentTagIds.includes(id));
    const entryTagsToRemove = currentEntryTags.filter(et => !newTagIds.includes(et.tag_id));

    if (tagIdsToAdd.length > 0) {
      const newEntryTagData = tagIdsToAdd.map(tag_id => ({
        user_id: userId,
        entry_id: entryId,
        tag_id,
      }));
      await supabase.from('entry_tags').insert(newEntryTagData).throwOnError();
    }

    if (entryTagsToRemove.length > 0) {
      for (const entryTag of entryTagsToRemove) {
          await removeTagFromEntry(supabase, entryId, entryTag.tag_id);
      }
    }
    toast.success('Entry tags updated successfully.');
  } catch(error) {
    toast.error('Failed to update entry tags.');
    throw error;
  }
}; 