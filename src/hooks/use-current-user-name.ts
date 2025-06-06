import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { useEffect, useState } from 'react';
import { useSession } from '@clerk/clerk-react'; // Assuming @clerk/clerk-react, adjust if using a different Clerk package e.g. @clerk/nextjs

export const useCurrentUserName = () => {
  const [name, setName] = useState<string | null>(null)

  const { session } = useSession();
  const [supabaseClient] = useState(() => {
    if (!session) return null;
    return createClerkSupabaseClient(() => session.getToken({ template: 'supabase' }));
  });

  useEffect(() => {
    if (!supabaseClient) return;
    const fetchProfileName = async () => {
      const { data, error } = await supabaseClient.auth.getSession()
      if (error) {
        console.error(error)
      }

      setName(data.session?.user.user_metadata.full_name ?? '?')
    }

    fetchProfileName()
  }, [])

  return name || '?'
}
