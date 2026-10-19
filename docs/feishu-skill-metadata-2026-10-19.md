# 飞书技能元数据修复（1.0.6）

## 修复

26 项飞书技能从 Accio 继承了嵌套 `metadata.requires` 对象，不符合 portable 插件的字符串元数据约束。它同时要求全局 `lark-cli`，与 XOPC 通过 Store 资源和 MCP `cli_run` 托管执行 CLI 的方式冲突。

删除这 26 项技能的全局 CLI 依赖声明，保留 `cliHelp` 字符串和正文中的共享技能引用、托管执行说明。同步删除 Skill 构建器示例模板中的同类声明。宿主解析、授权和执行机制无修改。

插件版本和 catalog 更新到 1.0.6。Store 发布包 SHA-256：

`4365d4d66d4720fc7a55343445a82ec67c3c85609fd6485b036b5f13f33792f8`

6 个平台的 CLI 资源继续使用已有 Store 地址及校验摘要。

## 验证

- `pnpm validate` 通过；`pnpm test`：27 项通过，包括使用相邻 XOPC 源码真实安装解析器检查全部 27 项 portable 技能的回归测试。该集成用例在缺少相邻 XOPC checkout 时明确跳过。
- `scripts/verify-feishu-store.mts` 在临时状态目录启动真实鉴权 Gateway，从公开 Store 检查和安装 1.0.6，准备资源、跳过授权。安装器和 pi 运行时均识别 27 项技能，诊断为零；未授权私有工具保持不可用。
- 同一独立环境的 Store 固定版本 CLI 对 `calendar --help`、`docs --help`、`sheets --help` 均正常返回。此项是无需账号的 CLI 执行验证，不是登录后的 MCP 业务调用。
- 用户浏览器从 Store 更新本地飞书插件到 1.0.6，按用户要求跳过授权。实际安装收据的来源和摘要与 Store 一致；技能目录和 pi 运行时均加载全部 27 项技能。
- `pnpm store:check`：expectedPublished=14、actualPublished=14，updates/unpublish/errors 均为空。

用户明确要求跳过授权测试，因此本轮没有验收新版本真实账号、日历等业务 API 或对话中的已授权工具调用。宿主按安装版本隔离账号凭据，新版本当前显示需要授权；旧版本授权文件未删除。用户可在详情页连接账号。

## 维护

xopc-plugins 是唯一源码及目录数据源；Store 仅发布构建产物。无 Store 服务端或 XOPC 宿主代码改动，无需部署服务。提交后不 push。
