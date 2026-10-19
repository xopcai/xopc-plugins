# Sources and implementation boundary

- Provider/format reference: https://github.com/unjs/unpdf
- PDF renderer: https://github.com/hyzyla/pdfium (3.0.0), PDFium engine license retained in pdfium-license.txt.
- OCR: https://github.com/naptha/tesseract.js (7.0.0), Apache-2.0.
- Models: https://github.com/naptha/tessdata via pinned @tesseract.js-data/eng and chi_sim 1.0.0 packages, 4.0.0_best_int; upstream Tesseract model license retained in tessdata-license.txt.
- PNG encoding: https://github.com/pngjs/pngjs (7.0.0), MIT.
- Resource identity and hashes: runtime/office/ocr-resources.json in the source repository. Only Store URLs are present in the distributed preparation manifest.
- Codex ecosystem reference: https://github.com/openai/plugins
- Claude ecosystem reference: https://github.com/anthropics/claude-plugins-official

Workflows and runtime adapters were authored for XOPC; no ChatGPT-only app binding or third-party private backend was copied. References do not imply vendor endorsement. Check README for supported operations and authorization requirements.
