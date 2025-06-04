import React, { useEffect, useState, useMemo } from 'react';
import { getProjectById } from '@/services/projectService';
import { getJournalEntriesByProjectId } from '@/services/journalEntryService'; // Corrected service import path
import type { Project, JournalEntry } from '@/types/supabase';
import { useSession } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Link } from '@tanstack/react-router';
import { CalendarDays } from 'lucide-react'; // Added for date display
import { moodOptions } from '@/components/diary/MoodSelector'; // Added for mood display
import { Image as ImageIcon } from 'lucide-react'; // Added for image display

// Helper function to parse BlockNote JSON content (copied from user-profile/page.tsx)
const parseBlockNoteJsonContent = (
  jsonContent: string | undefined | null
): { textContent: string; imageUrl: string | null } => {
  if (!jsonContent) return { textContent: "", imageUrl: null };
  try {
    const blocks = JSON.parse(jsonContent);
    let readableContent = "";
    let firstImageUrl: string | null = null;

    if (Array.isArray(blocks)) {
      for (const block of blocks) {
        if (block.type === "paragraph" && Array.isArray(block.content)) {
          for (const item of block.content) {
            if (item.type === "text" && typeof item.text === "string") {
              readableContent += item.text + " ";
            }
          }
          readableContent += "\n"; 
        } else if (
          block.type === "image" &&
          block.props &&
          typeof block.props.url === "string"
        ) {
          if (!firstImageUrl) { 
            firstImageUrl = block.props.url;
          }
        }
      }
    }
    return { textContent: readableContent.trim(), imageUrl: firstImageUrl };
  } catch (error) {
    console.error("Error parsing BlockNote JSON content:", error);
    return {
      textContent: typeof jsonContent === 'string' ? jsonContent : "",
      imageUrl: null,
    };
  }
};

interface ProjectPageProps {
  projectId: string;
}

const ProjectPage: React.FC<ProjectPageProps> = ({ projectId }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { session } = useSession();
  const activeSupabaseClient = useMemo(() => {
    if (session) {
      return createClerkSupabaseClient(() => session.getToken());
    }
    return null;
  }, [session]);

  useEffect(() => {
    if (!projectId || !activeSupabaseClient) {
      setIsLoadingProject(false);
      setError(projectId ? 'Could not initialize Supabase client.' : 'Project ID is missing.');
      return;
    }
    setIsLoadingProject(true);
    setError(null); // Reset error before fetching
    getProjectById(activeSupabaseClient, projectId)
      .then(data => {
        setProject(data);
        if (!data) setError('Project not found.');
      })
      .catch(err => {
        console.error('Error fetching project:', err);
        setError('Failed to load project details.');
      })
      .finally(() => setIsLoadingProject(false));
  }, [projectId, activeSupabaseClient]);

  useEffect(() => {
    if (!project || !project.id || !activeSupabaseClient) { // Ensured project and project.id exist
      setJournalEntries([]);
      setIsLoadingEntries(project ? true : false); // Only set loading if project was defined
      return;
    }
    setIsLoadingEntries(true);
    getJournalEntriesByProjectId(activeSupabaseClient, project.id) // project.id is now guaranteed to be a string
      .then(data => {
        setJournalEntries(data || []);
      })
      .catch(err => {
        console.error('Error fetching journal entries for project:', err);
        // setError('Failed to load journal entries for this project.'); // Avoid overwriting main project error
      })
      .finally(() => setIsLoadingEntries(false));
  }, [project, activeSupabaseClient]); // project.id is implicitly covered by project dependency

  if (isLoadingProject) {
    return <div className="p-4 text-center">Loading project details...</div>;
  }

  if (error && !project) { // Show error if project loading failed and project is still null
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (!project) {
    // This case should ideally be covered by the error state if fetching failed
    // or if project just wasn't found (which sets an error too).
    // Adding a generic message if somehow reached.
    return <div className="p-4 text-center">Project could not be loaded or found.</div>;
  }

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        day: "2-digit",
        weekday: "short",
        month: "short",
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 bg-gray-50 dark:bg-gray-900 h-[calc(100vh-100px)]">
      <div className="overflow-hidden shadow-lg bg-white dark:bg-gray-800 rounded-lg"> 
        <div style={{ backgroundColor: project.color_hex || '#7DD3FC' }} className="h-10 w-full"></div>
        <div className="p-4 md:p-6"> 
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
            {project.name}
          </h1>
          {project.description && (
            <p className="text-sm md:text-md text-gray-600 dark:text-gray-300 pt-2">
              {project.description}
            </p>
          )}
        </div>
        <div className="px-4 md:px-6 pb-4">
          <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Created on: {formatDate(project.created_at)}
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Associated Diaries</h2>
        {isLoadingEntries && !journalEntries.length ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">Loading diaries...</div>
        ) : journalEntries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {journalEntries.map(entry => {
              const moodOption = entry.manual_mood_label 
                ? moodOptions.find(m => m.value === entry.manual_mood_label) 
                : null;
              const { imageUrl } = parseBlockNoteJsonContent(entry.content);

              return (
                <div 
                  key={entry.id} 
                  className="p-4 rounded-lg shadow-md flex gap-4 items-start group text-gray-800 dark:text-gray-100 transition-all duration-200 ease-in-out border bg-[#F5F8F4] hover:bg-[#E9F0E6] border-[#DDE8DA] hover:border-[#CFE0CA] dark:bg-slate-700/70 dark:hover:bg-slate-700/90 dark:border-slate-600 dark:hover:border-slate-500"
                >
                  {/* Image Section (Left) */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-gray-200 dark:bg-slate-600/50 rounded-lg flex items-center justify-center overflow-hidden">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Diary image" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={32} className="text-gray-400 dark:text-slate-500" />
                    )}
                  </div>

                  {/* Content Section (Right) */}
                  <div className="flex-grow flex flex-col min-w-0 h-full"> {/* h-full to allow mt-auto for date*/}
                    <div className="flex justify-between items-start mb-1">
                      <h3 
                        className="text-lg font-semibold text-slate-700 dark:text-slate-200 truncate mr-2 flex-grow"
                        style={{ fontFamily: 'Readex Pro, sans-serif' }}
                      >
                        <Link 
                          to={`/journal/diary`} 
                          search={{ entryId: entry.id }} 
                          className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                        >
                          {entry.title || 'Untitled Entry'}
                        </Link>
                      </h3>
                      {moodOption && (
                        <img 
                          src={moodOption.emojiPath} 
                          alt={moodOption.label} 
                          className="w-6 h-6 flex-shrink-0" 
                          title={`Mood: ${moodOption.label}`} 
                        />
                      )}
                    </div>
                    
                    {/* Spacer to push date to bottom */}
                    <div className="flex-grow"></div> 
                    
                    <div 
                      className="flex items-center text-xs text-slate-400 dark:text-slate-500 pt-1"
                      style={{ fontFamily: 'Readex Pro, sans-serif' }}
                    >
                      <CalendarDays size={14} className="mr-1.5 flex-shrink-0" />
                      <span>{formatDate(entry.entry_timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center py-6 text-gray-500 dark:text-gray-400">No journal entries found for this project yet.</p>
        )}
      </section>
    </div>
  );
};

export default ProjectPage;
