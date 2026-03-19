from langchain_openai import ChatOpenAI
from config import settings

class LLMFactory:
    @staticmethod
    def create_llm():
        """创建 LLM 实例（统一配置方式）"""
        
        api_key = settings.llm_api_key
        model_id = settings.llm_model_id
        base_url = settings.llm_base_url
        
        if not api_key:
            raise ValueError("LLM_API_KEY 未配置，请在 .env 文件中设置")
        if not model_id:
            raise ValueError("LLM_MODEL_ID 未配置，请在 .env 文件中设置")
        
        # 使用 OpenAI 兼容接口（支持大多数模型服务）
        return ChatOpenAI(
            api_key=api_key,
            model=model_id,
            base_url=base_url if base_url else None,
            temperature=0.7
        )
