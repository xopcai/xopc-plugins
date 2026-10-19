---
name: documents
description: "读取和创建真正的 DOCX 文档，整理结构、证据与审阅问题。"
---

# 文档

1. 使用office_read提取文档XML，区分正文、表格和引用，不把XML顺序当作最终分页。
2. 按用户受众和用途组织段落，保留数据来源、日期和不确定项。
3. 使用office_create(format=docx)生成可打开文件；复杂版式在用户项目中使用成熟文档库。
4. 重新读取生成文件核对内容；未经Office或PDF渲染不宣称视觉完全一致。

使用本插件 `analyze_rows` 计算真实数据摘要与加权比较，`render_report` 输出可分享的本地HTML；文档任务可用 `office_read` / `office_create` 读写基础 DOCX/XLSX/PPTX。联网信息通过宿主可用的搜索或浏览器工具获取；账号与平台实际写入使用用户已连接的官方工具。

交付：DOCX文件、正文内容核对与未完成版式项。

按需查看 [领域任务索引](references/domain-map.json) 识别上游任务主题；该索引仅说明范围，不代表存在同名私有工具。
