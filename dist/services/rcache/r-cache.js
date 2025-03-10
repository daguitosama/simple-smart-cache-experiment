import { Redis } from "ioredis";
import { Result } from "true-myth";
export class RCache {
    redis;
    constructor(redis) {
        this.redis = redis;
    }
    async get(key, fetcher, ttl) {
        try {
            const rawEntry = await this.redis.get(key);
            console.log("rawEntry received");
            if (!rawEntry) {
                console.log("rawEntry missing");
                const result = await fetcher();
                console.log("fetcher executed ok");
                const entry = { type: "ok", value: result, ttl, revalidatedAt: Date.now(), revalidationScheduled: false };
                console.log("entry created", JSON.stringify({ revalidatedAt: entry.revalidatedAt, type: entry.type, ttl: entry.ttl }, null, 2));
                this.redis.set(key, JSON.stringify(entry));
                console.log("entry saved to redis");
                return Result.ok(result);
            }
            const entry = JSON.parse(rawEntry);
            if (entry.type == "error") {
                console.log("entry had an error");
                return Result.err(entry.error);
            }
            const now = Date.now();
            const entryExpiration = new Date(entry.revalidatedAt + entry.ttl).getTime();
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
                this.scheduleRevalidation(key, fetcher, ttl);
                console.log("revalidation scheduled");
            }
            return Result.ok(entry.value);
        }
        catch (error) {
            return Result.err(error instanceof Error ? error.message : "Unknown error");
        }
    }
    scheduleRevalidation(key, fetcher, ttl) {
        console.log(`scheduling revalidation for: ${key} with ttl: ${ttl}`);
        // Schedule revalidation
        setTimeout(
        // revalidate
        async () => {
            try {
                const result = await fetcher();
                const entry = { type: "ok", value: result, ttl, revalidatedAt: Date.now(), revalidationScheduled: false };
                await this.redis.set(key, JSON.stringify(entry));
            }
            catch (error) {
                const entry = {
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
        1);
    }
}
