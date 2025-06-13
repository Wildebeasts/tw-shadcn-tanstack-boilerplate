import React from "react";
import { Modal as AntModal } from "antd";

interface DiaryModalsProps {
  isDeleteConfirmVisible: boolean;
  handleDeleteConfirmOk: () => void;
  handleDeleteConfirmCancel: () => void;
  diaryTitle: string;
  isVideoModalVisible: boolean;
  currentVideoUrl: string | null;
  handleVideoModalCancel: () => void;
  isShareConfirmVisible: boolean;
  handleShareConfirmOk: () => void;
  handleShareConfirmCancel: () => void;
  sharePreviewImageUri: string | null;
}

const DiaryModals: React.FC<DiaryModalsProps> = ({
  isDeleteConfirmVisible,
  handleDeleteConfirmOk,
  handleDeleteConfirmCancel,
  diaryTitle,
  isVideoModalVisible,
  currentVideoUrl,
  handleVideoModalCancel,
  isShareConfirmVisible,
  handleShareConfirmOk,
  handleShareConfirmCancel,
  sharePreviewImageUri,
}) => {
  return (
    <>
      {currentVideoUrl && (
        <AntModal
          open={isVideoModalVisible}
          title="Video Preview"
          footer={null}
          onCancel={handleVideoModalCancel}
          destroyOnClose={false}
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
          Are you sure you want to delete this diary entry titled "{diaryTitle}"?
          This action cannot be undone.
        </p>
      </AntModal>

      <AntModal
        title="Confirm Share to Facebook"
        open={isShareConfirmVisible}
        onOk={handleShareConfirmOk}
        onCancel={handleShareConfirmCancel}
        okText="Share"
        cancelText="Cancel"
        width={600}
      >
        <div className="space-y-4">
          <p>
            You are about to share a preview of this journal entry to your
            Facebook timeline. Does this look right?
          </p>
          {sharePreviewImageUri && (
            <div className="border rounded-lg p-2 bg-gray-50">
              <img
                src={sharePreviewImageUri}
                alt="Journal entry share preview"
                className="w-full h-auto rounded"
              />
            </div>
          )}
        </div>
      </AntModal>
    </>
  );
};

export default DiaryModals; 