import satori from "satori";
import React from "react";
import JournalPreview, { extractFirstImageAndContent } from "../components/satori/JournalPreview";
import { JournalEntry, Tag } from "@/types/supabase";

// Function to fetch and embed font data
const getFontData = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch font: ${response.statusText}`);
  }
  return response.arrayBuffer();
};

export const generateJournalImage = async (
  entry: JournalEntry,
  tags: Tag[]
): Promise<string> => {
  try {
    // Fetch fonts
    const interRegular = await getFontData(
      "https://cdn.jsdelivr.net/npm/@fontsource/inter/files/inter-latin-400-normal.woff"
    );
    const interBold = await getFontData(
      "https://cdn.jsdelivr.net/npm/@fontsource/inter/files/inter-latin-700-normal.woff"
    );

    // 1. Fetch dynamic data before rendering
    const { imageUrl, remainingBlocks } = await extractFirstImageAndContent(
      entry.content || "[]"
    );

    // 2. Create the component instance with all required props
    const template = React.createElement(JournalPreview, {
      entry,
      tags,
      imageUrl,
      remainingBlocks,
    });

    // 3. Generate SVG directly from the React element
    const svg = await satori(template, {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: interRegular,
          weight: 400,
          style: "normal",
        },
        {
          name: "Inter",
          data: interBold,
          weight: 700,
          style: "normal",
        },
      ],
    });

    // Convert SVG to a data URI
    const dataUri = `data:image/svg+xml;base64,${btoa(svg)}`;
    return dataUri;
  } catch (error) {
    console.error("Error generating journal image:", error);
    throw new Error("Failed to generate image.");
  }
};
