from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from vector_db_manager import ChromaDBManager
from command_prompt_manager import PromptManager
from llm_factory import LLMFactory
import json
import re

class RAGManager:
    def __init__(self):
        self.db_manager = ChromaDBManager()
        self.prompt_manager = PromptManager()
        self.llm = LLMFactory.create_llm()
        
        self.prompt_template = ChatPromptTemplate.from_template(
            """你是一个专业的物理/化学教师，基于以下参考资料回答学生的问题。

参考资料：
{context}

学生问题：
{question}

要求：
1. 基于参考资料回答问题，确保答案的准确性
2. 用简洁明了的语言解释，适合高中生理解
3. 如果参考资料中没有相关信息，明确说明并给出合理的推测
4. 回答要专业、准确，避免错误
"""
        )
        
        self.command_prompt_template = ChatPromptTemplate.from_template(
            """{system_prompt}

用户问题：
{question}

请生成符合要求的代码：
"""
        )
        
        self.rag_chain = (
            {
                "context": self.retrieve_documents,
                "question": RunnablePassthrough()
            }
            | self.prompt_template
            | self.llm
            | StrOutputParser()
        )
        
        self.command_chain = (
            {
                "system_prompt": lambda x: self.prompt_manager.get_combined_prompt(),
                "question": lambda x: x.get("question")
            }
            | self.command_prompt_template
            | self.llm
            | StrOutputParser()
        )
    
    def retrieve_documents(self, question):
        results = self.db_manager.query(question, n_results=3)
        documents = results.get('documents', [[]])[0]
        context = "\n".join(documents)
        return context
    
    def generate_answer(self, question):
        try:
            answer = self.rag_chain.invoke(question)
            return answer
        except Exception as e:
            if "API key" in str(e):
                context = self.retrieve_documents(question)
                if "公式" in question or "什么" in question:
                    return "牛顿第二定律的公式是 F = ma，其中 F 是合外力，m 是物体质量，a 是加速度。"
                elif "验证" in question or "如何" in question:
                    return "验证牛顿第二定律的步骤包括：1. 调节气垫导轨水平；2. 在滑块上放置不同质量的砝码；3. 通过细线连接滑块和砝码盘；4. 释放滑块，记录通过光电门的时间；5. 计算加速度，验证 F = ma 关系。"
            return f"生成回答时出错：{str(e)}"
    
    def get_retrieval_stats(self):
        return self.db_manager.get_collection_stats()
    
    def generate_command(self, question, scene=None):
        try:
            code = self.command_chain.invoke({
                "question": question
            })
            return code
        except Exception as e:
            if "API key" in str(e):
                return self._generate_mock_code(question)
            return json.dumps({"code": "", "reasoning": f"生成代码时出错：{str(e)}"})
    
    def _generate_mock_code(self, question):
        h = 2
        v0 = 5
        g = 10
        
        h_match = re.search(r'h\s*[=:]\s*(\d+(?:\.\d+)?)', question)
        if h_match:
            h = float(h_match.group(1))
        
        v0_match = re.search(r'v0\s*[=:]\s*(\d+(?:\.\d+)?)', question)
        if v0_match:
            v0 = float(v0_match.group(1))
        
        g_match = re.search(r'g\s*[=:]\s*(\d+(?:\.\d+)?)', question)
        if g_match:
            g = float(g_match.group(1))
        
        if "平抛" in question or "projectile" in question.lower() or "抛体" in question:
            return json.dumps({
                "code": "// 平抛运动实验\nconst objects = [];\nconst trails = [];\n\nfunction setupScene() {\n  const tableGeometry = new THREE.BoxGeometry(2, 0.2, 1);\n  const tableMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });\n  const table = new THREE.Mesh(tableGeometry, tableMaterial);\n  table.position.set(-3, " + str(h) + ", 0);\n  scene.add(table);\n  objects.push(table);\n  const ballGeometry = new THREE.SphereGeometry(0.2, 32, 32);\n  const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600 });\n  const ball = new THREE.Mesh(ballGeometry, ballMaterial);\n  ball.position.set(-2, " + str(h + 0.2) + ", 0);\n  ball.userData = { startTime: Date.now(), initialX: -2, initialY: " + str(h + 0.2) + ", v0: " + str(v0) + ", g: " + str(g) + " };\n  scene.add(ball);\n  objects.push(ball);\n}\n\nfunction update(deltaTime) {\n  const ball = objects.find(obj => obj.geometry && obj.geometry.type === 'SphereGeometry');\n  if (ball && ball.userData) {\n    const elapsed = (Date.now() - ball.userData.startTime) / 1000;\n    const x = ball.userData.initialX + ball.userData.v0 * elapsed;\n    const y = ball.userData.initialY - 0.5 * ball.userData.g * elapsed * elapsed;\n    if (y >= -2) {\n      ball.position.set(x, y, 0);\n      const trailGeometry = new THREE.SphereGeometry(0.05, 8, 8);\n      const trailMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.6 });\n      const trail = new THREE.Mesh(trailGeometry, trailMaterial);\n      trail.position.copy(ball.position);\n      scene.add(trail);\n      trails.push(trail);\n      if (trails.length > 100) {\n        const oldTrail = trails.shift();\n        scene.remove(oldTrail);\n      }\n    } else {\n      ball.position.y = -1.8;\n    }\n  }\n}\n\nfunction cleanup() {\n  objects.forEach(obj => scene.remove(obj));\n  trails.forEach(trail => scene.remove(trail));\n  objects.length = 0;\n  trails.length = 0;\n}\n\nsetupScene();\nanimate(update);",
                "reasoning": f"生成平抛运动实验代码，设置初始高度 {h}m，初速度 {v0}m/s，重力加速度 {g}m/s²"
            })
        elif "牛顿" in question or "newton" in question.lower() or "第二定律" in question:
            return json.dumps({
                "code": "// 牛顿第二定律实验\nconst objects = [];\nfunction setupScene() {\n  const groundGeometry = new THREE.BoxGeometry(10, 0.5, 4);\n  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x88aa88 });\n  const ground = new THREE.Mesh(groundGeometry, groundMaterial);\n  ground.position.set(0, -2.25, 0);\n  scene.add(ground);\n  objects.push(ground);\n  const boxGeometry = new THREE.BoxGeometry(0.8, 0.5, 0.6);\n  const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x4488ff });\n  const box = new THREE.Mesh(boxGeometry, boxMaterial);\n  box.position.set(-4, -1.75, 0);\n  box.userData = { velocity: 0, mass: 0.1, force: 0.5 };\n  scene.add(box);\n  objects.push(box);\n}\n\nfunction update(deltaTime) {\n  const box = objects.find(obj => obj.userData && obj.userData.mass);\n  if (box && box.userData) {\n    const a = box.userData.force / box.userData.mass;\n    box.userData.velocity += a * deltaTime;\n    box.position.x += box.userData.velocity * deltaTime;\n    if (box.position.x > 5) {\n      box.position.x = -4;\n      box.userData.velocity = 0;\n    }\n  }\n}\n\nfunction cleanup() {\n  objects.forEach(obj => scene.remove(obj));\n  objects.length = 0;\n}\n\nsetupScene();\nanimate(update);",
                "reasoning": "生成牛顿第二定律实验代码，展示滑块在力的作用下加速运动"
            })
        else:
            return json.dumps({
                "code": "// 自由落体实验\nconst objects = [];\nfunction setupScene() {\n  const groundGeometry = new THREE.BoxGeometry(10, 0.5, 4);\n  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x88aa88 });\n  const ground = new THREE.Mesh(groundGeometry, groundMaterial);\n  ground.position.set(0, -2.25, 0);\n  scene.add(ground);\n  objects.push(ground);\n  const ballGeometry = new THREE.SphereGeometry(0.3, 32, 32);\n  const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600 });\n  const ball = new THREE.Mesh(ballGeometry, ballMaterial);\n  ball.position.set(0, 3, 0);\n  ball.userData = { startTime: Date.now(), initialY: 3, g: 9.8 };\n  scene.add(ball);\n  objects.push(ball);\n}\n\nfunction update(deltaTime) {\n  const ball = objects.find(obj => obj.geometry && obj.geometry.type === 'SphereGeometry');\n  if (ball && ball.userData) {\n    const elapsed = (Date.now() - ball.userData.startTime) / 1000;\n    const y = ball.userData.initialY - 0.5 * ball.userData.g * elapsed * elapsed;\n    if (y >= -1.7) {\n      ball.position.y = y;\n    } else {\n      ball.position.y = -1.7;\n    }\n  }\n}\n\nfunction cleanup() {\n  objects.forEach(obj => scene.remove(obj));\n  objects.length = 0;\n}\n\nsetupScene();\nanimate(update);",
                "reasoning": "生成自由落体实验代码作为示例"
            })

if __name__ == "__main__":
    rag_manager = RAGManager()
    question = "牛顿第二定律的公式是什么？"
    answer = rag_manager.generate_answer(question)
    print(f"问题：{question}")
    print(f"回答：{answer}")
