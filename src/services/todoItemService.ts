import type { SupabaseClient } from '@supabase/supabase-js';
import type { TodoItem } from '../types/supabase';
import { getJournalEntryById, updateJournalEntry } from './journalEntryService';
import { toast } from 'sonner';

// --- TodoItem Functions ---

// Minimal representation of BlockNote block structures for manipulation
// We assume content of a todo block, if it's text, is a single text node.
interface TextBlockContent {
  type: "text";
  text: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  styles: Record<string, any>;
}

interface BlockNoteBlock {
  id: string; // BlockNote blocks usually have an ID, though not strictly needed for this update logic
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: TextBlockContent[] | any; // Simplified, can be more complex
  children: BlockNoteBlock[];
}

export const getTodoItemsByUserId = async (supabase: SupabaseClient, userId: string) => {
  const { data, error } = await supabase
    .from('todo_items')
    .select('*, journal_entries (title)')
    .eq('user_id', userId);
  if (error) {
    toast.error('Failed to fetch to-do items.');
    throw error;
  }
  return data as TodoItem[];
};

export const getTodoItemsByEntryId = async (supabase: SupabaseClient, entryId: string) => {
  const { data, error } = await supabase
    .from('todo_items')
    .select('*')
    .eq('entry_id', entryId);
  if (error) {
    toast.error('Failed to fetch to-do items for the entry.');
    throw error;
  }
  return data as TodoItem[];
};

export const createTodoItem = async (supabase: SupabaseClient, todoData: Partial<TodoItem>) => {
  const { data, error } = await supabase
    .from('todo_items')
    .insert([todoData])
    .select()
    .single();
  if (error) {
    toast.error('Failed to create to-do item.');
    throw error;
  }
  toast.success('To-do item created successfully.');
  return data as TodoItem | null;
};

export const updateTodoItem = async (supabase: SupabaseClient, todoId: string, updates: Partial<TodoItem>) => {
  const { data: updatedTodoItem, error: todoUpdateError } = await supabase
    .from('todo_items')
    .update(updates)
    .eq('id', todoId)
    .select()
    .single();

  if (todoUpdateError) {
    toast.error('Failed to update to-do item.');
    throw todoUpdateError;
  }
  if (!updatedTodoItem) return null;

  // If the updated todo item has an associated journal entry, update the entry's content
  if (updatedTodoItem.entry_id) {
    try {
      const journalEntry = await getJournalEntryById(supabase, updatedTodoItem.entry_id);

      if (journalEntry && journalEntry.content) {
        const blocks: BlockNoteBlock[] = JSON.parse(journalEntry.content);
        let entryWasModified = false;

        const blockIndex = blocks.findIndex(
          (block: BlockNoteBlock) => block.type === 'todo' && block.props.todoId === todoId
        );

        if (blockIndex > -1) {
          const targetBlock = { ...blocks[blockIndex] }; // Create a copy to modify

          // Update checked status
          const newCheckedState = updatedTodoItem.is_completed ? "true" : "false";
          if (targetBlock.props.checked !== newCheckedState) {
            targetBlock.props.checked = newCheckedState;
            entryWasModified = true;
          }

          // Update priority
          const newPriority = String(updatedTodoItem.priority ?? 0);
          if (targetBlock.props.priority !== newPriority) {
            targetBlock.props.priority = newPriority;
            entryWasModified = true;
          }
          
          // Update task description if it was part of the 'updates'
          if (updates.task_description !== undefined) {
            // Assuming the todo block's text content is a single text node.
            // This will overwrite any existing complex inline content.
            const newContent: TextBlockContent[] = [{
              type: "text",
              text: updates.task_description,
              styles: {}, // Reset styles for simplicity
            }];
            
            // Check if content actually changed to avoid unnecessary updates
            // This is a simple check; deep equality might be better but adds complexity.
            if (JSON.stringify(targetBlock.content) !== JSON.stringify(newContent)) {
              targetBlock.content = newContent;
              entryWasModified = true;
            }
          }
          
          if (entryWasModified) {
            blocks[blockIndex] = targetBlock;
            await updateJournalEntry(supabase, updatedTodoItem.entry_id, {
              content: JSON.stringify(blocks),
            });
          }
        }
      }
    } catch (error) {
      console.error('Error updating journal entry content for todo item:', todoId, error);
      toast.error('Failed to update journal entry with the new to-do item information.');
      // Decide if this error should be propagated or just logged.
      // For now, logging it and not interrupting the todo update flow.
    }
  }

  toast.success('To-do item updated successfully.');
  return updatedTodoItem as TodoItem | null;
};

export const deleteTodoItem = async (supabase: SupabaseClient, todoId: string) => {
  // First, try to get the todo item to check if it has an entry_id
  const { data: todoItemToDelete, error: fetchError } = await supabase
    .from('todo_items')
    .select('entry_id')
    .eq('id', todoId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: Row to return not found, which is fine if it was already deleted somehow
    console.error('Error fetching todo item before deletion:', fetchError);
    toast.error('Error preparing to-do item for deletion.');
    throw fetchError;
  }

  if (todoItemToDelete && todoItemToDelete.entry_id) {
    try {
      const journalEntry = await getJournalEntryById(supabase, todoItemToDelete.entry_id);
      if (journalEntry && journalEntry.content) {
        let blocks: BlockNoteBlock[] = JSON.parse(journalEntry.content);
        const initialBlockCount = blocks.length;

        blocks = blocks.filter(
          (block: BlockNoteBlock) => !(block.type === 'todo' && block.props.todoId === todoId)
        );

        if (blocks.length < initialBlockCount) { // Check if a block was actually removed
          await updateJournalEntry(supabase, todoItemToDelete.entry_id, {
            content: JSON.stringify(blocks),
          });
        }
      }
    } catch (error) {
      console.error('Error updating journal entry content during todo item deletion:', todoId, error);
      toast.error('Failed to update journal entry after to-do item deletion.');
      // Decide if this error should be propagated or just logged.
      // For now, logging it and not interrupting the todo deletion flow.
    }
  }

  // Proceed to delete the todo item itself
  const { error: deleteError } = await supabase
    .from('todo_items')
    .delete()
    .eq('id', todoId);

  if (deleteError) {
    console.error('Error deleting todo item:', deleteError);
    toast.error('Failed to delete to-do item.');
    throw deleteError;
  }
  toast.success('To-do item deleted successfully.');
  return true;
}; 