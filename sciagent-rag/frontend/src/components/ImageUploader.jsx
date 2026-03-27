import React from 'react';
import { useSimulation } from '../context/SimulationContext';

/**
 * ImageUploader — uploads an image for OCR, puts extracted text into the chat input.
 */
function ImageUploader() {
  const { setMessage, setResponse } = useSimulation();

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/ocr/extract', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(data.text);
      } else {
        setResponse('OCR 识别失败，请稍后重试');
      }
    } catch (error) {
      setResponse('网络错误，请检查连接');
    }
  };

  return (
    <div className="upload-area">
      <p>上传题目图片 / 实验截图</p>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
        id="file-upload"
      />
      <label htmlFor="file-upload">点击上传</label>
    </div>
  );
}

export default ImageUploader;
