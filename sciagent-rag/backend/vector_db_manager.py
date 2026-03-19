import os
from chromadb import PersistentClient
from chromadb.utils import embedding_functions
from langchain_openai import OpenAIEmbeddings
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from config import settings

class ChromaDBManager:
    def __init__(self):
        # 初始化 ChromaDB 客户端
        self.db_path = settings.chroma_db_path
        os.makedirs(self.db_path, exist_ok=True)
        self.client = PersistentClient(path=self.db_path)
        
        # 使用 OpenAI 兼容的嵌入模型
        self.embedding_function = OpenAIEmbeddings(
            api_key=settings.llm_api_key,
            base_url=settings.llm_base_url if settings.llm_base_url else None
        )
        
        # 创建或获取集合
        self.collection = self.client.get_or_create_collection(
            name="sciagent_rag",
            metadata={"description": "AI 交互科学仿真平台知识库"}
        )
    
    def load_document(self, file_path):
        """加载文档"""
        if file_path.endswith('.pdf'):
            loader = PyPDFLoader(file_path)
        else:
            loader = TextLoader(file_path)
        
        documents = loader.load()
        return documents
    
    def split_document(self, documents, chunk_size=1000, chunk_overlap=200):
        """分割文档"""
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
        splits = text_splitter.split_documents(documents)
        return splits
    
    def add_documents(self, documents):
        """添加文档到向量数据库"""
        import uuid
        
        if not documents or len(documents) == 0:
            return 0
        
        # 过滤掉空内容的文档
        valid_docs = []
        for doc in documents:
            if doc.page_content and doc.page_content.strip():
                valid_docs.append(doc)
        
        if not valid_docs:
            return 0
        
        texts = [doc.page_content for doc in valid_docs]
        metadatas = [doc.metadata for doc in valid_docs]
        
        # 使用 UUID 确保每个文档有唯一 ID
        ids = [f"doc_{uuid.uuid4().hex[:8]}_{i}" for i in range(len(valid_docs))]
        
        self.collection.add(
            documents=texts,
            metadatas=metadatas,
            ids=ids
        )
        
        return len(valid_docs)
    
    def query(self, query_text, n_results=3):
        """查询向量数据库"""
        results = self.collection.query(
            query_texts=[query_text],
            n_results=n_results
        )
        return results
    
    def get_collection_stats(self):
        """获取集合统计信息"""
        return self.collection.count()
    
    def clear_collection(self):
        """清空集合"""
        self.client.delete_collection(name="sciagent_rag")
        self.collection = self.client.get_or_create_collection(
            name="sciagent_rag",
            metadata={"description": "AI 交互科学仿真平台知识库"}
        )

# 示例用法
if __name__ == "__main__":
    manager = ChromaDBManager()
    
    # 加载示例文档
    doc_path = "../data/experiments/physics_experiment_1.md"
    documents = manager.load_document(doc_path)
    splits = manager.split_document(documents)
    
    # 添加到向量数据库
    count = manager.add_documents(splits)
    print(f"Added {count} document chunks to ChromaDB")
    
    # 查询测试
    query_result = manager.query("牛顿第二定律的公式是什么？")
    print("Query result:")
    print(query_result)
