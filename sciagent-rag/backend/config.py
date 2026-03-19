from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # LLM 统一配置
    llm_base_url: str = ""  # API 基础 URL（可选）
    llm_model_id: str = ""  # 模型 ID（必填）
    llm_api_key: str = ""   # API 密钥（必填）
    
    # 应用配置
    app_name: str = "AI 交互科学仿真平台"
    app_version: str = "1.0.0"
    
    # 服务器配置
    host: str = "0.0.0.0"
    port: int = 8000
    
    # ChromaDB 配置
    chroma_db_path: str = "./chromadb"
    
    # OCR 配置
    tesseract_path: Optional[str] = None

    # 仿真配置
    simulation_engine: str = "threejs"

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
