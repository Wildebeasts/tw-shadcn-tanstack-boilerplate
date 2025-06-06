import { useState, useMemo } from "react";
// import type { SupabaseClient } from "@supabase/supabase-js"; // No longer needed for direct fetching
import { JournalEntry } from "@/types/supabase";
// import { getJournalEntriesByUserId } from "@/services/journalEntryService"; // No longer needed for direct fetching
import CalendarSection, { CalendarEvent } from "./CalendarSection";

interface JournalCalendarSectionProps {
  // supabase: SupabaseClient; // No longer needed as prop
  // currentUserId: string | null | undefined; // No longer needed as prop
  journalEntries: JournalEntry[];
  loadingJournalEntries: boolean;
  journalEntryError: string | null;
}

const JournalCalendarSection: React.FC<JournalCalendarSectionProps> = ({ 
  journalEntries, 
  loadingJournalEntries, 
  journalEntryError 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Transform journal entries for the calendar
  const transformedCalendarEvents: CalendarEvent[] = useMemo(() => {
    return journalEntries.map((entry) => {
      let emoji = "/images/bean-journey/figma/emoji_face_03.png";
      let emojiBg = "bg-[#E0E0E0]";
      let textBg = "bg-[#BDBDBD]";
      let currentMood: CalendarEvent['mood'] = "neutral";
      const entryMood = entry.manual_mood_label?.toLowerCase();

      if (entryMood === "amazing") {
        emoji = "/images/bean-journey/figma/emoji_face_01.png";
        emojiBg = "bg-[#FFEBF2]";
        textBg = "bg-[#FCA7C4]";
        currentMood = "amazing";
      } else if (entryMood === "happy") {
        emoji = "/images/bean-journey/figma/emoji_face_02.png";
        emojiBg = "bg-[#E6F9F1]";
        textBg = "bg-[#12A7F1]";
        currentMood = "happy";
      } else if (entryMood === "sad") {
        emoji = "/images/bean-journey/figma/emoji_face_04.png";
        emojiBg = "bg-[#E6F9F1]";
        textBg = "bg-[#FF4BEF]";
        currentMood = "sad";
      } else if (entryMood === "mad") {
        emoji = "/images/bean-journey/figma/emoji_face_05.png";
        emojiBg = "bg-[#FFDDDD]";
        textBg = "bg-[#FF8888]";
        currentMood = "mad";
      }

      return {
        id: entry.id,
        date: new Date(entry.entry_timestamp),
        emoji: emoji,
        text: entry.title ? entry.title.substring(0, 15) + "..." : "No title...",
        emojiBg: emojiBg,
        textBg: textBg,
        mood: currentMood,
      };
    });
  }, [journalEntries]);

  return (
    <>
      {loadingJournalEntries && (
        <p className="text-center text-gray-500 py-4">Loading journal entries...</p>
      )}
      {journalEntryError && (
        <p className="text-center text-red-500 py-4">{journalEntryError}</p>
      )}
      {!loadingJournalEntries && !journalEntryError && (
        <CalendarSection
          events={transformedCalendarEvents}
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
        />
      )}
    </>
  );
};

export default JournalCalendarSection; 