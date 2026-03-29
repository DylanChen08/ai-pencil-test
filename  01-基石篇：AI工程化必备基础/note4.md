已帮你记录好《AI开发技术与作业》,详细内容请点击下方查看:
AI开发技术与作业
会议讨论了AI开发中的关键技术，如function call、prompt等，还介绍了知识库和RAG的原理，并布置了相关作业，具体如下：
- **AI开发流程操作**：
  - **创建文件夹工具**：定义创建文件夹工具，将其与消息一起送模型，指定模型对工具的使用方式，通过prompt指令让模型在workspace目录创建名为test的文件夹。
  - **流式返回处理**：在使用function call时先关闭流式返回，因流式返回参数会在每个chunk中逐渐返回，支持stream的function call需从chunk读取参数，参数返回完毕再执行function render。
  - **函数执行器创建**：创建异步的function runner，获取response中function call的name和arguments，实现创建文件夹功能。
- **AI关键概念讲解**：
  - **function call与tools区别**：tools是function call的升级版，tools支持并行，function call是串行；tools代表工具，function仅代表调用；强大的执行器可通过function call实现多种能力。
  - **知识库和RAG原理**：知识库存储私域知识，因私域知识量大不能全注入prompt，需通过function call动态检索匹配内容，将召回的文档片段拼到prompt中。
- **AI基础及应用**：
  - **AI发展及基础**：AI发展迅速，行业面临挑战；大语言模型核心是文本预测，局限于自然语言，变量命名需用自然语言。
  - **TOKEN与上下文**：个人开发者关注API额度和费用，AI工程落地需关注context的持久化、控制和动态装配。
  - **prompt与function call**：prompt用于引导语言模型按预期回复；function call是agent基础，可让AI生成调用信息，装配执行器响应结构化调用信息，实现实际功能。
- **作业及答疑**：
  - **作业安排**：基于课程内容，配合AI ID搭建简易TUI agent，实现stream模式的function call。
  - **费用及工具**：OpenAI SDK开源，百炼coding plan每月40元有折扣，有9.9元首月体验，注册百炼送100万TOKEN免费额度；推荐用Cursor、VS Code等工具配合开发。
  - **其他答疑**：iflow CLI是Claude code魔改；不建议在工作电脑安装OpenAI，建议建沙箱环境；明天会讲结合AI做创新，有问题可找班主任或1V1交流。
- **任务**
  - **TUI 搭建任务**：基于课上内容，配合 AI ID，用特雷、cursor 或 vs code 插件搭建简易的 TUI agent，实现 stream 模式的方程 call