import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { useEffect, useState } from 'react';
import { useSession } from '@clerk/clerk-react'; // Assuming @clerk/clerk-react, adjust if using a different Clerk package e.g. @clerk/nextjs

export const useCurrentUserImage = () => {
  const [image, setImage] = useState<string | null>(null)

  const { session } = useSession();
  const [supabaseClient] = useState(() => {
    if (!session) return null;
    return createClerkSupabaseClient(() => session.getToken({ template: 'supabase' }));
  });

  useEffect(() => {
    if (!supabaseClient) return;
    const fetchUserImage = async () => {
      const { data, error } = await supabaseClient.auth.getSession()
      if (error) {
        console.error(error)
      }

      setImage(data.session?.user.user_metadata.avatar_url ?? null)
    }
    fetchUserImage()
  }, [])

  return image
}
