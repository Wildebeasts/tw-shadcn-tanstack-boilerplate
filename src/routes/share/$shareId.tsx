import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useSupabase } from '@/contexts/SupabaseContext'
import { getFacebookShare } from '@/services/facebookShareService'
import { FacebookShare, JournalEntry, Tag } from '@/types/supabase'

export const Route = createFileRoute('/share/$shareId')({
  component: SharePage,
})

type ShareData = FacebookShare & {
  journal_entries: Pick<JournalEntry, 'title' | 'content'> & {
    entry_tags: { tags: Pick<Tag, 'name'> }[];
  };
};

function SharePage() {
  const { shareId } = Route.useParams()
  const supabase = useSupabase()
  const [shareData, setShareData] = useState<ShareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchShareData = async () => {
      if (!supabase || !shareId) {
        setLoading(false)
        setError('Could not initialize services.')
        return
      }
      try {
        setLoading(true)
        const data = await getFacebookShare(supabase, shareId)
        if (data) {
          setShareData(data)
        } else {
          setError('Share link is invalid or has been removed.')
        }
      } catch (err) {
        setError('Failed to load shared content.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchShareData()
  }, [supabase, shareId])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (!shareData) {
    return <div>Share not found.</div>
  }

  const { title } = shareData.journal_entries;
  const tags = shareData.journal_entries.entry_tags.map(et => et.tags);
  const imageUrl = shareData.preview_image_url_cached;
  const shareUrl = `${window.location.origin}/share/${shareData.id}`;
  const tagNames = tags.map(t => `#${t.name}`).join(' ');
  const description = `Checkout our website BeanJournal! Tags: ${tagNames}`;

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta property="og:url" content={shareUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={imageUrl} />

        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={imageUrl} />
      </Helmet>
      <div style={{ fontFamily: 'sans-serif', padding: '20px', textAlign: 'center' }}>
        <h1>{title}</h1>
        <img src={imageUrl} alt={title} style={{ maxWidth: '100%', borderRadius: '8px' }} />
        <p>{tagNames}</p>
        <p>
          You are viewing a shared journal entry. <a href="https://beanjournal.site">Visit Bean Journal</a> to create your own.
        </p>
      </div>
    </>
  )
} 