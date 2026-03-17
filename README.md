# @svelte-i18n/cli

CLI tool for [@svelte-i18n/core](https://github.com/svelte-intl/core). Generates a TypeScript type definition file from a flat JSON translation file, giving you full type-safety and autocompletion on your translation keys.

## Installation

```bash
npx @svelte-i18n/cli generate-types --input <path-or-url>
```

Or install globally:

```bash
npm install -g @svelte-i18n/cli
svelte-i18n generate-types --input <path-or-url>
```

## Commands

### `generate-types`

Reads a flat JSON translation file (local or remote) and generates an `I18nDictionary` type containing all the translation keys.

```bash
svelte-i18n generate-types --input <path-or-url> [--output <path>]
```

| Option            | Description                         | Default             |
| ----------------- | ----------------------------------- | ------------------- |
| `--input <path>`  | Path to a local JSON file or a URL  | _(required)_        |
| `--output <path>` | Path for the generated `.d.ts` file | `./i18n-types.d.ts` |

**Examples:**

```bash
# From a local file
svelte-i18n generate-types --input src/locales/en.json

# From a URL (e.g. a dev server endpoint)
svelte-i18n generate-types --input https://example.com/api/locales/en --output src/i18n-types.d.ts
```

**Example output** (`i18n-types.d.ts`):

```ts
export type I18nDictionary = {
    Dashboard: string;
    'Welcome, {firstName} {lastName}!': string;
    // ...
};
```
