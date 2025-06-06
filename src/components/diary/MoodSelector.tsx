import React from 'react';

export interface MoodOption {
  label: string;
  emojiPath: string;
  bgColor: string; // Background for the mood item itself when displayed in the selector
  textColor: string; // Text color for the mood label
  value: "amazing" | "happy" | "neutral" | "sad" | "mad" | string; // string for flexibility if other moods are added
}

// Define mood options - these can be expanded or modified
// Using simpler bg/text colors for the selector itself, can be different from calendar's event colors
// eslint-disable-next-line react-refresh/only-export-components
export const moodOptions: MoodOption[] = [
  {
    label: "Amazing",
    value: "amazing",
    emojiPath: "/images/bean-journey/figma/emoji_face_01.png",
    bgColor: "bg-pink-100",
    textColor: "text-pink-700",
  },
  {
    label: "Happy",
    value: "happy",
    emojiPath: "/images/bean-journey/figma/emoji_face_02.png",
    bgColor: "bg-green-100",
    textColor: "text-green-700",
  },
  {
    label: "Neutral",
    value: "neutral",
    emojiPath: "/images/bean-journey/figma/emoji_face_03.png",
    bgColor: "bg-gray-100",
    textColor: "text-gray-700",
  },
  {
    label: "Sad",
    value: "sad",
    emojiPath: "/images/bean-journey/figma/emoji_face_04.png",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
  },
  {
    label: "Mad",
    value: "mad",
    emojiPath: "/images/bean-journey/figma/emoji_face_05.png",
    bgColor: "bg-red-100",
    textColor: "text-red-700",
  },
];

interface MoodSelectorProps {
  selectedMoodValue: string | null | undefined;
  onMoodSelect: (moodValue: string) => void;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ selectedMoodValue, onMoodSelect }) => {
  return (
    <div className="flex flex-wrap gap-2 p-2 rounded-lg bg-slate-50">
      {moodOptions.map((mood) => (
        <button
          key={mood.value}
          onClick={() => onMoodSelect(mood.value)}
          className={`flex flex-col items-center justify-center p-3 rounded-lg shadow-sm transition-all duration-150 ease-in-out
            ${mood.bgColor} ${mood.textColor}
            ${selectedMoodValue === mood.value ? 'ring-2 ring-offset-1 ring-indigo-500 scale-105' : 'hover:opacity-80 hover:scale-105'}
            focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400
          `}
          style={{ minWidth: '80px' }} // Ensure buttons have a decent size
        >
          <img src={mood.emojiPath} alt={mood.label} className="w-8 h-8 mb-1" />
          <span className="text-xs font-medium">{mood.label}</span>
        </button>
      ))}
    </div>
  );
};

export default MoodSelector; 