import React, { useEffect, useState } from 'react';
import { Trash2, Search } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { JournalEntry, MediaAttachment } from '@/types/supabase';
import { getJournalEntriesByUserId } from '@/services/journalEntryService';
import { getMediaAttachmentsByEntryId } from '@/services/mediaAttachmentService';

interface PhotoGalleryProps {
  supabase: SupabaseClient;
  userId: string;
}

interface DisplayImage {
  id: string;
  src: string;
  alt: string;
  date?: string;
}

const getLayoutConfig = (index: number) => {
  // Creates a repeating pattern for visual variety
  switch (index % 9) {
    case 0:
      // A large square image
      return { grid: 'lg:col-span-2 lg:row-span-2', aspect: 'aspect-w-1 aspect-h-1' };
    case 1:
      // A tall image
      return { grid: 'lg:row-span-2', aspect: 'aspect-w-1 aspect-h-2' };
    case 5:
      // A wide image
      return { grid: 'lg:col-span-2', aspect: 'aspect-w-2 aspect-h-1' };
    default:
      // Standard square image
      return { grid: '', aspect: 'aspect-w-1 aspect-h-1' };
  }
};

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ supabase, userId }) => {
  const [images, setImages] = useState<DisplayImage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserPhotos = async () => {
      if (!supabase || !userId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const userEntries: JournalEntry[] | null = await getJournalEntriesByUserId(supabase, userId);
        if (!userEntries || userEntries.length === 0) {
          setImages([]);
          setIsLoading(false);
          return;
        }

        let allDisplayImages: DisplayImage[] = [];
        for (const entry of userEntries) {
          if (entry.id) {
            const attachments: MediaAttachment[] = await getMediaAttachmentsByEntryId(supabase, entry.id);
            const imageAttachments = attachments.filter(
              (att) => att.mime_type?.startsWith('image/') && att.file_path && att.id
            );

            const entryImages: DisplayImage[] = imageAttachments.map((att) => ({
              id: att.id!,
              src: att.file_path,
              alt: att.file_name_original || 'User photo',
              date: entry.entry_timestamp ? new Date(entry.entry_timestamp).toLocaleDateString() : undefined,
            }));
            allDisplayImages = [...allDisplayImages, ...entryImages];
          }
        }
        setImages(allDisplayImages);
      } catch (err) {
        console.error("Error fetching photos:", err);
        setError(err instanceof Error ? err.message : 'Failed to load photos.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserPhotos();
  }, [supabase, userId]);

  return (
    <main className="flex-1 p-6 sm:p-8 lg:p-10 text-gray-800 dark:text-gray-200 min-h-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Photo Gallery</h1>
          {images.length > 0 && !isLoading && <p className="text-gray-500 dark:text-gray-400 mt-1">{images.length} photos</p>}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Loading photos...</p>
        </div>
      )}
      {error && (
        <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/30 p-4 rounded-md">
          <p>Error: {error}</p>
        </div>
      )}

      {!isLoading && !error && images.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400 py-10">
            <Search size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-xl">No photos found.</p>
            <p>Upload some photos to your journal entries to see them here.</p>
        </div>
      )}

      {!isLoading && !error && images.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:grid-flow-row-dense">
            {images.map((image, index) => {
              const { grid, aspect } = getLayoutConfig(index);
              return (
                <div
                  key={image.id}
                  className={`relative group overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ${grid} ${aspect}`}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Error'
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <p className="text-white text-sm font-medium">{image.alt}</p>
                  </div>
                  <button className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-red-500/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}
          </div>
          <div className="mt-8 text-center">
              <button className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2.5 px-6 rounded-lg transition-colors text-sm">
                  Load More (Not Implemented)
              </button>
          </div>
        </>
      )}
    </main>
  );
};

export default PhotoGallery;
