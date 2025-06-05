import { useState, useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Profile, JournalEntry } from "../../types/supabase";
import { StreakModal, StreakModalProps } from "./StreakModal";

interface StreakManagementProps {
  supabase: SupabaseClient;
  userId: string | null | undefined;
  userProfile: Profile | null;
  journalEntries: JournalEntry[];
  externallyTriggeredOpen: boolean;
  onClose: () => void;
  // debugStreakKey: number;
}

const StreakManagement: React.FC<StreakManagementProps> = ({ 
  supabase, 
  userId, 
  userProfile, 
  journalEntries,
  externallyTriggeredOpen,
  onClose
}) => {
  const [internalShowTrigger, setInternalShowTrigger] = useState(false);
  const [activeDaysOfWeek, setActiveDaysOfWeek] = useState<StreakModalProps['activeDaysOfWeek']>([]);

  const handleCloseAndNotify = () => {
    setInternalShowTrigger(false);
    onClose();
  };

  useEffect(() => {
    if (!userProfile || !userId) {
      setActiveDaysOfWeek([]);
      setInternalShowTrigger(false);
      return;
    }

    const getLocalYYYYMMDD = (date: Date): string => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const now = new Date();
    
    // Determine active days based on actual entries in the last 7 days
    const dayMapping: ReadonlyArray<"Su" | "M" | "Tu" | "W" | "Th" | "F" | "Sa"> = [
      "Su", "M", "Tu", "W", "Th", "F", "Sa"
    ];
    const daysWithEntriesInWindow = new Set<"M" | "Tu" | "W" | "Th" | "F" | "Sa" | "Su">();

    const startOfToday = new Date(now);
    startOfToday.setHours(0,0,0,0);

    const allEntryYYYYMMDD = new Set(
      journalEntries.map(entry => {
        const entryDate = new Date(entry.created_at?.toString() || "");
        return getLocalYYYYMMDD(entryDate);
      })
    );

    for (let i = 0; i < 7; i++) {
      const dateToCheck = new Date(startOfToday);
      dateToCheck.setDate(startOfToday.getDate() - i);
      
      const localDateToCheckYYYYMMDD = getLocalYYYYMMDD(dateToCheck);
      if (allEntryYYYYMMDD.has(localDateToCheckYYYYMMDD)) {
        daysWithEntriesInWindow.add(dayMapping[dateToCheck.getDay()]);
      }
    }

    const orderReference: Array<"M" | "Tu" | "W" | "Th" | "F" | "Sa" | "Su"> = 
      ["M", "Tu", "W", "Th", "F", "Sa", "Su"];
    
    const finalActiveDays = orderReference.filter(day => daysWithEntriesInWindow.has(day));
    setActiveDaysOfWeek(finalActiveDays);

    // Modal opening logic for first visit of the local day
    const lastVisit = localStorage.getItem("beanJourney_lastVisit");
    const todayLocalStr = getLocalYYYYMMDD(now);

    if (!lastVisit || lastVisit !== todayLocalStr) {
      localStorage.setItem("beanJourney_lastVisit", todayLocalStr);
      setInternalShowTrigger(true);
    }
  }, [userId, supabase, userProfile, journalEntries]);

  if (!userProfile) return null;

  const isModalEffectivelyOpen = internalShowTrigger || externallyTriggeredOpen;

  return (
    <StreakModal
      isOpen={isModalEffectivelyOpen}
      onClose={handleCloseAndNotify}
      currentStreak={userProfile.current_journal_streak || 0}
      activeDaysOfWeek={activeDaysOfWeek}
      lastEntryDateDisplay={userProfile.last_entry_date ? new Date(userProfile.last_entry_date).toLocaleDateString() : undefined}
    />
  );
};

export default StreakManagement; 