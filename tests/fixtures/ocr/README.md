# OCR fixture

`bilingual-scan.pdf` is an XOPC-generated, one-page image-only PDF. It has no embedded text layer. The raster contains four test lines: `XOPC OCR TEST 2026`, `办公扫描件识别测试`, `发票金额 1234.56 元`, and `会议日期 2026-10-19`. It contains no user documents or account data. Text was rendered using the local macOS STHeiti font; font binaries are not embedded or distributed.

The offline integration test verifies page identity, OCR method, amount/date/Chinese invoice text and uncertainty metadata. It does not require perfect recognition of every glyph or claim table reconstruction. `no-network.mjs` blocks fetch/HTTP(S) in the MCP child and its OCR worker.
