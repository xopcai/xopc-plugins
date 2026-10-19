# PDF 阅读与 OCR

无需账号。安装时自动从 Store 准备 PDF 渲染引擎、OCR 引擎与中英文模型；文件识别全部在本机完成，不上传文档，不运行 npm/pip。

先用 pdf_read 快速提取文字；扫描件、图片页或错误文字层使用 pdf_ocr。示例：「读取这个扫描 PDF 的第 1～3 页，提取金额和日期并标注页码，不确定的内容请指出。」

单文件最多 20 MiB；普通提取每次最多 50 页，OCR 每次最多 10 页。OCR 默认简体中文与英文，可选择单一语言。结果保留页码、文本来源和引擎置信度；置信度不等于准确率。复杂表格、印章、手写字和低清扫描需要人工核对，不宣称结构化表格或最终版式完全还原。

引擎与模型资源使用 Store 内容寻址下载和摘要校验，基于 Node 22+ WebAssembly，无额外本机编译。本轮在 macOS 验证，其他平台需各自验收。插件不解密文件，不验证电子签名，不修改原 PDF。

XOPC 代码 Apache-2.0。PDFium、Tesseract.js、pngjs 及模型来源和许可随包提供，见 THIRD_PARTY_NOTICES.txt 与 references/sources.md。
