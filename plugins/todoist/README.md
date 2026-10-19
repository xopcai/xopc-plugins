# Todoist 待办助手

读取项目与待办、整理每日计划，并按用户明确要求创建或完成任务。

## 安装与使用

在 XOPC 扩展市场安装，默认供所有 Agent 使用。安装时登录账号或暂时跳过；之后可从详情页继续授权。

## 实现范围

Use todoist_action with action=tasks or projects for real account data. Connect an API token in plugin details or Skip for now and return later. Follow returned next_cursor values; one page is not the complete task set.
1. Establish the requested project and time horizon. Read tasks and project identifiers rather than guessing names or IDs.
2. For daily/weekly planning, distinguish overdue, dated and undated work; preserve due dates and recurring schedules. Do not treat missing dates as today. Cite task IDs/links when useful without exposing account secrets.
3. For an explicitly requested new task, call add_task with content, optional verified projectId, and confirm=true. Read tasks back to verify. Do not create dozens of tasks from a speculative plan without the user's request.
4. Complete only a task explicitly identified by the user. Use complete_task with its real taskId and confirm=true, then verify the active list. Never bulk-complete or delete tasks as cleanup.
This edition supports projects/tasks, task creation and completion through Todoist API v1. It does not offer deletion, team administration, billing or autonomous background scheduling.

## 来源与许可

XOPC 原创工作流及适配代码，Apache-2.0。第三方运行时许可证见 THIRD_PARTY_NOTICES.txt。官方服务、订阅和工作空间权限由相应服务商管理。
