from langgraph.graph import StateGraph, END
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from llm_factory import LLMFactory
from vector_db_manager import ChromaDBManager
from multimodal_ocr_manager import OCRManager
import json
import re
import io


class SolveState(BaseModel):
    question: str
    image_base64: Optional[str] = None

    extracted_text: Optional[str] = None
    physics_params: Dict[str, Any] = {}
    scenario_type: str = ""

    rag_context: str = ""
    answer: str = ""
    steps: List[str] = []

    simulation_code: str = ""
    reasoning: str = ""

    is_valid: bool = False
    validation_errors: List[str] = []
    retry_count: int = 0

    error: Optional[str] = None


class SolvePipeline:
    def __init__(self):
        self.llm = LLMFactory.create_llm()
        self.db_manager = ChromaDBManager()
        self.ocr_manager = OCRManager()
        self._build_graph()

    def _build_graph(self):
        graph = StateGraph(SolveState)

        graph.add_node("analyzer", self._analyzer)
        graph.add_node("reasoner", self._reasoner)
        graph.add_node("code_writer", self._code_writer)
        graph.add_node("validator", self._validator)

        graph.set_entry_point("analyzer")
        graph.add_edge("analyzer", "reasoner")
        graph.add_edge("reasoner", "code_writer")
        graph.add_edge("code_writer", "validator")
        graph.add_conditional_edges(
            "validator",
            self._should_retry,
            {"retry": "code_writer", "done": END},
        )

        self.compiled = graph.compile()

    # ── Analyzer: parse question, OCR if image, extract physics params ──

    def _analyzer(self, state: SolveState) -> dict:
        question = state.question

        if state.image_base64:
            try:
                import base64

                image_bytes = base64.b64decode(state.image_base64)
                extracted = self.ocr_manager.extract_text_from_bytes(
                    io.BytesIO(image_bytes)
                )
                question = (
                    f"{question}\n\n[OCR识别内容]:\n{extracted}"
                    if question.strip()
                    else extracted
                )
                return {"extracted_text": extracted, "question": question}
            except Exception as e:
                return {"error": f"OCR failed: {str(e)}"}

        prompt = ChatPromptTemplate.from_template(
            """分析以下物理题目，提取关键信息。

题目：{question}

请以JSON格式返回：
{{
  "scenario_type": "场景类型，如 projectile_motion / newton_second_law / free_fall / pendulum / spring / collision / inclined_plane / circular_motion 等",
  "params": {{提取的物理参数，如 "h": 20, "v0": 5, "g": 10, "m": 2 等}},
  "summary": "一句话总结题意"
}}

只返回JSON，不要其他文字。"""
        )

        chain = prompt | self.llm | StrOutputParser()
        try:
            raw = chain.invoke({"question": question})
            parsed = self._parse_json(raw)
            return {
                "scenario_type": parsed.get("scenario_type", "unknown"),
                "physics_params": parsed.get("params", {}),
            }
        except Exception:
            return {"scenario_type": "unknown", "physics_params": {}}

    # ── Reasoner: RAG retrieval + physics reasoning ──

    def _reasoner(self, state: SolveState) -> dict:
        results = self.db_manager.query(state.question, n_results=3)
        documents = results.get("documents", [[]])[0]
        rag_context = "\n".join(documents) if documents else "无相关参考资料"

        prompt = ChatPromptTemplate.from_template(
            """你是一个专业的物理教师，请根据参考资料解答学生的问题。

参考资料：
{context}

题目：{question}
场景类型：{scenario_type}
已提取参数：{params}

要求：
1. 给出完整的物理解答，包含公式推导和数值计算
2. 用"步骤1:"、"步骤2:"等格式列出推理步骤
3. 适合高中生理解
4. 如果参考资料不够，用物理知识补充

请回答："""
        )

        chain = prompt | self.llm | StrOutputParser()
        try:
            raw_answer = chain.invoke(
                {
                    "context": rag_context,
                    "question": state.question,
                    "scenario_type": state.scenario_type,
                    "params": json.dumps(state.physics_params, ensure_ascii=False),
                }
            )

            steps = []
            for line in raw_answer.split("\n"):
                line = line.strip()
                if re.match(r"^步骤\s*\d+", line) or re.match(
                    r"^Step\s*\d+", line, re.IGNORECASE
                ):
                    steps.append(line)

            return {
                "rag_context": rag_context,
                "answer": raw_answer,
                "steps": steps if steps else [raw_answer],
            }
        except Exception as e:
            return {"answer": f"推理出错：{str(e)}", "steps": []}

    # ── CodeWriter: generate Three.js simulation code ──

    def _code_writer(self, state: SolveState) -> dict:
        prompt = ChatPromptTemplate.from_template(
            """你是一个Three.js物理仿真代码生成专家。根据题目和解答，生成可执行的Three.js动画代码。

题目：{question}
场景类型：{scenario_type}
物理参数：{params}
解答摘要：{answer_summary}

【重要】当前渲染环境是2D正交视图：
- XY平面：X轴=水平方向（正方向向右），Y轴=竖直方向（正方向向上）
- 地面在 y=0，所有物体放在 z=0 平面
- 相机从正面看，无透视效果
- 使用 MeshBasicMaterial（扁平色块，无需光照）

代码运行环境已有以下变量和函数：

基础API：
- THREE: Three.js库
- scene: THREE.Scene实例
- camera: THREE.OrthographicCamera实例
- renderer: THREE.WebGLRenderer实例
- animate(callback): 注册动画回调，callback接收deltaTime参数（秒）
- stopAnimation(): 停止所有动画

可视化Helper函数（scene已预绑定，无需传入scene参数）：
- createVector(origin, direction, length, color) → 创建箭头向量，返回ArrowHelper
- updateVector(arrow, origin, direction, length) → 更新箭头位置/方向/长度
- createTrail(color, maxPoints) → 创建轨迹线，返回 {{line, addPoint(vec), clear(), dispose()}}
- createLabel(text, position, fontSize, color) → 创建文字标注Sprite，返回sprite（有updateText方法）
- updateLabel(sprite, text, position) → 更新标注文字和位置
- createDashedLine(from, to, color) → 创建虚线辅助线
- updateDashedLine(line, from, to) → 更新虚线端点
- createHUD() → 创建实时数据HUD面板，返回 {{element, update(data), dispose()}}
  - update(data) 接收对象如 {{t: 1.5, v: 15, h: 11.25}}，自动格式化显示

代码要求：
1. 定义 setupScene() 创建场景物体，所有物体z坐标设为0
2. 定义 update(deltaTime) 每帧更新逻辑
3. 最后调用 setupScene(); animate(update);
4. 物理参数必须与题目一致
5. 使用 createTrail() 显示运动轨迹
6. 使用 createVector() 显示速度向量
7. 使用 createHUD() 显示实时物理量（时间、速度、位移等）
8. 物体到达边界（如地面y=0）必须停止运动
9. 起始位置必须根据物理参数正确设置（如自由落体起始高度 = 0.5*g*t²）

示例 —— 自由落体（v0=0, g=10, t_total=3s）：
```
const g = 10;
const totalTime = 3;
const startHeight = 0.5 * g * totalTime * totalTime; // 45m → 缩放到场景

let ball, velocityArrow, trail, hud, accTime = 0;

function setupScene() {{
  const geom = new THREE.CircleGeometry(0.3, 32);
  const mat = new THREE.MeshBasicMaterial({{ color: 0xff4444 }});
  ball = new THREE.Mesh(geom, mat);
  ball.position.set(0, startHeight / 5, 0); // 缩放以适应视图
  scene.add(ball);

  velocityArrow = createVector(
    {{x: 0, y: ball.position.y, z: 0}},
    {{x: 0, y: -1, z: 0}}, 0.1, 0x00aa00
  );
  trail = createTrail(0x4488ff, 300);
  hud = createHUD();
}}

function update(deltaTime) {{
  if (accTime >= totalTime) return;
  accTime += deltaTime;
  const t = Math.min(accTime, totalTime);
  const y = startHeight / 5 - 0.5 * g * t * t / 5;
  ball.position.y = Math.max(0, y);
  trail.addPoint({{x: 0, y: ball.position.y, z: 0}});
  const v = g * t;
  updateVector(velocityArrow, {{x: 0.5, y: ball.position.y, z: 0}}, {{x: 0, y: -1, z: 0}}, v / 10);
  hud.update({{ 't (s)': t, 'v (m/s)': v, 'h (m)': startHeight - 0.5 * g * t * t }});
}}

setupScene();
animate(update);
```

只返回纯JavaScript代码，不要包含markdown代码块标记，不要JSON包裹，不要任何解释文字。"""
        )

        chain = prompt | self.llm | StrOutputParser()
        try:
            answer_summary = state.answer[:500] if state.answer else ""
            raw_code = chain.invoke(
                {
                    "question": state.question,
                    "scenario_type": state.scenario_type,
                    "params": json.dumps(state.physics_params, ensure_ascii=False),
                    "answer_summary": answer_summary,
                }
            )

            clean_code = self._clean_code(raw_code)
            return {
                "simulation_code": clean_code,
                "reasoning": f"为{state.scenario_type}场景生成仿真代码",
            }
        except Exception as e:
            return {"simulation_code": "", "reasoning": f"代码生成出错：{str(e)}"}

    # ── Validator: check generated code quality ──

    def _validator(self, state: SolveState) -> dict:
        code = state.simulation_code
        errors = []

        if not code or len(code.strip()) < 20:
            errors.append("代码为空或过短")

        if "setupScene" not in code and "scene.add" not in code:
            errors.append("缺少场景创建逻辑")

        if "animate" not in code:
            errors.append("缺少动画注册")

        dangerous_patterns = [
            "window.",
            "document.",
            "fetch(",
            "XMLHttpRequest",
            "eval(",
            "import ",
        ]
        for pattern in dangerous_patterns:
            if pattern in code:
                errors.append(f"包含不安全的代码: {pattern}")

        if errors:
            return {
                "is_valid": False,
                "validation_errors": errors,
                "retry_count": state.retry_count + 1,
            }

        return {"is_valid": True, "validation_errors": []}

    def _should_retry(self, state: SolveState) -> str:
        if state.is_valid:
            return "done"
        if state.retry_count >= 2:
            return "done"
        return "retry"

    # ── Helpers ──

    def _parse_json(self, raw: str) -> dict:
        raw = raw.strip()
        if raw.startswith("```"):
            match = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw)
            if match:
                raw = match.group(1)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            json_match = re.search(r"\{[\s\S]*\}", raw)
            if json_match:
                try:
                    return json.loads(json_match.group(0))
                except json.JSONDecodeError:
                    pass
        return {}

    def _clean_code(self, raw: str) -> str:
        code = raw.strip()

        md_match = re.search(r"```(?:javascript|js)?\s*([\s\S]*?)```", code)
        if md_match:
            code = md_match.group(1).strip()

        try:
            parsed = json.loads(code)
            if isinstance(parsed, dict) and "code" in parsed:
                code = parsed["code"]
        except (json.JSONDecodeError, TypeError):
            pass

        return code.strip()

    def solve(self, question: str, image_base64: str = None) -> dict:
        initial_state = SolveState(question=question, image_base64=image_base64)

        try:
            result = self.compiled.invoke(initial_state)

            if isinstance(result, dict):
                return {
                    "status": "success",
                    "answer": result.get("answer", ""),
                    "steps": result.get("steps", []),
                    "simulation_code": result.get("simulation_code", ""),
                    "params": result.get("physics_params", {}),
                    "reasoning": result.get("reasoning", ""),
                    "error": result.get("error"),
                }

            return {
                "status": "success",
                "answer": result.answer,
                "steps": result.steps,
                "simulation_code": result.simulation_code,
                "params": result.physics_params,
                "reasoning": result.reasoning,
                "error": result.error,
            }
        except Exception as e:
            return {
                "status": "error",
                "answer": "",
                "steps": [],
                "simulation_code": "",
                "params": {},
                "reasoning": "",
                "error": str(e),
            }
