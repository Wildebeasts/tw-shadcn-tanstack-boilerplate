'use client'

import { useCurrentUserImage } from '@/hooks/use-current-user-image'
import { useCurrentUserName } from '@/hooks/use-current-user-name'
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { useEffect, useState } from 'react';
import { useSession } from '@clerk/clerk-react'; // Assuming @clerk/clerk-react, adjust if using a different Clerk package e.g. @clerk/nextjs



export type RealtimeUser = {
  id: string
  name: string
  image: string
}

export const useRealtimePresenceRoom = (roomName: string) => {
  const currentUserImage = useCurrentUserImage()
  const currentUserName = useCurrentUserName();
  const { session } = useSession();
  const [supabaseClient] = useState(() => {
    if (!session) return null;
    return createClerkSupabaseClient(() => session.getToken({ template: 'supabase' }));
  });

  const [users, setUsers] = useState<Record<string, RealtimeUser>>({})

  useEffect(() => {
    if (!supabaseClient) return;
    const room = supabaseClient.channel(roomName)

    room
      .on('presence', { event: 'sync' }, () => {
        const newState = room.presenceState<{ image: string; name: string }>()

        const newUsers = Object.fromEntries(
          Object.entries(newState).map(([key, values]) => [
            key,
            { name: values[0].name, image: values[0].image },
          ])
        ) as Record<string, RealtimeUser>
        setUsers(newUsers)
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') {
          return
        }

        await room.track({
          name: currentUserName,
          image: currentUserImage,
        })
      })

    return () => {
      room.unsubscribe()
    }
  }, [roomName, currentUserName, currentUserImage])

  return { users }
}
