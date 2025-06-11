import React from "react";
import { BlockNoteView } from "@blocknote/mantine";
import {
  FormattingToolbarController,
  FormattingToolbar,
  blockTypeSelectItems,
  BlockTypeSelectItem,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
  DefaultReactSuggestionItem,
  CreateLinkButton,
  UnnestBlockButton,
  NestBlockButton,
  TextAlignButton,
  ColorStyleButton,
  FileCaptionButton,
  FileReplaceButton,
  BasicTextStyleButton,
  BlockTypeSelect,
} from "@blocknote/react";
import {
  getAISlashMenuItems,
  AIMenuController,
  AIToolbarButton,
} from "@blocknote/xl-ai";
import { RiAlertFill } from "react-icons/ri";
import { filterSuggestionItems } from "@blocknote/core";
import { BlockNoteEditor } from "@blocknote/core";

interface DiaryEditorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor: BlockNoteEditor<any>; // Consider using a more specific schema type if available
  setCurrentEditorContentString: (content: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  insertAlert: (editor: BlockNoteEditor<any>) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  insertTodo: (editor: BlockNoteEditor<any>) => any;
}

const DiaryEditor: React.FC<DiaryEditorProps> = ({
  editor,
  setCurrentEditorContentString,
  insertAlert,
  insertTodo,
}) => {
  return (
    <div className="flex-grow p-4 md:p-6 flex flex-col">
      {editor && (
        <BlockNoteView
          editor={editor}
          theme="light"
          onChange={() => {
            if (editor) {
              setCurrentEditorContentString(JSON.stringify(editor.document));
            }
          }}
          formattingToolbar={false}
        >
          <AIMenuController />
          <FormattingToolbarController
            formattingToolbar={(props) => (
              <FormattingToolbar
                {...props}
                blockTypeSelectItems={[
                  ...blockTypeSelectItems(editor.dictionary),
                  {
                    name: "Alert",
                    type: "alert",
                    icon: RiAlertFill,
                    isSelected: (block) => block.type === "alert",
                  } satisfies BlockTypeSelectItem,
                ]}
              >
                <BlockTypeSelect key={"blockTypeSelect"} />

                <FileCaptionButton key={"fileCaptionButton"} />
                <FileReplaceButton key={"replaceFileButton"} />

                <BasicTextStyleButton
                  basicTextStyle={"bold"}
                  key={"boldStyleButton"}
                />
                <BasicTextStyleButton
                  basicTextStyle={"italic"}
                  key={"italicStyleButton"}
                />
                <BasicTextStyleButton
                  basicTextStyle={"underline"}
                  key={"underlineStyleButton"}
                />
                <BasicTextStyleButton
                  basicTextStyle={"strike"}
                  key={"strikeStyleButton"}
                />
                {/* Extra button to toggle code styles */}
                <BasicTextStyleButton
                  key={"codeStyleButton"}
                  basicTextStyle={"code"}
                />

                <TextAlignButton
                  textAlignment={"left"}
                  key={"textAlignLeftButton"}
                />
                <TextAlignButton
                  textAlignment={"center"}
                  key={"textAlignCenterButton"}
                />
                <TextAlignButton
                  textAlignment={"right"}
                  key={"textAlignRightButton"}
                />

                <ColorStyleButton key={"colorStyleButton"} />

                <NestBlockButton key={"nestBlockButton"} />
                <UnnestBlockButton key={"unnestBlockButton"} />

                <CreateLinkButton key={"createLinkButton"} />
                <AIToolbarButton />
              </FormattingToolbar>
            )}
          />
          <SuggestionMenuController
            triggerCharacter={"/"}
            getItems={async (query) => {
              const defaultItems = getDefaultReactSlashMenuItems(editor);
              const aiItems = getAISlashMenuItems(editor);
              let lastBasicBlockIndex = -1;
              for (let i = defaultItems.length - 1; i >= 0; i--) {
                const item: DefaultReactSuggestionItem = defaultItems[i];
                if (item.group === "Basic blocks") {
                  lastBasicBlockIndex = i;
                  break;
                }
              }
              defaultItems.splice(
                lastBasicBlockIndex + 1,
                0,
                insertAlert(editor)
              );
              defaultItems.splice(
                lastBasicBlockIndex + 2,
                0,
                insertTodo(editor) as DefaultReactSuggestionItem
              );
              return filterSuggestionItems(
                [...defaultItems, ...aiItems],
                query
              );
            }}
          />
        </BlockNoteView>
      )}
    </div>
  );
};

export default DiaryEditor;
