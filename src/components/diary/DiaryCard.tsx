import React, { useState, useEffect } from 'react';
import { JournalEntry, Tag, Project } from '@/types/supabase'; // Import the JournalEntry type
import { cn } from "@/utils/css"; // For conditional class names
import { getTagsForEntry } from '@/services/tagService'; // Added
import { getProjectById } from '@/services/projectService'; // Added for project name
import { SupabaseClient } from '@supabase/supabase-js'; // Added
import { moodOptions } from './MoodSelector'; // Import moodOptions
import { Building } from 'lucide-react'; // Added for project icon

// Define a simple type for Tiptap/ProseMirror node structure for text extraction
interface Node {
  type?: string;
  content?: Node[];
  text?: string;
}

interface DiaryCardProps {
  diary: JournalEntry; // Changed to JournalEntry
  onSelectDiary: (id: string) => void;
  isSelected: boolean;
  supabase: SupabaseClient; // Added supabase prop
  updated_at?: string; // To help trigger re-fetch of tags
}

const DiaryCard: React.FC<DiaryCardProps> = ({ diary, onSelectDiary, isSelected, supabase, updated_at }) => {
  const [entryTags, setEntryTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [isLoadingProjectName, setIsLoadingProjectName] = useState(false);
  const [projectFetchError, setProjectFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      if (!diary.id || !supabase) return;
      setIsLoadingTags(true);
      try {
        const tags = await getTagsForEntry(supabase, diary.id);
        setEntryTags(tags || []);
      } catch (error) {
        console.error(`Error fetching tags for entry ${diary.id}:`, error);
        setEntryTags([]); // Set to empty array on error
      } finally {
        setIsLoadingTags(false);
      }
    };

    fetchTags();
  }, [diary.id, supabase, updated_at]);

  useEffect(() => {
    const fetchProjectName = async () => {
      if (!diary.project_id || !supabase) {
        setProjectName(null);
        setProjectFetchError(null);
        return;
      }
      setIsLoadingProjectName(true);
      setProjectFetchError(null);
      try {
        // Assuming project_id in JournalEntry is a string UUID referring to Projects table
        const projectData: Project | null = await getProjectById(supabase, diary.project_id as string);
        if (projectData) {
          setProjectName(projectData.name);
        } else {
          setProjectName(null);
          // Optional: set a specific error if project_id exists but project not found
          // setProjectFetchError('Project details not found.'); 
        }
      } catch (error) {
        console.error(`Error fetching project name for diary ${diary.id}, project ID ${diary.project_id}:`, error);
        setProjectName(null);
        setProjectFetchError('Could not load project name.');
      } finally {
        setIsLoadingProjectName(false);
      }
    };

    if (diary.project_id) { // Only run if project_id is present
      fetchProjectName();
    } else {
      setProjectName(null);
      setIsLoadingProjectName(false);
      setProjectFetchError(null);
    }
  }, [diary.project_id, diary.id, supabase]);

  // Helper to format the date, can be made more sophisticated
  const formatDate = (isoString: string) => {
    if (!isoString) return 'No date';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return isoString; // fallback to original string if formatting fails
    }
  };

  // Helper function to extract text from JSON content
  const extractTextFromJSONContent = (jsonString?: string): string => {
    if (!jsonString) return 'No content available.';

    // Recursive function to extract text from nodes - moved to the root of this function
    function extractTextNodes(node: Node, accumulatedText: string[]): void {
      if (node.type === 'text' && node.text) {
        accumulatedText.push(node.text);
      }
      if (node.content && Array.isArray(node.content)) {
        for (const childNode of node.content) {
          extractTextNodes(childNode, accumulatedText);
        }
      }
    }

    try {
      const parsedContent: Node = JSON.parse(jsonString);
      const texts: string[] = [];
      if (parsedContent.content) {
        for (const topLevelNode of parsedContent.content) {
          extractTextNodes(topLevelNode, texts);
        }
      }
      const result = texts.join(' ').trim();
      return result || '';
    } catch (error) {
      console.error("Error parsing diary content for card:", error);
      return 'Unable to display content.'; // Fallback for parsing errors
    }
  };

  // Helper function to determine text color based on background brightness
  const getContrastColor = (hexcolor?: string): string => {
    if (!hexcolor) return '#000000'; // Default to black if no color
    hexcolor = hexcolor.replace("#", "");
    const r = parseInt(hexcolor.substring(0, 2), 16);
    const g = parseInt(hexcolor.substring(2, 4), 16);
    const b = parseInt(hexcolor.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#FFFFFF'; // Return black for light backgrounds, white for dark
  };

  return (
    <div 
      onClick={() => onSelectDiary(diary.id!)} // Added non-null assertion for id
      className={cn(
        "p-3 rounded-lg cursor-pointer transition-all duration-200 ease-in-out",
        "border", // Basic border
        isSelected ? "bg-[#F5F8F4] border-[#A7BAA1] shadow-md" : "bg-[#F5F8F4] hover:bg-[#E9F0E6] border-[#DDE8DA] hover:border-[#CFE0CA]",
        "shadow-sm hover:shadow-md"
      )}
      style={{
        // Target Figma card background: #FFEBF2 (fill_AU2N0E)
        // Selected state could be a bit darker or have a prominent border
      }}
    >
      {/* Title - Figma style_SSNUMJ (Readex Pro, 20px, #2F2569 color from a different element but looks more like title) */}
      <div className="flex items-center justify-between mb-1">
        <h3 
          className="text-md font-semibold truncate text-slate-700 mr-2"
          style={{ fontFamily: 'Readex Pro, sans-serif' }}
        >
          {diary.title}
        </h3>
        {diary.manual_mood_label && (
          <img 
            src={moodOptions.find(m => m.value === diary.manual_mood_label)?.emojiPath}
            alt={diary.manual_mood_label}
            className="w-5 h-5"
            title={`Mood: ${diary.manual_mood_label}`}
          />
        )}
      </div>
      {/* Display Project Name */}
      {isLoadingProjectName && (
        <p 
          className="text-xs text-slate-400 dark:text-slate-500 animate-pulse mb-1.5" 
          style={{ fontFamily: 'Readex Pro, sans-serif' }}>
          Loading project...
        </p>
      )}
      {!isLoadingProjectName && projectName && (
        <div 
          className="flex items-center text-xs text-sky-600 dark:text-sky-500 mb-1.5" 
          style={{ fontFamily: 'Readex Pro, sans-serif' }}
          title={`Project: ${projectName}"`}
        >
          <Building size={12} className="mr-1 flex-shrink-0" />
          <span className="truncate">{projectName}</span>
        </div>
      )}
      {!isLoadingProjectName && projectFetchError && diary.project_id && ( // Show error only if relevant
        <p 
          className="text-xs text-red-500 dark:text-red-400 mb-1.5" 
          style={{ fontFamily: 'Readex Pro, sans-serif' }}
        >
          {projectFetchError}
        </p>
      )}

      {/* Content Snippet - Figma style_SQAN8F (Readex Pro, 10px, #989CB8) */}
      <p 
        className="text-xs text-slate-500 mb-1.5 line-clamp-2"
        style={{ fontFamily: 'Readex Pro, sans-serif' }}
      >
        {extractTextFromJSONContent(diary.content)}
      </p>

      {/* Display Tags */} 
      {!isLoadingTags && entryTags.length > 0 && (
        <div className="mt-1 mb-1.5 flex flex-wrap gap-1.5">
          {entryTags.map(tag => (
            <span 
              key={tag.id}
              className="text-xs px-2 py-1 rounded-md shadow-sm border border-black border-opacity-10"
              style={{ 
                fontFamily: 'Readex Pro, sans-serif',
                backgroundColor: tag.color_hex || '#E9E9E9',
                color: getContrastColor(tag.color_hex || '#E9E9E9')
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center">
        <span 
            className="text-xs text-slate-400 ml-auto" // Added ml-auto to push date to the right if category is absent
            style={{ fontFamily: 'Readex Pro, sans-serif' }}
        >
            {formatDate(diary.entry_timestamp)} {/* Changed to entry_timestamp and formatted */}
        </span>
      </div>
    </div>
  );
};

export default DiaryCard; 