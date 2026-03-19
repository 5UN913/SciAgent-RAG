from langgraph.graph import StateGraph, END
from pydantic import BaseModel
from typing import Optional, Dict, Any
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from llm_factory import LLMFactory
from command_prompt_manager import PromptManager
from simulation_command_validator import CommandValidator

# 定义状态结构
class SimulationState(BaseModel):
    question: str
    scene: str = "newton_second_law"
    command: Optional[Dict[str, Any]] = None
    plan: str = ""
    execution_result: str = ""
    observation: str = ""
    error: Optional[str] = None

class LangGraphManager:
    def __init__(self):
        # 使用 LLM 工厂创建 LLM 实例
        self.llm = LLMFactory.create_llm()
        
        # 初始化提示词管理器
        self.prompt_manager = PromptManager()
        
        # 初始化命令验证器
        self.command_validator = CommandValidator()
        
        # 创建状态图 - 使用 Pydantic 模型作为状态
        self.graph = StateGraph(SimulationState)
        
        # 添加节点
        self.graph.add_node("planner", self.planner_agent)
        self.graph.add_node("executor", self.executor_agent)
        self.graph.add_node("observer", self.observer_agent)
        
        # 添加边
        self.graph.set_entry_point("planner")
        self.graph.add_edge("planner", "executor")
        self.graph.add_edge("executor", "observer")
        self.graph.add_edge("observer", END)
        
        # 编译图
        self.compiled_graph = self.graph.compile()
    
    def planner_agent(self, state: SimulationState) -> SimulationState:
        """规划者 Agent：分析问题并制定执行计划"""
        print("=== 规划者 Agent 执行 ===")
        
        # 定义规划提示模板
        prompt = ChatPromptTemplate.from_template(
            """你是一个实验规划者，负责分析用户的问题并制定实验执行计划。

用户问题：
{question}

实验场景：
{scene}

请制定一个详细的实验执行计划，包括：
1. 实验目标
2. 执行步骤
3. 需要设置的参数
4. 预期结果

计划应该清晰、具体，可直接用于指导实验执行。
"""
        )
        
        # 构建链
        chain = prompt | self.llm | StrOutputParser()
        
        # 生成计划
        try:
            plan = chain.invoke({
                "question": state.question,
                "scene": state.scene
            })
            state.plan = plan
            print(f"生成的计划：{plan}")
        except Exception as e:
            state.error = f"规划者出错：{str(e)}"
            print(f"规划者出错：{str(e)}")
        
        return state
    
    def executor_agent(self, state: SimulationState) -> SimulationState:
        """执行者 Agent：根据计划生成并执行命令"""
        print("=== 执行者 Agent 执行 ===")
        
        # 定义执行提示模板
        prompt = ChatPromptTemplate.from_template(
            """{system_prompt}

用户问题：
{question}

实验计划：
{plan}

请根据实验计划，生成符合 JSON Schema 规范的控制命令，用于执行实验。
"""
        )
        
        # 构建链
        chain = prompt | self.llm | StrOutputParser()
        
        # 生成命令
        try:
            system_prompt = self.prompt_manager.get_combined_prompt(state.scene)
            command_str = chain.invoke({
                "system_prompt": system_prompt,
                "question": state.question,
                "plan": state.plan
            })
            
            # 解析和验证命令
            is_valid, parsed_command = self.command_validator.parse_command(command_str)
            if not is_valid:
                # 尝试提取 JSON 部分
                import re
                json_match = re.search(r'\{[^}]*\}', command_str, re.DOTALL)
                if json_match:
                    command_str = json_match.group(0)
                    is_valid, parsed_command = self.command_validator.parse_command(command_str)
            
            if is_valid:
                state.command = parsed_command
                state.execution_result = "命令执行成功"
                print(f"生成的命令：{parsed_command}")
            else:
                state.error = "生成的命令格式不正确"
                print(f"命令格式不正确：{command_str}")
        except Exception as e:
            state.error = f"执行者出错：{str(e)}"
            print(f"执行者出错：{str(e)}")
        
        return state
    
    def observer_agent(self, state: SimulationState) -> SimulationState:
        """观察者 Agent：观察实验执行结果并提供反馈"""
        print("=== 观察者 Agent 执行 ===")
        
        # 定义观察提示模板
        prompt = ChatPromptTemplate.from_template(
            """你是一个实验观察者，负责观察实验执行结果并提供反馈。

用户问题：
{question}

实验计划：
{plan}

执行的命令：
{command}

执行结果：
{execution_result}

请分析实验执行情况，提供：
1. 执行结果的分析
2. 实验是否达到了预期目标
3. 可能的改进建议
4. 下一步操作建议

反馈应该详细、专业，帮助用户理解实验结果。
"""
        )
        
        # 构建链
        chain = prompt | self.llm | StrOutputParser()
        
        # 生成观察结果
        try:
            observation = chain.invoke({
                "question": state.question,
                "plan": state.plan,
                "command": state.command,
                "execution_result": state.execution_result
            })
            state.observation = observation
            print(f"观察结果：{observation}")
        except Exception as e:
            state.error = f"观察者出错：{str(e)}"
            print(f"观察者出错：{str(e)}")
        
        return state
    
    def run_workflow(self, question, scene="newton_second_law"):
        """运行多智能体工作流"""
        # 创建初始状态
        initial_state = SimulationState(
            question=question,
            scene=scene
        )
        
        # 运行工作流
        try:
            result = self.compiled_graph.invoke(initial_state)
            return result
        except Exception as e:
            print(f"工作流执行出错：{str(e)}")
            return None

# 示例用法
if __name__ == "__main__":
    langgraph_manager = LangGraphManager()
    
    # 测试工作流
    question = "开始牛顿第二定律实验，设置滑块质量为 0.1kg，施加 0.5N 的力"
    result = langgraph_manager.run_workflow(question)
    
    if result:
        print("\n工作流执行结果：")
        print(f"问题：{result.question}")
        print(f"场景：{result.scene}")
        print(f"计划：{result.plan}")
        print(f"命令：{result.command}")
        print(f"执行结果：{result.execution_result}")
        print(f"观察结果：{result.observation}")
        if result.error:
            print(f"错误：{result.error}")
