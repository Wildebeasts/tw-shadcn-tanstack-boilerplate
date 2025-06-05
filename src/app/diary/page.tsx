'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import DiaryCard from '@/components/diary/DiaryCard';
// import DiaryCreateForm from '@/components/diary/DiaryCreateForm'; // Commented out as DiaryDetailView will be editor
import DiaryDetailView from '@/components/diary/DiaryDetailView';
import { JournalEntry, Tag, Project } from '@/types/supabase';
// import { createClerkSupabaseClient } from "@/utils/supabaseClient"; // No longer needed
import { useAuth } from "@clerk/clerk-react"; // Kept for userId, getToken might be removed if not used elsewhere
import { useSupabase } from "@/contexts/SupabaseContext"; // Import useSupabase
import { createJournalEntry, getJournalEntriesByUserId, updateJournalEntry, deleteJournalEntry } from '@/services/journalEntryService'; // Added journal entry services and updateJournalEntry
import { getTagsByUserId, getEntryTagsByEntryId } from '@/services/tagService'; // Added tag service and getEntryTagsByEntryId
import { getProjectsByUserId } from '@/services/projectService'; // ADDED: Import project service
// import Calendar from 'react-calendar'; // REMOVED react-calendar import
// import 'react-calendar/dist/Calendar.css'; // REMOVED react-calendar CSS
// import { useRouter, useSearchParams } from 'next/navigation'; // REMOVE Next.js router hooks
import { useNavigate, useSearch, useRouterState } from '@tanstack/react-router'; // Import TanStack Router hooks
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Added Chevron icons

// Define a type for your search params. 
// This should align with your TanStack Router configuration for this route.
interface DiaryPageSearch {
  createNew?: boolean;
  // Add other expected search params here if any
}

// Helper function to determine text color based on background brightness
const getContrastColor = (hexcolor?: string): string => {
  if (!hexcolor) return '#000000';
  hexcolor = hexcolor.replace("#", "");
  if (hexcolor.length === 3) {
    hexcolor = hexcolor.split('').map(char => char + char).join('');
  }
  if (hexcolor.length !== 6) {
    // If not a valid hex after attempting to correct, default to black
    return '#000000';
  }
  const r = parseInt(hexcolor.substring(0, 2), 16);
  const g = parseInt(hexcolor.substring(2, 4), 16);
  const b = parseInt(hexcolor.substring(4, 6), 16);
  // Check for NaN in case of parsing errors with invalid hex chars
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '#000000';
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#FFFFFF';
};

// Local type extension for filtering purposes
interface JournalEntryWithTags extends JournalEntry {
  tag_ids?: string[];
}

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; // Added for new calendar

// Helper function to sort diaries by entry_timestamp robustly
// Sorts in descending order (newest first)
// Null or invalid timestamps are sorted towards the end
const sortDiariesByEntryTimestamp = (a: JournalEntryWithTags, b: JournalEntryWithTags) => {
  const tsA = a.entry_timestamp;
  const tsB = b.entry_timestamp;

  // Handle cases where timestamps might be null
  if (tsA === null && tsB === null) return 0;
  if (tsA === null) return 1; // null timestamps sort after valid ones (i.e., appear "later" or at the end for descending)
  if (tsB === null) return -1; // null timestamps sort after valid ones

  const dateA = new Date(tsA).getTime();
  const dateB = new Date(tsB).getTime();

  // Handle NaN (invalid date string after conversion)
  const aIsNaN = isNaN(dateA);
  const bIsNaN = isNaN(dateB);

  if (aIsNaN && bIsNaN) return 0;
  // Sort NaNs after valid dates (and after nulls, due to previous checks)
  if (aIsNaN) return 1; 
  if (bIsNaN) return -1;

  return dateB - dateA; // Descending order (newest first)
};

const DiaryPage = () => {
  const { userId } = useAuth(); // getToken removed as it's not directly used here anymore
  const supabase = useSupabase();

  const [diaries, setDiaries] = useState<JournalEntryWithTags[]>([]);
  const [isLoadingDiaries, setIsLoadingDiaries] = useState(true);
  const [selectedDiaryId, setSelectedDiaryId] = useState<string | null>(null);
  // const [rightPanelView, setRightPanelView] = useState<'view' | 'create_deprecated'>('view'); // Removed unused state
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(""); // Added state for search query
  const [selectedDate, setSelectedDate] = useState<Date | null>(null); // Changed type to Date | null, initialized to null

  const [allUserTags, setAllUserTags] = useState<Tag[]>([]);
  const [isLoadingUserTags, setIsLoadingUserTags] = useState(true);
  const [activeFilterTagIds, setActiveFilterTagIds] = useState<string[]>([]);

  const [allUserProjects, setAllUserProjects] = useState<Project[]>([]); // ADDED: State for user projects
  const [isLoadingUserProjects, setIsLoadingUserProjects] = useState(true); // ADDED: State for loading projects
  const [activeFilterProjectId, setActiveFilterProjectId] = useState<string | null>(null); // ADDED: State for active project filter

  // const router = useRouter(); // REMOVE Next.js useRouter
  // const searchParams = useSearchParams(); // REMOVE Next.js useSearchParams
  const navigate = useNavigate(); // Initialize TanStack useNavigate
  const routerLocation = useRouterState({ select: (s) => s.location }); // Get current location
  const search: DiaryPageSearch = useSearch({ from: '/journal/diary' }); // Provide from, cast to any if type is complex

  const createNewHandledRef = useRef(false); // Ref to track if createNew has been handled

  const handleCreateNew = useCallback(async () => {
    if (!userId || !supabase) {
      setError("User not authenticated or Supabase client not available.");
      return;
    }
    try {
      const newEntryBasics: Partial<JournalEntryWithTags> = {
        user_id: userId,
        entry_timestamp: new Date().toISOString(),
        title: "New Draft Diary", // Default title for new draft
        content: "", // Start with empty content
        manual_mood_label: "neutral", // Default mood for new draft
        is_draft: true, // Mark as draft
        project_id: activeFilterProjectId || undefined, // ADDED: Associate with active project if one is selected
      };
      const newDiaryEntry = await createJournalEntry(supabase, newEntryBasics as Partial<JournalEntry>);
      if (newDiaryEntry && newDiaryEntry.id) {
        setDiaries(prevDiaries => [{ ...newDiaryEntry, tag_ids: [] }, ...prevDiaries].sort(sortDiariesByEntryTimestamp));
        setSelectedDiaryId(newDiaryEntry.id); // Select the new diary
      } else {
        setError("Failed to create new diary entry in the database.");
      }
    } catch (err) {
      console.error("Error creating new diary:", err);
      setError("An error occurred while creating the new diary.");
    }
  }, [userId, supabase, activeFilterProjectId]);

  // Effect to handle 'createNew' search parameter
  useEffect(() => {
    if (search.createNew === true) {
      if (!createNewHandledRef.current) { // Check if already handled
        if (userId && supabase) { // Check for supabase client availability
          createNewHandledRef.current = true; // Mark as handled
          handleCreateNew(); // MODIFIED: Call without arguments, it will use activeFilterProjectId from state
          navigate({
            to: routerLocation.pathname, // Use current pathname
            search: (prev: DiaryPageSearch) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { createNew, ...rest } = prev; 
              return rest; // Return search params without createNew
            },
            replace: true
          });
        } else {
          // If user/supabase not ready, still remove the param to avoid loops, but don't mark as handled by creation logic
          // This path implies an issue upstream or a race condition where createNew is true but auth isn't ready.
          // console.warn("Attempted to create new diary without user/supabase, removing createNew param.");
          navigate({
            to: routerLocation.pathname,
            search: (prev: DiaryPageSearch) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { createNew, ...rest } = prev;
              return rest;
            },
            replace: true
          });
        }
      }
    } else {
      // If createNew is not true in the search params, reset the flag
      createNewHandledRef.current = false;
    }
  }, [search.createNew, userId, supabase, handleCreateNew, navigate, routerLocation.pathname]); // MODIFIED: No longer pass activeFilterProjectId to handleCreateNew

  // Fetch initial diaries and user tags
  useEffect(() => {
    if (userId && supabase) { // Check for supabase client availability
      setIsLoadingDiaries(true);
      getJournalEntriesByUserId(supabase, userId)
        .then(async fetchedDiaries => {
          if (!fetchedDiaries) {
            setDiaries([]);
            setSelectedDiaryId(null);
            setIsLoadingDiaries(false);
            return;
          }

          // Fetch tags for each diary
          const diariesWithTagsPromises = fetchedDiaries.map(async (diary) => {
            if (!diary.id) return { ...diary, tag_ids: [] }; // Should not happen if ID is guaranteed
            try {
              const entryTags = await getEntryTagsByEntryId(supabase, diary.id);
              const tagIds = entryTags.map(et => et.tag_id);
              return { ...diary, tag_ids: tagIds };
            } catch (tagError) {
              console.error(`Error fetching tags for diary ${diary.id}:`, tagError);
              return { ...diary, tag_ids: [] }; // Default to empty tags on error for this specific diary
            }
          });

          const diariesWithTags = await Promise.all(diariesWithTagsPromises);

          const sortedDiaries = diariesWithTags.sort(sortDiariesByEntryTimestamp);
          setDiaries(sortedDiaries);

          if (sortedDiaries.length > 0 && !selectedDiaryId) {
            setSelectedDiaryId(sortedDiaries[0].id!);
          } else if (sortedDiaries.length === 0) {
            setSelectedDiaryId(null);
          }
          setIsLoadingDiaries(false);
        })
        .catch(err => {
          console.error("Error fetching diaries:", err);
          setError("Failed to load diaries.");
          setIsLoadingDiaries(false);
        });

      setIsLoadingUserTags(true);
      getTagsByUserId(supabase, userId)
        .then(tags => {
          setAllUserTags(tags || []);
          setIsLoadingUserTags(false);
        })
        .catch(err => {
          console.error("Error fetching user tags:", err);
          // Optionally set an error state for tags
          setIsLoadingUserTags(false);
        });

      // Fetch user projects
      setIsLoadingUserProjects(true);
      getProjectsByUserId(supabase, userId)
        .then(projects => {
          setAllUserProjects(projects || []);
          setIsLoadingUserProjects(false);
        })
        .catch(err => {
          console.error("Error fetching user projects:", err);
          // Optionally set an error state for projects
          setIsLoadingUserProjects(false);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, supabase]);

  const handleSelectDiary = (id: string) => {
    setSelectedDiaryId(id);
  };

  const handleUpdateDiary = async (updates: Partial<JournalEntry>) => {
    if (!selectedDiaryId || !supabase) { // Check for supabase client availability
      setError("No diary selected or Supabase client not available for update.");
      throw new Error("Update preconditions not met."); // Throw error to be caught by DiaryDetailView
    }
    try {
      const updatedEntry = await updateJournalEntry(supabase, selectedDiaryId, updates);
      if (updatedEntry) {
        setDiaries(prevDiaries => 
          prevDiaries.map(d => d.id === selectedDiaryId ? { ...d, ...updatedEntry } : d)
                     .sort(sortDiariesByEntryTimestamp)
        );
        // Optionally, you could re-fetch or just update local state
      } else {
        setError("Failed to save updates to the database.");
        throw new Error("Failed to save updates to the database.");
      }
    } catch (err) {
      console.error("Error updating diary in page:", err);
      setError("An error occurred while saving your changes.");
      throw err; // Re-throw to be caught by DiaryDetailView
    }
  };

  const handleDeleteDiary = async (diaryIdToDelete: string) => {
    if (!supabase) { // Check for supabase client availability
      setError("Supabase client not available for delete.");
      throw new Error("Delete preconditions not met.");
    }
    if (!diaryIdToDelete) {
        setError("No diary ID provided for deletion.");
        throw new Error("No diary ID provided for deletion.");
    }

    try {
      await deleteJournalEntry(supabase, diaryIdToDelete);
      setDiaries(prevDiaries => {
        const remainingDiaries = prevDiaries.filter(d => d.id !== diaryIdToDelete);
        if (remainingDiaries.length > 0) {
          // If the deleted diary was selected, select the first of the remaining diaries
          if (selectedDiaryId === diaryIdToDelete) {
            setSelectedDiaryId(remainingDiaries[0].id!);
          }
        } else {
          // No diaries left
          setSelectedDiaryId(null);
        }
        return remainingDiaries;
      });
      // Optionally, display a success message
    } catch (err) {
      console.error("Error deleting diary in page:", err);
      setError("An error occurred while deleting the diary.");
      throw err; // Re-throw to be caught by UI if needed
    }
  };

  const handleTagFilterClick = (tagId: string) => {
    setActiveFilterTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleProjectFilterClick = (projectId: string | null) => { // ADDED: Handler for project filter click
    setActiveFilterProjectId(prev => (prev === projectId ? null : projectId)); // Toggle or set, null to clear
  };

  // Calendar related logic from TodoPage
  const calendarDateForLogic = selectedDate || new Date(); // Use selectedDate if available, else today for month display
  const currentMonthName = calendarDateForLogic.toLocaleString('default', { month: 'long' });
  const currentYear = calendarDateForLogic.getFullYear();
  const daysInMonth = new Date(calendarDateForLogic.getFullYear(), calendarDateForLogic.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(calendarDateForLogic.getFullYear(), calendarDateForLogic.getMonth(), 1).getDay();

  const getDaysArrayForMonth = useCallback(() => {
    const daysArray = [];
    for (let i = 0; i < firstDayOfMonth; i++) { daysArray.push(null); }
    for (let i = 1; i <= daysInMonth; i++) { daysArray.push(i); }
    return daysArray;
  }, [firstDayOfMonth, daysInMonth]);

  const calendarDays = getDaysArrayForMonth();

  const handleCalendarDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
  };

  const handleMonthChange = (increment: number) => {
    setSelectedDate(prevDate => {
        const current = prevDate || new Date(); // If no date selected, change month from current
        return new Date(current.getFullYear(), current.getMonth() + increment, 1);
    });
  };
  // --- End Calendar Logic

  // Memoized filtered diaries for search, tag, and date filters
  const filteredDiaries = useMemo(() => {
    let tempDiaries = diaries;

    // Filter by search query (title)
    if (searchQuery) {
      tempDiaries = tempDiaries.filter(diary =>
        diary.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by selected tags
    // IMPORTANT: This assumes `diary.tag_ids` (an array of string IDs) exists on your JournalEntry objects.
    // If not, this part of the filtering will not work correctly.
    if (activeFilterTagIds.length > 0) {
      tempDiaries = tempDiaries.filter(diary => {
        const d = diary as JournalEntryWithTags; // Use local extended type
        const diaryTagIds = d.tag_ids;
        const matches = diaryTagIds && Array.isArray(diaryTagIds) && diaryTagIds.some((tagId: string) => activeFilterTagIds.includes(tagId));
        
        return matches;
      });
    }

    // Filter by selected project
    if (activeFilterProjectId) { // ADDED: Project ID filter
      tempDiaries = tempDiaries.filter(diary => diary.project_id === activeFilterProjectId);
    }

    // Filter by selected date
    if (selectedDate && !(selectedDate instanceof Array)) { // Ensure selectedDate is a single date
        const filterDate = new Date(selectedDate);
        filterDate.setHours(0, 0, 0, 0); // Normalize to start of the day for comparison

        tempDiaries = tempDiaries.filter(diary => {
            const entryDate = new Date(diary.entry_timestamp);
            entryDate.setHours(0, 0, 0, 0); // Normalize to start of the day
            return entryDate.getTime() === filterDate.getTime();
        });
    }

    return tempDiaries;
  }, [diaries, searchQuery, activeFilterTagIds, selectedDate, activeFilterProjectId]);

  const selectedDiary = filteredDiaries.find(diary => diary.id === selectedDiaryId);
  // If selected diary is filtered out, try to find it in the original diaries list
  const currentSelectedDiary = selectedDiary || diaries.find(d => d.id === selectedDiaryId);

  if (!userId) {
    return <div className="p-8 text-center">Please sign in to view your diaries.</div>;
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] bg-slate-50 text-foreground"> 
      <aside className="w-full md:w-1/3 lg:w-1/4 p-4 md:p-6 border-r border-slate-200 overflow-y-auto bg-white">
        <header className="mb-6">
          <h1 className="text-xl font-normal text-slate-500 mb-1" style={{ fontFamily: 'Readex Pro, sans-serif' }}>My diaries</h1>
          
          <button 
            onClick={handleCreateNew}
            disabled={isLoadingDiaries} // Disable button while loading/creating
            className="w-full mt-3 mb-3 px-4 py-2 text-sm font-medium text-black bg-[#DAE6D4] rounded-lg hover:bg-[#DAE6D4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DAE6D4] transition-colors disabled:opacity-50"
          >
            + Create New Diary
          </button>
          <div className="relative mt-2">
            <input 
              type="text" 
              placeholder="Search diaries by title..."
              value={searchQuery} // Controlled component
              onChange={(e) => setSearchQuery(e.target.value)} // Update search query state
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-[#DAE6D4] focus:border-[#DAE6D4] bg-white text-slate-700 placeholder-slate-400"
              style={{ fontFamily: 'Readex Pro, sans-serif', fontSize: '14px' }}
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Tag Filters Section */}
          <div className="mt-4">
            <h2 className="text-sm font-medium text-slate-500 mb-2" style={{ fontFamily: 'Readex Pro, sans-serif' }}>Filter by Tags:</h2>
            {isLoadingUserTags ? (
              <p className="text-xs text-slate-400">Loading tags...</p>
            ) : allUserTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allUserTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagFilterClick(tag.id!)}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors duration-150 ease-in-out shadow-sm`}
                    style={
                      activeFilterTagIds.includes(tag.id!)
                        ? { backgroundColor: tag.color_hex || '#007AFF', color: getContrastColor(tag.color_hex || '#007AFF'), borderColor: tag.color_hex || '#007AFF' }
                        : { backgroundColor: '#F3F4F6', color: '#374151', borderColor: '#D1D5DB', fontFamily: 'Readex Pro, sans-serif' } // Tailwind gray-100 bg, gray-700 text, gray-300 border
                    }
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400" style={{ fontFamily: 'Readex Pro, sans-serif' }}>No tags created yet.</p>
            )}
          </div>

          {/* Project Filters Section */}
          <div className="mt-4">
            <h2 className="text-sm font-medium text-slate-500 mb-2" style={{ fontFamily: 'Readex Pro, sans-serif' }}>Filter by Project:</h2>
            {isLoadingUserProjects ? (
              <p className="text-xs text-slate-400">Loading projects...</p>
            ) : allUserProjects.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allUserProjects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectFilterClick(project.id!)}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors duration-150 ease-in-out shadow-sm`}
                    style={
                      activeFilterProjectId === project.id!
                        ? { backgroundColor: project.color_hex || '#007AFF', color: getContrastColor(project.color_hex || '#007AFF'), borderColor: project.color_hex || '#007AFF' }
                        : { backgroundColor: '#F3F4F6', color: '#374151', borderColor: '#D1D5DB', fontFamily: 'Readex Pro, sans-serif' }
                    }
                  >
                    {project.name}
                  </button>
                ))}
                <button
                  onClick={() => handleProjectFilterClick(null)} // Clear project filter
                  className={`px-2.5 py-1 text-xs rounded-md border transition-colors duration-150 ease-in-out shadow-sm ${!activeFilterProjectId ? 'bg-slate-500 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                  style={{ fontFamily: 'Readex Pro, sans-serif' }}
                >
                  All Projects
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400" style={{ fontFamily: 'Readex Pro, sans-serif' }}>No projects created yet.</p>
            )}
          </div>

          {/* New Calendar Section */}
          <div className="mt-6 bg-white/70 dark:bg-slate-800/70 p-1 sm:p-2 md:p-4 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h4 className="text-base sm:text-lg font-semibold text-[#2F2569] dark:text-green-300" style={{ fontFamily: 'Readex Pro, sans-serif' }}>
                {currentMonthName} {currentYear}
              </h4>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleMonthChange(-1)}
                  className="p-1.5 sm:p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => handleMonthChange(1)}
                  className="p-1.5 sm:p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500 dark:text-gray-400 mb-1 sm:mb-2">
              {daysOfWeek.map(day => <div key={day}>{day.slice(0,2)}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const isToday = day && new Date(currentYear, calendarDateForLogic.getMonth(), day).toDateString() === new Date().toDateString();
                const isSelectedDate = day && selectedDate && new Date(currentYear, calendarDateForLogic.getMonth(), day).toDateString() === selectedDate.toDateString();
                const hasDiaryEntry = day && diaries.some(diary => {
                    const entryDate = new Date(diary.entry_timestamp);
                    return entryDate.getFullYear() === currentYear &&
                           entryDate.getMonth() === calendarDateForLogic.getMonth() &&
                           entryDate.getDate() === day;
                });

                return (
                  <button
                    key={index}
                    onClick={() => day && handleCalendarDateChange(new Date(currentYear, calendarDateForLogic.getMonth(), day))}
                    disabled={!day}
                    className={`p-1.5 sm:p-2 rounded-full w-full aspect-square flex items-center justify-center text-xs sm:text-sm transition-colors
                      ${!day ? "bg-transparent cursor-default" : "hover:bg-slate-200 dark:hover:bg-slate-700"}
                      ${isSelectedDate ? "bg-primary text-primary-foreground ring-2 ring-primary dark:bg-green-600/80 dark:text-white" 
                        : isToday ? "bg-primary/30 text-primary-foreground dark:bg-green-500/50 dark:text-white font-semibold" 
                        : "text-slate-700 dark:text-gray-300"}
                      ${hasDiaryEntry && !isSelectedDate ? "!bg-primary/20 dark:!bg-green-400/30 !font-bold" : ""}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
             <button
                onClick={() => setSelectedDate(null)}
                className="w-full mt-3 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-200 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-slate-400 transition-colors dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                Show All Dates
              </button>
          </div>
        </header>

        {isLoadingDiaries ? (
          <p className="text-slate-500 text-center py-10">Loading diaries...</p>
        ) : error ? (
          <p className="text-red-500 text-center py-10">{error}</p>
        ) : filteredDiaries.length > 0 ? (
          <div className="space-y-3">
            {filteredDiaries.map((diaryEntry) => {
              if (!supabase) return null; // Ensures supabase is non-null for DiaryCard
              return (
                <DiaryCard 
                  key={diaryEntry.id} 
                  diary={diaryEntry} 
                  onSelectDiary={handleSelectDiary} 
                  isSelected={diaryEntry.id === selectedDiaryId} 
                  supabase={supabase} 
                  updated_at={diaryEntry.updated_at}
                />
              );
            })}
          </div>
        ) : searchQuery && diaries.length > 0 && filteredDiaries.length === 0 ? (
          <p className="text-slate-500 text-center py-10">No diaries match your search "{searchQuery}".</p>
        ) : activeFilterTagIds.length > 0 && filteredDiaries.length === 0 ? (
          <p className="text-slate-500 text-center py-10">No diaries match your selected tags.</p>
        ) : selectedDate && filteredDiaries.length === 0 ? ( 
            <p className="text-slate-500 text-center py-10">No diaries found for {selectedDate.toLocaleDateString()}.</p>
        ) : activeFilterProjectId && filteredDiaries.length === 0 ? ( // ADDED: Message for no diaries matching project filter
            <p className="text-slate-500 text-center py-10">No diaries found for the selected project.</p>
        ) : diaries.length === 0 ? (
          <p className="text-slate-500 text-center py-10">No diaries yet. Click "Create New Diary" to start!</p>
        ) : filteredDiaries.length === 0 && (searchQuery || activeFilterTagIds.length > 0 || selectedDate || activeFilterProjectId) ? ( // MODIFIED: Added activeFilterProjectId to condition
            <p className="text-slate-500 text-center py-10">No diaries match your current filters.</p>
        ) : (
          <div className="space-y-3">
            {filteredDiaries.map((diaryEntry) => {
              if (!supabase) return null; // Ensures supabase is non-null for DiaryCard
              return (
                <DiaryCard 
                  key={diaryEntry.id} 
                  diary={diaryEntry} 
                  onSelectDiary={handleSelectDiary} 
                  isSelected={diaryEntry.id === selectedDiaryId} 
                  supabase={supabase} 
                  updated_at={diaryEntry.updated_at}
                />
              );
            })}
          </div>
        )}
      </aside>

      <main className="flex-1 w-full md:w-2/3 lg:w-3/4 p-4 md:p-8 overflow-y-auto bg-[#E4EFE7]/50 rounded-tl-2xl md:rounded-tl-none">
        {/* Use currentSelectedDiary for the detail view to ensure it shows even if filtered out from the list */}
        {currentSelectedDiary && supabase ? (
          <DiaryDetailView 
            key={currentSelectedDiary.id}
            diary={currentSelectedDiary} 
            onUpdateDiary={handleUpdateDiary}
            onDeleteDiary={handleDeleteDiary} 
            userId={userId}
            supabase={supabase}
          />
        ) : isLoadingDiaries ? (
          <div className="text-center py-10 flex flex-col items-center justify-center h-full">
            <h2 className="text-2xl font-semibold text-slate-600">Loading...</h2>
          </div>
        ) : diaries.length === 0 ? (
          <div className="text-center py-10 flex flex-col items-center justify-center h-full">
            <h2 className="text-2xl font-semibold text-slate-600">
              Create your first diary!
            </h2>
            <button 
              onClick={handleCreateNew}
              className="mt-4 px-6 py-3 text-lg font-medium text-white bg-primary hover:bg-primary/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus transition-colors"
            >
              Create Your First Diary
            </button>
          </div>
        ) : filteredDiaries.length === 0 && (selectedDate || searchQuery || activeFilterTagIds.length > 0 || activeFilterProjectId) ? ( // MODIFIED: Added activeFilterProjectId to condition
          <div className="text-center py-10 flex flex-col items-center justify-center h-full">
            <h2 className="text-2xl font-semibold text-slate-600">
              No Matching Diaries
            </h2>
            <p className="text-slate-500 mt-2">
              No diaries match your current filters. Try adjusting your search, tags, or selected date.
            </p>
          </div>
        ) : !currentSelectedDiary && filteredDiaries.length > 0 ? (
          <div className="text-center py-10 flex flex-col items-center justify-center h-full">
            <h2 className="text-2xl font-semibold text-slate-600">
              Select a diary to view
            </h2>
            <p className="text-slate-500 mt-2">
              Choose a diary from the list on the left.
            </p>
          </div>
        ) : (
          // Fallback: This case should ideally not be reached if logic above is comprehensive
          // Or it's the case where currentSelectedDiary is null and no filters are active leading to empty list
          // but diaries list is not empty - meaning something is wrong or user deselected actively.
          // For now, a generic message or null if currentSelectedDiary is what drives the view.
          // Given currentSelectedDiary is used for DiaryDetailView, if it's null, it will show this block or one of the above.
          // If currentSelectedDiary is null and there are no diaries at all, the 'Create your first diary!' block handles it.
          // If currentSelectedDiary is null, but there are diaries and no filters leading to empty, it means user needs to select one.
           <div className="text-center py-10 flex flex-col items-center justify-center h-full">
            <h2 className="text-2xl font-semibold text-slate-600">
                Select a diary to view or create a new one.
            </h2>
          </div>
        )}
      </main>
    </div>
  );
};

export default DiaryPage; 