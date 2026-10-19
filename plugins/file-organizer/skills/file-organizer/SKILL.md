---
name: file-organizer
description: 在用户选定的本地文件夹内预览分类整理，确认后移动文件或撤销上次整理。适用于下载目录、附件和资料归档。
---

# File Organizer

Use file_inventory on the folder the user selected. It lists one level; it does not recursively scan subfolders or hidden files. Select the intended files, then call file_plan with mode=type or mode=month (UTC modification month, not document date).

Show the actual source→destination mapping before moving. A preview has not changed any user files. Apply the returned planId and exact digest only after the user approves that mapping, using confirm=true. The runtime refuses symlinks, collisions, files changed since preview and existing destinations. It retains a no-clobber undo journal; interrupted plans must be reviewed/undone before making a fresh plan.

Use file_undo with the original plan ID when the user requests reversal. Undo never overwrites new or edited files. If an original/destination changed, report the conflict and leave it intact; do not delete it to make a retry work. Empty category folders are retained. Files remain on the same filesystem; cross-volume moves and deletion are unsupported.

Report files moved/restored, skipped items, conflicts and the plan ID. Do not describe preview as successful execution. Do not reorganize plugin state folders or arbitrary system directories.
