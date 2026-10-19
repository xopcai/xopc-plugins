# 日历文件助手

读取本地或公开订阅的 ICS 日历，展开重复日程、例外日期并检查时间冲突。

## 安装与使用

在 XOPC 扩展市场安装，默认供所有 Agent 使用。无需云账号；在对话里提供资料、文件路径或公开链接即可使用。

## 实现范围

Use calendar_read_ics to read one user-supplied ICS file/text or a public HTTPS subscription. This plugin never changes or logs into a calendar account.
1. Establish the user's date range and timezone. Supply ISO from/to timestamps with explicit UTC or numeric offsets. Limit a range to 90 days.
2. Inspect events, recurrence exceptions, cancellations, all-day status, timezone warnings and conflicts. Missing VTIMEZONE definitions require a complete export; do not silently reinterpret named zones.
3. Explain that conflict entries refer to indices in the returned event list. All-day entries are not treated as busy meetings. Confirm floating-time interpretation before making scheduling decisions.
4. Produce an agenda, overlap list or free-time suggestions with explicit dates and timezone. A subscription can be stale, incomplete or private; report data limitations.
Use the connected Feishu/DingTalk/other calendar plugin for live account queries or changes. Do not put private subscription tokens in public URLs or claim an ICS suggestion has booked a meeting.

## 来源与许可

XOPC 原创工作流及适配代码，Apache-2.0。第三方运行时许可证见 THIRD_PARTY_NOTICES.txt。官方服务、订阅和工作空间权限由相应服务商管理。
