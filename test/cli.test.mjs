// Run with `pnpm test` (builds first). Spawns the built CLI like a user would.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { isURL } from '../dist/utils.js';

const CLI = new URL('../dist/index.js', import.meta.url).pathname;
let dir;
let server;
let base;

/** Async on purpose: the test's HTTP server must keep serving while the CLI runs. */
const run = (...args) =>
    new Promise((resolve) => {
        const child = spawn(process.execPath, [CLI, ...args], { cwd: dir });
        let out = '';
        child.stdout.on('data', (d) => (out += d));
        child.stderr.on('data', (d) => (out += d));
        child.on('close', (code) => resolve({ code, out }));
    });

/** Returns TypeScript syntax errors for a generated file (empty when valid). */
const syntaxErrors = (source) =>
    ts.transpileModule(source, { reportDiagnostics: true, fileName: 'x.ts' }).diagnostics ?? [];

before(async () => {
    dir = mkdtempSync(join(tmpdir(), 'svelte-i18n-cli-'));
    server = createServer((req, res) => {
        if (req.url === '/en.json') {
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ 'From the API': 'From the API' }));
        } else {
            res.statusCode = 404;
            res.end('Not found');
        }
    });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
    server.close();
    rmSync(dir, { recursive: true, force: true });
});

test('escapes keys so the output is valid TypeScript', async () => {
    const keys = {
        'a\\b': 'x',
        'line\nbreak': 'y',
        "it's": 'z',
        'Hello, {name}!': 'w',
        '"quoted"': 'q',
    };
    writeFileSync(join(dir, 'tricky.json'), JSON.stringify(keys));

    const { code } = await run(
        'generate-types',
        '--input',
        'tricky.json',
        '--output',
        'tricky.d.ts',
    );
    assert.equal(code, 0);

    const output = readFileSync(join(dir, 'tricky.d.ts'), 'utf-8');
    assert.deepEqual(syntaxErrors(output), []);
    for (const key of Object.keys(keys)) assert.ok(output.includes(JSON.stringify(key)), key);
});

test('writes the file before exiting and prints no spinner characters when not a TTY', async () => {
    writeFileSync(join(dir, 'en.json'), JSON.stringify({ Hello: 'Hello' }));
    const { code, out } = await run(
        'generate-types',
        '--input',
        'en.json',
        '--output',
        'out/types.d.ts',
    );

    assert.equal(code, 0);
    assert.ok(existsSync(join(dir, 'out/types.d.ts')));
    assert.ok(!out.includes('\r'), JSON.stringify(out));
    assert.ok(!/[⣾⣷⣯⣟⣻⣽]/.test(out), JSON.stringify(out));
});

test('loads a dictionary from a URL', async () => {
    const { code } = await run(
        'generate-types',
        '--input',
        `${base}/en.json`,
        '--output',
        'remote.d.ts',
    );
    assert.equal(code, 0);
    assert.ok(readFileSync(join(dir, 'remote.d.ts'), 'utf-8').includes('"From the API"'));
});

test('fails with the HTTP status when a URL returns an error', async () => {
    const { code, out } = await run(
        'generate-types',
        '--input',
        `${base}/missing.json`,
        '--output',
        'x.d.ts',
    );
    assert.notEqual(code, 0);
    assert.match(out, /404/);
});

test('explains that nested objects are not supported', async () => {
    writeFileSync(join(dir, 'nested.json'), JSON.stringify({ nav: { home: 'Home' }, ok: 'ok' }));
    const { code, out } = await run('generate-types', '--input', 'nested.json');
    assert.notEqual(code, 0);
    assert.match(out, /"nav"/);
    assert.match(out, /flat/i);
});

test('reports invalid JSON with the file name', async () => {
    writeFileSync(join(dir, 'broken.json'), '{ "a": "b", }');
    const { code, out } = await run('generate-types', '--input', 'broken.json');
    assert.notEqual(code, 0);
    assert.match(out, /broken\.json/);
});

test('requires --input', async () => {
    const { code, out } = await run('generate-types');
    assert.notEqual(code, 0);
    assert.match(out, /--input/);
});

test('treats Windows paths as files, not URLs', async () => {
    assert.equal(isURL('C:\\project\\en.json'), false);
    assert.equal(isURL('c:/project/en.json'), false);
    assert.equal(isURL('https://example.com/en.json'), true);
    assert.equal(isURL('http://localhost:5173/en.json'), true);
    assert.equal(isURL('file:///tmp/en.json'), false);
});
