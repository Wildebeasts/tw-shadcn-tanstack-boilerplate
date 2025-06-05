import React, { useState, useMemo, useEffect, useCallback } from "react";
import { JournalEntry, Tag, Project } from "@/types/supabase";
import { Modal as AntModal, Select } from "antd";
import debounce from "lodash/debounce";
import type { TodoItem as TodoItemType } from "@/types/supabase";
import {
  getTagsByUserId,
  getTagsForEntry,
  updateEntryTags,
} from "@/services/tagService";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  createMediaAttachment,
  getMediaAttachmentsByEntryId,
  deleteMediaAttachment,
} from "@/services/mediaAttachmentService";
import { getPublicUrl, deleteFiles } from "@/services/storageService";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import {
  BlockTypeSelectItem,
  blockTypeSelectItems,
  FormattingToolbar,
  FormattingToolbarController,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
  type DefaultReactSuggestionItem,
} from "@blocknote/react";
import {
  PartialBlock,
  Block,
  BlockNoteSchema,
  defaultBlockSpecs,
  insertOrUpdateBlock,
  filterSuggestionItems,
} from "@blocknote/core";
import { v4 as uuidv4 } from "uuid"; // For unique file names
import { Alert } from "../editor/alert/alert";
import { RiAlertFill } from "react-icons/ri";
import { TodoItem } from "../editor/todo/todoItem"; // Import TodoItem
import { createTodoItem, updateTodoItem, getTodoItemsByEntryId, deleteTodoItem } from "@/services/todoItemService"; // Import services
import { BsCheck2Square } from "react-icons/bs"; // Icon for the slash command
import MoodSelector from "./MoodSelector";
import { getProjectsByUserId } from "@/services/projectService"; // Added for project selection

interface DiaryDetailViewProps {
  diary: JournalEntry;
  onUpdateDiary: (updatedEntry: Partial<JournalEntry>) => Promise<void>;
  onDeleteDiary: (diaryIdToDelete: string) => Promise<void>;
  userId: string;
  supabase: SupabaseClient;
}

const defaultInitialBlocks: PartialBlock[] = [
  { type: "paragraph", content: "" },
];
const defaultInitialContentString = JSON.stringify(defaultInitialBlocks);

const DiaryDetailView: React.FC<DiaryDetailViewProps> = ({
  diary,
  onUpdateDiary,
  onDeleteDiary,
  userId,
  supabase,
}) => {
  const [editableTitle, setEditableTitle] = useState(diary.title || "");
  const [currentEditorContentString, setCurrentEditorContentString] = useState<
    string | undefined
  >(undefined);
  const [initialDiaryContentString, setInitialDiaryContentString] = useState<
    string | undefined
  >(undefined);
  const [currentSelectedMood, setCurrentSelectedMood] = useState<string | undefined | null>(diary.manual_mood_label);
  const [initialMoodLabel, setInitialMoodLabel] = useState<string | undefined | null>(diary.manual_mood_label);

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(
    diary.updated_at ? new Date(diary.updated_at) : null
  );
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);

  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [initialLoadedTagIds, setInitialLoadedTagIds] = useState<string[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  const [availableProjects, setAvailableProjects] = useState<Project[]>([]); // Added state for projects
  const [selectedProjectId, setSelectedProjectId] = useState<string | null | undefined>(diary.project_id); // Added state for selected project
  const [initialProjectId, setInitialProjectId] = useState<string | null | undefined>(diary.project_id); // Added state to track initial project
  const [isLoadingProjects, setIsLoadingProjects] = useState(false); // Added loading state for projects

  const BUCKET_NAME = "media-attachments";

  const getContrastColor = (hexcolor?: string): string => {
    if (!hexcolor) return "#000000";
    hexcolor = hexcolor.replace("#", "");
    const r = parseInt(hexcolor.substring(0, 2), 16);
    const g = parseInt(hexcolor.substring(2, 4), 16);
    const b = parseInt(hexcolor.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#000000" : "#FFFFFF";
  };

  const handleFileUploadCallback = useCallback(
    async (file: File): Promise<string> => {
      if (!supabase || !userId || !diary || !diary.id) {
        console.error(
          "Supabase client, userId, or diaryId not available for file upload."
        );
        throw new Error(
          "Upload context not ready. Ensure the diary entry is loaded."
        );
      }

      const fileExtension = file.name.split(".").pop();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`; // Use UUID for unique names
      const filePath = `${userId}/${diary.id}/${uniqueFileName}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Error uploading file to Supabase Storage:", error);
        throw new Error(`Storage upload failed: ${error.message}`);
      }

      if (!data || !data.path) {
        console.error(
          "Upload successful but path is missing in response data."
        );
        throw new Error("Storage upload failed: path missing in response.");
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      if (!publicUrlData?.publicUrl) {
        console.error("Error getting public URL for uploaded file:", data.path);
        throw new Error(
          "Failed to get public URL. File uploaded but cannot be displayed."
        );
      }
      return publicUrlData.publicUrl;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supabase, userId, diary?.id, BUCKET_NAME]
  );

  const schema = BlockNoteSchema.create({
    blockSpecs: {
      // Adds all default blocks.
      ...defaultBlockSpecs,
      // Adds the Alert block.
      alert: Alert,
      // Adds the TodoItem block.
      todo: TodoItem,
    },
  });

  // Slash menu item to insert an Alert block
  const insertAlert = (editor: typeof schema.BlockNoteEditor) => ({
    title: "Alert",
    subtext: "Alert for emphasizing text",
    onItemClick: () =>
      // If the block containing the text caret is empty, `insertOrUpdateBlock`
      // changes its type to the provided block. Otherwise, it inserts the new
      // block below and moves the text caret to it. We use this function with an
      // Alert block.
      insertOrUpdateBlock(editor, {
        type: "alert",
      }),
    aliases: [
      "alert",
      "notification",
      "emphasize",
      "warning",
      "error",
      "info",
      "success",
    ],
    group: "Basic blocks",
    icon: <RiAlertFill />,
  });

  // Slash menu item to insert a TodoItem block
  const insertTodo = (editor: typeof schema.BlockNoteEditor) => ({
    title: "Todo",
    subtext: "Track a task with a checkbox.",
    onItemClick: async () => {
      if (!diary || !diary.id || !userId || !supabase) {
        console.error("Cannot create todo: missing diary context.");
        return;
      }
      try {
        const newTodo = await createTodoItem(supabase, {
          user_id: userId,
          entry_id: diary.id,
          task_description: "", // Use task_description as per your change
          is_completed: false,
          priority: 0, // Default to Low priority (numeric 0)
        });

        if (newTodo && newTodo.id) {
          insertOrUpdateBlock(editor, {
            type: "todo",
            props: { 
              checked: "false", 
              todoId: newTodo.id,
              priority: "0", // Store priority as string in block props
            },
          });
        } else {
          console.error("Failed to create todo item in database.");
          // Optionally, show a user-facing error message
        }
      } catch (error) {
        console.error("Error creating todo item:", error);
        // Optionally, show a user-facing error message
      }
    },
    aliases: [
      "todo",
      "task",
      "checklist",
      "listitem"
    ],
    group: "Basic blocks",
    icon: <BsCheck2Square />,
  });

  const editor = useCreateBlockNote({
    schema,
    uploadFile: handleFileUploadCallback,
  });

  useEffect(() => {
    const fetchTagsAndProjects = async () => {
      if (!userId || !supabase || !diary.id) return;
      
      // Fetch Tags
      setIsLoadingTags(true);
      try {
        const userTags = await getTagsByUserId(supabase, userId);
        setAvailableTags(userTags || []);
        const entryTags = await getTagsForEntry(supabase, diary.id);
        const currentEntryTagIds = entryTags.map((tag) => tag.id as string);
        setSelectedTagIds(currentEntryTagIds);
        setInitialLoadedTagIds(currentEntryTagIds);
      } catch (error) {
        console.error("Error fetching tags:", error);
      } finally {
        setIsLoadingTags(false);
      }

      // Fetch Projects
      setIsLoadingProjects(true);
      try {
        const projects = await getProjectsByUserId(supabase, userId);
        setAvailableProjects(projects || []);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setAvailableProjects([]);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    fetchTagsAndProjects();
  }, [userId, supabase, diary.id]);

  useEffect(() => {
    if (!editor || !diary) return;

    let blocksToLoad: PartialBlock[];
    let contentStrToStore: string;

    if (diary.content) {
      try {
        const parsed = JSON.parse(diary.content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          blocksToLoad = parsed;
          contentStrToStore = diary.content;
        } else if (Array.isArray(parsed) && parsed.length === 0) {
          // Handle empty array as valid empty content
          blocksToLoad = defaultInitialBlocks;
          contentStrToStore = defaultInitialContentString;
        } else {
          console.warn(
            "Diary content is not a valid BlockNote array, using default."
          );
          blocksToLoad = defaultInitialBlocks;
          contentStrToStore = defaultInitialContentString;
        }
      } catch (e) {
        console.error("Failed to parse diary content, using default:", e);
        blocksToLoad = defaultInitialBlocks;
        contentStrToStore = defaultInitialContentString;
      }
    } else {
      blocksToLoad = defaultInitialBlocks;
      contentStrToStore = defaultInitialContentString;
    }

    const currentDocString = JSON.stringify(editor.document);
    if (contentStrToStore !== currentDocString) {
      queueMicrotask(() => {
        if (editor.document) { // ensure editor document is still valid
          editor.replaceBlocks(editor.document, blocksToLoad);
        }
      });
    }

    setInitialDiaryContentString(contentStrToStore);
    setCurrentEditorContentString(contentStrToStore);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diary?.id, diary?.content, editor]);

  useEffect(() => {
    setCurrentSelectedMood(diary.manual_mood_label);
    setInitialMoodLabel(diary.manual_mood_label);
    // Sync selected project ID when diary changes
    setSelectedProjectId(diary.project_id);
    setInitialProjectId(diary.project_id);
  }, [diary.manual_mood_label, diary.id, diary.project_id]);

  const handleVideoModalCancel = () => {
    setIsVideoModalVisible(false);
    setCurrentVideoUrl(null);
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

  const extractImageUrlsFromBN = (blocks: Block[]): string[] => {
    let urls: string[] = [];
    for (const block of blocks) {
      if (block.type === "image" && typeof block.props?.url === "string") {
        urls.push(block.props.url);
      }
      if (block.children && Array.isArray(block.children)) {
        urls = urls.concat(extractImageUrlsFromBN(block.children as Block[]));
      }
    }
    return urls;
  };

  const handleSave = useCallback(
    async (
      currentTitle: string,
      currentContentString?: string,
      tagIdsForSave?: string[],
      moodToSave?: string | undefined | null,
      projectToSaveId?: string | null | undefined // Added project ID to save parameters
    ) => {
      if (!diary.id || !userId || !supabase) {
        console.error("Cannot save, diary ID or user ID is missing.");
        return;
      }

      setIsSaving(true);
      setHasUnsavedChanges(false);
      try {
        const tagsToUpdate = tagIdsForSave || selectedTagIds;

        let tagsActuallyChanged = false;
        if (tagsToUpdate.length !== initialLoadedTagIds.length) {
          tagsActuallyChanged = true;
        } else {
          const sortedSelected = [...tagsToUpdate].sort();
          const sortedInitial = [...initialLoadedTagIds].sort();
          tagsActuallyChanged = !sortedSelected.every(
            (val, index) => val === sortedInitial[index]
          );
        }

        if (tagsActuallyChanged) {
          await updateEntryTags(supabase, userId, diary.id, tagsToUpdate);
        }

        if (currentContentString && diary.id) {
          const parsedBlocks: Block<typeof schema.blockSchema>[] = JSON.parse(currentContentString);

          // Sync Todo Items
          try {
            const editorTodoBlocks = parsedBlocks.filter(block => block.type === "todo");
            const editorTodoItemIds = editorTodoBlocks.map(block => block.props.todoId).filter(id => !!id) as string[];
            
            const existingDbTodoItems = await getTodoItemsByEntryId(supabase, diary.id);
            const existingDbTodoItemIds = existingDbTodoItems.map(item => item.id as string);

            // 1. Update existing or create new todos based on editor blocks
            for (const block of editorTodoBlocks) {
              if (block.props.todoId) {
                const blockContentText = block.content && Array.isArray(block.content) ? block.content.map(c => c.type === 'text' ? c.text : '').join('') : '';
                const dbTodo = existingDbTodoItems.find(item => item.id === block.props.todoId);

                if (dbTodo) {
                  const blockIsCompleted = block.props.checked === "true";
                  const blockPriority = parseInt(block.props.priority || "0", 10); // Get priority from block, default to 0
                  
                  const updates: Partial<TodoItemType> = {};
                  let needsUpdate = false;

                  if (dbTodo.task_description !== blockContentText) {
                    updates.task_description = blockContentText;
                    needsUpdate = true;
                  }
                  if (dbTodo.is_completed !== blockIsCompleted) {
                    updates.is_completed = blockIsCompleted;
                    updates.completed_at = blockIsCompleted ? new Date().toISOString() : undefined; // Use undefined instead of null
                    needsUpdate = true;
                  }
                  if (dbTodo.priority !== blockPriority) { // Compare priority
                    updates.priority = blockPriority;
                    needsUpdate = true;
                  }

                  if (needsUpdate) {
                    await updateTodoItem(supabase, block.props.todoId as string, updates);
                  }
                } else {
                  console.warn(`Todo block with ID ${block.props.todoId} found in editor but not in DB. Skipping update.`);
                }
              }
              // If block.props.todoId is missing, it means it wasn't created properly or is a new block not yet saved.
              // The slash command should ensure todoId is set after creation.
            }

            // 2. Delete todos from DB if they are no longer in the editor
            for (const dbTodoId of existingDbTodoItemIds) {
              if (!editorTodoItemIds.includes(dbTodoId)) {
                try {
                  await deleteTodoItem(supabase, dbTodoId);
                } catch (deleteError) {
                  console.error(`Failed to delete todo item ${dbTodoId} from database:`, deleteError);
                }
              }
            }

          } catch (todoSyncError) {
            console.error("Error syncing todo items:", todoSyncError);
          }
          
          // Media Attachments Sync (existing logic)
          try {
            const currentEditorImageUrls = extractImageUrlsFromBN(parsedBlocks as unknown as Block[]);

            const existingAttachments = await getMediaAttachmentsByEntryId(
              supabase,
              diary.id
            );
            const rawBucketBasePublicUrl = getPublicUrl(
              supabase,
              BUCKET_NAME,
              ""
            );
            const bucketBasePublicUrl = rawBucketBasePublicUrl
              ? rawBucketBasePublicUrl.replace(/\/$/, "")
              : undefined;

            if (!bucketBasePublicUrl) {
              console.error(
                "Could not determine bucket base public URL. Skipping media sync."
              );
            } else {
              // 1. Delete attachments and files no longer in the editor content
              for (const attachment of existingAttachments) {
                if (!currentEditorImageUrls.includes(attachment.file_path)) {
                  try {
                    let relativePathToDelete = "";
                    if (attachment.file_path.startsWith(bucketBasePublicUrl + "/")) {
                      relativePathToDelete = attachment.file_path.substring(
                        bucketBasePublicUrl.length + 1
                      );
                    } else {
                      console.warn(`Unexpected file_path format for attachment ID ${attachment.id}: ${attachment.file_path}. Attempting direct use as path.`);
                      relativePathToDelete = attachment.file_path;
                    }
                    
                    if (relativePathToDelete) {
                        await deleteFiles(supabase, BUCKET_NAME, [
                          relativePathToDelete,
                        ]);
                    }
                    await deleteMediaAttachment(supabase, attachment.id!);
                    console.log(
                      `Deleted attachment record for ${attachment.file_path} and attempted to delete file ${relativePathToDelete}`
                    );
                  } catch (deleteError) {
                    console.error(
                      `Error deleting attachment or file for ${attachment.file_path}:`,
                      deleteError
                    );
                  }
                }
              }

              // 2. Add new attachments for images newly added to the editor
              const refreshedExistingAttachments =
                await getMediaAttachmentsByEntryId(supabase, diary.id);
              const refreshedExistingAttachmentUrls =
                refreshedExistingAttachments.map((att) => att.file_path);

              for (const imageUrl of currentEditorImageUrls) {
                if (!refreshedExistingAttachmentUrls.includes(imageUrl)) {
                  if (imageUrl.startsWith(bucketBasePublicUrl + "/")) {
                    const relativeFilePath = imageUrl.substring(
                      bucketBasePublicUrl.length + 1
                    );
                    let fileSize = -1;
                    const fileNameOriginal = relativeFilePath.substring(
                      relativeFilePath.lastIndexOf("/") + 1
                    );

                    try {
                      const response = await fetch(imageUrl, {
                        method: "HEAD",
                        cache: "no-store",
                      });
                      if (response.ok) {
                        const contentLength =
                          response.headers.get("Content-Length");
                        if (contentLength)
                          fileSize = parseInt(contentLength, 10);
                        else
                          console.warn(
                            `Content-Length header missing for ${imageUrl}`
                          );
                      } else {
                        console.warn(
                          `HEAD request failed for ${imageUrl}: ${response.status}`
                        );
                      }
                    } catch (headError) {
                      console.warn(
                        `Failed to fetch image size for ${imageUrl}:`,
                        headError
                      );
                    }

                    let mimeType = "application/octet-stream";
                    const extension = fileNameOriginal
                      .split(".")
                      .pop()
                      ?.toLowerCase();
                    if (extension) {
                      if (extension === "jpg" || extension === "jpeg")
                        mimeType = "image/jpeg";
                      else if (extension === "png") mimeType = "image/png";
                      else if (extension === "gif") mimeType = "image/gif";
                      else if (extension === "webp") mimeType = "image/webp";
                    }

                    if (fileSize === -1) {
                      console.warn(
                        `Could not determine file size for ${imageUrl}. Storing as -1.`
                      );
                    }

                    await createMediaAttachment(supabase, {
                      entry_id: diary.id,
                      user_id: userId,
                      file_path: imageUrl,
                      file_name_original: fileNameOriginal,
                      file_type: "image",
                      mime_type: mimeType,
                      file_size_bytes: fileSize,
                    });
                    console.log(`Created attachment for URL: ${imageUrl}`);
                  } else {
                    console.log(`Skipping non-Supabase storage URL: ${imageUrl}`);
                  }
                }
              }
            }
          } catch (error) {
            console.error(
              "Error processing media attachments during save:",
              error
            );
          }
        }

        const coreUpdates: Partial<JournalEntry> = {
          title: currentTitle,
          content: currentContentString || defaultInitialContentString,
          is_draft: false,
          updated_at: new Date().toISOString(),
          manual_mood_label: moodToSave === null ? undefined : moodToSave,
          project_id: projectToSaveId == null ? null : projectToSaveId, // Ensures null is sent if project is unselected
        };
        await onUpdateDiary(coreUpdates);

        setLastSaved(new Date());
        setInitialLoadedTagIds([...tagsToUpdate]);
        if (currentContentString !== undefined) {
          setInitialDiaryContentString(currentContentString);
        }
        setInitialMoodLabel(moodToSave);
        setInitialProjectId(projectToSaveId); // Update initial project ID after save
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error("Error saving diary:", error);
        setHasUnsavedChanges(true);
      } finally {
        setIsSaving(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      diary.id,
      userId,
      supabase,
      onUpdateDiary,
      initialLoadedTagIds,
      selectedTagIds,
      BUCKET_NAME,
    ]
  );

  const debouncedSave = useMemo(
    () =>
      debounce(
        (newTitle: string, newContentString?: string, newTagIds?: string[], newMood?: string | undefined | null, newProjectId?: string | null | undefined) => {
          handleSave(newTitle, newContentString, newTagIds, newMood, newProjectId);
        },
        2000
      ),
    [handleSave]
  );

  useEffect(() => {
    setEditableTitle(diary.title || "");
  }, [diary.title, diary.id]);

  useEffect(() => {
    if (
      currentEditorContentString === undefined ||
      initialDiaryContentString === undefined
    ) {
      return;
    }

    const titleChanged = editableTitle !== (diary.title || "");
    const contentChanged =
      currentEditorContentString !== initialDiaryContentString;

    const moodChanged = currentSelectedMood !== initialMoodLabel;
    const projectChanged = selectedProjectId !== initialProjectId; // Check if project changed

    let tagsHaveChangedVsSavedState = false;
    if (selectedTagIds.length !== initialLoadedTagIds.length) {
      tagsHaveChangedVsSavedState = true;
    } else {
      const sortedSelected = [...selectedTagIds].sort();
      const sortedInitial = [...initialLoadedTagIds].sort();
      tagsHaveChangedVsSavedState = !sortedSelected.every(
        (val, index) => val === sortedInitial[index]
      );
    }

    if (titleChanged || contentChanged || tagsHaveChangedVsSavedState || moodChanged || projectChanged) { // Added projectChanged to condition
      setHasUnsavedChanges(true);
      debouncedSave(editableTitle, currentEditorContentString, selectedTagIds, currentSelectedMood, selectedProjectId); // Pass selectedProjectId
    } else {
      setHasUnsavedChanges(false);
      debouncedSave.cancel();
    }

    return () => {
      debouncedSave.cancel();
    };
  }, [
    editableTitle,
    currentEditorContentString,
    selectedTagIds,
    initialDiaryContentString,
    initialLoadedTagIds,
    diary.title,
    debouncedSave,
    currentSelectedMood,
    initialMoodLabel,
    selectedProjectId, // Added selectedProjectId
    initialProjectId, // Added initialProjectId
  ]);

  const showDeleteConfirm = () => {
    setIsDeleteConfirmVisible(true);
  };

  const handleDeleteConfirmOk = async () => {
    if (!diary.id) {
      console.error("Cannot delete, diary ID is missing.");
      setIsDeleteConfirmVisible(false);
      return;
    }
    try {
      await onDeleteDiary(diary.id);
      setIsDeleteConfirmVisible(false);
    } catch (error) {
      console.error("Error deleting diary:", error);
      console.error("Failed to delete diary. Please try again.");
      setIsDeleteConfirmVisible(false);
    }
  };

  const handleDeleteConfirmCancel = () => {
    setIsDeleteConfirmVisible(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg flex flex-col">
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
                      border: `1px solid ${tag.color_hex ? getContrastColor(tag.color_hex) + "20" : "#00000020"}`,
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
                      border: `1px solid ${tag?.color_hex ? getContrastColor(tag.color_hex) + "20" : "#00000020"}`,
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
            <h3 className="text-sm font-medium text-slate-500 mb-1" style={{ fontFamily: 'Readex Pro, sans-serif' }}>Project</h3>
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
                        style={{ backgroundColor: proj.color_hex, border: '1px solid rgba(0,0,0,0.1)' }}
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
            <h3 className="text-sm font-medium text-slate-500 mb-1" style={{ fontFamily: 'Readex Pro, sans-serif' }}>How are you feeling?</h3>
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

      <div className="flex-grow p-4 md:p-6">
        {editor && (
          <BlockNoteView
            editor={editor}
            theme="light"
            onChange={() => {
              if (editor) {
                setCurrentEditorContentString(JSON.stringify(editor.document));
              }
            }}
          >
            {/* Replaces the default Formatting Toolbar */}
            <FormattingToolbarController
              formattingToolbar={() => (
                // Uses the default Formatting Toolbar.
                <FormattingToolbar
                  // Sets the items in the Block Type Select.
                  blockTypeSelectItems={[
                    // Gets the default Block Type Select items.
                    ...blockTypeSelectItems(editor.dictionary),
                    // Adds an item for the Alert block.
                    {
                      name: "Alert",
                      type: "alert",
                      icon: RiAlertFill,
                      isSelected: (block) => block.type === "alert",
                    } satisfies BlockTypeSelectItem,
                  ]}
                />
              )}
            />
            {/* Replaces the default Slash Menu. */}
            <SuggestionMenuController
              triggerCharacter={"/"}
              getItems={async (query) => {
                // Gets all default slash menu items.
                const defaultItems = getDefaultReactSlashMenuItems(editor);
                // Finds index of last item in "Basic blocks" group.
                let lastBasicBlockIndex = -1;
                for (let i = defaultItems.length - 1; i >= 0; i--) {
                  const item: DefaultReactSuggestionItem = defaultItems[i];
                  if (item.group === "Basic blocks") {
                    lastBasicBlockIndex = i;
                    break;
                  }
                }
                // Inserts the Alert item as the last item in the "Basic blocks" group.
                defaultItems.splice(
                  lastBasicBlockIndex + 1,
                  0,
                  insertAlert(editor)
                );
                // Inserts the Todo item after the Alert item.
                defaultItems.splice(
                  lastBasicBlockIndex + 2, // +2 because Alert was just added
                  0,
                  insertTodo(editor) as DefaultReactSuggestionItem // Cast to satisfy type
                );

                // Returns filtered items based on the query.
                return filterSuggestionItems(defaultItems, query);
              }}
            />
          </BlockNoteView>
        )}
      </div>

      {currentVideoUrl && (
        <AntModal
          open={isVideoModalVisible}
          title="Video Preview"
          footer={null}
          onCancel={handleVideoModalCancel}
          destroyOnClose
          centered
          width="80vw"
          styles={{ body: { padding: 0, lineHeight: 0 } }}
        >
          <video
            src={currentVideoUrl}
            controls
            autoPlay
            className="w-full h-auto max-h-[80vh] object-contain"
          />
        </AntModal>
      )}

      <AntModal
        title="Confirm Deletion"
        open={isDeleteConfirmVisible}
        onOk={handleDeleteConfirmOk}
        onCancel={handleDeleteConfirmCancel}
        okText="Delete"
        okButtonProps={{ danger: true }}
        cancelText="Cancel"
      >
        <p>
          Are you sure you want to delete this diary entry titled "{diary.title}
          "? This action cannot be undone.
        </p>
      </AntModal>
    </div>
  );
};

export default DiaryDetailView;
