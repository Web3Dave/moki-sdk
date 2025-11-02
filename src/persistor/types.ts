export interface Persistor<T extends Record<string, any> = any> {
    get<K extends keyof T>(key: K): T[K] | undefined
    set<K extends keyof T>(key: K, value: T[K]): void
    has<K extends keyof T>(key: K): boolean
    delete<K extends keyof T>(key: K): void
    clear(): void
}