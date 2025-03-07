export interface BaseEntry<T> {
    ttl: number;
    revalidatedAt: number;
    revalidationScheduled: boolean;
}
export interface EntryOk<T> extends BaseEntry<T> {
    type: "ok";
    value: T;
}
export interface EntryError<T> extends BaseEntry<T> {
    type: "error";
    error: string;
}

export type Entry<T> = EntryOk<T> | EntryError<T>;
