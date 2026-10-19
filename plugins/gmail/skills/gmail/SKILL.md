---
name: gmail
description: "通过本地 Google OAuth 授权搜索、读取与管理 Gmail 邮件。"
---

# Gmail

使用 `gmail_request`；path 相对于 `/gmail/v1/users/me/`。GET `profile` 确认账号；GET `messages?q=...` 使用 Gmail 搜索语法并URL编码，GET `messages/:id` 取正文。附件 ID 每次读取可能变化，现取现用；标签使用 label ID。发送邮件 POST `messages/send`，body.raw 为 RFC 5322 MIME 的 base64url；回复需原 threadId。先展示收件人、主题和正文，用户确认后发送。OAuth 登录与重连在插件详情中完成。

按需查看 [领域任务索引](references/domain-map.json) 识别上游任务主题；该索引仅说明范围，不代表存在同名私有工具。
