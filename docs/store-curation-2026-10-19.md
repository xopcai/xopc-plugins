# 插件市场清理（2026-10-19）

用户要求移除或隐藏无价值条目。本轮使用 Store 自带管理接口执行 **unpublish**，没有删除包、版本、安装实例或原始文件，也没有修改宿主的插件/Extension 机制。

| 分类 | 下架包 | 原因 |
| --- | --- | --- |
| 回归测试（4） | xopc-plugin-lab-codex、xopc-plugin-lab-claude、xopc-plugin-auth-lab、xopc-extension-lab | 合成数据测试工具，不向真实用户推荐 |
| 绘图配置（5） | dashscope、fal、google、minimax、openai | 已有绘图设置入口，不应作为独立用户插件重复曝光 |
| 内置组件（3） | feishu-tools、telegram、weixin | 分别归入内置通道能力；独立飞书插件 feishu 保留 |
| 语音配置（2） | groq-stt、tts-local-cli | 属于语音设置/适配组件 |
| 待修复功能（1） | synapse | 有独立产品价值，但当前发布缺少 SHA-256，详情返回 HTTP 409，不能安全安装 |

11 个旧内部 Extension 发布条目本身缺少完整性摘要，不能当作已可用插件保留在市场。不是所有 Extension 都没有价值；将来通过独立功能验收的 Extension 仍可以在产品层作为插件上架。

操作前读取精确目标的包与所有版本记录，核对公开管理 API 中的包 ID，保存快照并计算每份原始文件的 SHA-256。下架后验证包状态为 unpublished、latestVersionId 未改变、版本数量不变、所有归档文件摘要不变。Store 管理接口为每个包记录了审核日志和原因。

服务器审计备份：`/var/www/xopc-platform/backups/store-curation-2026-10-19/`（before.json、result.json）。这些完整快照保留在服务器，不提交到仓库。精简核查结果见 `reports/office-v2-2026-10-19/store-curation.json`。

公开目录核查：正式 plugin 33 个、extension 0 个；15 个下架目标不再出现在公开目录，公开包详情为 404。PDF OCR、文件整理、钉钉、飞书、语雀和网页剪藏详情仍可访问，且有完整性摘要。已安装插件不被卸载，原有授权不被更改。

下架会阻止新的 Store 安装，不只是隐藏卡片。后续回归测试应使用隔离测试 Store 或经审核的本地 fixture；恢复公开测试包必须是明确的临时维护操作，并在测试后重新下架。Synapse 需先补全发布摘要、完成真实安装和工具调用验收，再考虑重新发布。不要通过批量上传旧 Extension 目录让这些条目重新出现。
