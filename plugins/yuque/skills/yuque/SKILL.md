---
name: yuque
description: "使用语雀 Access Token 检索知识库、读取和编辑文档。"
---

# 语雀

调用 `yuque_request`，path 相对于 `/api/v2/`。先 GET `user` 确认身份；GET `users/:login/repos` 获取知识库；GET `repos/:namespace/docs` 获取文档列表；GET `repos/:namespace/docs/:id` 读取文档。修改前先读取原文并说明变更，POST/PUT 的 body 使用语雀公开 API 字段。命名空间和文档标识必须来自真实返回。Token 只在插件详情输入。

按需查看 [领域任务索引](references/domain-map.json) 识别上游任务主题；该索引仅说明范围，不代表存在同名私有工具。
