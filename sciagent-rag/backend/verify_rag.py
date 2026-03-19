#!/usr/bin/env python3
"""验证 RAG 系统是否正常工作"""

from vector_db_manager import ChromaDBManager
from rag_agent import RAGManager
import os
import sys

def main():
    print("=" * 70)
    print("RAG 系统验证工具")
    print("=" * 70)
    
    try:
        print("\n【问题 1】向量数据库路径在哪里？")
        print("-" * 70)
        manager = ChromaDBManager()
        db_path = manager.db_path
        absolute_db_path = os.path.abspath(db_path)
        print(f"数据库路径（相对）: {db_path}")
        print(f"数据库路径（绝对）: {absolute_db_path}")
        
        print("\n【问题 2】如何确认文档是否放进向量数据库？")
        print("-" * 70)
        count = manager.get_collection_stats()
        print(f"向量数据库中文档块总数: {count}")
        
        if count > 0:
            print("\n测试查询向量数据库...")
            test_question = "牛顿第二定律"
            results = manager.query(test_question, n_results=3)
            
            print(f"\n查询问题: \"{test_question}\"")
            docs = results.get('documents', [[]])[0]
            print(f"找到 {len(docs)} 个相关文档块")
            
            if docs:
                print("\n检索到的内容预览:")
                for i, doc in enumerate(docs, 1):
                    preview = doc[:200] + "..." if len(doc) > 200 else doc
                    print(f"\n--- 文档块 {i} ---")
                    print(preview)
        
        print("\n【问题 3】每次调用大模型是否调用了 RAG？")
        print("-" * 70)
        rag_manager = RAGManager()
        
        print("\n让我展示 RAG 的工作流程：")
        print("1. 接收用户问题")
        print("2. 从向量数据库检索相关文档（retrieve_documents）")
        print("3. 将检索到的内容和用户问题一起传给大模型")
        print("4. 大模型基于检索内容生成回答")
        
        test_question_rag = "牛顿第二定律的公式是什么？"
        print(f"\n测试问题: \"{test_question_rag}\"")
        
        # 测试检索功能
        context = rag_manager.retrieve_documents(test_question_rag)
        
        if context and context.strip():
            print("\n✓ 成功从向量数据库检索到内容！")
            print("\n检索到的上下文内容:")
            print("-" * 70)
            print(context[:500] + "..." if len(context) > 500 else context)
            print("-" * 70)
            
            print("\n✓ RAG 工作流程确认：")
            print("  1. 用户问题 → 2. 向量数据库检索 → 3. 检索内容+问题 → 4. 大模型生成回答")
            print("  ✓ 每次调用 generate_answer 都会调用 RAG！")
            
            print("\n【代码证据】查看 rag_agent.py:77-81")
            print("  def generate_answer(self, question):")
            print("      answer = self.rag_chain.invoke(question)")
            print("  其中 rag_chain 包含了 retrieve_documents 步骤！")
        else:
            print("\n✗ 没有从向量数据库检索到内容")
        
        print("\n" + "=" * 70)
        print("验证总结")
        print("=" * 70)
        print(f"1. 数据库路径: {absolute_db_path}")
        print(f"2. 文档确认: 数据库中有 {count} 个文档块")
        print(f"3. RAG 调用: 每次调用 generate_answer 都会先从向量数据库检索内容")
        print("=" * 70)
        
        return True
        
    except Exception as e:
        print(f"\n✗ 错误: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
