import React, { useState, useMemo, useEffect, useCallback } from "react";
import { JournalEntry, Tag, Project } from "@/types/supabase";
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
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { codeBlock } from "@blocknote/code-block";
import {
  PartialBlock,
  Block,
  BlockNoteSchema,
  defaultBlockSpecs,
  insertOrUpdateBlock,
} from "@blocknote/core";
import { v4 as uuidv4 } from "uuid";
import { Alert } from "../editor/alert/alert";
import { RiAlertFill } from "react-icons/ri";
import { TodoItem } from "../editor/todo/todoItem";
import {
  createTodoItem,
  updateTodoItem,
  getTodoItemsByEntryId,
  deleteTodoItem,
} from "@/services/todoItemService";
import { BsCheck2Square } from "react-icons/bs";
import { getProjectsByUserId } from "@/services/projectService";
import { en } from "@blocknote/core/locales";
import { createGroq } from "@ai-sdk/groq";
import { createAIExtension, createBlockNoteAIClient } from "@blocknote/xl-ai";
import { en as aiEn } from "@blocknote/xl-ai/locales";
import "@blocknote/xl-ai/style.css";
import DiaryHeader from "./detail/DiaryHeader";
import DiaryEditor from "./detail/DiaryEditor";
import DiaryModals from "./detail/DiaryModals";
import { generateJournalImage } from "@/services/imageGenerationService";
import { createFacebookShare } from "@/services/facebookShareService";

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
  const [currentSelectedMood, setCurrentSelectedMood] = useState<
    string | undefined | null
  >(diary.manual_mood_label);
  const [initialMoodLabel, setInitialMoodLabel] = useState<
    string | undefined | null
  >(diary.manual_mood_label);

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(
    diary.updated_at ? new Date(diary.updated_at) : null
  );
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [isShareConfirmVisible, setIsShareConfirmVisible] = useState(false);
  const [sharePreviewImageUri, setSharePreviewImageUri] = useState<
    string | null
  >(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);

  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [initialLoadedTagIds, setInitialLoadedTagIds] = useState<string[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<
    string | null | undefined
  >(diary.project_id);
  const [initialProjectId, setInitialProjectId] = useState<
    string | null | undefined
  >(diary.project_id);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  const BUCKET_NAME = "media-attachments";
  const SHARE_IMAGE_BUCKET_NAME = "shared-previews";

  const dataURItoFile = (dataURI: string, fileName: string): File => {
    const byteString = atob(dataURI.split(",")[1]);
    const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    return new File([blob], fileName, { type: mimeString });
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
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
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

  const client = createBlockNoteAIClient({
    apiKey: "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",
    baseURL: "https://api.groq.com/openai/v1/chat/completions",
  });

  const model = createGroq({
    ...client.getProviderSettings("groq"),
  })("llama-3.3-70b-versatile");

  const schema = BlockNoteSchema.create({
    blockSpecs: {
      ...defaultBlockSpecs,
      alert: Alert,
      todo: TodoItem,
    },
  });

  const insertAlert = (editor: typeof schema.BlockNoteEditor) => ({
    title: "Alert",
    subtext: "Alert for emphasizing text",
    onItemClick: () =>
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
          task_description: "",
          is_completed: false,
          priority: 0,
        });

        if (newTodo && newTodo.id) {
          insertOrUpdateBlock(editor, {
            type: "todo",
            props: {
              checked: "false",
              todoId: newTodo.id,
              priority: "0",
            },
          });
        } else {
          console.error("Failed to create todo item in database.");
        }
      } catch (error) {
        console.error("Error creating todo item:", error);
      }
    },
    aliases: ["todo", "task", "checklist", "listitem"],
    group: "Basic blocks",
    icon: <BsCheck2Square />,
  });
  
  const editor = useCreateBlockNote({
    schema,
    codeBlock,
    dictionary: {
      ...en,
      ai: aiEn,
    },
    extensions: [
      createAIExtension({
        model: model,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    ],
    uploadFile: handleFileUploadCallback,
  });

  useEffect(() => {
    const fetchTagsAndProjects = async () => {
      if (!userId || !supabase || !diary.id) return;

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
        if (editor.document) {
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
    setSelectedProjectId(diary.project_id);
    setInitialProjectId(diary.project_id);
  }, [diary.manual_mood_label, diary.id, diary.project_id]);

  const handleVideoModalCancel = () => {
    setIsVideoModalVisible(false);
    setCurrentVideoUrl(null);
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
      projectToSaveId?: string | null | undefined
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
          const parsedBlocks: Block<typeof schema.blockSchema>[] =
            JSON.parse(currentContentString);

          try {
            const editorTodoBlocks = parsedBlocks.filter(
              (block) => block.type === "todo"
            );
            const editorTodoItemIds = editorTodoBlocks
              .map((block) => block.props.todoId)
              .filter((id) => !!id) as string[];

            const existingDbTodoItems = await getTodoItemsByEntryId(
              supabase,
              diary.id
            );
            const existingDbTodoItemIds = existingDbTodoItems.map(
              (item) => item.id as string
            );

            for (const block of editorTodoBlocks) {
              if (block.props.todoId) {
                const blockContentText =
                  block.content && Array.isArray(block.content)
                    ? block.content
                        .map((c) => (c.type === "text" ? c.text : ""))
                        .join("")
                    : "";
                const dbTodo = existingDbTodoItems.find(
                  (item) => item.id === block.props.todoId
                );

                if (dbTodo) {
                  const blockIsCompleted = block.props.checked === "true";
                  const blockPriority = parseInt(
                    block.props.priority || "0",
                    10
                  );

                  const updates: Partial<TodoItemType> = {};
                  let needsUpdate = false;

                  if (dbTodo.task_description !== blockContentText) {
                    updates.task_description = blockContentText;
                    needsUpdate = true;
                  }
                  if (dbTodo.is_completed !== blockIsCompleted) {
                    updates.is_completed = blockIsCompleted;
                    updates.completed_at = blockIsCompleted
                      ? new Date().toISOString()
                      : undefined;
                    needsUpdate = true;
                  }
                  if (dbTodo.priority !== blockPriority) {
                    updates.priority = blockPriority;
                    needsUpdate = true;
                  }

                  if (needsUpdate) {
                    await updateTodoItem(
                      supabase,
                      block.props.todoId as string,
                      updates
                    );
                  }
                } else {
                  console.warn(
                    `Todo block with ID ${block.props.todoId} found in editor but not in DB. Skipping update.`
                  );
                }
              }
            }

            for (const dbTodoId of existingDbTodoItemIds) {
              if (!editorTodoItemIds.includes(dbTodoId)) {
                try {
                  await deleteTodoItem(supabase, dbTodoId);
                } catch (deleteError) {
                  console.error(
                    `Failed to delete todo item ${dbTodoId} from database:`,
                    deleteError
                  );
                }
              }
            }
          } catch (todoSyncError) {
            console.error("Error syncing todo items:", todoSyncError);
          }

          try {
            const currentEditorImageUrls = extractImageUrlsFromBN(
              parsedBlocks as unknown as Block[]
            );

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
              for (const attachment of existingAttachments) {
                if (
                  !currentEditorImageUrls.includes(attachment.file_url_cached)
                ) {
                  try {
                    const relativePathToDelete = attachment.file_path;

                    console.log(
                      `Attempting to delete attachment. DB ID: ${attachment.id}, Storage Path: ${relativePathToDelete}`
                    );

                    if (relativePathToDelete) {
                      const success = await deleteFiles(supabase, BUCKET_NAME, [
                        relativePathToDelete,
                      ]);
                      if (success) {
                        console.log(
                          `Successfully deleted file from storage: ${relativePathToDelete}`
                        );
                      } else {
                        console.warn(
                          `Storage deletion call returned false for path: ${relativePathToDelete}. The file may have already been deleted.`
                        );
                      }
                    }
                    await deleteMediaAttachment(supabase, attachment.id!);
                    console.log(
                      `Deleted attachment record from database for path: ${attachment.file_url_cached}`
                    );
                  } catch (deleteError) {
                    console.error(
                      `Error deleting attachment or file for ${attachment.file_url_cached}:`,
                      deleteError
                    );
                  }
                }
              }

              const refreshedExistingAttachments =
                await getMediaAttachmentsByEntryId(supabase, diary.id);
              const refreshedExistingAttachmentUrls =
                refreshedExistingAttachments.map((att) => att.file_url_cached);

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
                      file_path: relativeFilePath,
                      file_url_cached: imageUrl,
                      file_name_original: fileNameOriginal,
                      file_type: "image",
                      mime_type: mimeType,
                      file_size_bytes: fileSize,
                    });
                    console.log(`Created attachment for URL: ${imageUrl}`);
                  } else {
                    console.log(
                      `Skipping non-Supabase storage URL: ${imageUrl}`
                    );
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
          project_id: projectToSaveId == null ? null : projectToSaveId,
        };
        await onUpdateDiary(coreUpdates);

        setLastSaved(new Date());
        setInitialLoadedTagIds([...tagsToUpdate]);
        if (currentContentString !== undefined) {
          setInitialDiaryContentString(currentContentString);
        }
        setInitialMoodLabel(moodToSave);
        setInitialProjectId(projectToSaveId);
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
        (
          newTitle: string,
          newContentString?: string,
          newTagIds?: string[],
          newMood?: string | undefined | null,
          newProjectId?: string | null | undefined
        ) => {
          handleSave(
            newTitle,
            newContentString,
            newTagIds,
            newMood,
            newProjectId
          );
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
    const projectChanged = selectedProjectId !== initialProjectId;

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

    if (
      titleChanged ||
      contentChanged ||
      tagsHaveChangedVsSavedState ||
      moodChanged ||
      projectChanged
    ) {
      setHasUnsavedChanges(true);
      debouncedSave(
        editableTitle,
        currentEditorContentString,
        selectedTagIds,
        currentSelectedMood,
        selectedProjectId
      );
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
    selectedProjectId,
    initialProjectId,
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

  const showShareConfirm = async () => {
    setIsSharing(true);
    setShareError(null);
    try {
      const tagsForImage = availableTags.filter((tag) =>
        selectedTagIds.includes(tag.id!)
      );
      const imageDataUri = await generateJournalImage(diary, tagsForImage);
      setSharePreviewImageUri(imageDataUri);
      setIsShareConfirmVisible(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setShareError(
        message || "An unexpected error occurred while generating the preview."
      );
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareConfirmCancel = () => {
    setIsShareConfirmVisible(false);
    setSharePreviewImageUri(null);
  };

  const handleShareConfirmOk = async () => {
    if (!diary.id || !userId || !supabase || !sharePreviewImageUri) {
      console.error("Cannot generate share, missing context or preview image.");
      setShareError(
        "An unexpected error occurred. Missing context or preview image."
      );
      return;
    }

    setIsSharing(true);
    setShareError(null);
    setIsShareConfirmVisible(false);

    try {
      // Image already generated, now upload
      const imageFile = dataURItoFile(
        sharePreviewImageUri,
        `share-image-${diary.id}.png`
      );

      const uniqueFileName = `${uuidv4()}.png`;
      const filePath = `${userId}/${diary.id}/${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage
        .from(SHARE_IMAGE_BUCKET_NAME)
        .upload(filePath, imageFile, {
          contentType: "image/png",
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error("Failed to upload share image.");
      }

      const imageUrl = getPublicUrl(
        supabase,
        SHARE_IMAGE_BUCKET_NAME,
        filePath
      );
      if (!imageUrl) {
        throw new Error("Failed to get public URL for share image.");
      }

      // Create Facebook share record
      await createFacebookShare(supabase, {
        user_id: userId,
        journal_entry_id: diary.id,
        preview_image_path: filePath,
        preview_image_url_cached: imageUrl,
      });

      // Open Facebook Share Dialog with the direct image URL
      const tagNames = availableTags
        .filter((t) => selectedTagIds.includes(t.id!))
        .map((t) => `#${t.name}`)
        .join(" ");
      const quote = `Check out my journal! ${tagNames}`;
      const hashtag = encodeURIComponent("#BeanJournal");
      const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        imageUrl
      )}&quote=${encodeURIComponent(quote)}&hashtag=${hashtag}`;
      window.open(facebookShareUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setShareError(message || "An unexpected error occurred during sharing.");
    } finally {
      setIsSharing(false);
      setSharePreviewImageUri(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg flex flex-col">
      <DiaryHeader
        diary={diary}
        editableTitle={editableTitle}
        setEditableTitle={setEditableTitle}
        selectedTagIds={selectedTagIds}
        setSelectedTagIds={setSelectedTagIds}
        availableTags={availableTags}
        isLoadingTags={isLoadingTags}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        availableProjects={availableProjects}
        isLoadingProjects={isLoadingProjects}
        currentSelectedMood={currentSelectedMood}
        setCurrentSelectedMood={setCurrentSelectedMood}
        lastSaved={lastSaved}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        showDeleteConfirm={showDeleteConfirm}
        onShareToFacebook={showShareConfirm}
        isSharing={isSharing}
      />

      {shareError && (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mx-4 my-2"
          role="alert"
        >
          <p className="font-bold">Sharing Error</p>
          <p>{shareError}</p>
        </div>
      )}

      <DiaryEditor
        editor={editor}
        setCurrentEditorContentString={setCurrentEditorContentString}
        insertAlert={insertAlert}
        insertTodo={insertTodo}
      />

      <DiaryModals
        isDeleteConfirmVisible={isDeleteConfirmVisible}
        handleDeleteConfirmOk={handleDeleteConfirmOk}
        handleDeleteConfirmCancel={handleDeleteConfirmCancel}
        diaryTitle={diary.title || ""}
        isVideoModalVisible={isVideoModalVisible}
        currentVideoUrl={currentVideoUrl}
        handleVideoModalCancel={handleVideoModalCancel}
        isShareConfirmVisible={isShareConfirmVisible}
        handleShareConfirmOk={handleShareConfirmOk}
        handleShareConfirmCancel={handleShareConfirmCancel}
        sharePreviewImageUri={sharePreviewImageUri}
      />
    </div>
  );
};

export default DiaryDetailView;