#!/usr/bin/env python3
"""重新处理所有 PDF 文档"""

from vector_db_manager import ChromaDBManager
import os
import sys

def main():
    print("=" * 70)
    print("重新处理所有 PDF 文档到向量数据库")
    print("=" * 70)
    
    try:
        # 初始化管理器
        print("\n1. 初始化数据库管理器...")
        manager = ChromaDBManager()
        print("   ✓ 初始化成功")
        
        # 先清空数据库，重新开始
        print("\n2. 清空现有数据库...")
        manager.clear_collection()
        print("   ✓ 数据库已清空")
        
        # 处理上传目录中的所有 PDF
        upload_dir = "uploads"
        print(f"\n3. 扫描 {upload_dir} 目录...")
        
        if not os.path.exists(upload_dir):
            print(f"   目录不存在: {upload_dir}")
            return False
        
        pdf_files = [f for f in os.listdir(upload_dir) if f.endswith('.pdf')]
        print(f"   找到 {len(pdf_files)} 个 PDF 文件")
        
        total_chunks = 0
        
        for filename in pdf_files:
            file_path = os.path.join(upload_dir, filename)
            print(f"\n4. 处理文件: {filename}")
            print(f"   路径: {file_path}")
            
            try:
                # 加载文档
                print(f"   加载文档...")
                documents = manager.load_document(file_path)
                print(f"   ✓ 加载了 {len(documents)} 页")
                
                # 分割文档
                print(f"   分割文档...")
                splits = manager.split_document(documents)
                print(f"   ✓ 分割成 {len(splits)} 个文档块")
                
                # 添加到数据库
                print(f"   添加到向量数据库...")
                added = manager.add_documents(splits)
                total_chunks += added
                print(f"   ✓ 成功添加 {added} 个文档块")
                
            except Exception as e:
                print(f"   ✗ 处理失败: {str(e)}")
                import traceback
                traceback.print_exc()
        
        # 显示最终统计
        print("\n" + "=" * 70)
        print("处理完成！")
        print(f"总共添加了 {total_chunks} 个文档块")
        print(f"当前数据库中文档块总数: {manager.get_collection_stats()}")
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
