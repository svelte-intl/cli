#!/usr/bin/env node
import PACKAGE from '../package.json' with { type: 'json' };
import pc from 'picocolors';
import { Command } from 'commander';
import { importJSON, fetchJSON, isURL, t, error, success, spinner } from './utils.js';
import { z } from 'zod';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export const program = new Command();
export const schema = z.record(z.string(), z.string());

// prettier-ignore
program.name('svelte-i18n')
    .description('CLI tool for svelte-i18n')
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

program
    .command('generate-types')
    .description('Generate TypeScript types for translations')
    .option(
        '--input <path>',
        'Path to the translations file (e.g., src/locales/en.json) or a URL (e.g., https://example.com/locales/en.json)',
    )
    .option(
        '--output <path>',
        'Path to the output file (e.g., src/locales/en.d.ts)',
        './i18n-types.d.ts',
    )
    .action(async ({ input, output }) => {
        if (!input) {
            return error(
                '--input option is required. Please provide a path to the translations file or a URL.',
            );
        }

        const stopSpinner = spinner('Loading and validating JSON...');
        const [json, err] = await t(() => (isURL(input) ? fetchJSON(input) : importJSON(input)));

        if (err) {
            return error(
                `Failed to load JSON from ${input}: ${err instanceof Error ? err.message : String(err)}`,
            );
        }

        const [validatedJson, validationErr] = await t(() => schema.parse(json));

        if (validationErr || !validatedJson) {
            return error(
                `Failed to validate JSON from ${input}: ${validationErr instanceof Error ? validationErr.message : String(validationErr)}`,
            );
        }

        const keys = Object.keys(validatedJson);
        const typeName = 'I18nDictionary';

        const typeDefinition = `export type ${typeName} = {\n${keys
            .map((key) => `    '${key.replace(/'/g, "\\'")}': string;`)
            .join('\n')}\n};\n`;

        await mkdir(dirname(output), { recursive: true });

        writeFile(output, typeDefinition)
            .then(() => success('Type definitions generated successfully in ' + output))
            .catch((err) =>
                error(
                    `Failed to write type definitions: ${err instanceof Error ? err.message : String(err)}`,
                ),
            )
            .finally(() => stopSpinner());
    });

program.parse();
