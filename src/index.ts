#!/usr/bin/env node
import { Option, Command } from 'commander';
import PACKAGE from '../package.json' with { type: 'json' };
import { importJSON, fetchJSON, isURL, t } from './utils.js';
import { z } from 'zod';
import { writeFile, mkdir } from 'node:fs/promises';
import { parse, dirname } from 'node:path';

const program = new Command();
const schema = z.record(z.string(), z.string());

// prettier-ignore
program.name('svelte-i18n')
    .description('CLI tool for svelte-i18n')
    .version(PACKAGE.version);

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
        const [json, error] = await t(() => (isURL(input) ? fetchJSON(input) : importJSON(input)));

        if (error) {
            return program.error(
                `Failed to load JSON from ${input}: ${error instanceof Error ? error.message : String(error)}`,
            );
        }

        const [validatedJson, validationError] = await t(() => schema.parse(json));

        if (validationError || !validatedJson) {
            return program.error(
                `Failed to validate JSON from ${input}: ${validationError instanceof Error ? validationError.message : String(validationError)}`,
            );
        }

        const keys = Object.keys(validatedJson);
        const typeName = 'I18nDictionary';

        const typeDefinition = `export type ${typeName} = {\n${keys
            .map((key) => `    '${key.replace(/'/g, "\\'")}': string;`)
            .join('\n')}\n};\n`;

        await mkdir(dirname(output), { recursive: true });

        writeFile(output, typeDefinition, {})
            .then(() => console.log('Type definitions generated successfully in i18n-types.d.ts'))
            .catch((err) =>
                program.error(
                    `Failed to write type definitions: ${err instanceof Error ? err.message : String(err)}`,
                ),
            );
    });

program.parse();
