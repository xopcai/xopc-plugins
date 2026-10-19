# 33 个插件价值与可用性复核（2026-10-19）

结论：本轮从 33 个公开插件中保留 14 个，下架 19 个；上一轮 15 个测试/内部条目继续下架。源码、历史版本、归档保留，不卸载用户已安装插件，不修改用户账号授权。

## 本轮标准

有 MCP 名称或 node 程序并不等于有独立业务能力。逐项读取每包的 Skill、MCP 声明和实际代码，比较打包运行时 SHA-256，核对工具能否交付其宣称的结果。纯指导 Skill 可作为技能资源存在，但不在本轮作为独立精品插件推荐。

保留项分两类：本地独立执行工具，以及真实服务接入适配器。账号插件仍要求用户具备服务账号、权限或相应订阅。未执行的生产账号验证明确标注，不把 HTTP 401、OAuth challenge、模拟令牌测试写成真实账号业务验收。

## 下架依据

15 个 independent-workflow 包的 `mcp/local.mjs` SHA-256 完全一致，工具都只有 `analyze_rows`、`render_report`、`office_read`、`office_create`。实际没有各自的平台账号连接、检索、采集或执行器。Office 三项也并非纯空壳，能够生成基础文件，但三个包工具完全重复，读取主要返回 XML，缺少成熟格式处理和 Office/渲染兼容验收，因此先撤下，待合并成真正可交付的办公文件插件。

Expo 主要是开发指导 Skill。Gmail 有真实 API/OAuth 实现，但普通用户仍需自行申请 Google Desktop Client ID/Secret，当前缺少平台应用和真实账号验收，先暂缓公开推荐。OpenBoost 的接口存在，但依赖第三方付费数据，缺少业务输出验收，本轮不把它保留为已经可交付的精品。

Zoom 是实际安装后测试原生授权失败，错误为 `Authorization server does not support dynamic client registration`；不能因为它是官方 MCP 就判定当前 XOPC 清单可用。Notion 和 Supabase 的同样流程成功生成官方授权入口。

## 全量逐项结果

| 插件 | 决策 | 实际价值或下架原因 | 验证层次 |
| --- | --- | --- | --- |
| 1688 生意助手 (`1688-seller`) | 下架 | 没有 1688 API、店铺连接或商品执行器；只是在相同通用工具上叠加经营建议 Skill。 | 逐项读取 Skill、MCP 清单与实现；参考本轮远程授权探测 |
| 跨境采购助手 (`alibaba-buyer`) | 下架 | 没有采购/供应商检索数据源，仅通用表格统计和采购指导。 | 逐项读取 Skill、MCP 清单与实现；参考本轮远程授权探测 |
| 国际站经营助手 (`alibaba-seller`) | 下架 | 没有国际站店铺接入或询盘执行工具，仅通用统计与 Skill。 | 逐项读取 Skill、MCP 清单与实现；参考本轮远程授权探测 |
| 日历文件助手 (`calendar-ics`) | 保留 | 重复日程、例外日期、冲突计算；区别于在线日历账户服务。 | 本地真实 ICS 测试 |
| 电商运营自动化 (`commerce-automation`) | 下架 | 没有触发器、调度或平台执行器，不能交付宣称的自动化运行链路。 | 逐项读取 Skill、MCP 清单与实现；参考本轮远程授权探测 |
| 数据工具箱 (`data-toolkit`) | 保留 | 独立 CSV 统计与 JSON 路径提取工具。 | 打包 MCP 实际调用测试 |
| 钉钉 (`dingtalk`) | 保留 | 官方 CLI 的托管准备、账号登录与真实工具执行。 | 此前用户账号完整链路；本轮回归测试 |
| 文档 (`documents`) | 下架 | 有基础 DOCX/Office XML 读写，但与另 14 包工具及程序完全相同，缺少文档渲染兼容验收；待统一为成熟办公文件插件。 | 逐项读取 Skill、MCP 清单与实现；参考本轮远程授权探测 |
| 欧洲电商工作室 (`europe-commerce`) | 下架 | 没有跨站迁移或上架集成，只是通用工具与本地化说明。 | 逐项读取 Skill、MCP 清单与实现；参考本轮远程授权探测 |
| Expo 移动开发 (`expo`) | 下架 | 主要是开发指导 Skill，没有插件托管的独立执行/服务能力；可留作技能资源，先退出插件市场。 | 逐项读取 Skill、MCP 清单与实现；参考本轮远程授权探测 |
| 飞书 (`feishu`) | 保留 | 官方 CLI 的托管资源、扫码/手填配置、用户授权与实际工具执行。 | 此前用户身份读取；日历授权不作为本轮已验收能力 |
| 文件整理助手 (`file-organizer`) | 保留 | 文件预览、指纹校验、不覆盖移动、日志撤销。 | 真实模型对话与独立文件读回 |
| GEO 与搜索研究 (`geo-research`) | 下架 | 没有独立搜索可见性测量、引用追踪或采集后端，只是分析指导。 | 逐项读取 Skill、MCP 清单与实现；参考本轮远程授权探测 |
| Gmail (`gmail`) | 下架 | 确有 Gmail API 和 OAuth 代码，但仍要求用户自行注册 Google Client ID/Secret，缺少平台应用及真实账号验收，先下架待简化接入。 | 逐项读取 Skill、MCP 清单与实现；参考本轮远程授权探测 |
| 多渠道询盘工作台 (`inquiry-desk`) | 下架 | 没有多渠道会话连接/收件或回复执行器，只分析用户手工提供数据。 | 逐项读取 Skill、MCP 清单与实现；参考本轮远程授权探测 |
| 知识库 (`knowledge-base`) | 下架 | 没有知识索引、检索/引用工具；实际工具只有通用统计/Office，已有 Obsidian/剪藏可提供实际检索。 | 逐项读取 Skill、MCP 清单与实现；参考本轮远程授权探测 |
| 商机雷达 (`lead-radar`) | 下架 | 没有商机采集或追踪后端，无法按插件声明独立提供商机来源。 | 逐项读取 Skill、MCP 清单与实现；参考本轮远程授权探测 |
| Notion 知识与会议 (`notion-office`) | 保留 | 官方远程 MCP，直接浏览器 OAuth，无用户自建应用要求。 | 本轮宿主原生 OAuth challenge；未进行账号业务验收 |
| Obsidian 本地笔记 (`obsidian`) | 保留 | 指定笔记库的搜索、读取、双链和明确确认后的新建笔记。 | 真实文件夹读写与边界测试 |
| OpenBoost 跨境数据 (`openboost`) | 下架 | 有真实第三方 OAuth 接口，但依赖第三方付费订阅，尚无真实业务结果验收；不能把 HTTP 401 当作可交付数据证明。 | 逐项读取 Skill、MCP 清单与实现；参考本轮远程授权探测 |
| PDF 阅读与 OCR (`pdf-reader`) | 保留 | 独立 PDF 文本提取与本地中英文扫描 OCR。 | 离线真实扫描件与真实模型对话 |
| 演示文稿 (`presentations`) | 下架 | 基础 PPTX ZIP/XML 生成与文档/表格完全共用工具，未完成 Office/渲染验收，不作为精品演示插件保留。 | 逐项读取 Skill、MCP 清单与实现；参考本轮远程授权探测 |
| Readwise 阅读收集箱 (`readwise-reader`) | 保留 | Reader API 的阅读库、标签查询与确认后的文章保存。 | 官方 API 核查、未授权 401、适配测试；无生产账号验收 |
| RSS 阅读与简报 (`rss-reader`) | 保留 | RSS/Atom 解析、OPML、去重及日期过滤。 | 打包 MCP 与真实内容解析测试 |
| Shopify 运营 (`shopify`) | 下架 | 无 Shopify 账号或 API 接入，仅相同通用工具与后台操作说明。 | 逐项读取 Skill、MCP 清单与实现；参考本轮远程授权探测 |
| SHOPLINE 运营 (`shopline`) | 下架 | 无 SHOPLINE 账号或 API 接入，仅相同通用工具与操作说明。 | 逐项读取 Skill、MCP 清单与实现；参考本轮远程授权探测 |
| 网站搭建 (`site-builder`) | 下架 | 实际只有 HTML 证据报告生成，没有网站项目构建、预览或部署能力。 | 逐项读取 Skill、MCP 清单与实现；参考本轮远程授权探测 |
| 电子表格 (`spreadsheets`) | 下架 | 基础 XLSX ZIP/XML 读写与文档/演示完全重复，没有公式计算/表格引擎或 Office 兼容验收。 | 逐项读取 Skill、MCP 清单与实现；参考本轮远程授权探测 |
| Supabase 开发平台 (`supabase`) | 保留 | 官方 MCP 的数据库/项目能力及原生浏览器 OAuth。 | 本轮宿主原生 OAuth challenge；未进行账号业务验收 |
| Todoist 待办助手 (`todoist`) | 保留 | Todoist API 的项目/任务查询、确认新增/完成任务。 | 官方 API 核查、未授权 401、适配测试；无生产账号验收 |
| 网页剪藏 (`web-clipper`) | 保留 | 公开网页正文提取和带出处的本地剪藏与检索。 | 真实 HTML、剪藏文件及 MCP 调用测试 |
| 语雀 (`yuque`) | 保留 | 直接调用语雀 API，并用用户接口校验 Token。 | 公开真实接口 401、鉴权与请求适配测试；需用户 Token |
| Zoom 协作与开发 (`zoom`) | 下架 | 本轮原生授权实际失败：Authorization server does not support dynamic client registration；当前清单没有可用 Client 配置，先下架。 | 逐项读取 Skill、MCP 清单与实现；参考本轮远程授权探测 |

## 验证与发布防护

- 本轮完整 `pnpm test` 23 项通过，包含真实离线 OCR、文件移动/撤销、RSS、ICS、笔记库、剪藏、CSV/JSON、提供商适配和账号隔离。
- 通过真实鉴权 Gateway 从 Store 安装 Notion、Supabase、Zoom 后触发原生 OAuth：前两个返回官方授权地址，Zoom 失败；没有扫描二维码或批准新账号权限。
- Todoist、Readwise、语雀的公开 API 返回真实未授权响应；这仅证明入口存在。业务适配测试使用合成令牌，不能替代各自生产账号验收。
- `pnpm publish:store -- --dry-run` 只选择 14 个公开包；19 个撤下的包不再进入默认发布。未审查状态会拒绝发布，明确撤下的包也无法通过 stage-release 打包进入发布目录。
- `.agents/plugins/marketplace.json` 同步只列 14 个；本地 catalog 保留全部 33 项及逐项 `storeStatus`、`storeDecisionReason`，以便继续改进，不通过删除源码伪造历史。
- Store 下架使用有审核日志的管理接口。操作前后检查所有版本数量、latestVersionId 与每份归档摘要，完整审计存服务器 `/var/www/xopc-platform/backups/store-value-audit-2026-10-19/`。

机器证据在 `reports/value-audit-2026-10-19/`。此前 PDF/文件整理真实模型对话结果在 `reports/office-v2-2026-10-19/`。本轮没有重跑全部账号的生产业务，也没有宣称复杂 Office 排版已通过验收。

## 官方接口文档

[Notion MCP](https://www.notion.com/help/notion-mcp)、[Supabase MCP](https://supabase.com/docs/guides/ai-tools/mcp)、[Zoom MCP](https://developers.zoom.us/docs/mcp/servers/)、[Todoist API v1](https://developer.todoist.com/api/v1/)、[Readwise Reader API](https://readwise.io/reader_api)。这些文档支持服务能力和接入方式；是否适用于本插件仍以代码、宿主真实授权流程和测试证据为准。
