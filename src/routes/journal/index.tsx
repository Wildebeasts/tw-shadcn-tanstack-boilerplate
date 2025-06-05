import { createFileRoute } from "@tanstack/react-router";
import "@fontsource/readex-pro/400.css"; // Regular weight
import "@fontsource/readex-pro/500.css"; // Medium weight
import "@fontsource/readex-pro/600.css"; // Medium weight
// import { CalendarIcon, ClockIcon } from "lucide-react"; // Assuming lucide-react for icons - Removed unused import
import "react-day-picker/dist/style.css"; // Import default styles (we'll override)
import { useState, useEffect } from "react";
// import beanLogo from "@/images/logo_bean_journal.png"; // No longer needed here
import HeaderCard from "@/components/journal/HeaderCard";
import FloatingActionButton from "@/components/journal/FloatingActionButton";
// import DebugControls from "@/components/journal/DebugControls";
import { Profile } from "../../types/supabase"; // Import Profile interface
// import { StreakModal, StreakModalProps } from "../../components/journal/StreakModal"; // Now handled by StreakManagement
import TagSection from "../../components/journal/TagSection"; // Import TagSection
import { JournalEntry } from "../../types/supabase"; // Import JournalEntry interface
import { getJournalEntriesByUserId } from "../../services/journalEntryService"; // Import journal entry services
import { getProfileByUserId } from "../../services/profileService"; // Import profile services
// import { createClerkSupabaseClient } from "../../utils/supabaseClient"; // No longer needed here
import { useAuth } from "@clerk/clerk-react"; // Kept for userId
import { useSupabase } from "../../contexts/SupabaseContext"; // Import useSupabase
import JournalCalendarSection from "../../components/journal/JournalCalendarSection"; // Import JournalCalendarSection
import StreakManagement from "../../components/journal/StreakManagement"; // Import StreakManagement

// Update the route path to make it a child of the journal root
export const Route = createFileRoute("/journal/")({
  component: Homepage,
});

function Homepage() {
  const animationStyles = `
    /* Sunny Day Animation */
    @keyframes sun-rays {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    @keyframes sunshine {
        0% { transform: scale(1); opacity: 0.9; }
        50% { transform: scale(1.05); opacity: 1; }
        100% { transform: scale(1); opacity: 0.9; }
    }
    @keyframes cloud-drift {
        0% { transform: translateX(-15px); opacity: 0; }
        20% { opacity: 1; }
        80% { opacity: 1; }
        100% { transform: translateX(80px); opacity: 0; }
    }
    /* Rain Animation */
    @keyframes rain-fall {
        0% { transform: translateY(-10px); opacity: 0; }
        10% { opacity: 1; }
        100% { transform: translateY(60px); opacity: 0; }
    }
    /* Thunder Animation */
    @keyframes thunder-flash {
        0%, 100% { opacity: 0; }
        10% { opacity: 1; }
        20% { opacity: 0; }
        30% { opacity: 0.6; }
        40% { opacity: 0; }
    }
    /* Mad Animation */
    @keyframes mad-shake {
        0% { transform: translateX(0); }
        10% { transform: translateX(-1px) rotate(-1deg); }
        20% { transform: translateX(1px) rotate(1deg); }
        30% { transform: translateX(-2px) rotate(-2deg); }
        40% { transform: translateX(2px) rotate(2deg); }
        50% { transform: translateX(-1px) rotate(-1deg); }
        60% { transform: translateX(1px) rotate(1deg); }
        70% { transform: translateX(-1px) rotate(-1deg); }
        80% { transform: translateX(1px) rotate(1deg); }
        90% { transform: translateX(-1px); }
        100% { transform: translateX(0); }
    }
    /* Amazing Animation */
    @keyframes confetti-fall {
        0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
        25% { opacity: 1; }
        100% { transform: translateY(60px) rotate(360deg); opacity: 0; }
    }
    .confetti-container {
        position: absolute;
        width: 100%;
        height: 100%;
        overflow: hidden;
        top: 0;
        left: 0;
        pointer-events: none;
    }
    .sunny-container {
        position: absolute;
        width: 100%;
        height: 100%;
        overflow: hidden;
        top: 0;
        left: 0;
        pointer-events: none;
    }
    .rain-container {
        position: absolute;
        width: 100%;
        height: 100%;
        overflow: hidden;
        top: 0;
        left: 0;
        pointer-events: none;
    }
    .mad-container {
        position: absolute;
        width: 100%;
        height: 100%;
        overflow: hidden;
        top: 0;
        left: 0;
        pointer-events: none;
    }
    .mad-container img {
        animation: mad-shake 0.5s cubic-bezier(.36,.07,.19,.97) infinite;
        transform-origin: center;
    }
    .confetti-piece {
        position: absolute;
        width: 8px;
        height: 8px;
        background: #FFC107;
        opacity: 0;
        top: 0;
        animation: confetti-fall 3s ease-in-out infinite;
    }
    .confetti-piece:nth-child(2n) {
        background: #FF5722;
        height: 6px;
        width: 6px;
        animation-delay: 0.2s;
    }
    .confetti-piece:nth-child(3n) {
        background: #E91E63;
        height: 7px;
        width: 7px;
        animation-delay: 0.4s;
    }
    .confetti-piece:nth-child(4n) {
        background: #9C27B0;
        height: 5px;
        width: 5px;
        animation-delay: 0.6s;
    }
    .confetti-piece:nth-child(5n) {
        background: #03A9F4;
        height: 9px;
        width: 9px;
        animation-delay: 0.8s;
    }
    .confetti-piece:nth-child(10n) {
        left: 10%;
        animation-delay: 2.7s;
    }
    .sunshine {
        position: absolute;
        top: 20px;
        right: 30px;
        width: 45px;
        height: 45px;
        border-radius: 50%;
        background: #FFD700;
        box-shadow: 0 0 20px 8px rgba(255, 215, 0, 0.7);
        animation: sunshine 4s ease-in-out infinite;
        opacity: 0;
        z-index: 5;
    }
    .sun-ray-line {
        position: absolute;
        background: #FFD700;
        width: 3px;
        height: 15px;
        top: 50%;
        left: 50%;
        transform-origin: bottom center;
    }
    .cloud {
        position: absolute;
        width: 60px;
        height: 25px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 20px;
        opacity: 0;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        animation: cloud-drift 15s linear infinite;
    }
    .cloud:before {
        content: '';
        position: absolute;
        top: -15px;
        left: 12px;
        width: 25px;
        height: 25px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 50%;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    .cloud:after {
        content: '';
        position: absolute;
        top: -22px;
        right: 12px;
        width: 35px;
        height: 35px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 50%;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    .rain-drop {
        position: absolute;
        width: 2px;
        height: 10px;
        background: #03A9F4;
        opacity: 0;
        top: 0;
        animation: rain-fall 2s linear infinite;
    }
    .rain-drop:nth-child(2n) {
        left: 20%;
        animation-delay: 0.3s;
    }
    .rain-drop:nth-child(3n) {
        left: 40%;
        animation-delay: 0.6s;
    }
    .rain-drop:nth-child(4n) {
        left: 60%;
        animation-delay: 0.9s;
    }
    .rain-drop:nth-child(5n) {
        left: 80%;
        animation-delay: 1.2s;
    }
    .rain-drop:nth-child(6n) {
        left: 90%;
        animation-delay: 1.5s;
    }
    .rain-drop:nth-child(7n) {
        left: 70%;
        animation-delay: 1.8s;
    }
    .rain-drop:nth-child(8n) {
        left: 30%;
        animation-delay: 2.1s;
    }
    .rain-drop:nth-child(9n) {
        left: 50%;
        animation-delay: 2.4s;
    }
    .rain-drop:nth-child(10n) {
        left: 10%;
        animation-delay: 2.7s;
    }
    .thunder {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.3);
        opacity: 0;
        animation: thunder-flash 4s ease-out infinite;
        pointer-events: none;
    }
    `;

  const { userId } = useAuth(); // Call useAuth at the top level for userId
  const supabase = useSupabase(); // Use the hook to get Supabase client

  // const [showDebugButton, setShowDebugButton] = useState(false);  const [debugStreakKey, setDebugStreakKey] = useState(0); // Key to force StreakManagement update

  // Profile related state
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Journal Entry related state - partially kept for HeaderCard, main logic moved to JournalCalendarSection
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loadingJournalEntries, setLoadingJournalEntries] = useState(false);
  const [journalEntryError, setJournalEntryError] = useState<string | null>(null);

  // State for the StreakManagement modal in this specific page instance
  const [showStreakModalHomepage, setShowStreakModalHomepage] = useState(false);

  // Fetch profile on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId || !supabase) return; // Check for supabase client
      setLoadingProfile(true);
      setProfileError(null);
      try {
        const profile = await getProfileByUserId(supabase, userId);
        setUserProfile(profile);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setProfileError("Failed to load user profile.");
      }
      setLoadingProfile(false);
    };
    fetchProfile();
  }, [userId, supabase]);

  // Fetch journal entries on component mount
  useEffect(() => {
    const fetchJournalEntries = async () => {
      if (!userId || !supabase) return; // Check for supabase client
      setLoadingJournalEntries(true);
      setJournalEntryError(null);
      try {
        const fetchedEntries = await getJournalEntriesByUserId(supabase, userId);
        setJournalEntries(fetchedEntries || []);
      } catch (error) {
        console.error("Failed to fetch journal entries:", error);
        setJournalEntryError("Failed to load journal entries.");
      }
      setLoadingJournalEntries(false);
    };
    if (supabase && userId) {
        fetchJournalEntries();
    }
  }, [userId, supabase]);

  // const handleDebugClick = () => {
  //   localStorage.removeItem("beanJourney_lastVisit");
  //   setDebugStreakKey(prevKey => prevKey + 1); // Increment key to trigger effect in StreakManagement
  //   // window.location.reload(); // Removed page reload
  // };

  // const toggleDebugButton = () => {
  //   setShowDebugButton((prev) => !prev);
  // };

  return (
    <>
      <style>{animationStyles}</style>
      <div className="h-[calc(100vh-100px)] overflow-auto px-4 bg-white dark:bg-[#1E1726] border-x-1 dark:border-x-2">
        {loadingProfile && (
          <p className="text-center text-gray-500 py-4">Loading profile...</p>
        )}
        {profileError && (
          <p className="text-center text-red-500 py-4">{profileError}</p>
        )}
        {!loadingProfile && !profileError && userProfile && supabase && (
          <HeaderCard journalEntries={journalEntries} userProfile={userProfile} />
        )}
        {/* Render TagSection if supabase and userId are available */} 
        {supabase && userId && <TagSection supabase={supabase} currentUserId={userId} />}

        {/* Render JournalCalendarSection, passing fetched data and loading/error states */} 
        {supabase && userId && (
            <JournalCalendarSection 
                journalEntries={journalEntries} 
                loadingJournalEntries={loadingJournalEntries}
                journalEntryError={journalEntryError}
                // Supabase client will be implicitly available to services if they are refactored or if this component passes it down
                // For now, assuming services called within JournalCalendarSection will need to be adapted or receive the client
            />
        )}

        {/* <DebugControls
          showDebugButton={showDebugButton}
          handleDebugClick={handleDebugClick}
          toggleDebugButton={toggleDebugButton}
        /> */}
        
        {/* Render StreakManagement if supabase, userId and userProfile are available */} 
        {supabase && userId && userProfile && (
            <StreakManagement 
                supabase={supabase} 
                userId={userId} 
                userProfile={userProfile} 
                journalEntries={journalEntries} // Pass journal entries
                // debugStreakKey={debugStreakKey}   // Pass debug key
                externallyTriggeredOpen={showStreakModalHomepage} // Added prop
                onClose={() => setShowStreakModalHomepage(false)} // Added prop
            />
        )}
        <FloatingActionButton />
      </div>
    </>
  );
}
