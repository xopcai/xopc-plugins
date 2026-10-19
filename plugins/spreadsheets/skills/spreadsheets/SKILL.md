---
name: spreadsheets
description: "读取与创建真实 XLSX 表格，执行可复核的数据清理、汇总和比较。"
---

# 电子表格

1. 用office_read读取共享字符串和单元格XML，保留列名、数据类型与时间口径。
2. 按稳定键去重，区分缺失与零；用analyze_rows核对行数、数值摘要和异常。
3. 用office_create(format=xlsx)输出数据表，公式需求交给用户现有表格引擎处理，不伪造计算结果。
4. 重新读取输出并对照样本与汇总，保留输入来源、计算口径和未支持特性。

使用本插件 `analyze_rows` 计算真实数据摘要与加权比较，`render_report` 输出可分享的本地HTML；文档任务可用 `office_read` / `office_create` 读写基础 DOCX/XLSX/PPTX。联网信息通过宿主可用的搜索或浏览器工具获取；账号与平台实际写入使用用户已连接的官方工具。

交付：XLSX文件、数据摘要与核对记录。

按需查看 [领域任务索引](references/domain-map.json) 识别上游任务主题；该索引仅说明范围，不代表存在同名私有工具。
