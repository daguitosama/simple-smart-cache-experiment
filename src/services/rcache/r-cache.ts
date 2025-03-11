import { Redis } from "ioredis";
import { Result } from "true-myth";
import type { Entry } from "./schema.js";

export class RCache {
    private redis: Redis;
    constructor(redis: Redis) {
        this.redis = redis;
    }

    async get<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<Result<T, string>> {
        try {
            const rawEntry = await this.redis.get(key);

            if (!rawEntry) {
                console.log("entry missing");
                const result = await fetcher();
                console.log("fetcher executed ok");
                const entry: Entry<T> = { type: "ok", value: result, ttl, revalidatedAt: Date.now(), revalidationScheduled: false };
                console.log("entry created", JSON.stringify({ revalidatedAt: entry.revalidatedAt, type: entry.type, ttl: entry.ttl }, null, 2));
                this.redis.set(key, JSON.stringify(entry));
                console.log("entry saved to redis");
                return Result.ok(result);
            }
            const entry = JSON.parse(rawEntry) as Entry<T>;

            console.log("entry present");

            if (entry.type == "error") {
                console.log("entry had an error");
                if (!entry.revalidationScheduled) {
                    entry.revalidationScheduled = true;
                    await this.redis.set(key, JSON.stringify(entry));
                    console.log("entry with revalidation mark saved");
                    this.scheduleRevalidation<T>(key, fetcher, ttl);
                    console.log("revalidation scheduled");
                }
                return Result.err(entry.error);
            }

            const now = Date.now();
            const entryExpiration = new Date(entry.revalidatedAt + ttl).getTime();

            console.log("Calculating expiration", { entryExpiration, now });

            if (entryExpiration > now) {
                console.log("entry valid returning");
                return Result.ok(entry.value);
            }

            if (!entry.revalidationScheduled) {
                console.log("entry expired, returning stale and trigger revalidation");
                entry.revalidationScheduled = true;
                await this.redis.set(key, JSON.stringify(entry));
                console.log("entry with revalidation mark saved");
                this.scheduleRevalidation<T>(key, fetcher, ttl);
                console.log("revalidation scheduled");
            }
            return Result.ok(entry.value);
        } catch (error) {
            return Result.err(error instanceof Error ? error.message : "Unknown error");
        }
    }

    private scheduleRevalidation<T>(key: string, fetcher: () => Promise<T>, ttl: number): void {
        console.log(`scheduling revalidation for: ${key} with ttl: ${ttl}`);
        // Schedule revalidation
        setTimeout(
            // revalidate
            async () => {
                try {
                    const result = await fetcher();
                    const entry: Entry<T> = { type: "ok", value: result, ttl, revalidatedAt: Date.now(), revalidationScheduled: false };
                    await this.redis.set(key, JSON.stringify(entry));
                } catch (error) {
                    const entry: Entry<T> = {
                        type: "error",
                        error: error instanceof Error ? error.message : "Unknown error",
                        ttl: 0,
                        revalidatedAt: Date.now(),
                        revalidationScheduled: false,
                    };
                    await this.redis.set(key, JSON.stringify(entry));
                }
            },
            // next tick
            0
        );
    }
}
