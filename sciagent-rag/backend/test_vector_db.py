#!/usr/bin/env python3
"""测试向量数据库功能"""

from vector_db_manager import ChromaDBManager
import sys
import os

def test_database():
    print("=" * 60)
    print("测试向量数据库功能")
    print("=" * 60)
    
    try:
        print("\n1. 初始化 ChromaDB 管理器...")
        manager = ChromaDBManager()
        print("   ✓ 初始化成功")
        
        print(f"\n2. 检查当前集合文档数量:")
        count = manager.get_collection_stats()
        print(f"   当前文档块数量: {count}")
        
        print("\n3. 测试加载和添加文档...")
        test_doc = "../data/experiments/physics_experiment_1.md"
        
        if os.path.exists(test_doc):
            print(f"   加载文档: {test_doc}")
            documents = manager.load_document(test_doc)
            print(f"   ✓ 成功加载 {len(documents)} 个文档")
            
            splits = manager.split_document(documents)
            print(f"   ✓ 成功分割成 {len(splits)} 个文档块")
            
            added = manager.add_documents(splits)
            print(f"   ✓ 成功添加 {added} 个文档块到向量数据库")
            
            count_after = manager.get_collection_stats()
            print(f"   ✓ 添加后文档块总数: {count_after}")
        else:
            print(f"   测试文档不存在: {test_doc}")
        
        print("\n4. 最终统计:")
        final_count = manager.get_collection_stats()
        print(f"   向量数据库文档块总数: {final_count}")
        
        print("\n" + "=" * 60)
        print("测试完成")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n✗ 错误: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_database()
    sys.exit(0 if success else 1)
