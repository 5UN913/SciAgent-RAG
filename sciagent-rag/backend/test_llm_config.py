#!/usr/bin/env python3
"""测试 LLM 统一配置"""

from config import settings
from llm_factory import LLMFactory

def main():
    print("=" * 70)
    print("LLM 统一配置测试工具")
    print("=" * 70)
    
    print("\n【配置检查】")
    print("-" * 70)
    
    print(f"LLM_BASE_URL: {settings.llm_base_url or '(默认 OpenAI)'}")
    print(f"LLM_MODEL_ID: {settings.llm_model_id}")
    print(f"LLM_API_KEY: {settings.llm_api_key[:20]}..." if settings.llm_api_key else "LLM_API_KEY: (未设置)")
    
    if not settings.llm_api_key:
        print("\n✗ LLM_API_KEY 未配置！")
        return False
    
    if not settings.llm_model_id:
        print("\n✗ LLM_MODEL_ID 未配置！")
        return False
    
    print("\n✓ 配置完整")
    
    print("\n【测试创建 LLM 实例】")
    print("-" * 70)
    
    try:
        llm = LLMFactory.create_llm()
        print("✓ LLM 实例创建成功！")
        print(f"  类型: {type(llm).__name__}")
        
        if hasattr(llm, 'model'):
            print(f"  模型: {llm.model}")
        
        print("\n【配置示例】")
        print("-" * 70)
        print("在 .env 文件中只需要设置这三个参数：")
        print()
        print("  LLM_BASE_URL=https://api.jiekou.ai/openai")
        print("  LLM_MODEL_ID=gpt-4o")
        print("  LLM_API_KEY=sk_xxxxx")
        
        print("\n【支持的场景】")
        print("-" * 70)
        print("1. OpenAI 官方")
        print("   LLM_BASE_URL= (留空)")
        print("   LLM_MODEL_ID=gpt-4o")
        print("   LLM_API_KEY=sk-xxxxx")
        print()
        print("2. OpenRouter")
        print("   LLM_BASE_URL=https://openrouter.ai/api/v1")
        print("   LLM_MODEL_ID=openai/gpt-4o")
        print("   LLM_API_KEY=sk-or-xxxxx")
        print()
        print("3. 本地模型（兼容 OpenAI 格式）")
        print("   LLM_BASE_URL=http://localhost:8000/v1")
        print("   LLM_MODEL_ID=llama-3-8b")
        print("   LLM_API_KEY=dummy")
        
        print("\n" + "=" * 70)
        print("测试完成")
        print("=" * 70)
        
        return True
        
    except Exception as e:
        print(f"✗ 错误: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    import sys
    sys.exit(0 if success else 1)
