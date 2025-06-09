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
}

const DiaryModals: React.FC<DiaryModalsProps> = ({
  isDeleteConfirmVisible,
  handleDeleteConfirmOk,
  handleDeleteConfirmCancel,
  diaryTitle,
  isVideoModalVisible,
  currentVideoUrl,
  handleVideoModalCancel,
}) => {
  return (
    <>
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
          Are you sure you want to delete this diary entry titled "{diaryTitle}"?
          This action cannot be undone.
        </p>
      </AntModal>
    </>
  );
};

export default DiaryModals; 