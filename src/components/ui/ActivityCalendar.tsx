import React, { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from "@/utils/css";
import type { JournalEntry } from '@/types/supabase'; // Added JournalEntry type import

interface ActivityCalendarProps {
  journalEntries?: JournalEntry[]; // Changed activityData to journalEntries
  colors?: {
    light: string;
    dark: string;
    noActivity?: string;
  };
  // We'll add props for month navigation later
  // currentMonthStartDate?: Date;
}

const DESIRED_WEEK_COLUMN_WIDTH = 18; // Target footprint: 16px cell (w-4) + 2px gap (gap-0.5)
const MIN_WEEKS = 4; // Minimum number of weeks to display
const DEFAULT_WEEKS = 12; // Default number of weeks if width calculation isn't possible initially

const defaultColors = {
  light: '#E4EFE7',
  dark: '#99BC85',
  noActivity: 'rgba(209, 213, 219, 0.3)',
};

// --- START TIMEZONE HELPER ---
const TARGET_TIMEZONE = 'Asia/Bangkok';

// Utility to get date parts in a specific timezone
const getDatePartsInTimezone = (
  date: Date,
  timeZone: string
): { year: number; monthIndex: number; day: number; monthShortName: string; dateString: string } => {
  // For year, month, day numeric parts using 'en-CA' for YYYY-MM-DD format
  const ymdFormatter = new Intl.DateTimeFormat('en-CA', { // 'en-CA' often yields YYYY-MM-DD
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const formattedDateStr = ymdFormatter.format(date); // Expected: YYYY-MM-DD

  const partsArray = formattedDateStr.split('-');
  const year = parseInt(partsArray[0], 10);
  const monthIndex = parseInt(partsArray[1], 10) - 1; // 0-indexed for JS
  const day = parseInt(partsArray[2], 10);

  // For short month name
  const monthNamer = new Intl.DateTimeFormat('en-US', { // Using 'en-US' for standard short month names
    timeZone,
    month: 'short',
  });
  const monthShortName = monthNamer.format(date);

  return {
    year,
    monthIndex,
    day,
    monthShortName,
    dateString: formattedDateStr, // YYYY-MM-DD
  };
};
// --- END TIMEZONE HELPER ---

const getPastNDays = (n: number, endDate: Date = new Date()): Date[] => {
  const normalizedEndDate = new Date(endDate);
  normalizedEndDate.setHours(0, 0, 0, 0); // Normalizes to midnight in local browser TZ for sequence generation
  return Array.from({ length: n }, (_, i) => {
    const date = new Date(normalizedEndDate);
    date.setDate(normalizedEndDate.getDate() - (n - 1 - i));
    return date;
  });
};

const ActivityCalendar: React.FC<ActivityCalendarProps> = ({
  journalEntries, // Changed from activityData
  colors = defaultColors,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numberOfWeeks, setNumberOfWeeks] = useState(DEFAULT_WEEKS);
  const [currentEndDate, setCurrentEndDate] = useState(new Date());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const elem = containerRef.current;
    if (!elem) {
      return;
    }

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width;
        if (containerWidth > 0) {
          const calculatedWeeks = Math.max(MIN_WEEKS, Math.floor(containerWidth / DESIRED_WEEK_COLUMN_WIDTH));
          
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          
          debounceTimerRef.current = setTimeout(() => {
            if (calculatedWeeks !== numberOfWeeks) { 
              setNumberOfWeeks(calculatedWeeks);
            }
          }, 150);
        }
      }
    });

    observer.observe(elem);

    return () => {
      observer.unobserve(elem); 
      observer.disconnect(); 
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numberOfWeeks]); // Removed MIN_WEEKS and DESIRED_WEEK_COLUMN_WIDTH as they are constants

  const numDaysToDisplay = useMemo(() => numberOfWeeks * 7, [numberOfWeeks]);

  const displayDays = useMemo(() => {
    return getPastNDays(numDaysToDisplay, currentEndDate);
  }, [numDaysToDisplay, currentEndDate]);
  
  const activityMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!journalEntries || journalEntries.length === 0) {
      displayDays.forEach(day => {
        const { dateString: dayStrInBangkok } = getDatePartsInTimezone(day, TARGET_TIMEZONE);
        map.set(dayStrInBangkok, 0);
      });
      return map;
    }

    const entryCountsByDate = new Map<string, number>();
    journalEntries.forEach(entry => {
      if (entry.entry_timestamp) {
        const { dateString: entryDateStrInBangkok } = getDatePartsInTimezone(
          new Date(entry.entry_timestamp),
          TARGET_TIMEZONE
        );
        entryCountsByDate.set(entryDateStrInBangkok, (entryCountsByDate.get(entryDateStrInBangkok) || 0) + 1);
      }
    });

    displayDays.forEach(day => {
      const { dateString: dayStrInBangkok } = getDatePartsInTimezone(day, TARGET_TIMEZONE);
      const count = entryCountsByDate.get(dayStrInBangkok) || 0;
      let level = 0;
      if (count === 1) {
        level = 1;
      } else if (count === 2) {
        level = 2;
      } else if (count === 3) {
        level = 3;
      } else if (count >= 4) {
        level = 4;
      }
      map.set(dayStrInBangkok, level);
    });

    return map;
  }, [displayDays, journalEntries]);

  const getColorForLevel = (level: number | undefined): string => {
    const currentColors = { ...defaultColors, ...colors };
    if (level === undefined || level === 0) return currentColors.noActivity;
    if (level === 1) return currentColors.light;
    if (level === 2) return `color-mix(in srgb, ${currentColors.light} 66%, ${currentColors.dark} 33%)`;
    if (level === 3) return `color-mix(in srgb, ${currentColors.light} 33%, ${currentColors.dark} 66%)`;
    if (level >= 4) return currentColors.dark;
    return currentColors.noActivity;
  };

  const { finalCellsToRender, actualColumnsToRenderValue } = useMemo(() => {
    if (displayDays.length === 0) {
        return { finalCellsToRender: [], actualColumnsToRenderValue: numberOfWeeks };
    }
    const firstDay = displayDays[0];
    // dayOfWeekForFirst is based on local browser time; this is for visual grid alignment (e.g. Sunday as first col)
    const dayOfWeekForFirst = firstDay.getDay(); 
    const emptyCellsAtStartCount = dayOfWeekForFirst;
    
    const numItemsBeforeEndPadding = emptyCellsAtStartCount + numDaysToDisplay;
    const calculatedActualColumns = Math.ceil(numItemsBeforeEndPadding / 7); 
    const totalCellsInRectangle = calculatedActualColumns * 7;
    const paddingCellsAtEndCount = totalCellsInRectangle - numItemsBeforeEndPadding;

    const cells = [
      ...Array(emptyCellsAtStartCount).fill(null),
      ...displayDays,
      ...Array(paddingCellsAtEndCount > 0 ? paddingCellsAtEndCount : 0).fill(null),
    ];
    return { finalCellsToRender: cells, actualColumnsToRenderValue: calculatedActualColumns };
  }, [displayDays, numDaysToDisplay, numberOfWeeks]);


  const monthLabelData = useMemo(() => {
    const labels: { name: string; startColumn: number; span: number }[] = [];
    if (displayDays.length === 0 || actualColumnsToRenderValue === 0) return labels;

    let currentMonthIdentifier = ""; // e.g., "2023-Jan"
    const WEEKS_IN_DATA_PERIOD = actualColumnsToRenderValue;

    for (let weekIndex = 0; weekIndex < WEEKS_IN_DATA_PERIOD; weekIndex++) {
      const firstDayOfGridColumn = new Date(displayDays[0]);
      // Align to the start of the week (e.g., Sunday) in local time for grid column reference
      firstDayOfGridColumn.setDate(displayDays[0].getDate() - displayDays[0].getDay());
      firstDayOfGridColumn.setDate(firstDayOfGridColumn.getDate() + weekIndex * 7);

      const { year, monthShortName } = getDatePartsInTimezone(firstDayOfGridColumn, TARGET_TIMEZONE);
      const monthIdForColumn = `${year}-${monthShortName}`;

      if (monthIdForColumn !== currentMonthIdentifier) {
        if (currentMonthIdentifier !== "" && labels.length > 0) {
          const prevMonthData = labels[labels.length - 1];
          prevMonthData.span = weekIndex - prevMonthData.startColumn;
        }
        labels.push({ name: monthShortName, startColumn: weekIndex, span: 1 });
        currentMonthIdentifier = monthIdForColumn;
      }
    }

    if (labels.length > 0) {
      const lastMonthData = labels[labels.length - 1];
      if (lastMonthData) {
        lastMonthData.span = WEEKS_IN_DATA_PERIOD - lastMonthData.startColumn;
        if (lastMonthData.span <= 0) lastMonthData.span = 1;
      }
    } else if (WEEKS_IN_DATA_PERIOD > 0 && displayDays.length > 0) {
        const { monthShortName } = getDatePartsInTimezone(displayDays[0], TARGET_TIMEZONE);
        labels.push({ name: monthShortName, startColumn: 0, span: WEEKS_IN_DATA_PERIOD });
    }
    return labels.filter(label => label.span > 0);
  }, [displayDays, actualColumnsToRenderValue]);


  const handlePrev = () => {
    setCurrentEndDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() - numDaysToDisplay);
      return newDate;
    });
  };

  const handleNext = () => {
    setCurrentEndDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + numDaysToDisplay);
      return newDate;
    });
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full border rounded-[10px] sm:rounded-[15px] p-1.5 sm:p-3 flex flex-col space-y-1 sm:space-y-1.5 bg-card"
    >
      <div className="flex justify-between items-center">
        <button onClick={handlePrev} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
          &lt; Prev
        </button>
        <button onClick={handleNext} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
          Next &gt;
        </button>
      </div>
      <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${actualColumnsToRenderValue}, minmax(0, 1fr))`}}>
        {monthLabelData.map((month, index) => (
          <div 
            key={`${month.name}-${index}-${month.startColumn}`}
            className="text-xs text-gray-700 dark:text-gray-300 py-1 truncate"
            style={{ gridColumnStart: month.startColumn + 1, gridColumnEnd: `span ${month.span}`, textAlign: 'center' }}
          >
            {month.name}
          </div>
        ))}
        {actualColumnsToRenderValue > 0 && monthLabelData.reduce((acc, m) => acc + m.span, 0) < actualColumnsToRenderValue &&
            Array.from({length: actualColumnsToRenderValue - monthLabelData.reduce((acc, m) => acc + m.span, 0) }).map((_, i) => <div key={`filler-month-${i}`}></div>)}
      </div>

      <div 
        className="grid gap-0.5"
        style={{
          gridTemplateRows: `repeat(7, minmax(0, auto))`,
          gridAutoFlow: 'column',
          gridTemplateColumns: `repeat(${actualColumnsToRenderValue}, minmax(0, auto))`
        }}
      >
        {finalCellsToRender.map((dayOrNull, index) => {
          if (!dayOrNull) {
            return (
              <div 
                key={`empty-${index}`} 
                className="w-4 h-4 border rounded-[4px] sm:rounded-[3px] bg-card"
              />
            );
          }

          const day = dayOrNull as Date;
          const { dateString: dateStrInBangkok } = getDatePartsInTimezone(day, TARGET_TIMEZONE);
          const activityLevel = activityMap.get(dateStrInBangkok);
          const titleText = `Date: ${dateStrInBangkok}\\nActivity: ${activityLevel !== undefined ? activityLevel : 'No data'}`;
          const isInactive = activityLevel === undefined || activityLevel === 0;
          const cellBgColor = isInactive ? undefined : getColorForLevel(activityLevel);

          return (
            <div
              key={dateStrInBangkok} // Use Bangkok date string as key for stability
              title={titleText}
              className={cn(
                "w-4 h-4 border rounded-[4px] sm:rounded-[3px]",
                isInactive ? "bg-card" : ""
              )}
              style={{ backgroundColor: cellBgColor }}
            >
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityCalendar; 