import satori from "satori";
import { html } from "satori-html";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import JournalPreview from "../components/satori/JournalPreview";
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

    // Render React component to an HTML string
    const templateAsString = renderToStaticMarkup(
      React.createElement(JournalPreview, { entry, tags })
    );

    // Convert the string to a template that satori-html can process
    const template = html(templateAsString);

    // Generate SVG with satori
    const svg = await satori(template as React.ReactNode, {
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
