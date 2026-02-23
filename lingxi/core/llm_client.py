import logging
import os
from typing import Dict, Optional, Any, List

class LLMClient:
    """LLM客户端，用于与大语言模型交互"""

    def __init__(self, config: Dict[str, Any]):
        """初始化LLM客户端

        Args:
            config: 系统配置
        """
        self.config = config
        self.llm_config = config.get("llm", {})
        self.logger = logging.getLogger(__name__)

        self.provider = self.llm_config.get("provider", "openai")
        self.api_key = self.llm_config.get("api_key", "")
        self.model = self.llm_config.get("model", "gpt-4")
        self.temperature = self.llm_config.get("temperature", 0.7)
        self.max_tokens = self.llm_config.get("max_tokens", 2048)
        self.timeout = self.llm_config.get("timeout", 30)

        self.models_config = self.llm_config.get("models", {})
        self.default_model = self.llm_config.get("default_model", "qwen-plus")

        self._init_client()

        self.logger.debug(f"初始化LLM客户端: {self.provider}")
        self.logger.debug(f"默认模型: {self.model}")
        self.logger.debug(f"模型分级配置: {list(self.models_config.keys())}")

    def _init_client(self):
        """初始化客户端"""
        if self.provider == "openai":
            from openai import OpenAI
            api_key = self.api_key
            base_url = self.llm_config.get("base_url", "https://dashscope.aliyuncs.com/compatible-mode/v1")
            self.client = OpenAI(api_key=api_key, base_url=base_url, timeout=self.timeout)

        elif self.provider == "dashscope":
            from openai import OpenAI
            api_key = self.api_key
            base_url = self.llm_config.get("base_url", "https://dashscope.aliyuncs.com/compatible-mode/v1")
            self.client = OpenAI(api_key=api_key, base_url=base_url, timeout=self.timeout)

        elif self.provider == "azure":
            import openai
            openai.api_key = self.api_key
            openai.api_base = self.llm_config.get("base_url")
            self.client = openai

        elif self.provider == "google":
            self.client = None

        else:
            self.client = None

    def select_model(self, task_level: str) -> str:
        """根据任务级别选择模型

        Args:
            task_level: 任务级别（trivial/simple/complex）

        Returns:
            模型名称
        """
        if task_level in self.models_config:
            model_config = self.models_config[task_level]
            model_name = model_config.get("model", self.default_model)
            self.logger.debug(f"任务级别: {task_level}, 选择模型: {model_name}")
            return model_name
        self.logger.debug(f"任务级别: {task_level}, 使用默认模型: {self.default_model}")
        return self.default_model

    def get_model_config(self, task_level: str) -> Dict[str, Any]:
        """获取任务级别对应的模型配置

        Args:
            task_level: 任务级别

        Returns:
            模型配置字典
        """
        if task_level in self.models_config:
            config = self.models_config[task_level].copy()
            config["model"] = config.get("model", self.default_model)
            return config
        return {"model": self.default_model}

    def complete(self, prompt: str, task_level: str = None) -> str:
        """生成文本完成

        Args:
            prompt: 提示文本
            task_level: 任务级别（可选，用于选择模型）

        Returns:
            生成的文本

        Raises:
            Exception: 当API调用失败时
        """
        self.logger.debug(f"生成完成: {prompt[:100]}...")

        try:
            if self.provider == "openai":
                return self._openai_complete(prompt, task_level)
            elif self.provider == "dashscope":
                return self._dashscope_complete(prompt, task_level)
            elif self.provider == "azure":
                return self._azure_complete(prompt, task_level)
            elif self.provider == "google":
                return self._google_complete(prompt, task_level)
            else:
                return self._mock_complete(prompt, task_level)

        except Exception as e:
            self.logger.error(f"生成失败: {e}")
            # 直接抛出异常，让调用者处理
            raise

    def chat_complete(self, messages: List[Dict[str, str]], task_level: str = None, **kwargs) -> str:
        """聊天完成

        Args:
            messages: 消息列表
            task_level: 任务级别（可选，用于选择模型）
            **kwargs: 其他参数

        Returns:
            生成的文本

        Raises:
            Exception: 当API调用失败时
        """
        self.logger.debug(f"聊天完成，消息数: {len(messages)}")

        try:
            if self.provider == "openai":
                return self._openai_chat_complete(messages, task_level, **kwargs)
            elif self.provider == "dashscope":
                return self._dashscope_chat_complete(messages, task_level, **kwargs)
            elif self.provider == "azure":
                return self._azure_chat_complete(messages, task_level, **kwargs)
            elif self.provider == "google":
                return self._google_chat_complete(messages, task_level, **kwargs)
            else:
                return self._mock_chat_complete(messages, task_level, **kwargs)

        except Exception as e:
            self.logger.error(f"聊天完成失败: {e}")
            # 直接抛出异常，让调用者处理
            raise
    
    def _openai_complete(self, prompt: str, task_level: str = None) -> str:
        """使用OpenAI API生成完成

        Args:
            prompt: 提示文本
            task_level: 任务级别

        Returns:
            生成的文本
        """
        model = self.select_model(task_level) if task_level else self.model
        model_config = self.get_model_config(task_level) if task_level else {}

        response = self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "你是灵犀智能助手，一个聪明、友好的AI助手。"},
                {"role": "user", "content": prompt}
            ],
            temperature=model_config.get("temperature", self.temperature),
            max_tokens=model_config.get("max_tokens", self.max_tokens),
            timeout=self.timeout,
        )

        return response.choices[0].message.content

    def _dashscope_complete(self, prompt: str, task_level: str = None) -> str:
        """使用阿里云百炼API生成完成

        Args:
            prompt: 提示文本
            task_level: 任务级别

        Returns:
            生成的文本
        """
        model = self.select_model(task_level) if task_level else self.model
        model_config = self.get_model_config(task_level) if task_level else {}

        response = self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "你是灵犀智能助手，一个聪明、友好的AI助手。"},
                {"role": "user", "content": prompt}
            ],
            temperature=model_config.get("temperature", self.temperature),
            max_tokens=model_config.get("max_tokens", self.max_tokens),
            timeout=self.timeout
        )

        return response.choices[0].message.content

    def _azure_complete(self, prompt: str, task_level: str = None) -> str:
        """使用Azure OpenAI API生成完成

        Args:
            prompt: 提示文本
            task_level: 任务级别

        Returns:
            生成的文本
        """
        model = self.select_model(task_level) if task_level else self.model
        model_config = self.get_model_config(task_level) if task_level else {}

        response = self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "你是灵犀智能助手，一个聪明、友好的AI助手。"},
                {"role": "user", "content": prompt}
            ],
            temperature=model_config.get("temperature", self.temperature),
            max_tokens=model_config.get("max_tokens", self.max_tokens),
            timeout=self.timeout
        )

        return response.choices[0].message.content

    def _google_complete(self, prompt: str, task_level: str = None) -> str:
        """使用Google Gemini API生成完成

        Args:
            prompt: 提示文本
            task_level: 任务级别

        Returns:
            生成的文本
        """
        model = self.select_model(task_level) if task_level else self.model
        return f"Google Gemini 响应 ({model}): " + prompt[:50]

    def _mock_complete(self, prompt: str, task_level: str = None) -> str:
        """模拟LLM响应，用于测试

        Args:
            prompt: 提示文本
            task_level: 任务级别

        Returns:
            模拟的响应
        """
        self.logger.warning("使用模拟LLM响应")

        model = self.select_model(task_level) if task_level else self.model

        if "分类" in prompt:
            return f'''
            {{
                "task_type": "信息查询",
                "confidence": 0.9,
                "description": "用户查询信息",
                "model": "{model}"
            }}
            '''
        else:
            return f"这是一个模拟的LLM响应（使用模型：{model}）。在实际使用中，这里会调用真实的LLM API。"

    def _openai_chat_complete(self, messages: List[Dict[str, str]], task_level: str = None, **kwargs) -> str:
        """使用OpenAI API聊天完成

        Args:
            messages: 消息列表
            task_level: 任务级别
            **kwargs: 其他参数

        Returns:
            生成的文本
        """
        model = self.select_model(task_level) if task_level else self.model
        model_config = self.get_model_config(task_level) if task_level else {}

        response = self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=model_config.get("temperature", kwargs.get("temperature", self.temperature)),
            max_tokens=model_config.get("max_tokens", kwargs.get("max_tokens", self.max_tokens)),
            timeout=kwargs.get("timeout", self.timeout)
        )

        return response.choices[0].message.content

    def _dashscope_chat_complete(self, messages: List[Dict[str, str]], task_level: str = None, **kwargs) -> str:
        """使用阿里云百炼API聊天完成

        Args:
            messages: 消息列表
            task_level: 任务级别
            **kwargs: 其他参数

        Returns:
            生成的文本
        """
        model = self.select_model(task_level) if task_level else self.model
        model_config = self.get_model_config(task_level) if task_level else {}

        response = self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=model_config.get("temperature", kwargs.get("temperature", self.temperature)),
            max_tokens=model_config.get("max_tokens", kwargs.get("max_tokens", self.max_tokens)),
            timeout=kwargs.get("timeout", self.timeout)
        )

        return response.choices[0].message.content

    def _azure_chat_complete(self, messages: List[Dict[str, str]], task_level: str = None, **kwargs) -> str:
        """使用Azure OpenAI API聊天完成

        Args:
            messages: 消息列表
            task_level: 任务级别
            **kwargs: 其他参数

        Returns:
            生成的文本
        """
        model = self.select_model(task_level) if task_level else self.model
        model_config = self.get_model_config(task_level) if task_level else {}

        response = self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=model_config.get("temperature", kwargs.get("temperature", self.temperature)),
            max_tokens=model_config.get("max_tokens", kwargs.get("max_tokens", self.max_tokens)),
            timeout=kwargs.get("timeout", self.timeout)
        )

        return response.choices[0].message.content

    def _google_chat_complete(self, messages: List[Dict[str, str]], task_level: str = None, **kwargs) -> str:
        """使用Google Gemini API聊天完成

        Args:
            messages: 消息列表
            task_level: 任务级别
            **kwargs: 其他参数

        Returns:
            生成的文本
        """
        model = self.select_model(task_level) if task_level else self.model
        return f"Google Gemini 聊天响应 ({model}): " + str(len(messages)) + " 条消息"

    def _mock_chat_complete(self, messages: List[Dict[str, str]], task_level: str = None, **kwargs) -> str:
        """模拟聊天完成，用于测试

        Args:
            messages: 消息列表
            task_level: 任务级别
            **kwargs: 其他参数

        Returns:
            模拟的响应
        """
        self.logger.warning("使用模拟聊天响应")

        model = self.select_model(task_level) if task_level else self.model

        last_message = messages[-1].get("content", "") if messages else ""

        if "分类" in last_message:
            return f'''
            {{
                "task_type": "信息查询",
                "confidence": 0.9,
                "description": "用户查询信息",
                "model": "{model}"
            }}
            '''
        else:
            return f"这是一个模拟的聊天响应（使用模型：{model}）。在实际使用中，这里会调用真实的LLM API。"