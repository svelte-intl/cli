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
    return (await import(path, { with: { type: 'json' } })).default;
}

export async function fetchJSON(url: string): Promise<any> {
    const result = await fetch(url);
    return await result.json();
}
