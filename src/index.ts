#!/usr/bin/env node
import PACKAGE from '../package.json' with { type: 'json' };
import pc from 'picocolors';
import { Command } from 'commander';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { loadJSON, message, renderTypes, spinner, success, validateDictionary } from './utils.js';

const program = new Command();

// prettier-ignore
program.name('svelte-i18n')
    .description('CLI for @svelte-i18n/core')
    .version(PACKAGE.version);

program.configureHelp({
    styleTitle: (str) => pc.bold(str),
    styleCommandText: (str) => pc.cyan(str),
    styleCommandDescription: (str) => pc.magenta(str),
    styleDescriptionText: (str) => pc.italic(str),
    styleOptionText: (str) => pc.green(str),
    styleArgumentText: (str) => pc.yellow(str),
    styleSubcommandText: (str) => pc.blue(str),
});

const fail = (text: string): never => program.error(pc.red(`✖ ${text}`));

program
    .command('generate-types')
    .description('Generate an I18nDictionary type from a flat JSON dictionary')
    .requiredOption(
        '--input <path-or-url>',
        'JSON dictionary: a file path (src/lib/locales/en.json) or an http(s) URL',
    )
    .option('--output <path>', 'Where to write the type', './i18n-types.d.ts')
    .addHelpText(
        'after',
        `
Examples:
  $ svelte-i18n generate-types --input src/lib/locales/en.json --output src/lib/i18n-types.d.ts
  $ svelte-i18n generate-types --input https://cms.example.com/translations/en.json`,
    )
    .action(async ({ input, output }: { input: string; output: string }) => {
        const stop = spinner(`Loading ${input}`);
        let json: unknown;
        try {
            json = await loadJSON(input);
        } catch (error) {
            stop();
            return fail(message(error));
        }
        stop();

        const result = validateDictionary(json);
        if ('problems' in result) {
            return fail(
                `${input} is not a valid dictionary:\n  - ${result.problems.join('\n  - ')}`,
            );
        }

        const target = resolve(process.cwd(), output);
        try {
            await mkdir(dirname(target), { recursive: true });
            await writeFile(target, renderTypes(Object.keys(result.dictionary)));
        } catch (error) {
            return fail(`Could not write ${output}: ${message(error)}`);
        }

        success(`Wrote ${Object.keys(result.dictionary).length} keys to ${output}`);
    });

await program.parseAsync();
