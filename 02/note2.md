已帮你记录好《MCP架构相关讨论及计划》,详细内容请点击下方查看:
MCP架构相关讨论及计划
会议讨论了MCP架构中prompt与tools的区别、client和Server的职责以及通信流程，并计划搭建MCP Server Demo，具体如下：
- **prompt与tools区别**：
  - **决定方式**：Server能力及实现由用户决定，用户可主动触发MCP Server的prop能力，而非由模型决定调用工具。
  - **调用情况**：若以Toast方式输入，大语言模型处理任务时可能不调用工具；若用prompt指定调用工具，大语言模型会按指令生成包含相关分析的回答。
  - **本质**：prompt、tools和TOEF是协议人为分类方式，内核均通过prompt加方式call实现。
- **client职责**：
  - **建立连接**：建立和MCP Server的连接，包括调用接口、保活、检查服务状态等。
  - **解耦调用**：通过标准MCP协议接口，将client与具体工具实现解耦，可调用任意工具。
  - **响应返回**：响应MCP Server的返回，处理查询状态、异常情况等，有标准error code让大模型感知工具执行任务情况。
  - **能力协商**：告知MCP Server自身支持的协议版本和能力。
- **Server职责**：
  - **能力暴露**：向client暴露自身拥有的tools、resources和prompts等能力。
  - **响应请求**：响应client的请求并执行。
  - **返回结果**：返回标准化的处理结果。
- **通信协议**：
  - **通信方式**：有STD IO（本地通信）、stream、ATP，早期有SSE，现换成streamable通信方式。
- **通信流程**：
  - **注册建联**：client向MCP Server注册，进行初始化和建连，询问Server能力，Server以标准JSON结构返回。
  - **调用执行**：client将Server能力描述告知大语言模型，用户输入后，大语言模型决策并通过function call调用client能力，client将请求转发到MCP Server，Server执行并返回结果。
  - **结果处理**：client将返回内容通过Openai的message发给AI，AI输出最终内容。
- **后续计划**：
  - **搭建Demo**：尝试搭建一个最基础的MCP Server，后续补全其能力。