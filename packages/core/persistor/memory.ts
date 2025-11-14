import { Persistor } from "./types"

/**
 * Creates an in-memory persistor.
 */
export function createMemoryPersistor<
    T extends Record<string, any> = any
>(): Persistor<T> {
    const cache = new Map<string, any>()

    return {
        get<K extends keyof T>(key: K): T[K] | undefined {
            return cache.get(String(key))
        },
        set<K extends keyof T>(key: K, value: T[K]): void {
            cache.set(String(key), value)
        },
        has<K extends keyof T>(key: K): boolean {
            return cache.has(String(key))
        },
        delete<K extends keyof T>(key: K): void {
            cache.delete(String(key))
        },
        clear(): void {
            cache.clear()
        },
    }
}