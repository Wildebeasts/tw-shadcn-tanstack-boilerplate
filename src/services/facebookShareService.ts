import { SupabaseClient } from "@supabase/supabase-js";
import { FacebookShare } from "@/types/supabase";

const TABLE_NAME = "facebook_shares";

/**
 * Creates a new Facebook share record.
 * @param supabase The Supabase client instance.
 * @param shareData The data for the new share record.
 */
export const createFacebookShare = async (
  supabase: SupabaseClient,
  shareData: Omit<FacebookShare, "id" | "shared_at">
): Promise<void> => {
  const { error } = await supabase.from(TABLE_NAME).insert([shareData]);

  if (error) {
    console.error("Error creating Facebook share record:", error);
    throw new Error(`Could not create Facebook share record: ${error.message}`);
  }
};

/**
 * Updates an existing Facebook share record.
 * @param supabase The Supabase client instance.
 * @param shareId The ID of the share record to update.
 * @param updates The partial data to update.
 */
export const updateFacebookShare = async (
  supabase: SupabaseClient,
  shareId: string,
  updates: Partial<FacebookShare>
): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .update(updates)
    .eq("id", shareId);

  if (error) {
    console.error("Error updating Facebook share record:", error);
    throw new Error(`Could not update Facebook share record: ${error.message}`);
  }
};

/**
 * Deletes a Facebook share record.
 * @param supabase The Supabase client instance.
 * @param shareId The ID of the share record to delete.
 * @returns True if deletion was successful.
 */
export const deleteFacebookShare = async (
  supabase: SupabaseClient,
  shareId: string
): Promise<boolean> => {
  const { error } = await supabase.from(TABLE_NAME).delete().eq("id", shareId);

  if (error) {
    console.error("Error deleting Facebook share record:", error);
    throw new Error(`Could not delete Facebook share record: ${error.message}`);
  }

  return true;
}; 