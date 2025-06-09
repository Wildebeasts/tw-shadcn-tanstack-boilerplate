import React from "react";
import { JournalEntry, Tag, Project } from "@/types/supabase";
import { Select } from "antd";
import MoodSelector from "../MoodSelector";
import { FaFacebook } from "react-icons/fa";

interface DiaryHeaderProps {
  diary: JournalEntry;
  editableTitle: string;
  setEditableTitle: (title: string) => void;
  selectedTagIds: string[];
  setSelectedTagIds: (ids: string[]) => void;
  availableTags: Tag[];
  isLoadingTags: boolean;
  selectedProjectId: string | null | undefined;
  setSelectedProjectId: (id: string | null | undefined) => void;
  availableProjects: Project[];
  isLoadingProjects: boolean;
  currentSelectedMood: string | null | undefined;
  setCurrentSelectedMood: (mood: string | null | undefined) => void;
  lastSaved: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  showDeleteConfirm: () => void;
  onShareToFacebook: () => void;
  isSharing: boolean;
}

const getContrastColor = (hexcolor?: string): string => {
  if (!hexcolor) return "#000000";
  hexcolor = hexcolor.replace("#", "");
  const r = parseInt(hexcolor.substring(0, 2), 16);
  const g = parseInt(hexcolor.substring(2, 4), 16);
  const b = parseInt(hexcolor.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#FFFFFF";
};

const formatDate = (isoStringInput: string | Date) => {
  if (!isoStringInput) return "No date";
  const date =
    typeof isoStringInput === "string"
      ? new Date(isoStringInput)
      : isoStringInput;
  try {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return typeof isoStringInput === "string"
      ? isoStringInput
      : isoStringInput.toISOString();
  }
};

const DiaryHeader: React.FC<DiaryHeaderProps> = ({
  diary,
  editableTitle,
  setEditableTitle,
  selectedTagIds,
  setSelectedTagIds,
  availableTags,
  isLoadingTags,
  selectedProjectId,
  setSelectedProjectId,
  availableProjects,
  isLoadingProjects,
  currentSelectedMood,
  setCurrentSelectedMood,
  lastSaved,
  isSaving,
  hasUnsavedChanges,
  showDeleteConfirm,
  onShareToFacebook,
  isSharing,
}) => {
  return (
    <header className="p-4 md:p-6 flex justify-between items-start border-b border-slate-200">
      <div className="flex-grow mr-4">
        <input
          type="text"
          value={editableTitle}
          onChange={(e) => setEditableTitle(e.target.value)}
          placeholder="Diary Title"
          className="text-2xl md:text-3xl font-semibold text-[#667760] leading-tight w-full border-0 focus:ring-0 p-0 bg-transparent focus:outline-none"
          style={{ fontFamily: "Readex Pro, sans-serif" }}
        />
        <div className="mt-2">
          <Select
            mode="multiple"
            allowClear
            style={{ width: "100%" }}
            placeholder="Select tags"
            value={selectedTagIds}
            onChange={setSelectedTagIds}
            loading={isLoadingTags}
            options={availableTags.map((tag) => ({
              label: (
                <span
                  style={{
                    backgroundColor: tag.color_hex || "#E9E9E9",
                    color: getContrastColor(tag.color_hex || "#E9E9E9"),
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    border: `1px solid ${
                      tag.color_hex
                        ? getContrastColor(tag.color_hex) + "20"
                        : "#00000020"
                    }`,
                  }}
                >
                  {tag.name}
                </span>
              ),
              value: tag.id as string,
            }))}
            optionFilterProp="label"
            tagRender={(props) => {
              const { value, closable, onClose } = props;
              const tag = availableTags.find((t) => t.id === value);
              return (
                <span
                  style={{
                    backgroundColor: tag?.color_hex || "#E9E9E9",
                    color: getContrastColor(tag?.color_hex || "#E9E9E9"),
                    margin: "2px",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    display: "inline-flex",
                    alignItems: "center",
                    fontSize: "12px",
                    border: `1px solid ${
                      tag?.color_hex
                        ? getContrastColor(tag.color_hex) + "20"
                        : "#00000020"
                    }`,
                  }}
                >
                  {tag?.name || value}
                  {closable && (
                    <span
                      onClick={onClose}
                      style={{ cursor: "pointer", marginLeft: "5px" }}
                    >
                      ×
                    </span>
                  )}
                </span>
              );
            }}
          />
        </div>
        <div className="mt-3">
          <h3
            className="text-sm font-medium text-slate-500 mb-1"
            style={{ fontFamily: "Readex Pro, sans-serif" }}
          >
            Project
          </h3>
          <Select
            allowClear
            style={{ width: "100%" }}
            placeholder="Assign to a project (optional)"
            value={selectedProjectId === undefined ? null : selectedProjectId} // Handle undefined for Select value
            onChange={(value) => setSelectedProjectId(value)}
            loading={isLoadingProjects}
            options={availableProjects.map((proj) => ({
              label: (
                <div className="flex items-center">
                  {proj.color_hex && (
                    <span
                      className="w-3 h-3 rounded-full mr-2 inline-block"
                      style={{
                        backgroundColor: proj.color_hex,
                        border: "1px solid rgba(0,0,0,0.1)",
                      }}
                    ></span>
                  )}
                  {proj.name}
                </div>
              ),
              value: proj.id as string,
            }))}
            optionFilterProp="label" // Assuming you want to filter by project name in the label
          />
        </div>
        <div className="mt-3">
          <h3
            className="text-sm font-medium text-slate-500 mb-1"
            style={{ fontFamily: "Readex Pro, sans-serif" }}
          >
            How are you feeling?
          </h3>
          <MoodSelector
            selectedMoodValue={currentSelectedMood}
            onMoodSelect={(moodVal) => setCurrentSelectedMood(moodVal)}
          />
        </div>
        {diary.entry_timestamp && (
          <p
            className="text-xs text-slate-400 mt-1"
            style={{ fontFamily: "Readex Pro, sans-serif" }}
          >
            Created: {formatDate(diary.entry_timestamp)}
            {lastSaved && (
              <span className="ml-2 text-green-600">
                | Last saved: {formatDate(lastSaved)}
              </span>
            )}
            {isSaving && (
              <span className="ml-2 text-slate-500 flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </span>
            )}
            {!isSaving && hasUnsavedChanges && (
              <span className="ml-2 text-orange-500">Unsaved changes</span>
            )}
          </p>
        )}
      </div>
      <div className="flex space-x-1.5 flex-shrink-0">
        <button
          title="Share to Facebook"
          onClick={onShareToFacebook}
          disabled={isSharing}
          className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSharing ? (
            <svg
              className="animate-spin h-5 w-5 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <FaFacebook className="h-5 w-5" />
          )}
        </button>
        <button
          title="Delete Diary"
          onClick={showDeleteConfirm}
          className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default DiaryHeader; 