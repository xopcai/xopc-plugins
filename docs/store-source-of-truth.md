# xopc-plugins：官方插件唯一数据源

所有官方插件先在本仓库维护，再发布到 Store。Store 是构建产物和目录状态的分发端；XOPC 宿主消费 Store，不在宿主或 xopc-platform 另维护官方插件列表。

## 权威文件

- `catalog.json` 的 `plugins`：33 个有源码的插件条目。每项明确 `storeStatus` 和 `storeDecisionReason`；当前 14 个 published、19 个 unpublished。下架不删除源码。
- `catalog.json` 的 `retiredPackages`：15 个历史测试/内部条目的退役政策，必须保持 unpublished。它们不属于新插件源码目录，也不进入发布列表。
- `plugins/<name>/`：唯一可编辑的 manifest、Skill、工具、图标、授权声明、资源 URL/摘要和许可。版本必须与 catalog 一致。
- `.agents/plugins/marketplace.json`：只包含 reviewed published 条目的派生索引，不能另行决定上架范围。
- `dist/`：可重建的发布产物，不手动编辑。线上版本必须符合构建摘要；同版本内容变化必须先提升版本。

README、调研与 reports 是说明和历史证据，不替代 catalog 的当前状态。历史报告中的数量是当时快照。

## 维护顺序

1. 在仓库修改插件源码、版本或 catalog 上下架政策，保留具体理由与验证证据。
2. `pnpm marketplace:sync` 只同步派生 marketplace。不要仅为同步索引运行全部 runtime generate，避免重写已发布程序。验证 `pnpm validate`、`pnpm test`。
3. 新增/升级的构建产物使用 `pnpm publish:store -- --dry-run` 审查后发布，或使用 stage-release + 服务端发布器。发布入口只接受 catalog 明确审查为 published 的包。
4. `pnpm store:sync` 默认只输出计划。确认计划后以维护者环境变量 `XOPC_ADMIN_API_KEY` 执行 `pnpm store:sync -- --apply`，将已知撤下/退役条目下架，并纠正已上架包描述。
5. `pnpm store:check` 校验公开 plugin/extension 目录与 catalog 的名称、类型、版本、描述和上下架政策。当前应是 14 项、零差异。

同步脚本不会代替构建发布：缺包或版本不一致会在任何写入前报错，要求先发布对应版本。Store 上出现 catalog 不认识的包也会报错，先将其纳入仓库审查，不自动删除第三方条目。写入前复核全部目标的包 ID 和版本，遇到并发改变立即停止。上架归档包必须先在本仓库恢复 published、补全验证并发布新的审查版本（已下架的旧版本仍占用原版本号）；不能只改生产数据库。

发布服务端维护凭据只通过环境变量/临时维护进程使用，不提交 API Key、用户 Token、Client Secret、授权回调或账号数据。

## 旧入口

xopc-platform 的 `scripts/store/upload-extensions-from-xopc.mjs` 已停用并直接返回失败，提示使用本仓库。不得继续从宿主 extensions 目录批量生成第二份官方市场。宿主 Extension 运行机制和第三方插件自由安装仍保留。

本轮只更新维护脚本和仓库政策，没有修改用户安装、账号授权或宿主运行行为。

验证结果：26 项测试通过；真实 Store 的同步 apply 为幂等空操作，随后 store:check 返回 expectedPublished=14、actualPublished=14，updates/unpublish/errors 均为空。
