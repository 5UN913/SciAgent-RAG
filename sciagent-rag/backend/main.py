from fastapi import (
    FastAPI,
    HTTPException,
    UploadFile,
    File,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn
import json
import os
from rag_agent import RAGManager
from multimodal_ocr_manager import OCRManager
from simulation_command_validator import CommandValidator
from vector_db_manager import ChromaDBManager
from solve_pipeline import SolvePipeline

app = FastAPI(
    title="AI 交互科学仿真平台",
    description="基于多智能体与 RAG 的交互式高中物理/化学教学系统",
    version="1.0.0",
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化 RAG 管理器（包含自己的 db_manager）
rag_manager = RAGManager()

# 初始化 OCR 管理器
ocr_manager = OCRManager()

# 初始化命令验证器
command_validator = CommandValidator()

db_manager = rag_manager.db_manager

solve_pipeline = None


def get_solve_pipeline():
    global solve_pipeline
    if solve_pipeline is None:
        solve_pipeline = SolvePipeline()
    return solve_pipeline


# 上传文件存储目录
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 存储活跃的 WebSocket 连接
active_connections = set()


class QuestionRequest(BaseModel):
    question: str


class SolveRequest(BaseModel):
    question: str
    image_base64: Optional[str] = None


class SolveResponse(BaseModel):
    status: str
    answer: str = ""
    steps: List[str] = []
    simulation_code: Optional[str] = None
    params: Optional[Dict[str, Any]] = None
    reasoning: str = ""
    error: Optional[str] = None


class CommandRequest(BaseModel):
    command: dict


@app.get("/")
def read_root():
    return {"message": "AI 交互科学仿真平台 API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/solve", response_model=SolveResponse)
def solve(request: SolveRequest):
    """Unified endpoint: question → analysis → RAG reasoning → code generation → validation"""
    try:
        pipeline = get_solve_pipeline()
        result = pipeline.solve(
            question=request.question,
            image_base64=request.image_base64,
        )
        return SolveResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"求解失败：{str(e)}")


@app.post("/rag/query")
def rag_query(request: QuestionRequest):
    """RAG 问答接口"""
    try:
        answer = rag_manager.generate_answer(request.question)
        return {"question": request.question, "answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成回答时出错：{str(e)}")


@app.get("/rag/stats")
def rag_stats():
    """RAG 统计信息"""
    try:
        stats = rag_manager.get_retrieval_stats()
        return {"document_count": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取统计信息时出错：{str(e)}")


@app.post("/ocr/extract")
async def ocr_extract(file: UploadFile = File(...)):
    """OCR 文本提取接口"""
    try:
        # 读取上传的文件
        image_bytes = await file.read()

        # 进行 OCR 识别
        text = ocr_manager.extract_text_from_bytes(image_bytes)

        return {"filename": file.filename, "text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR 识别时出错：{str(e)}")


@app.post("/command/execute")
def execute_command(request: CommandRequest):
    """执行仿真命令接口"""
    try:
        # 验证命令
        is_valid, message = command_validator.validate_command(request.command)
        if not is_valid:
            raise HTTPException(status_code=400, detail=message)

        # 命令由前端 Three.js 直接处理
        return {
            "status": "success",
            "command": request.command,
            "message": "命令已发送至前端执行",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"执行命令时出错：{str(e)}")


@app.post("/command/generate")
def generate_command(request: QuestionRequest):
    """生成仿真命令接口（保留向后兼容）"""
    try:
        # 生成命令
        command = rag_manager.generate_command(request.question)

        # 解析命令
        is_valid, parsed_command = command_validator.parse_command(command)
        if not is_valid:
            # 尝试提取 JSON 部分
            import re

            json_match = re.search(r"\{[^}]*\}", command, re.DOTALL)
            if json_match:
                command = json_match.group(0)
                is_valid, parsed_command = command_validator.parse_command(command)

        if is_valid:
            return {
                "status": "success",
                "command": parsed_command,
                "raw_command": command,
            }
        else:
            return {
                "status": "warning",
                "message": "生成的命令格式可能不正确",
                "raw_command": command,
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成命令时出错：{str(e)}")


@app.post("/code/generate")
def generate_code(request: QuestionRequest):
    """生成 Three.js 动画代码接口"""
    try:
        # 生成代码
        code_response = rag_manager.generate_command(request.question)

        # 尝试解析 JSON 响应
        import json

        try:
            result = json.loads(code_response)
            if "code" in result:
                return {
                    "status": "success",
                    "code": result.get("code", ""),
                    "reasoning": result.get("reasoning", ""),
                    "raw_response": code_response,
                }
        except json.JSONDecodeError:
            # 如果不是有效的 JSON，尝试提取代码
            import re

            code_match = re.search(
                r"```(?:javascript|js)?\s*([\s\S]*?)\s*```", code_response
            )
            if code_match:
                return {
                    "status": "success",
                    "code": code_match.group(1),
                    "reasoning": "从响应中提取的代码",
                    "raw_response": code_response,
                }
            else:
                return {
                    "status": "success",
                    "code": code_response,
                    "reasoning": "直接返回的代码",
                    "raw_response": code_response,
                }

        return {
            "status": "warning",
            "message": "未能正确解析代码响应",
            "raw_response": code_response,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成代码时出错：{str(e)}")


@app.post("/rag/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """上传文档到服务器"""
    try:
        file_path = os.path.join(UPLOAD_DIR, file.filename)

        # 保存上传的文件
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        return {
            "status": "success",
            "filename": file.filename,
            "file_path": file_path,
            "message": "文件上传成功",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件上传失败：{str(e)}")


@app.post("/rag/documents/process")
def process_document(filename: str, chunk_size: int = 1000, chunk_overlap: int = 200):
    """处理文档并添加到向量数据库"""
    try:
        file_path = os.path.join(UPLOAD_DIR, filename)

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="文件不存在")

        # 加载文档
        documents = db_manager.load_document(file_path)

        # 分割文档
        splits = db_manager.split_document(documents, chunk_size, chunk_overlap)

        # 添加到向量数据库
        count = db_manager.add_documents(splits)

        return {
            "status": "success",
            "filename": filename,
            "document_count": len(documents),
            "chunk_count": count,
            "message": f"文档处理完成，添加了 {count} 个文档块",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文档处理失败：{str(e)}")


@app.get("/rag/documents")
def list_documents():
    """列出已上传的文档"""
    try:
        if not os.path.exists(UPLOAD_DIR):
            return {"documents": []}

        files = []
        for filename in os.listdir(UPLOAD_DIR):
            file_path = os.path.join(UPLOAD_DIR, filename)
            if os.path.isfile(file_path):
                files.append(
                    {
                        "filename": filename,
                        "size": os.path.getsize(file_path),
                        "created_time": os.path.getctime(file_path),
                    }
                )

        return {"documents": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取文档列表失败：{str(e)}")


@app.delete("/rag/documents/{filename}")
def delete_document(filename: str):
    """删除上传的文档"""
    try:
        file_path = os.path.join(UPLOAD_DIR, filename)

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="文件不存在")

        os.remove(file_path)

        return {"status": "success", "filename": filename, "message": "文件删除成功"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件删除失败：{str(e)}")


@app.delete("/rag/collection/clear")
def clear_collection():
    """清空向量数据库"""
    try:
        db_manager.clear_collection()
        return {"status": "success", "message": "向量数据库已清空"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"清空向量数据库失败：{str(e)}")


@app.websocket("/ws/simulation")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket 端点，用于与前端进行实时通信"""
    await websocket.accept()
    active_connections.add(websocket)

    try:
        while True:
            # 接收前端消息
            data = await websocket.receive_text()

            # 解析消息
            try:
                message = json.loads(data)

                # 处理不同类型的消息
                if message.get("type") == "command":
                    # 验证命令
                    is_valid, validate_message = command_validator.validate_command(
                        message.get("data")
                    )

                    if is_valid:
                        response = {
                            "type": "command_response",
                            "status": "success",
                            "message": "命令已接收",
                            "data": message.get("data"),
                        }
                    else:
                        # 命令验证失败
                        response = {
                            "type": "command_response",
                            "status": "error",
                            "message": validate_message,
                        }
                elif message.get("type") == "ping":
                    # 心跳消息
                    response = {"type": "pong", "message": "pong"}
                else:
                    # 未知消息类型
                    response = {"type": "error", "message": "未知消息类型"}
            except json.JSONDecodeError:
                response = {"type": "error", "message": "无效的 JSON 格式"}
            except Exception as e:
                response = {"type": "error", "message": f"处理消息时出错：{str(e)}"}

            # 发送响应
            await websocket.send_json(response)
    except WebSocketDisconnect:
        active_connections.remove(websocket)
    except Exception as e:
        print(f"WebSocket 错误：{str(e)}")
        active_connections.remove(websocket)


async def broadcast_message(message: dict):
    """广播消息给所有活跃的 WebSocket 连接"""
    for connection in active_connections:
        try:
            await connection.send_json(message)
        except Exception as e:
            print(f"广播消息时出错：{str(e)}")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
