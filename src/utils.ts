import pc from 'picocolors';
import { program } from './index.js';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

export type MaybePromise<T> = T | Promise<T>;

export function t<T>(fn: () => T): MaybePromise<[T, null] | [null, unknown]> {
    try {
        const result = fn();
        return result instanceof Promise
            ? result
                  .then((res): [T, null] => [res, null])
                  .catch((err): [null, unknown] => [null, err])
            : [result, null];
    } catch (error) {
        return [null, error];
    }
}

export function isURL(str: string): boolean {
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
}

export async function importJSON(path: string): Promise<any> {
    const abs = resolve(process.cwd(), path);
    return JSON.parse(await readFile(abs, 'utf-8'));
}

export async function fetchJSON(url: string): Promise<any> {
    const res = await fetch(url);
    return res.json();
}

export const error = (message: string) => {
    return program.error(pc.red(`❌ Error: ${message}`));
};

export const success = (message: string) => {
    console.log(pc.bold(pc.green(`✅ Success: ${message}`)));
};

export const spinner = (message: string) => {
    const frames = ['⣾', '⣷', '⣯', '⣟', '⣻', '⣽', '⣾'];
    let i = 0;
    const interval = setInterval(() => {
        process.stdout.write(`\r${pc.greenBright(frames[i])} ${pc.cyan(message)}`);
        i = (i + 1) % frames.length;
    }, 100);
    return () => {
        clearInterval(interval);
        process.stdout.write('\r');
    };
};
