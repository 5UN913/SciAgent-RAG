import os
from PIL import Image
import pytesseract
from config import settings

class OCRManager:
    def __init__(self):
        # 配置 Tesseract 路径
        if settings.tesseract_path:
            pytesseract.pytesseract.tesseract_cmd = settings.tesseract_path
    
    def extract_text(self, image_path):
        """从图片中提取文本"""
        try:
            # 打开图片
            image = Image.open(image_path)
            
            # 使用 Tesseract 进行 OCR
            text = pytesseract.image_to_string(image, lang='chi_sim+eng')
            
            return text
        except Exception as e:
            return f"OCR 识别出错：{str(e)}"
    
    def extract_text_from_bytes(self, image_bytes):
        """从图片字节数据中提取文本"""
        try:
            # 从字节数据创建图片
            image = Image.open(image_bytes)
            
            # 使用 Tesseract 进行 OCR
            text = pytesseract.image_to_string(image, lang='chi_sim+eng')
            
            return text
        except Exception as e:
            return f"OCR 识别出错：{str(e)}"

# 示例用法
if __name__ == "__main__":
    ocr_manager = OCRManager()
    
    # 测试 OCR 功能
    # 注意：需要准备一张包含文本的测试图片
    # test_image_path = "test_image.png"
    # if os.path.exists(test_image_path):
    #     text = ocr_manager.extract_text(test_image_path)
    #     print(f"识别结果：{text}")
    # else:
    #     print("测试图片不存在")
