已帮你记录好《AI前端全栈项目MCP讨论》,详细内容请点击下方查看:
AI前端全栈项目MCP讨论
会议讨论了AI加前端课程中全栈项目的相关内容，重点介绍了MCP和Skill，具体如下：
- **课程整体安排**：
  - **课程顺序**：先从AI相关内容开始讲，AI更偏向服务化能力，后续生成式UI部分会回到前端相关内容，最终落地项目前端render偏重，AI搭建偏轻。
  - **学习建议**：此前课程前端方向较多，若服务端基础了解不足，需动手尝试、解决问题，补全服务端基础知识，以便后续实践更轻松。
- **今日课程目标**：
  - **了解概念**：以MCP为核心，了解MCP和Skill，明白Skill内核是MCP或对其编排。
  - **掌握协议**：深入掌握MCP相关协议，主要实现MCP的Server协议。
  - **开发应用**：尝试开发简单的MCP Server，并赋予简单业务场景，通过AI能力解决开发联调中mock数据问题。
  - **了解Skill**：最后对Skill进行讲解。
- **MCP背景**：
  - **重复开发问题**：开发AI助手需多种能力，不同团队重复打造工具，导致效率低、不具备可移植性。
  - **缺乏服务化**：function call类似本地过程调用，无法通过网络进行服务化，不利于团队共享能力。
  - **类比USB接口**：MCP类似AI的USB接口，统一协议标准，降低开发成本，实现框架解耦。
- **MCP设计架构**：
  - **架构类型**：MCP协议是CS架构，分为MCP client和MCP Server两部分。
  - **核心接口**：client和Server通过标准协议传输，核心是一套接口协议，包含接口方法调用名称，如Toast call。
  - **运行架构**：MCP client一般由agent内置，常见的agent如AIDP、CLI的IDE等。agent实现MCP client后可与MCP service交互，中间涉及传输层协议，分为本地传输协议和Web传输协议（常见HTTP streamable）。
  - **使用流式原因**：调用工具在Server的执行和响应时间长，使用流式可提升应用体验，便于client响应和处理。
- **MCP Server处理**：
  - **请求分类**：MCP Server拿到符合MCP的请求后，根据不同请求类型处理，主要包含tools、Resources、prompt三大类。
  - **tools类**：指某一个方法的调用或一段机器码执行内容。
  - **Resources类**：MCP Server向LLM提供使用TOOLS所需资料和知识，如图片、文档等，MCP client发起resource请求时，Server返回符合内容。
  - **prompt类**：调用由client端的LLM根据用户输入决定，用户可主动触发MCP Server提供的prompt能力，而非让模型决定调用工具。