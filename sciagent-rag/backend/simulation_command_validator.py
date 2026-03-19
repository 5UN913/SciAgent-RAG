import json
import os
from jsonschema import validate, ValidationError

class CommandValidator:
    def __init__(self):
        # 加载 JSON Schema
        schema_path = os.path.join(os.path.dirname(__file__), "schemas", "simulation_command.json")
        with open(schema_path, "r", encoding="utf-8") as f:
            self.schema = json.load(f)
    
    def validate_command(self, command):
        """验证命令是否符合 JSON Schema 规范"""
        try:
            validate(instance=command, schema=self.schema)
            return True, "命令验证通过"
        except ValidationError as e:
            return False, f"命令验证失败：{e.message}"
    
    def parse_command(self, command_str):
        """解析命令字符串为 JSON 对象"""
        try:
            command = json.loads(command_str)
            return True, command
        except json.JSONDecodeError as e:
            return False, f"JSON 解析失败：{e}"

# 示例用法
if __name__ == "__main__":
    validator = CommandValidator()
    
    # 测试有效命令
    valid_command = {
        "command": "start_simulation",
        "target": "newton_second_law",
        "parameters": {
            "mass": 0.1,
            "force": 0.5
        },
        "reasoning": "开始牛顿第二定律实验"
    }
    
    is_valid, message = validator.validate_command(valid_command)
    print(f"有效命令测试：{is_valid}, {message}")
    
    # 测试无效命令
    invalid_command = {
        "command": "invalid_command",
        "target": "slider"
    }
    
    is_valid, message = validator.validate_command(invalid_command)
    print(f"无效命令测试：{is_valid}, {message}")
