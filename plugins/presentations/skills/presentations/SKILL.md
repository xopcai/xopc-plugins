---
name: presentations
description: "从结构化大纲创建真正的 PPTX 演示文稿并读取已有幻灯片内容。"
---

# 演示文稿

1. 先明确受众、结论、展示时长和证据，按每页一个主张组织叙事。
2. 每页提供标题、关键证据与来源；图表必须有单位、日期和数据来源。
3. 用office_create(format=pptx)生成基础演示文件；专业主题使用用户项目的演示工具迭代。
4. 用office_read核对页数和文案；未经渲染不宣称排版验收通过。

使用本插件 `analyze_rows` 计算真实数据摘要与加权比较，`render_report` 输出可分享的本地HTML；文档任务可用 `office_read` / `office_create` 读写基础 DOCX/XLSX/PPTX。联网信息通过宿主可用的搜索或浏览器工具获取；账号与平台实际写入使用用户已连接的官方工具。

交付：PPTX文件、页面大纲、内容核对记录。

按需查看 [领域任务索引](references/domain-map.json) 识别上游任务主题；该索引仅说明范围，不代表存在同名私有工具。
