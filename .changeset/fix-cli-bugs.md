---
"@svelte-i18n/cli": minor
---

Fix `generate-types` bugs and improve error messages.

**Generated output**
- Keys are now escaped with `JSON.stringify`. Before, keys containing a backslash or a line break produced invalid TypeScript.
- Keys are sorted, so the output is stable. The output format matches `@svelte-i18n/core/vite`.

**Input handling**
- Only `http://` and `https://` inputs are fetched. Windows paths like `C:\project\en.json` were treated as URLs.
- Failed HTTP responses (404, 500) are now reported with their status. Before, the error page was parsed as JSON.

**Error messages**
- Validation errors name each offending key and explain that dictionaries must be flat, instead of printing a raw schema error.
- Invalid JSON and unreadable files are reported with the file name.

**Reliability**
- The output file is fully written before the command exits.
- Errors exit with code 1.
- The spinner is only shown in an interactive terminal, so CI logs stay clean.

**Packaging**
- Removed the `zod` dependency.
- Fixed a circular import between modules.
- Added `--help` examples, tests (`pnpm test`), keywords and a homepage.
