import { createFileRoute } from '@tanstack/react-router';
import { useCreateBlockNote } from "@blocknote/react";
import {
  BlockNoteSchema,
  defaultBlockSpecs,
  insertOrUpdateBlock,
} from "@blocknote/core";
import { v4 as uuidv4 } from "uuid";
import { Alert } from "@/components/editor/alert/alert";
import { RiAlertFill } from "react-icons/ri";
import { en } from "@blocknote/core/locales";
import { createGroq } from "@ai-sdk/groq";
import { createAIExtension, createBlockNoteAIClient } from "@blocknote/xl-ai";
import { en as aiEn } from "@blocknote/xl-ai/locales";
import "@blocknote/xl-ai/style.css";
import DiaryEditor from '@/components/diary/detail/DiaryEditor';
import { useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase} from '@/contexts/SupabaseContext'

export const Route = createFileRoute('/journal/memory-zone/$zoneId')({
  component: MemoryZoneEditorPage,
});

function MemoryZoneEditorPage() {
  const supabase = useSupabase();
    const { zoneId } = Route.useParams();
    const {user} = useUser();
    // In a real app, you would fetch the memory zone data here based on zoneId
    const memoryZone = {
      id: zoneId,
      title: `Memory Zone #${zoneId}`,
      content: 'Start your collaborative journaling...'
    };
    const BUCKET_NAME = "media-attachments";

    const handleFileUploadCallback = useCallback(
      async (file: File): Promise<string> => {
        if (!supabase || !user || !memoryZone || !memoryZone.id) {
          console.error(
            "Supabase client, userId, or diaryId not available for file upload."
          );
          throw new Error(
            "Upload context not ready. Ensure the diary entry is loaded."
          );
        }
  
        const fileExtension = file.name.split(".").pop();
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;
        const filePath = `${user.id}/${memoryZone.id}/${uniqueFileName}`;
  
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
      [supabase, user, memoryZone?.id, BUCKET_NAME]
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
    
    const editor = useCreateBlockNote({
      schema,
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


  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      <header className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{memoryZone.title}</h1>
      </header>
      <main className="flex-grow">
        <DiaryEditor 
          editor={editor}
          setCurrentEditorContentString={() => {}}
          insertAlert={insertAlert}
          insertTodo={() => {}}
        />
      </main>
    </div>
  );
} 