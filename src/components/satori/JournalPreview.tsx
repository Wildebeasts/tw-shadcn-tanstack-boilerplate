import React from "react";
import { JournalEntry, Tag as SupabaseTag } from "@/types/supabase";

// --- Type definitions for parsing BlockNote content ---
type InlineStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
};

type InlineContent = {
  type: "text";
  text: string;
  styles: InlineStyle;
  content?: string | InlineContent[];
};

type Block = {
  type:
    | "heading"
    | "paragraph"
    | "image"
    | "bulletListItem"
    | "numberedListItem"
    | "todo"
    | "alert"
    | "table"
    | "tableRow"
    | "tableCell"
    | "quote";
  props: {
    level?: "1" | "2" | "3";
    url?: string;
    checked?: "true" | "false";
    type?: "warning" | "error" | "info" | "success"; // for alert
  };
  content: InlineContent[] | { type: "tableContent"; rows: Block[] }; // Table content is different
  children: Block[];
};

type GroupedBlock = Block | { type: 'bulletList' | 'numberedList'; items: Block[] };

// Helper to fetch image and convert to Data URI
const toDataURL = async (url: string): Promise<string | null> => {
  if (!url) {
    console.log("toDataURL was called with an empty URL. Skipping fetch.");
    return null;
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.statusText}`);
      return null;
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`Failed to fetch and process image from ${url}:`, error);
    return null;
  }
};

// Updated async function to extract content and embed the image
// eslint-disable-next-line react-refresh/only-export-components
export const extractFirstImageAndContent = async (content: string): Promise<{ imageUrl: string | null; remainingBlocks: Block[] }> => {
  if (!content) {
    return { imageUrl: null, remainingBlocks: [] };
  }
  try {
    const parsedBlocks: Block[] = JSON.parse(content);
    if (!Array.isArray(parsedBlocks)) {
      return { imageUrl: null, remainingBlocks: [] };
    }

    let imageUrl: string | null = null;
    const remainingBlocks: Block[] = [];
    let imageFound = false;

    for (const block of parsedBlocks) {
      if (!imageFound && block.type === 'image' && block.props.url) {
        imageUrl = await toDataURL(block.props.url); // Embed image
        imageFound = true; 
      } else {
        remainingBlocks.push(block);
      }
    }
    return { imageUrl, remainingBlocks };
  } catch (e) {
    console.error("Failed to parse journal content:", e);
    return { imageUrl: null, remainingBlocks: [] };
  }
};

// --- Helper function to render inline content (bold, italic, etc.) ---
const renderInlineContent = (
  content?: (string | InlineContent)[]
): (string | JSX.Element)[] => {
  if (!Array.isArray(content)) {
    return [];
  }

  return content
    .map((item, index) => {
      if (typeof item === "string") {
        return item;
      }

      if (item && typeof item === "object" && "text" in item) {
        let element: React.ReactNode = item.text;

        if (item.styles.bold) {
          element = <b>{element}</b>;
        }
        if (item.styles.italic) {
          element = <i>{element}</i>;
        }
        if (item.styles.underline) {
          element = <u>{element}</u>;
        }
        if (item.styles.strikethrough) {
          element = <s>{element}</s>;
        }

        return <span key={index}>{element}</span>;
      }

      return null;
    })
    .filter(Boolean) as (string | JSX.Element)[];
};

// --- Main component to render a single block ---
const renderBlock = (block: GroupedBlock, index: number): React.ReactNode => {
  if (!block) return null;
  const blockAsBlock = block as Block;

  switch (block.type) {
    case "heading": {
      const level = blockAsBlock.props.level || "2";
      const content = renderInlineContent(
        blockAsBlock.content as InlineContent[]
      );

      if (level === "1") {
        return (
          <h1
            key={index}
            style={{ fontSize: "48px", color: "#2c3e50", marginBottom: "16px" }}
          >
            {content}
          </h1>
        );
      }
      if (level === "3") {
        return (
          <h3
            key={index}
            style={{ fontSize: "28px", color: "#34495e", marginBottom: "12px" }}
          >
            {content}
          </h3>
        );
      }
      return (
        <h2
          key={index}
          style={{ fontSize: "30px", color: "#34495e", marginBottom: "14px" }}
        >
          {content}
        </h2>
      );
    }
    case "paragraph":
      return (
        <p
          key={index}
          style={{
            fontSize: "20px",
            lineHeight: 1.6,
            color: "#2c3e50",
            margin: "0 0 16px",
          }}
        >
          {renderInlineContent(blockAsBlock.content as InlineContent[])}
        </p>
      );
    case "image":
      return (
        <div
          key={index}
          style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}
        >
          <img
            src={blockAsBlock.props.url}
            alt="Journal Image"
            style={{
              maxWidth: "100%",
              maxHeight: "300px",
              borderRadius: "8px",
            }}
          />
        </div>
      );
    case "bulletList":
      return (
        <ul key={index} style={{ margin: '0 0 16px 20px', padding: 0 }}>
            {(block as { items: Block[] }).items.map((item, itemIndex) => renderBlock(item, itemIndex))}
        </ul>
      );
    case "numberedList":
        return (
            <ol key={index} style={{ margin: '0 0 16px 20px', padding: 0 }}>
                {(block as { items: Block[] }).items.map((item, itemIndex) => renderBlock(item, itemIndex))}
            </ol>
        );
    case "bulletListItem":
      return (
        <li
          key={index}
          style={{
            fontSize: "20px",
            lineHeight: 1.6,
            color: "#34495e",
            marginBottom: "8px",
          }}
        >
          {renderInlineContent(blockAsBlock.content as InlineContent[])}
        </li>
      );
    case "numberedListItem":
      return (
        <li
          key={index}
          style={{
            fontSize: "20px",
            lineHeight: 1.6,
            color: "#34495e",
            marginBottom: "8px",
          }}
        >
          {renderInlineContent(blockAsBlock.content as InlineContent[])}
        </li>
      );
    case "todo":
      return (
        <div
          key={index}
          style={{ display: "flex", alignItems: "center", margin: "8px 0" }}
        >
          <span style={{ fontSize: "24px", marginRight: "12px" }}>
            {blockAsBlock.props.checked === "true" ? "✅" : "🔲"}
          </span>
          <span
            style={{
              fontSize: "22px",
              color: blockAsBlock.props.checked === "true" ? "#7f8c8d" : "#2c3e50",
              textDecoration:
                blockAsBlock.props.checked === "true" ? "line-through" : "none",
            }}
          >
            {renderInlineContent(blockAsBlock.content as InlineContent[])}
          </span>
        </div>
      );
    case "alert": {
      const alertStyles = {
        warning: {
          backgroundColor: "rgba(243, 156, 18, 0.1)",
          borderColor: "#f39c12",
        },
        error: {
          backgroundColor: "rgba(231, 76, 60, 0.1)",
          borderColor: "#e74c3c",
        },
        info: {
          backgroundColor: "rgba(52, 152, 219, 0.1)",
          borderColor: "#3498db",
        },
        success: {
          backgroundColor: "rgba(46, 204, 113, 0.1)",
          borderColor: "#2ecc71",
        },
      };
      const style = alertStyles[blockAsBlock.props.type || "info"];
      return (
        <div
          key={index}
          style={{
            padding: "20px",
            margin: "16px 0",
            borderRadius: "8px",
            borderLeft: `5px solid ${style.borderColor}`,
            backgroundColor: style.backgroundColor,
            color: "#2c3e50",
          }}
        >
          {renderInlineContent(blockAsBlock.content as InlineContent[])}
        </div>
      );
    }
    case "table": {
      const tableContent = blockAsBlock.content as {
        type: "tableContent";
        rows: Block[];
      };
      return (
        <div
          key={index}
          style={{
            display: "table",
            width: "100%",
            borderCollapse: "collapse",
            margin: "16px 0",
          }}
        >
          {tableContent.rows.map((row, rowIndex) =>
            renderBlock(row, rowIndex)
          )}
        </div>
      );
    }
    case "tableRow":
      return (
        <div key={index} style={{ display: "table-row" }}>
          {blockAsBlock.children.map((cell, cellIndex) =>
            renderBlock(cell, cellIndex)
          )}
        </div>
      );
    case "tableCell":
      return (
        <div
          key={index}
          style={{
            display: "table-cell",
            border: "1px solid #bdc3c7",
            padding: "12px",
            verticalAlign: "top",
          }}
        >
          {renderInlineContent(blockAsBlock.content as InlineContent[])}
        </div>
      );
    case "quote":
      return (
        <blockquote
          key={index}
          style={{
            margin: "16px 0",
            padding: "10px 20px",
            borderLeft: "4px solid #3498db",
            backgroundColor: "rgba(52, 152, 219, 0.05)",
            color: "#2c3e50",
            fontStyle: "italic",
          }}
        >
          {renderInlineContent(blockAsBlock.content as InlineContent[])}
        </blockquote>
      );
    default: {
      // Fallback for unknown block types
      const contentText =
        blockAsBlock.content && Array.isArray(blockAsBlock.content)
          ? (blockAsBlock.content as InlineContent[])
              .map((c) => (c as { text?: string }).text || "")
              .join("")
          : "";
      if (contentText.trim()) {
        return (
          <p key={index} style={{ margin: "12px 0", whiteSpace: "pre-wrap" }}>
            {`Unsupported Block: ${contentText}`}
          </p>
        );
      }
      return null;
    }
  }
};

interface JournalPreviewProps {
  entry: JournalEntry;
  tags: SupabaseTag[];
  imageUrl: string | null;
  remainingBlocks: Block[];
}

const hexToRgba = (hex: string, alpha: number): string => {
    if (!hex || !hex.startsWith('#') || hex.length !== 7) {
        return `rgba(108, 117, 125, ${alpha})`;
    }
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const JournalPreview: React.FC<JournalPreviewProps> = ({ entry, tags, imageUrl, remainingBlocks }) => {
  const createdAt = entry.created_at || new Date().toISOString();
  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "1200px",
        height: "630px",
        padding: "40px",
        backgroundColor: "#F0F5F5",
        fontFamily: '"Inter", sans-serif',
        border: "1px solid #e0e0e0",
        borderRadius: "16px",
        position: "relative",
        gap: "32px"
    }}>
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Journal"
          style={{
            width: "300px",
            height: "100%",
            borderRadius: "12px",
            objectFit: "cover",
          }}
        />
      )}
      
      <div style={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: "hidden" }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: "space-between" }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ fontSize: "42px", fontWeight: 700, color: "#212529", margin: "0 0 16px", lineHeight: 1.2 }}>
              {entry.title}
            </h1>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: '280px', color: "#555" }}>
              {renderContent(remainingBlocks)}
            </div>
          </div>
          
          {tags && tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#5f6368"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M21.41 11.59l-9-9C12.05 2.24 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.24 1.05.59 1.41l9 9c.36.36.86.59 1.41.59s1.05-.23 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.05-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>
              {tags.map(tag => (
                <span key={tag.id} style={{
                    padding: "6px 16px",
                    borderRadius: "8px",
                    fontSize: "18px",
                    fontWeight: 500,
                    backgroundColor: hexToRgba(tag.color_hex || '', 0.2),
                    color: tag.color_hex || '#495057',
                }}>
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', marginLeft: "24px", minWidth: '150px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 0 24 24" width="28px" fill="#5f6368"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
                <svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 0 24 24" width="28px" fill="#5f6368"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M14.06 9.02l.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z"/></svg>
                <svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 0 24 24" width="28px" fill="#5f6368"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </div>
            
            {entry.manual_mood_label && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#a5d6a7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                    {entry.manual_mood_label.toLowerCase().includes('amazing') ? '😄' :
                     entry.manual_mood_label.toLowerCase().includes('happy') ? '😊' :
                     entry.manual_mood_label.toLowerCase().includes('neutral') ? '😐' :
                     entry.manual_mood_label.toLowerCase().includes('sad') ? '😢' :
                    '😠'}
                  </div>
                  <span style={{ fontSize: '18px', color: '#495057', textTransform: "capitalize" }}>{entry.manual_mood_label}</span>
                </div>
              )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#5f6368"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z"/></svg>
                <span style={{ fontSize: '18px', color: '#495057' }}>{formattedDate}</span>
            </div>
        </div>
      </div>
      
      <div style={{
          position: 'absolute',
          top: '20px',
          right: '40px',
          fontSize: '14px',
          fontWeight: '600',
          color: '#adb5bd',
      }}>
          Powered by BeanJournal
      </div>
    </div>
  );
};

// Helper function to parse content and render blocks
const renderContent = (content: Block[]) => {
  // Group consecutive list items
  const groupedBlocks: GroupedBlock[] = [];
  let currentList: { type: "bulletList" | "numberedList"; items: Block[] } | null =
    null;

  for (const block of content) {
    const isBulleted = block.type === "bulletListItem";
    const isNumbered = block.type === "numberedListItem";
    const listType = isBulleted ? "bulletList" : "numberedList";

    if (isBulleted || isNumbered) {
      if (currentList && currentList.type === listType) {
        currentList.items.push(block);
      } else {
        if (currentList) {
          groupedBlocks.push(currentList);
        }
        currentList = { type: listType, items: [block] };
      }
    } else {
      if (currentList) {
        groupedBlocks.push(currentList);
        currentList = null;
      }
      groupedBlocks.push(block);
    }
  }
  if (currentList) {
    groupedBlocks.push(currentList);
  }

  return groupedBlocks.map((block, index) => renderBlock(block, index));
};

export default JournalPreview; 